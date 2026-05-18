import { LayoutDashboard, Compass, FileText, CalendarDays, BarChart3, Settings, LogOut, Sparkles, Mail, Share2, Target } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { MoxieLogo } from "./MoxieLogo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { FeedbackButton } from "./FeedbackButton";
import { UsageIndicator } from "./UsageIndicator";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; end?: boolean };

const workspace: NavItem[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Strategy", url: "/app/strategy", icon: Compass },
];

const execute: NavItem[] = [
  { title: "Content", url: "/app/content", icon: FileText },
  { title: "Marketing Planner", url: "/app/calendar", icon: CalendarDays },
  { title: "Email", url: "/app/email", icon: Mail },
  { title: "Social", url: "/app/social", icon: Share2 },
];

const analyze: NavItem[] = [
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { title: "Goals", url: "/app/goals", icon: Target },
];

const setup: NavItem[] = [
  { title: "Start Here", url: "/app/discovery", icon: Sparkles },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

const groups: { label: string; items: NavItem[] }[] = [
  { label: "Workspace", items: workspace },
  { label: "Execute", items: execute },
  { label: "Analyze", items: analyze },
  { label: "Setup", items: setup },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (url: string, end?: boolean) => (end ? location.pathname === url : location.pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-4">
        {collapsed ? <MoxieLogo showWord={false} /> : <MoxieLogo />}
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.url, item.end);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className={cn("h-10 rounded-lg", active && "bg-foreground text-background hover:bg-foreground hover:text-background")}>
                        <NavLink to={item.url} end={item.end}>
                          <item.icon className={cn("h-[18px] w-[18px]", active ? "text-accent" : "text-muted-foreground")} />
                          {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <>
            <div className="mb-2">
              <UsageIndicator compact />
            </div>
            <div className="mb-2">
              <FeedbackButton />
            </div>
          </>
        )}
        <SidebarMenuButton onClick={() => supabase.auth.signOut()} className="h-10 rounded-lg text-muted-foreground">
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}