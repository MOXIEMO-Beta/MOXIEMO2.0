import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { from, auth, currentUser } = vi.hoisted(() => {
  const currentUser = { value: { id: "user-1" } as { id: string } | null };
  return {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-1" }, access_token: "tok" } },
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    currentUser,
  };
});

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth } }));

// useAuth always reads from the shared `currentUser` ref so tests can swap the user
// without needing vi.doMock + dynamic re-import.
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: currentUser.value,
    session: null,
    loading: false,
    isAdmin: false,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Chain builder
// ---------------------------------------------------------------------------
function makeChain(data: unknown, error: unknown = null) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "neq", "order", "limit", "maybeSingle", "single", "insert", "update", "upsert"].forEach((m) => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  (c.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  return c;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { PlanProvider, usePlan } from "./usePlan";
import { currentMonthKey } from "@/lib/planConfig";

/**
 * Configure `from` so the first call returns `profileChain` and the second
 * returns `usageChain`. Both chains are freshly built each time.
 */
function setupFromMocks(profileData: unknown, usageData: unknown) {
  const profileChain = makeChain(profileData);
  const usageChain = makeChain(usageData);
  from.mockReset();
  from
    .mockReturnValueOnce(profileChain)
    .mockReturnValueOnce(usageChain);
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <PlanProvider>{children}</PlanProvider>
      </QueryClientProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("usePlan", () => {
  beforeEach(() => {
    // Reset user to default before every test
    currentUser.value = { id: "user-1" };
    vi.clearAllMocks();
  });

  // 1. plan defaults to founding_member when no user
  it("plan defaults to founding_member when no user", async () => {
    currentUser.value = null;
    // from should not be called, but set up safe mocks anyway
    setupFromMocks(null, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plan).toBe("founding_member");
  });

  // 2. loading is false when no user
  it("loading is false immediately when user is null", async () => {
    currentUser.value = null;
    setupFromMocks(null, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  // 3. Loads plan from profiles row correctly
  it("loads plan from profiles row correctly", async () => {
    setupFromMocks({ plan: "foundation" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plan).toBe("foundation");
  });

  // 4. usage.generations_used loaded from usage_tracking
  it("loads generations_used from usage_tracking", async () => {
    const month = currentMonthKey();
    const futureReset = new Date(Date.now() + 86400 * 1000 * 30).toISOString();
    setupFromMocks(
      { plan: "founding_member" },
      { generations_used: 17, month, last_reset: null, reset_date: futureReset },
    );

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage?.generations_used).toBe(17);
    expect(result.current.usage?.month).toBe(month);
  });

  // 5. usage defaults to 0 when no usage_tracking row exists
  it("usage defaults to 0 generations_used when no usage_tracking row", async () => {
    setupFromMocks({ plan: "founding_member" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage?.generations_used).toBe(0);
    expect(result.current.usage?.month).toBe(currentMonthKey());
  });

  // 6. Elapsed reset_date returns 0 usage (optimistic reset)
  it("returns 0 generations_used when reset_date has already elapsed", async () => {
    const month = currentMonthKey();
    const pastReset = new Date(Date.now() - 86400 * 1000).toISOString();
    setupFromMocks(
      { plan: "founding_member" },
      { generations_used: 20, month, last_reset: null, reset_date: pastReset },
    );

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage?.generations_used).toBe(0);
  });

  // 7. checkGenerationLimit returns true when under limit (founding_member with 10 used)
  it("checkGenerationLimit returns true when under limit", async () => {
    const month = currentMonthKey();
    const futureReset = new Date(Date.now() + 86400 * 1000 * 30).toISOString();
    setupFromMocks(
      { plan: "founding_member" },
      { generations_used: 10, month, last_reset: null, reset_date: futureReset },
    );

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let allowed!: boolean;
    await act(async () => {
      allowed = await result.current.checkGenerationLimit();
    });

    expect(allowed).toBe(true);
    expect(result.current.upgradeOpen).toBeNull();
  });

  // 8. checkGenerationLimit returns false + opens upgrade at limit (founding_member with 25 used)
  it("checkGenerationLimit returns false and opens upgrade at limit", async () => {
    const month = currentMonthKey();
    const futureReset = new Date(Date.now() + 86400 * 1000 * 30).toISOString();
    setupFromMocks(
      { plan: "founding_member" },
      { generations_used: 25, month, last_reset: null, reset_date: futureReset },
    );

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let allowed!: boolean;
    await act(async () => {
      allowed = await result.current.checkGenerationLimit();
    });

    expect(allowed).toBe(false);
    expect(result.current.upgradeOpen).toBe("founding_member");
  });

  // 9. checkGenerationLimit returns true for growth plan (unlimited = null)
  it("checkGenerationLimit returns true for growth plan (unlimited)", async () => {
    const month = currentMonthKey();
    setupFromMocks(
      { plan: "growth" },
      { generations_used: 999, month, last_reset: null, reset_date: null },
    );

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let allowed!: boolean;
    await act(async () => {
      allowed = await result.current.checkGenerationLimit();
    });

    expect(allowed).toBe(true);
  });

  // 10. checkGenerationLimit returns false when user is null
  it("checkGenerationLimit returns false when user is null", async () => {
    currentUser.value = null;
    setupFromMocks(null, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let allowed!: boolean;
    await act(async () => {
      allowed = await result.current.checkGenerationLimit();
    });

    expect(allowed).toBe(false);
  });

  // 11. handleGenerationResponse({ limit_reached: true, ... }) returns true
  it("handleGenerationResponse with limit_reached: true returns true", async () => {
    setupFromMocks({ plan: "founding_member" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let blocked!: boolean;
    act(() => {
      blocked = result.current.handleGenerationResponse(
        { limit_reached: true, plan: "founding_member", used: 25 },
        null,
      );
    });

    expect(blocked).toBe(true);
  });

  // 12. handleGenerationResponse({ limit_reached: false }) returns false
  it("handleGenerationResponse with limit_reached: false returns false", async () => {
    setupFromMocks({ plan: "founding_member" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let blocked!: boolean;
    act(() => {
      blocked = result.current.handleGenerationResponse({ limit_reached: false }, null);
    });

    expect(blocked).toBe(false);
  });

  // 13. handleGenerationResponse with error message containing "limit_reached" returns true
  it("handleGenerationResponse with error message containing limit_reached returns true", async () => {
    setupFromMocks({ plan: "founding_member" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let blocked!: boolean;
    act(() => {
      blocked = result.current.handleGenerationResponse(
        {},
        { message: "Generation blocked: limit_reached for this plan" },
      );
    });

    expect(blocked).toBe(true);
    expect(result.current.upgradeOpen).toBe("founding_member");
  });

  // 14. applyServerUsage({ used: 50, plan: "foundation", month: "2026-11" }) updates usage and plan
  it("applyServerUsage updates usage and plan from server snapshot", async () => {
    setupFromMocks({ plan: "founding_member" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyServerUsage({ used: 50, plan: "foundation", month: "2026-11" });
    });

    expect(result.current.usage?.generations_used).toBe(50);
    expect(result.current.usage?.month).toBe("2026-11");
    expect(result.current.plan).toBe("foundation");
  });

  // 15. applyServerUsage(null) does nothing
  it("applyServerUsage with null does nothing", async () => {
    setupFromMocks({ plan: "founding_member" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const usageBefore = result.current.usage?.generations_used ?? 0;
    const planBefore = result.current.plan;

    act(() => {
      result.current.applyServerUsage(null);
    });

    expect(result.current.plan).toBe(planBefore);
    expect(result.current.usage?.generations_used).toBe(usageBefore);
  });

  // 16. openUpgrade() sets upgradeOpen to current plan
  it("openUpgrade sets upgradeOpen to current plan", async () => {
    setupFromMocks({ plan: "foundation" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.upgradeOpen).toBeNull();

    act(() => {
      result.current.openUpgrade();
    });

    expect(result.current.upgradeOpen).toBe("foundation");
  });

  // 16b. openUpgrade(planId) sets upgradeOpen to the provided plan
  it("openUpgrade with explicit plan sets upgradeOpen to that plan", async () => {
    setupFromMocks({ plan: "foundation" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.openUpgrade("growth");
    });

    expect(result.current.upgradeOpen).toBe("growth");
  });

  // 17. closeUpgrade() sets upgradeOpen to null
  it("closeUpgrade sets upgradeOpen to null", async () => {
    setupFromMocks({ plan: "founding_member" }, null);

    const { result } = renderHook(() => usePlan(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.openUpgrade();
    });

    expect(result.current.upgradeOpen).toBe("founding_member");

    act(() => {
      result.current.closeUpgrade();
    });

    expect(result.current.upgradeOpen).toBeNull();
  });
});
