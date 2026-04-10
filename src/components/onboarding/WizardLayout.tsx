import { ReactNode } from "react";
import { CheckCircle } from "lucide-react";
import tjLogo from "@/assets/tj-logo.png";

interface Step {
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { label: "Business Details", description: "Companies, contacts & stores" },
  { label: "Terms of Use", description: "Review and accept terms" },
  { label: "Fees", description: "Review and accept fees" },
];

interface WizardLayoutProps {
  currentStep: number;
  children: ReactNode;
}

const WizardLayout = ({ currentStep, children }: WizardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md flex items-center gap-4">
        <img src={tjLogo} alt="Transaction Junction" className="h-8 brightness-0 invert" />
        <span className="text-xl font-semibold tracking-tight">Merchant Onboarding</span>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stepper */}
        <nav className="mb-10">
          <ol className="flex items-center gap-2">
            {STEPS.map((step, idx) => {
              const isComplete = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isFuture = idx > currentStep;

              return (
                <li key={idx} className="flex-1">
                  <div className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isCurrent ? "bg-primary/10 border border-primary/30" :
                    isComplete ? "bg-success/10 border border-success/30" :
                    "bg-muted border border-transparent"
                  }`}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${
                      isComplete ? "bg-success text-success-foreground" :
                      isCurrent ? "bg-primary text-primary-foreground" :
                      "bg-muted-foreground/30 text-muted-foreground"
                    }`}>
                      {isComplete ? <CheckCircle className="h-5 w-5" /> : idx + 1}
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <p className={`text-sm font-medium truncate ${isFuture ? "text-muted-foreground" : ""}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        {children}
      </div>
    </div>
  );
};

export default WizardLayout;
