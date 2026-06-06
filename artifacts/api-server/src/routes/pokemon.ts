import { Router } from "express";

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

// Minimal list of common VGC Pokemon names for search
const vgcPokemonList: string[] = [
  "miraidon", "koraidon", "flutter-mane", "iron-hands", "chien-pao", "chi-yu", "ting-lu", "wo-chien",
  "roaring-moon", "iron-valiant", "iron-moth", "iron-boulder", "gouging-fire", "raging-bolt",
  "urshifu-single-strike", "urshifu-rapid-strike", "calyrex-shadow", "calyrex-ice", "zacian",
  "zamazenta", "kyogre", "groudon", "rayquaza", "dialga", "palkia", "giratina", "xerneas", "yveltal",
  "incineroar", "amoonguss", "torkoal", "pelipper", "politoed", "tyranitar", "excadrill",
  "landorus-therian", "garchomp", "hatterene", "indeedee", "porygon2", "grimmsnarl",
  "rillaboom", "cinderace", "dragapult", "togekiss", "clefairy", "murkrow", "talonflame",
  "arcanine", "scream-tail", "sandy-shocks", "iron-treads", "baxcalibur", "cetitan",
  "ninetales-alola", "venusaur", "charizard", "blastoise", "mewtwo", "lugia", "ho-oh",
  "regieleki", "regidrago", "regice", "regirock", "registeel", "regigigas",
  "kommo-o", "armarouge", "ceruledge", "iron-jugulis", "iron-bundle", "palafin",
  "annihilape", "clodsire", "gholdengo", "kingambit", "great-tusk", "scream-tail",
  "brute-bonnet", "flutter-mane", "slither-wing", "sandy-shocks", "iron-treads",
  "iron-moth", "iron-hands", "iron-jugulis", "iron-thorns", "iron-valiant",
  "wo-chien", "chien-pao", "ting-lu", "chi-yu",
  "walking-wake", "iron-leaves", "dipplin", "poltchageist", "sinistcha",
  "okidogi", "munkidori", "fezandipiti", "ogerpon", "ogerpon-wellspring", "ogerpon-hearthflame", "ogerpon-cornerstone",
  "terapagos", "pecharunt",
  "pikachu", "raichu", "clefable", "gengar", "alakazam", "machamp", "golem", "slowbro",
  "starmie", "jolteon", "flareon", "vaporeon", "espeon", "umbreon", "leafeon", "glaceon", "sylveon",
  "dragonite", "tyranitar", "blaziken", "swampert", "gardevoir", "breloom", "slaking",
  "aggron", "flygon", "altaria", "metagross", "salamence", "latias", "latios",
  "rhyperior", "electivire", "magmortar", "weavile", "lucario", "hippowdon", "garchomp",
  "toxicroak", "abomasnow", "gallade", "dusknoir",
  "zoroark-hisui", "ursaluna", "ursaluna-bloodmoon", "basculegion",
  "kleavor", "lilligant-hisui", "voltorb-hisui", "electrode-hisui", "typhlosion-hisui",
  "mimikyu", "marowak-alola", "raichu-alola", "ninetales-alola", "sandslash-alola",
  "wishiwashi", "dewpider", "araquanid", "lurantis", "morelull", "shiinotic",
  "oranguru", "passimian", "wimpod", "golisopod", "sandygast", "palossand",
  "pyukumuku", "type-null", "silvally", "minior", "komala", "turtonator",
  "togedemaru", "mimikyu", "bruxish", "drampa", "dhelmise", "jangmo-o",
  "hakamo-o", "kommo-o", "tapu-koko", "tapu-lele", "tapu-bulu", "tapu-fini",
  "buzzwole", "pheromosa", "xurkitree", "celesteela", "kartana", "guzzlord",
  "poipole", "naganadel", "stakataka", "blacephalon", "zeraora",
  "zygarde", "hoopa", "volcanion", "diancie", "hoopa",
  "coalossal", "appletun", "flapple", "sandaconda", "cramorant", "barraskewda",
  "toxtricity", "centiskorch", "clobbopus", "grapploct", "hatterene", "grimmsnarl",
  "obstagoon", "perrserker", "cursola", "sirfetchd", "mr-rime", "runerigus",
  "milcery", "alcremie", "falinks", "pincurchin", "snom", "frosmoth",
  "stonjourner", "eiscue", "indeedee", "morpeko", "cufant", "copperajah",
  "dracozolt", "arctozolt", "dracovish", "arctovish", "duraludon", "dreepy",
  "drakloak", "dragapult",
];

router.get("/pokemon/search", async (req, res) => {
  const q = (req.query["q"] as string ?? "").toLowerCase().trim();
  const regulation = req.query["regulation"] as string | undefined;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  const matches = vgcPokemonList
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
