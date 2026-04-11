import {
  fetchDealDataServer,
  getDealIdFromQuery,
  getHubSpotToken,
  isRateLimited,
  writeJson,
} from "../../../_lib/hubspot.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (isRateLimited(req, "get-deal")) {
    writeJson(res, 429, { error: "Too many requests. Please try again shortly." });
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
    const result = await fetchDealDataServer(dealId, token);
    writeJson(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch from HubSpot.";
    writeJson(res, 502, { error: message });
  }
}
