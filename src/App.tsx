import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import ForgotPassword from "./pages/auth/ForgotPassword.tsx";
import ResetPassword from "./pages/auth/ResetPassword.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import LinkedInCallback from "./pages/auth/LinkedInCallback.tsx";
import Platform from "./pages/marketing/Platform.tsx";
import Solutions from "./pages/marketing/Solutions.tsx";
import WhyMoxie from "./pages/marketing/WhyMoxie.tsx";
import Pricing from "./pages/marketing/Pricing.tsx";
import Community from "./pages/marketing/Community.tsx";
import About from "./pages/marketing/About.tsx";
import Blog from "./pages/marketing/Blog.tsx";
import WhyMarketingIsntWorking from "./pages/blog/WhyMarketingIsntWorking.tsx";
import HowToKnowWhatToPost from "./pages/blog/HowToKnowWhatToPost.tsx";
import BuildingTechPlatform from "./pages/blog/BuildingTechPlatform.tsx";
import WhyLinkedInPostsArentLanding from "./pages/blog/WhyLinkedInPostsArentLanding.tsx";
import AiSlopVsAiStrategy from "./pages/blog/AiSlopVsAiStrategy.tsx";
import SixToolStack from "./pages/blog/SixToolStack.tsx";
import CaseForOptimism from "./pages/blog/CaseForOptimism.tsx";
import Resources from "./pages/marketing/Resources.tsx";
import Changelog from "./pages/marketing/Changelog.tsx";
import Founding from "./pages/marketing/Founding.tsx";
import BrandKit from "./pages/marketing/BrandKit.tsx";
import AuditTest from "./pages/AuditTest.tsx";
import AuditReportPreview from "./pages/AuditReportPreview.tsx";
import AppLayout from "./layouts/AppLayout.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Discovery from "./pages/app/Discovery.tsx";
import Strategy from "./pages/app/Strategy.tsx";
import Content from "./pages/app/Content.tsx";
import CalendarPage from "./pages/app/Calendar.tsx";
import Analytics from "./pages/app/Analytics.tsx";
import Settings from "./pages/app/Settings.tsx";
import ComingSoon from "./pages/app/ComingSoon.tsx";
import Goals from "./pages/app/Goals.tsx";
import Social from "./pages/app/Social.tsx";
import Email from "./pages/app/Email.tsx";
import WaitlistAdmin from "./pages/app/WaitlistAdmin.tsx";
import Onboarding from "./pages/onboarding/Onboarding.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { PlanProvider } from "./hooks/usePlan.tsx";
import { UpgradeDialog } from "./components/UpgradeDialog.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import DataDeletion from "./pages/DataDeletion.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <PlanProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <UpgradeDialog />
            <ScrollToTop />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/why-moxie" element={<WhyMoxie />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/community" element={<Community />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/why-marketing-isnt-working" element={<WhyMarketingIsntWorking />} />
            <Route path="/blog/how-to-know-what-to-post" element={<HowToKnowWhatToPost />} />
            <Route path="/blog/building-a-tech-platform-at-peak-of-ai" element={<BuildingTechPlatform />} />
            <Route path="/blog/why-linkedin-posts-arent-landing" element={<WhyLinkedInPostsArentLanding />} />
            <Route path="/blog/ai-slop-vs-ai-strategy" element={<AiSlopVsAiStrategy />} />
            <Route path="/blog/six-tool-stack-killing-productivity" element={<SixToolStack />} />
            <Route path="/blog/case-for-optimism-best-time-to-build" element={<CaseForOptimism />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/founding" element={<Founding />} />
            <Route path="/brand-kit" element={<BrandKit />} />
            <Route path="/audit-test" element={<AuditTest />} />
            <Route path="/audit-report-preview" element={<AuditReportPreview />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/data-deletion" element={<DataDeletion />} />
            <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="discovery" element={<ErrorBoundary><Discovery /></ErrorBoundary>} />
              <Route path="strategy" element={<ErrorBoundary><Strategy /></ErrorBoundary>} />
              <Route path="content" element={<ErrorBoundary><Content /></ErrorBoundary>} />
              <Route path="calendar" element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
              <Route path="analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
              <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
              <Route path="goals" element={<ErrorBoundary><Goals /></ErrorBoundary>} />
              <Route path="email" element={<ErrorBoundary><Email /></ErrorBoundary>} />
              <Route path="social" element={<ErrorBoundary><Social /></ErrorBoundary>} />
              <Route path="admin/waitlist" element={<ErrorBoundary><WaitlistAdmin /></ErrorBoundary>} />
            </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </PlanProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
