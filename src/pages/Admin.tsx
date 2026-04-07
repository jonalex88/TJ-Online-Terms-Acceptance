import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSession } from "@/lib/onboarding-store";
import { Copy, CheckCircle, Link as LinkIcon } from "lucide-react";

const Admin = () => {
  const [hubspotId, setHubspotId] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!hubspotId.trim()) return;
    const sessionId = createSession(hubspotId.trim());
    const link = `${window.location.origin}/onboarding/${sessionId}`;
    setGeneratedLink(link);
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold">Merchant Onboarding</CardTitle>
          <CardDescription>
            Generate a unique onboarding link for a merchant by pasting their HubSpot Company ID below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hubspot-id" className="font-medium">HubSpot Company ID</Label>
            <Input
              id="hubspot-id"
              placeholder="e.g. 12345678"
              value={hubspotId}
              onChange={(e) => setHubspotId(e.target.value)}
              className="font-mono"
            />
          </div>
          <Button onClick={handleGenerate} className="w-full" disabled={!hubspotId.trim()}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Generate Onboarding Link
          </Button>

          {generatedLink && (
            <div className="space-y-3 pt-2">
              <Label className="font-medium">Onboarding Link</Label>
              <div className="flex items-center gap-2">
                <Input value={generatedLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-success font-medium">Copied to clipboard!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
