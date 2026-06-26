import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Plus, Target, Sparkles, Loader2, Pause, CheckCircle2, MoreHorizontal, CalendarDays, Linkedin, Mail, Instagram, Facebook, ChevronLeft, ChevronRight, Megaphone, Search, Archive, Trash2, ArchiveRestore } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { aiErrorMessage } from "@/lib/aiErrors";
import { usePlan } from "@/hooks/usePlan";
import { asArray, fmtShort, ymd, generateCampaignSlots, campaignSlotProgress, campaignSlotCounts, generateExecutionItems } from "./helpers";

const TYPES = [
  { value: "quarterly", label: "Quarterly theme" },
  { value: "launch", label: "Product/offer launch" },
  { value: "event", label: "Event promotion" },
  { value: "visibility", label: "Visibility push" },
  { value: "custom", label: "Custom" },
];

const TEMPLATES = [
  { id: "q-theme", name: "Q2 Theme Campaign", weeks: 12, channels: ["linkedin", "email"], type: "quarterly" },
  { id: "launch", name: "Product Launch", weeks: 6, channels: ["linkedin", "email", "instagram"], type: "launch" },
  { id: "vis", name: "Visibility Push", weeks: 4, channels: ["linkedin", "email"], type: "visibility" },
];

const STATUS_BADGE: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  active: "bg-accent-soft text-accent",
  completed: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
};

const COLOR_PALETTE = [
  { name: "Coral", value: "#F97066" },
  { name: "Navy", value: "#1A2744" },
  { name: "Teal", value: "#0D9488" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Violet", value: "#7C3AED" },
  { name: "Sky", value: "#0EA5E9" },
  { name: "Rose", value: "#E11D48" },
  { name: "Sage", value: "#4D7C0F" },
];

type GoalType = "awareness" | "leadgen" | "thought" | "engagement";

const GOAL_KEYWORDS: Record<GoalType, string[]> = {
  leadgen: ["lead", "sale", "revenue", "client", "booking", "call", "conversion", "discovery"],
  thought: ["authority", "expertise", "thought leader", "credibility", "position", "known"],
  engagement: ["engagement", "community", "connection", "conversation", "relationship"],
  awareness: ["awareness", "visibility", "reach", "grow", "audience", "follower", "brand"],
};

const GOAL_LABEL: Record<GoalType, string> = {
  awareness: "awareness",
  leadgen: "lead generation",
  thought: "thought leadership",
  engagement: "engagement",
};

const CADENCE: Record<GoalType, Record<string, number>> = {
  awareness:   { linkedin: 4, email: 1, instagram: 5, facebook: 3 },
  leadgen:     { linkedin: 5, email: 2, instagram: 3, facebook: 2 },
  thought:     { linkedin: 5, email: 1, instagram: 3, facebook: 2 },
  engagement:  { linkedin: 3, email: 1, instagram: 5, facebook: 4 },
};

const RATIONALE: Record<string, Record<GoalType, string>> = {
  linkedin: {
    awareness: "LinkedIn rewards consistency. Daily posting builds compound visibility over the campaign window.",
    leadgen: "Higher frequency on LinkedIn drives more touchpoints with decision-makers in your ICP.",
    thought: "Daily presence on LinkedIn is the single highest-leverage action for positioning.",
    engagement: "3x per week gives your audience time to engage before the next post lands.",
  },
  email: {
    awareness: "One email per week keeps you present without overwhelming your list.",
    leadgen: "2x per week during a campaign creates urgency and nurtures intent.",
    thought: "A weekly email builds the habit of your audience reading you.",
    engagement: "Consistent weekly sends outperform sporadic high-volume sends every time.",
  },
  instagram: {
    awareness: "5x per week maximizes Reels and feed reach during the campaign window.",
    leadgen: "3x per week with strong CTAs keeps the channel focused on conversion.",
    thought: "Mix carousel posts with short-form video to establish expertise on the platform.",
    engagement: "Daily posting signals to the algorithm that your account is active and rewards reach.",
  },
  facebook: {
    awareness: "3x per week is the recommended baseline for organic Facebook reach.",
    leadgen: "Focus on value-led posts that drive clicks rather than high raw frequency.",
    thought: "2x per week with long-form content performs better than frequent short posts.",
    engagement: "4x per week keeps your community active and the algorithm rewarding your posts.",
  },
};

function classifyGoal(text: string): GoalType {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return "awareness";
  for (const type of ["leadgen", "thought", "engagement", "awareness"] as GoalType[]) {
    if (GOAL_KEYWORDS[type].some((k) => t.includes(k))) return type;
  }
  return "awareness";
}

const DEFAULT_CMO_TEXT = "Based on your goal, consistency matters more than volume. Start with your strongest channel and build cadence before expanding.";

const CAMPAIGN_TYPE_CARDS: Array<{
  key: string;
  icon: string;
  label: string;
  description: string;
  typeValue: string;
  keywords: string[];
  mode?: "organic" | "paid";
  adPlatform?: "meta" | "google";
}> = [
  {
    key: "leadgen",
    icon: "🎯",
    label: "Lead Generation",
    description: "Fill your pipeline with qualified prospects ready to buy.",
    typeValue: "launch",
    keywords: ["revenue", "lead", "client", "sale", "pipeline", "booking", "discovery"],
  },
  {
    key: "audience",
    icon: "📣",
    label: "Audience Awareness",
    description: "Reach new people who need what you do but do not know you yet.",
    typeValue: "visibility",
    keywords: ["awareness", "reach", "audience", "follower", "grow", "visibility"],
  },
  {
    key: "bizdev",
    icon: "💼",
    label: "Business Development",
    description: "Open doors to partnerships, referrals, and strategic relationships.",
    typeValue: "custom",
    keywords: ["partnership", "referral", "relationship", "network", "bizdev"],
  },
  {
    key: "brand",
    icon: "🏷",
    label: "Brand Awareness",
    description: "Make your name the one people think of first in your category.",
    typeValue: "visibility",
    keywords: ["awareness", "reach", "audience", "brand", "recognition"],
  },
  {
    key: "sales",
    icon: "💰",
    label: "Sales Campaign",
    description: "Drive direct revenue from your existing audience and warm leads.",
    typeValue: "launch",
    keywords: ["revenue", "lead", "client", "sale", "promo", "offer"],
  },
  {
    key: "meta_ads",
    icon: "📣",
    label: "Meta Ads Campaign",
    description: "Run a paid campaign on Facebook and Instagram. MOXIEMO builds the ad creative brief anchored to your strategy.",
    typeValue: "launch",
    keywords: [],
    mode: "paid",
    adPlatform: "meta",
  },
  {
    key: "google_ads",
    icon: "🔍",
    label: "Google Ads Campaign",
    description: "Capture search intent with Google. MOXIEMO writes your headlines, descriptions, and ad variations.",
    typeValue: "launch",
    keywords: [],
    mode: "paid",
    adPlatform: "google",
  },
];

const REVENUE_KEYWORDS = ["revenue", "lead", "client", "sale", "pipeline", "booking"];
const AWARENESS_KEYWORDS = ["awareness", "reach", "audience", "follower", "visibility"];

const BUDGET_OPTIONS = [
  "Under $25/day",
  "$25 to $50/day",
  "$50 to $100/day",
  "$100 to $250/day",
  "$250+/day",
];

const META_CMO = "Paid Meta campaigns perform best when you test 2-3 creative variations in week one. Start with a lead generation objective targeting your warm audience before scaling to cold.";
const GOOGLE_CMO = "Search campaigns work best with tightly grouped ad sets per keyword theme. Start with 3 headlines and 2 descriptions per ad group and let Google optimize.";

export default function CampaignsTab({ ctx }: { ctx: any }) {
  const { allCampaigns, campaigns: activeCampaigns, strategy, refresh, user, campaignSeed, setCampaignSeed, setTab, openCampaign } = ctx;
  const sourceCampaigns = allCampaigns ?? activeCampaigns ?? [];
  const [openNew, setOpenNew] = useState(false);
  const [openDetail, setOpenDetail] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);

  const visibleCampaigns = sourceCampaigns.filter((c: any) =>
    showArchived ? c?.archived : !c?.archived
  );
  const archivedCount = sourceCampaigns.filter((c: any) => c?.archived).length;

  // Open new flow if seeded from Plan tab
  useEffect(() => { if (campaignSeed) { setOpenNew(true); } }, [campaignSeed]);

  return (
    <div>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Organize your marketing by initiative.</p>
          <p style={{ fontSize: 13, color: "#9A9896", marginTop: 4, marginBottom: 0, maxWidth: 640 }}>
            Your campaign history lives here. Every campaign you plan with MOXIEMO — active, completed, or archived — is stored here for reference and reactivation.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
          </label>
        </div>
      </div>
      <div style={{ height: 20 }} />

      {visibleCampaigns.length === 0 ? (
        <Card className="p-10 border-dashed border-border text-center max-w-2xl mx-auto">
          <Target className="w-12 h-12 text-accent mx-auto mb-3" />
          <h3 className="font-display text-xl mb-1">
            {showArchived ? "No archived campaigns" : "No campaigns yet"}
          </h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
            {showArchived
              ? "Campaigns you archive will appear here. They stay out of your active view and calendar but are never deleted."
              : "Campaigns help you organize your marketing around specific goals and themes — launches, quarterly focuses, or any initiative."}
          </p>
          {!showArchived && (
            <>
              <Button onClick={() => openCampaign?.()}><Plus className="w-4 h-4" /> Create your first campaign</Button>
              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Or start from a template</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {TEMPLATES.map(t => (
                    <Button key={t.id} variant="outline" size="sm" onClick={() => openCampaign?.(t.name)}>
                      {t.name}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visibleCampaigns.map((c: any) => (
            <CampaignLibraryCard key={c.id} c={c} onOpen={() => setOpenDetail(c)} onChanged={() => void refresh()} />
          ))}
        </div>
      )}

      <NewCampaignFlow
        open={openNew}
        onClose={() => { setOpenNew(false); setCampaignSeed(null); }}
        seed={campaignSeed}
        strategy={strategy}
        user={user}
        onCreated={() => { void refresh(); setOpenNew(false); setCampaignSeed(null); }}
      />

      <Sheet open={!!openDetail} onOpenChange={(o) => !o && setOpenDetail(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {openDetail && <CampaignDetail c={openDetail} ctx={ctx} onChanged={() => { void refresh(); setOpenDetail(null); }} setTab={setTab} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CampaignLibraryCard({ c, onOpen, onChanged }: { c: any; onOpen: () => void; onChanged: () => void }) {
  const { openCampaign } = (useCalendarLibraryCtx() as any) || {};
  const color = c.color || "#E85A46";
  const pillars: string[] = Array.isArray(c.pillars) ? c.pillars : [];
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  async function archiveCampaign() {
    setMenuOpen(false);
    const { error } = await supabase.from("campaigns").update({ status: "archived", archived: true }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    onChanged();
    let undone = false;
    toast("Campaign archived.", {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: async () => {
          undone = true;
          const { error: e2 } = await supabase
            .from("campaigns")
            .update({ status: c.status || "active", archived: false })
            .eq("id", c.id);
          if (e2) { toast.error(e2.message); return; }
          onChanged();
        },
      },
    });
    void undone;
  }

  async function deleteCampaign() {
    await supabase.from("campaign_execution_items").delete().eq("campaign_id", c.id);
    const { error } = await supabase.from("campaigns").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    setConfirmDelete(false);
    setMenuOpen(false);
    onChanged();
    toast("Campaign deleted.");
  }

  const fmtDate = (d: any) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return ""; }
  };
  const dateRange = c.start_date || c.end_date
    ? `${fmtDate(c.start_date)}${c.start_date && c.end_date ? " – " : ""}${fmtDate(c.end_date)}`
    : "";
  const status = (c.status || "active") as string;
  const isArchived = !!c.archived;
  const statusLabel = isArchived ? "Archived" : (status.charAt(0).toUpperCase() + status.slice(1));
  const statusColors = isArchived
    ? { bg: "#F5F4F0", fg: "#6B6860" }
    : status === "active"
      ? { bg: "#F0FDF4", fg: "#16A34A" }
      : status === "completed"
        ? { bg: "#EFF6FF", fg: "#2563EB" }
        : { bg: "#FEF3C7", fg: "#B45309" };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ECEAE5",
        borderRadius: 14,
        padding: "20px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        position: "relative",
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#15171C" }}>{c.name}</div>
        {c.campaign_type && (
          <div style={{ fontSize: 12, color: "#9A9896", marginTop: 2 }}>{c.campaign_type}</div>
        )}
        {dateRange && (
          <div style={{ fontSize: 12, color: "#9A9896" }}>{dateRange}</div>
        )}
        {pillars.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {pillars.map((p) => (
              <span key={p} style={{ background: "#F0EFEC", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#6B6860" }}>{p}</span>
            ))}
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <span style={{ background: statusColors.bg, color: statusColors.fg, fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 8px" }}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, position: "relative" }} ref={menuRef}>
        <button
          type="button"
          onClick={onOpen}
          style={{ border: "1px solid #ECEAE5", borderRadius: 8, fontSize: 12, padding: "6px 14px", color: "#15171C", background: "#fff", cursor: "pointer" }}
        >
          View
        </button>
        <button
          type="button"
          aria-label="More"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setConfirmDelete(false); }}
          style={{ background: "transparent", border: "none", color: "#9A9896", cursor: "pointer", padding: 4, lineHeight: 1 }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              background: "#fff",
              border: "1px solid #ECEAE5",
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              minWidth: 200,
              zIndex: 20,
              overflow: "hidden",
            }}
          >
            {!confirmDelete ? (
              <>
                <MenuRow onClick={() => { setMenuOpen(false); openCampaign?.(c.name); }}>Edit campaign</MenuRow>
                <div style={{ height: 1, background: "#ECEAE5" }} />
                <MenuRow onClick={archiveCampaign}>Archive campaign</MenuRow>
                <MenuRow danger onClick={() => setConfirmDelete(true)}>Delete campaign</MenuRow>
              </>
            ) : (
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 13, color: "#15171C", marginBottom: 10 }}>
                  Delete this campaign? This cannot be undone.
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    style={{ background: "#F0EFEC", color: "#15171C", border: "none", borderRadius: 6, fontSize: 12, padding: "6px 12px", cursor: "pointer" }}
                  >Cancel</button>
                  <button
                    type="button"
                    onClick={deleteCampaign}
                    style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, padding: "6px 12px", cursor: "pointer" }}
                  >Delete</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuRow({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      role="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        padding: "10px 16px",
        fontSize: 13,
        color: danger ? "#DC2626" : "#15171C",
        background: hover ? (danger ? "#FEF2F2" : "#F7F5F1") : "#fff",
        cursor: "pointer",
      }}
    >
      {children}
    </div>
  );
}

// Lightweight context hook to access openCampaign without prop-drilling
const CalendarLibraryCtx = (typeof window !== "undefined" ? ((window as any).__moxiemoCalCtx ||= {}) : {}) as { current?: any };
function useCalendarLibraryCtx() { return CalendarLibraryCtx.current; }

function CampaignCard({ c, ctx, onOpen, onChanged }: any) {
  const counts = campaignSlotCounts(c);
  const { pct, filled, total } = campaignSlotProgress(c);
  const channels = c.channels ?? [];
  const color = c.color || "#F97066";
  const isArchived = !!c.archived;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleArchive() {
    setBusy(true);
    const { error } = await supabase
      .from("campaigns")
      .update({ archived: !isArchived })
      .eq("id", c.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isArchived ? "Campaign restored" : "Campaign archived");
    onChanged?.();
  }

  async function deleteCampaign() {
    setBusy(true);
    const { error: execErr } = await supabase
      .from("campaign_execution_items")
      .delete()
      .eq("campaign_id", c.id);
    if (execErr) { setBusy(false); toast.error(execErr.message); return; }
    const { error } = await supabase.from("campaigns").delete().eq("id", c.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Campaign deleted");
    setConfirmDelete(false);
    onChanged?.();
  }

  const summaryParts: string[] = [];
  if (counts.linkedin) summaryParts.push(`${counts.linkedin} linkedin`);
  if (counts.email) summaryParts.push(`${counts.email} email`);
  if (counts.instagram) summaryParts.push(`${counts.instagram} instagram`);
  if (counts.facebook) summaryParts.push(`${counts.facebook} facebook`);
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") : "0 posts scheduled";

  return (
    <Card
      className="p-5 shadow-soft border-border border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-display text-lg flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          {c.name}
          {isArchived && (
            <Badge variant="outline" className="text-[10px] font-normal">Archived</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge className={STATUS_BADGE[c.status] ?? "bg-muted"}>{c.status}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Campaign actions"
                disabled={busy}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={toggleArchive} disabled={busy}>
                {isArchived ? (
                  <><ArchiveRestore className="w-4 h-4" /> Restore campaign</>
                ) : (
                  <><Archive className="w-4 h-4" /> Archive campaign</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-[hsl(var(--accent))] focus:text-[hsl(var(--accent))]"
                disabled={busy}
              >
                <Trash2 className="w-4 h-4" /> Delete campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        {c.start_date ? fmtShort(new Date(c.start_date)) : "—"} – {c.end_date ? fmtShort(new Date(c.end_date)) : "—"}
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        {pct}% of slots filled {total > 0 && <span>· {filled}/{total}</span>}
      </div>
      <div className="flex gap-1 flex-wrap mb-3">
        {channels.map((ch: string) => <Badge key={ch} variant="outline" className="text-[10px]">{ch}</Badge>)}
      </div>
      <div className="text-xs text-muted-foreground mb-4">{summary}</div>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={onOpen}>Open campaign <ArrowRight className="w-3 h-3" /></Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (c.start_date) ctx.setScheduleAnchor(new Date(c.start_date));
            ctx.setTab("schedule");
          }}
        >
          <CalendarDays className="w-3 h-3" /> View in Planner <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this campaign and all its scheduled content. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void deleteCampaign(); }}
              disabled={busy}
              className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
            >
              {busy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function NewCampaignFlow({ open, onClose, seed, strategy, user, onCreated }: any) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [type, setType] = useState("quarterly");
  const [theme, setTheme] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goals, setGoals] = useState("");
  const [channels, setChannels] = useState<Record<string, boolean>>({ linkedin: true, email: true, instagram: false, facebook: false });
  const [targets, setTargets] = useState<Record<string, number>>({ linkedin: 5, email: 1, instagram: 0, facebook: 0 });
  const [plan, setPlan] = useState<any[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [color, setColor] = useState<string>("#F97066");
  const [currentWeekIdx, setCurrentWeekIdx] = useState(0);
  const [goalSuggestions, setGoalSuggestions] = useState<string[]>([]);
  const [prechecked, setPrechecked] = useState<Set<string>>(new Set());
  const [cmoText, setCmoText] = useState<string>("");
  const [cmoLoading, setCmoLoading] = useState(false);
  const [userTopGoal, setUserTopGoal] = useState<string>("");
  const [cadenceApplied, setCadenceApplied] = useState(false);

  // Paid campaign state
  const [campaignMode, setCampaignMode] = useState<"organic" | "paid">("organic");
  const [adPlatform, setAdPlatform] = useState<"meta" | "google" | null>(null);
  const [metaObjective, setMetaObjective] = useState<string>("Leads");
  const [metaFormat, setMetaFormat] = useState<string>("Single Image or Video");
  const [metaBudget, setMetaBudget] = useState<string>("$25 to $50/day");
  const [metaVariations, setMetaVariations] = useState<number>(3);
  const [googleType, setGoogleType] = useState<string>("Search");
  const [googleKeyword, setGoogleKeyword] = useState<string>("");
  const [googleBudget, setGoogleBudget] = useState<string>("$25 to $50/day");
  const [googleAdGroups, setGoogleAdGroups] = useState<number>(2);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName(seed?.name ?? "");
    setType(seed?.campaign_type ?? seed?.type ?? "quarterly");
    setTheme(seed?.theme ?? "");
    setStartDate(seed?.start_date ?? "");
    setEndDate(seed?.end_date ?? "");
    setGoals("");
    setColor(seed?.color ?? "#F97066");
    // Pre-check channels from strategy (primary + active)
    const stratChannels = new Set<string>();
    const allChannels = ["linkedin", "email", "instagram", "facebook"];
    const pc = (strategy?.primary_channel || "").toString().toLowerCase();
    allChannels.forEach((ch) => { if (pc.includes(ch)) stratChannels.add(ch); });
    const efChannels = (strategy?.enhanced_foundation as any)?.channels;
    if (Array.isArray(efChannels)) {
      efChannels.forEach((c: any) => {
        const name = (typeof c === "string" ? c : c?.name ?? c?.channel ?? "").toString().toLowerCase();
        allChannels.forEach((ch) => { if (name.includes(ch)) stratChannels.add(ch); });
      });
    }
    if (seed?.channels) seed.channels.forEach((ch: string) => stratChannels.add(ch));
    const next: Record<string, boolean> = { linkedin: false, email: false, instagram: false, facebook: false };
    if (stratChannels.size > 0) {
      stratChannels.forEach((ch) => { next[ch] = true; });
    } else {
      next.linkedin = true; next.email = true;
    }
    setChannels(next);
    setPrechecked(stratChannels);
    setPlan([]);
    setCurrentWeekIdx(0);
    setCampaignMode("organic");
    setAdPlatform(null);

    // Fetch goal suggestions silently
    (async () => {
      try {
        const suggestions: string[] = [];
        if (strategy?.business_goal) suggestions.push(String(strategy.business_goal));
        if (strategy?.success_definition) suggestions.push(String(strategy.success_definition));
        let topGoal = strategy?.business_goal ? String(strategy.business_goal) : "";
        if (user?.id) {
          const { data } = await supabase
            .from("goal_entries")
            .select("notes")
            .eq("user_id", user.id)
            .not("notes", "is", null)
            .order("week_of", { ascending: false })
            .limit(5);
          (data ?? []).forEach((r: any) => {
            const n = (r.notes ?? "").toString().trim();
            if (n) suggestions.push(n);
          });
          if (!topGoal && data && data[0]?.notes) topGoal = String(data[0].notes);
        }
        setUserTopGoal(topGoal);
        const unique = Array.from(new Set(suggestions.map((s) => s.trim()).filter(Boolean))).slice(0, 3);
        setGoalSuggestions(unique);
      } catch {
        setGoalSuggestions([]);
      }
    })();
    setCmoText("");
    setCadenceApplied(false);
  }, [open, seed, strategy, user]);

  const themes = asArray<any>(strategy?.content_themes).map((t: any) => typeof t === "string" ? t : (t?.theme ?? t?.title ?? t?.name)).filter(Boolean);
  const pillarSuggestions: string[] = useMemo(() => {
    const raw = asArray<any>(strategy?.content_pillars);
    return raw
      .map((p: any) => (typeof p === "string" ? p : (p?.name ?? p?.title ?? p?.pillar ?? "")))
      .map((s: string) => s?.toString().trim())
      .filter(Boolean)
      .slice(0, 5);
  }, [strategy]);
  const suggestedName = useMemo(() => {
    if (!theme || !goals) return "";
    const d = new Date();
    const mo = d.toLocaleString("en-US", { month: "long" });
    return `${theme} Campaign — ${mo} ${d.getFullYear()}`;
  }, [theme, goals]);
  const weeks = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 86400000)));
  }, [startDate, endDate]);

  const selectedChannels = campaignMode === "paid" && adPlatform
    ? [adPlatform]
    : Object.keys(channels).filter(k => channels[k]);

  // Effective per-week targets used by save() & exec items
  const effectiveTargets: Record<string, number> = campaignMode === "paid" && adPlatform
    ? { [adPlatform]: adPlatform === "meta" ? metaVariations : googleAdGroups }
    : targets;

  const { checkGenerationLimit, handleGenerationResponse } = usePlan();

  const goalType: GoalType = useMemo(() => classifyGoal(goals), [goals]);

  // Goal text for campaign-type card matching (Step 1)
  const goalMatchText = useMemo(() => {
    return [
      userTopGoal,
      strategy?.business_goal,
      strategy?.success_definition,
      strategy?.positioning_statement,
    ].filter(Boolean).join(" ").toLowerCase();
  }, [userTopGoal, strategy]);

  const highlightedCardKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!goalMatchText) return keys;
    if (REVENUE_KEYWORDS.some((k) => goalMatchText.includes(k))) {
      keys.add("leadgen"); keys.add("sales");
    }
    if (AWARENESS_KEYWORDS.some((k) => goalMatchText.includes(k))) {
      keys.add("audience"); keys.add("brand");
    }
    return keys;
  }, [goalMatchText]);

  function pickCampaignTypeCard(card: typeof CAMPAIGN_TYPE_CARDS[number]) {
    const d = new Date();
    const mo = d.toLocaleString("en-US", { month: "long" });
    const base = card.label.endsWith("Campaign") ? card.label : `${card.label} Campaign`;
    setName(`${base} — ${mo} ${d.getFullYear()}`);
    setType(card.typeValue);
    if (card.mode === "paid" && card.adPlatform) {
      setCampaignMode("paid");
      setAdPlatform(card.adPlatform);
    } else {
      setCampaignMode("organic");
      setAdPlatform(null);
    }
  }

  // When Step 3 first renders, prefill cadence and request CMO recommendation.
  useEffect(() => {
    if (step !== 3) return;
    if (campaignMode === "paid") {
      setCmoText(adPlatform === "google" ? GOOGLE_CMO : META_CMO);
      setCmoLoading(false);
      return;
    }
    if (!cadenceApplied) {
      const c = CADENCE[goalType];
      setTargets((prev) => ({ ...prev, ...c }));
      setCadenceApplied(true);
    }
    if (cmoText || cmoLoading) return;
    setCmoLoading(true);
    const ac = new AbortController();
    const timer = setTimeout(() => {
      ac.abort();
      setCmoText((t) => t || DEFAULT_CMO_TEXT);
      setCmoLoading(false);
    }, 3000);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("cmo-cadence-recommendation", {
          body: { campaignGoal: goals, campaignTheme: theme, userGoal: userTopGoal },
        });
        clearTimeout(timer);
        if (error || !data?.recommendation) {
          setCmoText((t) => t || DEFAULT_CMO_TEXT);
        } else {
          setCmoText(String(data.recommendation));
        }
      } catch {
        setCmoText((t) => t || DEFAULT_CMO_TEXT);
      } finally {
        setCmoLoading(false);
      }
    })();
    return () => { clearTimeout(timer); ac.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function generatePlan() {
    if (!(await checkGenerationLimit())) return;
    setPlanLoading(true);
    try {
      const adConfig = campaignMode === "paid"
        ? (adPlatform === "meta"
            ? { platform: "meta", objective: metaObjective, format: metaFormat, budget: metaBudget, numVariations: metaVariations }
            : { platform: "google", googleType, keyword: googleKeyword, budget: googleBudget, numAdGroups: googleAdGroups })
        : null;
      const { data, error } = await supabase.functions.invoke("generate-campaign-plan", {
        body: {
          campaign: { name, theme, goals, channels: selectedChannels, start_date: startDate, end_date: endDate },
          strategy,
          adConfig,
        },
      });
      if (handleGenerationResponse(data, error)) return;
      if (error) throw error;
      setPlan((data as any)?.weeks ?? []);
    } catch (e: any) {
      toast.error(aiErrorMessage("generic", e));
    } finally {
      setPlanLoading(false);
    }
  }

  async function save() {
    if (!user) return;
    setCreating(true);
    try {
      // For paid, the "channel" is the ad platform and the per-week brief
      // is stored on weekPlan[adPlatform] so execution items pick it up.
      const planForSave = campaignMode === "paid" && adPlatform
        ? plan.map((w: any) => {
            const brief = adPlatform === "meta"
              ? formatMetaBrief(w?.meta)
              : formatGoogleBrief(w?.google);
            return { ...w, [adPlatform]: brief };
          })
        : plan;
      const slots = generateCampaignSlots({
        start_date: startDate || null,
        end_date: endDate || null,
        channels: selectedChannels,
        targets: effectiveTargets,
      });
      const { data: created, error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        name, theme, goals,
        campaign_type: type,
        start_date: startDate || null,
        end_date: endDate || null,
        channels: selectedChannels,
        status: "active",
        color,
        content_plan: { weeks: planForSave, targets: effectiveTargets, slots, mode: campaignMode, adPlatform },
      }).select("id").single();
      if (error) throw error;

      // Generate and insert per-day execution items
      const execItems = generateExecutionItems({
        start_date: startDate || null,
        end_date: endDate || null,
        channels: selectedChannels,
        targets: effectiveTargets,
        plan: planForSave,
      });
      if (created?.id && execItems.length > 0) {
        const rows = execItems.map((it) => ({
          user_id: user.id,
          campaign_id: created.id,
          ...it,
        }));
        const { error: execErr } = await supabase.from("campaign_execution_items").insert(rows);
        if (execErr) console.warn("Failed to insert execution items", execErr);
      }

      toast.success("Campaign created", {
        description: `${execItems.length} items scheduled across your calendar.`,
      });
      onCreated();
    } catch (e: any) {
      toast.error("Could not save campaign", { description: e.message });
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New campaign · Step {step} of 5</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <div
                  className={`text-[11px] uppercase tracking-wider mb-2 font-semibold ${
                    highlightedCardKeys.size > 0 ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {highlightedCardKeys.size > 0 ? "Recommended for your goals" : "Choose a campaign type"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CAMPAIGN_TYPE_CARDS.map((card) => {
                    const highlighted = highlightedCardKeys.has(card.key);
                    return (
                      <button
                        key={card.key}
                        type="button"
                        onClick={() => pickCampaignTypeCard(card)}
                        className={`text-left rounded-lg border p-3 transition-colors hover:bg-muted/40 ${
                          highlighted ? "border-accent" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg leading-none">{card.icon}</span>
                          <span className="font-semibold text-sm">{card.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground leading-snug">
                          {card.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Campaign name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={suggestedName || 'e.g. "Q2 Leadership Framework"'}
                />
              </div>
              <div>
                <Label>Campaign type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Campaign color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      title={c.name}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c.value }}
                      aria-label={c.name}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Used on the campaign card and calendar indicators.</div>
              </div>
              <div className="flex justify-end pt-3">
                <Button onClick={() => setStep(2)} disabled={!name}>Next <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Theme / focus</Label>
                {pillarSuggestions.length > 0 && (
                  <div className="mt-1 mb-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">From your strategy</div>
                    <div className="flex flex-wrap gap-1.5">
                      {pillarSuggestions.map((p) => {
                        const active = theme === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setTheme(p)}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                              active
                                ? "bg-accent text-accent-foreground border-accent"
                                : "bg-background text-accent border-accent hover:bg-accent/10"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <Input className="mt-2" value={theme} onChange={e => setTheme(e.target.value)} placeholder="Or write a custom theme" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>End date</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              {weeks > 0 && <div className="text-xs text-muted-foreground">Duration: {weeks} weeks</div>}
              <div>
                <Label>Campaign goal</Label>
                {goalSuggestions.length > 0 && (
                  <div className="mt-1 mb-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">From your goals</div>
                    <div className="space-y-1.5">
                      {goalSuggestions.map((g, i) => {
                        const active = goals === g;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setGoals(g)}
                            className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                              active
                                ? "border-accent bg-accent-soft"
                                : "border-border bg-muted/40 hover:bg-muted/60"
                            }`}
                            style={{ borderRadius: 8 }}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <Textarea rows={3} value={goals} onChange={e => setGoals(e.target.value)} placeholder='e.g. "Book 10 discovery calls from LinkedIn"' />
              </div>
              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(3)} disabled={!startDate || !endDate}>Next <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="rounded-lg border border-accent/30 bg-accent-soft p-3">
                <div className="text-[11px] uppercase tracking-wider text-accent font-semibold mb-1">
                  Your CMO recommends
                </div>
                <div className="text-sm text-foreground/90 min-h-[1.25rem]">
                  {cmoLoading && !cmoText ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                    </span>
                  ) : (
                    cmoText || DEFAULT_CMO_TEXT
                  )}
                </div>
              </div>
              {campaignMode === "organic" && (
                <Label>Which channels will this campaign use?</Label>
              )}
              {campaignMode === "organic" && (["linkedin", "email", "instagram", "facebook"] as const).map(ch => (
                <div key={ch} className="border border-border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={channels[ch]} onCheckedChange={(v) => setChannels({ ...channels, [ch]: !!v })} />
                      <span className="capitalize">{ch}</span>
                    </label>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      Target:
                      <Input type="number" min={0} className="w-16 h-8" value={targets[ch]} onChange={e => setTargets({ ...targets, [ch]: Number(e.target.value) || 0 })} />
                      /week
                    </div>
                  </div>
                  {channels[ch] && (
                    <div className="mt-2 text-[12px] italic text-muted-foreground">
                      {RATIONALE[ch][goalType]}
                    </div>
                  )}
                </div>
              ))}
              {campaignMode === "paid" && adPlatform === "meta" && (
                <MetaConfig
                  objective={metaObjective} setObjective={setMetaObjective}
                  format={metaFormat} setFormat={setMetaFormat}
                  budget={metaBudget} setBudget={setMetaBudget}
                  variations={metaVariations} setVariations={setMetaVariations}
                />
              )}
              {campaignMode === "paid" && adPlatform === "google" && (
                <GoogleConfig
                  googleType={googleType} setGoogleType={setGoogleType}
                  keyword={googleKeyword} setKeyword={setGoogleKeyword}
                  budget={googleBudget} setBudget={setGoogleBudget}
                  adGroups={googleAdGroups} setAdGroups={setGoogleAdGroups}
                />
              )}
              {campaignMode === "organic" && prechecked.size > 0 && (
                <div className="text-xs text-muted-foreground">Pre-selected based on your strategy. Adjust as needed.</div>
              )}
              {campaignMode === "organic" && weeks > 0 && (
                <div className="bg-accent-soft border border-accent/30 rounded-lg p-3 text-xs">
                  Based on your {GOAL_LABEL[goalType]} goal — over {weeks} weeks this campaign needs:{" "}
                  {selectedChannels.map(ch => `${weeks * (targets[ch] || 0)} ${ch === "linkedin" ? "LinkedIn" : ch}`).join(" · ")}
                </div>
              )}
              {campaignMode === "paid" && weeks > 0 && adPlatform === "meta" && (
                <div className="bg-accent-soft border border-accent/30 rounded-lg p-3 text-xs">
                  Over {weeks} weeks: {weeks * metaVariations} ad creative sets to produce
                </div>
              )}
              {campaignMode === "paid" && weeks > 0 && adPlatform === "google" && (
                <div className="bg-accent-soft border border-accent/30 rounded-lg p-3 text-xs">
                  Over {weeks} weeks: {weeks * googleAdGroups} ad groups, {weeks * googleAdGroups * 3} headline variations, {weeks * googleAdGroups * 2} description variations
                </div>
              )}
              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(4)} disabled={selectedChannels.length === 0 || (campaignMode === "paid" && adPlatform === "google" && !googleKeyword.trim())}>
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex items-center justify-between">
                <Label>{campaignMode === "paid" ? "Ad creative brief" : "Content scaffold"}</Label>
                <Button variant="outline" size="sm" onClick={generatePlan} disabled={planLoading}>
                  {planLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {plan.length > 0 ? "Regenerate" : "Generate plan"}
                </Button>
              </div>
              {campaignMode === "paid" && (
                <div className="text-[11px] uppercase tracking-wider text-accent font-semibold">AD BRIEF</div>
              )}
              {plan.length === 0 && !planLoading && (
                <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
                  Click "Generate plan" to have MOXIEMO draft a week-by-week {campaignMode === "paid" ? "ad creative brief" : "topic plan"}.
                </div>
              )}
              {planLoading && (
                <PlanLoadingState paid={campaignMode === "paid"} />
              )}
              {plan.length > 0 && !planLoading && (
                <>
                  <div className="flex items-center justify-between animate-fade-in">
                    <button
                      type="button"
                      onClick={() => setCurrentWeekIdx((i) => Math.max(0, i - 1))}
                      disabled={currentWeekIdx === 0}
                      className="inline-flex items-center gap-1 text-sm text-foreground disabled:text-muted-foreground/50 disabled:cursor-not-allowed hover:text-accent transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <div className="text-sm font-medium">
                      Week {currentWeekIdx + 1} of {plan.length}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentWeekIdx((i) => Math.min(plan.length - 1, i + 1))}
                      disabled={currentWeekIdx >= plan.length - 1}
                      className="inline-flex items-center gap-1 text-sm text-foreground disabled:text-muted-foreground/50 disabled:cursor-not-allowed hover:text-accent transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {campaignMode === "paid"
                    ? <AdWeekCard week={plan[currentWeekIdx]} platform={adPlatform!} />
                    : <WeekCard week={plan[currentWeekIdx]} />
                  }
                </>
              )}
              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(5)}>Next <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <Card className="p-4 border-border">
                <div className="font-display text-lg mb-3">Campaign ready to launch</div>
                <div className="text-sm space-y-1">
                  <div><b>Name:</b> {name}</div>
                  <div><b>Duration:</b> {startDate} – {endDate} ({weeks} weeks)</div>
                  <div><b>Channels:</b> {selectedChannels.join(", ")}</div>
                  <div><b>Content needed:</b> {selectedChannels.map(ch => `${weeks * (targets[ch] || 0)} ${ch}`).join(" · ")}</div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground space-y-1">
                  <div>✓ Campaign saved to your calendar</div>
                  <div>✓ Week-by-week plan saved</div>
                  <div>✓ Topics appear as ideas in Create tab</div>
                  <div>✗ Content NOT auto-generated yet</div>
                </div>
              </Card>
              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(4)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={save} disabled={creating || !name}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save campaign
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const CHANNEL_META: Record<string, { label: string; Icon: any }> = {
  linkedin: { label: "LinkedIn", Icon: Linkedin },
  email: { label: "Email", Icon: Mail },
  instagram: { label: "Instagram", Icon: Instagram },
  facebook: { label: "Facebook", Icon: Facebook },
};

function formatWeekRange(weekOf?: string): string {
  if (!weekOf) return "";
  const start = new Date(weekOf);
  if (isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${fmtShort(start)} to ${fmtShort(end)}`;
}

const PLAN_LOADING_MESSAGES = [
  "Building your week-by-week content plan...",
  "Mapping your strategy to every channel...",
  "Writing briefs rooted in your positioning...",
  "Connecting your goals to your content calendar...",
  "Almost there — this one is worth the wait.",
];

function PlanLoadingState({ paid = false }: { paid?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const messages = paid
    ? [
        "Writing your ad creative brief...",
        "Mapping your strategy to every variation...",
        "Crafting headlines anchored to your positioning...",
        "Tuning copy to your ICP and brand voice...",
        "Almost there — this one is worth the wait.",
      ]
    : PLAN_LOADING_MESSAGES;
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <div
        className="flex items-center justify-center mt-6"
        style={{ minHeight: 56, maxWidth: 340 }}
      >
        <p
          className="italic text-center transition-opacity duration-400"
          style={{
            fontSize: 16,
            color: "#888",
            opacity: visible ? 1 : 0,
            margin: 0,
          }}
        >
          {messages[idx]}
        </p>
      </div>
      <p className="text-center text-muted-foreground" style={{ fontSize: 12, marginTop: 16 }}>
        This usually takes 30-60 seconds. Grab a coffee. ☕
      </p>
    </div>
  );
}

function WeekCard({ week }: { week: any }) {
  if (!week) return null;
  const range = formatWeekRange(week.weekOf);
  const channels = (["linkedin", "email", "instagram", "facebook"] as const).filter((ch) => !!week[ch]);
  return (
    <div className="border border-border rounded-[12px] w-full overflow-hidden bg-background">
      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-2">
          Week {week.weekNumber}{range ? ` — ${range}` : ""}
        </div>
        {week.theme && (
          <div className="border-l-[3px] border-accent pl-3 py-0.5">
            <div className="text-base font-bold leading-snug">Theme: {week.theme}</div>
          </div>
        )}
      </div>
      {channels.length > 0 && (
        <div className="border-t border-border">
          {channels.map((ch, i) => (
            <ChannelRow
              key={ch}
              channel={ch}
              text={String(week[ch] ?? "")}
              tinted={i % 2 === 1}
              divider={i < channels.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelRow({ channel, text, tinted, divider }: { channel: string; text: string; tinted: boolean; divider: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CHANNEL_META[channel] ?? { label: channel, Icon: Sparkles };
  const Icon = meta.Icon;
  // Heuristic: assume truncation if >~140 chars (since line-clamp-2)
  const canExpand = text.length > 140;
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 ${tinted ? "bg-[#faf9f7]" : "bg-background"} ${divider ? "border-b border-border" : ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-[110px] pt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-bold">{meta.label}</span>
      </div>
      <div className="flex-1 text-sm text-foreground/90">
        <div className={expanded ? "" : "line-clamp-2"}>{text}</div>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs text-accent hover:underline"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
  );
}

function CampaignDetail({ c, ctx, onChanged, setTab }: any) {
  const linkedPosts = ctx.socialPosts.filter((p: any) => p.campaign_id === c.id);
  const linkedEmails = ctx.emailSends.filter((e: any) => e.campaign_id === c.id);
  const plan = (c.content_plan?.weeks ?? []) as any[];
  const targets = c.content_plan?.targets ?? {};
  const channels = c.channels ?? [];

  async function setStatus(status: string) {
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", c.id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked as ${status}`); onChanged(); }
  }

  return (
    <div>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">{c.name}</SheetTitle>
      </SheetHeader>
      <div className="text-xs text-muted-foreground mb-3">
        {c.start_date ? fmtShort(new Date(c.start_date)) : "—"} – {c.end_date ? fmtShort(new Date(c.end_date)) : "—"} · {c.status}
      </div>

      <div className="flex gap-2 mb-4">
        {c.status !== "active" && <Button size="sm" onClick={() => setStatus("active")}>Activate</Button>}
        {c.status === "active" && <Button size="sm" variant="outline" onClick={() => setStatus("paused")}><Pause className="w-3 h-3" /> Pause</Button>}
        <Button size="sm" variant="outline" onClick={() => setStatus("completed")}><CheckCircle2 className="w-3 h-3" /> Complete</Button>
      </div>

      <div className="space-y-3 mb-5">
        {channels.map((ch: string) => {
          const target = (targets[ch] || 0) * (plan.length || 0);
          let done = 0;
          if (ch === "email") done = linkedEmails.filter((e: any) => e.status === "sent").length;
          else done = linkedPosts.filter((p: any) => (p.platforms ?? []).includes(ch) && p.status === "published").length;
          const pct = target > 0 ? Math.round((done / target) * 100) : 0;
          return (
            <div key={ch} className="text-xs">
              <div className="flex justify-between mb-1"><span className="capitalize">{ch}</span><span>{done}/{target}</span></div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>

      <div className="font-medium text-sm mb-2">Week-by-week plan</div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {plan.length === 0 && <div className="text-xs text-muted-foreground">No plan saved.</div>}
        {plan.map((w: any, idx: number) => (
          <div key={idx} className="border border-border rounded p-2 text-xs">
            <div className="font-medium mb-1">Week {w.weekNumber} {w.theme ? `· ${w.theme}` : ""}</div>
            {w.linkedin && <div><b>LinkedIn:</b> {w.linkedin}</div>}
            {w.email && <div><b>Email:</b> {w.email}</div>}
            {w.instagram && <div><b>Instagram:</b> {w.instagram}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Paid campaign helpers & components ----------------

function formatMetaBrief(meta: any): string {
  if (!meta) return "";
  const vars = Array.isArray(meta.variations) ? meta.variations : [];
  const lines: string[] = [];
  vars.forEach((v: any) => {
    lines.push(`AD VARIATION ${v.label ?? ""} — ${v.angle ?? ""}`);
    if (v.headline) lines.push(`Headline: ${v.headline}`);
    if (v.primaryText) lines.push(`Primary Text: ${v.primaryText}`);
    if (v.cta) lines.push(`CTA: ${v.cta}`);
    lines.push("");
  });
  if (meta.targetingNote) lines.push(`TARGETING NOTE: ${meta.targetingNote}`);
  if (meta.creativeNote) lines.push(`CREATIVE NOTE: ${meta.creativeNote}`);
  return lines.join("\n").trim();
}

function formatGoogleBrief(google: any): string {
  if (!google) return "";
  const groups = Array.isArray(google.adGroups) ? google.adGroups : [];
  const lines: string[] = [];
  groups.forEach((g: any, i: number) => {
    lines.push(`AD GROUP ${i + 1}: ${g.name ?? ""}`);
    (g.headlines ?? []).forEach((h: string, idx: number) => lines.push(`Headline ${idx + 1}: ${h}`));
    (g.descriptions ?? []).forEach((d: string, idx: number) => lines.push(`Description ${idx + 1}: ${d}`));
    lines.push("");
  });
  if (google.keywordNote) lines.push(`KEYWORD NOTE: ${google.keywordNote}`);
  if (google.bidNote) lines.push(`BID NOTE: ${google.bidNote}`);
  return lines.join("\n").trim();
}

function MetaConfig({
  objective, setObjective, format, setFormat, budget, setBudget, variations, setVariations,
}: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Campaign objective</Label>
        <RadioGroup value={objective} onValueChange={setObjective} className="grid grid-cols-2 gap-2 mt-2">
          {["Awareness", "Traffic", "Leads", "Sales"].map((o) => (
            <label key={o} className="flex items-center gap-2 border border-border rounded-md p-2 cursor-pointer hover:bg-muted/40">
              <RadioGroupItem value={o} id={`obj-${o}`} />
              <span className="text-sm">{o}</span>
            </label>
          ))}
        </RadioGroup>
      </div>
      <div>
        <Label>Ad format</Label>
        <RadioGroup value={format} onValueChange={setFormat} className="grid grid-cols-1 gap-2 mt-2">
          {["Single Image or Video", "Carousel", "Stories"].map((o) => (
            <label key={o} className="flex items-center gap-2 border border-border rounded-md p-2 cursor-pointer hover:bg-muted/40">
              <RadioGroupItem value={o} id={`fmt-${o}`} />
              <span className="text-sm">{o}</span>
            </label>
          ))}
        </RadioGroup>
      </div>
      <div>
        <Label>Daily budget range</Label>
        <Select value={budget} onValueChange={setBudget}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {BUDGET_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>How many creative variations?</Label>
        <Stepper value={variations} onChange={setVariations} min={1} max={6} />
        <div className="text-xs text-muted-foreground mt-1">We recommend 3 variations minimum for testing.</div>
      </div>
    </div>
  );
}

function GoogleConfig({
  googleType, setGoogleType, keyword, setKeyword, budget, setBudget, adGroups, setAdGroups,
}: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Campaign type</Label>
        <RadioGroup value={googleType} onValueChange={setGoogleType} className="grid grid-cols-3 gap-2 mt-2">
          {["Search", "Display", "YouTube"].map((o) => (
            <label key={o} className="flex items-center gap-2 border border-border rounded-md p-2 cursor-pointer hover:bg-muted/40">
              <RadioGroupItem value={o} id={`gt-${o}`} />
              <span className="text-sm">{o}</span>
            </label>
          ))}
        </RadioGroup>
      </div>
      <div>
        <Label>What are you trying to be found for?</Label>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='e.g. "executive coaching for founders"'
        />
      </div>
      <div>
        <Label>Daily budget range</Label>
        <Select value={budget} onValueChange={setBudget}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {BUDGET_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>How many ad groups?</Label>
        <Stepper value={adGroups} onChange={setAdGroups} min={1} max={6} />
        <div className="text-xs text-muted-foreground mt-1">Each ad group targets a different keyword theme.</div>
      </div>
    </div>
  );
}

function Stepper({ value, onChange, min = 1, max = 10 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex items-center gap-2 mt-1">
      <Button type="button" size="sm" variant="outline" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</Button>
      <span className="text-sm font-medium w-8 text-center">{value}</span>
      <Button type="button" size="sm" variant="outline" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</Button>
    </div>
  );
}

function AdWeekCard({ week, platform }: { week: any; platform: "meta" | "google" }) {
  if (!week) return null;
  const range = formatWeekRange(week.weekOf);
  return (
    <div className="border border-border rounded-[12px] w-full overflow-hidden bg-background">
      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-2">
          Week {week.weekNumber}{range ? ` — ${range}` : ""}
        </div>
        {week.theme && (
          <div className="border-l-[3px] border-accent pl-3 py-0.5">
            <div className="text-base font-bold leading-snug">Theme: {week.theme}</div>
          </div>
        )}
      </div>
      {platform === "meta" && week.meta && (
        <div className="border-t border-border">
          {(week.meta.variations ?? []).map((v: any, i: number, arr: any[]) => (
            <AdRow
              key={i}
              title={`Variation ${v.label ?? ""} — ${v.angle ?? ""}`}
              tinted={i % 2 === 1}
              divider={i < arr.length - 1 || !!week.meta.targetingNote || !!week.meta.creativeNote}
            >
              {v.headline && <div><span className="text-xs uppercase tracking-wide text-muted-foreground">Headline </span>{v.headline}</div>}
              {v.primaryText && <div className="mt-1"><span className="text-xs uppercase tracking-wide text-muted-foreground">Primary text </span>{v.primaryText}</div>}
              {v.cta && <div className="mt-1"><span className="text-xs uppercase tracking-wide text-muted-foreground">CTA </span>{v.cta}</div>}
            </AdRow>
          ))}
          {(week.meta.targetingNote || week.meta.creativeNote) && (
            <div className="px-4 py-3 bg-muted/30 text-xs text-muted-foreground space-y-1">
              {week.meta.targetingNote && <div><b>Targeting:</b> {week.meta.targetingNote}</div>}
              {week.meta.creativeNote && <div><b>Creative:</b> {week.meta.creativeNote}</div>}
            </div>
          )}
        </div>
      )}
      {platform === "google" && week.google && (
        <div className="border-t border-border">
          {(week.google.adGroups ?? []).map((g: any, i: number, arr: any[]) => (
            <AdRow
              key={i}
              title={`Ad Group ${i + 1}: ${g.name ?? ""}`}
              tinted={i % 2 === 1}
              divider={i < arr.length - 1 || !!week.google.keywordNote || !!week.google.bidNote}
            >
              {(g.headlines ?? []).map((h: string, idx: number) => (
                <div key={`h-${idx}`}>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Headline {idx + 1} </span>{h}
                </div>
              ))}
              {(g.descriptions ?? []).map((d: string, idx: number) => (
                <div key={`d-${idx}`} className="mt-1">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Description {idx + 1} </span>{d}
                </div>
              ))}
            </AdRow>
          ))}
          {(week.google.keywordNote || week.google.bidNote) && (
            <div className="px-4 py-3 bg-muted/30 text-xs text-muted-foreground space-y-1">
              {week.google.keywordNote && <div><b>Keywords:</b> {week.google.keywordNote}</div>}
              {week.google.bidNote && <div><b>Bidding:</b> {week.google.bidNote}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdRow({ title, children, tinted, divider }: { title: string; children: React.ReactNode; tinted: boolean; divider: boolean }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className={`px-4 py-3 ${tinted ? "bg-[#faf9f7]" : "bg-background"} ${divider ? "border-b border-border" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs text-accent">{expanded ? "Collapse" : "Expand"}</span>
      </button>
      {expanded && <div className="mt-2 text-sm text-foreground/90">{children}</div>}
    </div>
  );
}
