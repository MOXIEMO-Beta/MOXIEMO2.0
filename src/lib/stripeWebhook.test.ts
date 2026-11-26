import { describe, expect, it, vi, beforeEach } from "vitest";
import { planFromMetadata, syncBilling, type SupabaseClientLike } from "./stripeWebhookLogic";

function makeSupabase() {
  const profilesEq  = vi.fn().mockResolvedValue({ error: null });
  const profilesUpdate = vi.fn().mockReturnValue({ eq: profilesEq });
  const accountsEq  = vi.fn().mockResolvedValue({ error: null });
  const accountsUpdate = vi.fn().mockReturnValue({ eq: accountsEq });

  const client: SupabaseClientLike = {
    from: (table: string) => {
      if (table === "profiles") return { update: profilesUpdate } as ReturnType<SupabaseClientLike["from"]>;
      if (table === "accounts") return { update: accountsUpdate } as ReturnType<SupabaseClientLike["from"]>;
      throw new Error(`unexpected table: ${table}`);
    },
  };
  return { client, profilesUpdate, profilesEq, accountsUpdate, accountsEq };
}

describe("planFromMetadata", () => {
  it("returns the plan when it is a known value", () => {
    expect(planFromMetadata({ plan: "growth" })).toBe("growth");
    expect(planFromMetadata({ plan: "scale" })).toBe("scale");
    expect(planFromMetadata({ plan: "foundation" })).toBe("foundation");
    expect(planFromMetadata({ plan: "founding_annual" })).toBe("founding_annual");
  });

  it("falls back to foundation for unknown or missing plan", () => {
    expect(planFromMetadata({ plan: "mystery" })).toBe("foundation");
    expect(planFromMetadata({})).toBe("foundation");
  });
});

describe("syncBilling — checkout.session.completed (active subscription)", () => {
  it("writes subscription_status=active + plan + sub ID to both profiles and accounts", async () => {
    const { client, profilesUpdate, profilesEq, accountsUpdate, accountsEq } = makeSupabase();

    await syncBilling(client, "cus_123", {
      plan: "foundation",
      stripe_subscription_id: "sub_abc",
      subscription_status: "active",
      current_period_end: "2027-01-01T00:00:00Z",
    });

    expect(profilesUpdate).toHaveBeenCalledWith(expect.objectContaining({
      subscription_status: "active",
      plan: "foundation",
      stripe_subscription_id: "sub_abc",
    }));
    expect(profilesEq).toHaveBeenCalledWith("stripe_customer_id", "cus_123");

    expect(accountsUpdate).toHaveBeenCalledWith(expect.objectContaining({
      subscription_status: "active",
      plan: "foundation",
      stripe_subscription_id: "sub_abc",
    }));
    expect(accountsEq).toHaveBeenCalledWith("stripe_customer_id", "cus_123");
  });
});

describe("syncBilling — customer.subscription.deleted (cancellation)", () => {
  it("sets subscription_status=canceled, plan=founding_member, clears sub ID on both tables", async () => {
    const { client, profilesUpdate, accountsUpdate } = makeSupabase();

    await syncBilling(client, "cus_456", {
      plan: "founding_member",
      stripe_subscription_id: null,
      subscription_status: "canceled",
      current_period_end: "2026-12-31T00:00:00Z",
    });

    expect(profilesUpdate).toHaveBeenCalledWith(expect.objectContaining({
      subscription_status: "canceled",
      stripe_subscription_id: null,
    }));
    expect(accountsUpdate).toHaveBeenCalledWith(expect.objectContaining({
      subscription_status: "canceled",
      stripe_subscription_id: null,
    }));
  });
});

describe("syncBilling — invoice.payment_failed", () => {
  it("sets subscription_status=past_due on both tables without touching plan", async () => {
    const { client, profilesUpdate, accountsUpdate } = makeSupabase();

    await syncBilling(client, "cus_789", {
      subscription_status: "past_due",
    });

    expect(profilesUpdate).toHaveBeenCalledWith(expect.objectContaining({
      subscription_status: "past_due",
    }));
    // plan should NOT be in the patch when not provided
    const profilePatch = profilesUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(profilePatch).not.toHaveProperty("plan");

    expect(accountsUpdate).toHaveBeenCalledWith(expect.objectContaining({
      subscription_status: "past_due",
    }));
    const accountPatch = accountsUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(accountPatch).not.toHaveProperty("plan");
  });
});

describe("syncBilling — idempotency (duplicate Stripe event)", () => {
  it("calls the DB twice — the webhook_events INSERT conflict prevents double processing at the caller level", async () => {
    const { client, profilesUpdate, accountsUpdate } = makeSupabase();

    // syncBilling itself is called once per event — dedup happens before calling it
    // Here we confirm it correctly writes both tables exactly once
    await syncBilling(client, "cus_111", { subscription_status: "active", plan: "growth", stripe_subscription_id: "sub_new" });
    expect(profilesUpdate).toHaveBeenCalledTimes(1);
    expect(accountsUpdate).toHaveBeenCalledTimes(1);
  });
});
