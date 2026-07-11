// Seed a launch campaign for Lane 3 (offer_gtm) strategies.
//
// Runs at most once per strategy: guarded by
// `enhanced_foundation.launchCampaignSeeded === true`. Inserts a single
// draft campaign spanning 21 days plus day-by-day execution items pulled
// from the strategy's channelPlan, with firstMove pinned as day 1.
//
// No auto-publish. Every item is status "draft"/"planned".

import { supabase } from "@/integrations/supabase/client";

type ChannelPlanChannel = { name?: string; cadence?: string; note?: string };

// Module-level in-flight lock. Prevents duplicate inserts when the Calendar
// effect re-fires (StrictMode double-invoke, strategy state changes from
// refresh(), tab remounts) before the DB guard round-trip completes.
const inFlight = new Set<string>();

function normalizeChannelName(raw: any): string {
  const s = typeof raw === "string" ? raw : raw?.name ?? "";
  const low = String(s).toLowerCase();
  if (low.includes("linkedin")) return "linkedin";
  if (low.includes("instagram")) return "instagram";
  if (low.includes("facebook")) return "facebook";
  if (low.includes("email") || low.includes("newsletter")) return "email";
  if (low.includes("dm") || low.includes("direct")) return "email";
  return "linkedin";
}

function firstMoveChannel(firstMove: any): string {
  const t = String(firstMove?.type ?? "").toLowerCase();
  if (t === "email" || t === "dm") return "email";
  if (t === "post") return "linkedin";
  return "linkedin";
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function deriveOfferName(ef: any, strategy: any): string {
  const candidates: any[] = [
    ef?.offerPositioning?.offerName,
    ef?.offerPositioning?.name,
    ef?.offerName,
    ef?.launchMessaging?.offerName,
  ];
  for (const c of candidates) {
    const s = typeof c === "string" ? c.trim() : "";
    if (s) return s;
  }
  // Extract a short noun phrase from offerPositioning.offer: text before " that "
  const offer = typeof ef?.offerPositioning?.offer === "string" ? ef.offerPositioning.offer.trim() : "";
  if (offer) {
    const head = offer.split(/\s+that\s+/i)[0]?.replace(/^A\s+|^An\s+|^The\s+/i, "").trim();
    if (head && head.length <= 80) return head;
  }
  const goal = typeof strategy?.business_goal === "string" ? strategy.business_goal.trim() : "";
  if (goal) return goal.split(/[.,]/)[0].slice(0, 80);
  return "Offer";
}

export async function seedLaunchCampaign(strategy: any, userId: string): Promise<{ seeded: boolean; reason?: string; campaignId?: string }> {
  if (!strategy || !userId) return { seeded: false, reason: "missing_inputs" };
  if (strategy.strategy_lane !== "offer_gtm") return { seeded: false, reason: "wrong_lane" };
  const ef = (strategy.enhanced_foundation ?? {}) as any;
  if (ef.launchCampaignSeeded === true) return { seeded: false, reason: "already_seeded" };

  // Module-level lock: block concurrent invocations for the same user.
  if (inFlight.has(userId)) return { seeded: false, reason: "in_flight" };
  inFlight.add(userId);
  try {

  // DB-level guard: re-read the strategy under the lock. If another tab or an
  // earlier invocation already seeded, bail before inserting.
  const { data: fresh } = await supabase
    .from("strategies")
    .select("id, enhanced_foundation")
    .eq("user_id", userId)
    .maybeSingle();
  const freshEf = ((fresh?.enhanced_foundation as any) ?? {}) as any;
  if (freshEf.launchCampaignSeeded === true) return { seeded: false, reason: "already_seeded_fresh" };
  const strategyRowId = fresh?.id;

  const channelPlan = ef.channelPlan ?? {};
  const rawChannels: ChannelPlanChannel[] = Array.isArray(channelPlan?.channels) ? channelPlan.channels : [];
  const channelNames = rawChannels.length
    ? rawChannels.map((c) => normalizeChannelName(c))
    : ["linkedin", "email"];
  const uniqueChannels = Array.from(new Set(channelNames));

  const firstMove = ef.firstMove ?? null;
  const offerName = deriveOfferName(ef, strategy);
  const successTarget = (ef.successTarget ?? strategy.business_goal ?? "").toString().trim();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  const end = new Date(today);
  end.setDate(start.getDate() + 20); // 21-day window

  // Insert campaign row.
  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .insert({
      user_id: userId,
      name: `${offerName} launch`,
      theme: "Launch",
      campaign_type: "launch",
      start_date: toISODate(start),
      end_date: toISODate(end),
      status: "draft",
      channels: uniqueChannels,
      goals: successTarget || null,
      notes: "Seeded from your offer strategy. First move is pinned as day one.",
      color: "#E85A46",
      archived: false,
      pillars: Array.isArray(strategy.content_pillars)
        ? strategy.content_pillars.map((p: any) => (typeof p === "string" ? p : p?.name ?? "")).filter(Boolean)
        : [],
    })
    .select("id")
    .single();

  if (campErr || !campaign) {
    console.error("[seedLaunchCampaign] campaign insert failed", campErr);
    return { seeded: false, reason: "campaign_insert_failed" };
  }

  // Build execution items:
  //  - Day 1: firstMove pinned (channel = firstMove.type mapping)
  //  - Days 2..21, ~4 items/week (Mon Tue Thu Fri), round-robin remaining channels
  const items: any[] = [];
  const remainingChannels = uniqueChannels.length ? uniqueChannels : ["linkedin"];

  const day1 = new Date(start);
  const fmCh = firstMove ? firstMoveChannel(firstMove) : remainingChannels[0];
  const fmBrief = firstMove
    ? `First move (${firstMove.type ?? "message"}). ${String(firstMove.why ?? "").slice(0, 240)}`.trim()
    : `Kick off ${offerName}`;
  items.push({
    user_id: userId,
    campaign_id: campaign.id,
    date: toISODate(day1),
    channel: fmCh,
    week_number: 1,
    week_theme: "Ignite",
    content_brief: fmBrief,
    status: "planned",
  });

  const postingDays = new Set([1, 2, 4, 5]); // Mon Tue Thu Fri
  let rr = 0;
  for (let offset = 1; offset <= 20; offset++) {
    const d = new Date(start);
    d.setDate(start.getDate() + offset);
    if (!postingDays.has(d.getDay())) continue;
    const wk = Math.floor(offset / 7) + 1;
    const theme = wk === 1 ? "Ignite" : wk === 2 ? "Prove" : "Close";
    const ch = remainingChannels[rr % remainingChannels.length];
    rr++;
    items.push({
      user_id: userId,
      campaign_id: campaign.id,
      date: toISODate(d),
      channel: ch,
      week_number: wk,
      week_theme: theme,
      content_brief: `${theme} week: ${ch} touchpoint for ${offerName}. Reinforce the launch message and drive toward the offer.`,
      status: "planned",
    });
  }

  const { error: itemsErr } = await supabase.from("campaign_execution_items").insert(items);
  if (itemsErr) {
    // Atomic rollback: delete the campaign row so a partial seed does not
    // masquerade as success. Do NOT flip the guard flag; the effect will retry.
    console.error("[seedLaunchCampaign] items insert failed, rolling back campaign", itemsErr);
    await supabase.from("campaigns").delete().eq("id", campaign.id);
    return { seeded: false, reason: "items_insert_failed" };
  }

  // Flip the guard ONLY after both the campaign and its execution items land.
  const nextEf = { ...ef, launchCampaignSeeded: true, launchCampaignSeededAt: new Date().toISOString(), launchCampaignId: campaign.id };
  const guardUpdate = strategyRowId
    ? supabase.from("strategies").update({ enhanced_foundation: nextEf }).eq("id", strategyRowId)
    : supabase.from("strategies").update({ enhanced_foundation: nextEf }).eq("user_id", userId);
  const { error: efErr } = await guardUpdate;
  if (efErr) console.error("[seedLaunchCampaign] guard update failed", efErr);

  return { seeded: true, campaignId: campaign.id };
  } finally {
    inFlight.delete(userId);
  }
}