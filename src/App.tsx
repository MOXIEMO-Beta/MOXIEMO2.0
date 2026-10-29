import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import AiEverywhereStandOut from "./pages/blog/AiEverywhereStandOut.tsx";
import RealFounderSitsDown from "./pages/blog/RealFounderSitsDown.tsx";
import WhyMarketingFeelsLikeSecondJob from "./pages/blog/WhyMarketingFeelsLikeSecondJob.tsx";
import AiMarketingStackAdvice from "./pages/blog/AiMarketingStackAdvice.tsx";
import MyWebsiteCouldNotExplainMoxie from "./pages/blog/MyWebsiteCouldNotExplainMoxie.tsx";
import Resources from "./pages/marketing/Resources.tsx";
import Changelog from "./pages/marketing/Changelog.tsx";
import Founding from "./pages/marketing/Founding.tsx";
import Beta20Founding from "./pages/marketing/Beta20Founding.tsx";
import BrandKit from "./pages/marketing/BrandKit.tsx";
import BrandArchitectureMethod from "./pages/marketing/BrandArchitectureMethod.tsx";
import WhyMoxiemo from "./pages/marketing/WhyMoxiemo.tsx";
import Compare from "./pages/marketing/Compare.tsx";
import AuditTest from "./pages/AuditTest.tsx";
import AuditReportPreview from "./pages/AuditReportPreview.tsx";
import BrandAudit from "./pages/BrandAudit.tsx";
import BrandAuditReportPage from "./pages/BrandAuditReportPage.tsx";
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
import Media from "./pages/app/Media.tsx";
import Email from "./pages/app/Email.tsx";
import BrandHub from "./pages/app/BrandHub.tsx";
import WaitlistAdmin from "./pages/app/WaitlistAdmin.tsx";
import PostForMeProbe from "./pages/app/PostForMeProbe.tsx";
import Onboarding from "./pages/onboarding/Onboarding.tsx";
import Shared from "./pages/Shared.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { PlanProvider } from "./hooks/usePlan.tsx";
import { UpgradeDialog } from "./components/UpgradeDialog.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import DataDeletion from "./pages/DataDeletion.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";
import { CookieConsent } from "./components/CookieConsent";

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
            <CookieConsent />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/why-moxie" element={<Navigate to="/why-moxiemo" replace />} />
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
            <Route path="/blog/ai-everywhere-how-you-stand-out" element={<AiEverywhereStandOut />} />
            <Route path="/blog/what-happens-when-a-real-founder-sits-down-with-your-product" element={<RealFounderSitsDown />} />
            <Route path="/blog/why-your-marketing-feels-like-a-second-job" element={<WhyMarketingFeelsLikeSecondJob />} />
           <Route path="/blog/ai-marketing-stack-advice-solo-founders" element={<AiMarketingStackAdvice />} />
            <Route path="/blog/my-website-could-not-explain-moxie" element={<MyWebsiteCouldNotExplainMoxie />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/founding" element={<Founding />} />
            <Route path="/beta20-founding" element={<Beta20Founding />} />
            <Route path="/brand-kit" element={<BrandKit />} />
            <Route path="/brand-architecture-method" element={<BrandArchitectureMethod />} />
            <Route path="/why-moxiemo" element={<WhyMoxiemo />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/compare/:slug" element={<Compare />} />
            <Route path="/audit-test" element={<AuditTest />} />
            <Route path="/audit-report-preview" element={<AuditReportPreview />} />
            <Route path="/brand-audit" element={<BrandAudit />} />
            <Route path="/brand-audit/r/:id" element={<BrandAuditReportPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/data-deletion" element={<DataDeletion />} />
            <Route path="/shared/:token" element={<Shared />} />
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
              <Route path="media" element={<ErrorBoundary><Media /></ErrorBoundary>} />
              <Route path="brand-hub" element={<ErrorBoundary><BrandHub /></ErrorBoundary>} />
              <Route path="admin/waitlist" element={<ErrorBoundary><WaitlistAdmin /></ErrorBoundary>} />
              <Route path="admin/postforme-probe" element={<ErrorBoundary><PostForMeProbe /></ErrorBoundary>} />
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
