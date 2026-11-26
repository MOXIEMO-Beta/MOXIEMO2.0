import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

// ---------------------------------------------------------------------------
// Helper: a component that can throw on demand
// ---------------------------------------------------------------------------
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return <div>OK</div>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("ErrorBoundary", () => {
  // Suppress React's own console.error for intentional throws so test output stays clean
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    cleanup();
  });

  // ---- Positive ----------------------------------------------------------

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders custom fallback prop when error thrown", () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom error UI</div>}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
  });

  it("shows default error UI with 'Something went wrong' when no fallback prop", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Try again/i })).toBeInTheDocument();
  });

  it("'Try again' button resets the error boundary so children re-render", () => {
    // We render Bomb in a wrapper so we can control shouldThrow after reset.
    // After clicking "Try again", ErrorBoundary clears hasError, children render again.
    // If Bomb still throws we'd loop — render it in a controlled way:
    // We render with shouldThrow=true first, then verify "Try again" shows the children path.
    // Since we can't flip the prop after render without a wrapper, we test that
    // after clicking "Try again" the boundary re-renders its children slot
    // (even if Bomb throws again, we confirm the state reset path runs).
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    // Rerender with shouldThrow=false before clicking Try again so children show
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  // ---- Negative ----------------------------------------------------------

  it("catching a thrown error in a child does not crash the boundary itself", () => {
    expect(() =>
      render(
        <ErrorBoundary>
          <Bomb shouldThrow />
        </ErrorBoundary>,
      ),
    ).not.toThrow();
    // Boundary is still present in the DOM
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it("componentDidCatch logs the error via console.error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    // React calls console.error at minimum once for unhandled render errors;
    // our componentDidCatch also calls it with the "[MOXIEMO Error Boundary]" prefix.
    const calls = consoleErrorSpy.mock.calls;
    const boundaryCall = calls.find((args) =>
      String(args[0]).includes("[MOXIEMO Error Boundary]"),
    );
    expect(boundaryCall).toBeDefined();
    // The first arg after the prefix should be the Error instance
    const errorArg = boundaryCall?.[1];
    expect(errorArg).toBeInstanceOf(Error);
    expect((errorArg as Error).message).toBe("Test error");
  });
});
