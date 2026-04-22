import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import AppLayout from "./layouts/AppLayout.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Discovery from "./pages/app/Discovery.tsx";
import Strategy from "./pages/app/Strategy.tsx";
import Content from "./pages/app/Content.tsx";
import CalendarPage from "./pages/app/Calendar.tsx";
import Analytics from "./pages/app/Analytics.tsx";
import Settings from "./pages/app/Settings.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="discovery" element={<Discovery />} />
              <Route path="strategy" element={<Strategy />} />
              <Route path="content" element={<Content />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
