import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/ui/PageLoader";

function onboardingCacheKey(userId: string) {
  return `moxie_ob_done_${userId}`;
}
function isCachedDone(userId: string): boolean {
  try { return localStorage.getItem(onboardingCacheKey(userId)) === "1"; } catch { return false; }
}
function setCachedDone(userId: string) {
  try { localStorage.setItem(onboardingCacheKey(userId), "1"); } catch { /* ignore */ }
}

export function ProtectedRoute({
  children,
  requireOnboarding = true,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If this user already completed onboarding (cached in localStorage), skip DB check entirely.
  const alreadyDone = requireOnboarding && user ? isCachedDone(user.id) : false;
  const [checking, setChecking] = useState(requireOnboarding && !alreadyDone);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!requireOnboarding) { setChecking(false); return; }
    if (!user) { setChecking(false); return; }
    // Cache hit — skip the DB round-trip entirely.
    if (isCachedDone(user.id)) { setChecking(false); return; }

    let cancelled = false;

    // Hard timeout — never hang longer than 3s regardless of DB latency.
    const timeout = setTimeout(() => {
      if (!cancelled) { setChecking(false); }
    }, 3000);

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
          setCachedDone(user.id);
          setNeedsOnboarding(false);
          setChecking(false);
          return;
        }

        // Existing-user bypass: pre-today account with a strategy already.
        const created = profile.created_at ? new Date(profile.created_at) : null;
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
        if (created && created < startOfToday) {
          const { data: strategy } = await supabase
            .from("strategies").select("id").eq("user_id", user.id).maybeSingle();
          if (!cancelled && strategy) {
            await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
            if (!cancelled) {
              setCachedDone(user.id);
              setNeedsOnboarding(false);
              setChecking(false);
              return;
            }
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