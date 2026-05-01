import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;

      if (profile?.onboarding_completed) {
        setNeedsOnboarding(false);
        setChecking(false);
        return;
      }

      // Existing-user bypass: pre-today account with a strategy already
      const created = profile?.created_at ? new Date(profile.created_at) : null;
      const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
      if (created && created < startOfToday) {
        const { data: strategy } = await supabase
          .from("strategies").select("id").eq("user_id", user.id).maybeSingle();
        if (strategy) {
          await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
          if (cancelled) return;
          setNeedsOnboarding(false);
          setChecking(false);
          return;
        }
      }

      setNeedsOnboarding(true);
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [user, requireOnboarding]);

  if (loading || checking) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireOnboarding && needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}