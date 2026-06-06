import React from "react";
import { Link, useLocation } from "wouter";
import { Shield, Home, Target, Activity, BookOpen, TrendingUp } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Shield, label: "Team Builder", href: "/builder" },
  { icon: Target, label: "Matchup Simulator", href: "/simulate" },
  { icon: Activity, label: "Team Analysis", href: "/analyze" },
  { icon: BookOpen, label: "Archetypes", href: "/archetypes" },
  { icon: TrendingUp, label: "Meta Intel", href: "/meta" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground overflow-hidden">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="border-b border-border p-4 h-16 flex items-center">
            <div className="flex items-center gap-2 px-2 overflow-hidden w-full text-primary">
              <Shield className="h-6 w-6 shrink-0" />
              <span className="font-bold tracking-wider text-lg truncate uppercase group-data-[collapsible=icon]:hidden">
                VGC War Room
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2 gap-2 mt-4">
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <header className="h-16 border-b border-border flex items-center px-4 shrink-0 sticky top-0 bg-background/95 backdrop-blur z-10">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
            <div className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
              Live Link Established
            </div>
          </header>
          <main className="flex-1 p-6 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] opacity-10 pointer-events-none" />
            <div className="max-w-7xl mx-auto h-full relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
