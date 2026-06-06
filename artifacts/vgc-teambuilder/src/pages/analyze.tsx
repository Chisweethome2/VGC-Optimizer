import React, { useState } from "react";
import { 
  useListTeams,
  useAnalyzeTeam
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ShieldAlert, Target, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Analyze() {
  const { data: teams } = useListTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  
  const analyzeTeam = useAnalyzeTeam();

  const handleAnalyze = () => {
    if (selectedTeamId) {
      analyzeTeam.mutate({ id: selectedTeamId });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary uppercase">Team Analysis</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Deep-dive analytics and coverage metrics.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTeamId?.toString() || ""} onValueChange={v => setSelectedTeamId(parseInt(v))}>
            <SelectTrigger className="w-[250px] border-primary/50 text-primary">
              <SelectValue placeholder="Select a team to analyze" />
            </SelectTrigger>
            <SelectContent>
              {teams?.map(t => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAnalyze} disabled={!selectedTeamId || analyzeTeam.isPending} className="gap-2">
            <Activity className="h-4 w-4" /> Analyze
          </Button>
        </div>
      </div>

      {!analyzeTeam.data && !analyzeTeam.isPending && (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-card/20">
          <Target className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground text-center max-w-md">
            Select a team and run the analysis to view type coverage, weakness heatmaps, and speed tiers.
          </p>
        </div>
      )}

      {analyzeTeam.isPending && (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      )}

      {analyzeTeam.data && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">Major Weaknesses</p>
                  <p className="text-2xl font-bold">{analyzeTeam.data.weaknessSummary.filter(w => w.count >= 2).length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-full text-secondary">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">Offensive Coverage</p>
                  <p className="text-2xl font-bold">{analyzeTeam.data.offensiveCoverage.length} Types</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-full text-accent">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">Trick Room</p>
                  <p className="text-2xl font-bold">{analyzeTeam.data.hasTrickRoom ? "Yes" : "No"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-muted rounded-full text-muted-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">Redirection</p>
                  <p className="text-2xl font-bold">{analyzeTeam.data.redirectSupport ? "Yes" : "No"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  Weakness Heatmap
                </CardTitle>
                <CardDescription>Types your team is vulnerable to</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyzeTeam.data.weaknessSummary.map(w => (
                    <div key={w.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`w-20 justify-center border-${w.type.toLowerCase()} text-${w.type.toLowerCase()}`}>
                          {w.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({w.count} weak)
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {w.vulnerablePokemon.map((p, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-destructive/20 text-destructive-foreground border-transparent">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {analyzeTeam.data.weaknessSummary.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">No major type weaknesses detected.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Speed Tiers
                </CardTitle>
                <CardDescription>Effective speed stats (inc. nature/EVs/items)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyzeTeam.data.speedTiers.sort((a, b) => b.effectiveSpeed - a.effectiveSpeed).map((st, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 text-right font-mono text-primary font-bold">
                        {st.effectiveSpeed}
                      </div>
                      <div className="flex-1 bg-black/40 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full" 
                          style={{ width: `${Math.min(100, (st.effectiveSpeed / 300) * 100)}%` }}
                        />
                      </div>
                      <div className="w-32 text-sm truncate">
                        {st.pokemonName}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle>AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {analyzeTeam.data.suggestions.map((s, i) => (
                  <li key={i} className="text-muted-foreground">{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
