import { createRoot } from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";
import App from "./App.tsx";
import { msalInstance } from "@/auth/msal";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  );
}
