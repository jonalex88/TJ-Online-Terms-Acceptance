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
}

export async function fetchDealData(dealId: string): Promise<HubSpotFetchResult> {
  const res = await fetch(`/api/hubspot/deals/${dealId}`);
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
