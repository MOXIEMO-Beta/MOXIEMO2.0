import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export type Segment = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_system: boolean;
};

export const PRESET_COLORS = [
  "#ff6b6b", // coral
  "#262833", // ink
  "#2dd4a8", // mint
  "#0c2340", // navy
  "#e8a87c", // sand
  "#c9a84c", // gold
];

type Props = {
  segments: Segment[];
  counts: Record<string, number>;
  totalActive: number;
  userId: string;
  onChange: () => void;
};

export default function SegmentsManager({ segments, counts, totalActive, userId, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  async function saveSegment() {
    if (!name.trim()) return;
    const { error } = await supabase.from("subscriber_segments").insert({
      user_id: userId,
      name: name.trim(),
      description: description.trim() || null,
      color,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Segment created");
    setName("");
    setDescription("");
    setColor(PRESET_COLORS[0]);
    setShowForm(false);
    onChange();
  }

  async function deleteSegment(id: string) {
    if (!confirm("Delete this segment? Tags on subscribers will remain.")) return;
    const { error } = await supabase.from("subscriber_segments").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChange();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-foreground/60" />
          <span className="font-medium">All subscribers</span>
          <span className="text-muted-foreground">({totalActive})</span>
        </div>
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="group inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
            <span className="font-medium">{seg.name}</span>
            <span className="text-muted-foreground">({counts[seg.id] ?? 0})</span>
            {!seg.is_system && (
              <button
                type="button"
                onClick={() => deleteSegment(seg.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                title="Delete segment"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> New segment
        </Button>
      </div>

      {showForm && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VIP clients" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Top tier subscribers"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Color</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition ${
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveSegment}>Save segment</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
