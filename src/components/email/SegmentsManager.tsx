import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Tag } from "lucide-react";
import { toast } from "sonner";

export type Segment = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_system: boolean;
};

export const PRESET_COLORS = [
  "#FF6B5C", // coral
  "#262833", // ink
  "#2dd4a8", // mint
  "#0c2340", // navy
  "#e8a87c", // sand
  "#c9a84c", // gold
];

type Props = {
  segments: Segment[];
  counts: Record<string, number>;
  userId: string;
  onChange: () => void;
  activeFilter?: string | null;
  onFilterChange?: (segmentId: string | null) => void;
};

export default function SegmentsManager({ segments, counts, userId, onChange, activeFilter, onFilterChange }: Props) {
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
      {segments.length === 0 && !showForm ? (
        <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Tag className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">You haven't created any lists yet.</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Lists let you send the right email to the right people — customers, subscribers, leads, community members — whatever makes sense for your business.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Create your first list
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 items-center">
          {segments.map((seg) => {
            const isActive = activeFilter === seg.id;
            return (
              <div
                key={seg.id}
                className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                  isActive ? "border-foreground bg-foreground text-background" : "bg-background"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onFilterChange?.(isActive ? null : seg.id)}
                  className="inline-flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                  <span className="font-medium">{seg.name}</span>
                  <span className={isActive ? "opacity-80" : "text-muted-foreground"}>({counts[seg.id] ?? 0})</span>
                </button>
                {!seg.is_system && (
                  <button
                    type="button"
                    onClick={() => deleteSegment(seg.id)}
                    className={`${isActive ? "opacity-80" : "opacity-0 group-hover:opacity-100"} hover:text-destructive transition`}
                    title="Delete list"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
          {activeFilter && (
            <button
              type="button"
              onClick={() => onFilterChange?.(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear filter
            </button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5" /> New list
          </Button>
        </div>
      )}

      {showForm && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">List name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Customers, Newsletter readers, VIP members, Workshop attendees..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Who is in this list?"
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
            <Button size="sm" onClick={saveSegment}>Save list</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
