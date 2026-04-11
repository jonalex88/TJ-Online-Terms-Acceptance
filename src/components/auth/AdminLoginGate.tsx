import { ReactElement, ReactNode, cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LockKeyhole } from "lucide-react";
import tjLogo from "@/assets/tj-logo.png";

const AUTH_STORAGE_KEY = "tj_admin_auth_v1";

const USERS = [
  { username: "AD", password: "1256" },
  { username: "Zaida", password: "5932" },
  { username: "Ranell", password: "3653" },
  { username: "Tauhedah", password: "2022" },
  { username: "Adele", password: "5832" },
  { username: "Yusuf S", password: "6577" },
  { username: "Yusuf B", password: "2324" },
  { username: "Jonathan", password: "1111" },
] as const;

interface AdminChildProps {
  onSignOut?: () => void;
  currentUser?: string;
}

interface AdminLoginGateProps {
  children: ReactNode;
}

const AdminLoginGate = ({ children }: AdminLoginGateProps) => {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authenticatedUser, setAuthenticatedUser] = useState<string>("");
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!cached) return;
    const exists = USERS.some((u) => u.username === cached);
    if (exists) {
      setAuthenticatedUser(cached);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      passwordInputRef.current?.focus();
      passwordInputRef.current?.select();
    }
  }, [selectedUser]);

  const selectedUserRecord = useMemo(
    () => USERS.find((u) => u.username === selectedUser),
    [selectedUser]
  );

  const handleSignOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthenticatedUser("");
    setSelectedUser("");
    setPassword("");
    setError("");
  };

  const handleSignIn = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!selectedUserRecord) {
      setError("Please select a user.");
      return;
    }

    if (password !== selectedUserRecord.password) {
      setError("Incorrect password.");
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, selectedUserRecord.username);
    setAuthenticatedUser(selectedUserRecord.username);
    setPassword("");
  };

  if (authenticatedUser) {
    if (isValidElement(children)) {
      return cloneElement(children as ReactElement<AdminChildProps>, {
        onSignOut: handleSignOut,
        currentUser: authenticatedUser,
      });
    }
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <img src={tjLogo} alt="Transaction Junction" className="h-8 w-auto" />
          <CardTitle className="text-2xl mt-2">Admin sign in</CardTitle>
          <CardDescription>
            Select your user and enter your password to access the send page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label>Users</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {USERS.map((user) => (
                  <Button
                    key={user.username}
                    type="button"
                    variant={selectedUser === user.username ? "default" : "outline"}
                    onClick={() => {
                      setSelectedUser(user.username);
                      setError("");
                    }}
                    className="justify-center"
                  >
                    {user.username}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={selectedUser ? `Enter password for ${selectedUser}` : "Select a user first"}
                disabled={!selectedUser}
                autoComplete="off"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={!selectedUser || password.length === 0}>
              <LockKeyhole className="mr-2 h-4 w-4" /> Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginGate;
