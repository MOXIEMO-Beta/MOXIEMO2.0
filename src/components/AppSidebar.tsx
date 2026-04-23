import { LayoutDashboard, Compass, FileText, CalendarDays, BarChart3, Settings, LogOut, Sparkles } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { MoxieLogo } from "./MoxieLogo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const main = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Strategy", url: "/app/strategy", icon: Compass },
  { title: "Content", url: "/app/content", icon: FileText },
  { title: "Calendar", url: "/app/calendar", icon: CalendarDays },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
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
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => {
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

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Setup</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10 rounded-lg">
                  <NavLink to="/app/discovery">
                    <Sparkles className="h-[18px] w-[18px] text-accent" />
                    {!collapsed && <span className="text-sm font-medium">MOXIE Discovery</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10 rounded-lg">
                  <NavLink to="/app/settings">
                    <Settings className="h-[18px] w-[18px] text-muted-foreground" />
                    {!collapsed && <span className="text-sm font-medium">Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenuButton onClick={() => supabase.auth.signOut()} className="h-10 rounded-lg text-muted-foreground">
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}