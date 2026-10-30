import { LegalLayout } from "@/components/legal/LegalLayout";
import dataDeletion from "@/content/legal/data-deletion.md?raw";

export default function DataDeletion() {
  return <LegalLayout markdown={dataDeletion} />;
}
