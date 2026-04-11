import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { OnboardingData } from "@/types/onboarding";
import { getSession, saveSession } from "@/lib/onboarding-store";
import WizardLayout from "@/components/onboarding/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Receipt,
  PenLine, Loader2, Download, AlertCircle, Printer, Building2,
} from "lucide-react";
import { termsOfUseCopy, isTermsHeading } from "@/lib/terms-content";
import { generateAcceptancePdf, SignerInfo } from "@/lib/generate-pdf";


function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const Onboarding = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [feesAccepted, setFeesAccepted] = useState(false);
  const [signerFullName, setSignerFullName] = useState("");
  const [signerJobTitle, setSignerJobTitle] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [authorizedConfirmed, setAuthorizedConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [companyDraft, setCompanyDraft] = useState<Record<string, string>>({});
  const pdfBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (sessionId) {
      const session = getSession(sessionId);
      if (session) {
        const migratedStep = session.currentStep > 0 ? session.currentStep - 1 : 0;
        const migratedSession = { ...session, currentStep: migratedStep };
        setData(migratedSession);
        setTermsAccepted(session.termsAccepted);
        setFeesAccepted(session.feesAccepted);
        setSignerFullName(session.signer?.fullName ?? "");
        setSignerJobTitle(session.signer?.jobTitle ?? "");
        setSignerEmail(session.acceptanceEmail ?? "");
        setAuthorizedConfirmed(session.signer?.authorizedConfirmed ?? false);
        const c = session.companies[0];
        if (c) {
          setCompanyDraft({
            registeredCompanyName: c.registeredCompanyName ?? "",
            registrationNumber: c.registrationNumber ?? "",
            vatNumber: c.vatNumber ?? "",
            tradingName: c.tradingName ?? "",
            industry: c.industry ?? "",
            buildingName: c.buildingName ?? "",
            buildingNumber: c.buildingNumber ?? "",
            streetNumber: c.streetNumber ?? "",
            streetAddress: c.streetAddress ?? "",
            suburb: c.suburb ?? "",
            city: c.city ?? "",
            province: c.province ?? "",
            postalCode: c.postalCode ?? "",
            country: c.country ?? "",
          });
        }

        if (migratedStep !== session.currentStep) {
          saveSession(migratedSession);
        }
      }
    }
  }, [sessionId]);

  const persist = useCallback((updated: OnboardingData) => {
    setData(updated);
    saveSession(updated);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-2">
            <p className="text-lg font-semibold">Invalid or expired link</p>
            <p className="text-muted-foreground text-sm">Please contact your account manager for a new TJ Terms of Use Acceptance link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = data.currentStep;
  const hasCompanyStep = !!data.adminConfig.hubspotCompanyUrl;
  const STEP_TERMS = hasCompanyStep ? 1 : 0;
  const STEP_FEES = hasCompanyStep ? 2 : 1;
  const STEP_CONFIRM = hasCompanyStep ? 3 : 2;
  const STEP_SUCCESS = hasCompanyStep ? 4 : 3;

  const goTo = (step: number) => {
    persist({ ...data, currentStep: step });
  };

  const handleAcceptTerms = (checked: boolean) => {
    setTermsAccepted(checked);
    persist({ ...data, termsAccepted: checked });
  };

  const handleAcceptFees = (checked: boolean) => {
    setFeesAccepted(checked);
    persist({ ...data, feesAccepted: checked });
  };

  const handleSubmitApplication = () => {
    persist({ ...data, feesAccepted: true, currentStep: STEP_CONFIRM });
  };

  const handleFinalConfirm = async () => {
    if (!isValidEmail(signerEmail)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    if (!authorizedConfirmed) {
      setSubmitError("Please confirm your authorization to sign on behalf of the company.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const acceptedAt = new Date().toISOString();
      const companyName =
        data.companies[0]?.registeredCompanyName ||
        data.companies[0]?.tradingName ||
        "Unknown Company";

      const signer: SignerInfo = {
        fullName: signerFullName.trim(),
        jobTitle: signerJobTitle.trim(),
        companyName,
        email: signerEmail.trim(),
        acceptedAt,
        sessionId: data.sessionId,
        dealId: data.hubspotDealId,
      };

      const pdfBlob = await generateAcceptancePdf(data, signer);
      pdfBlobRef.current = pdfBlob;

      persist({
        ...data,
        termsAccepted: true,
        feesAccepted: true,
        acceptanceEmail: signer.email,
        acceptedAt,
        signer: {
          fullName: signer.fullName,
          jobTitle: signer.jobTitle,
          authorizedConfirmed: true,
        },
        currentStep: STEP_SUCCESS,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to generate your signed agreement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (pdfBlobRef.current) {
      const url = URL.createObjectURL(pdfBlobRef.current);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tj-terms-acceptance-${data.hubspotDealId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    }

    if (!data.signer || !data.acceptedAt) {
      return;
    }

    const companyName =
      data.companies[0]?.registeredCompanyName ||
      data.companies[0]?.tradingName ||
      "Unknown Company";

    const signer: SignerInfo = {
      fullName: data.signer.fullName,
      jobTitle: data.signer.jobTitle,
      companyName,
      email: data.acceptanceEmail,
      acceptedAt: data.acceptedAt,
      sessionId: data.sessionId,
      dealId: data.hubspotDealId,
    };

    const regeneratedBlob = await generateAcceptancePdf(data, signer);
    pdfBlobRef.current = regeneratedBlob;
    const url = URL.createObjectURL(regeneratedBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tj-terms-acceptance-${data.hubspotDealId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const laneFee = formatCurrency(data.adminConfig.fees.monthlyFeePerDevice);
  const cloudFee = formatCurrency(data.adminConfig.fees.monthlyCloudHostingFeePerDevice);
  const reconProFee = formatCurrency(data.adminConfig.fees.monthlyReconProFeePerSite);
  const configFee = formatCurrency(data.adminConfig.fees.oneOffSetupFeePerSite);
  const includePosIntegrationFee = data.adminConfig.fees.includePosIntegrationFee ?? true;
  const posIntegrationFee = formatCurrency(data.adminConfig.fees.posIntegrationFee ?? 45000);
  const totalStores = data.companies.reduce((sum, company) => sum + company.stores.length, 0);
  const totalDevices = data.companies.reduce(
    (sum, company) => sum + company.stores.reduce((storeSum, store) => storeSum + store.counterDevices + store.mobileDevices, 0),
    0
  );
  const backupBankFeePerSite = 30;
  const canSubmitFees = feesAccepted;
  const canConfirm =
    signerFullName.trim().length > 1 &&
    signerJobTitle.trim().length > 1 &&
    isValidEmail(signerEmail) &&
    authorizedConfirmed;

  const handleConfirmCompany = () => {
    const updatedCompanies = data.companies.map((company, idx) =>
      idx === 0
        ? {
            ...company,
            registeredCompanyName: companyDraft["registeredCompanyName"] ?? company.registeredCompanyName,
            registrationNumber: companyDraft["registrationNumber"] ?? company.registrationNumber,
            vatNumber: companyDraft["vatNumber"] ?? company.vatNumber,
            tradingName: companyDraft["tradingName"] ?? company.tradingName,
            industry: companyDraft["industry"] ?? company.industry,
            buildingName: companyDraft["buildingName"] ?? company.buildingName,
            buildingNumber: companyDraft["buildingNumber"] ?? company.buildingNumber,
            streetNumber: companyDraft["streetNumber"] ?? company.streetNumber,
            streetAddress: companyDraft["streetAddress"] ?? company.streetAddress,
            suburb: companyDraft["suburb"] ?? company.suburb,
            city: companyDraft["city"] ?? company.city,
            province: companyDraft["province"] ?? company.province,
            postalCode: companyDraft["postalCode"] ?? company.postalCode,
            country: companyDraft["country"] ?? company.country,
          }
        : company
    );
    persist({ ...data, companies: updatedCompanies, currentStep: STEP_TERMS });
  };

  if (currentStep >= STEP_SUCCESS) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-lg text-center">
          <CardContent className="pt-10 pb-10 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Thank You!</h1>
              <p className="text-muted-foreground">Your signed terms and fee acceptance has been recorded successfully.</p>
            </div>
            <Card className="border-primary/30 bg-primary/5 shadow-sm text-left">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm font-medium text-primary mb-3">Your agreement copy is ready</p>
                <Button onClick={handleDownload} className="w-full h-12 text-base font-semibold shadow-md" size="lg">
                  <Download className="mr-2 h-5 w-5" /> Download signed agreement PDF
                </Button>
              </CardContent>
            </Card>
            <div className="bg-muted rounded-lg p-6 text-left space-y-3">
              <h3 className="font-semibold">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> Your submission is now waiting in the TJ admin review queue.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> A TJ team member will verify your details before committing to HubSpot.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> Once committed, your signed agreement PDF will be attached to the HubSpot deal.</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              If you have any questions, please contact <span className="font-medium text-foreground">onboarding@transactionjunction.co.za</span>
            </p>
            <Button variant="outline" className="mt-2" asChild>
              <a href="/dh38273r3geh837"> Back to Admin</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <WizardLayout currentStep={currentStep} hasCompanyStep={hasCompanyStep}>
      {hasCompanyStep && currentStep === 0 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Confirm Company Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  Please review and update your company details below. Fields have been pre-populated from your HubSpot record where available.
                </AlertDescription>
              </Alert>
              <div className="space-y-4">
                <p className="text-sm font-semibold">Company Identity</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="co-reg-name">Registered company name *</Label>
                    <Input id="co-reg-name" value={companyDraft["registeredCompanyName"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, registeredCompanyName: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-trading-name">Trading name</Label>
                    <Input id="co-trading-name" value={companyDraft["tradingName"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, tradingName: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-reg-number">Registration number *</Label>
                    <Input id="co-reg-number" value={companyDraft["registrationNumber"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, registrationNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-vat">VAT number</Label>
                    <Input id="co-vat" value={companyDraft["vatNumber"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, vatNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="co-industry">Industry</Label>
                    <Input id="co-industry" value={companyDraft["industry"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, industry: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-semibold">Physical Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="co-building-name">Building name</Label>
                    <Input id="co-building-name" value={companyDraft["buildingName"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, buildingName: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-building-number">Building number</Label>
                    <Input id="co-building-number" value={companyDraft["buildingNumber"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, buildingNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-street-number">Street number</Label>
                    <Input id="co-street-number" value={companyDraft["streetNumber"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, streetNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-street">Street address</Label>
                    <Input id="co-street" value={companyDraft["streetAddress"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, streetAddress: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-suburb">Suburb</Label>
                    <Input id="co-suburb" value={companyDraft["suburb"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, suburb: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-city">City</Label>
                    <Input id="co-city" value={companyDraft["city"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, city: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-province">Province</Label>
                    <Input id="co-province" value={companyDraft["province"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, province: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-postal">Postal code</Label>
                    <Input id="co-postal" value={companyDraft["postalCode"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, postalCode: e.target.value }))} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="co-country">Country</Label>
                    <Input id="co-country" value={companyDraft["country"] ?? ""} onChange={(e) => setCompanyDraft((d) => ({ ...d, country: e.target.value }))} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleConfirmCompany}
              size="lg"
              disabled={!(companyDraft["registeredCompanyName"] ?? "").trim() || !(companyDraft["registrationNumber"] ?? "").trim()}
            >
              Continue to Terms <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === STEP_TERMS && (
        <div className="space-y-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Transaction Junction Terms of Use</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted rounded-lg p-6 max-h-[34rem] overflow-y-auto text-sm text-muted-foreground space-y-3">
                {termsOfUseCopy.map((line, index) => (
                  <p
                    key={`${index}-${line}`}
                    className={isTermsHeading(line) ? "pt-2 font-semibold text-foreground" : "leading-relaxed"}
                  >
                    {line}
                  </p>
                ))}
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => handleAcceptTerms(Boolean(checked))}
                />
                <label htmlFor="terms" className="text-sm cursor-pointer">
                  I accept the terms of use
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handlePrint} size="lg">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button onClick={() => goTo(STEP_FEES)} size="lg" disabled={!termsAccepted}>
              Next: Fees <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === STEP_FEES && (
        <div className="space-y-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Fee Schedule</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Fees and payment terms</p>
                <p>
                  For avoidance of doubt, all terms recorded here are subject to the terms defined in the Master Services
                  Agreement.
                </p>
                <p>
                  TJ will invoice monthly in arrears for all amounts due, and the client must sign a debit order mandate for the
                  nominated account.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Once-off fees</h4>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-3 font-medium">Deliverable</th>
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-left p-3 font-medium">Fee (ex VAT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">Fixed fee per store</td>
                        <td className="p-3 text-muted-foreground">Configuration and project management fee</td>
                        <td className="p-3">{configFee}</td>
                      </tr>
                      {includePosIntegrationFee && (
                        <tr className="border-t align-top">
                          <td className="p-3 font-medium">POS integration support</td>
                          <td className="p-3 text-muted-foreground">
                            Integration specialist support and certification before go-live.
                          </td>
                          <td className="p-3">{posIntegrationFee}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recurring monthly fees</h4>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-3 font-medium">Platform</th>
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-left p-3 font-medium">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">Payment Platform license fee</td>
                        <td className="p-3 text-muted-foreground">Monthly fee per integrated device</td>
                        <td className="p-3">{laneFee} per month</td>
                      </tr>
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">Cloud hosting fee</td>
                        <td className="p-3 text-muted-foreground">Monthly fee per integrated device</td>
                        <td className="p-3">{cloudFee} per month</td>
                      </tr>
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">Reconciliation Platform license fee</td>
                        <td className="p-3 text-muted-foreground">Monthly fee per reconciled store</td>
                        <td className="p-3">{reconProFee} per month</td>
                      </tr>
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">Back up bank fee</td>
                        <td className="p-3 text-muted-foreground">Monthly fee per site with automated failover acquiring</td>
                        <td className="p-3">{formatCurrency(backupBankFeePerSite)} per month</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="fees"
                  checked={feesAccepted}
                  onCheckedChange={(checked) => handleAcceptFees(Boolean(checked))}
                />
                <label htmlFor="fees" className="text-sm cursor-pointer">
                  I accept the fees
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => goTo(STEP_TERMS)} size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button variant="outline" onClick={handlePrint} size="lg">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
            <Button onClick={handleSubmitApplication} size="lg" disabled={!canSubmitFees}>
              Continue to Confirmation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === STEP_CONFIRM && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <PenLine className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Authorized Signatory Confirmation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signerFullName">Full name *</Label>
                  <Input
                    id="signerFullName"
                    value={signerFullName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSignerFullName(value);
                      persist({
                        ...data,
                        signer: {
                          fullName: value,
                          jobTitle: signerJobTitle,
                          authorizedConfirmed,
                        },
                      });
                    }}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signerJobTitle">Job title *</Label>
                  <Input
                    id="signerJobTitle"
                    value={signerJobTitle}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSignerJobTitle(value);
                      persist({
                        ...data,
                        signer: {
                          fullName: signerFullName,
                          jobTitle: value,
                          authorizedConfirmed,
                        },
                      });
                    }}
                    placeholder="Director"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signerEmail">Email address *</Label>
                  <Input
                    id="signerEmail"
                    type="email"
                    value={signerEmail}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSignerEmail(value);
                      persist({ ...data, acceptanceEmail: value });
                    }}
                    placeholder="name@company.com"
                  />
                  {signerEmail.length > 0 && !isValidEmail(signerEmail) && (
                    <p className="text-xs text-destructive">Please enter a valid email address.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={data.companies[0]?.registeredCompanyName || data.companies[0]?.tradingName || "Unknown Company"}
                    disabled
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="authorized"
                  checked={authorizedConfirmed}
                  onCheckedChange={(checked) => {
                    const value = Boolean(checked);
                    setAuthorizedConfirmed(value);
                    persist({
                      ...data,
                      signer: {
                        fullName: signerFullName,
                        jobTitle: signerJobTitle,
                        authorizedConfirmed: value,
                      },
                    });
                  }}
                />
                <label htmlFor="authorized" className="text-sm cursor-pointer">
                  I confirm that I am authorized to accept these terms and fees on behalf of this company.
                </label>
              </div>

              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => goTo(STEP_FEES)} size="lg" disabled={isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleFinalConfirm} size="lg" disabled={!canConfirm || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating & attaching PDF...
                </>
              ) : (
                <>
                  Confirm and Sign <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </WizardLayout>
  );
};

export default Onboarding;