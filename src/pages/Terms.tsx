import { LegalLayout } from "@/components/legal/LegalLayout";
import terms from "@/content/legal/terms.md?raw";

export default function Terms() {
  return <LegalLayout markdown={terms} />;
}
