export type Billing = "monthly" | "annual";
export const DEFAULT_BILLING: Billing = "monthly";
export const pricingOffer = { firstCustomerLimit: 100, discount: 0.5, retainWhileSubscribed: true, refundDays: 30, cancellation: "billing_period_end" } as const;
export const plans = [
  { name: "Clarity", brands: 1, monthly: 99, annual: 990, promise: "Know where you stand. Know where to go.", bestFor: "Solo owners with one brand.", features: ["Brand discovery and diagnosis", "Positioning and content pillars", "Strategy-linked action plan", "Content creation in your voice", "Publishing and workflows", "Basic optimization and testing", "Performance reporting", "MOXIE check-ins (texting coming soon)"] },
  { name: "Momentum", brands: 2, monthly: 149, annual: 1490, promise: "Turn the right strategy into consistent action.", bestFor: "Growing operators with more on the go.", features: ["Everything in Clarity, plus:", "Expanded action plan", "Expanded content creation", "Expanded publishing and workflows", "Enhanced optimization and testing", "Expanded performance reporting"] },
  { name: "Multiply", brands: 3, monthly: 249, annual: 2490, promise: "Multiply your impact, not your workload.", bestFor: "Portfolio operators and multi-brand teams.", features: ["Everything in Momentum, plus:", "Cross-brand action plan", "Advanced content creation", "Multi-brand publishing and workflows", "Advanced optimization and testing", "Cross-brand performance reporting", "A separate strategy and workspace for each brand"] },
] as const;
export function getPlanPrice(plan: typeof plans[number], billing: Billing) {
  const standard = plan[billing];
  return { standard, first100: standard * (1 - pricingOffer.discount) };
}
export function formatPrice(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })}`;
}
export const comparison = [
  ["Brands included", ...plans.map(plan => String(plan.brands))],
  ["Brand discovery + diagnosis", "Included", "Included", "Included"],
  ["Positioning + content pillars", "Included", "Included", "Included"],
  ["Strategy-linked action plan", "Essential", "Expanded", "Cross-brand"],
  ["Content creation", "Core", "Expanded", "Advanced"],
  ["Publishing + workflows", "Essential", "Expanded", "Multi-brand"],
  ["Optimization + testing", "Basic", "Enhanced", "Advanced"],
  ["Performance reporting", "Core", "Expanded", "Cross-brand"],
  ["MOXIE text check-ins", "Coming soon", "Coming soon", "Coming soon"],
];
export const pricingFaqs = [
  { q: "What do I get on every plan?", a: "Brand discovery and diagnosis, positioning and content pillars, a strategy-linked action plan, content in your voice, publishing, reporting and MOXIE check-ins (texting coming soon). Plans differ by how many brands they include and how much execution and reporting you need." },
  { q: "How does the founding member discount work?", a: `Our first ${pricingOffer.firstCustomerLimit} customers become founding members. Founding members get 50% off any plan, monthly or annual, for life, as long as they keep their founding membership. If you cancel, the founding rate ends with it. Once the ${pricingOffer.firstCustomerLimit} seats are filled, new customers pay standard pricing.` },
  { q: "What counts as a brand?", a: "A brand has its own offer, market and strategy. Several locations under one name usually count as one brand. Each brand gets its own discovery, positioning, content pillars, goals, workflows and reports." },
  { q: "Can I add a fourth brand?", a: "Yes. Email hello@buildwithmoxiemo.com and we will set it up with you." },
  { q: "Does MOXIE text my customers?", a: "No. When texting opens, MOXIE will text only you and the teammates you approve. He is there to keep your plan moving." },
  { q: "How often will MOXIE text me?", a: "You decide. Two-way texting with MOXIE is coming in a future release. When it opens, choose Essential for decisions only, Balanced to keep you moving or Hands-on for active accountability, and set quiet hours, snooze, pause or reply STOP at any time." },
  { q: "Are ad spend and channel fees included?", a: "No. Paid media budgets and fees charged by third-party channels are billed by those providers." },
  { q: "Can I change plans or cancel?", a: "Yes. You can change plans as your needs change and cancel anytime from your account settings. Cancellation takes effect at the end of your billing period." },
  { q: "What happens to my strategy if I cancel?", a: "You can export your strategy and data anytime before you go." },
];