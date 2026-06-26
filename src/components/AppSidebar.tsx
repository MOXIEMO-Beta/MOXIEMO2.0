import {
  LayoutDashboard,
  Compass,
  FileText,
  CalendarDays,
  BarChart3,
  Settings,
  Sparkles,
  Mail,
  Share2,
  Target,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/hooks/usePlan";
import { GENERATION_LIMIT, PLAN_LABEL } from "@/lib/planConfig";
import logoAsset from "@/assets/moxiemo-logo-sage.png.asset.json";
import { FeedbackButton } from "./FeedbackButton";

export type AppNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  end?: boolean;
};

const workspace: AppNavItem[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Strategy", url: "/app/strategy", icon: Compass },
];
const execute: AppNavItem[] = [
  { title: "Content", url: "/app/content", icon: FileText },
  { title: "Campaign Planner", url: "/app/calendar", icon: CalendarDays },
  { title: "Email", url: "/app/email", icon: Mail },
  { title: "Social", url: "/app/social", icon: Share2 },
];
const analyze: AppNavItem[] = [
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { title: "Goals", url: "/app/goals", icon: Target },
];
const setup: AppNavItem[] = [
  { title: "Start Here", url: "/app/discovery", icon: Sparkles },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

const GROUPS: { label: string; items: AppNavItem[] }[] = [
  { label: "Workspace", items: workspace },
  { label: "Execute", items: execute },
  { label: "Analyze", items: analyze },
  { label: "Setup", items: setup },
];

export const APP_NAV_ITEMS: AppNavItem[] = GROUPS.flatMap((g) => g.items);

const SIDEBAR_BG = "#B8C5A6";
const CORAL = "#E85A46";
const INK = "#0E0F10";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function resetLabel(resetDate?: string | null): string {
  const d = resetDate ? new Date(resetDate) : null;
  if (!d || isNaN(d.getTime())) {
    const fb = new Date();
    fb.setDate(fb.getDate() + 30);
    return `Resets ${fb.toLocaleString(undefined, { month: "long" })} ${ordinal(fb.getDate())}`;
  }
  return `Resets ${d.toLocaleString(undefined, { month: "long" })} ${ordinal(d.getDate())}`;
}

function PlanCard() {
  const { plan, usage, loading } = usePlan();
  if (loading) return null;
  const limit = GENERATION_LIMIT[plan];
  const used = usage?.generations_used ?? 0;
  const unlimited = limit === null;
  const remaining = unlimited ? null : Math.max(0, (limit ?? 0) - used);
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.08)",
        borderRadius: 8,
        padding: 12,
        color: INK,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span
          style={{
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(0,0,0,0.5)",
            fontWeight: 600,
          }}
        >
          Plan
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: CORAL }}>{PLAN_LABEL[plan]}</span>
      </div>
      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.7)", lineHeight: 1.35 }}>
        {unlimited ? (
          <>Unlimited generations</>
        ) : (
          <>
            <span style={{ color: INK, fontWeight: 600 }}>{remaining}</span> generations left
          </>
        )}
      </div>
      {!unlimited && (
        <div style={{ fontSize: 10.5, color: "rgba(0,0,0,0.5)", marginTop: 4 }}>
          {resetLabel(usage?.reset_date)}
        </div>
      )}
      <Link
        to="/pricing"
        style={{
          marginTop: 8,
          display: "inline-block",
          fontSize: 11,
          fontWeight: 600,
          color: CORAL,
        }}
      >
        Upgrade your plan →
      </Link>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 220,
        background: SIDEBAR_BG,
        boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "18px 16px 14px" }}>
        <img
          src={logoAsset.url}
          alt="MOXIEMO — One Platform. Confident Marketing."
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 10px 12px" }}>
        {GROUPS.map((group) => (
          <div key={group.label} style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 9.5,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(0,0,0,0.38)",
                fontWeight: 700,
                padding: "0 10px 6px",
              }}
            >
              {group.label}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="moxie-app-nav-item"
                      style={({ isActive }) => ({
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        height: 34,
                        padding: "0 10px",
                        margin: "2px 0",
                        borderRadius: 6,
                        borderLeft: isActive
                          ? `2px solid ${CORAL}`
                          : "2px solid transparent",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#1A2010" : "rgba(0,0,0,0.52)",
                        background: isActive ? "rgba(255,255,255,0.38)" : "transparent",
                        textDecoration: "none",
                        transition: "background 120ms ease, color 120ms ease",
                      })}
                    >
                      <Icon className="h-[16px] w-[16px]" />
                      <span>{item.title}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Plan card */}
      <div style={{ padding: "0 14px 10px" }}>
        <PlanCard />
      </div>

      {/* Footer links */}
      <div
        style={{
          padding: "10px 14px 16px",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div className="moxie-app-feedback-slot">
          <FeedbackButton />
        </div>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          style={{
            background: "transparent",
            border: "none",
            padding: "6px 4px",
            textAlign: "left",
            fontSize: 12,
            color: "rgba(0,0,0,0.45)",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* Hover override — applied via global selector since NavLink style prop can't express hover. */
if (typeof document !== "undefined" && !document.getElementById("moxie-app-nav-hover")) {
  const s = document.createElement("style");
  s.id = "moxie-app-nav-hover";
  s.textContent = `
    .moxie-app-nav-item:hover {
      background: rgba(255,255,255,0.38) !important;
      color: #1A2010 !important;
    }
    .moxie-app-feedback-slot button {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 6px 4px !important;
      height: auto !important;
      width: auto !important;
      justify-content: flex-start !important;
      font-size: 12px !important;
      color: rgba(0,0,0,0.45) !important;
      font-weight: 400 !important;
    }
    .moxie-app-feedback-slot button:hover {
      color: #1A2010 !important;
    }
    .moxie-app-feedback-slot button svg { display: none !important; }
    .moxie-app-feedback-slot button span { font-size: 12px !important; }
  `;
  document.head.appendChild(s);
}