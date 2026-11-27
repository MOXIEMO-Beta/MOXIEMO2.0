import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/ui/PageLoader";

// --- Onboarding cache (localStorage, keyed by user ID) ---
export function markOnboardingDone(userId: string) {
  try { localStorage.setItem(`moxie_ob_${userId}`, "1"); } catch { /* ignore */ }
}
function isOnboardingDone(userId: string): boolean {
  try { return localStorage.getItem(`moxie_ob_${userId}`) === "1"; } catch { return false; }
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
  const checkedRef = useRef(false);

  // Fire-and-forget: when a logged-in user doesn't have the cache set yet,
  // fetch once from DB and write the cache. Never blocks rendering.
  useEffect(() => {
    if (!requireOnboarding || !user || isOnboardingDone(user.id) || checkedRef.current) return;
    checkedRef.current = true;
    supabase
      .from("profiles")
      .select("onboarding_completed, created_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.onboarding_completed) { markOnboardingDone(user.id); return; }
        // Existing-user bypass: account pre-dates today and has a strategy.
        const created = data.created_at ? new Date(data.created_at) : null;
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
        if (created && created < startOfToday) {
          supabase.from("strategies").select("id").eq("user_id", user.id).maybeSingle()
            .then(({ data: s }) => {
              if (s) {
                supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id).then(() => {
                  markOnboardingDone(user.id);
                });
              }
            });
        }
      });
  }, [user, requireOnboarding]);

  // --- Render decision (synchronous — zero DB wait) ---
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireOnboarding && !isOnboardingDone(user.id)) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
