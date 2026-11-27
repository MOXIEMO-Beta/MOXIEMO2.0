import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/ui/PageLoader";

export function ProtectedRoute({
  children,
  requireOnboarding = true,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(requireOnboarding);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!requireOnboarding) { setChecking(false); return; }
    if (!user) { setChecking(false); return; }
    let cancelled = false;

    // Hard timeout — never hang forever
    const timeout = setTimeout(() => {
      if (!cancelled) { setChecking(false); }
    }, 5000);

    (async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_completed, created_at")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;

        if (profileError || !profile) {
          setNeedsOnboarding(true);
          setChecking(false);
          return;
        }

        if (profile.onboarding_completed) {
          setNeedsOnboarding(false);
          setChecking(false);
          return;
        }

        // Existing-user bypass: pre-today account with a strategy already
        const created = profile.created_at ? new Date(profile.created_at) : null;
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
        if (created && created < startOfToday) {
          const { data: strategy } = await supabase
            .from("strategies").select("id").eq("user_id", user.id).maybeSingle();
          if (!cancelled && strategy) {
            await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
            if (!cancelled) { setNeedsOnboarding(false); setChecking(false); return; }
          }
        }

        if (!cancelled) { setNeedsOnboarding(true); setChecking(false); }
      } catch {
        if (!cancelled) { setChecking(false); }
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [user, requireOnboarding]);

  if (loading || checking) return <PageLoader />;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireOnboarding && needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}