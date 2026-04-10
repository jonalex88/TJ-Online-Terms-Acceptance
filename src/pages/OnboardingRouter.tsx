import { useParams } from "react-router-dom";
import { getSession } from "@/lib/onboarding-store";
import Onboarding from "./Onboarding";
import OnboardingBulk from "./OnboardingBulk";
import { Card, CardContent } from "@/components/ui/card";

const OnboardingRouter = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  if (!sessionId) {
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

  const session = getSession(sessionId);
  const isBulkDeal = session?.bulkDeal ?? false;

  return isBulkDeal ? <OnboardingBulk /> : <Onboarding />;
};

export default OnboardingRouter;
