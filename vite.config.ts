import { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const HUBSPOT_BASE_URL = "https://api.hubapi.com";
const DEAL_PROPS = ["dealname", "dealstage"].join(",");
const COMPANY_PROPS = [
  "name",
  "trading_name",
  "registration_number",
  "vat_number",
  "industry",
  "address",
  "address2",
  "city",
  "state",
  "zip",
  "country",
].join(",");
const CONTACT_PROPS = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "mobilephone",
  "jobtitle",
].join(",");

interface HsObject {
  id: string;
  properties: Record<string, string | null>;
}

interface HsAssociationResult {
  results: Array<{ id: string; type: string }>;
}

function writeJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function prop(obj: HsObject, key: string): string {
  return obj.properties[key] ?? "";
}

async function hsGet<T>(pathName: string, token: string): Promise<T> {
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

  return response.json() as Promise<T>;
}

async function hsPatch<T>(pathName: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(`${HUBSPOT_BASE_URL}${pathName}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const b = await response.text();
    throw new Error(`HubSpot API ${response.status}: ${b}`);
  }
  return response.json() as Promise<T>;
}

async function hsPost<T>(pathName: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(`${HUBSPOT_BASE_URL}${pathName}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const b = await response.text();
    throw new Error(`HubSpot API ${response.status}: ${b}`);
  }
  return response.json() as Promise<T>;
}

async function hsPut(pathName: string, token: string): Promise<void> {
  const response = await fetch(`${HUBSPOT_BASE_URL}${pathName}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const b = await response.text();
    throw new Error(`HubSpot API ${response.status}: ${b}`);
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

interface SubmitContact {
  id: string;
  hubspotId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
}

interface SubmitCompany {
  id: string;
  hubspotId?: string;
  registeredCompanyName: string;
  tradingName: string;
  registrationNumber: string;
  vatNumber?: string;
  industry: string;
  streetNumber?: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  contacts: SubmitContact[];
}

interface SubmitBody {
  companies: SubmitCompany[];
  hubspotDealId: string;
}

interface AttachPdfBody {
  pdfBase64: string;
  fileName: string;
  signerName: string;
  signerTitle: string;
  signerEmail: string;
  acceptedAt: string;
}

async function submitOnboardingServer(
  dealId: string,
  body: SubmitBody,
  token: string
): Promise<{ updated: string[]; created: string[]; errors: string[] }> {
  const updated: string[] = [];
  const created: string[] = [];
  const errors: string[] = [];

  for (const company of body.companies) {
    let companyHsId = company.hubspotId ?? "";

    const companyProps: Record<string, string> = {
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
        errors.push(`Update company "${company.registeredCompanyName}": ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      try {
        const created_company = await hsPost<HsObject>(`/crm/v3/objects/companies`, token, { properties: companyProps });
        companyHsId = created_company.id;
        await hsPut(`/crm/v3/objects/deals/${dealId}/associations/companies/${companyHsId}/deal_to_company`, token);
        created.push(`Company: ${company.registeredCompanyName}`);
      } catch (e) {
        errors.push(`Create company "${company.registeredCompanyName}": ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
    }

    for (const contact of company.contacts) {
      const contactHsId = contact.hubspotId ?? (/^\d+$/.test(contact.id) ? contact.id : "");

      const contactProps: Record<string, string> = {
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
          errors.push(`Update contact "${contact.firstName} ${contact.lastName}": ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        try {
          const created_contact = await hsPost<HsObject>(`/crm/v3/objects/contacts`, token, { properties: contactProps });
          const newContactId = created_contact.id;
          if (companyHsId) {
            await hsPut(
              `/crm/v3/objects/contacts/${newContactId}/associations/companies/${companyHsId}/contact_to_company`,
              token
            );
          }
          created.push(`Contact: ${contact.firstName} ${contact.lastName}`);
        } catch (e) {
          errors.push(`Create contact "${contact.firstName} ${contact.lastName}": ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
  }

  return { updated, created, errors };
}

async function fetchDealDataServer(dealId: string, token: string) {
  const deal = await hsGet<HsObject>(
    `/crm/v3/objects/deals/${dealId}?properties=${DEAL_PROPS}`,
    token
  );

  const companyAssoc = await hsGet<HsAssociationResult>(
    `/crm/v3/objects/deals/${dealId}/associations/companies`,
    token
  );

  let company = {};
  let contacts = [];
  let hubspotCompanyId = "";

  if (companyAssoc.results.length > 0) {
    hubspotCompanyId = companyAssoc.results[0].id;
    const hsCompany = await hsGet<HsObject>(
      `/crm/v3/objects/companies/${hubspotCompanyId}?properties=${COMPANY_PROPS}`,
      token
    );

    const rawAddress = [prop(hsCompany, "address"), prop(hsCompany, "address2")]
      .filter(Boolean)
      .join(", ");

    company = {
      registeredCompanyName: prop(hsCompany, "name"),
      tradingName: prop(hsCompany, "trading_name") || prop(hsCompany, "name"),
      registrationNumber: prop(hsCompany, "registration_number"),
      vatNumber: prop(hsCompany, "vat_number"),
      industry: prop(hsCompany, "industry"),
      buildingName: "",
      buildingNumber: "",
      streetNumber: "",
      streetAddress: rawAddress,
      suburb: "",
      city: prop(hsCompany, "city"),
      province: prop(hsCompany, "state"),
      postalCode: prop(hsCompany, "zip"),
      country: prop(hsCompany, "country"),
    };

    const contactAssoc = await hsGet<HsAssociationResult>(
      `/crm/v3/objects/companies/${hubspotCompanyId}/associations/contacts`,
      token
    );

    contacts = await Promise.all(
      contactAssoc.results.slice(0, 5).map(async ({ id }, index) => {
        const contact = await hsGet<HsObject>(
          `/crm/v3/objects/contacts/${id}?properties=${CONTACT_PROPS}`,
          token
        );

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

function hubspotProxyPlugin(mode: string): PluginOption {
  const env = loadEnv(mode, process.cwd(), "");
  const token = env.HUBSPOT_ACCESS_TOKEN || env.VITE_HUBSPOT_ACCESS_TOKEN || "";

  return {
    name: "hubspot-proxy",
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const requestUrl = req.url ? new URL(req.url, "http://localhost") : null;
        const getMatch = requestUrl?.pathname.match(/^\/api\/hubspot\/deals\/(\d+)$/);
        const submitMatch = requestUrl?.pathname.match(/^\/api\/hubspot\/deals\/(\d+)\/submit$/);
        const attachMatch = requestUrl?.pathname.match(/^\/api\/hubspot\/deals\/(\d+)\/attach-pdf$/);

        if (!getMatch && !submitMatch && !attachMatch) {
          return next();
        }

        if (!token) {
          writeJson(res, 500, { error: "HubSpot access token is not configured on the server." });
          return;
        }

        // GET /api/hubspot/deals/:dealId
        if (getMatch) {
          if (req.method !== "GET") {
            writeJson(res, 405, { error: "Method not allowed" });
            return;
          }
          try {
            const result = await fetchDealDataServer(getMatch[1], token);
            writeJson(res, 200, result);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch from HubSpot.";
            writeJson(res, 502, { error: message });
          }
          return;
        }

        // POST /api/hubspot/deals/:dealId/submit
        if (submitMatch) {
          if (req.method !== "POST") {
            writeJson(res, 405, { error: "Method not allowed" });
            return;
          }
          try {
            const raw = await readBody(req);
            const body = JSON.parse(raw) as SubmitBody;
            const result = await submitOnboardingServer(submitMatch[1], body, token);
            if (result.errors.length > 0 && result.updated.length === 0 && result.created.length === 0) {
              writeJson(res, 502, { error: result.errors.join("; "), details: result });
            } else {
              writeJson(res, 200, result);
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to submit to HubSpot.";
            writeJson(res, 502, { error: message });
          }
          return;
        }

        // POST /api/hubspot/deals/:dealId/attach-pdf
        if (attachMatch) {
          if (req.method !== "POST") {
            writeJson(res, 405, { error: "Method not allowed" });
            return;
          }

          try {
            const dealId = attachMatch[1];
            const raw = await readBody(req);
            const body = JSON.parse(raw) as AttachPdfBody;

            if (!body.pdfBase64 || !body.fileName) {
              writeJson(res, 400, { error: "Missing required PDF payload." });
              return;
            }

            const pdfBuffer = Buffer.from(body.pdfBase64, "base64");
            const formData = new FormData();
            formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), body.fileName);
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

            const uploadBody = (await uploadRes.json()) as {
              id: string;
              url?: string;
              defaultHostingUrl?: string;
            };

            const fileId = uploadBody.id;
            const fileUrl = uploadBody.url ?? uploadBody.defaultHostingUrl ?? "";
            const warnings: string[] = [];

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

            // Keep history when the HubSpot property supports multi-file values; if not,
            // fall back to overwriting with the latest uploaded file.
            let signedAgreementValue = "";
            try {
              const dealBefore = await hsGet<HsObject>(
                `/crm/v3/objects/deals/${dealId}?properties=signed_agreement`,
                token
              );
              const previousValue = prop(dealBefore, "signed_agreement").trim();

              const candidates: string[] = [];
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
              if (fileUrl) {
                candidates.push(fileUrl);
              }

              for (const candidate of candidates) {
                try {
                  await hsPatch(`/crm/v3/objects/deals/${dealId}`, token, {
                    properties: {
                      signed_agreement: candidate,
                    },
                  });

                  const dealAfter = await hsGet<HsObject>(
                    `/crm/v3/objects/deals/${dealId}?properties=signed_agreement`,
                    token
                  );
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
                  warnings.push(
                    `signed_agreement update attempt failed: ${error instanceof Error ? error.message : String(error)}`
                  );
                }
              }

              if (!signedAgreementValue) {
                warnings.push(
                  "Uploaded and attached the file to deal timeline, but could not confirm signed_agreement property update."
                );
              }
            } catch (error) {
              warnings.push(
                `Unable to update or verify signed_agreement property: ${error instanceof Error ? error.message : String(error)}`
              );
            }

            writeJson(res, 200, { fileId, fileUrl, signedAgreementValue, warnings });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to attach signed agreement.";
            writeJson(res, 502, { error: message });
          }
          return;
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), hubspotProxyPlugin(mode), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
