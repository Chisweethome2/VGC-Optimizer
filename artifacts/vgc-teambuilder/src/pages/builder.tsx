import React, { useState, useEffect } from "react";
import { 
  useListTeams, 
  useCreateTeam, 
  useUpdateTeam, 
  useDeleteTeam, 
  useGetCurrentRegulation,
  getListTeamsQueryKey,
  useSearchPokemon,
  useGetPokemon,
  getGetPokemonQueryKey,
  useListMoves,
  useListItems,
  useListNatures,
} from "@workspace/api-client-react";
import type { Team, TeamSlot, TeamInput, StatSpread, NatureEntry, MoveEntry, ItemEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { useToast } from "@/hooks/use-toast";
import { POKEMON_TYPES } from "@/lib/constants";
import { Save, Trash2, Search, Shield } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";

const DEFAULT_STAT_SPREAD: StatSpread = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
const MAX_EVS = 508;
const MAX_EV_PER_STAT = 252;

const STAT_SHORT: Record<string, string> = {
  attack: "Atk", defense: "Def", specialAttack: "SpA",
  specialDefense: "SpD", speed: "Spe", hp: "HP",
};

const emptySlot = (slotIndex: number): TeamSlot => ({
  slot: slotIndex,
  pokemonName: "",
  moves: ["", "", "", ""],
  ability: "",
  item: "",
  nature: "Serious",
  teraType: "Normal",
  evs: { ...DEFAULT_STAT_SPREAD },
  ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 }
});

function getNatureModifiers(natureName: string, natures: NatureEntry[] | undefined): { increased: string | null; decreased: string | null } {
  const nature = natures?.find(n => n.displayName === natureName);
  return {
    increased: nature?.increasedStat ?? null,
    decreased: nature?.decreasedStat ?? null,
  };
}

function applyNature(base: number, statKey: string, inc: string | null, dec: string | null): number {
  if (inc === statKey) return Math.floor(base * 1.1);
  if (dec === statKey) return Math.floor(base * 0.9);
  return base;
}

function formatNatureLabel(n: NatureEntry): string {
  const parts: string[] = [n.displayName];
  if (n.increasedStat && n.decreasedStat) {
    parts.push(`(+${STAT_SHORT[n.increasedStat] ?? n.increasedStat}, -${STAT_SHORT[n.decreasedStat] ?? n.decreasedStat})`);
  }
  return parts.join(" ");
}

export default function Builder() {
  const { user } = useAuth();
  const { data: reg } = useGetCurrentRegulation();
  const { data: teams, isLoading: teamsLoading } = useListTeams({ query: { queryKey: ["teams"], enabled: !!user } } as any);
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState("New Team");
  const [teamDescription, setTeamDescription] = useState("");
  const [slots, setSlots] = useState<TeamSlot[]>(Array.from({ length: 6 }, (_, i) => emptySlot(i + 1)));

  useEffect(() => {
    if (selectedTeamId && teams) {
      const t = teams.find(t => t.id === selectedTeamId);
      if (t) {
        setTeamName(t.name);
        setTeamDescription(t.description || "");
        setSlots(t.slots.length === 6 ? t.slots : Array.from({ length: 6 }, (_, i) => {
          const existing = t.slots.find(s => s.slot === i + 1);
          return existing || emptySlot(i + 1);
        }));
      }
    } else {
      setTeamName("New Team");
      setTeamDescription("");
      setSlots(Array.from({ length: 6 }, (_, i) => emptySlot(i + 1)));
    }
  }, [selectedTeamId, teams]);

  const handleSave = () => {
    if (!reg) return;
    
    const teamInput: TeamInput = {
      name: teamName || "Untitled Team",
      regulation: reg.name,
      description: teamDescription,
      slots: slots.filter(s => s.pokemonName)
    };

    if (selectedTeamId) {
      updateTeam.mutate({ id: selectedTeamId, data: teamInput }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
          toast({ title: "Team updated" });
        },
        onError: () => toast({ title: "Failed to update team", variant: "destructive" })
      });
    } else {
      createTeam.mutate({ data: teamInput }, {
        onSuccess: (newTeam) => {
          queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
          setSelectedTeamId(newTeam.id);
          toast({ title: "Team created" });
        },
        onError: () => toast({ title: "Failed to create team", variant: "destructive" })
      });
    }
  };

  const handleDelete = () => {
    if (!selectedTeamId) return;
    deleteTeam.mutate({ id: selectedTeamId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
        setSelectedTeamId(null);
        toast({ title: "Team deleted" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary uppercase">Team Builder</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Assemble and configure your squad.</p>
        </div>
        {!user ? (
          <Link href="/login">
            <Button variant="outline" className="gap-2 border-primary/50 text-primary">
              <Shield className="h-4 w-4" /> Sign In to Save
            </Button>
          </Link>
        ) : (
        <div className="flex gap-2">
          <Select value={selectedTeamId ? selectedTeamId.toString() : "new"} onValueChange={(v) => setSelectedTeamId(v === "new" ? null : parseInt(v))}>
            <SelectTrigger className="w-[200px] border-primary/50 text-primary">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new" className="text-secondary font-bold">-- New Team --</SelectItem>
              {teams?.map(t => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={createTeam.isPending || updateTeam.isPending} className="gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>
          {selectedTeamId && (
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTeam.isPending}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {slots.map((slot, i) => (
          <SlotEditor 
            key={i} 
            slot={slot} 
            onChange={(newSlot) => {
              const newSlots = [...slots];
              newSlots[i] = newSlot;
              setSlots(newSlots);
            }} 
          />
        ))}
      </div>
    </div>
  );
}

function SlotEditor({ slot, onChange }: { slot: TeamSlot, onChange: (s: TeamSlot) => void }) {
  const [search, setSearch] = useState(slot.pokemonName || "");
  const debouncedSearch = useDebounce(search, 300);
  
  const { data: allMoves } = useListMoves();
  const { data: allItems } = useListItems();
  const { data: allNatures } = useListNatures();
  
  const { data: searchResults, isLoading: searchLoading } = useSearchPokemon({ q: debouncedSearch }, { query: { queryKey: ["pokemon-search", debouncedSearch], enabled: debouncedSearch.length > 2 } } as any);
  
  const selectedPokemonName = slot.pokemonName;
  const { data: pokemon, isLoading: pokemonLoading } = useGetPokemon(selectedPokemonName, { query: { enabled: !!selectedPokemonName, queryKey: getGetPokemonQueryKey(selectedPokemonName) } });

  const totalEvs = Object.values(slot.evs || {}).reduce<number>((sum, val) => sum + (val || 0), 0);
  const natureMods = getNatureModifiers(slot.nature, allNatures);

  const updateField = (field: keyof TeamSlot, value: any) => {
    onChange({ ...slot, [field]: value });
  };

  const updateEv = (stat: keyof StatSpread, value: number) => {
    const evs = { ...(slot.evs || DEFAULT_STAT_SPREAD) };
    const current = evs[stat] || 0;
    let next = value;
    if (next > MAX_EV_PER_STAT) next = MAX_EV_PER_STAT;
    if (next < 0) next = 0;
    
    const otherEvs = Object.entries(evs).filter(([k]) => k !== stat).reduce<number>((sum, [_, v]) => sum + (v || 0), 0);
    if (otherEvs + next > MAX_EVS) {
      next = MAX_EVS - otherEvs;
    }
    
    evs[stat] = next;
    onChange({ ...slot, evs });
  };

  const itemOptions = (allItems ?? []).map(item => ({
    value: item.displayName,
    label: (
      <span className="flex items-center gap-2 text-sm">
        <span className="font-medium">{item.displayName}</span>
        <span className="text-xs text-muted-foreground ml-auto truncate max-w-[120px]">{item.effect ?? (item.category === "mega-stone" ? "Mega" : "")}</span>
      </span>
    ),
    searchText: item.displayName,
  }));

  const abilityOptions = (pokemon?.abilities ?? []).map(a => ({
    value: a,
    label: <span className="text-sm">{a}</span>,
    searchText: a,
  }));

  const natureOptions = (allNatures ?? []).map(n => ({
    value: n.displayName,
    label: (
      <span className="flex items-center gap-2 text-sm">
        <span className="font-medium">{n.displayName}</span>
        {n.increasedStat && n.decreasedStat && (
          <span className="text-xs text-muted-foreground">+{STAT_SHORT[n.increasedStat] ?? n.increasedStat} -{STAT_SHORT[n.decreasedStat] ?? n.decreasedStat}</span>
        )}
      </span>
    ),
    searchText: `${n.displayName} ${n.increasedStat ?? ""} ${n.decreasedStat ?? ""}`,
  }));

  const moveOptions = (allMoves ?? []).map(m => ({
    value: m.displayName,
    label: (
      <span className="flex items-center gap-2 text-sm w-full">
        <span className={`inline-block text-xs px-1 py-0.5 rounded font-mono min-w-[16px] text-center ${getTypeColor(m.type)}`}>
          {m.type.charAt(0).toUpperCase()}
        </span>
        <span>{m.displayName}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {m.power !== null && m.power !== undefined ? `${m.power} BP ` : ""}{m.category.slice(0, 3).toUpperCase()}
        </span>
      </span>
    ),
    searchText: m.displayName,
  }));

  return (
    <Card className="border-border bg-card/50 backdrop-blur relative overflow-hidden">
      {pokemon?.artworkUrl && (
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none z-0">
          <img src={pokemon.artworkUrl} alt="" className="w-64 h-64 object-contain filter grayscale" />
        </div>
      )}
      
      <CardHeader className="pb-2 z-10 relative">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-sm opacity-50">#{slot.slot}</span>
            {pokemon ? pokemon.name : "Empty Slot"}
          </CardTitle>
          {pokemon?.spriteUrl && <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-10 h-10 object-contain" />}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 z-10 relative text-sm">
        <div className="space-y-1.5 relative">
          <Label className="text-xs">Pokemon</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search Pokemon..." 
              className="pl-9 h-9 bg-black/20 text-sm" 
            />
          </div>
          {searchLoading && <div className="text-xs text-muted-foreground animate-pulse">Searching...</div>}
          {searchResults && searchResults.length > 0 && search !== selectedPokemonName && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-xl max-h-48 overflow-auto">
              {searchResults.map(p => (
                <div 
                  key={p.name} 
                  className="px-3 py-1.5 text-sm hover:bg-primary/20 cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    setSearch(p.name);
                    updateField("pokemonName", p.name);
                  }}
                >
                  <img src={p.spriteUrl} alt="" className="w-5 h-5 object-contain" />
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {pokemon && (
          <div className="space-y-3 animate-in fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Item</Label>
                <Combobox
                  options={itemOptions}
                  value={slot.item || undefined}
                  onValueChange={v => updateField("item", v)}
                  placeholder="Select item..."
                  triggerClassName="h-9 bg-black/20 text-sm"
                  className="w-[280px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ability</Label>
                <Combobox
                  options={abilityOptions}
                  value={slot.ability}
                  onValueChange={v => updateField("ability", v)}
                  placeholder="Select ability..."
                  triggerClassName="h-9 bg-black/20 text-sm"
                  className="w-[280px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nature</Label>
                <Combobox
                  options={natureOptions}
                  value={slot.nature}
                  onValueChange={v => updateField("nature", v)}
                  placeholder="Select nature..."
                  triggerClassName="h-9 bg-black/20 text-sm"
                  className="w-[280px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tera Type</Label>
                <Select value={slot.teraType} onValueChange={v => updateField("teraType", v)}>
                  <SelectTrigger className="h-9 bg-black/20 text-sm">
                    <SelectValue placeholder="Tera Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {POKEMON_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Moves */}
            <div className="space-y-1.5">
              <Label className="text-xs">Moves</Label>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map(mi => (
                  <Combobox
                    key={mi}
                    options={moveOptions}
                    value={slot.moves[mi] || undefined}
                    onValueChange={v => {
                      const newMoves = [...slot.moves];
                      newMoves[mi] = v;
                      updateField("moves", newMoves);
                    }}
                    placeholder={`Move ${mi + 1}`}
                    triggerClassName="h-9 bg-black/20 text-sm"
                    className="w-[280px]"
                  />
                ))}
              </div>
            </div>

            {/* Stats with nature modifiers */}
            {pokemon.baseStats && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Base Stats</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    Total: {Object.values(pokemon.baseStats).reduce<number>((s, v) => s + (v as number), 0)}
                  </span>
                </div>
                <div className="space-y-1">
                  {(["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const).map(stat => {
                    const base = pokemon.baseStats[stat] ?? 0;
                    const modified = applyNature(base, stat, natureMods.increased, natureMods.decreased);
                    const isModified = modified !== base;
                    return (
                      <div key={stat} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-muted-foreground uppercase text-right">{STAT_SHORT[stat] ?? stat}</span>
                        <div className="flex-1 bg-muted/30 rounded-full h-1.5">
                          <div 
                            className="bg-primary/70 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (base / 255) * 100)}%` }} 
                          />
                        </div>
                        <span className={`w-8 text-right font-mono tabular-nums ${isModified ? 'text-accent' : ''}`}>
                          {modified}
                        </span>
                        {isModified && (
                          <span className="text-[10px] text-muted-foreground">({Math.floor(modified - base) >= 0 ? '+' : ''}{modified - base})</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EVs */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs">EVs</Label>
                <span className={`text-xs font-mono ${totalEvs > MAX_EVS ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {totalEvs} / {MAX_EVS}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {(["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const).map(stat => (
                  <div key={stat} className="flex flex-col gap-0.5">
                    <Input 
                      type="number" 
                      min="0" max="252" step="4"
                      value={slot.evs?.[stat] || 0} 
                      onChange={e => updateEv(stat, parseInt(e.target.value) || 0)} 
                      className="h-8 text-xs bg-black/20 text-center px-0" 
                    />
                    <span className="text-[10px] uppercase text-muted-foreground text-center">{STAT_SHORT[stat] ?? stat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    normal: "bg-gray-400 text-black",
    fire: "bg-red-500 text-white",
    water: "bg-blue-500 text-white",
    electric: "bg-yellow-400 text-black",
    grass: "bg-green-500 text-white",
    ice: "bg-cyan-300 text-black",
    fighting: "bg-red-700 text-white",
    poison: "bg-purple-500 text-white",
    ground: "bg-yellow-600 text-white",
    flying: "bg-indigo-300 text-black",
    psychic: "bg-pink-500 text-white",
    bug: "bg-lime-600 text-white",
    rock: "bg-yellow-700 text-white",
    ghost: "bg-purple-700 text-white",
    dragon: "bg-indigo-600 text-white",
    dark: "bg-gray-700 text-white",
    steel: "bg-gray-400 text-black",
    fairy: "bg-pink-300 text-black",
  };
  return colors[type.toLowerCase()] ?? "bg-gray-500 text-white";
}
