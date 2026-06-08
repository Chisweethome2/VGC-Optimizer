import { Router } from "express";
import { db, teamsTable, pokemonTable } from "../lib/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "./auth";
import { archetypes } from "./archetypes";

const router = Router();

// Type chart — damage multiplier when attacking with typeA against typeB
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const ALL_TYPES = Object.keys(TYPE_CHART).concat(
  ["normal","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","fairy"]
).filter((v, i, arr) => arr.indexOf(v) === i);

function getDefMultiplier(attackerType: string, defenderTypes: string[]): number {
  let mult = 1;
  const row = TYPE_CHART[attackerType] ?? {};
  for (const defType of defenderTypes) {
    mult *= row[defType] ?? 1;
  }
  return mult;
}

interface TeamSlot {
  slot: number;
  pokemonName: string;
  moves: string[];
  ability: string;
  item: string;
  nature: string;
  teraType: string;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
}

// Simple nature speed modifiers
const SPEED_NATURES: Record<string, number> = {
  timid: 1.1, jolly: 1.1, hasty: 1.1, naive: 1.1,
  brave: 0.9, quiet: 0.9, relaxed: 0.9, sassy: 0.9,
};

// Rough base speed lookup for common VGC Pokemon
const BASE_SPEEDS: Record<string, number> = {
  "flutter-mane": 135, "iron-valiant": 116, "chien-pao": 135, "chi-yu": 100,
  "roaring-moon": 119, "iron-hands": 45, "ting-lu": 45, "wo-chien": 45,
  "miraidon": 135, "koraidon": 135, "incineroar": 60, "amoonguss": 30,
  "torkoal": 20, "pelipper": 65, "tyranitar": 61, "excadrill": 88,
  "landorus-therian": 91, "garchomp": 102, "hatterene": 29, "indeedee": 75,
  "porygon2": 60, "grimmsnarl": 60, "rillaboom": 85, "dragapult": 142,
  "togekiss": 80, "talonflame": 126, "arcanine": 95, "murkrow": 91,
  "baxcalibur": 87, "cetitan": 81, "ninetales-alola": 109, "venusaur": 80,
  "charizard": 100, "blastoise": 78, "urshifu-rapid-strike": 97,
  "urshifu-single-strike": 97, "calyrex-shadow": 150, "calyrex-ice": 50,
  "zacian": 148, "zamazenta": 128, "kyogre": 90, "groudon": 90,
  "regieleki": 200, "annihilape": 90, "clodsire": 20, "gholdengo": 84,
  "kingambit": 50, "great-tusk": 87, "iron-bundle": 136, "palafin": 100,
  "iron-moth": 110, "sandy-shocks": 101, "iron-treads": 106, "iron-thorns": 60,
  "iron-boulder": 124, "gouging-fire": 95, "raging-bolt": 75,
  "ogerpon": 110, "ogerpon-wellspring": 110, "ogerpon-hearthflame": 110, "ogerpon-cornerstone": 110,
  "terapagos": 60,
  // Reg M-A eligible (no duplicates from above)
  "meowscarada": 123, "skeledirge": 51, "quaquaval": 85, "garganacl": 68,
  "armarouge": 60, "ceruledge": 88, "bellibolt": 44, "scovillain": 75,
  "espathra": 105, "tinkaton": 42, "orthworm": 27,
  "glimmora": 86, "farigiraf": 60, "sinistcha": 40,
  "archaludon": 85, "hydrapple": 44, "sneasler": 120, "kleavor": 85,
  "basculegion": 86, "wyrdeer": 65, "weavile": 125, "lucario": 90,
  "kommo-o": 85, "mimikyu": 96, "toxapex": 35, "araquanid": 42,
  "salazzle": 117, "tsareena": 72, "passimian": 80, "oranguru": 60,
  "lycanroc": 112, "primarina": 60, "decidueye": 70,
  "greninja": 122, "delphox": 104, "chesnaught": 64, "volcarona": 100,
  "hydreigon": 98, "chandelure": 80, "reuniclus": 30, "zoroark": 105,
  "krookodile": 92, "conkeldurr": 45, "serperior": 113,
  "politoed": 70, "ampharos": 55, "scizor": 65, "heracross": 85,
  "houndoom": 95, "steelix": 30, "gardevoir": 80, "medicham": 60,
  "manectric": 105, "altaria": 80, "absol": 75, "lopunny": 105,
  "gallade": 80, "froslass": 110, "rotom": 91,
  // floette (eternal) / mega floette
  "floette": 52,
  // aerodactyl mega / gyarados mega
  "aerodactyl": 130, "gyarados": 81,
  // corviknight, sneasler, basculegion already added
  "corviknight": 60, "aegislash": 60, "maushold": 50,
};

function getBaseSpeed(name: string): number {
  return BASE_SPEEDS[name] ?? 75;
}

function calcEffectiveSpeed(slot: TeamSlot): number {
  const base = getBaseSpeed(slot.pokemonName);
  const natMult = SPEED_NATURES[slot.nature?.toLowerCase()] ?? 1;
  const speedEV = slot.evs?.speed ?? 0;
  const speedIV = slot.ivs?.speed ?? 31;
  const lvl = 50;
  const stat = Math.floor((Math.floor((2 * base + speedIV + Math.floor(speedEV / 4)) * lvl / 100) + 5) * natMult);
  return stat;
}

// Type-based heuristics for analysis
const ARCHETYPE_TYPE_PATTERNS: Record<string, { goodTypes: string[]; badTypes: string[] }> = {
  "trick-room": { goodTypes: ["psychic", "ghost", "fairy"], badTypes: ["dark", "ghost"] },
  "rain": { goodTypes: ["water", "electric", "flying"], badTypes: ["grass", "electric"] },
  "sun": { goodTypes: ["fire", "grass", "flying"], badTypes: ["water", "rock"] },
  "sand": { goodTypes: ["rock", "ground", "steel"], badTypes: ["ice", "fighting", "water"] },
  "snow": { goodTypes: ["ice", "fairy"], badTypes: ["fire", "rock", "steel", "fighting"] },
  "hyper-offense": { goodTypes: ["fighting", "dark", "fairy", "psychic"], badTypes: ["ground", "psychic"] },
  "perish-trap": { goodTypes: ["psychic", "ghost"], badTypes: ["dark", "ghost"] },
  "bulky-offense": { goodTypes: ["fire", "ground", "poison"], badTypes: ["water", "psychic"] },
  "tailwind": { goodTypes: ["flying", "electric"], badTypes: ["rock", "electric"] },
};

function simulateMatchup(slots: TeamSlot[], archetype: typeof archetypes[0]) {
  const pattern = ARCHETYPE_TYPE_PATTERNS[archetype.id] ?? { goodTypes: [], badTypes: [] };

  // Collect team types
  const teamTypes = slots.flatMap((s) => {
    // We infer type from move names / known types — just use tera for coverage scoring
    return [s.teraType?.toLowerCase()].filter(Boolean) as string[];
  });

  const hasGoodCoverage = pattern.goodTypes.some((t) => teamTypes.includes(t));
  const hasBadWeakness = pattern.badTypes.some((t) => teamTypes.includes(t));

  // Speed tier analysis
  const avgSpeed = slots.length > 0
    ? slots.reduce((sum, s) => sum + calcEffectiveSpeed(s), 0) / slots.length
    : 75;

  let rating = 50;
  const advantages: string[] = [];
  const disadvantages: string[] = [...(archetype.weaknesses as string[])].slice(0, 2);
  const winConditions: string[] = [];
  const keyThreats: string[] = [...archetype.keyPokemon].slice(0, 3);

  if (hasGoodCoverage) {
    rating += 15;
    advantages.push(`Tera types provide effective coverage against ${archetype.name}`);
    winConditions.push("Exploit Tera type matchup advantage");
  }
  if (hasBadWeakness) {
    rating -= 10;
  }

  // Speed-based scoring vs archetype type
  if (archetype.id === "trick-room") {
    if (avgSpeed < 50) {
      rating += 15;
      advantages.push("Team's slow Pokemon thrive under Trick Room");
      winConditions.push("Set up Trick Room and sweep with slow powerhouses");
    } else if (avgSpeed > 100) {
      rating -= 20;
      disadvantages.push("Team's fast Pokemon are reversed under Trick Room — dangerous matchup");
    }
  } else if (archetype.id === "hyper-offense" || archetype.id === "tailwind") {
    if (avgSpeed > 100) {
      rating += 10;
      advantages.push("Team's speed tier can compete with or outspeed key threats");
      winConditions.push("Trade speed favorably and prevent Tailwind setup");
    }
  }

  // Team size penalties (incomplete teams)
  if (slots.length < 6) {
    rating -= (6 - slots.length) * 5;
    disadvantages.push("Incomplete team — more Pokemon needed for full coverage");
  }

  // Clamp rating
  rating = Math.max(10, Math.min(90, rating));

  const verdict =
    rating >= 70 ? "Favorable — strong matchup" :
    rating >= 50 ? "Even — requires good positioning" :
    rating >= 30 ? "Unfavorable — needs specific counterplay" :
    "Difficult — major structural weakness";

  if (winConditions.length === 0) {
    winConditions.push(`Target ${archetype.keyPokemon[0] ?? "key threats"} early to disrupt the strategy`);
    winConditions.push("Apply pressure before the opponent can establish their win condition");
  }

  return {
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    rating,
    verdict,
    advantages: advantages.length ? advantages : [`Your team can contest ${archetype.name} through positioning`],
    disadvantages: disadvantages.length ? disadvantages : [`${archetype.name} has several dangerous threats`],
    keyThreats,
    winConditions,
  };
}

router.post("/teams/:id/analyze", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, id));
    if (!team) { res.status(404).json({ error: "Team not found" }); return; }

    const slots = (team.slots ?? []) as TeamSlot[];

    // Fetch actual Pokemon types from DB
    const names = slots.map((s) => s.pokemonName.toLowerCase());
    const pokes = await db.select({ name: pokemonTable.name, types: pokemonTable.types })
      .from(pokemonTable)
      .where(inArray(pokemonTable.name, names));
    const typeMap = new Map<string, string[]>();
    for (const p of pokes) typeMap.set(p.name, p.types as string[]);

    function getTypes(s: TeamSlot): string[] {
      return typeMap.get(s.pokemonName.toLowerCase()) ?? [];
    }

    // Build type defense analysis from actual Pokemon types
    const typeDefenses = ALL_TYPES.slice(0, 18).map((t) => {
      const resisting = slots
        .filter((s) => getDefMultiplier(t, getTypes(s)) < 1)
        .map((s) => s.pokemonName);
      return {
        type: t,
        multiplier: resisting.length > 0 ? 0.5 : 1,
        pokemonResisting: resisting,
      };
    });

    // Offensive coverage from move names (rough type detection)
    const offensiveCoverage = Array.from(
      new Set(slots.flatMap((s) => getTypes(s)))
    ).filter(Boolean) as string[];

    // Speed tiers
    const speedTiers = slots
      .map((s) => ({
        pokemonName: s.pokemonName,
        baseSpeed: getBaseSpeed(s.pokemonName),
        effectiveSpeed: calcEffectiveSpeed(s),
        nature: s.nature,
      }))
      .sort((a, b) => b.effectiveSpeed - a.effectiveSpeed);

    // Weakness summary — how many Pokemon are weak (2x or worse) to each type
    const weaknessSummary = ALL_TYPES.slice(0, 18)
      .map((t) => {
        const vulnerable = slots
          .filter((s) => getDefMultiplier(t, getTypes(s)) > 1)
          .map((s) => s.pokemonName);
        return { type: t, count: vulnerable.length, vulnerablePokemon: vulnerable };
      })
      .filter((w) => w.count > 0)
      .sort((a, b) => b.count - a.count);

    // Suggestions
    const suggestions: string[] = [];
    if (slots.length < 6) suggestions.push("Complete your team — you need 6 Pokemon for a full team.");
    const hasTR = slots.some((s) => s.moves.some((m) => m.includes("trick-room")));
    const hasTailwind = slots.some((s) => s.moves.some((m) => m.includes("tailwind")));
    const hasRedirect = slots.some((s) => s.moves.some((m) => ["follow-me","rage-powder"].includes(m)));
    if (!hasRedirect) suggestions.push("Consider adding a Rage Powder or Follow Me user for redirection support.");
    if (!hasTR && !hasTailwind) suggestions.push("Add speed control (Trick Room or Tailwind) to create a win condition.");
    const hasIntimidate = slots.some((s) => s.ability?.toLowerCase() === "intimidate");
    if (!hasIntimidate) suggestions.push("Intimidate (Incineroar, Arcanine) provides excellent damage control.");
    if (weaknessSummary.length > 0) {
      suggestions.push(`Your team is most vulnerable to ${weaknessSummary[0]!.type}-type attacks — consider coverage.`);
    }

    const analysis = {
      teamId: id,
      typeDefenses,
      offensiveCoverage,
      speedTiers,
      weaknessSummary,
      suggestions,
      terrainControl: slots.some((s) => ["psychic-surge","misty-surge","electric-surge","grassy-surge"].includes(s.ability?.toLowerCase())),
      weatherControl: slots.some((s) => ["drizzle","drought","sand-stream","snow-warning","orichalcum-pulse","hadron-engine"].includes(s.ability?.toLowerCase())),
      hasTrickRoom: hasTR,
      redirectSupport: hasRedirect,
    };

    res.json(analysis);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze team");
    res.status(500).json({ error: "Failed to analyze team" });
  }
});

router.post("/teams/:id/simulate", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, id));
    if (!team) { res.status(404).json({ error: "Team not found" }); return; }

    const slots = (team.slots ?? []) as TeamSlot[];
    const results = archetypes.map((archetype) => simulateMatchup(slots, archetype));

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to simulate team");
    res.status(500).json({ error: "Failed to simulate team" });
  }
});

export default router;
