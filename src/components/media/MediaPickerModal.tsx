import { Dialog, DialogContent } from "@/components/ui/dialog";
import MediaLibrary, { type MediaAsset } from "./MediaLibrary";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  onSelect: (asset: MediaAsset) => void;
};

export default function MediaPickerModal({ open, onOpenChange, userId, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden"
        style={{
          maxWidth: 1100,
          width: "95vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ overflowY: "auto", flex: 1 }}>
          <MediaLibrary
            userId={userId}
            mode="picker"
            onSelect={(a) => {
              onSelect(a);
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}