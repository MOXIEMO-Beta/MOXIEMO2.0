import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Shield, Linkedin, Facebook, Instagram, Mail, Calendar as CalIcon, Lightbulb, Megaphone, Sparkles, FileText } from "lucide-react";
import { LinkedInAnalyticsProbe } from "@/components/LinkedInAnalyticsProbe";

type SocialConn = {
  id: string;
  platform: string;
  profile_name: string | null;
  connection_type?: string | null;
  organization_id?: string | null;
  organization_name?: string | null;
  expires_at?: string | null;
};

type PendingOrg = { organization_id: string; organization_name: string; urn: string };
type PendingPagesRow = { id: string; organizations: PendingOrg[] };

type HistoryRow = {
  id: string;
  platform: string | null;
  campaign_id: string | null;
  content_preview: string | null;
  generated_at: string;
};

function platformIcon(platform: string | null) {
  const p = (platform ?? "").toLowerCase();
  if (p.includes("linkedin")) return <Linkedin className="h-4 w-4 text-foreground/70" />;
  if (p.includes("facebook")) return <Facebook className="h-4 w-4 text-foreground/70" />;
  if (p.includes("instagram")) return <Instagram className="h-4 w-4 text-foreground/70" />;
  if (p.includes("email")) return <Mail className="h-4 w-4 text-foreground/70" />;
  if (p.includes("calendar")) return <CalIcon className="h-4 w-4 text-foreground/70" />;
  if (p === "ideas") return <Lightbulb className="h-4 w-4 text-foreground/70" />;
  if (p.includes("campaign")) return <Megaphone className="h-4 w-4 text-foreground/70" />;
  if (p.includes("social")) return <Sparkles className="h-4 w-4 text-foreground/70" />;
  return <FileText className="h-4 w-4 text-foreground/70" />;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function expiryStatus(iso?: string | null): { kind: "expired" | "soon" | "ok"; days: number } | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  const days = Math.ceil((ms - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return { kind: "expired", days: 0 };
  if (days <= 7) return { kind: "soon", days };
  return { kind: "ok", days };
}

function ExpiryChip({ iso }: { iso?: string | null }) {
  const s = expiryStatus(iso);
  if (!s || s.kind === "ok") return null;
  const label = s.kind === "expired" ? "Expired — reconnect" : `Expires in ${s.days} day${s.days === 1 ? "" : "s"}`;
  const bg = s.kind === "expired" ? "#FDE1DC" : "#FEF3C7";
  const fg = s.kind === "expired" ? "#8A2C1D" : "#854F0B";
  return (
    <span
      className="text-[10px] font-semibold"
      style={{ background: bg, color: fg, borderRadius: 4, padding: "2px 8px" }}
    >
      {label}
    </span>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [campaignNames, setCampaignNames] = useState<Record<string, string>>({});
  const [connections, setConnections] = useState<SocialConn[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [pendingPages, setPendingPages] = useState<PendingPagesRow | null>(null);
  const [selectedPending, setSelectedPending] = useState<Record<string, boolean>>({});
  const [savingPending, setSavingPending] = useState(false);
  const [showLinkedInChooser, setShowLinkedInChooser] = useState(false);
  const [metaConnecting, setMetaConnecting] = useState<null | "facebook" | "instagram">(null);
  const [metaDisconnecting, setMetaDisconnecting] = useState<null | "facebook" | "instagram">(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const facebookConn = connections.find(
    (c) => c.platform === "facebook" && (c.connection_type ?? "personal") === "personal",
  );
  const instagramConn = connections.find(
    (c) => c.platform === "instagram" && (c.connection_type ?? "personal") === "personal",
  );

  async function reloadConnections() {
    if (!user) return;
    const { data } = await supabase
      .from("social_connections")
      .select("id, platform, profile_name, connection_type, organization_id, organization_name, expires_at")
      .eq("user_id", user.id);
    setConnections((data ?? []) as any);
  }

  async function connectMeta(platform: "facebook" | "instagram") {
    if (!user) return;
    setMetaError(null);
    setMetaConnecting(platform);
    try {
      const { data, error } = await supabase.functions.invoke<any>("postforme-connect", {
        body: { action: "auth_url", platform },
      });
      if (error) {
        const ctx: any = (error as any).context;
        let payload: any = null;
        try { payload = await ctx?.json?.(); } catch {}
        throw new Error(payload?.error ?? error.message ?? "Could not start connection");
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("Connection URL missing.");
      window.location.href = data.url;
    } catch (e: any) {
      setMetaConnecting(null);
      const msg = e?.message ?? "Could not start connection";
      setMetaError(msg);
      toast.error(msg);
    }
  }

  async function disconnectMeta(platform: "facebook" | "instagram") {
    setMetaDisconnecting(platform);
    try {
      const { data, error } = await supabase.functions.invoke<any>("postforme-connect", {
        body: { action: "disconnect", platform },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await reloadConnections();
      toast.success("Disconnected");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not disconnect");
    } finally {
      setMetaDisconnecting(null);
    }
  }

  // Handle the Post for Me redirect: sync spc_ ids to social_connections.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const isSuccessRaw = params.get("isSuccess");
    const provider = params.get("provider");
    const accountIds = params.get("accountIds");
    const legacyPfm = params.get("pfm") === "synced";
    if (!legacyPfm && !isSuccessRaw && !provider && !accountIds) return;
    const platform = provider ?? params.get("platform");
    const cleanUrl = `${window.location.pathname}#integrations-section`;

    if (isSuccessRaw && isSuccessRaw !== "true") {
      const label = platform === "instagram" ? "Instagram" : platform === "facebook" ? "Facebook" : "Account";
      const msg = `${label} connection was not completed. Please try again.`;
      setMetaError(msg);
      toast.error(msg);
      window.history.replaceState({}, "", cleanUrl);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke<any>("postforme-connect", {
          body: { action: "sync" },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        await reloadConnections();
        const label = platform === "instagram" ? "Instagram" : platform === "facebook" ? "Facebook" : "Account";
        const returned: any[] = data?.accounts ?? [];
        const wantedIds = (accountIds ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        const matched = wantedIds.length
          ? returned.some((a) => wantedIds.includes(a.external_account_id))
          : returned.some((a) => a.platform === platform);
        if (matched) toast.success(`${label} connected.`);
        else toast.message(`${label} connection was not returned by Post for Me. Try connecting again.`);
      } catch (e: any) {
        setMetaError(e?.message ?? "Could not finish connection.");
        toast.error(e?.message ?? "Could not finish connection.");
      } finally {
        window.history.replaceState({}, "", cleanUrl);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.full_name || "");
      setBusiness(data?.business_name || "");
      setIsAdmin(Boolean((data as any)?.is_admin));
    });

    supabase
      .from("generation_history")
      .select("id, platform, campaign_id, content_preview, generated_at")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const rows = (data ?? []) as HistoryRow[];
        setHistory(rows);
        const ids = Array.from(
          new Set(rows.map((r) => r.campaign_id).filter((v): v is string => Boolean(v))),
        );
        if (ids.length) {
          supabase
            .from("campaigns")
            .select("id, name")
            .in("id", ids)
            .then(({ data: cs }) => {
              const map: Record<string, string> = {};
              (cs ?? []).forEach((c: any) => { map[c.id] = c.name; });
              setCampaignNames(map);
            });
        }
      });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name, business_name: business }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved.");
  }

  // Load social connections + integrations scroll
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!user) return;
    supabase
      .from("social_connections")
      .select("id, platform, profile_name, connection_type, organization_id, organization_name, expires_at")
      .eq("user_id", user.id)
      .then(({ data }) => setConnections((data ?? []) as any));
    if (typeof window !== "undefined" && (window.location.hash === "#integrations" || window.location.hash === "#integrations-section")) {
      setTimeout(() => document.getElementById("integrations-section")?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [user]);

  const companyPages = connections.filter(
    (c) => c.platform === "linkedin" && c.connection_type === "company",
  );
  const personalLinkedIn = connections.find(
    (c) => c.platform === "linkedin" && (c.connection_type ?? "personal") === "personal",
  );

  // Handle pages_connected / pages_select / pages_error query params + load pending row.
  useEffect(() => {
    if (!user) return;
    const search = new URLSearchParams(window.location.search);
    const pagesConnected = search.get("pages_connected");
    const pagesSelect = search.get("pages_select");
    const pagesError = search.get("pages_error");

    if (pagesError) {
      const map: Record<string, string> = {
        no_pages_found: "No company pages found for this LinkedIn account.",
        token_exchange_failed: "LinkedIn authorization failed. Please try again.",
        acl_lookup_failed: "Could not read company pages from LinkedIn.",
        save_failed: "Could not save the connection. Please try again.",
        callback_failed: "Connection failed. Please try again.",
        not_configured: "Company page connection is not configured.",
      };
      toast.error(map[pagesError] ?? "Company page connection failed.");
    }
    if (pagesConnected) {
      toast.success(pagesConnected === "personal" ? "LinkedIn personal profile connected." : "Company page connected.");
      // Refresh the connections list.
      supabase
        .from("social_connections")
        .select("id, platform, profile_name, connection_type, organization_id, organization_name, expires_at")
        .eq("user_id", user.id)
        .then(({ data }) => setConnections((data ?? []) as any));
    }
    if (pagesSelect === "pending") {
      (supabase.from as any)("pending_pages_connections")
        .select("id, organizations")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data) setPendingPages(data as PendingPagesRow);
        });
    }
    // Clean the query string once handled.
    if (pagesConnected || pagesSelect || pagesError) {
      const cleanUrl = `${window.location.pathname}${window.location.hash || "#integrations-section"}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [user]);

  function connectLinkedIn(intent: "personal" | "company" | "both") {
    if (!user) return;
    setConnecting(`linkedin_${intent}`);
    try {
      const redirect_uri = "https://mqhipuvkdsvapbhrrzjd.supabase.co/functions/v1/social-oauth-pages-callback";
      const clientId = "86swh4fzu3j3vo";
      // Full Community Management scope set provisioned on this app. One
      // authorization from Karee (admin + member) covers both org and member
      // analytics.
      const scope = [
        "r_organization_social",
        "r_organization_followers",
        "r_organization_social_feed",
        "rw_organization_admin",
        "w_organization_social",
        "r_member_postAnalytics",
        "r_member_profileAnalytics",
        "r_basicprofile",
        "w_member_social",
      ].join(" ");
      const state = btoa(JSON.stringify({
        platform: "linkedin",
        connection_type: "company",
        intent,
        user_id: user.id,
        redirect_uri,
      }));
      const url =
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&state=${encodeURIComponent(state)}`;
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start connection");
      setConnecting(null);
    }
  }

  async function disconnectCompanyPage(id: string) {
    const { error } = await supabase.from("social_connections").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setConnections((arr) => arr.filter((c) => c.id !== id));
    toast.success("Disconnected");
  }

  async function confirmPendingSelection() {
    if (!user || !pendingPages) return;
    const selected = pendingPages.organizations.filter((o) => selectedPending[o.organization_id]);
    if (selected.length === 0) {
      toast.error("Select at least one page to connect.");
      return;
    }
    setSavingPending(true);
    try {
      // Load the pending row to get the token/expiry (RLS scopes it to this user).
      const { data: pending, error: pendErr } = await (supabase.from as any)("pending_pages_connections")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (pendErr || !pending) throw new Error(pendErr?.message ?? "Pending selection expired.");

      // Explicit check-then-insert/update per selected org (partial unique indexes
      // don't work with .upsert(onConflict) shorthand). Loop so multi-page
      // selections each create/update their own row.
      for (const org of selected) {
        const { data: existing, error: selErr } = await supabase
          .from("social_connections")
          .select("id")
          .eq("user_id", user.id)
          .eq("platform", "linkedin")
          .eq("connection_type", "company")
          .eq("organization_id", org.organization_id)
          .maybeSingle();
        if (selErr) throw new Error(selErr.message);

        const row = {
          user_id: user.id,
          platform: "linkedin",
          connection_type: "company",
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          profile_name: org.organization_name,
          access_token: pending.access_token,
          refresh_token: pending.refresh_token,
          expires_at: pending.expires_at,
          reminder_sent_at: null,
        };

        if (existing) {
          const { error: updErr } = await supabase
            .from("social_connections")
            .update(row as any)
            .eq("id", (existing as any).id);
          if (updErr) throw new Error(updErr.message);
        } else {
          const { error: insErr } = await supabase
            .from("social_connections")
            .insert(row as any);
          if (insErr) throw new Error(insErr.message);
        }
      }

      await (supabase.from as any)("pending_pages_connections").delete().eq("user_id", user.id);
      toast.success(`Connected ${selected.length} page${selected.length === 1 ? "" : "s"}.`);
      setPendingPages(null);
      setSelectedPending({});
      const { data } = await supabase
        .from("social_connections")
        .select("id, platform, profile_name, connection_type, organization_id, organization_name, expires_at")
        .eq("user_id", user.id);
      setConnections((data ?? []) as any);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save selection.");
    } finally {
      setSavingPending(false);
    }
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-3xl mx-auto">
      <h1 className="font-display text-4xl mb-8">Settings</h1>
      <Card className="p-6 border-border shadow-soft space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email || ""} disabled className="mt-1.5 h-11" />
        </div>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11" />
        </div>
        <div>
          <Label htmlFor="biz">Business name</Label>
          <Input id="biz" value={business} onChange={(e) => setBusiness(e.target.value)} className="mt-1.5 h-11" />
        </div>
        <Button onClick={save} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 h-10 rounded-lg">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>

      <div id="integrations-section" className="mt-10">
        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-2">Integrations</div>
        <p className="text-[13px] mb-3" style={{ color: "#6B6860" }}>
          Connect your social platforms to schedule and publish posts directly from MOXIEMO.
        </p>
        {/* Primary LinkedIn connection — one authorization covers the company
            page (posting and analytics) and your personal post analytics. */}
        {companyPages.map((page, i) => (
          <div key={page.id} className="flex items-center justify-between" style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: "#E8F1FB", borderRadius: 8 }}>
                <Linkedin size={18} color="#0A66C2" />
              </div>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>
                  {page.organization_name || "LinkedIn Company Page"}
                </div>
                <div className="text-[12px]" style={{ color: "#6B6860" }}>
                  {i === 0
                    ? "Covers company page posting and analytics, plus your personal post analytics."
                    : "Additional company page you administer."}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExpiryChip iso={page.expires_at} />
              <span className="text-[10px] font-semibold" style={{ background: "#EAF3DE", color: "#3B6D11", borderRadius: 4, padding: "2px 8px" }}>Connected</span>
              <button onClick={() => disconnectCompanyPage(page.id)} className="text-[12px]" style={{ border: "0.5px solid #ECEAE5", borderRadius: 6, height: 28, padding: "0 12px", color: "#6B6860" }}>Disconnect</button>
            </div>
          </div>
        ))}

        {personalLinkedIn && (
          <div className="flex items-center justify-between" style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: "#E8F1FB", borderRadius: 8 }}>
                <Linkedin size={18} color="#0A66C2" />
              </div>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>
                  {personalLinkedIn.profile_name || "LinkedIn personal profile"}
                </div>
                <div className="text-[12px]" style={{ color: "#6B6860" }}>
                  Personal posting and personal analytics.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExpiryChip iso={personalLinkedIn.expires_at} />
              <span className="text-[10px] font-semibold" style={{ background: "#EAF3DE", color: "#3B6D11", borderRadius: 4, padding: "2px 8px" }}>Connected</span>
              <button onClick={() => disconnectCompanyPage(personalLinkedIn.id)} className="text-[12px]" style={{ border: "0.5px solid #ECEAE5", borderRadius: 6, height: 28, padding: "0 12px", color: "#6B6860" }}>Disconnect</button>
            </div>
          </div>
        )}

        <div style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: "#E8F1FB", borderRadius: 8 }}>
                <Linkedin size={18} color="#0A66C2" />
              </div>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>
                  {personalLinkedIn || companyPages.length > 0 ? "Add another LinkedIn connection" : "Connect LinkedIn"}
                </div>
                <div className="text-[12px]" style={{ color: "#9A9896" }}>
                  Choose personal profile, company page(s), or both. A company page is not required.
                </div>
              </div>
            </div>
            {!showLinkedInChooser && (
              <button onClick={() => setShowLinkedInChooser(true)} className="text-[12px] font-semibold"
                style={{ background: "#E85A46", color: "#fff", borderRadius: 6, height: 32, padding: "0 14px", boxShadow: "0 4px 14px rgba(232,90,70,0.25)" }}>
                Connect
              </button>
            )}
          </div>
          {showLinkedInChooser && (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button
                onClick={() => connectLinkedIn("personal")}
                disabled={!!connecting}
                className="text-left"
                style={{ border: "0.5px solid #ECEAE5", borderRadius: 10, padding: "12px 14px", background: "#FFFDF7" }}
              >
                <div className="text-[13px] font-semibold" style={{ color: "#0E0F10" }}>
                  {connecting === "linkedin_personal" ? "Connecting…" : "Personal profile only"}
                </div>
                <div className="text-[11px]" style={{ color: "#6B6860" }}>
                  Posting and analytics for your own LinkedIn. No company page needed.
                </div>
              </button>
              <button
                onClick={() => connectLinkedIn("company")}
                disabled={!!connecting}
                className="text-left"
                style={{ border: "0.5px solid #ECEAE5", borderRadius: 10, padding: "12px 14px", background: "#FFFDF7" }}
              >
                <div className="text-[13px] font-semibold" style={{ color: "#0E0F10" }}>
                  {connecting === "linkedin_company" ? "Connecting…" : "Company page(s) only"}
                </div>
                <div className="text-[11px]" style={{ color: "#6B6860" }}>
                  Pages you administer. Choose which ones to connect.
                </div>
              </button>
              <button
                onClick={() => connectLinkedIn("both")}
                disabled={!!connecting}
                className="text-left"
                style={{ border: "0.5px solid #ECEAE5", borderRadius: 10, padding: "12px 14px", background: "#FFFDF7" }}
              >
                <div className="text-[13px] font-semibold" style={{ color: "#0E0F10" }}>
                  {connecting === "linkedin_both" ? "Connecting…" : "Personal + company page(s)"}
                </div>
                <div className="text-[11px]" style={{ color: "#6B6860" }}>
                  One authorization covers both.
                </div>
              </button>
            </div>
          )}
        </div>

        {pendingPages && (
          <div style={{ background: "#FFFDF7", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "18px", marginBottom: 10 }}>
            <div className="text-[14px] font-semibold mb-1" style={{ color: "#0E0F10" }}>
              Select company pages to connect
            </div>
            <div className="text-[12px] mb-3" style={{ color: "#6B6860" }}>
              You administer {pendingPages.organizations.length} LinkedIn company pages. Choose which ones MOXIEMO can post to.
            </div>
            <div className="space-y-2 mb-3">
              {pendingPages.organizations.map((o) => (
                <label key={o.organization_id} className="flex items-center gap-2 text-[13px]" style={{ color: "#0E0F10" }}>
                  <input
                    type="checkbox"
                    checked={!!selectedPending[o.organization_id]}
                    onChange={(e) =>
                      setSelectedPending((s) => ({ ...s, [o.organization_id]: e.target.checked }))
                    }
                  />
                  {o.organization_name}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={confirmPendingSelection} disabled={savingPending} className="text-[12px] font-semibold"
                style={{ background: "#E85A46", color: "#fff", borderRadius: 6, height: 32, padding: "0 14px" }}>
                {savingPending ? "Connecting…" : "Connect selected"}
              </button>
              <button onClick={() => setPendingPages(null)} className="text-[12px]"
                style={{ border: "0.5px solid #ECEAE5", borderRadius: 6, height: 32, padding: "0 12px", color: "#6B6860" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Facebook */}
        <div style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: "#E8F0FD", borderRadius: 8 }}>
                <Facebook size={18} color="#1877F2" />
              </div>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>
                  {facebookConn?.profile_name || "Facebook"}
                </div>
                <div className="text-[12px]" style={{ color: "#6B6860" }}>
                  {facebookConn
                    ? "Posts publish natively to this Facebook Page."
                    : "Connect a Facebook Page you administer to publish posts from MOXIEMO."}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {facebookConn ? (
                <>
                  <span className="text-[10px] font-semibold" style={{ background: "#EAF3DE", color: "#3B6D11", borderRadius: 4, padding: "2px 8px" }}>Connected</span>
                  <button
                    onClick={() => disconnectMeta("facebook")}
                    disabled={metaDisconnecting === "facebook"}
                    className="text-[12px]"
                    style={{ border: "0.5px solid #ECEAE5", borderRadius: 6, height: 28, padding: "0 12px", color: "#6B6860" }}
                  >
                    {metaDisconnecting === "facebook" ? "Disconnecting…" : "Disconnect"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => connectMeta("facebook")}
                  disabled={metaConnecting === "facebook"}
                  className="text-[12px] font-semibold"
                  style={{ background: "#E85A46", color: "#fff", borderRadius: 6, height: 32, padding: "0 14px", boxShadow: "0 4px 14px rgba(232,90,70,0.25)" }}
                >
                  {metaConnecting === "facebook" ? "Connecting…" : "Connect"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Instagram */}
        <div style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)" }}>
                <Instagram size={18} color="#fff" />
              </div>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>
                  {instagramConn?.profile_name || "Instagram"}
                </div>
                <div className="text-[12px]" style={{ color: "#6B6860" }}>
                  {instagramConn
                    ? "Posts publish natively to this Instagram account."
                    : "Connect an Instagram Business or Creator account. It must be linked to a Facebook Page you administer."}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {instagramConn ? (
                <>
                  <span className="text-[10px] font-semibold" style={{ background: "#EAF3DE", color: "#3B6D11", borderRadius: 4, padding: "2px 8px" }}>Connected</span>
                  <button
                    onClick={() => disconnectMeta("instagram")}
                    disabled={metaDisconnecting === "instagram"}
                    className="text-[12px]"
                    style={{ border: "0.5px solid #ECEAE5", borderRadius: 6, height: 28, padding: "0 12px", color: "#6B6860" }}
                  >
                    {metaDisconnecting === "instagram" ? "Disconnecting…" : "Disconnect"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => connectMeta("instagram")}
                  disabled={metaConnecting === "instagram"}
                  className="text-[12px] font-semibold"
                  style={{ background: "#E85A46", color: "#fff", borderRadius: 6, height: 32, padding: "0 14px", boxShadow: "0 4px 14px rgba(232,90,70,0.25)" }}
                >
                  {metaConnecting === "instagram" ? "Connecting…" : "Connect"}
                </button>
              )}
            </div>
          </div>
          {metaError && metaConnecting === null && (
            <div className="mt-2 text-[12px]" style={{ color: "#8A2C1D" }}>{metaError}</div>
          )}
        </div>
        <LinkedInAnalyticsProbe />
      </div>

      {isAdmin && (
        <div className="mt-10">
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Admin
          </div>
          <Card className="p-5 border-border shadow-soft">
            <Link
              to="/app/admin/waitlist"
              className="flex items-center justify-between gap-4 group"
            >
              <div>
                <div className="font-semibold group-hover:text-accent transition">Waitlist Admin →</div>
                <div className="text-sm text-muted-foreground">Manage founding member applications</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition" />
            </Link>
          </Card>
        </div>
      )}

      <div className="mt-10">
        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
          Generation History
        </div>
        <Card className="p-0 border-border shadow-soft overflow-hidden">
          {history.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No generations yet. Your last 20 AI generations will appear here.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((row) => (
                <li key={row.id} className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex-shrink-0">{platformIcon(row.platform)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground truncate">
                      {row.content_preview || <span className="text-muted-foreground italic">No preview</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="uppercase tracking-wider">{row.platform || "generation"}</span>
                      {row.campaign_id && campaignNames[row.campaign_id] && (
                        <>
                          <span>•</span>
                          <span>Campaign: {campaignNames[row.campaign_id]}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDate(row.generated_at)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}