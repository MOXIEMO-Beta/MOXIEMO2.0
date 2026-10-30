import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useTypedHeadline } from "./useTypedHeadline";
import { phrases } from "./heroData";
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it("swaps whole phrases after exactly 2.6 seconds with reduced motion", () => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const { result, unmount } = renderHook(() => useTypedHeadline());
  expect(result.current).toBe(phrases[0]);
  act(() => vi.advanceTimersByTime(2599));
  expect(result.current).toBe(phrases[0]);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current).toBe(phrases[1]);
  unmount();
});