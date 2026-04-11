import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createSession, DEFAULT_ADMIN_CONFIG, listAllSessions, markSubmitted } from "@/lib/onboarding-store";
import { extractDealId, extractCompanyId, fetchCompanyData, fetchDealData, HubSpotFetchResult } from "@/lib/hubspot";
import { blobToBase64, buildAcceptanceConfirmationSnippet, generateAcceptancePdf, SignerInfo } from "@/lib/generate-pdf";
import { AdminConfig, OnboardingData } from "@/types/onboarding";
import {
  Copy, CheckCircle, Link as LinkIcon, ExternalLink, Loader2, AlertCircle, Building2,
  ArrowLeft, Send, User, MapPin, FileText, Mail, ClipboardList, CheckCircle2, LogOut,
} from "lucide-react";
import tjLogo from "@/assets/tj-logo.png";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const isCompletedSession = (session: OnboardingData) =>
  session.termsAccepted && session.feesAccepted && Boolean(session.signer?.authorizedConfirmed);

// ---------------------------------------------------------------------------
// Send Tab
// ---------------------------------------------------------------------------
const SendTab = () => {
  const [dealUrl, setDealUrl] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [config, setConfig] = useState<AdminConfig>({ ...DEFAULT_ADMIN_CONFIG });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasTriedGenerate, setHasTriedGenerate] = useState(false);
  const [prefetchedData, setPrefetchedData] = useState<HubSpotFetchResult | null>(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const dealId = extractDealId(dealUrl.trim());
  const companyId = companyUrl.trim() ? extractCompanyId(companyUrl.trim()) : null;
  const detectedDealName = prefetchedData?.store.tradingSiteName?.trim();
  const detectedCompanyName = (
    prefetchedData?.company.tradingName ||
    prefetchedData?.company.registeredCompanyName
  )?.trim();

  const handleGenerate = async () => {
    const trimmedUrl = dealUrl.trim();
    if (!trimmedUrl) return;
    const id = extractDealId(trimmedUrl);
    if (!id) {
      setError("Could not extract a deal ID from that URL. Please paste a valid HubSpot deal URL.");
      return;
    }
    setLoading(true);
    setHasTriedGenerate(true);
    setError("");
    setPrefetchedData(null);
    let hubspotData: HubSpotFetchResult = {
      store: {},
      company: {},
      contacts: [],
      hubspotCompanyId: "",
    };
    const fetchErrors: string[] = [];

    try {
      const dealResult = await fetchDealData(id);
      hubspotData = {
        ...hubspotData,
        ...dealResult,
      };
    } catch (err) {
      fetchErrors.push(err instanceof Error ? err.message : "Deal prefill failed");
    }

    if (companyId) {
      try {
        const companyResult = await fetchCompanyData(companyId);
        hubspotData = {
          ...hubspotData,
          company: {
            ...hubspotData.company,
            ...companyResult.company,
          },
          hubspotCompanyId: companyResult.hubspotCompanyId,
          industryOptions:
            companyResult.industryOptions && companyResult.industryOptions.length > 0
              ? companyResult.industryOptions
              : hubspotData.industryOptions,
        };
      } catch (err) {
        fetchErrors.push(err instanceof Error ? err.message : "Company prefill failed");
      }
    }

    if (fetchErrors.length > 0) {
      setError(`Failed to fetch HubSpot data: ${fetchErrors.join(" | ")}`);
    }
    setPrefetchedData(hubspotData);
    setLoading(false);
    const updatedConfig: AdminConfig = { ...config, hubspotDealUrl: trimmedUrl, hubspotCompanyUrl: companyUrl.trim() };
    setConfig(updatedConfig);
    const sessionId = createSession(
      updatedConfig,
      { dealId: id, dealUrl: trimmedUrl, companyId: companyId ?? hubspotData?.hubspotCompanyId ?? "" },
      hubspotData
    );
    setGeneratedLink(`${window.location.origin}/onboarding/${sessionId}`);
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="deal-url" className="font-medium">HubSpot Deal URL *</Label>
        <Input
          id="deal-url"
          placeholder="https://app-eu1.hubspot.com/contacts/12345/deal/67890"
          value={dealUrl}
          onChange={(e) => { setDealUrl(e.target.value); setError(""); setGeneratedLink(""); setPrefetchedData(null); }}
        />
        {dealUrl && !dealId && (
          <p className="text-xs text-destructive">Please enter a valid HubSpot deal URL containing a deal ID.</p>
        )}
        {dealUrl && dealId && (
          <p className="text-xs text-muted-foreground">
            {detectedDealName
              ? `${detectedDealName} detected.`
              : hasTriedGenerate
                ? "Deal name could not be fetched from HubSpot."
                : "Deal URL detected. Click Generate to fetch deal name."}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-url" className="font-medium">HubSpot Company URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="company-url"
          placeholder="https://app-eu1.hubspot.com/contacts/12345/company/67890"
          value={companyUrl}
          onChange={(e) => { setCompanyUrl(e.target.value); setGeneratedLink(""); }}
        />
        {companyUrl.trim() && !companyId && (
          <p className="text-xs text-destructive">Please enter a valid HubSpot company URL containing a company ID.</p>
        )}
        {companyUrl.trim() && companyId && (
          <p className="text-xs text-muted-foreground">
            {detectedCompanyName
              ? `${detectedCompanyName} detected - wizard will include a company details confirmation step.`
              : hasTriedGenerate
                ? "Company name could not be fetched from HubSpot."
                : "Company URL detected. Click Generate to fetch company name and enable company details confirmation step."}
          </p>
        )}
        {!companyUrl.trim() && (
          <p className="text-xs text-muted-foreground">If provided, the wizard will include a step for the customer to confirm their company details.</p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="font-medium">Fees</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="fee-device" className="text-xs text-muted-foreground">Lane fee</Label>
            <Input id="fee-device" type="number" className="w-32" value={config.fees.monthlyFeePerDevice} onChange={(e) => updateFee("monthlyFeePerDevice", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fee-cloud" className="text-xs text-muted-foreground">Cloud fee</Label>
            <Input id="fee-cloud" type="number" className="w-32" value={config.fees.monthlyCloudHostingFeePerDevice} onChange={(e) => updateFee("monthlyCloudHostingFeePerDevice", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fee-recon" className="text-xs text-muted-foreground">Recon Pro fee</Label>
            <Input id="fee-recon" type="number" className="w-32" value={config.fees.monthlyReconProFeePerSite} onChange={(e) => updateFee("monthlyReconProFeePerSite", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fee-setup" className="text-xs text-muted-foreground">Config fee</Label>
            <Input id="fee-setup" type="number" className="w-32" value={config.fees.oneOffSetupFeePerSite} onChange={(e) => updateFee("oneOffSetupFeePerSite", e.target.value)} />
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              id="include-pos-integration-fee"
              checked={config.fees.includePosIntegrationFee}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({
                  ...prev,
                  fees: { ...prev.fees, includePosIntegrationFee: Boolean(checked) },
                }))
              }
            />
            <Label htmlFor="include-pos-integration-fee" className="cursor-pointer">
              Add POS integration fee
            </Label>
          </div>

          {config.fees.includePosIntegrationFee && (
            <div className="space-y-1">
              <Label htmlFor="fee-pos-integration" className="text-xs text-muted-foreground">
                POS integration fee
              </Label>
              <Input
                id="fee-pos-integration"
                type="number"
                className="w-40"
                value={config.fees.posIntegrationFee}
                onChange={(e) => updateFee("posIntegrationFee", e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleGenerate} className="w-full" disabled={!dealUrl.trim() || !dealId || loading}>
        {loading
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching from HubSpot…</>
          : <><LinkIcon className="mr-2 h-4 w-4" />Generate TJ Terms of Use Acceptance Link</>
        }
      </Button>

      {prefetchedData && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
          <p className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Pre-populated from HubSpot</p>
          {prefetchedData.company.registeredCompanyName && (
            <p className="text-muted-foreground">Company: <span className="text-foreground font-medium">{prefetchedData.company.registeredCompanyName}</span></p>
          )}
          {prefetchedData.store.tradingSiteName && (
            <p className="text-muted-foreground">Store: <span className="text-foreground font-medium">{prefetchedData.store.tradingSiteName}</span></p>
          )}
          {prefetchedData.contacts.length > 0 && (
            <p className="text-muted-foreground">
              Contacts: <span className="text-foreground font-medium">
                {prefetchedData.contacts.map((c) => `${c.firstName} ${c.lastName}`.trim()).filter(Boolean).join(", ")}
              </span>
            </p>
          )}
        </div>
      )}

      {generatedLink && (
        <div className="space-y-3 pt-2">
          <Label className="font-medium">TJ Terms of Use Acceptance Link</Label>
          <div className="flex items-center gap-2">
            <Input value={generatedLink} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="secondary" className="w-full" asChild>
            <a href={`/onboarding/${generatedLink.split("/onboarding/")[1]}`}>
              <ExternalLink className="mr-2 h-4 w-4" /> Open TJ Terms of Use Acceptance Link
            </a>
          </Button>
          {copied && <p className="text-sm text-success font-medium">Copied to clipboard!</p>}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Review Detail
// ---------------------------------------------------------------------------
const ReviewDetail = ({ session, onBack }: { session: OnboardingData; onBack: () => void }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(session.submittedToHubspot ?? false);
  const [submitError, setSubmitError] = useState("");

  const handleCommit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const companyName =
        session.companies[0]?.registeredCompanyName ||
        session.companies[0]?.tradingName ||
        "Unknown Company";
      const acceptedAt = session.acceptedAt ?? session.updatedAt;
      const signerName = session.signer?.fullName ?? "Unknown Signer";
      const signerTitle = session.signer?.jobTitle ?? "Unknown Title";
      const signerEmail = session.acceptanceEmail || "unknown@example.com";

      const signer: SignerInfo = {
        fullName: signerName,
        jobTitle: signerTitle,
        companyName,
        email: signerEmail,
        acceptedAt,
        sessionId: session.sessionId,
        dealId: session.hubspotDealId,
      };

      const pdfBlob = await generateAcceptancePdf(session, signer);
      const pdfBase64 = await blobToBase64(pdfBlob);
      const fileName = `tj-terms-acceptance-${session.hubspotDealId}-${Date.now()}.pdf`;

      const shouldCommitCompanyDetails = Boolean(session.adminConfig.hubspotCompanyUrl?.trim());
      const submitWarnings: string[] = [];

      if (shouldCommitCompanyDetails) {
        // Only commit company fields; contacts are intentionally excluded from this workflow.
        const companiesForCommit = session.companies.map((company) => ({
          ...company,
          contacts: [],
        }));

        const submitRes = await fetch(`/api/hubspot/submit?dealId=${encodeURIComponent(session.hubspotDealId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hubspotDealId: session.hubspotDealId,
            companies: companiesForCommit,
          }),
        });

        const submitBody = await submitRes.json().catch(() => ({})) as { error?: string; errors?: string[]; updated?: string[]; created?: string[] };
        if (!submitRes.ok) {
          throw new Error(submitBody.error ?? `Failed to update company details (HTTP ${submitRes.status})`);
        }

        submitWarnings.push(...(submitBody.errors ?? []));
      }

      const attachRes = await fetch(`/api/hubspot/attach-pdf?dealId=${encodeURIComponent(session.hubspotDealId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          fileName,
          signerName,
          signerTitle,
          signerEmail,
          acceptedAt,
        }),
      });

      const attachBody = await attachRes.json().catch(() => ({})) as { error?: string; warnings?: string[]; fileUrl?: string };
      if (!attachRes.ok) {
        throw new Error(attachBody.error ?? `Failed to attach signed PDF (HTTP ${attachRes.status})`);
      }

      markSubmitted(session.sessionId, { acceptanceCertificateUrl: attachBody.fileUrl });
      setSubmitted(true);

      const warnings = [...submitWarnings, ...(attachBody.warnings ?? [])];
      if (warnings.length > 0) {
        setSubmitError(`Committed with warnings:\n${warnings.join("\n")}`);
      }
    } catch (err) {
      if (err instanceof Error) setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const primaryCompany = session.companies[0];
  const previewSigner: SignerInfo = {
    fullName: session.signer?.fullName ?? "Unknown Signer",
    jobTitle: session.signer?.jobTitle ?? "Unknown Title",
    companyName:
      primaryCompany?.registeredCompanyName ||
      primaryCompany?.tradingName ||
      "Unknown Company",
    email: session.acceptanceEmail || "unknown@example.com",
    acceptedAt: session.acceptedAt ?? session.updatedAt,
    sessionId: session.sessionId,
    dealId: session.hubspotDealId,
  };
  const acceptanceSnippet = buildAcceptanceConfirmationSnippet(previewSigner);

  const fees = session.adminConfig.fees;
  const totalStores = session.companies.reduce((s, c) => s + c.stores.length, 0);
  const totalDevices = session.companies.reduce(
    (s, c) => s + c.stores.reduce((ss, st) => ss + st.counterDevices + st.mobileDevices, 0), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 pl-0">
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Button>
        <div className="flex items-center gap-3">
          {submitted ? (
            <Badge className="gap-1 bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3" /> Committed to HubSpot
            </Badge>
          ) : (
            <Button onClick={handleCommit} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              commit to hubspot
            </Button>
          )}
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold text-lg">{session.companies[0]?.registeredCompanyName || "Unnamed Company"}</p>
            {session.companies[0]?.tradingName && (
              <p className="text-sm text-muted-foreground">t/a {session.companies[0].tradingName}</p>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            <p>Completed: {formatDate(session.updatedAt)}</p>
            {session.acceptanceEmail && (
              <p className="flex items-center gap-1 justify-end"><Mail className="h-3 w-3" />{session.acceptanceEmail}</p>
            )}
            <p className="font-mono">Deal: {session.hubspotDealId}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap pt-1">
          {session.termsAccepted && <Badge variant="outline" className="text-success border-success">Terms Accepted</Badge>}
          {session.feesAccepted && <Badge variant="outline" className="text-success border-success">Fees Accepted</Badge>}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Commit Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <p><span className="text-muted-foreground">Trading as:</span> {primaryCompany?.tradingName || "-"}</p>
            <p><span className="text-muted-foreground">Registered name:</span> {primaryCompany?.registeredCompanyName || "-"}</p>
            <p><span className="text-muted-foreground">Registration number:</span> {primaryCompany?.registrationNumber || "-"}</p>
            <p><span className="text-muted-foreground">VAT number:</span> {primaryCompany?.vatNumber || "-"}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-semibold">Signed Terms Snippet (end of document)</p>
            <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">{acceptanceSnippet}</pre>
          </div>
        </CardContent>
      </Card>

      {session.companies.map((company) => (
        <Card key={company.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div>
              <div>
                <CardTitle className="text-base">{company.registeredCompanyName || "Unnamed Company"}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {[company.tradingName && `t/a ${company.tradingName}`, company.registrationNumber && `Reg: ${company.registrationNumber}`].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {(company.streetAddress || company.city) && (
              <div className="text-sm text-muted-foreground space-y-0.5">
                {[company.buildingName, company.streetNumber && `${company.streetNumber} ${company.streetAddress}`, company.suburb, company.city, company.province, company.postalCode, company.country].filter(Boolean).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" /> Contacts
              </h4>
              {company.contacts.length === 0
                ? <p className="text-sm text-muted-foreground italic pl-6">No contacts</p>
                : (
                  <div className="space-y-2 pl-6">
                    {company.contacts.map((c) => (
                      <div key={c.id} className="bg-muted/40 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                          <div className="flex gap-1">
                            {c.receiveInvoices && <Badge variant="secondary" className="text-xs">Invoice receiver</Badge>}
                            {c.allowMarketing && <Badge variant="outline" className="text-xs">Marketing</Badge>}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[c.designation, c.email, c.phone].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Stores
              </h4>
              {company.stores.length === 0
                ? <p className="text-sm text-muted-foreground italic pl-6">No stores</p>
                : (
                  <div className="space-y-2 pl-6">
                    {company.stores.map((s) => (
                      <div key={s.id} className="bg-muted/40 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{s.tradingSiteName || "Unnamed Store"}</p>
                          <span className="text-xs text-muted-foreground">
                            {s.counterDevices + s.mobileDevices} device{(s.counterDevices + s.mobileDevices) !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[s.city, s.province].filter(Boolean).join(", ")}
                          {s.acquiringBank && ` · Bank: ${s.acquiringBank}`}
                          {s.counterDevices > 0 && ` · ${s.counterDevices} counter`}
                          {s.mobileDevices > 0 && ` · ${s.mobileDevices} mobile`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" /> Documents
              </h4>
              <div className="space-y-1 pl-6">
                {(["debit_order_mandate", "proof_of_bank_account"] as const).map((slotType) => {
                  const doc = company.documents.find((d) => d.type === slotType);
                  const label = slotType === "debit_order_mandate" ? "Debit Order Mandate" : "Proof of Bank Account";
                  return (
                    <div key={slotType} className="flex items-center gap-2 text-sm">
                      {doc
                        ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      }
                      <span className={doc ? "text-foreground" : "text-amber-600"}>{label}</span>
                      {doc && <span className="text-xs text-muted-foreground truncate">— {doc.name}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configured Fees</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <span className="text-muted-foreground">Lane fee (per device)</span><span>{formatCurrency(fees.monthlyFeePerDevice)}</span>
            <span className="text-muted-foreground">Cloud fee (per device)</span><span>{formatCurrency(fees.monthlyCloudHostingFeePerDevice)}</span>
            <span className="text-muted-foreground">Recon Pro (per store)</span><span>{formatCurrency(fees.monthlyReconProFeePerSite)}</span>
            <span className="text-muted-foreground">Config fee (per store)</span><span>{formatCurrency(fees.oneOffSetupFeePerSite)}</span>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-medium">
            <span className="text-muted-foreground">Total stores</span><span>{totalStores}</span>
            <span className="text-muted-foreground">Total devices</span><span>{totalDevices}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Review Tab (list + drilldown)
// ---------------------------------------------------------------------------
const ReviewTab = () => {
  const [sessions, setSessions] = useState<OnboardingData[]>(() =>
    listAllSessions().filter(isCompletedSession)
  );
  const [selected, setSelected] = useState<OnboardingData | null>(null);

  const refresh = useCallback(() => {
    setSessions(listAllSessions().filter(isCompletedSession));
  }, []);

  const handleBack = () => {
    setSelected(null);
    refresh();
  };

  if (selected) {
    return <ReviewDetail session={selected} onBack={handleBack} />;
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No completed TJ Terms of Use Acceptance requests yet</p>
        <p className="text-sm text-muted-foreground">Once a merchant completes terms and fees acceptance, it will appear here for review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const company = s.companies[0];
        const totalStores = s.companies.reduce((sum, c) => sum + c.stores.length, 0);
        const totalContacts = s.companies.reduce((sum, c) => sum + c.contacts.length, 0);
        return (
          <button
            key={s.sessionId}
            onClick={() => setSelected(s)}
            className="w-full text-left rounded-lg border bg-card hover:bg-muted/40 transition-colors p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{company?.registeredCompanyName || "Unnamed Company"}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      company?.tradingName && `t/a ${company.tradingName}`,
                      `${totalStores} store${totalStores !== 1 ? "s" : ""}`,
                      `${totalContacts} contact${totalContacts !== 1 ? "s" : ""}`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.submittedToHubspot
                  ? <Badge className="bg-success text-success-foreground text-xs">Committed</Badge>
                  : <Badge variant="outline" className="text-xs">Pending review</Badge>
                }
                <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(s.updatedAt)}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Admin root
// ---------------------------------------------------------------------------
interface AdminProps {
  onSignOut?: () => void;
  currentUser?: string;
}

const Admin = ({ onSignOut, currentUser }: AdminProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={tjLogo} alt="Transaction Junction" className="h-8 brightness-0 invert" />
          <span className="text-xl font-semibold tracking-tight">TJ Terms of Use Acceptance — Admin</span>
        </div>
        {onSignOut && (
          <div className="flex items-center gap-3">
            {currentUser && <span className="text-sm opacity-90 hidden sm:inline">{currentUser}</span>}
            <Button variant="secondary" size="sm" onClick={onSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Tabs defaultValue="send">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="send" className="flex-1">Send TJ Terms of Use Acceptance Link</TabsTrigger>
            <TabsTrigger value="review" className="flex-1">Review TJ Terms of Use Acceptance Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <Card className="shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-semibold">Send TJ Terms of Use Acceptance link</CardTitle>
                <CardDescription>
                  Paste a HubSpot deal URL to pre-populate the terms and fees acceptance flow with deal, company, and contact data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SendTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <ReviewTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
