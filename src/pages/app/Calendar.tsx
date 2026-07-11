import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import CampaignCalendarTab from "@/components/calendar/CampaignCalendarTab";
import CampaignsTab from "@/components/calendar/CampaignsTab";
import IdeasTab from "@/components/calendar/IdeasTab";
import StartCampaignTab, { CampaignWizardModal } from "@/components/calendar/StartCampaignTab";
import { seedLaunchCampaign } from "@/lib/seedLaunchCampaign";

const TABS = ["start", "schedule", "campaigns", "ideas"] as const;
type TabKey = (typeof TABS)[number];
const LABELS: Record<TabKey, string> = {
  start: "Start a Campaign", schedule: "Campaign Calendar", campaigns: "Campaign Library", ideas: "Growth Ideas",
};

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("start");
  const [loading, setLoading] = useState(true);

  const [strategy, setStrategy] = useState<any>(null);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [emailSends, setEmailSends] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [socialConnections, setSocialConnections] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [executionItems, setExecutionItems] = useState<any[]>([]);

  // Sub-state to allow Plan -> Schedule navigation with a date filter
  const [scheduleAnchor, setScheduleAnchor] = useState<Date | null>(null);
  const [campaignSeed, setCampaignSeed] = useState<any>(null);

  // Global 3-step campaign wizard
  const [campaignWizardOpen, setCampaignWizardOpen] = useState(false);
  const [campaignWizardSeed, setCampaignWizardSeed] = useState<string>("");
  const openCampaign = useCallback((seedTitle?: string) => {
    setCampaignWizardSeed(seedTitle ?? "");
    setCampaignWizardOpen(true);
  }, []);
  const closeCampaign = useCallback(() => {
    setCampaignWizardOpen(false);
    setCampaignWizardSeed("");
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const r = await Promise.allSettled([
      supabase.from("strategies").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("social_posts").select("*").eq("user_id", user.id),
      supabase.from("content_items").select("*").eq("user_id", user.id),
      supabase.from("email_sends").select("*").eq("user_id", user.id),
      supabase.from("campaigns").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
      supabase.from("social_connections").select("*").eq("user_id", user.id),
      supabase.from("subscribers").select("id").eq("user_id", user.id).limit(1),
      supabase.from("calendar_ideas").select("*").eq("user_id", user.id).eq("dismissed", false).order("generated_at", { ascending: false }),
      supabase.from("campaign_execution_items").select("*").eq("user_id", user.id).order("date", { ascending: true }),
    ]);
    const get = (i: number) => r[i].status === "fulfilled" ? (r[i] as any).value?.data : null;
    setStrategy(get(0));
    setSocialPosts(get(1) ?? []);
    setContentItems(get(2) ?? []);
    setEmailSends(get(3) ?? []);
    setCampaigns(get(4) ?? []);
    setSocialConnections(get(5) ?? []);
    setSubscribers(get(6) ?? []);
    setIdeas(get(7) ?? []);
    setExecutionItems(get(8) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Lane 3 seed: once per strategy, insert a launch campaign + execution items.
  // Guarded by enhanced_foundation.launchCampaignSeeded inside the helper.
  const seedRanRef = useRef(false);
  useEffect(() => {
    if (!user || !strategy) return;
    if (strategy.strategy_lane !== "offer_gtm") return;
    if (strategy.enhanced_foundation?.launchCampaignSeeded === true) return;
    if (seedRanRef.current) return;
    seedRanRef.current = true;
    let cancelled = false;
    (async () => {
      const res = await seedLaunchCampaign(strategy, user.id);
      if (!cancelled && res.seeded) {
        void refresh();
      } else if (!res.seeded && res.reason && res.reason !== "already_seeded" && res.reason !== "already_seeded_fresh" && res.reason !== "in_flight" && res.reason !== "wrong_lane" && res.reason !== "missing_inputs") {
        // Real failure (insert/rollback). Allow a retry on next mount.
        seedRanRef.current = false;
      }
    })();
    return () => { cancelled = true; };
  }, [user, strategy, refresh]);

  const activeCampaigns = useMemo(
    () => (campaigns ?? []).filter((c: any) => !c?.archived),
    [campaigns]
  );
  const archivedIds = useMemo(
    () => new Set((campaigns ?? []).filter((c: any) => c?.archived).map((c: any) => c.id)),
    [campaigns]
  );
  const activeExecutionItems = useMemo(
    () => (executionItems ?? []).filter((it: any) => !archivedIds.has(it.campaign_id)),
    [executionItems, archivedIds]
  );

  const ctx = useMemo(() => ({
    strategy, socialPosts, contentItems, emailSends,
    campaigns: activeCampaigns,
    allCampaigns: campaigns,
    executionItems: activeExecutionItems,
    socialConnections, subscribers, ideas, loading, refresh,
    user, navigate,
    setTab, setScheduleAnchor, setCampaignSeed,
    scheduleAnchor, campaignSeed,
    openCampaign,
  }), [strategy, socialPosts, contentItems, emailSends, campaigns, activeCampaigns, activeExecutionItems, socialConnections, subscribers, ideas, loading, refresh, user, navigate, scheduleAnchor, campaignSeed, openCampaign]);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0E0F10", letterSpacing: "-0.3px", marginBottom: 6 }}>
            Campaign Planner
          </h1>
          <p style={{ fontSize: 14, color: "#6B6860" }}>
            Plan campaigns, schedule content, and grow across every channel.
          </p>
        </div>
        <button
          onClick={() => openCampaign()}
          className="shrink-0 inline-flex items-center gap-1 text-white transition-colors"
          style={{ background: "#E85A46", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600 }}
        >
          + Create campaign
        </button>
      </div>

      {/* Tab nav */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors relative",
                tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {LABELS[t]}
              {tab === t && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent" />}
            </button>
          ))}
        </div>
      </div>

      {tab === "start" && <StartCampaignTab ctx={ctx} />}
      {tab === "schedule" && <CampaignCalendarTab ctx={ctx} />}
      {tab === "campaigns" && <CampaignsTab ctx={ctx} />}
      {tab === "ideas" && <IdeasTab ctx={ctx} />}

      {campaignWizardOpen && (
        <CampaignWizardModal
          strategy={strategy}
          seedTitle={campaignWizardSeed}
          user={user}
          onClose={closeCampaign}
          onCreated={() => {
            closeCampaign();
            setTab("campaigns");
            void refresh();
          }}
        />
      )}
    </div>
  );
}
