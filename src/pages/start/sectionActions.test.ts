import { openAssessment, startEvent } from "./heroData";

it("opens the hero assessment and returns to the top", () => {
  const listener = vi.fn();
  window.addEventListener("moxiemo:start-assessment", listener);
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  openAssessment();
  expect(listener).toHaveBeenCalledTimes(1);
  expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  window.removeEventListener("moxiemo:start-assessment", listener);
  scroll.mockRestore();
  vi.unstubAllGlobals();
});

it("tracks lower-section actions only with analytics consent", () => {
  const clarity = vi.fn();
  window.clarity = clarity;
  window.moxiemoConsent = { get: () => ({ analytics: false }) } as typeof window.moxiemoConsent;
  startEvent("start_assess_section");
  startEvent("start_join_section");
  expect(clarity).not.toHaveBeenCalled();
  window.moxiemoConsent = { get: () => ({ analytics: true }) } as typeof window.moxiemoConsent;
  startEvent("start_assess_section");
  startEvent("start_join_section");
  expect(clarity.mock.calls).toEqual([["event", "start_assess_section"], ["event", "start_join_section"]]);
});