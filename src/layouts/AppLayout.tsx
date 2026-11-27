import { Outlet, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { AppSidebar, APP_NAV_ITEMS } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";

function initialsFromUser(name?: string | null, email?: string | null): string {
  const src = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!src) return "?";
  const parts = src.replace(/[._-]+/g, " ").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || src[0].toUpperCase();
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const current =
    [...APP_NAV_ITEMS].sort((a, b) => b.url.length - a.url.length).find((i) =>
      i.end ? pathname === i.url : pathname.startsWith(i.url),
    ) || APP_NAV_ITEMS[0];
  const Icon = current.icon;

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    null;
  const initials = initialsFromUser(fullName, user?.email ?? null);

  return (
    <div className="moxie-app-shell min-h-dvh flex w-full" style={{ background: "#F7F5F1" }}>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">
        <header
          className="flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30"
          style={{
            height: 52,
            background: "#FFFFFF",
            borderBottom: "1px solid #ECEAE5",
          }}
        >
          <div className="flex items-center gap-2.5 pl-10 lg:pl-0" style={{ color: "#0E0F10" }}>
            <Icon className="h-4 w-4" />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", color: "#0E0F10" }}>
              {current.title}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              aria-label="Notifications"
              className="rounded-full p-1.5 transition-colors hover:bg-[#F2F0EB]"
              style={{ color: "#6B6860" }}
              type="button"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 32,
                height: 32,
                background: "#E85A46",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
              aria-label={fullName ?? user?.email ?? "Account"}
            >
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}