import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { BrandProvider } from "./hooks/useBrand.tsx";
import { PlanProvider } from "./hooks/usePlan.tsx";
import { UpgradeDialog } from "./components/UpgradeDialog.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";
import { CookieConsent } from "./components/CookieConsent";

// ── Eagerly loaded: critical path (landing, auth, marketing shell) ──────────
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import AppLayout from "./layouts/AppLayout.tsx";

// ── Lazy: auth sub-pages ────────────────────────────────────────────────────
const ForgotPassword    = lazy(() => import("./pages/auth/ForgotPassword.tsx"));
const ResetPassword     = lazy(() => import("./pages/auth/ResetPassword.tsx"));
const AuthCallback      = lazy(() => import("./pages/auth/Callback.tsx"));
const LinkedInCallback  = lazy(() => import("./pages/auth/LinkedInCallback.tsx"));

// ── Lazy: marketing pages ────────────────────────────────────────────────────
const Platform              = lazy(() => import("./pages/marketing/Platform.tsx"));
const Solutions             = lazy(() => import("./pages/marketing/Solutions.tsx"));
const Pricing               = lazy(() => import("./pages/marketing/Pricing.tsx"));
const Community             = lazy(() => import("./pages/marketing/Community.tsx"));
const About                 = lazy(() => import("./pages/marketing/About.tsx"));
const Blog                  = lazy(() => import("./pages/marketing/Blog.tsx"));
const Resources             = lazy(() => import("./pages/marketing/Resources.tsx"));
const Changelog             = lazy(() => import("./pages/marketing/Changelog.tsx"));
const Beta20Founding        = lazy(() => import("./pages/marketing/Beta20Founding.tsx"));
const BrandKit              = lazy(() => import("./pages/marketing/BrandKit.tsx"));
const BrandArchitectureMethod = lazy(() => import("./pages/marketing/BrandArchitectureMethod.tsx"));
const WhyMoxiemo            = lazy(() => import("./pages/marketing/WhyMoxiemo.tsx"));
const Compare               = lazy(() => import("./pages/marketing/Compare.tsx"));

// ── Lazy: blog posts ─────────────────────────────────────────────────────────
const WhyMarketingIsntWorking        = lazy(() => import("./pages/blog/WhyMarketingIsntWorking.tsx"));
const HowToKnowWhatToPost            = lazy(() => import("./pages/blog/HowToKnowWhatToPost.tsx"));
const BuildingTechPlatform           = lazy(() => import("./pages/blog/BuildingTechPlatform.tsx"));
const WhyLinkedInPostsArentLanding   = lazy(() => import("./pages/blog/WhyLinkedInPostsArentLanding.tsx"));
const AiSlopVsAiStrategy             = lazy(() => import("./pages/blog/AiSlopVsAiStrategy.tsx"));
const SixToolStack                   = lazy(() => import("./pages/blog/SixToolStack.tsx"));
const CaseForOptimism                = lazy(() => import("./pages/blog/CaseForOptimism.tsx"));
const AiEverywhereStandOut           = lazy(() => import("./pages/blog/AiEverywhereStandOut.tsx"));
const RealFounderSitsDown            = lazy(() => import("./pages/blog/RealFounderSitsDown.tsx"));
const WhyMarketingFeelsLikeSecondJob = lazy(() => import("./pages/blog/WhyMarketingFeelsLikeSecondJob.tsx"));
const AiMarketingStackAdvice         = lazy(() => import("./pages/blog/AiMarketingStackAdvice.tsx"));
const MyWebsiteCouldNotExplainMoxie  = lazy(() => import("./pages/blog/MyWebsiteCouldNotExplainMoxie.tsx"));

// ── Lazy: misc public pages ───────────────────────────────────────────────────
const Start               = lazy(() => import("./pages/start/Start"));
const FoundingRedirect    = lazy(() => import("./pages/start/FoundingRedirect").then(m => ({ default: m.FoundingRedirect })));
const AuditTest           = lazy(() => import("./pages/AuditTest.tsx"));
const AuditReportPreview  = lazy(() => import("./pages/AuditReportPreview.tsx"));
const BrandAudit          = lazy(() => import("./pages/BrandAudit.tsx"));
const BrandAuditReportPage = lazy(() => import("./pages/BrandAuditReportPage.tsx"));
const Terms               = lazy(() => import("./pages/Terms.tsx"));
const Privacy             = lazy(() => import("./pages/Privacy.tsx"));
const TextOptIn           = lazy(() => import("./pages/TextOptIn.tsx"));
const DataDeletion        = lazy(() => import("./pages/DataDeletion.tsx"));
const LegalDocument       = lazy(() => import("./pages/LegalDocument"));
const Shared              = lazy(() => import("./pages/Shared.tsx"));
const Onboarding          = lazy(() => import("./pages/onboarding/Onboarding.tsx"));

// ── Lazy: app pages (heaviest — PDF renderer, strategy, social, etc.) ────────
const Dashboard       = lazy(() => import("./pages/app/Dashboard.tsx"));
const Discovery       = lazy(() => import("./pages/app/Discovery.tsx"));
const Strategy        = lazy(() => import("./pages/app/Strategy.tsx"));
const Content         = lazy(() => import("./pages/app/Content.tsx"));
const CalendarPage    = lazy(() => import("./pages/app/Calendar.tsx"));
const Analytics       = lazy(() => import("./pages/app/Analytics.tsx"));
const Settings        = lazy(() => import("./pages/app/Settings.tsx"));
const Goals           = lazy(() => import("./pages/app/Goals.tsx"));
const Social          = lazy(() => import("./pages/app/Social.tsx"));
const Media           = lazy(() => import("./pages/app/Media.tsx"));
const Email           = lazy(() => import("./pages/app/Email.tsx"));
const BrandHub        = lazy(() => import("./pages/app/BrandHub.tsx"));
const WaitlistAdmin   = lazy(() => import("./pages/app/WaitlistAdmin.tsx"));
const PostForMeProbe  = lazy(() => import("./pages/app/PostForMeProbe.tsx"));
const Admin           = lazy(() => import("./pages/app/Admin.tsx"));

const queryClient = new QueryClient();

// Minimal fallback: white screen with no layout shift
const PageLoader = () => (
  <div style={{ minHeight: "100vh", background: "#F7F5F1" }} aria-hidden="true" />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <BrandProvider>
        <PlanProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <UpgradeDialog />
            <ScrollToTop />
            <CookieConsent />
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/start" element={<Start />} />
                <Route path="/founding" element={<FoundingRedirect />} />
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
                <Route path="/text" element={<TextOptIn />} />
                <Route path="/cookies" element={<LegalDocument />} />
                <Route path="/refunds" element={<LegalDocument />} />
                <Route path="/affiliates" element={<LegalDocument />} />
                <Route path="/data-deletion" element={<DataDeletion />} />
                <Route path="/shared/:token" element={<Shared />} />
                <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><ErrorBoundary><Onboarding /></ErrorBoundary></ProtectedRoute>} />
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
                  <Route path="admin" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </PlanProvider>
        </BrandProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
