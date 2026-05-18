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