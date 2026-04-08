export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  idNumber: string;
}

export interface Store {
  id: string;
  storeName: string;
  storeCode: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  terminalCount: number;
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
  companyName: string;
  registrationNumber: string;
  vatNumber: string;
  tradingName: string;
  industry: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contacts: Contact[];
  stores: Store[];
  documents: Document[];
}

export interface AdminConfig {
  companyUrl: string;
  products: {
    inPersonPayments: boolean;
    reconPro: boolean;
  };
  agreementUploadRequired: boolean;
  fees: {
    monthlyFeePerDevice: number;
    monthlyCloudHostingFeePerDevice: number;
    monthlyReconProFeePerSite: number;
    oneOffSetupFeePerSite: number;
  };
}

export interface OnboardingData {
  sessionId: string;
  hubspotCompanyId: string;
  adminConfig: AdminConfig;
  companies: Company[];
  termsAccepted: boolean;
  feesAccepted: boolean;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
}
