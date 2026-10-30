import { initialTyping, nextTyping, typingDelay } from "./useTypedHeadline";
import { validFoundingEmail, startEvent } from "./heroData";

it("cycles all seven phrases in order and loops", () => {
  let state = initialTyping;
  const seen = [state.text];
  for (let count = 0; count < 500 && seen.length < 8; count++) {
    state = nextTyping(state);
    if (state.phase === "hold") seen.push(state.text);
  }
  expect(seen).toEqual(["an app.", "a business.", "a course.", "an offer.", "a company.", "a SaaS platform.", "a tool.", "an app."]);
});
it("uses the specified typing timings", () => {
  expect(typingDelay(initialTyping)).toBe(1700);
  expect(typingDelay({ ...initialTyping, phase: "delete" })).toBe(32);
  expect(typingDelay({ ...initialTyping, phase: "pause" })).toBe(280);
  expect(typingDelay({ ...initialTyping, phase: "type" })).toBe(78);
});
it("rejects missing or malformed email", () => {
  expect(validFoundingEmail("")).toBe(false);
  expect(validFoundingEmail("not-email")).toBe(false);
  expect(validFoundingEmail("you@yourbusiness.com")).toBe(true);
});
it("sends choice and signup events only with analytics consent", () => {
  const clarity = vi.fn();
  window.clarity = clarity;
  window.moxiemoConsent = { get: () => ({ analytics: false }), onChange: vi.fn() } as unknown as typeof window.moxiemoConsent;
  startEvent("start_choice_seat");
  expect(clarity).not.toHaveBeenCalled();
  window.moxiemoConsent = { get: () => ({ analytics: true }), onChange: vi.fn() } as unknown as typeof window.moxiemoConsent;
  startEvent("start_choice_seat");
  startEvent("start_join_hero");
  expect(clarity.mock.calls).toEqual([["event", "start_choice_seat"], ["event", "start_join_hero"]]);
});
