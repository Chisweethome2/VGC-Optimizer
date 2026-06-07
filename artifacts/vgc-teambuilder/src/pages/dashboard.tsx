import React from "react";
import {
  useGetCurrentRegulation,
  useListTeams,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Sparkles, Zap, Activity, Info } from "lucide-react";

export default function Dashboard() {
  const { data: reg, isLoading: regLoading } = useGetCurrentRegulation();
  const { data: teams, isLoading: teamsLoading } = useListTeams();

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-yellow-300/80">
        <Info className="h-4 w-4 shrink-0" />
        <span>This is an <strong>unofficial</strong> community VGC service. Not affiliated with or endorsed by The Pokemon Company, Nintendo, or Game Freak.</span>
      </div>

      <Card className="border-border bg-card/30 backdrop-blur">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-bold mb-2">What is Pokemon VGC?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The <strong>Video Game Championships (VGC)</strong> is the official competitive format for Pokemon video games, run by The Pokemon Company. Players build teams of 4-6 Pokemon and battle in <strong>doubles</strong> format (2 vs 2) with complex rules around items, abilities, stats, and positioning. Every season has a rotating regulation set that determines which Pokemon are legal, creating a constantly evolving metagame where strategy and preparation determine the champion.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">What This Tool Does</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                VGC Optimizer helps you <strong>build, analyze, and refine</strong> competitive teams. Use the <strong>Team Builder</strong> to assemble Pokemon with moves, items, and EV spreads. Run <strong>Team Analysis</strong> to identify type weaknesses and coverage gaps. Simulate your team against <strong>meta archetypes</strong> to see how you match up. Browse <strong>real tournament data</strong> in Meta Intel, study the <strong>Hall of Legends</strong> to learn from past champions, and explore <strong>Archetypes</strong> to understand the strategies that define each format.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <span className="relative">
              <span className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-lg">\u26A1</span>
            </span>
            <span className="bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 bg-clip-text text-transparent">Trainer\u0027s HQ</span>
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm ml-[52px]">
            League connection \u2714
          </p>
        </div>
        <Button asChild className="btn-primary-glow gap-2">
          <Link href="/builder">
            <Sparkles className="h-4 w-4" /> Build Team
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 border-primary/20 bg-card/50 backdrop-blur card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Activity className="h-4 w-4 text-red-400" />
              </span>
              <span className="text-red-400 uppercase tracking-wider text-sm">Active Regulation</span>
            </CardTitle>
            <CardDescription>Current VGC ruleset</CardDescription>
          </CardHeader>
          <CardContent>
            {regLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : reg ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-bold">{reg.label}</h3>
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 animate-charge">
                    LIVE
                  </Badge>
                </div>
                <p className="text-muted-foreground">{reg.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm bg-black/20 p-4 rounded-lg border border-border">
                  <div>
                    <span className="text-muted-foreground block mb-1">Start Date</span>
                    <span className="font-mono">{new Date(reg.startDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">End Date</span>
                    <span className="font-mono">{reg.endDate ? new Date(reg.endDate).toLocaleDateString() : "TBD"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No active regulation found.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-card/50 backdrop-blur card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-yellow-400" />
              </span>
              <span className="text-yellow-400 uppercase tracking-wider text-sm">Trainer Card</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-muted-foreground">Teams Built</span>
                <span className="font-mono font-bold text-lg text-yellow-400">{teamsLoading ? "..." : teams?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-muted-foreground">Available Moves</span>
                <span className="font-mono font-bold text-lg text-blue-400">937</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pokemon Roster</span>
                <span className="font-mono font-bold text-lg text-green-400">209</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-blue-400" />
          </span>
          <h2 className="text-xl font-bold">Your Battle Box</h2>
        </div>
        
        {teamsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card key={team.id} className="hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] bg-card/50 cursor-pointer group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate group-hover:text-red-400 transition-colors">{team.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">{team.regulation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {team.slots.map((slot) => (
                      <Badge key={slot.slot} variant="secondary" className="text-xs">
                        {slot.pokemonName || "\u2500\u2500\u2500"}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-card/20">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-400/40" />
            </div>
            <p className="text-muted-foreground mb-4">No teams assembled yet, Trainer!</p>
            <Button variant="outline" asChild className="btn-primary-glow">
              <Link href="/builder">Build Your First Team</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
