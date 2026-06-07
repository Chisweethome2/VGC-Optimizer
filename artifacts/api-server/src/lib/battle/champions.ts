import { BattlePokemon, BattleMove, Stat } from "./types";
import { natureMultiplier, calcStat, calcHp } from "./types";

function getMoveTarget(dbMove: any): string {
  const t = (dbMove?.target || "").toLowerCase();
  const valid: string[] = ["single", "all-opponents", "all-adjacent", "self", "ally", "user-or-ally", "user", "random-opponent", "all-others"];
  if (valid.includes(t)) return t;
  if (t.includes("opponent") && t.includes("all")) return "all-opponents";
  if (t.includes("adjacent")) return "all-adjacent";
  if (t.includes("self") || t.includes("user")) return "self";
  if (t.includes("ally")) return "ally";
  return "single";
}

export interface TrainerInfo {
  id: string;
  name: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "champion";
  team: ChampionPokemon[];
}

export interface ChampionPokemon {
  name: string;
  types: string[];
  item: string;
  ability: string;
  nature: string;
  moves: string[];
  baseStats: Record<Stat, number>;
  evs: Record<Stat, number>;
  ivs: Record<Stat, number>;
  weightKg: number;
}

const DEFAULT_IVS: Record<Stat, number> = { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 };

function toBattlePokemon(
  p: ChampionPokemon,
  allMovesMap: Map<string, { name: string; displayName: string; type: string; category: string; power: number | null; accuracy: number | null; priority: number; target: string }>,
): BattlePokemon {
  const multiplier = (stat: Stat) => natureMultiplier(p.nature, stat);
  const stats: Record<Stat, number> = {
    hp: calcHp(p.baseStats.hp, DEFAULT_IVS.hp, p.evs.hp ?? 0, 50),
    attack: calcStat(p.baseStats.attack, DEFAULT_IVS.attack, p.evs.attack ?? 0, 50, multiplier("attack")),
    defense: calcStat(p.baseStats.defense, DEFAULT_IVS.defense, p.evs.defense ?? 0, 50, multiplier("defense")),
    specialAttack: calcStat(p.baseStats.specialAttack, DEFAULT_IVS.specialAttack, p.evs.specialAttack ?? 0, 50, multiplier("specialAttack")),
    specialDefense: calcStat(p.baseStats.specialDefense, DEFAULT_IVS.specialDefense, p.evs.specialDefense ?? 0, 50, multiplier("specialDefense")),
    speed: calcStat(p.baseStats.speed, DEFAULT_IVS.speed, p.evs.speed ?? 0, 50, multiplier("speed")),
  };
  const maxHp = calcHp(p.baseStats.hp, DEFAULT_IVS.hp, p.evs.hp ?? 0, 50);

  const moves: BattleMove[] = p.moves.map((moveName) => {
    const key = moveName.toLowerCase().replace(/\s+/g, "-");
    const m: any = allMovesMap.get(key);
    const maxPp = m?.pp ?? 10;
    return {
      name: key,
      displayName: m?.displayName ?? moveName,
      type: m?.type ?? "normal",
      category: (m?.category ?? "physical") as "physical" | "special" | "status",
      power: m?.power ?? null,
      accuracy: m?.accuracy ?? null,
      priority: m?.priority ?? 0,
      target: getMoveTarget(m) as BattleMove["target"],
      pp: maxPp,
      maxPp,
      makesContact: false,
    };
  });

  return {
    name: p.name,
    dexNumber: 0,
    types: p.types,
    ability: p.ability,
    item: p.item,
    nature: p.nature,
    baseStats: p.baseStats,
    currentHp: maxHp,
    maxHp,
    stats,
    evs: p.evs,
    ivs: DEFAULT_IVS,
    moves,
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

const CHAMPIONS: TrainerInfo[] = [
  {
    id: "wolfe",
    name: "Wolfe Glick",
    title: "2016 World Champion",
    description: "The strategic genius known for Perish Trap and impeccable positioning. 2016 Masters Division World Champion with a Raichu-Incineroar core that revolutionized the format.",
    difficulty: "champion",
    team: [
      {
        name: "Incineroar",
        types: ["fire", "dark"],
        item: "Sitrus Berry",
        ability: "Intimidate",
        nature: "Careful",
        moves: ["Flare Blitz", "Knock Off", "Fake Out", "Parting Shot"],
        baseStats: { hp: 95, attack: 115, defense: 90, specialAttack: 80, specialDefense: 90, speed: 60 },
        evs: { hp: 252, attack: 4, defense: 0, specialAttack: 0, specialDefense: 252, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 83,
      },
      {
        name: "Raichu",
        types: ["electric"],
        item: "Focus Sash",
        ability: "Lightning Rod",
        nature: "Timid",
        moves: ["Fake Out", "Nuzzle", "Volt Switch", "Protect"],
        baseStats: { hp: 60, attack: 90, defense: 55, specialAttack: 90, specialDefense: 80, speed: 110 },
        evs: { hp: 4, attack: 0, defense: 0, specialAttack: 252, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 30,
      },
      {
        name: "Tapu Fini",
        types: ["water", "fairy"],
        item: "Leftovers",
        ability: "Misty Surge",
        nature: "Calm",
        moves: ["Muddy Water", "Moonblast", "Calm Mind", "Protect"],
        baseStats: { hp: 70, attack: 75, defense: 115, specialAttack: 95, specialDefense: 130, speed: 85 },
        evs: { hp: 252, attack: 0, defense: 0, specialAttack: 4, specialDefense: 252, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 21,
      },
      {
        name: "Rillaboom",
        types: ["grass"],
        item: "Assault Vest",
        ability: "Grassy Surge",
        nature: "Adamant",
        moves: ["Grassy Glide", "Knock Off", "U-turn", "Fake Out"],
        baseStats: { hp: 100, attack: 125, defense: 90, specialAttack: 60, specialDefense: 70, speed: 85 },
        evs: { hp: 252, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 90,
      },
      {
        name: "Amoonguss",
        types: ["grass", "poison"],
        item: "Rocky Helmet",
        ability: "Regenerator",
        nature: "Relaxed",
        moves: ["Spore", "Rage Powder", "Pollen Puff", "Protect"],
        baseStats: { hp: 114, attack: 85, defense: 70, specialAttack: 85, specialDefense: 80, speed: 30 },
        evs: { hp: 236, attack: 0, defense: 252, specialAttack: 0, specialDefense: 20, speed: 0 },
        ivs: { hp: 31, attack: 0, defense: 31, specialAttack: 31, specialDefense: 31, speed: 0 },
        weightKg: 10,
      },
      {
        name: "Tyranitar",
        types: ["rock", "dark"],
        item: "Weakness Policy",
        ability: "Sand Stream",
        nature: "Brave",
        moves: ["Rock Slide", "Crunch", "Ice Punch", "Protect"],
        baseStats: { hp: 100, attack: 134, defense: 110, specialAttack: 95, specialDefense: 100, speed: 61 },
        evs: { hp: 252, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 0 },
        ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 0 },
        weightKg: 202,
      },
    ],
  },
  {
    id: "aaron",
    name: "Aaron Zheng",
    title: "3x US National Champion",
    description: "Cybertron — one of the most consistent North American players ever. Known for meticulous game plans, clean pivots, and adapting standard archetypes to perfection.",
    difficulty: "champion",
    team: [
      {
        name: "Zacian",
        types: ["fairy", "steel"],
        item: "Rusted Sword",
        ability: "Intrepid Sword",
        nature: "Adamant",
        moves: ["Behemoth Blade", "Play Rough", "Sacred Sword", "Protect"],
        baseStats: { hp: 92, attack: 130, defense: 115, specialAttack: 80, specialDefense: 115, speed: 138 },
        evs: { hp: 4, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 110,
      },
      {
        name: "Incineroar",
        types: ["fire", "dark"],
        item: "Sitrus Berry",
        ability: "Intimidate",
        nature: "Careful",
        moves: ["Flare Blitz", "Knock Off", "Fake Out", "Parting Shot"],
        baseStats: { hp: 95, attack: 115, defense: 90, specialAttack: 80, specialDefense: 90, speed: 60 },
        evs: { hp: 252, attack: 4, defense: 0, specialAttack: 0, specialDefense: 252, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 83,
      },
      {
        name: "Rillaboom",
        types: ["grass"],
        item: "Assault Vest",
        ability: "Grassy Surge",
        nature: "Adamant",
        moves: ["Grassy Glide", "Wood Hammer", "U-turn", "Fake Out"],
        baseStats: { hp: 100, attack: 125, defense: 90, specialAttack: 60, specialDefense: 70, speed: 85 },
        evs: { hp: 252, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 90,
      },
      {
        name: "Indeedee-F",
        types: ["psychic", "normal"],
        item: "Focus Sash",
        ability: "Psychic Surge",
        nature: "Timid",
        moves: ["Follow Me", "Expanding Force", "Helping Hand", "Protect"],
        baseStats: { hp: 70, attack: 55, defense: 65, specialAttack: 95, specialDefense: 105, speed: 85 },
        evs: { hp: 252, attack: 0, defense: 0, specialAttack: 4, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 20,
      },
      {
        name: "Landorus-Therian",
        types: ["ground", "flying"],
        item: "Life Orb",
        ability: "Intimidate",
        nature: "Jolly",
        moves: ["Earthquake", "Fly", "U-turn", "Protect"],
        baseStats: { hp: 89, attack: 145, defense: 90, specialAttack: 105, specialDefense: 80, speed: 91 },
        evs: { hp: 4, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 68,
      },
      {
        name: "Urshifu-Rapid",
        types: ["fighting", "water"],
        item: "Choice Scarf",
        ability: "Unseen Fist",
        nature: "Jolly",
        moves: ["Surging Strikes", "Close Combat", "U-turn", "Aqua Jet"],
        baseStats: { hp: 100, attack: 130, defense: 100, specialAttack: 63, specialDefense: 60, speed: 97 },
        evs: { hp: 4, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 105,
      },
    ],
  },
  {
    id: "sejun",
    name: "Sejun Park",
    title: "2014 World Champion",
    description: "The legend who won Worlds with a Pachirisu. His Follow Me support + bulky Dragon setup defined an era and proved creativity wins championships.",
    difficulty: "hard",
    team: [
      {
        name: "Pachirisu",
        types: ["electric"],
        item: "Sitrus Berry",
        ability: "Volt Absorb",
        nature: "Careful",
        moves: ["Follow Me", "Nuzzle", "Super Fang", "Protect"],
        baseStats: { hp: 60, attack: 45, defense: 70, specialAttack: 45, specialDefense: 90, speed: 95 },
        evs: { hp: 252, attack: 0, defense: 4, specialAttack: 0, specialDefense: 252, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 3,
      },
      {
        name: "Garchomp",
        types: ["dragon", "ground"],
        item: "Life Orb",
        ability: "Rough Skin",
        nature: "Jolly",
        moves: ["Dragon Claw", "Earthquake", "Rock Slide", "Protect"],
        baseStats: { hp: 108, attack: 130, defense: 95, specialAttack: 80, specialDefense: 85, speed: 102 },
        evs: { hp: 4, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 95,
      },
      {
        name: "Tyranitar",
        types: ["rock", "dark"],
        item: "Weakness Policy",
        ability: "Sand Stream",
        nature: "Adamant",
        moves: ["Rock Slide", "Crunch", "Ice Punch", "Protect"],
        baseStats: { hp: 100, attack: 134, defense: 110, specialAttack: 95, specialDefense: 100, speed: 61 },
        evs: { hp: 252, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 202,
      },
      {
        name: "Talonflame",
        types: ["fire", "flying"],
        item: "Life Orb",
        ability: "Gale Wings",
        nature: "Jolly",
        moves: ["Brave Bird", "Flare Blitz", "Tailwind", "Protect"],
        baseStats: { hp: 78, attack: 81, defense: 71, specialAttack: 74, specialDefense: 69, speed: 126 },
        evs: { hp: 4, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 24,
      },
      {
        name: "Milotic",
        types: ["water"],
        item: "Leftovers",
        ability: "Competitive",
        nature: "Bold",
        moves: ["Scald", "Ice Beam", "Recover", "Protect"],
        baseStats: { hp: 95, attack: 60, defense: 79, specialAttack: 100, specialDefense: 125, speed: 81 },
        evs: { hp: 252, attack: 0, defense: 252, specialAttack: 4, specialDefense: 0, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 162,
      },
      {
        name: "Aegislash",
        types: ["steel", "ghost"],
        item: "Weakness Policy",
        ability: "Stance Change",
        nature: "Quiet",
        moves: ["Shadow Ball", "Flash Cannon", "King's Shield", "Sacred Sword"],
        baseStats: { hp: 60, attack: 50, defense: 150, specialAttack: 50, specialDefense: 150, speed: 60 },
        evs: { hp: 252, attack: 0, defense: 0, specialAttack: 252, specialDefense: 4, speed: 0 },
        ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 0 },
        weightKg: 53,
      },
    ],
  },
  {
    id: "giovanni",
    name: "Giovanni Costa",
    title: "Multi-Regional Champion",
    description: "A pillar of the Latin American VGC scene with multiple Regional wins. Known for aggressive Hyper Offense and punishing mispositioning in a single turn.",
    difficulty: "hard",
    team: [
      {
        name: "Indeedee-F",
        types: ["psychic", "normal"],
        item: "Focus Sash",
        ability: "Psychic Surge",
        nature: "Timid",
        moves: ["Follow Me", "Expanding Force", "Helping Hand", "Protect"],
        baseStats: { hp: 70, attack: 55, defense: 65, specialAttack: 95, specialDefense: 105, speed: 85 },
        evs: { hp: 252, attack: 0, defense: 0, specialAttack: 4, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 20,
      },
      {
        name: "Calyrex-Shadow",
        types: ["psychic", "ghost"],
        item: "Life Orb",
        ability: "As One",
        nature: "Timid",
        moves: ["Astral Barrage", "Expanding Force", "Draining Kiss", "Protect"],
        baseStats: { hp: 100, attack: 85, defense: 80, specialAttack: 165, specialDefense: 100, speed: 150 },
        evs: { hp: 4, attack: 0, defense: 0, specialAttack: 252, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 53,
      },
      {
        name: "Incineroar",
        types: ["fire", "dark"],
        item: "Sitrus Berry",
        ability: "Intimidate",
        nature: "Careful",
        moves: ["Flare Blitz", "Knock Off", "Fake Out", "Parting Shot"],
        baseStats: { hp: 95, attack: 115, defense: 90, specialAttack: 80, specialDefense: 90, speed: 60 },
        evs: { hp: 252, attack: 4, defense: 0, specialAttack: 0, specialDefense: 252, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 83,
      },
      {
        name: "Rillaboom",
        types: ["grass"],
        item: "Assault Vest",
        ability: "Grassy Surge",
        nature: "Adamant",
        moves: ["Grassy Glide", "Wood Hammer", "U-turn", "Fake Out"],
        baseStats: { hp: 100, attack: 125, defense: 90, specialAttack: 60, specialDefense: 70, speed: 85 },
        evs: { hp: 252, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 90,
      },
      {
        name: "Urshifu-Rapid",
        types: ["fighting", "water"],
        item: "Choice Scarf",
        ability: "Unseen Fist",
        nature: "Jolly",
        moves: ["Surging Strikes", "Close Combat", "U-turn", "Aqua Jet"],
        baseStats: { hp: 100, attack: 130, defense: 100, specialAttack: 63, specialDefense: 60, speed: 97 },
        evs: { hp: 4, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 105,
      },
      {
        name: "Amoonguss",
        types: ["grass", "poison"],
        item: "Rocky Helmet",
        ability: "Regenerator",
        nature: "Relaxed",
        moves: ["Spore", "Rage Powder", "Pollen Puff", "Protect"],
        baseStats: { hp: 114, attack: 85, defense: 70, specialAttack: 85, specialDefense: 80, speed: 30 },
        evs: { hp: 236, attack: 0, defense: 252, specialAttack: 0, specialDefense: 20, speed: 0 },
        ivs: { hp: 31, attack: 0, defense: 31, specialAttack: 31, specialDefense: 31, speed: 0 },
        weightKg: 10,
      },
    ],
  },
  {
    id: "ray",
    name: "Ray Rizzo",
    title: "3x World Champion (2010-2012)",
    description: "The only player to win three consecutive World Championships. Known for unorthodox picks and masterful reads of the metagame before anyone else.",
    difficulty: "champion",
    team: [
      {
        name: "Hydreigon",
        types: ["dark", "dragon"],
        item: "Life Orb",
        ability: "Levitate",
        nature: "Timid",
        moves: ["Draco Meteor", "Dark Pulse", "Flamethrower", "Protect"],
        baseStats: { hp: 92, attack: 105, defense: 90, specialAttack: 125, specialDefense: 90, speed: 98 },
        evs: { hp: 4, attack: 0, defense: 0, specialAttack: 252, specialDefense: 0, speed: 252 },
        ivs: DEFAULT_IVS,
        weightKg: 160,
      },
      {
        name: "Metagross",
        types: ["steel", "psychic"],
        item: "Choice Band",
        ability: "Clear Body",
        nature: "Jolly",
        moves: ["Meteor Mash", "Earthquake", "Ice Punch", "Thunder Punch"],
        baseStats: { hp: 80, attack: 135, defense: 130, specialAttack: 95, specialDefense: 90, speed: 70 },
        evs: { hp: 252, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 4 },
        ivs: DEFAULT_IVS,
        weightKg: 550,
      },
      {
        name: "Rotom-Wash",
        types: ["electric", "water"],
        item: "Sitrus Berry",
        ability: "Levitate",
        nature: "Modest",
        moves: ["Hydro Pump", "Thunderbolt", "Will-O-Wisp", "Protect"],
        baseStats: { hp: 50, attack: 65, defense: 107, specialAttack: 105, specialDefense: 107, speed: 86 },
        evs: { hp: 252, attack: 0, defense: 0, specialAttack: 252, specialDefense: 4, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 0.3,
      },
      {
        name: "Scizor",
        types: ["bug", "steel"],
        item: "Occa Berry",
        ability: "Technician",
        nature: "Adamant",
        moves: ["Bullet Punch", "Bug Bite", "Knock Off", "Protect"],
        baseStats: { hp: 70, attack: 130, defense: 100, specialAttack: 55, specialDefense: 80, speed: 65 },
        evs: { hp: 252, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 118,
      },
      {
        name: "Gastrodon",
        types: ["water", "ground"],
        item: "Rindo Berry",
        ability: "Storm Drain",
        nature: "Calm",
        moves: ["Earth Power", "Scald", "Ice Beam", "Recover"],
        baseStats: { hp: 111, attack: 83, defense: 68, specialAttack: 92, specialDefense: 82, speed: 39 },
        evs: { hp: 252, attack: 0, defense: 0, specialAttack: 4, specialDefense: 252, speed: 0 },
        ivs: DEFAULT_IVS,
        weightKg: 29,
      },
      {
        name: "Conkeldurr",
        types: ["fighting"],
        item: "Flame Orb",
        ability: "Guts",
        nature: "Brave",
        moves: ["Drain Punch", "Mach Punch", "Ice Punch", "Protect"],
        baseStats: { hp: 105, attack: 140, defense: 95, specialAttack: 55, specialDefense: 65, speed: 45 },
        evs: { hp: 252, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 0 },
        ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 0 },
        weightKg: 87,
      },
    ],
  },
];

export function getChampions(): TrainerInfo[] {
  return CHAMPIONS;
}

export function getChampion(id: string): TrainerInfo | undefined {
  return CHAMPIONS.find((c) => c.id === id);
}

export function buildChampionBattlePokemon(
  champion: TrainerInfo,
  allMovesMap: Map<string, { name: string; displayName: string; type: string; category: string; power: number | null; accuracy: number | null; priority: number; target: string }>,
): BattlePokemon[] {
  return champion.team.map((p) => toBattlePokemon(p, allMovesMap));
}
