import { supabase } from "@/integrations/supabase/client";
import { getCtaVariant } from "@/lib/ctaVariant";
import { getVisitCampaign } from "./campaign";

export type FoundingEntry = "hero" | "section";
export type FoundingResult = { status: "success" | "already" | "error"; message: string };
const results: Record<FoundingResult["status"], FoundingResult> = {
  success: { status: "success", message: "You are on the founding list. I will be in touch when the next release opens." },
  already: { status: "already", message: "Looks like you are already on the list. Check your email for next steps." },
  error: { status: "error", message: "Something went wrong. Try again." },
};

export async function joinFoundingList({ firstName, email, entry }: {
  firstName: string; email: string; entry: FoundingEntry;
}): Promise<FoundingResult> {
  try {
    const { data, error } = await supabase.functions.invoke("join-waitlist", {
      body: { name: firstName, email, source: `start_${entry}`, cta_variant: getCtaVariant(), ...getVisitCampaign() },
    });
    if (data?.error === "already_registered") return { ...results.already };
    if (error) {
      if (error.context instanceof Response && error.context.status === 409) return { ...results.already };
      return { ...results.error };
    }
    return { ...(data?.success === true ? results.success : results.error) };
  } catch {
    return { ...results.error };
  }
}
