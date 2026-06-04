import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import PlanTab from "@/components/calendar/PlanTab";
import ScheduleTab from "@/components/calendar/ScheduleTab";
import CampaignsTab from "@/components/calendar/CampaignsTab";
import IdeasTab from "@/components/calendar/IdeasTab";

const TABS = ["plan", "schedule", "campaigns", "ideas"] as const;
type TabKey = (typeof TABS)[number];
const LABELS: Record<TabKey, string> = {
  plan: "Campaign Plan", schedule: "Content Schedule", campaigns: "Campaigns", ideas: "Growth Ideas",
};

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("plan");
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

  const ctx = useMemo(() => ({
    strategy, socialPosts, contentItems, emailSends, campaigns, executionItems,
    socialConnections, subscribers, ideas, loading, refresh,
    user, navigate,
    setTab, setScheduleAnchor, setCampaignSeed,
    scheduleAnchor, campaignSeed,
  }), [strategy, socialPosts, contentItems, emailSends, campaigns, executionItems, socialConnections, subscribers, ideas, loading, refresh, user, navigate, scheduleAnchor, campaignSeed]);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-4xl mb-2">Marketing Planner</h1>
        <p className="text-muted-foreground">Plan campaigns, schedule content, and grow across every channel.</p>
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

      {tab === "plan" && <PlanTab ctx={ctx} />}
      {tab === "schedule" && <ScheduleTab ctx={ctx} />}
      {tab === "campaigns" && <CampaignsTab ctx={ctx} />}
      {tab === "ideas" && <IdeasTab ctx={ctx} />}
    </div>
  );
}
