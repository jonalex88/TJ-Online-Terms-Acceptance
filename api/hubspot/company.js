import {
  fetchCompanyDataServer,
  getHubSpotToken,
  isRateLimited,
  writeJson,
} from "../_lib/hubspot.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (isRateLimited(req, "get-company")) {
    writeJson(res, 429, { error: "Too many requests. Please try again shortly." });
    return;
  }

  const token = getHubSpotToken();
  if (!token) {
    writeJson(res, 500, { error: "HubSpot access token is not configured on the server." });
    return;
  }

  const companyId = String(req.query?.companyId || "");
  if (!/^\d+$/.test(companyId)) {
    writeJson(res, 400, { error: "Invalid company ID." });
    return;
  }

  try {
    const result = await fetchCompanyDataServer(companyId, token);
    writeJson(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch company from HubSpot.";
    writeJson(res, 502, { error: message });
  }
}
