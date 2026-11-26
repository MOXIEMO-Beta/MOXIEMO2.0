import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLAN_LABEL } from "@/lib/planConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Loader2 } from "lucide-react";

type Profile = {
  full_name: string | null;
  business_name: string | null;
  business_type: string | null;
  location: string | null;
  website_url: string | null;
};

type Connection = {
  id: string;
  platform: string;
  profile_name: string | null;
  connection_type: string | null;
  organization_id: string | null;
  organization_name: string | null;
  expires_at: string | null;
};

type ZernioPlatform = "linkedin" | "instagram" | "facebook" | "x";

function ChannelRow({
  emoji,
  name,
  connected,
  profileName,
  onConnect,
  onDisconnect,
  connecting,
  note,
}: {
  emoji: string;
  name: string;
  connected: boolean;
  profileName?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{emoji}</span>
        <div>
          <div className="font-semibold text-sm text-foreground">{name}</div>
          {connected && profileName && (
            <div className="text-xs text-muted-foreground">{profileName}</div>
          )}
          {!connected && note && (
            <div className="text-xs text-muted-foreground">{note}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {connected ? (
          <>
            <span className="text-xs font-bold text-brand-sage">Connected ✓</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              disabled={connecting}
            >
              Reconnect
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={connecting}
            className="bg-accent text-white hover:bg-accent/90"
          >
            {connecting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Connecting…</> : `Connect ${name}`}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [, setProfile] = useState<Profile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsAgreed, setSmsAgreed] = useState(false);
  const [smsSubmitting, setSmsSubmitting] = useState(false);
  const [smsEnrolled, setSmsEnrolled] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("social_connections").select("id,platform,profile_name,connection_type,organization_id,organization_name,expires_at").eq("user_id", user.id),
      supabase.from("sms_consent").select("id,phone,consented").eq("user_id", user.id).maybeSingle(),
    ]).then(([profileRes, connRes, smsRes]) => {
      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
        setName(profileRes.data.full_name ?? "");
        setBusinessName(profileRes.data.business_name ?? "");
      }
      setConnections((connRes.data ?? []) as Connection[]);
      if ((smsRes.data as { consented?: boolean } | null)?.consented) setSmsEnrolled(true);
    });
  }, [user]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal", {});
      if (error || (data as { error?: string })?.error) {
        toast.error((data as { error?: string })?.error ?? "Could not open billing portal");
        return;
      }
      if ((data as { url?: string })?.url) window.location.href = (data as { url: string }).url;
    } finally {
      setPortalLoading(false);
    }
  };

  const submitSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsAgreed) { toast.error("Tick the consent box to continue."); return; }
    const digits = smsPhone.replace(/\D/g, "");
    if (digits.length !== 10) { toast.error("Enter a valid 10-digit US number."); return; }
    setSmsSubmitting(true);
    try {
      const { error } = await supabase.from("sms_consent").insert({
        user_id: user!.id, phone: `+1${digits}`, consented: true,
        source: "settings", consented_at: new Date().toISOString(),
      } as { user_id: string; phone: string; consented: boolean; source: string; consented_at: string });
      if (error) throw error;
      setSmsEnrolled(true);
      toast.success("You're enrolled in MOXIE texts.");
    } catch {
      toast.error("Could not save SMS consent. Try again.");
    } finally {
      setSmsSubmitting(false);
    }
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const saveField = async (field: "full_name" | "business_name", value: string) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ [field]: value } as { full_name?: string; business_name?: string }).eq("id", user.id);
    if (error) { toast.error("Save failed. Please try again."); return; }
    toast.success("Saved");
  };

  const reloadConnections = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("social_connections")
      .select("id,platform,profile_name,connection_type,organization_id,organization_name,expires_at")
      .eq("user_id", user.id);
    setConnections((data ?? []) as Connection[]);
  };

  const connectViaZernio = async (platform: ZernioPlatform) => {
    if (!user) return;
    setConnecting(platform);
    try {
      const { data, error } = await supabase.functions.invoke("zernio-connect", {
        body: { action: "auth_url", platform },
      });
      if (error) throw error;
      if (!(data as { url?: string })?.url) throw new Error("No auth URL returned");
      window.location.href = (data as { url: string }).url;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : `Could not start ${platform} connection`);
      setConnecting(null);
    }
  };

  const disconnectViaZernio = async (platform: ZernioPlatform) => {
    setDisconnecting(platform);
    try {
      const { data, error } = await supabase.functions.invoke("zernio-connect", {
        body: { action: "disconnect", platform },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      await reloadConnections();
      toast.success("Disconnected");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  const linkedInConn = connections.find((c) => c.platform === "linkedin");
  const instagramConn = connections.find((c) => c.platform === "instagram");
  const facebookConn = connections.find((c) => c.platform === "facebook");
  const xConn = connections.find((c) => c.platform === "x" || c.platform === "twitter");

  return (
    <div className="min-h-screen bg-brand-paper p-10">
      <div className="max-w-[680px] mx-auto">
        <h1 className="font-display text-[28px] font-bold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">Manage your account and connected channels.</p>

        {/* Account */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <SectionLabel className="mb-3.5">Account</SectionLabel>

          <div className="mb-5">
            <Label htmlFor="settings-name">Full name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => saveField("full_name", name)}
              placeholder="Your name"
              className="mt-1.5 h-11"
            />
          </div>

          <div className="mb-5">
            <Label htmlFor="settings-business">Business name</Label>
            <Input
              id="settings-business"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              onBlur={() => saveField("business_name", businessName)}
              placeholder="Your business"
              className="mt-1.5 h-11"
            />
          </div>

          <div className="mb-5">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              value={user?.email ?? ""}
              readOnly
              className="mt-1.5 h-11 bg-muted text-muted-foreground cursor-default"
            />
          </div>

          <div>
            <Label>Plan</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="bg-brand-sage text-white rounded-full px-3.5 py-1 text-[13px] font-bold">
                {PLAN_LABEL[plan]}
              </span>
              {plan !== "founding_member" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Opening…</> : "Manage billing →"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Connected channels */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <SectionLabel className="mb-1">Connected channels</SectionLabel>
          <p className="text-[13px] text-muted-foreground mb-4">
            Powered by Zernio. Connect once to publish and read results across all channels.
          </p>

          <ChannelRow
            emoji="💼"
            name="LinkedIn"
            connected={!!linkedInConn}
            profileName={linkedInConn?.profile_name}
            onConnect={() => connectViaZernio("linkedin")}
            onDisconnect={() => disconnectViaZernio("linkedin")}
            connecting={connecting === "linkedin" || disconnecting === "linkedin"}
          />
          <ChannelRow
            emoji="📸"
            name="Instagram"
            connected={!!instagramConn}
            profileName={instagramConn?.profile_name}
            onConnect={() => connectViaZernio("instagram")}
            onDisconnect={() => disconnectViaZernio("instagram")}
            connecting={connecting === "instagram" || disconnecting === "instagram"}
            note="Requires a Business or Creator account linked to a Facebook Page"
          />
          <ChannelRow
            emoji="📘"
            name="Facebook"
            connected={!!facebookConn}
            profileName={facebookConn?.profile_name}
            onConnect={() => connectViaZernio("facebook")}
            onDisconnect={() => disconnectViaZernio("facebook")}
            connecting={connecting === "facebook" || disconnecting === "facebook"}
          />
          <ChannelRow
            emoji="𝕏"
            name="X (Twitter)"
            connected={!!xConn}
            profileName={xConn?.profile_name}
            onConnect={() => connectViaZernio("x")}
            onDisconnect={() => disconnectViaZernio("x")}
            connecting={connecting === "x" || disconnecting === "x"}
          />
        </div>

        {/* MOXIE texts */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <SectionLabel className="mb-3.5">MOXIE texts</SectionLabel>
          {smsEnrolled ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-bold text-brand-sage">Enrolled ✓</span>
              <span className="text-[13px] text-muted-foreground">You'll receive post approvals and weekly summaries by text.</span>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={async () => {
                  if (!user) return;
                  await supabase.from("sms_consent").update({ consented: false, opted_out_at: new Date().toISOString() } as { consented: boolean; opted_out_at: string }).eq("user_id", user.id);
                  setSmsEnrolled(false);
                  toast.success("You've opted out of MOXIE texts.");
                }}
              >
                Opt out
              </Button>
            </div>
          ) : (
            <form onSubmit={submitSms} noValidate>
              <p className="text-[13px] text-muted-foreground mb-4">
                Get post approval requests and weekly summaries by text. 1–5 messages/week. Reply STOP any time.
              </p>
              <div className="mb-5">
                <Label htmlFor="sms-phone">Mobile number (US)</Label>
                <Input
                  id="sms-phone"
                  type="tel"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(formatPhone(e.target.value))}
                  placeholder="(555) 000-0000"
                  className="mt-1.5 h-11"
                />
              </div>
              <div className="flex items-start gap-2.5 mb-4">
                <input
                  type="checkbox"
                  id="sms-settings-consent"
                  checked={smsAgreed}
                  onChange={(e) => setSmsAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                />
                <label htmlFor="sms-settings-consent" className="text-xs text-muted-foreground leading-relaxed">
                  I agree to receive recurring automated texts from MOXIEMO. Not required. Msg &amp; data rates may apply. Reply STOP to opt out.
                </label>
              </div>
              <Button
                type="submit"
                disabled={smsSubmitting || !smsAgreed}
                className="h-9 bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {smsSubmitting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</> : "Sign up for MOXIE texts"}
              </Button>
            </form>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-card border border-destructive/30 rounded-2xl p-6">
          <SectionLabel className="mb-3.5">Danger zone</SectionLabel>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="text-sm font-semibold text-foreground">Sign out</div>
              <div className="text-xs text-muted-foreground">Sign out of your MOXIEMO account</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >
              Sign out
            </Button>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => toast.info("Email hello@buildwithmoxiemo.com to delete your account.")}
              className="text-sm text-destructive underline underline-offset-2 hover:text-destructive/80"
            >
              Delete account
            </button>
            <div className="text-xs text-muted-foreground mt-1">
              This will permanently delete all your data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
