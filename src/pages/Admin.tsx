import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { createSession, DEFAULT_ADMIN_CONFIG } from "@/lib/onboarding-store";
import { AdminConfig } from "@/types/onboarding";
import { Copy, CheckCircle, Link as LinkIcon, ExternalLink } from "lucide-react";
import tjLogo from "@/assets/tj-logo.png";
const Admin = () => {
  const [config, setConfig] = useState<AdminConfig>({ ...DEFAULT_ADMIN_CONFIG });
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!config.companyUrl.trim()) return;
    const sessionId = createSession(config.companyUrl.trim(), config);
    const link = `${window.location.origin}/onboarding/${sessionId}`;
    setGeneratedLink(link);
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateFee = (key: keyof AdminConfig["fees"], value: string) => {
    const num = value === "" ? 0 : Number(value);
    if (isNaN(num)) return;
    setConfig((prev) => ({ ...prev, fees: { ...prev.fees, [key]: num } }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src={tjLogo} alt="Transaction Junction" className="h-10" />
          </div>
          <CardTitle className="text-2xl font-semibold">Send merchant onboarding link</CardTitle>
          <CardDescription>
            Configure and generate a unique onboarding link for a merchant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company URL */}
          <div className="space-y-2">
            <Label htmlFor="company-url" className="font-medium">Company URL</Label>
            <Input
              id="company-url"
              placeholder="e.g. https://acme.co.za"
              value={config.companyUrl}
              onChange={(e) => setConfig((prev) => ({ ...prev, companyUrl: e.target.value }))}
            />
          </div>

          {/* Products */}
          <div className="space-y-3">
            <Label className="font-medium">Products</Label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="inperson"
                  checked={config.products.inPersonPayments}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({ ...prev, products: { ...prev.products, inPersonPayments: !!checked } }))
                  }
                />
                <label htmlFor="inperson" className="text-sm cursor-pointer">In-person payments</label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="reconpro"
                  checked={config.products.reconPro}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({ ...prev, products: { ...prev.products, reconPro: !!checked } }))
                  }
                />
                <label htmlFor="reconpro" className="text-sm cursor-pointer">Recon Pro</label>
              </div>
            </div>
          </div>

          {/* Agreement Type */}
          <div className="space-y-3">
            <Label className="font-medium">Agreement Type</Label>
            <div className="flex items-center gap-3">
              <Switch
                checked={config.agreementUploadRequired}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, agreementUploadRequired: checked }))
                }
              />
              <span className="text-sm text-muted-foreground">
                {config.agreementUploadRequired
                  ? "Agreement upload required"
                  : "Only acceptance of terms required"}
              </span>
            </div>
          </div>

          {/* Fees */}
          <div className="space-y-3">
            <Label className="font-medium">Fees</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="fee-device" className="text-xs text-muted-foreground">Lane fee</Label>
                <Input
                  id="fee-device"
                  type="number"
                  className="w-32"
                  value={config.fees.monthlyFeePerDevice}
                  onChange={(e) => updateFee("monthlyFeePerDevice", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fee-cloud" className="text-xs text-muted-foreground">Cloud fee</Label>
                <Input
                  id="fee-cloud"
                  type="number"
                  className="w-32"
                  value={config.fees.monthlyCloudHostingFeePerDevice}
                  onChange={(e) => updateFee("monthlyCloudHostingFeePerDevice", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fee-recon" className="text-xs text-muted-foreground">Recon Pro fee</Label>
                <Input
                  id="fee-recon"
                  type="number"
                  className="w-32"
                  value={config.fees.monthlyReconProFeePerSite}
                  onChange={(e) => updateFee("monthlyReconProFeePerSite", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fee-setup" className="text-xs text-muted-foreground">Config fee</Label>
                <Input
                  id="fee-setup"
                  type="number"
                  className="w-32"
                  value={config.fees.oneOffSetupFeePerSite}
                  onChange={(e) => updateFee("oneOffSetupFeePerSite", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full" disabled={!config.companyUrl.trim()}>
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
              <Button variant="secondary" className="w-full" asChild>
                <a href={`/onboarding/${generatedLink.split("/onboarding/")[1]}`}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Open Onboarding Link
                </a>
              </Button>
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
