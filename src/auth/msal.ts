import { Configuration, PublicClientApplication } from "@azure/msal-browser";

const configuredClientId = import.meta.env.VITE_M365_CLIENT_ID?.trim();
const configuredTenantId = import.meta.env.VITE_M365_TENANT_ID?.trim();

// Fallback IDs let the app boot in dev even before auth settings are configured.
const fallbackClientId = "00000000-0000-0000-0000-000000000000";
const tenantSegment = configuredTenantId || "common";

export const isMsAuthConfigured = Boolean(configuredClientId && configuredTenantId);

const msalConfig: Configuration = {
  auth: {
    clientId: configuredClientId || fallbackClientId,
    authority: `https://login.microsoftonline.com/${tenantSegment}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};
