import { Company, Contact, Store } from "@/types/onboarding";

/**
 * Extracts the numeric deal ID from a HubSpot deal URL.
 * Supports formats like:
 *   https://app.hubspot.com/contacts/12345/deal/67890
 *   https://app-eu1.hubspot.com/contacts/12345/deals/67890
 *   https://app-eu1.hubspot.com/contacts/12345/record/0-3/67890
 */
export function extractDealId(dealUrl: string): string | null {
  const match = dealUrl.match(/\/(?:deals?|record\/0-3)\/([\d]+)/i);
  return match ? match[1] : null;
}
/**
 * Extracts the numeric company ID from a HubSpot company URL.
 * Supports formats like:
 *   https://app-eu1.hubspot.com/contacts/12345/company/67890
 *   https://app-eu1.hubspot.com/contacts/12345/record/0-2/67890
 */
export function extractCompanyId(companyUrl: string): string | null {
  const match = companyUrl.match(/\/(?:company|record\/0-2)\/(\d+)/i);
  return match ? match[1] : null;
}
interface HsObject {
  id: string;
  properties: Record<string, string | null>;
}

export interface HubSpotFetchResult {
  store: Partial<Store>;
  company: Partial<Company>;
  contacts: Contact[];
  hubspotCompanyId: string;
  industryOptions?: Array<{ value: string; label: string }>;
}

export interface HubSpotCompanyFetchResult {
  company: Partial<Company>;
  hubspotCompanyId: string;
  industryOptions?: Array<{ value: string; label: string }>;
}

export async function fetchDealData(dealId: string): Promise<HubSpotFetchResult> {
  const res = await fetch(`/api/hubspot/deal?dealId=${encodeURIComponent(dealId)}`);
  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";

  if (res.ok && !contentType.includes("application/json")) {
    throw new Error("HubSpot endpoint returned HTML instead of JSON. Please redeploy so API routing is applied.");
  }

  if (!res.ok) {
    let message = `HubSpot proxy error (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Ignore JSON parse failures and fall back to the generic message.
    }
    throw new Error(message);
  }

  return (await res.json()) as HubSpotFetchResult;
}

export async function fetchCompanyData(companyId: string): Promise<HubSpotCompanyFetchResult> {
  const res = await fetch(`/api/hubspot/company?companyId=${encodeURIComponent(companyId)}`);
  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";

  if (res.ok && !contentType.includes("application/json")) {
    throw new Error("HubSpot company endpoint returned HTML instead of JSON. Please redeploy so API routing is applied.");
  }

  if (!res.ok) {
    let message = `HubSpot proxy error (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Ignore JSON parse failures and fall back to the generic message.
    }
    throw new Error(message);
  }

  return (await res.json()) as HubSpotCompanyFetchResult;
}
