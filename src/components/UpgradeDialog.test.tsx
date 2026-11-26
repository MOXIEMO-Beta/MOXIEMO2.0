import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { functions } = vi.hoisted(() => ({
  functions: { invoke: vi.fn() },
}));

vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// ---------------------------------------------------------------------------
// usePlan mock — values controlled per-test via module-level variables
// ---------------------------------------------------------------------------
const mockCloseUpgrade = vi.fn();
let mockUpgradeOpen: string | null = null;

vi.mock("@/hooks/usePlan", () => ({
  usePlan: () => ({
    upgradeOpen: mockUpgradeOpen,
    closeUpgrade: mockCloseUpgrade,
    plan: "founding_member",
    loading: false,
    usage: null,
    refresh: vi.fn(),
    checkGenerationLimit: vi.fn(),
    incrementUsage: vi.fn(),
    handleGenerationResponse: vi.fn(),
    applyServerUsage: vi.fn(),
    openUpgrade: vi.fn(),
  }),
  PlanProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import { UpgradeDialog } from "./UpgradeDialog";
import { toast } from "sonner";

function renderDialog() {
  return render(<UpgradeDialog />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("UpgradeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpgradeOpen = null;
    // Default: stripe-checkout returns a valid URL
    functions.invoke.mockResolvedValue({ data: { url: "https://checkout.stripe.com/test" }, error: null });
  });

  afterEach(() => {
    cleanup();
  });

  // ---- Positive ----------------------------------------------------------

  it("dialog is hidden when upgradeOpen is null", () => {
    mockUpgradeOpen = null;
    renderDialog();
    // The DialogContent should not be present when open=false
    expect(screen.queryByText(/You've used your/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Upgrade to/i })).not.toBeInTheDocument();
  });

  it("dialog shows when upgradeOpen is 'founding_member'", () => {
    mockUpgradeOpen = "founding_member";
    renderDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("title shows '25 free generations' copy for founding_member", () => {
    mockUpgradeOpen = "founding_member";
    renderDialog();
    expect(screen.getByText(/25 free generations/i)).toBeInTheDocument();
  });

  it("CTA says 'Upgrade to Foundation' for founding_member", () => {
    mockUpgradeOpen = "founding_member";
    renderDialog();
    expect(
      screen.getByRole("button", { name: /Upgrade to Foundation/i }),
    ).toBeInTheDocument();
  });

  it("title shows '100 generations' copy for foundation plan", () => {
    mockUpgradeOpen = "foundation";
    renderDialog();
    expect(screen.getByText(/100 generations/i)).toBeInTheDocument();
  });

  it("CTA says 'Upgrade to Growth' for foundation plan", () => {
    mockUpgradeOpen = "foundation";
    renderDialog();
    expect(
      screen.getByRole("button", { name: /Upgrade to Growth/i }),
    ).toBeInTheDocument();
  });

  it("Stripe checkout invoked with correct plan on CTA click (founding_member → foundation)", async () => {
    mockUpgradeOpen = "founding_member";
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Foundation/i }));
    await waitFor(() =>
      expect(functions.invoke).toHaveBeenCalledWith("stripe-checkout", {
        body: { plan: "foundation" },
      }),
    );
  });

  it("Stripe checkout invoked with correct plan on CTA click (foundation → growth)", async () => {
    mockUpgradeOpen = "foundation";
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Growth/i }));
    await waitFor(() =>
      expect(functions.invoke).toHaveBeenCalledWith("stripe-checkout", {
        body: { plan: "growth" },
      }),
    );
  });

  it("'Maybe later' button calls closeUpgrade", () => {
    mockUpgradeOpen = "founding_member";
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Maybe later/i }));
    expect(mockCloseUpgrade).toHaveBeenCalledTimes(1);
  });

  // ---- Negative ----------------------------------------------------------

  it("stripe-checkout returns data.error → toast.error shown", async () => {
    functions.invoke.mockResolvedValueOnce({
      data: { error: "Could not create session" },
      error: null,
    });
    mockUpgradeOpen = "founding_member";
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Foundation/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not create session"),
    );
  });

  it("stripe-checkout returns a supabase function error → toast.error shown", async () => {
    functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: "Edge function error" },
    });
    mockUpgradeOpen = "founding_member";
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Foundation/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalled(),
    );
  });

  it("stripe-checkout returns no URL → no redirect (window.location.href unchanged)", async () => {
    functions.invoke.mockResolvedValueOnce({ data: {}, error: null });
    const originalHref = window.location.href;
    mockUpgradeOpen = "founding_member";
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Foundation/i }));
    await waitFor(() => expect(functions.invoke).toHaveBeenCalled());
    // window.location.href should not have been changed to a Stripe URL
    expect(window.location.href).toBe(originalHref);
  });

  it("network error on invoke → toast.error shown", async () => {
    functions.invoke.mockRejectedValueOnce(new Error("fetch failed"));
    mockUpgradeOpen = "founding_member";
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Foundation/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("fetch failed"));
    expect(screen.getByRole("button", { name: /Upgrade to Foundation/i })).not.toBeDisabled();
  });
});
