# TJ Terms of Use Acceptance

## Access model

- Admin page (`/`) requires Microsoft 365 authentication.
- Public onboarding page (`/onboarding/:sessionId`) does not require authentication.
- Public session links use a 256-bit random opaque token and do not include deal IDs or other identifiable data.

## Microsoft 365 auth setup (Admin page)

1. Register an app in Microsoft Entra ID (Azure AD).
2. Add a Redirect URI for your deployed frontend origin, for example:
	- `https://your-domain.example/`
3. Copy `.env.example` to `.env` and set:
	- `VITE_M365_CLIENT_ID`
	- `VITE_M365_TENANT_ID`
4. Restart the app.

If these environment variables are missing, the admin route shows a setup notice.

## Run locally

```bash
npm install
npm run dev -- --host 0.0.0.0
```

## Build

```bash
npm run build
```
