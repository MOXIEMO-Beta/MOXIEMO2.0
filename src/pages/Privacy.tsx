import { LegalLayout } from "@/components/legal/LegalLayout";
import privacy from "@/content/legal/privacy.md?raw";

export default function Privacy() {
  return <LegalLayout markdown={privacy} />;
}
