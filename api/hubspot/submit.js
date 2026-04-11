import {
  getHubSpotToken,
  isJsonRequest,
  isRateLimited,
  readJsonBody,
  submitOnboardingServer,
  writeJson,
} from "../_lib/hubspot.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (isRateLimited(req, "submit")) {
    writeJson(res, 429, { error: "Too many requests. Please try again shortly." });
    return;
  }

  if (!isJsonRequest(req)) {
    writeJson(res, 415, { error: "Unsupported media type. Expected application/json." });
    return;
  }

  const token = getHubSpotToken();
  if (!token) {
    writeJson(res, 500, { error: "HubSpot access token is not configured on the server." });
    return;
  }

  const dealId = String(req.query?.dealId || "");
  if (!/^\d+$/.test(dealId)) {
    writeJson(res, 400, { error: "Invalid deal ID." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    if (!body || !Array.isArray(body.companies)) {
      writeJson(res, 400, { error: "Invalid submit payload." });
      return;
    }

    const result = await submitOnboardingServer(dealId, body, token);
    if (result.errors.length > 0 && result.updated.length === 0 && result.created.length === 0) {
      writeJson(res, 502, { error: result.errors.join("; "), details: result });
    } else {
      writeJson(res, 200, result);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit to HubSpot.";
    writeJson(res, 502, { error: message });
  }
}
