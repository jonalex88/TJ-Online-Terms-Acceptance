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
import { Plus, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Receipt } from "lucide-react";

const Onboarding = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [companyModal, setCompanyModal] = useState<{ open: boolean; editCompany?: Company }>({ open: false });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [feesAccepted, setFeesAccepted] = useState(false);

  useEffect(() => {
    if (sessionId) {
      const session = getSession(sessionId);
      if (session) {
        setData(session);
        setTermsAccepted(session.termsAccepted);
        setFeesAccepted(session.feesAccepted);
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

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    persist({ ...data, termsAccepted: true });
  };

  const handleAcceptFees = () => {
    setFeesAccepted(true);
    persist({ ...data, feesAccepted: true, currentStep: 4 });
  };

  // Step 4: Thank You
  if (currentStep >= 4) {
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
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> Our team will review your application within 2–3 business days.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> You'll receive an email once your account has been activated.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> A dedicated account manager will be assigned to assist with setup.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> Terminal delivery and installation will be scheduled after activation.</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              If you have any questions, please contact <span className="font-medium text-foreground">onboarding@transactionjunction.co.za</span>
            </p>
            <Button variant="outline" className="mt-2" asChild>
              <a href="/">← Back to Admin</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <WizardLayout currentStep={currentStep}>
      {/* Step 0: Business Details */}
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
              Next: Documents <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* Step 1: Documents */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Documents</h2>
            <p className="text-sm text-muted-foreground">Upload required documents for each company. You can upload documents directly on each company card.</p>
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

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => goTo(0)} size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => goTo(2)} size="lg">
              Next: Terms of Use <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Terms */}
      {currentStep === 2 && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Terms of Use</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted rounded-lg p-6 max-h-64 overflow-y-auto text-sm text-muted-foreground space-y-4">
                <p><strong>1. Acceptance of Terms</strong><br />By accessing and using Transaction Junction's payment processing services, you agree to be bound by these terms and conditions.</p>
                <p><strong>2. Service Description</strong><br />Transaction Junction provides electronic payment processing services including card payments, QR payments, and related financial services.</p>
                <p><strong>3. Merchant Obligations</strong><br />The merchant agrees to maintain accurate business information, comply with PCI-DSS standards, and process transactions in accordance with card scheme rules.</p>
                <p><strong>4. Data Protection</strong><br />All personal and transactional data will be processed in accordance with the Protection of Personal Information Act (POPIA) and applicable data protection regulations.</p>
                <p><strong>5. Settlement</strong><br />Transaction funds will be settled to the nominated bank account within the agreed settlement period, subject to fraud checks and compliance verification.</p>
                <p><strong>6. Termination</strong><br />Either party may terminate this agreement with 30 days written notice. Transaction Junction reserves the right to suspend services immediately in cases of suspected fraud.</p>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={() => handleAcceptTerms()}
                  disabled={termsAccepted}
                />
                <label htmlFor="terms" className="text-sm cursor-pointer">
                  I have read and agree to the Terms of Use and acknowledge that my company will comply with all stated obligations.
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => goTo(1)} size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => goTo(3)} size="lg" disabled={!termsAccepted}>
              Next: Fees <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Fees */}
      {currentStep === 3 && (
        <div className="space-y-6 max-w-2xl mx-auto">
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
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium text-sm">Visa / Mastercard — Debit</p>
                    <p className="text-xs text-muted-foreground">Per transaction fee</p>
                  </div>
                  <p className="font-semibold">1.75%</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium text-sm">Visa / Mastercard — Credit</p>
                    <p className="text-xs text-muted-foreground">Per transaction fee</p>
                  </div>
                  <p className="font-semibold">2.50%</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium text-sm">American Express</p>
                    <p className="text-xs text-muted-foreground">Per transaction fee</p>
                  </div>
                  <p className="font-semibold">3.00%</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium text-sm">QR Payments</p>
                    <p className="text-xs text-muted-foreground">Per transaction fee</p>
                  </div>
                  <p className="font-semibold">1.50%</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium text-sm">Terminal Rental</p>
                    <p className="text-xs text-muted-foreground">Monthly per device</p>
                  </div>
                  <p className="font-semibold">R 250.00</p>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="font-medium text-sm">Monthly Service Fee</p>
                    <p className="text-xs text-muted-foreground">Platform access</p>
                  </div>
                  <p className="font-semibold">R 99.00</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="fees"
                  checked={feesAccepted}
                  onCheckedChange={() => handleAcceptFees()}
                  disabled={feesAccepted}
                />
                <label htmlFor="fees" className="text-sm cursor-pointer">
                  I have reviewed and accept the fee schedule above. I understand that fees may be subject to change with 30 days written notice.
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => goTo(2)} size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => handleAcceptFees()} size="lg" disabled={!feesAccepted}>
              Submit Application <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </WizardLayout>
  );
};

export default Onboarding;
