import { OnboardingData, Company, Contact, Store, Document, AdminConfig } from "@/types/onboarding";
import { HubSpotFetchResult } from "@/lib/hubspot";

const STORAGE_PREFIX = "onboarding_";

function generateId(): string {
  return crypto.randomUUID();
}

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  hubspotDealUrl: "",
  bulkDeal: false,
  products: { inPersonPayments: true, reconPro: true },
  agreementType: "accept-terms",
  fees: {
    monthlyFeePerDevice: 280,
    monthlyCloudHostingFeePerDevice: 25,
    monthlyReconProFeePerSite: 295,
    oneOffSetupFeePerSite: 520,
  },
};

export function createSession(
  adminConfig: AdminConfig,
  hubspot: { dealId: string; dealUrl: string; companyId: string },
  prefill?: HubSpotFetchResult
): string {
  const sessionId = generateId();
  const prefilledContacts = (prefill?.contacts ?? []).map((contact, index) => ({
    ...contact,
    receiveInvoices: contact.receiveInvoices || index === 0,
  }));

  if (prefilledContacts.length > 0 && prefilledContacts.every((contact) => !contact.receiveInvoices)) {
    prefilledContacts[0] = { ...prefilledContacts[0], receiveInvoices: true };
  }

  const initialCompany: Company = {
    id: generateId(),
    hubspotId: hubspot.companyId || undefined,
    registeredCompanyName: prefill?.company.registeredCompanyName ?? "",
    registrationNumber: prefill?.company.registrationNumber ?? "",
    vatNumber: prefill?.company.vatNumber ?? "",
    tradingName: prefill?.company.tradingName ?? "",
    industry: prefill?.company.industry ?? "",
    buildingName: prefill?.company.buildingName ?? "",
    buildingNumber: prefill?.company.buildingNumber ?? "",
    streetNumber: prefill?.company.streetNumber ?? "",
    streetAddress: prefill?.company.streetAddress ?? "",
    suburb: prefill?.company.suburb ?? "",
    city: prefill?.company.city ?? "",
    province: prefill?.company.province ?? "",
    country: prefill?.company.country ?? "",
    postalCode: prefill?.company.postalCode ?? "",
    contacts: prefilledContacts,
    stores: prefill?.store
      ? [{ id: generateId(), ...defaultStore(), ...prefill.store } as Store]
      : [],
    documents: [],
  };

  const data: OnboardingData = {
    sessionId,
    hubspotDealId: hubspot.dealId,
    hubspotDealUrl: hubspot.dealUrl,
    hubspotCompanyId: hubspot.companyId,
    adminConfig,
    companies: [initialCompany],
    bulkDeal: adminConfig.bulkDeal,
    termsAccepted: false,
    feesAccepted: false,
    acceptanceEmail: "",
    currentStep: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_PREFIX + sessionId, JSON.stringify(data));
  return sessionId;
}

function defaultStore(): Omit<Store, "id"> {
  return {
    brand: "",
    tradingSiteName: "",
    posProvider: "",
    buildingName: "",
    buildingNumber: "",
    streetNumber: "",
    streetAddress: "",
    suburb: "",
    city: "",
    province: "",
    country: "",
    postalCode: "",
    counterDevices: 0,
    mobileDevices: 0,
    acquiringBank: "",
    acquiringBankMid: "",
  };
}

export function getSession(sessionId: string): OnboardingData | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + sessionId);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function listAllSessions(): OnboardingData[] {
  const sessions: OnboardingData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try { sessions.push(JSON.parse(raw)); } catch { /* skip corrupted */ }
      }
    }
  }
  return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function markSubmitted(sessionId: string): void {
  const data = getSession(sessionId);
  if (!data) return;
  data.submittedToHubspot = true;
  data.submittedAt = new Date().toISOString();
  saveSession(data);
}

export function saveSession(data: OnboardingData): void {
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_PREFIX + data.sessionId, JSON.stringify(data));
}

export function addCompany(sessionId: string): Company {
  const data = getSession(sessionId)!;
  const company: Company = {
    id: generateId(),
    registeredCompanyName: "",
    registrationNumber: "",
    vatNumber: "",
    tradingName: "",
    industry: "",
    buildingName: "",
    buildingNumber: "",
    streetNumber: "",
    streetAddress: "",
    suburb: "",
    city: "",
    province: "",
    country: "",
    postalCode: "",
    contacts: [],
    stores: [],
    documents: [],
  };
  data.companies.push(company);
  saveSession(data);
  return company;
}

export function updateCompany(sessionId: string, company: Company): void {
  const data = getSession(sessionId)!;
  const idx = data.companies.findIndex((c) => c.id === company.id);
  if (idx >= 0) data.companies[idx] = company;
  saveSession(data);
}

export function removeCompany(sessionId: string, companyId: string): void {
  const data = getSession(sessionId)!;
  data.companies = data.companies.filter((c) => c.id !== companyId);
  saveSession(data);
}

export function addContact(sessionId: string, companyId: string): Contact {
  const data = getSession(sessionId)!;
  const company = data.companies.find((c) => c.id === companyId)!;
  const contact: Contact = {
    id: generateId(),
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    receiveInvoices: false,
    allowMarketing: false,
  };
  company.contacts.push(contact);
  saveSession(data);
  return contact;
}

export function updateContact(sessionId: string, companyId: string, contact: Contact): void {
  const data = getSession(sessionId)!;
  const company = data.companies.find((c) => c.id === companyId)!;
  const idx = company.contacts.findIndex((ct) => ct.id === contact.id);
  if (idx >= 0) company.contacts[idx] = contact;
  saveSession(data);
}

export function removeContact(sessionId: string, companyId: string, contactId: string): void {
  const data = getSession(sessionId)!;
  const company = data.companies.find((c) => c.id === companyId)!;
  company.contacts = company.contacts.filter((ct) => ct.id !== contactId);
  saveSession(data);
}

export function addStore(sessionId: string, companyId: string): Store {
  const data = getSession(sessionId)!;
  const company = data.companies.find((c) => c.id === companyId)!;
  const store: Store = {
    id: generateId(),
    ...defaultStore(),
  };
  company.stores.push(store);
  saveSession(data);
  return store;
}

export function updateStore(sessionId: string, companyId: string, store: Store): void {
  const data = getSession(sessionId)!;
  const company = data.companies.find((c) => c.id === companyId)!;
  const idx = company.stores.findIndex((s) => s.id === store.id);
  if (idx >= 0) company.stores[idx] = store;
  saveSession(data);
}

export function removeStore(sessionId: string, companyId: string, storeId: string): void {
  const data = getSession(sessionId)!;
  const company = data.companies.find((c) => c.id === companyId)!;
  company.stores = company.stores.filter((s) => s.id !== storeId);
  saveSession(data);
}

export function addDocument(sessionId: string, companyId: string, doc: Omit<Document, "id">): Document {
  const data = getSession(sessionId)!;
  const company = data.companies.find((c) => c.id === companyId)!;
  const document: Document = { id: generateId(), ...doc };
  company.documents.push(document);
  saveSession(data);
  return document;
}

export function removeDocument(sessionId: string, companyId: string, docId: string): void {
  const data = getSession(sessionId)!;
  const company = data.companies.find((c) => c.id === companyId)!;
  company.documents = company.documents.filter((d) => d.id !== docId);
  saveSession(data);
}
