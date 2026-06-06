import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

type Asset = {
  id: string;
  url: string;
  filename: string | null;
  file_type: string | null;
  uploaded_at: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  onSelect: (url: string) => void;
};

export default function LibraryAssetsDrawer({ open, onOpenChange, userId, onSelect }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setQ("");
    supabase
      .from("assets")
      .select("id, url, filename, file_type, uploaded_at")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          toast.error("Couldn't load library");
          return;
        }
        const imgs = ((data as Asset[]) ?? []).filter(
          (a) => !a.file_type || a.file_type.startsWith("image/"),
        );
        setAssets(imgs);
      });
  }, [open, userId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter((a) => (a.filename ?? "").toLowerCase().includes(term));
  }, [assets, q]);

  const handlePick = (a: Asset) => {
    onSelect(a.url);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="text-base">From library</SheetTitle>
        </SheetHeader>

        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by filename…"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <ImageOff className="h-5 w-5" />
              <p>
                No images in your library yet. Images you upload via Add image will be saved here automatically.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No images match "{q}".
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handlePick(a)}
                  className="group flex flex-col gap-1 text-left"
                >
                  <div className="aspect-square overflow-hidden rounded-md border border-border bg-muted transition-colors group-hover:border-accent">
                    <img
                      src={a.url}
                      alt={a.filename ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="truncate text-[10px] text-muted-foreground" title={a.filename ?? ""}>
                    {a.filename ?? "untitled"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}