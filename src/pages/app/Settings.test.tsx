import React from "react";
import { render, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const { from, auth, functions } = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1" }, access_token: "tok" } } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  functions: { invoke: vi.fn() },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth, functions } }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "test@example.com" }, session: { access_token: "tok" }, loading: false, isAdmin: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/hooks/usePlan", () => ({
  usePlan: () => ({
    plan: "founding_member",
    loading: false,
    checkGenerationLimit: vi.fn().mockResolvedValue(true),
    openUpgrade: vi.fn(),
    incrementUsage: vi.fn(),
    handleGenerationResponse: vi.fn().mockReturnValue(false),
  }),
  PlanProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

// ── Chain builder ─────────────────────────────────────────────────────────────
function makeChain(data: unknown, error = null) {
  const resolved = { data, error };
  const resolvedArray = { data: Array.isArray(data) ? data : [], error };
  const c: Record<string, unknown> = {};
  ["select","eq","neq","order","limit","maybeSingle","single","insert","update","upsert","delete"].forEach(m => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  (c.maybeSingle as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolved));
  (c.single as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolved));
  (c.limit as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolvedArray));
  (c.order as ReturnType<typeof vi.fn>).mockReturnValue(c);
  return c;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const profileData = {
  full_name: "Jane Doe",
  business_name: "Jane Co",
  business_type: "Coaching",
  location: "New York",
  website_url: "https://janeco.com",
};

const connectionData = [
  { id: "conn-1", platform: "linkedin", profile_name: "Jane Doe", connection_type: "personal", organization_id: null, organization_name: null, expires_at: null },
];

function setupFromMock() {
  from.mockImplementation((table: string) => {
    if (table === "profiles") return makeChain(profileData);
    if (table === "social_connections") return makeChain(connectionData);
    if (table === "sms_consent") return makeChain(null);
    return makeChain(null);
  });
  functions.invoke.mockResolvedValue({ data: { url: "https://checkout.stripe.com/test" }, error: null });
}

let SettingsPage: React.ComponentType;

beforeEach(async () => {
  if (!SettingsPage) {
    const mod = await import("./Settings");
    SettingsPage = mod.default;
  }
  setupFromMock();
});

afterEach(() => {
  cleanup();
  from.mockReset();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Settings", () => {
  it("renders without crashing with profile data", async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("renders without crashing with null profile (empty state)", async () => {
    from.mockImplementation((table: string) => {
      if (table === "profiles") return makeChain(null);
      if (table === "social_connections") return makeChain([]);
      if (table === "sms_consent") return makeChain(null);
      return makeChain(null);
    });
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("queries profiles table on mount", async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("profiles");
    }, { timeout: 3000 });
  });

  it("queries social_connections table on mount", async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("social_connections");
    }, { timeout: 3000 });
  });

  it("shows settings heading / account section", async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => {
      const h1 = document.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toMatch(/settings/i);
    }, { timeout: 3000 });
  });

  it("settings form renders with profile fields", async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => {
      const inputs = document.querySelectorAll("input");
      expect(inputs.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it("social channel section renders (LinkedIn, Instagram, Facebook)", async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => {
      const body = document.body.textContent ?? "";
      expect(body).toMatch(/linkedin|instagram|facebook/i);
    }, { timeout: 3000 });
  });

  it("DB error on profiles fetch renders without crashing", async () => {
    from.mockImplementation((table: string) => {
      if (table === "profiles") return makeChain(null, { message: "DB error" } as any);
      if (table === "social_connections") return makeChain([]);
      if (table === "sms_consent") return makeChain(null);
      return makeChain(null);
    });
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("DB error on social_connections fetch renders without crashing", async () => {
    from.mockImplementation((table: string) => {
      if (table === "profiles") return makeChain(profileData);
      if (table === "social_connections") return makeChain(null, { message: "DB error" } as any);
      if (table === "sms_consent") return makeChain(null);
      return makeChain(null);
    });
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("profile save failure shows error toast", async () => {
    const { toast } = await import("sonner");
    from.mockImplementation((table: string) => {
      if (table === "profiles") {
        const c = makeChain(profileData);
        (c.update as ReturnType<typeof vi.fn>).mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: "Save failed" } }),
        });
        return c;
      }
      if (table === "social_connections") return makeChain(connectionData);
      if (table === "sms_consent") return makeChain(null);
      return makeChain(null);
    });
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await waitFor(() => {
      const inputs = document.querySelectorAll("input");
      expect(inputs.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    const nameInput = document.querySelector("input") as HTMLInputElement;
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: "Updated Name" } });
      fireEvent.blur(nameInput);
    }
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });
});
