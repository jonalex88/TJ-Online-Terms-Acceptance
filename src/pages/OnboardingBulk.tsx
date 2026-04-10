import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { OnboardingData, Company } from "@/types/onboarding";
import { getSession, saveSession } from "@/lib/onboarding-store";
import WizardLayout from "@/components/onboarding/WizardLayout";
import CompanyCard from "@/components/onboarding/CompanyCard";
import AddCompanyModal from "@/components/onboarding/AddCompanyModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Receipt } from "lucide-react";

const termsOfUseCopy = [
  "Introduction",
  "By applying for or using Transaction Junction (\"TJ\") services, you agree to the following Terms of Use.",
  "In this document, \"you\" refers to your business and any associated affiliates.",
  "Transaction Junction offers several solutions. These Terms of Use apply to all services, but you are only responsible for paying for the solutions you have specifically requested and that TJ has activated for you.",
  "If there is any conflict between these Terms of Use and a separate signed agreement between the parties, the terms of the signed agreement will apply",
  "1. General Terms",
  "These terms apply to all TJ services you use.",
  "Your Responsibilities",
  "Use the TJ online portal to view transaction details and investigate issues before logging a support request.",
  "Safeguard all credentials, passwords, API keys, and portal access details shared with you by TJ, as you will be responsible for unauthorised access using your secret credentials.",
  "Report any suspected fraud or system issues to TJ as soon as you become aware of them.",
  "Follow TJ's processes for submitting support requests, incident reporting, and change management.",
  "Manage transaction disputes directly with your acquiring bank or other payment partners.",
  "Ensure that version or configuration updates to your POS software or network do not disrupt your connection to TJ services.",
  "Maintain network connectivity that meets TJ's technical specifications.",
  "Whenever you request TJ to make a configuration change that may affect the services we provide, it is your responsibility to validate that the change has been made correctly, including confirming that settlement is occurring as expected.",
  "Transaction Junction's Responsibilities",
  "Provide you with access to the TJ platform and relevant tools such as the online portal or APIs.",
  "Maintain a PCI-DSS Level One certified and compliant solution.",
  "Ensure market-acceptable system availability across all platforms.",
  "Assist with end-to-end testing to confirm integrations and ensure services are functioning correctly where required.",
  "Maintain a documented and tested disaster recovery and failover plan.",
  "Operate both business-hours and after-hours support for critical issues (defined as P1 issues in our issue prioritisation table).",
  "Protect your data and share it only with authorized representatives or third parties as required to provide services or facilitate settlement.",
  "Definitions:",
  "Effective Date: The date on which TJ services go live and are available for your use.",
  "Parties: Refers to both you (the Client) and Transaction Junction (the Service Provider).",
  "Liability:any loss, damage, costs, fines, penalties and/or claims suffered by or incurred by a Party.",
  "2. Term, Suspension and Termination",
  "The minimum term for using TJ services is 12 months from the date your first service is activated. The minimum term is calculated per service.",
  "After the minimum term for a service is reached, the service and the terms will remain in place until either party gives 60 days' written notice of termination.",
  "During the notice period, TJ will continue to provide services, and you will remain responsible for paying all applicable fees.",
  "Any unpaid fees for services already rendered remain due even after termination.",
  "Should fees due to TJ be unpaid, TJ will attempt to contact you to prompt for payment. TJ has the right to suspend services until payment has been made or a payment plan has been agreed.",
  "3. Support Services",
  "Your Responsibilities",
  "Submit support queries to support@switch.tj with as much detail as possible (including context, issue description, and desired outcome).",
  "Join the relevant whatsapp system notification channels for real-time updates for system-wide issues (for example, if a payment provider we connect to is down).",
  "[pretty widget with QR codes for our channels]",
  "Transaction Junction's Responsibilities",
  "Provide operational and technical support during business hours.",
  "Provide after-hours support for critical issues.",
  "4. In-Person Integrated Payment Services",
  "Transaction Junction's Responsibilities",
  "Process your transactions through integrated payment channels.",
  "Monitor platform connections to payment providers (e.g., banks and alternative payment methods).",
  "Store transaction data securely for at leastfive (5) years.",
  "Provide an online portal for near real-time access to your transactional data.",
  "Share transactional data only with you and your authorized representatives.",
  "Maintain a Point-to-Point-Encryption listed solution unless confirmed otherwise in writing.",
  "Your Responsibilities",
  "Direct any settlement or payment queries to your payment providers if TJ is not the settling party.",
  "Allow TJ to share your details with third parties as needed to process or settle funds.",
  "Support TJ in performing remote testing (e.g., via screen-sharing) when required.",
  "5. eCommerce Services",
  "Transaction Junction's Responsibilities",
  "Maintain an ecommerce platform that you can access and use.",
  "Provide you with the required secret credentials to TJ's eCommerce platform and related features.",
  "Process payments and authentication based on your requirements.",
  "Support end-to-end testing with relevant payment providers as needed.",
  "Your Responsibilities",
  "Use the merchant portal to view and investigate transactions.",
  "Permit TJ to engage with third parties as needed for settlement purposes.",
  "6. Reconciliation Services",
  "Transaction Junction's Responsibilities",
  "Process daily transaction files from relevant 3rd parties and perform automated reconciliation.",
  "Display consolidated reconciliation results on the TJ web dashboard.",
  "Store reconciliation data for at least 90 days.",
  "Your Responsibilities",
  "Where daily transactional data is not received from 3rd parties by Transaction Junction, escalate to your payment partners to prompt for the delivery of required data to TJ to perform your reconciliation.",
  "7. Professional Services",
  "Professional services relate to analysis, testing, software development and consultancy services which may be requested by you from time to time.",
  "Transaction Junction's Responsibilities",
  "Only perform professional services where you have explicitly agreed to the associated fees.",
  "Provide a defined scope of work and cost estimate for any work prior to initiation.",
  "Your Responsibilities",
  "Settle the fees associated with professional services as per the agreement in writing, which may be differ from these terms of use.",
  "7. Additional Services",
  "If you wish to activate additional TJ services, please submit your request via support@switch.tj.",
  "8. Personal Data and Privacy",
  "To deliver our services, TJ needs to store and process certain personal data.By signing this agreement, you consent to this processing. TJ is committed to protecting your privacy and will never sell your data to third parties.",
  "9. Marketing and Communication",
  "From time to time, TJ may contact you about new products, services, or information that could benefit your business.",
  "By agreeing to our terms of use, you are opting in to receive such communications - every such communication we send you includes an option to unsubscribe at any time.",
  "10. Standard Terms of Use and Intellectual Property",
  "You may not copy, reverse engineer, or decompile any of Transaction Junction's software, methods, or systems. You must comply with these terms as well as any terms of use or conditions shown on the TJ online portal. If you intentionally breach these terms or act in a way that causes TJ to suffer any loss or liability, you will be responsible for covering that loss.",
  "11. Liability",
  "By using our services, you agree that TJ is not responsible for any issues or losses that may arise from their use.",
  "12. Fees and Payment Terms",
  "Fees associated with services will be clearly defined and agreed in writing prior to each service being enabled.",
  "You must sign a debit order mandate authorizing TJ to debit your nominated bank account for all applicable fees.",
  "Monthly and transactional fees will be invoiced in arrears during the first week of each month and debited 30 days later.",
  "TJ will provide detailed invoices for all charges.",
  "Fee disputes should be submitted in writing to accounts@switch.tj.",
  "TJ may apply a CPI-related fee increase annually on June 1st.",
];

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

const OnboardingBulk = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [companyModal, setCompanyModal] = useState<{ open: boolean; editCompany?: Company }>({ open: false });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [feesAccepted, setFeesAccepted] = useState(false);
  const [acceptanceEmail, setAcceptanceEmail] = useState("");

  useEffect(() => {
    if (sessionId) {
      const session = getSession(sessionId);
      if (session) {
        setData(session);
        setTermsAccepted(session.termsAccepted);
        setFeesAccepted(session.feesAccepted);
        setAcceptanceEmail(session.acceptanceEmail ?? "");
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
            <p className="text-muted-foreground text-sm">Please contact your account manager for a new onboarding link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = data.currentStep;

  const goTo = (step: number) => {
    persist({ ...data, currentStep: step });
  };

  const handleUpdateCompany = (updated: Company) => {
    const newData = { ...data, companies: data.companies.map((c) => (c.id === updated.id ? updated : c)) };
    persist(newData);
  };

  const handleAddCompany = (companyData: Partial<Company>) => {
    if (companyModal.editCompany) {
      const updated = { ...companyModal.editCompany, ...companyData };
      handleUpdateCompany(updated);
    } else {
      const newCompany: Company = {
        id: crypto.randomUUID(),
        contacts: [],
        stores: [],
        documents: [],
        ...companyData,
      } as Company;
      persist({ ...data, companies: [...data.companies, newCompany] });
    }
  };

  const handleDeleteCompany = (companyId: string) => {
    persist({ ...data, companies: data.companies.filter((c) => c.id !== companyId) });
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
    persist({ ...data, feesAccepted: true, acceptanceEmail, currentStep: 3 });
  };

  const laneFee = formatCurrency(data.adminConfig.fees.monthlyFeePerDevice);
  const cloudFee = formatCurrency(data.adminConfig.fees.monthlyCloudHostingFeePerDevice);
  const reconProFee = formatCurrency(data.adminConfig.fees.monthlyReconProFeePerSite);
  const configFee = formatCurrency(data.adminConfig.fees.oneOffSetupFeePerSite);
  const totalStores = data.companies.reduce((sum, company) => sum + company.stores.length, 0);
  const totalDevices = data.companies.reduce(
    (sum, company) => sum + company.stores.reduce((storeSum, store) => storeSum + store.counterDevices + store.mobileDevices, 0),
    0
  );
  const backupBankFeePerSite = 30;
  const estimatedLaneFee = formatCurrency(data.adminConfig.fees.monthlyFeePerDevice * totalDevices);
  const estimatedCloudFee = formatCurrency(data.adminConfig.fees.monthlyCloudHostingFeePerDevice * totalDevices);
  const estimatedReconProFee = formatCurrency(data.adminConfig.fees.monthlyReconProFeePerSite * totalStores);
  const estimatedBackupBankFee = formatCurrency(backupBankFeePerSite * totalStores);
  const canSubmitFees = feesAccepted && isValidEmail(acceptanceEmail);

  if (currentStep >= 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-lg text-center">
          <CardContent className="pt-10 pb-10 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Thank You!</h1>
              <p className="text-muted-foreground">Your onboarding application has been submitted successfully.</p>
            </div>
            <div className="bg-muted rounded-lg p-6 text-left space-y-3">
              <h3 className="font-semibold">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> Our team will review your application within 2-3 business days.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> You'll receive an email once your account has been activated.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> A dedicated account manager will be assigned to assist with setup.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> Terminal delivery and installation will be scheduled after activation.</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              If you have any questions, please contact <span className="font-medium text-foreground">onboarding@transactionjunction.co.za</span>
            </p>
            <Button variant="outline" className="mt-2" asChild>
              <a href="/"> Back to Admin</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <WizardLayout currentStep={currentStep}>
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Business Details</h2>
              <p className="text-sm text-muted-foreground">Add your companies, contacts, and store locations.</p>
            </div>
            <Button onClick={() => setCompanyModal({ open: true })}>
              <Plus className="h-4 w-4 mr-2" /> Add Company
            </Button>
          </div>

          <div className="space-y-4">
            {data.companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onUpdateCompany={handleUpdateCompany}
                onEditCompany={() => setCompanyModal({ open: true, editCompany: company })}
                onDeleteCompany={() => handleDeleteCompany(company.id)}
                canDelete={data.companies.length > 1}
              />
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => goTo(1)} size="lg">
              Next: Terms of Use <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <AddCompanyModal
            open={companyModal.open}
            onClose={() => setCompanyModal({ open: false })}
            onSave={handleAddCompany}
            initialData={companyModal.editCompany}
          />
        </div>
      )}

      {currentStep === 1 && (
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
                  <p key={`${index}-${line}`}>{line}</p>
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
            <Button variant="outline" onClick={() => goTo(0)} size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => goTo(2)} size="lg" disabled={!termsAccepted}>
              Next: Fees <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
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
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">POS integration support</td>
                        <td className="p-3 text-muted-foreground">
                          Integration specialist support and certification before go-live.
                        </td>
                        <td className="p-3">R45,000.00</td>
                      </tr>
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
                        <th className="text-left p-3 font-medium">Estimate monthly fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">Payment Platform license fee</td>
                        <td className="p-3 text-muted-foreground">Monthly fee per integrated device</td>
                        <td className="p-3">{laneFee} per month</td>
                        <td className="p-3">{estimatedLaneFee}</td>
                      </tr>
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">Cloud hosting fee</td>
                        <td className="p-3 text-muted-foreground">Monthly fee per integrated device</td>
                        <td className="p-3">{cloudFee} per month</td>
                        <td className="p-3">{estimatedCloudFee}</td>
                      </tr>
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">Reconciliation Platform license fee</td>
                        <td className="p-3 text-muted-foreground">Monthly fee per reconciled store</td>
                        <td className="p-3">{reconProFee} per month</td>
                        <td className="p-3">{estimatedReconProFee}</td>
                      </tr>
                      <tr className="border-t align-top">
                        <td className="p-3 font-medium">Back up bank fee</td>
                        <td className="p-3 text-muted-foreground">Monthly fee per site with automated failover acquiring</td>
                        <td className="p-3">{formatCurrency(backupBankFeePerSite)} per month</td>
                        <td className="p-3">{estimatedBackupBankFee}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="acceptanceEmail" className="text-sm font-medium">
                  your email address
                </label>
                <Input
                  id="acceptanceEmail"
                  type="email"
                  value={acceptanceEmail}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAcceptanceEmail(value);
                    persist({ ...data, acceptanceEmail: value });
                  }}
                  placeholder="name@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Please enter your email address so that we can send you a copy the terms and fees that you have accepted for
                  your records
                </p>
                {acceptanceEmail.length > 0 && !isValidEmail(acceptanceEmail) && (
                  <p className="text-xs text-destructive">Please enter a valid email address.</p>
                )}
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
            <Button variant="outline" onClick={() => goTo(1)} size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleSubmitApplication} size="lg" disabled={!canSubmitFees}>
              Submit Application <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </WizardLayout>
  );
};

export default OnboardingBulk;
