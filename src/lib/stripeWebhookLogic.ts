// Pure logic extracted from stripe-webhook edge function for unit testing.
// The edge function itself cannot be imported in Vitest (Deno runtime).
// This module re-implements the same logic in plain TypeScript/Node.

export type BillingPatch = {
  plan?: string;
  stripe_subscription_id?: string | null;
  subscription_status: string;
  current_period_end?: string | null;
};

export type SupabaseClientLike = {
  from: (table: string) => {
    update: (patch: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: null | { message: string } }>;
    };
  };
};

export function planFromMetadata(metadata: Record<string, string>): string {
  const p = metadata?.plan ?? "";
  return ["foundation", "growth", "scale", "founding_annual"].includes(p) ? p : "foundation";
}

export async function syncBilling(
  supabase: SupabaseClientLike,
  customerId: string,
  patch: BillingPatch,
) {
  // Write profiles (legacy)
  await supabase
    .from("profiles")
    .update(patch as Record<string, unknown>)
    .eq("stripe_customer_id", customerId);

  // Write accounts (MOX2-3 source of truth)
  const accountPatch: Record<string, unknown> = {
    subscription_status: patch.subscription_status,
  };
  if (patch.stripe_subscription_id !== undefined) {
    accountPatch.stripe_subscription_id = patch.stripe_subscription_id;
  }
  if (patch.plan) accountPatch.plan = patch.plan;
  if (patch.current_period_end !== undefined) {
    accountPatch.current_period_end = patch.current_period_end;
  }

  await supabase
    .from("accounts")
    .update(accountPatch)
    .eq("stripe_customer_id", customerId);
}

export function buildIdempotencyKey(userId: string, sessionId: string | null): string {
  const epochHour = Math.floor(Date.now() / 3_600_000);
  return `${userId}:${sessionId ?? "nosession"}:${epochHour}`;
}

export function buildIdempotencyKeyAt(userId: string, sessionId: string | null, nowMs: number): string {
  const epochHour = Math.floor(nowMs / 3_600_000);
  return `${userId}:${sessionId ?? "nosession"}:${epochHour}`;
}
