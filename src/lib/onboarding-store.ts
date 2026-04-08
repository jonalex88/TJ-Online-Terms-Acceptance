import { OnboardingData, Company, Contact, Store, Document, AdminConfig } from "@/types/onboarding";

const STORAGE_PREFIX = "onboarding_";

function generateId(): string {
  return crypto.randomUUID();
}

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  companyUrl: "",
  products: { inPersonPayments: true, reconPro: true },
  agreementUploadRequired: false,
  fees: {
    monthlyFeePerDevice: 280,
    monthlyCloudHostingFeePerDevice: 25,
    monthlyReconProFeePerSite: 295,
    oneOffSetupFeePerSite: 520,
  },
};

export function createSession(hubspotCompanyId: string, adminConfig: AdminConfig): string {
  const sessionId = generateId();
  const data: OnboardingData = {
    sessionId,
    hubspotCompanyId,
    adminConfig,
    companies: [
      {
        id: generateId(),
        companyName: "",
        registrationNumber: "",
        vatNumber: "",
        tradingName: "",
        industry: "",
        address: "",
        city: "",
        province: "",
        postalCode: "",
        contacts: [],
        stores: [],
        documents: [],
      },
    ],
    termsAccepted: false,
    feesAccepted: false,
    currentStep: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_PREFIX + sessionId, JSON.stringify(data));
  return sessionId;
}

export function getSession(sessionId: string): OnboardingData | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + sessionId);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function saveSession(data: OnboardingData): void {
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_PREFIX + data.sessionId, JSON.stringify(data));
}

export function addCompany(sessionId: string): Company {
  const data = getSession(sessionId)!;
  const company: Company = {
    id: generateId(),
    companyName: "",
    registrationNumber: "",
    vatNumber: "",
    tradingName: "",
    industry: "",
    address: "",
    city: "",
    province: "",
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
    role: "",
    idNumber: "",
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
    storeName: "",
    storeCode: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
    email: "",
    terminalCount: 1,
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
