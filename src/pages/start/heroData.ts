export type HeroChoice = "assessment" | "seat" | "questions" | "how";
export const phrases = ["an app.", "a business.", "a course.", "an offer.", "a company.", "a SaaS platform.", "a tool."];
export const fixedHeadline = "You built an app, a business, a course, an offer, a company, a SaaS platform or a tool. Now stop guessing how to grow it.";
export const initialMessage = "Hi, I am MOXIE. Tell me what you built and I will help you find your next growth move. Where do you want to start?";
export const messages = {
  assessment: "Good place to start. Share your website and I will show you where your next growth opportunity might be hiding. It is free.",
  seat: "Great call! We want you to be a part of what we are building. Here is what founding members get.",
  questions: "Ask away. Here is what people ask me most.",
  how: initialMessage,
};
export const benefits = ["Product updates as we build", "Invitations to upcoming releases", "Founding-member information as it becomes available", "50% off for life, as long as you keep your founding membership. Only 100 seats."];
export const questions = [
  ["What can I do today?", "Run your free growth assessment. It is the first part of MOXIEMO to open, and it shows you where your next growth opportunity might be hiding. The rest opens release by release, and founding members get an invitation to each one."],
  ["What does it cost?", "The growth assessment is free. When the full platform opens there are three plans: Clarity at $99, Momentum at $149 and Multiply at $249 a month. Every plan publishes the posts you approve and shows you what is working. Founding members get 50% off for life, as long as they keep their founding membership."],
  ["What is a founding member?", "One of the first 100 customers to start a paid plan. Join the founding list now to get product updates and invitations to upcoming releases. Founding members get 50% off for life, as long as they keep their founding membership."],
  ["Why not just use ChatGPT?", "You can get a post from ChatGPT. You cannot get a CMO. I learn your business once, build your strategy, keep your voice, and remember every test and what it did. Each month I know more about your business, not less."],
  ["Will it sound like me?", "Yes. I learn your voice in discovery, and you approve everything before it goes out."],
  ["Does anything post without me?", "No. Nothing publishes until you approve it."],
  ["I sell a product, not a service. Does this work for me?", "Yes. Product brands get their own discovery questions, so your plan covers what is in it, who it is for, and why they should pick yours."],
  ["Can I text you?", "Not yet. Two-way texting is coming in a future release. When it opens, I will text you what needs you, like the week to approve and your reminders, and you can text me back. Join the founding list and you will hear when it is ready."],
] as const;
export function validFoundingEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
export function startEvent(event: string) {
  if (typeof window !== "undefined" && window.moxiemoConsent?.get()?.analytics === true) window.clarity?.("event", event);
}
export function openSeat() { window.dispatchEvent(new Event("moxiemo:start-seat")); }
export function openAssessment() {
  window.dispatchEvent(new Event("moxiemo:start-assessment"));
  window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}
