import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useListTeams } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Swords, Trophy, Loader2, Users, RefreshCw, ArrowRightLeft, Zap, CloudSun, Wind } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */
interface Champion {
  id: string; name: string; title: string; description: string;
  difficulty: string; teamSize: number; teamPreview: Array<{ name: string; types: string[] }>;
}
interface BattlePokemon {
  name: string; dexNumber?: number; types: string[]; ability?: string; item?: string;
  currentHp: number; maxHp: number; isFainted: boolean;
  stats: Record<string, number>; moves: BattleMove[];
  status?: string; statStages?: Record<string, number>; perishTurns?: number;
}
interface BattleMove {
  name: string; displayName: string; type: string; category: string;
  power: number | null; accuracy: number | null; priority: number;
  target: string; pp?: number; maxPp?: number;
}
interface BattleState {
  phase: string; turn: number; winner: string | null;
  player: { team: BattlePokemon[]; activeIndices: number[] };
  opponent: { team: BattlePokemon[]; activeIndices: number[] };
  log: Array<{ turn: number; type: string; actor: string; actorName: string; message: string }>;
  weather?: string; terrain?: string;
  tailwind?: { player: boolean; opponent: boolean };
  trickRoom?: boolean; trickRoomTurns?: number;
}

const TYPE_COLORS: Record<string, string> = {
  normal: "bg-gray-400", fire: "bg-orange-500", water: "bg-blue-500", electric: "bg-yellow-400",
  grass: "bg-green-500", ice: "bg-cyan-400", fighting: "bg-red-700", poison: "bg-purple-500",
  ground: "bg-amber-700", flying: "bg-indigo-400", psychic: "bg-pink-500", bug: "bg-lime-600",
  rock: "bg-yellow-700", ghost: "bg-purple-700", dragon: "bg-indigo-600", dark: "bg-gray-700",
  steel: "bg-slate-400", fairy: "bg-pink-300",
};
const TYPE_TEXT_COLORS: Record<string, string> = {
  normal: "text-gray-400", fire: "text-orange-500", water: "text-blue-500", electric: "text-yellow-400",
  grass: "text-green-500", ice: "text-cyan-400", fighting: "text-red-700", poison: "text-purple-500",
  ground: "text-amber-700", flying: "text-indigo-400", psychic: "text-pink-500", bug: "text-lime-600",
  rock: "text-yellow-700", ghost: "text-purple-700", dragon: "text-indigo-600", dark: "text-gray-700",
  steel: "text-slate-400", fairy: "text-pink-300",
};

const STATUS_LABELS: Record<string, string> = { burn: "BRN", paralysis: "PAR", sleep: "SLP", poison: "PSN", "badly-poison": "TOX", freeze: "FRZ" };
const STATUS_COLORS: Record<string, string> = { burn: "bg-orange-500", paralysis: "bg-yellow-400", sleep: "bg-purple-400", poison: "bg-purple-600", "badly-poison": "bg-purple-800", freeze: "bg-cyan-300" };

const STAT_STAGE_NAMES: Record<string, string> = { attack: "Atk", defense: "Def", specialAttack: "SpA", specialDefense: "SpD", speed: "Spe" };

export default function BattleRoom() {
  const { user } = useAuth();
  const { data: teams } = useListTeams({ query: { queryKey: ["teams"], enabled: !!user } } as any);
  const { toast } = useToast();

  const [champions, setChampions] = useState<Champion[]>([]);
  const [selectedChamp, setSelectedChamp] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [state, setState] = useState<BattleState | null>(null);
  const [battleId, setBattleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"champion" | "pvp">("champion");
  const [pvpQueued, setPvpQueued] = useState(false);
  const [pvpOpponent, setPvpOpponent] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Selection state: for each active slot, the player picks [moveIndex, targetIndex]
  const [selections, setSelections] = useState<Array<{ move: number; target: number }>>([]);
  const [pickingFor, setPickingFor] = useState(-1);

  useEffect(() => { fetch("/api/battle/champions").then(r => r.json()).then(setChampions).catch(() => {}); }, []);
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [state?.log]);
  useEffect(() => { if (mode === "pvp") connectPvP(); }, [mode]);

  function connectPvP() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "queued") { setPvpQueued(true); }
      else if (msg.type === "pvp_start") { setPvpQueued(false); setBattleId(msg.battleId); setupBattleRoom(msg.state); setPvpOpponent(msg.opponent); }
      else if (msg.type === "pvp_update") { updateBattleState(msg.state); }
      else if (msg.type === "pvp_opponent_disconnected") { toast({ title: "Opponent disconnected", variant: "destructive" }); resetAll(); }
      else if (msg.type === "move_submitted") { toast({ title: "Waiting for opponent..." }); }
      else if (msg.type === "error") { toast({ title: msg.message, variant: "destructive" }); }
    };
  }

  function setupBattleRoom(s: BattleState) {
    setState(s);
    const sel: Array<{ move: number; target: number }> = [];
    // Pre-select first damaging move for each active slot
    s.player.activeIndices.forEach((aidx, slot) => {
      if (aidx < 0) { sel.push({ move: -1, target: -1 }); return; }
      const mon = s.player.team[aidx];
      if (mon.isFainted) { sel.push({ move: -1, target: -1 }); return; }
      const moveIdx = mon.moves.findIndex(m => (m.power !== null && m.power > 0) || m.category !== "status") ?? 0;
      sel.push({ move: moveIdx >= 0 ? moveIdx : 0, target: s.opponent.activeIndices[0] ?? 0 });
    });
    setSelections(sel);
  }

  function updateBattleState(s: BattleState) {
    setState(s);
    const sel = [...selections];
    s.player.activeIndices.forEach((aidx, slot) => {
      if (aidx < 0) return;
      const mon = s.player.team[aidx];
      if (mon.isFainted) return;
      if (!sel[slot] || sel[slot].move < 0) {
        const mi = mon.moves.findIndex(m => (m.power !== null && m.power > 0) || m.category !== "status");
        sel[slot] = { move: mi >= 0 ? mi : 0, target: s.opponent.activeIndices.find(i => i >= 0 && !s.opponent.team[i].isFainted) ?? 0 };
      }
    });
    setSelections(sel);
  }

  const startChallenge = async () => {
    if (!selectedChamp || !selectedTeam) return;
    setLoading(true);
    try {
      const res = await fetch("/api/battle/challenge/" + selectedChamp, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: parseInt(selectedTeam) }), credentials: "include",
      });
      const data = await res.json();
      setBattleId(data.battleId);
      setupBattleRoom(data.state);
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    setLoading(false);
  };

  const startPvP = () => { if (!selectedTeam) return; wsRef.current?.send(JSON.stringify({ type: "pvp_queue", teamId: parseInt(selectedTeam) })); };
  const cancelPvP = () => { wsRef.current?.send(JSON.stringify({ type: "pvp_cancel" })); setPvpQueued(false); };
  const resetAll = () => { setState(null); setPvpOpponent(""); setSelections([]); setBattleId(""); setPickingFor(-1); };

  function pickMove(slot: number, moveIdx: number) {
    const sel = [...selections];
    sel[slot] = { move: moveIdx, target: sel[slot]?.target ?? -1 };
    setSelections(sel);
  }

  function pickTarget(slot: number, targetIdx: number) {
    const sel = [...selections];
    sel[slot] = { ...sel[slot], target: targetIdx };
    setSelections(sel);
    setPickingFor(-1);
  }

  function allReady() {
    return selections.every(s => s && s.move >= 0 && s.target >= 0);
  }

  async function lockIn() {
    if (!allReady() || !state || state.phase !== "active") return;
    setLoading(true);
    const choices = selections.map(s => ({ type: "move" as const, moveIndex: s.move, moveTarget: s.target }));
    try {
      if (mode === "pvp") {
        wsRef.current?.send(JSON.stringify({ type: "pvp_move", battleId, choices }));
      } else {
        const res = await fetch("/api/battle/turn", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ battleId, choices }), credentials: "include",
        });
        const data = await res.json();
        updateBattleState(data.state);
      }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setLoading(false);
  }

  const hpPct = (hp: number, max: number) => Math.round((hp / max) * 100);
  const hpColor = (hp: number, max: number) => {
    const pct = hp / max;
    if (pct > 0.5) return "bg-green-500";
    if (pct > 0.2) return "bg-yellow-500";
    return "bg-red-500";
  };
  const spriteUrl = (name: string) => `https://play.pokemonshowdown.com/sprites/gen5ani/${name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}.gif`;

  /* ── Lobby ───────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-md text-center"><CardContent className="pt-8 pb-6">
          <Swords className="h-16 w-16 mx-auto text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to Battle</h2>
          <Link href="/login"><Button>Sign In</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  if (!state) {
    const champ = champions.find(c => c.id === selectedChamp);
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
          <Swords className="h-8 w-8 text-primary" /> Battle Room
        </h1>
        <Tabs value={mode} onValueChange={(v) => { setMode(v as any); resetAll(); }}>
          <TabsList className="mb-4">
            <TabsTrigger value="champion" className="gap-1"><Trophy className="h-4 w-4" /> Challenge</TabsTrigger>
            <TabsTrigger value="pvp" className="gap-1"><Users className="h-4 w-4" /> PvP</TabsTrigger>
          </TabsList>
          <Card className="border-border"><CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mode === "champion" ? (<div className="space-y-2">
                <Label>Champion</Label>
                <Select value={selectedChamp} onValueChange={setSelectedChamp}>
                  <SelectTrigger><SelectValue placeholder="Choose opponent" /></SelectTrigger>
                  <SelectContent>{champions.map(c => <SelectItem key={c.id} value={c.id}>{c.name} <span className="text-xs text-muted-foreground">({c.difficulty})</span></SelectItem>)}</SelectContent>
                </Select>
                {champ && <div className="bg-black/20 rounded p-3 text-sm"><p className="text-muted-foreground">{champ.description}</p><div className="flex gap-2 mt-2 flex-wrap">{champ.teamPreview.map(p => <span key={p.name} className="text-xs bg-primary/10 px-2 py-0.5 rounded">{p.name}</span>)}</div></div>}
              </div>) : (<div className="space-y-2"><Label>Find Match</Label><p className="text-sm text-muted-foreground">Queue with a team to battle another trainer.</p></div>)}
              <div className="space-y-2"><Label>Your Team</Label><Select value={selectedTeam} onValueChange={setSelectedTeam}><SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger><SelectContent>{teams?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {mode === "champion" ? (<Button onClick={startChallenge} disabled={!selectedChamp || !selectedTeam || loading} className="w-full gap-2 btn-primary-glow">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />} Challenge</Button>)
            : pvpQueued ? (<div className="text-center space-y-2"><Loader2 className="h-8 w-8 animate-spin mx-auto" /><p className="text-muted-foreground">Searching for opponent...</p><Button variant="outline" onClick={cancelPvP}>Cancel</Button></div>)
            : (<Button onClick={startPvP} disabled={!selectedTeam} className="w-full gap-2"><Users className="h-4 w-4" /> Find Match</Button>)}
          </CardContent></Card>
        </Tabs>
      </div>
    );
  }

  /* ── Battle Room ─────────────────────────────────────── */
  const isFinished = state.phase === "finished";
  const oTeam = state.opponent.team;
  const pTeam = state.player.team;
  const oActive = state.opponent.activeIndices;
  const pActive = state.player.activeIndices;
  const canTarget = !isFinished && pickingFor >= 0;

  const statStageLabel = (stages: number): string => {
    if (stages === 0) return "";
    return stages > 0 ? `+${stages}` : `${stages}`;
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-2">
      {/* Top bar: trainer info + field conditions */}
      <div className="flex justify-between items-center px-2 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-bold text-muted-foreground truncate max-w-[120px]">{pvpOpponent || (champions.find(c => c.id === selectedChamp)?.name ?? "Champion")}</span>
          </div>
          <div className="flex gap-1">{oTeam.map((p, i) => <div key={i} className={`w-2 h-2 rounded-full ${p.isFainted ? 'bg-muted-foreground/30' : 'bg-green-500'}`} />)}</div>
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0">
          {state.weather && state.weather !== "none" && <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded"><CloudSun className="h-3 w-3" /> {state.weather}</span>}
          {state.terrain && state.terrain !== "none" && <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded"><Zap className="h-3 w-3" /> {state.terrain}</span>}
          {state.trickRoom && <span className="flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Trick Room ({state.trickRoomTurns})</span>}
          {state.tailwind?.player && <span className="flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded"><Wind className="h-3 w-3" /> Tailwind</span>}
          {state.tailwind?.opponent && <span className="flex items-center gap-1 bg-red-500/20 text-red-300 px-2 py-0.5 rounded"><Wind className="h-3 w-3" /> Tailwind</span>}
          <span className="font-bold text-primary">Turn {state.turn}</span>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex gap-1">{pTeam.map((p, i) => <div key={i} className={`w-2 h-2 rounded-full ${p.isFainted ? 'bg-muted-foreground/30' : 'bg-green-500'}`} />)}</div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm font-bold text-muted-foreground">You</span>
            <div className="w-3 h-3 rounded-full bg-blue-500" />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-2 min-h-0">
        {/* Battle field */}
        <div className="bg-gradient-to-b from-blue-950/40 to-green-950/20 rounded-xl border border-border p-3 flex flex-col gap-3 relative overflow-hidden">
          {/* Opponent side */}
          <div className="flex justify-evenly items-end h-[45%] pb-2">
            {oActive.map((aidx, i) => {
              const mon = aidx >= 0 ? oTeam[aidx] : null;
              if (!mon) return <div key={i} className="w-28 h-28" />;
              const targetIdx = aidx;
              const isTargetable = canTarget && !mon.isFainted;
              return (
                <div key={i} className={`relative flex flex-col items-center ${mon.isFainted ? 'opacity-30' : ''}`}>
                  {/* Target click area */}
                  <div className={`relative ${isTargetable ? 'cursor-pointer' : ''}`}
                    onClick={() => { if (isTargetable) pickTarget(pickingFor, targetIdx); }}>
                    <img src={spriteUrl(mon.name)} className="w-24 h-24 object-contain pixelated drop-shadow-lg" alt={mon.name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {isTargetable && (
                      <div className="absolute inset-0 border-2 border-yellow-400 rounded-full animate-pulse flex items-center justify-center">
                        <span className="text-[10px] text-yellow-400 font-bold bg-black/50 px-1 rounded">TARGET</span>
                      </div>
                    )}
                    {selections[pickingFor]?.target === targetIdx && !isFinished && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                        ✓
                      </div>
                    )}
                  </div>
                  {/* Name + types */}
                  <div className="text-[10px] font-bold mt-1">{mon.name}</div>
                  <div className="flex gap-0.5">{mon.types.map(t => <span key={t} className={`text-[8px] px-1 py-0 rounded text-white ${TYPE_COLORS[t] || 'bg-gray-500'}`}>{t.slice(0,3)}</span>)}</div>
                  {/* HP bar */}
                  <div className="w-32 bg-muted/40 rounded-full h-2.5 mt-1 overflow-hidden border border-white/10">
                    <div className={`h-full rounded-full transition-all duration-500 ${hpColor(mon.currentHp, mon.maxHp)}`} style={{ width: `${hpPct(mon.currentHp, mon.maxHp)}%` }} />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {mon.currentHp}/{mon.maxHp} ({hpPct(mon.currentHp, mon.maxHp)}%)
                  </div>
                  {/* Status + stat stages */}
                  <div className="flex gap-1 mt-0.5 items-center">
                    {mon.status && mon.status !== "none" && (
                      <span className={`text-[7px] px-1 py-0 rounded font-bold text-white ${STATUS_COLORS[mon.status] || 'bg-gray-500'}`}>
                        {STATUS_LABELS[mon.status] || mon.status}
                      </span>
                    )}
                    {mon.statStages && Object.entries(mon.statStages).filter(([, v]) => v !== 0).map(([s, v]) => (
                      <span key={s} className={`text-[7px] ${v > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {STAT_STAGE_NAMES[s] || s} {v > 0 ? '+' : ''}{v}
                      </span>
                    ))}
                    {mon.perishTurns && mon.perishTurns > 0 && (
                      <span className="text-[7px] px-1 py-0 rounded font-bold bg-gray-700 text-white">
                        PERISH {mon.perishTurns}
                      </span>
                    )}
                  </div>
                  {mon.item && <div className="text-[7px] text-muted-foreground/60 mt-0.5">{mon.item}</div>}
                </div>
              );
            })}
          </div>

          {/* Middle divider with moves */}
          <div className="flex justify-center items-center gap-4">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">VS</span>
            <div className="h-px flex-1 bg-border/30" />
          </div>

          {/* Player side */}
          <div className="flex justify-evenly items-start h-[45%] pt-2">
            {pActive.map((aidx, i) => {
              const mon = aidx >= 0 ? pTeam[aidx] : null;
              if (!mon) return <div key={i} className="w-28 h-28" />;
              const sel = selections[i];
              return (
                <div key={i} className="relative flex flex-col items-center">
                  {/* Sprite */}
                  <img src={spriteUrl(mon.name)} className={`w-24 h-24 object-contain pixelated drop-shadow-lg ${mon.isFainted ? 'opacity-30 grayscale' : ''}`} alt={mon.name}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  {/* Status + stat stages */}
                  <div className="flex gap-1 mt-0.5 items-center">
                    {mon.status && mon.status !== "none" && (
                      <span className={`text-[7px] px-1 py-0 rounded font-bold text-white ${STATUS_COLORS[mon.status] || 'bg-gray-500'}`}>
                        {STATUS_LABELS[mon.status] || mon.status}
                      </span>
                    )}
                    {mon.statStages && Object.entries(mon.statStages).filter(([, v]) => v !== 0).map(([s, v]) => (
                      <span key={s} className={`text-[7px] ${v > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {STAT_STAGE_NAMES[s] || s} {v > 0 ? '+' : ''}{v}
                      </span>
                    ))}
                    {mon.perishTurns && mon.perishTurns > 0 && (
                      <span className="text-[7px] px-1 py-0 rounded font-bold bg-gray-700 text-white">
                        PERISH {mon.perishTurns}
                      </span>
                    )}
                  </div>
                  {mon.item && <div className="text-[7px] text-muted-foreground/60">{mon.item}</div>}
                  {/* HP bar */}
                  <div className="w-32 bg-muted/40 rounded-full h-2.5 mt-1 overflow-hidden border border-white/10">
                    <div className={`h-full rounded-full transition-all duration-500 ${hpColor(mon.currentHp, mon.maxHp)}`} style={{ width: `${hpPct(mon.currentHp, mon.maxHp)}%` }} />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {mon.currentHp}/{mon.maxHp} ({hpPct(mon.currentHp, mon.maxHp)}%)
                  </div>
                  <div className="text-[10px] font-bold mt-0.5 flex items-center gap-1">
                    {mon.name}
                    {mon.ability && <span className="text-[7px] text-muted-foreground/50">({mon.ability})</span>}
                  </div>
                  {/* Types */}
                  <div className="flex gap-0.5">{mon.types.map(t => <span key={t} className={`text-[8px] px-1 py-0 rounded text-white ${TYPE_COLORS[t] || 'bg-gray-500'}`}>{t.slice(0,3)}</span>)}</div>
                  {/* Move buttons */}
                  {!isFinished && !mon.isFainted && (
                    <div className="flex gap-1 mt-1.5">
                      {mon.moves.map((m, mi) => {
                        const isSelected = sel?.move === mi;
                        const isDisabled = m.pp !== undefined && m.pp <= 0;
                        const typeColor = TYPE_COLORS[m.type] || 'bg-gray-500';
                        const bgClass = isSelected
                          ? typeColor
                          : 'bg-black/40 border border-white/10 hover:border-white/30';
                        return (
                          <Button
                            key={mi}
                            variant="ghost"
                            size="sm"
                            disabled={isDisabled}
                            className={`h-8 text-[10px] px-1.5 gap-1 ${bgClass} ${isSelected ? 'text-white shadow-lg ring-1 ring-white/50' : 'text-white/80'} ${isDisabled ? 'opacity-30' : ''}`}
                            onClick={() => {
                              pickMove(i, mi);
                              setPickingFor(i);
                            }}
                          >
                            <span className={`text-[9px] font-bold uppercase ${TYPE_TEXT_COLORS[m.type] || 'text-gray-300'} ${isSelected ? 'text-white' : ''}`}>{m.type.slice(0,3)}</span>
                            <span className="truncate max-w-[55px]">{m.displayName}</span>
                            {m.pp !== undefined && (
                              <span className={`text-[8px] ${m.pp <= m.maxPp! * 0.25 ? 'text-red-400' : 'text-white/50'}`}>{m.pp}/{m.maxPp}</span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pick target prompt + Lock In */}
          {!isFinished && (
            <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
              {pickingFor >= 0 && selections[pickingFor]?.move >= 0 && (
                <span className="text-xs text-yellow-400 animate-pulse bg-black/50 px-2 py-0.5 rounded">
                  Pick a target for {pTeam[pActive[pickingFor]]?.name}'s {pTeam[pActive[pickingFor]]?.moves[selections[pickingFor].move]?.displayName}!
                </span>
              )}
              {pickingFor >= 0 && selections[pickingFor]?.move < 0 && (
                <span className="text-xs text-yellow-400 animate-pulse bg-black/50 px-2 py-0.5 rounded">
                  Pick a move for {pTeam[pActive[pickingFor]]?.name}!
                </span>
              )}
              <Button onClick={lockIn} disabled={!allReady() || loading} className="btn-primary-glow gap-2 shadow-lg" size="sm">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Lock In!
              </Button>
            </div>
          )}

          {/* Win/Lose overlay */}
          {isFinished && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 rounded-xl">
              <div className="text-center">
                <div className={`text-5xl font-bold mb-4 ${state.winner === "player" ? "text-green-400 drop-shadow-lg" : "text-red-400 drop-shadow-lg"}`}>
                  {state.winner === "player" ? "Victory!" : "Defeat"}
                </div>
                <p className="text-muted-foreground mb-6">The battle ended on turn {state.turn}</p>
                <Button onClick={resetAll} className="gap-2"><RefreshCw className="h-4 w-4" /> New Battle</Button>
              </div>
            </div>
          )}
        </div>

        {/* Battle Log */}
        <Card className="border-border flex flex-col h-full min-h-0">
          <CardHeader className="py-2 px-3 border-b border-border/30">
            <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-2">
              Battle Log
              <span className="text-[10px] text-muted-foreground font-normal">Turn {state.turn}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto py-2 px-3 space-y-1.5 text-xs font-mono" ref={logRef}>
            {state.log.map((e, i) => {
              const isPlayer = e.actor === "player";
              const typeColor = e.type === "ko" ? "text-red-400 font-bold"
                : e.type === "crit" ? "text-yellow-400"
                : e.type === "super-effective" ? "text-green-400"
                : e.type === "immune" ? "text-gray-500"
                : e.type === "miss" ? "text-orange-400"
                : e.type === "heal" ? "text-green-300"
                : e.type === "stat-change" ? "text-blue-300"
                : e.type === "status" ? "text-purple-300"
                : "";
              return (
                <div key={i} className="flex gap-1.5 leading-relaxed">
                  <span className={`shrink-0 ${isPlayer ? "text-blue-400/70" : "text-red-400/70"}`}>[{e.turn || "?"}]</span>
                  <span className={`${typeColor} text-muted-foreground/90`}>{e.message}</span>
                </div>
              );
            })}
            <div ref={logRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
