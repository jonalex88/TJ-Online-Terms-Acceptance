import {
  attachSignedPdfServer,
  getDealIdFromQuery,
  getHubSpotToken,
  isJsonRequest,
  isRateLimited,
  readJsonBody,
  writeJson,
} from "../../../../_lib/hubspot.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (isRateLimited(req, "attach-pdf")) {
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

  const dealId = getDealIdFromQuery(req);
  if (!/^\d+$/.test(dealId)) {
    writeJson(res, 400, { error: "Invalid deal ID." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await attachSignedPdfServer(dealId, body, token);
    writeJson(res, result.status, result.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to attach signed agreement.";
    writeJson(res, 502, { error: message });
  }
}
