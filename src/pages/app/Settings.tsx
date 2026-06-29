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

type SocialConn = { id: string; platform: string; profile_name: string | null };

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
    supabase.from("social_connections").select("id, platform, profile_name").eq("user_id", user.id)
      .then(({ data }) => setConnections((data ?? []) as any));
    if (typeof window !== "undefined" && window.location.hash === "#integrations") {
      setTimeout(() => document.getElementById("integrations")?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [user]);

  const linkedin = connections.find((c) => c.platform === "linkedin");

  async function connectLinkedIn() {
    if (!user) return;
    setConnecting("linkedin");
    try {
      const { data, error } = await supabase.functions.invoke("social-oauth-start", { body: { platform: "linkedin" } });
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

      <div id="integrations" className="mt-10">
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