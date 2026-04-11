import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Admin from "./pages/Admin.tsx";
import OnboardingRouter from "./pages/OnboardingRouter.tsx";
import NotFound from "./pages/NotFound.tsx";
import NotDroids from "./pages/NotDroids.tsx";
import AdminLoginGate from "@/components/auth/AdminLoginGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NotDroids />} />
          <Route path="/dh38273r3geh837" element={<AdminLoginGate><Admin /></AdminLoginGate>} />
          <Route path="/onboarding/:sessionId" element={<OnboardingRouter />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
