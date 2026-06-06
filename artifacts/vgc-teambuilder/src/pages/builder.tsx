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
  getGetPokemonQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { POKEMON_TYPES, NATURES } from "@/lib/constants";
import { Shield, Plus, Save, Trash2, Search, Activity, Zap } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Team, TeamSlot, TeamInput, StatSpread } from "@workspace/api-client-react/src/generated/api.schemas";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_STAT_SPREAD: StatSpread = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
const MAX_EVS = 508;
const MAX_EV_PER_STAT = 252;

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

export default function Builder() {
  const { data: reg } = useGetCurrentRegulation();
  const { data: teams, isLoading: teamsLoading } = useListTeams();
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
      </div>

      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Team Name</Label>
            <Input value={teamName} onChange={e => setTeamName(e.target.value)} className="bg-black/20" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={teamDescription} onChange={e => setTeamDescription(e.target.value)} className="bg-black/20" placeholder="Optional notes" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  
  const { data: searchResults, isLoading: searchLoading } = useSearchPokemon({ q: debouncedSearch }, { query: { enabled: debouncedSearch.length > 2 } });
  
  const selectedPokemonName = slot.pokemonName;
  const { data: pokemon, isLoading: pokemonLoading } = useGetPokemon(selectedPokemonName, { query: { enabled: !!selectedPokemonName, queryKey: getGetPokemonQueryKey(selectedPokemonName) } });

  const totalEvs = Object.values(slot.evs || {}).reduce((sum, val) => sum + (val || 0), 0);

  const updateField = (field: keyof TeamSlot, value: any) => {
    onChange({ ...slot, [field]: value });
  };

  const updateEv = (stat: keyof StatSpread, value: number) => {
    const evs = { ...(slot.evs || DEFAULT_STAT_SPREAD) };
    const current = evs[stat] || 0;
    let next = value;
    if (next > MAX_EV_PER_STAT) next = MAX_EV_PER_STAT;
    if (next < 0) next = 0;
    
    const otherEvs = Object.entries(evs).filter(([k]) => k !== stat).reduce((sum, [_, v]) => sum + (v || 0), 0);
    if (otherEvs + next > MAX_EVS) {
      next = MAX_EVS - otherEvs;
    }
    
    evs[stat] = next;
    onChange({ ...slot, evs });
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur relative overflow-hidden">
      {pokemon?.artworkUrl && (
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none z-0">
          <img src={pokemon.artworkUrl} alt="" className="w-64 h-64 object-contain filter grayscale" />
        </div>
      )}
      
      <CardHeader className="pb-2 z-10 relative">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-sm opacity-50">#{slot.slot}</span>
            {pokemon ? pokemon.name : "Empty Slot"}
          </CardTitle>
          {pokemon?.spriteUrl && <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-12 h-12 object-contain" />}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 z-10 relative">
        <div className="space-y-2 relative">
          <Label>Pokemon</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search Pokemon..." 
              className="pl-9 bg-black/20" 
            />
          </div>
          {searchLoading && <div className="text-xs text-muted-foreground animate-pulse">Searching...</div>}
          {searchResults && searchResults.length > 0 && search !== selectedPokemonName && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-xl max-h-48 overflow-auto">
              {searchResults.map(p => (
                <div 
                  key={p.name} 
                  className="px-3 py-2 text-sm hover:bg-primary/20 cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    setSearch(p.name);
                    updateField("pokemonName", p.name);
                  }}
                >
                  <img src={p.spriteUrl} alt="" className="w-6 h-6 object-contain" />
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {pokemon && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item</Label>
                <Input value={slot.item} onChange={e => updateField("item", e.target.value)} placeholder="e.g. Focus Sash" className="bg-black/20" />
              </div>
              <div className="space-y-2">
                <Label>Ability</Label>
                <Select value={slot.ability} onValueChange={v => updateField("ability", v)}>
                  <SelectTrigger className="bg-black/20">
                    <SelectValue placeholder="Select Ability" />
                  </SelectTrigger>
                  <SelectContent>
                    {pokemon.abilities.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nature</Label>
                <Select value={slot.nature} onValueChange={v => updateField("nature", v)}>
                  <SelectTrigger className="bg-black/20">
                    <SelectValue placeholder="Select Nature" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATURES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tera Type</Label>
                <Select value={slot.teraType} onValueChange={v => updateField("teraType", v)}>
                  <SelectTrigger className="bg-black/20">
                    <SelectValue placeholder="Select Tera Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {POKEMON_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Moves</Label>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map(mi => (
                  <Input 
                    key={mi} 
                    value={slot.moves[mi]} 
                    onChange={e => {
                      const newMoves = [...slot.moves];
                      newMoves[mi] = e.target.value;
                      updateField("moves", newMoves);
                    }} 
                    placeholder={`Move ${mi + 1}`} 
                    className="bg-black/20" 
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>EVs</Label>
                <span className={`text-xs font-mono ${totalEvs > MAX_EVS ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {totalEvs} / {MAX_EVS}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const).map(stat => (
                  <div key={stat} className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-muted-foreground">{stat.replace('special', 'Sp.')}</span>
                    <Input 
                      type="number" 
                      min="0" max="252" step="4"
                      value={slot.evs?.[stat] || 0} 
                      onChange={e => updateEv(stat, parseInt(e.target.value) || 0)} 
                      className="h-8 text-xs bg-black/20" 
                    />
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
