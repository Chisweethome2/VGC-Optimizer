import React, { useState } from "react";
import { 
  useListTeams,
  useSimulateTeam
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Swords, ArrowRight, Skull, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Simulate() {
  const { data: teams } = useListTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  
  const simulateTeam = useSimulateTeam();

  const handleSimulate = () => {
    if (selectedTeamId) {
      simulateTeam.mutate({ id: selectedTeamId });
    }
  };

  const getVerdictColor = (rating: number) => {
    if (rating >= 70) return "text-green-500 border-green-500/50 bg-green-500/10";
    if (rating >= 40) return "text-yellow-500 border-yellow-500/50 bg-yellow-500/10";
    return "text-destructive border-destructive/50 bg-destructive/10";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary uppercase">Matchup Simulator</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Test your team against meta archetypes.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTeamId?.toString() || ""} onValueChange={v => setSelectedTeamId(parseInt(v))}>
            <SelectTrigger className="w-[250px] border-primary/50 text-primary">
              <SelectValue placeholder="Select a team to test" />
            </SelectTrigger>
            <SelectContent>
              {teams?.map(t => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSimulate} disabled={!selectedTeamId || simulateTeam.isPending} className="gap-2">
            <Swords className="h-4 w-4" /> Simulate
          </Button>
        </div>
      </div>

      {!simulateTeam.data && !simulateTeam.isPending && (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-card/20">
          <Swords className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground text-center max-w-md">
            Run the simulator to see how your team performs against common meta strategies like Tailwind, Rain, and Hyper Offense.
          </p>
        </div>
      )}

      {simulateTeam.isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      )}

      {simulateTeam.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 stagger-2">
          {simulateTeam.data.sort((a, b) => a.rating - b.rating).map((result, idx) => (
            <Card key={result.archetypeId} className="border-border bg-card/50 backdrop-blur hover:border-primary/30 transition-colors flex flex-col">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{result.archetypeName}</CardTitle>
                  <Badge variant="outline" className={`font-mono text-sm px-2 py-1 ${getVerdictColor(result.rating)}`}>
                    {result.verdict}
                  </Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>Win Probability</span>
                    <span>{result.rating}%</span>
                  </div>
                  <Progress value={result.rating} className="h-1.5" />
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 space-y-4">
                
                {result.keyThreats.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Skull className="h-3 w-3 text-destructive" /> Key Threats
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {result.keyThreats.map((t, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-primary" /> Win Conditions
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {result.winConditions.map((w, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <ArrowRight className="h-3 w-3 mt-1 shrink-0 text-primary" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
