import React, { useState } from "react";
import { useListTournamentTeams, useGetTournamentEvent } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TrendingUp, TrendingDown, Minus, Trophy, Users, BarChart3, Calendar } from "lucide-react";

const EVENT_SLUG = "indy-regionals-2026";

const PLACEMENT_FILTERS = [
  { label: "Top 8", value: "top8", max: 8 },
  { label: "Top 16", value: "top16", max: 16 },
  { label: "Top 32", value: "top32", max: 32 },
  { label: "Top 64", value: "top64", max: 64 },
];

const PLACEMENT_BADGE: Record<string, { label: string; className: string }> = {
  "1st":    { label: "🥇 1st",   className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
  "2nd":    { label: "🥈 2nd",   className: "bg-zinc-400/20 text-zinc-300 border-zinc-400/40" },
  "Top 4":  { label: "Top 4",   className: "bg-orange-500/20 text-orange-400 border-orange-500/40" },
  "Top 8":  { label: "Top 8",   className: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
  "Top 16": { label: "Top 16",  className: "bg-primary/20 text-primary border-primary/40" },
  "Top 32": { label: "Top 32",  className: "bg-muted text-muted-foreground border-border" },
  "Top 64": { label: "Top 64",  className: "bg-muted text-muted-foreground border-border" },
};

function PokemonPill({ name, isMega }: { name: string; isMega?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border
        ${isMega
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-card text-foreground/80 border-border"
        }`}
    >
      {isMega && <span className="text-[9px] font-bold text-primary/80 uppercase tracking-widest">M</span>}
      {name.replace(/^Mega\s/, "")}
    </span>
  );
}

function TrendIcon({ p1, p2 }: { p1: number; p2: number | null }) {
  if (p2 === null) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (p2 > p1) return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (p2 < p1) return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export default function Meta() {
  const [filter, setFilter] = useState("top8");
  const maxOrder = PLACEMENT_FILTERS.find((f) => f.value === filter)?.max ?? 8;

  const { data: teams, isLoading: teamsLoading } = useListTournamentTeams({
    event: EVENT_SLUG,
  });
  const { data: event, isLoading: eventLoading } = useGetTournamentEvent(EVENT_SLUG);

  const filteredTeams = teams?.filter((t) => t.placementOrder <= maxOrder) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary uppercase">Meta Intel</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            Real tournament data — Reg M-A reference teams &amp; usage stats.
          </p>
        </div>
        {event && (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground border border-border rounded px-3 py-2 bg-card/50">
            <Calendar className="h-3.5 w-3.5" />
            {event.name} · {event.location} · {event.date}
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div>
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" /> Usage Statistics
        </h2>
        {eventLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {event?.usageStats?.map((stat) => (
              <Card
                key={stat.rank}
                className={`border bg-card/60 backdrop-blur relative overflow-hidden
                  ${stat.rank <= 3 ? "border-primary/40" : "border-border"}`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-0.5
                    ${stat.rank === 1 ? "bg-yellow-400" : stat.rank === 2 ? "bg-zinc-400" : stat.rank === 3 ? "bg-orange-400" : "bg-primary/30"}`}
                />
                <CardContent className="p-2.5 pl-4">
                  <div className="text-[10px] font-mono text-muted-foreground">#{stat.rank}</div>
                  <div className="font-semibold text-sm text-foreground leading-tight mt-0.5 truncate">
                    {stat.pokemonDisplay}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs font-mono text-primary font-bold">
                      {stat.phase2Pct?.toFixed(1) ?? stat.phase1Pct.toFixed(1)}%
                    </span>
                    <TrendIcon p1={stat.phase1Pct} p2={stat.phase2Pct ?? null} />
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">
                    Day 1: {stat.phase1Pct}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Teams */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5" /> Tournament Teams
          </h2>
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => v && setFilter(v)}
            className="border border-border rounded-lg p-0.5 bg-card/50"
          >
            {PLACEMENT_FILTERS.map((f) => (
              <ToggleGroupItem
                key={f.value}
                value={f.value}
                className="text-xs font-mono h-7 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded"
              >
                {f.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {teamsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredTeams.map((team) => {
              const badge = PLACEMENT_BADGE[team.placement] ?? PLACEMENT_BADGE["Top 64"];
              const display = (team.pokemonDisplay ?? team.pokemon) as string[];
              return (
                <Card
                  key={team.id}
                  className="border-border bg-card/50 backdrop-blur hover:border-primary/40 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="font-bold text-foreground">{team.playerName}</span>
                        {team.rentalCode && (
                          <span className="ml-2 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {team.rentalCode}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono tracking-widest shrink-0 ${badge.className}`}
                      >
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {display.map((name, idx) => (
                        <PokemonPill
                          key={idx}
                          name={name}
                          isMega={name.startsWith("Mega")}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredTeams.length === 0 && !teamsLoading && (
          <div className="text-center py-12 text-muted-foreground font-mono text-sm">
            <Users className="h-8 w-8 mx-auto mb-3 opacity-30" />
            No teams found.
          </div>
        )}
      </div>
    </div>
  );
}
