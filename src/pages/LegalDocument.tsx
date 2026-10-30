import { useLocation } from "react-router-dom";
import { LegalLayout } from "@/components/legal/LegalLayout";
import cookies from "@/content/legal/cookies.md?raw";
import refunds from "@/content/legal/refunds.md?raw";
import affiliates from "@/content/legal/affiliates.md?raw";

export default function LegalDocument() {
  const { pathname } = useLocation();
  const markdown = pathname === "/cookies" ? cookies : pathname === "/refunds" ? refunds : affiliates;
  return <LegalLayout markdown={markdown} />;
}