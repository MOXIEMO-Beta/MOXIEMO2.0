// Maps any AI-call failure (supabase.functions.invoke error, fetch error,
// stream error, or thrown Error) to a human-readable message.
//
// Kinds:
//   - "discovery"  → strategy generation / synthesis failures
//   - "content"    → content / email / social generation failures
//   - "generic"    → everything else (refine, ideas, hashtags, etc.)

export type AiErrorKind = "discovery" | "content" | "generic";

const COPY: Record<AiErrorKind, string> = {
  discovery:
    "MOXIE is taking a moment to think. Your answers are saved — refresh the page in a minute and your strategy will be ready.",
  content:
    "Generation is temporarily unavailable. Your content slot is saved. Try again in a few minutes.",
  generic:
    "Something went a bit sideways. Your work is saved. Please try again in a moment.",
};

export function aiErrorMessage(kind: AiErrorKind, _err?: unknown): string {
  return COPY[kind];
}