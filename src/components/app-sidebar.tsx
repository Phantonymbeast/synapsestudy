import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Brain, ListChecks, CalendarClock, Lightbulb, TrendingUp, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SynapseWordmark } from "./synapse-logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "AI Tutor", url: "/tutor", icon: Brain },
  { title: "Quiz Generator", url: "/quiz", icon: ListChecks },
  { title: "Study Planner", url: "/planner", icon: CalendarClock },
  { title: "Reflection", url: "/reflection", icon: Lightbulb },
  { title: "Progress", url: "/progress", icon: TrendingUp },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const isActive = (url: string) => path === url || path.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/60 py-4">
        <Link to="/dashboard" className="px-2">
          <SynapseWordmark />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupLabel>Learn</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <div className="flex flex-col gap-2">
          {email && (
            <div className="truncate px-2 text-xs text-muted-foreground" title={email}>
              {email}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/auth";
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}