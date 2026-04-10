export interface Contact {
  id: string;
  hubspotId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  receiveInvoices: boolean;
  allowMarketing: boolean;
}

export interface Store {
  id: string;
  brand?: string;
  tradingSiteName: string;
  posProvider: string;
  buildingName: string;
  buildingNumber: string;
  streetNumber: string;
  streetAddress: string;
  suburb: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  counterDevices: number;
  mobileDevices: number;
  acquiringBank: string;
  acquiringBankMid: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  file?: File;
  fileName?: string;
  uploadedAt?: string;
}

export interface Company {
  id: string;
  hubspotId?: string;
  registeredCompanyName: string;
  registrationNumber: string;
  vatNumber?: string;
  tradingName: string;
  industry: string;
  buildingName: string;
  buildingNumber: string;
  streetNumber: string;
  streetAddress: string;
  suburb: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  contacts: Contact[];
  stores: Store[];
  documents: Document[];
}

export interface AdminConfig {
  hubspotDealUrl: string;
  bulkDeal: boolean;
  products: {
    inPersonPayments: boolean;
    reconPro: boolean;
  };
  agreementType: "accept-terms" | "sign-agreements" | "already-in-place";
  fees: {
    monthlyFeePerDevice: number;
    monthlyCloudHostingFeePerDevice: number;
    monthlyReconProFeePerSite: number;
    oneOffSetupFeePerSite: number;
  };
}

export interface OnboardingData {
  sessionId: string;
  hubspotDealId: string;
  hubspotDealUrl: string;
  hubspotCompanyId: string;
  adminConfig: AdminConfig;
  companies: Company[];
  bulkDeal?: boolean;
  termsAccepted: boolean;
  feesAccepted: boolean;
  acceptanceEmail: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  submittedToHubspot?: boolean;
  submittedAt?: string;
}
