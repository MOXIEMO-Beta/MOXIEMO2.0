import { useEffect, useState } from "react";
import { phrases } from "./heroData";
export type TypingState = { index: number; text: string; phase: "hold" | "delete" | "pause" | "type" };
export const initialTyping: TypingState = { index: 0, text: phrases[0], phase: "hold" };
export function typingDelay(state: TypingState) {
  return { hold: 1700, delete: 32, pause: 280, type: 78 }[state.phase];
}
export function nextTyping(state: TypingState): TypingState {
  if (state.phase === "hold") return { ...state, text: state.text.slice(0, -1), phase: "delete" };
  if (state.phase === "delete") {
    const text = state.text.slice(0, -1);
    return { ...state, text, phase: text ? "delete" : "pause" };
  }
  const index = state.phase === "pause" ? (state.index + 1) % phrases.length : state.index;
  const text = phrases[index].slice(0, state.text.length + 1);
  return { index, text, phase: text === phrases[index] ? "hold" : "type" };
}
export function useTypedHeadline() {
  const [state, setState] = useState(initialTyping);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const timer = window.setTimeout(() => setState(nextTyping(state)), typingDelay(state));
    return () => clearTimeout(timer);
  }, [state]);
  return state.text;
}
