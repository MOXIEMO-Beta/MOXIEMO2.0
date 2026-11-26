import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockGetSession, mockOnAuthStateChange, mockFrom, mockQueryClientClear } = vi.hoisted(() => {
  const mockQueryClientClear = vi.fn();
  const mockGetSession = vi.fn();
  const mockOnAuthStateChange = vi.fn();
  const mockFrom = vi.fn();
  return { mockGetSession, mockOnAuthStateChange, mockFrom, mockQueryClientClear };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
}));

// Intercept useQueryClient so we can track .clear() calls
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: () => ({ clear: mockQueryClientClear }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { AuthProvider, useAuth } from "./useAuth";

function makeProfileChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  ["select", "eq", "neq", "order", "limit", "maybeSingle", "single"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  (chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  return chain;
}

function makeUnsubscribe() {
  return vi.fn();
}

function makeSubscription(unsubscribe = makeUnsubscribe()) {
  return { data: { subscription: { unsubscribe } } };
}

/** Capture the onAuthStateChange callback so tests can fire it manually. */
let capturedAuthCallback: ((evt: string, session: unknown) => void) | null = null;

function setupDefaultMocks({
  session = null as unknown,
  profileData = null as unknown,
  profileError = null as unknown,
} = {}) {
  mockGetSession.mockResolvedValue({ data: { session } });

  mockOnAuthStateChange.mockImplementation((cb: (evt: string, s: unknown) => void) => {
    capturedAuthCallback = cb;
    return makeSubscription();
  });

  mockFrom.mockReturnValue(makeProfileChain(profileData, profileError));
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedAuthCallback = null;
  });

  // 1. loading is true before session resolves, false after
  it("loading is true before session resolves, false after", async () => {
    let resolveSession!: (v: unknown) => void;
    const sessionPromise = new Promise((res) => { resolveSession = res; });
    mockGetSession.mockReturnValue(sessionPromise);
    mockOnAuthStateChange.mockImplementation((cb: (evt: string, s: unknown) => void) => {
      capturedAuthCallback = cb;
      return makeSubscription();
    });
    mockFrom.mockReturnValue(makeProfileChain(null));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    expect(result.current.loading).toBe(true);

    act(() => {
      resolveSession({ data: { session: null } });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  // 2. user is null when no session
  it("user is null when no session", async () => {
    setupDefaultMocks({ session: null });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  // 3. user is populated from session user
  it("user is populated from session user", async () => {
    const fakeUser = { id: "user-abc", email: "test@example.com" };
    const fakeSession = { user: fakeUser, access_token: "tok-123" };
    setupDefaultMocks({ session: fakeSession, profileData: { is_admin: false } });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.session).toEqual(fakeSession);
  });

  // 4. isAdmin is false by default (no session)
  it("isAdmin is false by default when no session", async () => {
    setupDefaultMocks({ session: null });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  // 5. isAdmin becomes true when JWT app_metadata has app_role: 'admin'
  it("isAdmin becomes true when profiles returns is_admin: true", async () => {
    const fakeUser = { id: "user-admin", app_metadata: { app_role: "admin" } };
    const fakeSession = { user: fakeUser, access_token: "tok" };
    setupDefaultMocks({ session: fakeSession, profileData: null });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });
  });

  // 6. isAdmin is false when profiles returns { is_admin: false }
  it("isAdmin is false when profiles returns is_admin: false", async () => {
    const fakeUser = { id: "user-regular" };
    const fakeSession = { user: fakeUser, access_token: "tok" };
    setupDefaultMocks({ session: fakeSession, profileData: { is_admin: false } });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false);
    });
  });

  // 7. isAdmin resets to false on SIGNED_OUT event
  it("isAdmin resets to false on SIGNED_OUT event", async () => {
    const fakeUser = { id: "user-so", app_metadata: { app_role: "admin" } };
    const fakeSession = { user: fakeUser, access_token: "tok" };
    setupDefaultMocks({ session: fakeSession, profileData: null });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });

    act(() => {
      capturedAuthCallback?.("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false);
    });
  });

  // 8. isAdmin resets to false on USER_UPDATED event
  it("isAdmin resets to false on USER_UPDATED event", async () => {
    const fakeUser = { id: "user-uu", app_metadata: { app_role: "admin" } };
    const fakeSession = { user: fakeUser, access_token: "tok" };
    setupDefaultMocks({ session: fakeSession, profileData: null });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });

    // USER_UPDATED fires with null session — isAdmin should reset to false
    act(() => {
      capturedAuthCallback?.("USER_UPDATED", null);
    });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false);
    });
  });

  // 9. Handles getSession returning null session gracefully
  it("handles getSession returning null session gracefully", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockImplementation((cb: (evt: string, s: unknown) => void) => {
      capturedAuthCallback = cb;
      return makeSubscription();
    });
    mockFrom.mockReturnValue(makeProfileChain(null));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  // 10. Handles profiles fetch error without crashing (is_admin stays false)
  it("handles profiles fetch error without crashing — isAdmin stays false", async () => {
    const fakeUser = { id: "user-err" };
    const fakeSession = { user: fakeUser, access_token: "tok" };
    setupDefaultMocks({
      session: fakeSession,
      profileData: null,
      profileError: new Error("DB error"),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  // 11. Clears query cache on SIGNED_OUT
  it("calls queryClient.clear() on SIGNED_OUT event", async () => {
    const fakeUser = { id: "user-clr" };
    const fakeSession = { user: fakeUser, access_token: "tok" };
    setupDefaultMocks({ session: fakeSession, profileData: { is_admin: false } });

    renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
    });

    act(() => {
      capturedAuthCallback?.("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(mockQueryClientClear).toHaveBeenCalled();
    });
  });

  // bonus: queryClient.clear() also called on USER_UPDATED
  it("calls queryClient.clear() on USER_UPDATED event", async () => {
    const fakeUser = { id: "user-upd" };
    const fakeSession = { user: fakeUser, access_token: "tok" };
    setupDefaultMocks({ session: fakeSession, profileData: { is_admin: false } });

    renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
    });

    act(() => {
      capturedAuthCallback?.("USER_UPDATED", null);
    });

    await waitFor(() => {
      expect(mockQueryClientClear).toHaveBeenCalled();
    });
  });
});
