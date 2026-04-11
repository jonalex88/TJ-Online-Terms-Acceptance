const HUBSPOT_BASE_URL = "https://api.hubapi.com";
const DEAL_PROPS = ["dealname", "dealstage"].join(",");
const COMPANY_PROPS = [
  "name",
  "business_name",
  "legal_name",
  "registered_company_name",
  "trading_name",
  "trading_name__c",
  "trading_as",
  "tradingas",
  "registration_number",
  "company_registration_no",
  "registration_no",
  "company_registration_number",
  "registrationnumber",
  "vat_number",
  "vat_no",
  "vat_registration_number",
  "vatnumber",
  "industry",
  "sic_code",
  "address",
  "address2",
  "street_address",
  "address_line_1",
  "address_line_2",
  "street",
  "suburb",
  "district",
  "county",
  "building_name",
  "buildingnumber",
  "building_number",
  "street_number",
  "unit_number",
  "city",
  "state",
  "province",
  "state_province",
  "region",
  "zip",
  "postal_code",
  "postcode",
  "zipcode",
  "country",
  "country_code",
].join(",");
const CONTACT_PROPS = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "mobilephone",
  "jobtitle",
].join(",");

const MAX_JSON_BODY_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const rateLimiterStore = new Map();

function writeJson(res, statusCode, body) {
  res.status(statusCode);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  res.send(JSON.stringify(body));
}

function prop(obj, key) {
  return obj?.properties?.[key] ?? "";
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function mapCompanyFromHubSpotObject(hsCompany) {
  const buildingName = firstNonEmpty(prop(hsCompany, "building_name"));
  const buildingNumber = firstNonEmpty(
    prop(hsCompany, "building_number"),
    prop(hsCompany, "buildingnumber")
  );
  const streetNumber = firstNonEmpty(
    prop(hsCompany, "street_number"),
    prop(hsCompany, "unit_number")
  );

  const rawAddress = [
    prop(hsCompany, "address"),
    prop(hsCompany, "address2"),
    prop(hsCompany, "street_address"),
    prop(hsCompany, "address_line_1"),
    prop(hsCompany, "address_line_2"),
    prop(hsCompany, "street"),
  ]
    .filter(Boolean)
    .join(", ");

  const industry = firstNonEmpty(prop(hsCompany, "industry"), prop(hsCompany, "sic_code"));
  const city = firstNonEmpty(prop(hsCompany, "city"));
  const suburb = firstNonEmpty(
    prop(hsCompany, "suburb"),
    prop(hsCompany, "district"),
    prop(hsCompany, "county")
  );
  const province = firstNonEmpty(
    prop(hsCompany, "state"),
    prop(hsCompany, "province"),
    prop(hsCompany, "state_province"),
    prop(hsCompany, "region")
  );
  const postalCode = firstNonEmpty(
    prop(hsCompany, "zip"),
    prop(hsCompany, "postal_code"),
    prop(hsCompany, "postcode"),
    prop(hsCompany, "zipcode")
  );
  const country = firstNonEmpty(prop(hsCompany, "country"), prop(hsCompany, "country_code"));

  const tradingName = firstNonEmpty(
    prop(hsCompany, "trading_name"),
    prop(hsCompany, "trading_name__c"),
    prop(hsCompany, "trading_as"),
    prop(hsCompany, "tradingas"),
    prop(hsCompany, "name")
  );

  const registeredCompanyName = firstNonEmpty(
    prop(hsCompany, "name"),
    prop(hsCompany, "business_name"),
    prop(hsCompany, "legal_name"),
    prop(hsCompany, "registered_company_name")
  );

  const registrationNumber = firstNonEmpty(
    prop(hsCompany, "registration_number"),
    prop(hsCompany, "company_registration_no"),
    prop(hsCompany, "registration_no"),
    prop(hsCompany, "company_registration_number"),
    prop(hsCompany, "registrationnumber")
  );

  const vatNumber = firstNonEmpty(
    prop(hsCompany, "vat_number"),
    prop(hsCompany, "vat_no"),
    prop(hsCompany, "vat_registration_number"),
    prop(hsCompany, "vatnumber")
  );

  return {
    registeredCompanyName,
    tradingName,
    registrationNumber,
    vatNumber,
    industry,
    buildingName,
    buildingNumber,
    streetNumber,
    streetAddress: rawAddress,
    suburb,
    city,
    province,
    postalCode,
    country,
  };
}

function getHubSpotToken() {
  return process.env.HUBSPOT_ACCESS_TOKEN || process.env.VITE_HUBSPOT_ACCESS_TOKEN || "";
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (value) return value.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(req, routeKey) {
  const now = Date.now();
  const key = `${routeKey}:${getClientIp(req)}`;
  const existing = rateLimiterStore.get(key);

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimiterStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  existing.count += 1;
  rateLimiterStore.set(key, existing);
  return existing.count > RATE_LIMIT_MAX_REQUESTS;
}

function isJsonRequest(req) {
  const ct = req.headers["content-type"];
  const value = Array.isArray(ct) ? ct[0] : ct;
  return Boolean(value && value.toLowerCase().includes("application/json"));
}

async function readRawBody(req, maxBytes = MAX_JSON_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let data = "";
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error(`Request body too large (max ${maxBytes} bytes).`));
        return;
      }
      data += chunk.toString();
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function readJsonBody(req) {
  if (typeof req.body === "object" && req.body !== null) {
    return req.body;
  }
  const raw = await readRawBody(req);
  return JSON.parse(raw || "{}");
}

async function hsGet(pathName, token) {
  const response = await fetch(`${HUBSPOT_BASE_URL}${pathName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HubSpot API ${response.status}: ${body}`);
  }

  return response.json();
}

async function hsPatch(pathName, token, body) {
  const response = await fetch(`${HUBSPOT_BASE_URL}${pathName}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const b = await response.text();
    throw new Error(`HubSpot API ${response.status}: ${b}`);
  }
  return response.json();
}

async function hsPost(pathName, token, body) {
  const response = await fetch(`${HUBSPOT_BASE_URL}${pathName}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const b = await response.text();
    throw new Error(`HubSpot API ${response.status}: ${b}`);
  }
  return response.json();
}

async function hsPut(pathName, token) {
  const response = await fetch(`${HUBSPOT_BASE_URL}${pathName}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const b = await response.text();
    throw new Error(`HubSpot API ${response.status}: ${b}`);
  }
}

async function fetchDealDataServer(dealId, token) {
  const deal = await hsGet(`/crm/v3/objects/deals/${dealId}?properties=${DEAL_PROPS}`, token);
  const companyAssoc = await hsGet(`/crm/v3/objects/deals/${dealId}/associations/companies`, token);

  let company = {};
  let contacts = [];
  let hubspotCompanyId = "";

  if (companyAssoc.results.length > 0) {
    hubspotCompanyId = companyAssoc.results[0].id;
    const hsCompany = await hsGet(
      `/crm/v3/objects/companies/${hubspotCompanyId}?properties=${COMPANY_PROPS}`,
      token
    );
    company = mapCompanyFromHubSpotObject(hsCompany);

    const contactAssoc = await hsGet(
      `/crm/v3/objects/companies/${hubspotCompanyId}/associations/contacts`,
      token
    );

    contacts = await Promise.all(
      contactAssoc.results.slice(0, 5).map(async ({ id }, index) => {
        const contact = await hsGet(`/crm/v3/objects/contacts/${id}?properties=${CONTACT_PROPS}`, token);
        return {
          id,
          hubspotId: id,
          firstName: prop(contact, "firstname"),
          lastName: prop(contact, "lastname"),
          email: prop(contact, "email"),
          phone: prop(contact, "phone") || prop(contact, "mobilephone"),
          designation: prop(contact, "jobtitle"),
          receiveInvoices: index === 0,
          allowMarketing: false,
        };
      })
    );
  }

  const store = {
    tradingSiteName: prop(deal, "dealname"),
    brand: "",
    posProvider: "",
    buildingName: "",
    buildingNumber: "",
    streetNumber: "",
    streetAddress: typeof company === "object" && company && "streetAddress" in company ? company.streetAddress : "",
    suburb: "",
    city: typeof company === "object" && company && "city" in company ? company.city : "",
    province: typeof company === "object" && company && "province" in company ? company.province : "",
    country: typeof company === "object" && company && "country" in company ? company.country : "",
    postalCode: typeof company === "object" && company && "postalCode" in company ? company.postalCode : "",
    counterDevices: 0,
    mobileDevices: 0,
    acquiringBank: "",
    acquiringBankMid: "",
  };

  return { store, company, contacts, hubspotCompanyId };
}

async function fetchCompanyDataServer(companyId, token) {
  const hsCompany = await hsGet(
    `/crm/v3/objects/companies/${companyId}?properties=${COMPANY_PROPS}`,
    token
  );
  return {
    company: mapCompanyFromHubSpotObject(hsCompany),
    hubspotCompanyId: companyId,
  };
}

async function submitOnboardingServer(dealId, body, token) {
  const updated = [];
  const created = [];
  const errors = [];

  for (const company of body.companies) {
    let companyHsId = company.hubspotId ?? "";

    const companyProps = {
      name: company.registeredCompanyName,
      trading_name: company.tradingName,
      registration_number: company.registrationNumber,
      vat_number: company.vatNumber ?? "",
      industry: company.industry,
      address: [company.streetNumber, company.streetAddress].filter(Boolean).join(" "),
      city: company.city,
      state: company.province,
      zip: company.postalCode,
      country: company.country,
    };

    if (companyHsId) {
      try {
        await hsPatch(`/crm/v3/objects/companies/${companyHsId}`, token, { properties: companyProps });
        updated.push(`Company: ${company.registeredCompanyName}`);
      } catch (e) {
        errors.push(`Update company \"${company.registeredCompanyName}\": ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      try {
        const createdCompany = await hsPost(`/crm/v3/objects/companies`, token, { properties: companyProps });
        companyHsId = createdCompany.id;
        await hsPut(`/crm/v3/objects/deals/${dealId}/associations/companies/${companyHsId}/deal_to_company`, token);
        created.push(`Company: ${company.registeredCompanyName}`);
      } catch (e) {
        errors.push(`Create company \"${company.registeredCompanyName}\": ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
    }

    for (const contact of company.contacts) {
      const contactHsId = contact.hubspotId ?? (/^\d+$/.test(contact.id) ? contact.id : "");
      const contactProps = {
        firstname: contact.firstName,
        lastname: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        jobtitle: contact.designation,
      };

      if (contactHsId) {
        try {
          await hsPatch(`/crm/v3/objects/contacts/${contactHsId}`, token, { properties: contactProps });
          updated.push(`Contact: ${contact.firstName} ${contact.lastName}`);
        } catch (e) {
          errors.push(`Update contact \"${contact.firstName} ${contact.lastName}\": ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        try {
          const createdContact = await hsPost(`/crm/v3/objects/contacts`, token, { properties: contactProps });
          const newContactId = createdContact.id;
          if (companyHsId) {
            await hsPut(`/crm/v3/objects/contacts/${newContactId}/associations/companies/${companyHsId}/contact_to_company`, token);
          }
          created.push(`Contact: ${contact.firstName} ${contact.lastName}`);
        } catch (e) {
          errors.push(`Create contact \"${contact.firstName} ${contact.lastName}\": ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
  }

  return { updated, created, errors };
}

function sanitizeFileName(fileName) {
  const trimmed = String(fileName || "").trim();
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.length > 0 ? safe.slice(0, 120) : `signed-agreement-${Date.now()}.pdf`;
}

async function attachSignedPdfServer(dealId, body, token) {
  if (!body.pdfBase64 || !body.fileName || !body.signerName || !body.signerEmail) {
    return { status: 400, body: { error: "Missing required PDF payload." } };
  }

  if ((body.signerName || "").length > 140 || (body.signerTitle || "").length > 140 || (body.signerEmail || "").length > 180) {
    return { status: 400, body: { error: "Signer details are invalid." } };
  }

  const filename = String(body.fileName).toLowerCase().endsWith(".pdf") ? body.fileName : `${body.fileName}.pdf`;
  const safeFileName = sanitizeFileName(filename);
  const pdfBuffer = Buffer.from(body.pdfBase64, "base64");

  if (!pdfBuffer || pdfBuffer.length === 0) {
    return { status: 400, body: { error: "Invalid PDF content." } };
  }
  if (pdfBuffer.length > MAX_PDF_BYTES) {
    return { status: 400, body: { error: "PDF too large." } };
  }

  const formData = new FormData();
  formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), safeFileName);
  formData.append(
    "options",
    JSON.stringify({
      access: "PRIVATE",
      overwrite: false,
      duplicateValidationStrategy: "NONE",
      duplicateValidationScope: "ENTIRE_PORTAL",
    })
  );
  formData.append("folderPath", "/signed-agreements");

  const uploadRes = await fetch(`${HUBSPOT_BASE_URL}/files/v3/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    const uploadError = await uploadRes.text();
    throw new Error(`Failed to upload PDF to HubSpot files: ${uploadError}`);
  }

  const uploadBody = await uploadRes.json();
  const fileId = uploadBody.id;
  const fileUrl = uploadBody.url ?? uploadBody.defaultHostingUrl ?? "";
  const warnings = [];

  const noteHtml = [
    `<p><strong>TJ signed agreement attached.</strong></p>`,
    `<p>Signer: ${body.signerName || "Unknown"}</p>`,
    `<p>Title: ${body.signerTitle || "Unknown"}</p>`,
    `<p>Email: ${body.signerEmail || "Unknown"}</p>`,
    `<p>Accepted at: ${body.acceptedAt || new Date().toISOString()}</p>`,
  ].join("");

  await hsPost(`/engagements/v1/engagements`, token, {
    engagement: {
      active: true,
      type: "NOTE",
      timestamp: Date.now(),
    },
    associations: {
      contactIds: [],
      companyIds: [],
      dealIds: [Number(dealId)],
    },
    attachments: [{ id: Number(fileId) }],
    metadata: {
      body: noteHtml,
    },
  });

  let signedAgreementValue = "";
  try {
    const dealBefore = await hsGet(`/crm/v3/objects/deals/${dealId}?properties=signed_agreement`, token);
    const previousValue = prop(dealBefore, "signed_agreement").trim();

    const candidates = [];
    if (previousValue) {
      const existingParts = previousValue
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean);
      if (!existingParts.includes(fileId)) {
        candidates.push([...existingParts, fileId].join(";"));
      }
    }
    candidates.push(fileId);
    if (fileUrl) candidates.push(fileUrl);

    for (const candidate of candidates) {
      try {
        await hsPatch(`/crm/v3/objects/deals/${dealId}`, token, {
          properties: {
            signed_agreement: candidate,
          },
        });

        const dealAfter = await hsGet(`/crm/v3/objects/deals/${dealId}?properties=signed_agreement`, token);
        const updatedValue = prop(dealAfter, "signed_agreement").trim();
        const containsNewFileId = updatedValue
          .split(";")
          .map((part) => part.trim())
          .includes(fileId);

        if (updatedValue === candidate || containsNewFileId) {
          signedAgreementValue = updatedValue;
          break;
        }
      } catch (error) {
        warnings.push(`signed_agreement update attempt failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!signedAgreementValue) {
      warnings.push("Uploaded and attached the file to deal timeline, but could not confirm signed_agreement property update.");
    }
  } catch (error) {
    warnings.push(`Unable to update or verify signed_agreement property: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { status: 200, body: { fileId, fileUrl, signedAgreementValue, warnings } };
}

function getDealIdFromQuery(req) {
  const raw = req.query?.dealId;
  if (Array.isArray(raw)) return raw[0] || "";
  return String(raw || "");
}

function getCompanyIdFromQuery(req) {
  const raw = req.query?.companyId;
  if (Array.isArray(raw)) return raw[0] || "";
  return String(raw || "");
}

export {
  writeJson,
  getHubSpotToken,
  isRateLimited,
  isJsonRequest,
  readJsonBody,
  fetchDealDataServer,
  fetchCompanyDataServer,
  submitOnboardingServer,
  attachSignedPdfServer,
  getDealIdFromQuery,
  getCompanyIdFromQuery,
};
