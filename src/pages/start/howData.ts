export const howStages = [
  { name: "Discover", line: "Pick up to three goals, then tell me about your business the way you would brief a new marketing lead. About 30 minutes, and you can stop and come back." },
  { name: "Diagnose", line: "I look at where your brand stands today and name the gap between that and where you want to go. Your website is one piece of evidence. Your answers count for more." },
  { name: "Define", line: "We name who you are for, what you say, and the few moves that will get you to your goal. That is your strategy. Download it, share it, build from it." },
  { name: "Prioritize", line: "I turn your strategy into a 90-day plan with milestones. You always know the next move, and why it comes first." },
  { name: "Execute", line: "I create thirty days of content, each piece part of a test. You approve every week, and I publish to the accounts you connect." },
  { name: "Measure and adapt", line: "On day 7 and day 14 I tell you what moved and whether the test worked. That shapes next month." },
];
export const deliverables = [
  { name: "Brand growth strategy", line: "Built from discovery. Yours to download." },
  { name: "A 30-day plan with its tests", line: "A month of content, each piece part of a test." },
  { name: "Brand Hub", line: "Strategy, growth assessment and brand kit in one place." },
  { name: "Free growth assessment", line: "Where your brand stands today." },
  { name: "Growth", line: "What is working, and what we learned." },
  { name: "Ask MOXIE", line: "Message MOXIE any time." },
];
export function stageProgress(stage: number, final = false) {
  return final || stage === 6 ? 1 : (stage - 1) / 6;
}
export function nextStage(stage: number) { return Math.min(6, stage + 1); }
export function previousStage(stage: number) { return Math.max(1, stage - 1); }
