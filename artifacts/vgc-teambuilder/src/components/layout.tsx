import React from "react";
import { Link, useLocation } from "wouter";
import { Shield, Home, Target, Activity, BookOpen, TrendingUp, User, LogOut, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
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
  { icon: Trophy, label: "Hall of Legends", href: "/legends" },
  { icon: TrendingUp, label: "Meta Intel", href: "/meta" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground overflow-hidden">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border p-4 h-16 flex items-center">
            <div className="flex items-center gap-2 px-2 overflow-hidden w-full text-sidebar-primary">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-red-500 border-2 border-sidebar-border flex items-center justify-center animate-pokeball shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                  <div className="w-2.5 h-2.5 rounded-full bg-white border border-sidebar-border" />
                </div>
              </div>
              <span className="font-bold tracking-wider text-lg truncate uppercase group-data-[collapsible=icon]:hidden" style={{ background: 'linear-gradient(135deg, #ef4444, #facc15, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                VGC Optimizer
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
          <SidebarFooter className="border-t border-border p-3">
            {user ? (
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground truncate group-data-[collapsible=icon]:hidden">{user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-8 text-muted-foreground"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </Button>
              </div>
            ) : (
              <Link href="/login" className="w-full">
                <Button variant="ghost" size="sm" className="justify-start gap-2 h-8 text-muted-foreground w-full">
                  <User className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Sign In</span>
                </Button>
              </Link>
            )}
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <header className="h-16 border-b border-border flex items-center px-4 shrink-0 sticky top-0 bg-background/95 backdrop-blur z-10">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-sparkle" />
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-sparkle" style={{ animationDelay: '0.3s' }} />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-sparkle" style={{ animationDelay: '0.6s' }} />
              </div>
              <div className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
                {user ? `Trainer: ${user.email}` : "Pok\u00e9mon Champions"}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.03),transparent_70%)] pointer-events-none" />
            <div className="max-w-7xl mx-auto h-full relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
