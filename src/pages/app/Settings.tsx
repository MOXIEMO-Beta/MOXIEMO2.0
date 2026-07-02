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

  const linkedin = connections.find(
    (c) => c.platform === "linkedin" && (c.connection_type ?? "personal") === "personal",
  );
  const companyPages = connections.filter(
    (c) => c.platform === "linkedin" && c.connection_type === "company",
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
      toast.success("Company page connected.");
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

  async function connectLinkedIn() {
    if (!user) return;
    setConnecting("linkedin");
    try {
      // Only these origins are registered as LinkedIn OAuth redirect URIs.
      // On any other origin (e.g. Lovable editor preview) we fall back to the
      // primary production callback so LinkedIn's exact-match check passes.
      const ALLOWED_ORIGINS = new Set([
        "https://buildwithmoxiemo.com",
        "https://moxie-grow-platform.lovable.app",
      ]);
      const origin = window.location.origin;
      const redirect_uri = ALLOWED_ORIGINS.has(origin)
        ? `${origin}/auth/linkedin/callback`
        : "https://buildwithmoxiemo.com/auth/linkedin/callback";
      const { data, error } = await supabase.functions.invoke("social-oauth-start", {
        body: { platform: "linkedin", user_id: user.id, redirect_uri },
      });
      if (error) throw error;
      const url = (data as any)?.url ?? (data as any)?.authUrl;
      if (url) window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start connection");
    } finally { setConnecting(null); }
  }

  async function disconnectLinkedIn() {
    if (!user || !linkedin) return;
    const { error } = await supabase.from("social_connections").delete().eq("id", linkedin.id);
    if (error) { toast.error(error.message); return; }
    setConnections((arr) => arr.filter((c) => c.id !== linkedin.id));
    toast.success("Disconnected");
  }

  function connectCompanyPage() {
    if (!user) return;
    setConnecting("linkedin_pages");
    try {
      const redirect_uri = "https://mqhipuvkdsvapbhrrzjd.supabase.co/functions/v1/social-oauth-pages-callback";
      const clientId = "86swh4fzu3j3vo";
      const scope = "rw_organization_admin w_organization_social";
      const state = btoa(JSON.stringify({
        platform: "linkedin",
        connection_type: "company",
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

      const rows = selected.map((org) => ({
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
      }));
      const { error: insErr } = await supabase
        .from("social_connections")
        .upsert(rows as any, { onConflict: "user_id,platform,connection_type,organization_id" });
      if (insErr) throw new Error(insErr.message);

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
        <div className="flex items-center justify-between" style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: "#E8F1FB", borderRadius: 8 }}>
              <Linkedin size={18} color="#0A66C2" />
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>LinkedIn</div>
              {linkedin ? (
                <div className="text-[12px]" style={{ color: "#6B6860" }}>{linkedin.profile_name || "Connected account"}</div>
              ) : (
                <div className="text-[12px]" style={{ color: "#9A9896" }}>Not connected</div>
              )}
            </div>
          </div>
          {linkedin ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold" style={{ background: "#EAF3DE", color: "#3B6D11", borderRadius: 4, padding: "2px 8px" }}>Connected</span>
              <button onClick={disconnectLinkedIn} className="text-[12px]" style={{ border: "0.5px solid #ECEAE5", borderRadius: 6, height: 28, padding: "0 12px", color: "#6B6860" }}>Disconnect</button>
            </div>
          ) : (
            <button onClick={connectLinkedIn} disabled={connecting === "linkedin"} className="text-[12px] font-semibold"
              style={{ background: "#E85A46", color: "#fff", borderRadius: 6, height: 32, padding: "0 14px", boxShadow: "0 4px 14px rgba(232,90,70,0.25)" }}>
              {connecting === "linkedin" ? "Connecting…" : "Connect LinkedIn"}
            </button>
          )}
        </div>

        {/* Company Page (LinkedIn) — separate app + flow */}
        {companyPages.map((page) => (
          <div key={page.id} className="flex items-center justify-between" style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: "#E8F1FB", borderRadius: 8 }}>
                <Linkedin size={18} color="#0A66C2" />
              </div>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>
                  {page.organization_name || "LinkedIn Company Page"}
                </div>
                <div className="text-[12px]" style={{ color: "#6B6860" }}>LinkedIn company page</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold" style={{ background: "#EAF3DE", color: "#3B6D11", borderRadius: 4, padding: "2px 8px" }}>Connected</span>
              <button onClick={() => disconnectCompanyPage(page.id)} className="text-[12px]" style={{ border: "0.5px solid #ECEAE5", borderRadius: 6, height: 28, padding: "0 12px", color: "#6B6860" }}>Disconnect</button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between" style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: "#E8F1FB", borderRadius: 8 }}>
              <Linkedin size={18} color="#0A66C2" />
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>LinkedIn Company Page</div>
              <div className="text-[12px]" style={{ color: "#9A9896" }}>
                {companyPages.length > 0 ? "Connect another page you administer" : "Post as a company page you administer"}
              </div>
            </div>
          </div>
          <button onClick={connectCompanyPage} disabled={connecting === "linkedin_pages"} className="text-[12px] font-semibold"
            style={{ background: "#E85A46", color: "#fff", borderRadius: 6, height: 32, padding: "0 14px", boxShadow: "0 4px 14px rgba(232,90,70,0.25)" }}>
            {connecting === "linkedin_pages" ? "Connecting…" : companyPages.length > 0 ? "Connect another page" : "Connect a company page"}
          </button>
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

        <div className="flex items-center justify-between" style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)" }}>
              <Instagram size={18} color="#fff" />
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>Instagram</div>
              <div className="text-[11px]" style={{ color: "#9A9896" }}>Available after Meta business verification</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold" style={{ background: "#FEF3C7", color: "#854F0B", borderRadius: 4, padding: "2px 8px" }}>Pending verification</span>
        </div>
        <div className="flex items-center justify-between" style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: "#E8F0FD", borderRadius: 8 }}>
              <Facebook size={18} color="#1877F2" />
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>Facebook</div>
              <div className="text-[11px]" style={{ color: "#9A9896" }}>Available after Meta business verification</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold" style={{ background: "#FEF3C7", color: "#854F0B", borderRadius: 4, padding: "2px 8px" }}>Pending verification</span>
        </div>
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