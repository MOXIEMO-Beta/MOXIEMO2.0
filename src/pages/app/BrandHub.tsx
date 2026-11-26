import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Check, X, Plus } from "lucide-react";

const C = {
  coral: "#FF6B5C", navy: "#14243D", paper: "#F7F5F1",
  warmPaper: "#F4F2ED", white: "#FFFFFF", ink: "#15171C",
  muted: "#6B6B6B", sage: "#B8C5A6", taupe: "#D8CEBD", border: "#E8E4DD",
};
const card: React.CSSProperties = { background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 };
const sectionLabel: React.CSSProperties = { fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 14 };
const h1Style: React.CSSProperties = { fontFamily: "'DM Sans Variable',sans-serif", fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 4 };
const btnSm: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, fontFamily: "'DM Sans Variable',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 };

type Strategy = Record<string, any>;
type Profile = {
  full_name: string | null;
  business_name: string | null;
  business_type: string | null;
  location: string | null;
  website_url: string | null;
};
type Connection = {
  platform: string;
  profile_name: string | null;
  connection_type: string | null;
  expires_at: string | null;
};

type Pillar = { name: string; description: string };

function normalisePillars(v: unknown): Pillar[] {
  if (!Array.isArray(v)) return [];
  return v.map((el) => {
    if (typeof el === "string") return { name: el, description: "" };
    if (el && typeof el === "object" && "name" in el) return { name: (el as any).name ?? "", description: (el as any).description ?? "" };
    return { name: String(el), description: "" };
  });
}

function normaliseToStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function EditableBlock({
  label,
  value,
  fieldName,
  strategyId,
  onSaved,
}: {
  label: string;
  value: string;
  fieldName: string;
  strategyId: string;
  onSaved: (field: string, val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [hovered, setHovered] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("strategies").update({ [fieldName]: draft } as any).eq("id", strategyId);
    setSaving(false);
    if (error) { toast.error("Save failed"); return; }
    onSaved(fieldName, draft);
    setEditing(false);
    toast.success("Saved");
  };

  return (
    <div
      style={{ ...card, position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={sectionLabel}>{label}</div>
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, border: `1.5px solid ${C.coral}`, borderRadius: 8, padding: "10px 12px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={save} disabled={saving} style={{ ...btnSm, background: C.coral, color: "#fff", border: "none" }}>
              <Check size={12} /> {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => { setEditing(false); setDraft(value); }} style={btnSm}>
              <X size={12} /> Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>
            {value || <span style={{ color: C.muted, fontStyle: "italic" }}>Not set</span>}
          </p>
          {hovered && (
            <button
              onClick={() => { setDraft(value); setEditing(true); }}
              style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", color: C.muted }}
            >
              <Pencil size={14} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

function AvoidPhrasesCard({
  phrases,
  strategyId,
  onSaved,
}: {
  phrases: string[];
  strategyId: string;
  onSaved: (field: string, val: any) => void;
}) {
  const [localPhrases, setLocalPhrases] = useState(phrases);
  const [adding, setAdding] = useState(false);
  const [newPhrase, setNewPhrase] = useState("");
  const [saving, setSaving] = useState(false);

  const saveToDb = async (next: string[]) => {
    setSaving(true);
    const { error } = await supabase.from("strategies").update({ avoid_phrases: next } as any).eq("id", strategyId);
    setSaving(false);
    if (error) { toast.error("Save failed"); return; }
    onSaved("avoid_phrases", next);
    toast.success("Saved");
  };

  const remove = async (i: number) => {
    const next = localPhrases.filter((_, j) => j !== i);
    setLocalPhrases(next);
    await saveToDb(next);
  };

  const add = async () => {
    if (!newPhrase.trim()) return;
    const next = [...localPhrases, newPhrase.trim()];
    setLocalPhrases(next);
    setNewPhrase("");
    setAdding(false);
    await saveToDb(next);
  };

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={sectionLabel}>Avoid phrases</div>
        <button onClick={() => setAdding(true)} style={{ ...btnSm, opacity: saving ? 0.5 : 1 }}>
          <Plus size={12} /> Add phrase
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: adding ? 12 : 0 }}>
        {localPhrases.map((phrase, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.warmPaper, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "4px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink }}>
            {phrase}
            <button onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", padding: 0 }}>
              <X size={11} />
            </button>
          </span>
        ))}
        {localPhrases.length === 0 && !adding && (
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.muted, fontStyle: "italic" }}>None set</span>
        )}
      </div>
      {adding && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            autoFocus
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); }}
            placeholder="Enter phrase…"
            style={{ flex: 1, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, border: `1.5px solid ${C.coral}`, borderRadius: 8, padding: "8px 12px", outline: "none" }}
          />
          <button onClick={add} style={{ ...btnSm, background: C.coral, color: "#fff", border: "none" }}>
            <Check size={12} /> Add
          </button>
          <button onClick={() => setAdding(false)} style={btnSm}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function BrandHub() {
  const { user } = useAuth();
  const { brandId } = useBrand();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const stratQ = supabase.from("strategies").select("*");
    const [stratRes, profRes, connRes] = await Promise.all([
      (brandId ? stratQ.eq("brand_id", brandId) : stratQ.eq("user_id", user.id)).maybeSingle(),
      supabase.from("profiles").select("full_name,business_name,business_type,location,website_url").eq("id", user.id).maybeSingle(),
      supabase.from("social_connections").select("platform,profile_name,connection_type,expires_at").eq("user_id", user.id),
    ]);
    setStrategy(stratRes.data as Strategy | null);
    setProfile(profRes.data as Profile | null);
    setConnections((connRes.data ?? []) as Connection[]);
  }, [user, brandId]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [user, loadData]);

  const handleSaved = (field: string, val: any) => {
    setStrategy((s) => s ? { ...s, [field]: val } : s);
  };

  if (loading) {
    return (
      <div style={{ background: C.paper, minHeight: "100vh", padding: "40px 48px" }}>
        <div style={{ ...card, height: 80, background: C.border, opacity: 0.4 }} />
        <div style={{ ...card, height: 80, background: C.border, opacity: 0.4 }} />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div style={{ background: C.paper, minHeight: "100vh", padding: "40px 48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 18, color: C.ink, marginBottom: 24 }}>
          No strategy yet. Complete Discovery first.
        </p>
        <button onClick={() => navigate("/app/discovery")} style={{ background: C.coral, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Begin Discovery
        </button>
      </div>
    );
  }

  const pillars = normalisePillars(strategy.content_pillars);
  const avoidPhrases = normaliseToStringArray(strategy.avoid_phrases);
  const brandVoice = strategy.brand_voice ?? strategy.tone_guidelines ?? "";

  const channelPlatforms = ["linkedin", "instagram", "facebook"] as const;
  const channelLabels: Record<string, string> = { linkedin: "💼 LinkedIn", instagram: "📸 Instagram", facebook: "📘 Facebook" };

  const getConnection = (platform: string) =>
    connections.find((c) => c.platform === platform) ?? null;

  const businessDetails = [
    { label: "Business type", value: profile?.business_type ?? "—" },
    { label: "Primary goal", value: strategy.primary_goal ?? "—" },
    { label: "Customer type", value: strategy.target_audience ? String(strategy.target_audience).slice(0, 40) : "—" },
    { label: "Geography", value: profile?.location ?? "Not set" },
  ];

  return (
    <div style={{ background: C.paper, minHeight: "100vh", padding: "40px 48px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <h1 style={h1Style}>Brand Hub</h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.muted, marginBottom: 32 }}>
          Everything I write comes from here. Keep it current.
        </p>

        {/* Positioning */}
        <EditableBlock
          label="Positioning statement"
          value={String(strategy.positioning_statement ?? "")}
          fieldName="positioning_statement"
          strategyId={strategy.id}
          onSaved={handleSaved}
        />

        {/* Voice */}
        <EditableBlock
          label="Brand voice"
          value={String(brandVoice)}
          fieldName="brand_voice"
          strategyId={strategy.id}
          onSaved={handleSaved}
        />

        {/* Content pillars */}
        <div style={card}>
          <div style={sectionLabel}>Content pillars</div>
          {pillars.length === 0 ? (
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.muted, fontStyle: "italic" }}>No pillars defined yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {pillars.map((pillar, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 12,
                    padding: "16px 14px",
                    background: i === 0 ? "rgba(255,107,92,0.06)" : C.warmPaper,
                    border: i === 0 ? "1.5px solid rgba(255,107,92,0.25)" : `1.5px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: i === 0 ? C.coral : C.muted, marginBottom: 6 }}>
                    {i === 0 ? "Primary" : `Pillar ${i + 1}`}
                  </div>
                  <p style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>
                    {pillar.name}
                  </p>
                  {pillar.description && (
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, marginTop: 6, marginBottom: 0, lineHeight: 1.5 }}>
                      {pillar.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Two-column row: business details + channel setup */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Business details */}
          <div style={card}>
            <div style={sectionLabel}>Business details</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {businessDetails.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < businessDetails.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 12, fontWeight: 700, color: C.muted, padding: "10px 0", paddingRight: 16, whiteSpace: "nowrap" as const, verticalAlign: "top" as const }}>
                      {row.label}
                    </td>
                    <td style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, padding: "10px 0", verticalAlign: "top" as const }}>
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Channel setup */}
          <div style={card}>
            <div style={sectionLabel}>Channel setup</div>
            {channelPlatforms.map((platform) => {
              const conn = getConnection(platform);
              return (
                <div key={platform} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, fontWeight: 600, color: C.ink }}>
                      {channelLabels[platform]}
                    </span>
                    {conn?.profile_name && (
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, marginLeft: 8 }}>
                        {conn.profile_name}
                      </span>
                    )}
                  </div>
                  {conn ? (
                    <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 12, fontWeight: 700, color: C.sage }}>
                      Live ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => navigate("/app/settings")}
                      style={{ ...btnSm, fontSize: 11 }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Avoid phrases */}
        <AvoidPhrasesCard
          phrases={avoidPhrases}
          strategyId={strategy.id}
          onSaved={handleSaved}
        />
      </div>
    </div>
  );
}
