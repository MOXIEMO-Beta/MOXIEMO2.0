// Derive framing facts (stage, posture) from the audit inputs + signals so
// every Vera call can judge sections in a stage-aware way. Pure function,
// no I/O. Additive — never throws, always returns valid labels.

export type Stage = "pre_launch" | "early" | "growing" | "established";
export type Posture =
  | "category_creator"
  | "founder_led_expertise"
  | "service_business"
  | "product_saas"
  | "other";

export function deriveFraming(opts: {
  inputs?: any;
  signals?: any;
  model_type?: string | null;
  low_data?: boolean | null;
}): { stage: Stage; posture: Posture } {
  const inputs = opts.inputs ?? {};
  const signals = opts.signals ?? {};
  const cc = signals.content_consistency ?? {};
  const face = signals.face_of_the_brand ?? {};
  const find = signals.findability ?? {};
  const positioning = signals.positioning ?? {};

  const waitlist = cc.waitlist_present === true;
  const blogPresent = cc.blog_present === true;
  const ranksForName = find.ranks_for_name === true;
  const revenueBand: string = (inputs.revenue ?? inputs.revenue_band ?? "").toString().toLowerCase();
  const competitorsInput: string[] = Array.isArray(inputs.competitors)
    ? inputs.competitors.filter((c: any) => typeof c === "string" && c.trim())
    : [];

  // STAGE
  let stage: Stage;
  if (waitlist) {
    stage = "pre_launch";
  } else if (/^\$?0\b|pre[- ]?revenue|no revenue/.test(revenueBand) || (!ranksForName && !blogPresent)) {
    stage = "early";
  } else if (/(>\s*1m|over\s*1m|seven[- ]figure|established)/i.test(revenueBand)) {
    stage = "established";
  } else {
    stage = "growing";
  }

  // POSTURE
  let posture: Posture;
  const stance: string = (positioning.stance_detail ?? "").toString().toLowerCase();
  const looksCategoryCreator =
    competitorsInput.length === 0 ||
    /create (?:a |the )?new category|category[- ]?creator|against (?:a |the )?behavior/.test(stance);
  const offer: string = (inputs.what_you_do ?? "").toString().toLowerCase();
  const looksSaaS = /\b(app|saas|software|platform|tool|product)\b/.test(offer);
  const looksService = /\b(agency|consult|coach|service|studio|advisor|firm)\b/.test(offer);

  if (looksCategoryCreator && (looksSaaS || waitlist)) {
    posture = "category_creator";
  } else if (opts.model_type === "founder_led" && (face.named_founder_on_site || looksService)) {
    posture = "founder_led_expertise";
  } else if (looksService) {
    posture = "service_business";
  } else if (looksSaaS) {
    posture = "product_saas";
  } else {
    posture = "other";
  }

  return { stage, posture };
}