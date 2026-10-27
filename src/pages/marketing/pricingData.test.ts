import { describe, expect, it } from "vitest";
import { DEFAULT_BILLING, getPlanPrice, plans, pricingOffer } from "./pricingData";

describe("approved pricing", () => {
  it("starts with monthly billing", () => expect(DEFAULT_BILLING).toBe("monthly"));
  it.each([
    [0, "monthly", 99, 49.5], [0, "annual", 990, 495],
    [1, "monthly", 149, 74.5], [1, "annual", 1490, 745],
    [2, "monthly", 249, 124.5], [2, "annual", 2490, 1245],
  ] as const)("plan %i %s prices are %i and %i", (index, billing, standard, first100) => {
    expect(getPlanPrice(plans[index], billing)).toEqual({ standard, first100 });
  });
  it.each([[0, 1], [1, 2], [2, 3]] as const)("plan %i includes %i brands", (index, brands) => expect(plans[index].brands).toBe(brands));
  it("limits the offer to 100 customers", () => expect(pricingOffer.firstCustomerLimit).toBe(100));
  it("retains the discount while the plan is kept", () => expect(pricingOffer.retainWhileSubscribed).toBe(true));
  it("keeps a 30 day refund window", () => expect(pricingOffer.refundDays).toBe(30));
  it("cancels at the end of the billing period", () => expect(pricingOffer.cancellation).toBe("billing_period_end"));
});