import React from "react";
import {
  useHealthCheck,
  useGetCurrentRegulation,
  useListTeams,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Shield, Layers } from "lucide-react";

export default function Dashboard() {
  const { data: health, isLoading: healthLoading } = useHealthCheck();
  const { data: reg, isLoading: regLoading } = useGetCurrentRegulation();
  const { data: teams, isLoading: teamsLoading } = useListTeams();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary uppercase">Command Center</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">System Status: {healthLoading ? "Checking..." : health?.status || "Unknown"}</p>
        </div>
        <Button asChild>
          <Link href="/builder">
            New Team <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Activity className="h-5 w-5" />
              Active Regulation
            </CardTitle>
            <CardDescription>Current ruleset for VGC</CardDescription>
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
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/50">
                    {reg.name}
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

        <Card className="border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-secondary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-muted-foreground">Saved Teams</span>
                <span className="font-mono font-bold text-lg">{teamsLoading ? "-" : teams?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Your Teams</h2>
        </div>
        
        {teamsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card key={team.id} className="hover:border-primary/50 transition-colors bg-card/50 cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate">{team.name}</span>
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">{team.regulation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {team.slots.map((slot) => (
                      <Badge key={slot.slot} variant="secondary" className="text-xs">
                        {slot.pokemonName || "Empty"}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-card/20">
            <Shield className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground mb-4">No teams assembled yet.</p>
            <Button variant="outline" asChild>
              <Link href="/builder">Create your first team</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
