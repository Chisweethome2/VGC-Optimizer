export type Stat = "hp" | "attack" | "defense" | "specialAttack" | "specialDefense" | "speed";

export type StatusCondition = "none" | "burn" | "paralysis" | "sleep" | "poison" | "toxic" | "freeze" | "badly-poison";

export type Weather = "none" | "sun" | "rain" | "sand" | "hail" | "snow";

export type Terrain = "none" | "electric" | "psychic" | "grassy" | "misty";

export type BattlePhase = "team-select" | "active" | "finished";

export type PlayerSide = "player" | "opponent";

export type MoveTarget = "single" | "all-opponents" | "all-adjacent" | "self" | "ally" | "user-or-ally" | "user" | "random-opponent" | "all-others";

export interface PokemonData {
  name: string;
  types: string[];
  baseStats: Record<Stat, number>;
  abilities: string[];
  weightKg: number;
}

export interface BattlePokemon {
  name: string;
  dexNumber: number;
  types: string[];
  ability: string;
  item: string;
  nature: string;
  baseStats: Record<Stat, number>;
  currentHp: number;
  maxHp: number;
  stats: Record<Stat, number>;
  evs: Record<Stat, number>;
  ivs: Record<Stat, number>;
  moves: BattleMove[];
  isFainted: boolean;
  turnsOnField: number;
  protected: boolean;
  protectCount: number;
  perishTurns: number;
  status: StatusCondition;
  sleepTurns: number;
  toxicCounter: number;
  statStages: Record<Stat, number>;
  helpingHand: boolean;
  lockedMove: number; // -1 = not locked, else index of locked move (Choice items)
}

export interface BattleMove {
  name: string;
  displayName: string;
  type: string;
  category: "physical" | "special" | "status";
  power: number | null;
  accuracy: number | null;
  priority: number;
  target: MoveTarget;
  pp: number;
  maxPp: number;
  makesContact: boolean;
  selfDrop?: { stat: Stat; stages: number };
  targetDrop?: { stat: Stat; stages: number; chance: number };
  selfBoost?: { stat: Stat; stages: number };
  targetBoost?: { stat: Stat; stages: number };
  drain?: number; // fraction of damage healed (e.g. 0.5 = 50%)
  recoil?: number; // fraction of damage as recoil (e.g. 0.33 = 33%)
  multiHit?: { min: number; max: number };
  alwaysCrit?: boolean;
  burnChance?: number;
  paralysisChance?: number;
  sleepChance?: number;
  freezeChance?: number;
  poisonChance?: number;
  flinchChance?: number;
}

export interface BattleState {
  phase: BattlePhase;
  player: {
    team: BattlePokemon[];
    activeIndices: number[];
  };
  opponent: {
    team: BattlePokemon[];
    activeIndices: number[];
  };
  turn: number;
  log: BattleEvent[];
  winner: PlayerSide | null;
  weather: Weather;
  weatherTurns: number;
  terrain: Terrain;
  terrainTurns: number;
  tailwind: { player: boolean; opponent: boolean };
  trickRoom: boolean;
  trickRoomTurns: number;
}

export interface PlayerChoice {
  type: "move" | "switch";
  moveIndex?: number;
  moveTarget?: number; // slot index on opponent side, or ally slot for ally-targeting moves
  switchIndex?: number; // team index of the pokemon to switch to
}

export interface BattleEvent {
  turn: number;
  type: "move" | "switch" | "faint" | "damage" | "miss" | "crit" | "super-effective" | "not-very-effective" | "immune" | "activate" | "ko" | "heal" | "status" | "stat-change";
  actor: PlayerSide;
  actorName: string;
  message: string;
  detail?: Record<string, unknown>;
}

export const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, rock: 2, flying: 0, bug: 0.5, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const row = TYPE_CHART[moveType] ?? {};
    multiplier *= row[defType] ?? 1;
  }
  return multiplier;
}

export function applyStatStage(stat: number, stage: number): number {
  const multipliers: Record<number, number> = {
    "-6": 2/8, "-5": 2/7, "-4": 2/6, "-3": 2/5, "-2": 2/4, "-1": 2/3,
    0: 1,
    1: 3/2, 2: 4/2, 3: 5/2, 4: 6/2, 5: 7/2, 6: 8/2,
  };
  return Math.floor(stat * (multipliers[stage] ?? 1));
}

export function clampStatStage(stage: number): number {
  return Math.max(-6, Math.min(6, stage));
}

export function makeDefaultBattlePokemon(): Partial<BattlePokemon> {
  return {
    isFainted: false,
    turnsOnField: 0,
    protected: false,
    protectCount: 0,
    perishTurns: 0,
    status: "none",
    sleepTurns: 0,
    toxicCounter: 0,
    statStages: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
    helpingHand: false,
    lockedMove: -1,
  };
}

export function makeDefaultBattleState(): Partial<BattleState> {
  return {
    weather: "none",
    weatherTurns: 0,
    terrain: "none",
    terrainTurns: 0,
    tailwind: { player: false, opponent: false },
    trickRoom: false,
    trickRoomTurns: 0,
  };
}

export function calcStat(
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureMultiplier: number,
): number {
  if (base === 1) return 1;
  return Math.floor((Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5) * natureMultiplier);
}

export function calcHp(base: number, iv: number, ev: number, level: number): number {
  if (base === 1) return 1;
  return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
}

export function natureMultiplier(nature: string, stat: Stat): number {
  const N: Record<string, { inc: Stat; dec: Stat }> = {
    Adamant: { inc: "attack", dec: "specialAttack" },
    Bashful: { inc: "" as Stat, dec: "" as Stat },
    Bold: { inc: "defense", dec: "attack" },
    Brave: { inc: "attack", dec: "speed" },
    Calm: { inc: "specialDefense", dec: "attack" },
    Careful: { inc: "specialDefense", dec: "specialAttack" },
    Docile: { inc: "" as Stat, dec: "" as Stat },
    Gentle: { inc: "specialDefense", dec: "defense" },
    Hardy: { inc: "" as Stat, dec: "" as Stat },
    Hasty: { inc: "speed", dec: "defense" },
    Impish: { inc: "defense", dec: "specialAttack" },
    Jolly: { inc: "speed", dec: "specialAttack" },
    Lax: { inc: "defense", dec: "specialDefense" },
    Lonely: { inc: "attack", dec: "defense" },
    Mild: { inc: "specialAttack", dec: "defense" },
    Modest: { inc: "specialAttack", dec: "attack" },
    Naive: { inc: "speed", dec: "specialDefense" },
    Naughty: { inc: "attack", dec: "specialDefense" },
    Quiet: { inc: "specialAttack", dec: "speed" },
    Quirky: { inc: "" as Stat, dec: "" as Stat },
    Rash: { inc: "specialAttack", dec: "specialDefense" },
    Relaxed: { inc: "defense", dec: "speed" },
    Sassy: { inc: "specialDefense", dec: "speed" },
    Serious: { inc: "" as Stat, dec: "" as Stat },
    Timid: { inc: "speed", dec: "attack" },
  };
  const mods = N[nature] ?? { inc: "" as Stat, dec: "" as Stat };
  if (mods.inc === stat) return 1.1;
  if (mods.dec === stat) return 0.9;
  return 1.0;
}
