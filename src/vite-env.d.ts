/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_M365_CLIENT_ID?: string;
	readonly VITE_M365_TENANT_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
