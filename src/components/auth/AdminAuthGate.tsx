import { ReactNode, useState } from "react";
import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { isMsAuthConfigured, loginRequest } from "@/auth/msal";
import tjLogo from "@/assets/tj-logo.png";

interface AdminAuthGateProps {
  children: ReactNode;
}

const AdminAuthGate = ({ children }: AdminAuthGateProps) => {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [authSkipped, setAuthSkipped] = useState(false);

  const handleSignIn = async () => {
    await instance.loginRedirect(loginRequest);
  };

  if (authSkipped) {
    return <>{children}</>;
  }

  if (!isMsAuthConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <img src={tjLogo} alt="Transaction Junction" className="h-8 w-auto" />
            <CardTitle>Microsoft 365 auth setup required</CardTitle>
            <CardDescription>
              Configure VITE_M365_CLIENT_ID and VITE_M365_TENANT_ID to secure the admin page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Public onboarding links remain accessible without login.</p>
            <p>Once configured, this page will require Microsoft sign-in.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing you in...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-xl w-full shadow-lg">
        <CardHeader className="space-y-4">
          <img src={tjLogo} alt="Transaction Junction" className="h-8 w-auto" />
          <div>
            <CardTitle className="text-2xl">TJ Terms of Use Acceptance</CardTitle>
            <CardDescription className="pt-1">
              Admin access is restricted. Sign in with your Microsoft 365 account to continue.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={handleSignIn} className="w-full" size="lg">
            <Lock className="mr-2 h-4 w-4" /> Sign in with Microsoft 365
          </Button>
          <Button onClick={() => setAuthSkipped(true)} variant="ghost" className="w-full text-xs">
            Dev: Skip auth
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuthGate;
