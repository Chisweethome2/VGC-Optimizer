import { Router } from "express";
import { eligibleByRegulation, REGULATION_MA_ELIGIBLE } from "./regulations";

const router = Router();

interface PokeAPIPokemon {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  sprites: { front_default: string; other?: { "official-artwork"?: { front_default: string } } };
  moves: { move: { name: string } }[];
  weight: number;
}

interface PokeAPISpecies {
  is_legendary: boolean;
  is_mythical: boolean;
}

const pokemonCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function fetchPokeAPI(url: string): Promise<unknown> {
  const cached = pokemonCache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }
  const resp = await fetch(url);
  if (!resp.ok) {
    throw Object.assign(new Error("PokeAPI error"), { status: resp.status });
  }
  const data = await resp.json();
  pokemonCache.set(url, { data, ts: Date.now() });
  return data;
}

function statName(name: string): string {
  const map: Record<string, string> = {
    hp: "hp",
    attack: "attack",
    defense: "defense",
    "special-attack": "specialAttack",
    "special-defense": "specialDefense",
    speed: "speed",
  };
  return map[name] ?? name;
}

function buildBaseStats(stats: PokeAPIPokemon["stats"]) {
  const result: Record<string, number> = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
  for (const s of stats) {
    const key = statName(s.stat.name);
    if (key in result) result[key] = s.base_stat;
  }
  return result;
}

router.get("/pokemon/search", async (req, res) => {
  const q = (req.query["q"] as string ?? "").toLowerCase().trim();
  const regulation = req.query["regulation"] as string | undefined;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  // Use regulation-specific eligible list when provided, fall back to the Reg M-A list
  const pool: string[] = regulation
    ? (eligibleByRegulation[regulation] ?? REGULATION_MA_ELIGIBLE)
    : REGULATION_MA_ELIGIBLE;

  const matches = pool
    .filter((name) => name.includes(q))
    .slice(0, 12);

  const results = await Promise.allSettled(
    matches.map(async (name) => {
      try {
        const poke = await fetchPokeAPI(`https://pokeapi.co/api/v2/pokemon/${name}`) as PokeAPIPokemon;
        const species = await fetchPokeAPI(`https://pokeapi.co/api/v2/pokemon-species/${poke.id}`) as PokeAPISpecies;
        return {
          name: poke.name,
          dexNumber: poke.id,
          types: poke.types.map((t) => t.type.name),
          spriteUrl: poke.sprites.front_default,
          isLegendary: species.is_legendary || species.is_mythical,
        };
      } catch {
        return null;
      }
    })
  );

  const items = results
    .filter((r) => r.status === "fulfilled" && r.value !== null)
    .map((r) => (r as PromiseFulfilledResult<unknown>).value);

  res.json(items);
});

router.get("/pokemon/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const poke = await fetchPokeAPI(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`) as PokeAPIPokemon;
    const species = await fetchPokeAPI(`https://pokeapi.co/api/v2/pokemon-species/${poke.id}`) as PokeAPISpecies;
    const detail = {
      name: poke.name,
      dexNumber: poke.id,
      types: poke.types.map((t) => t.type.name),
      baseStats: buildBaseStats(poke.stats),
      abilities: poke.abilities.map((a) => a.ability.name),
      spriteUrl: poke.sprites.front_default,
      artworkUrl: poke.sprites.other?.["official-artwork"]?.front_default ?? poke.sprites.front_default,
      learnableMoves: poke.moves.slice(0, 80).map((m) => m.move.name),
      weightKg: poke.weight / 10,
    };
    res.json(detail);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 404) return res.status(404).json({ error: "Pokemon not found" });
    res.status(500).json({ error: "Failed to fetch Pokemon data" });
  }
});

export default router;
