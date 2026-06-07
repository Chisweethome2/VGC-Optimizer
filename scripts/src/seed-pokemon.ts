import { db, pokemonTable } from "@workspace/db";

const REG_MA_POKEMON: Array<{
  name: string;
  lookupName: string;
}> = [
  { name: "venusaur", lookupName: "venusaur" },
  { name: "charizard", lookupName: "charizard" },
  { name: "blastoise", lookupName: "blastoise" },
  { name: "beedrill", lookupName: "beedrill" },
  { name: "pidgeot", lookupName: "pidgeot" },
  { name: "arbok", lookupName: "arbok" },
  { name: "pikachu", lookupName: "pikachu" },
  { name: "raichu", lookupName: "raichu" },
  { name: "raichu-alola", lookupName: "raichualola" },
  { name: "clefable", lookupName: "clefable" },
  { name: "ninetales", lookupName: "ninetales" },
  { name: "ninetales-alola", lookupName: "ninetalesalola" },
  { name: "arcanine", lookupName: "arcanine" },
  { name: "arcanine-hisui", lookupName: "arcaninehisui" },
  { name: "alakazam", lookupName: "alakazam" },
  { name: "machamp", lookupName: "machamp" },
  { name: "victreebel", lookupName: "victreebel" },
  { name: "slowbro", lookupName: "slowbro" },
  { name: "slowbro-galar", lookupName: "slowbrogalar" },
  { name: "gengar", lookupName: "gengar" },
  { name: "kangaskhan", lookupName: "kangaskhan" },
  { name: "starmie", lookupName: "starmie" },
  { name: "pinsir", lookupName: "pinsir" },
  { name: "tauros", lookupName: "tauros" },
  { name: "tauros-paldea-combat", lookupName: "taurospaldeacombat" },
  { name: "tauros-paldea-blaze", lookupName: "taurospaldeablaze" },
  { name: "tauros-paldea-aqua", lookupName: "taurospaldeaaqua" },
  { name: "gyarados", lookupName: "gyarados" },
  { name: "ditto", lookupName: "ditto" },
  { name: "vaporeon", lookupName: "vaporeon" },
  { name: "jolteon", lookupName: "jolteon" },
  { name: "flareon", lookupName: "flareon" },
  { name: "aerodactyl", lookupName: "aerodactyl" },
  { name: "snorlax", lookupName: "snorlax" },
  { name: "dragonite", lookupName: "dragonite" },
  { name: "meganium", lookupName: "meganium" },
  { name: "typhlosion", lookupName: "typhlosion" },
  { name: "typhlosion-hisui", lookupName: "typhlosionhisui" },
  { name: "feraligatr", lookupName: "feraligatr" },
  { name: "ariados", lookupName: "ariados" },
  { name: "ampharos", lookupName: "ampharos" },
  { name: "azumarill", lookupName: "azumarill" },
  { name: "politoed", lookupName: "politoed" },
  { name: "espeon", lookupName: "espeon" },
  { name: "umbreon", lookupName: "umbreon" },
  { name: "slowking", lookupName: "slowking" },
  { name: "slowking-galar", lookupName: "slowkinggalar" },
  { name: "forretress", lookupName: "forretress" },
  { name: "steelix", lookupName: "steelix" },
  { name: "scizor", lookupName: "scizor" },
  { name: "heracross", lookupName: "heracross" },
  { name: "skarmory", lookupName: "skarmory" },
  { name: "houndoom", lookupName: "houndoom" },
  { name: "tyranitar", lookupName: "tyranitar" },
  { name: "pelipper", lookupName: "pelipper" },
  { name: "gardevoir", lookupName: "gardevoir" },
  { name: "sableye", lookupName: "sableye" },
  { name: "aggron", lookupName: "aggron" },
  { name: "medicham", lookupName: "medicham" },
  { name: "manectric", lookupName: "manectric" },
  { name: "sharpedo", lookupName: "sharpedo" },
  { name: "camerupt", lookupName: "camerupt" },
  { name: "torkoal", lookupName: "torkoal" },
  { name: "altaria", lookupName: "altaria" },
  { name: "milotic", lookupName: "milotic" },
  { name: "castform", lookupName: "castform" },
  { name: "banette", lookupName: "banette" },
  { name: "chimecho", lookupName: "chimecho" },
  { name: "absol", lookupName: "absol" },
  { name: "glalie", lookupName: "glalie" },
  { name: "torterra", lookupName: "torterra" },
  { name: "infernape", lookupName: "infernape" },
  { name: "empoleon", lookupName: "empoleon" },
  { name: "luxray", lookupName: "luxray" },
  { name: "roserade", lookupName: "roserade" },
  { name: "rampardos", lookupName: "rampardos" },
  { name: "bastiodon", lookupName: "bastiodon" },
  { name: "lopunny", lookupName: "lopunny" },
  { name: "spiritomb", lookupName: "spiritomb" },
  { name: "garchomp", lookupName: "garchomp" },
  { name: "lucario", lookupName: "lucario" },
  { name: "hippowdon", lookupName: "hippowdon" },
  { name: "toxicroak", lookupName: "toxicroak" },
  { name: "abomasnow", lookupName: "abomasnow" },
  { name: "weavile", lookupName: "weavile" },
  { name: "rhyperior", lookupName: "rhyperior" },
  { name: "leafeon", lookupName: "leafeon" },
  { name: "glaceon", lookupName: "glaceon" },
  { name: "gliscor", lookupName: "gliscor" },
  { name: "mamoswine", lookupName: "mamoswine" },
  { name: "gallade", lookupName: "gallade" },
  { name: "froslass", lookupName: "froslass" },
  { name: "rotom", lookupName: "rotom" },
  { name: "rotom-heat", lookupName: "rotomheat" },
  { name: "rotom-wash", lookupName: "rotomwash" },
  { name: "rotom-frost", lookupName: "rotomfrost" },
  { name: "rotom-fan", lookupName: "rotomfan" },
  { name: "rotom-mow", lookupName: "rotommow" },
  { name: "serperior", lookupName: "serperior" },
  { name: "emboar", lookupName: "emboar" },
  { name: "samurott", lookupName: "samurott" },
  { name: "samurott-hisui", lookupName: "samurotthisui" },
  { name: "watchog", lookupName: "watchog" },
  { name: "liepard", lookupName: "liepard" },
  { name: "simisage", lookupName: "simisage" },
  { name: "simisear", lookupName: "simisear" },
  { name: "simipour", lookupName: "simipour" },
  { name: "excadrill", lookupName: "excadrill" },
  { name: "audino", lookupName: "audino" },
  { name: "conkeldurr", lookupName: "conkeldurr" },
  { name: "whimsicott", lookupName: "whimsicott" },
  { name: "krookodile", lookupName: "krookodile" },
  { name: "cofagrigus", lookupName: "cofagrigus" },
  { name: "garbodor", lookupName: "garbodor" },
  { name: "zoroark", lookupName: "zoroark" },
  { name: "zoroark-hisui", lookupName: "zoroarkhisui" },
  { name: "reuniclus", lookupName: "reuniclus" },
  { name: "vanilluxe", lookupName: "vanilluxe" },
  { name: "emolga", lookupName: "emolga" },
  { name: "chandelure", lookupName: "chandelure" },
  { name: "beartic", lookupName: "beartic" },
  { name: "stunfisk", lookupName: "stunfisk" },
  { name: "stunfisk-galar", lookupName: "stunfiskgalar" },
  { name: "golurk", lookupName: "golurk" },
  { name: "hydreigon", lookupName: "hydreigon" },
  { name: "volcarona", lookupName: "volcarona" },
  { name: "chesnaught", lookupName: "chesnaught" },
  { name: "delphox", lookupName: "delphox" },
  { name: "greninja", lookupName: "greninja" },
  { name: "diggersby", lookupName: "diggersby" },
  { name: "talonflame", lookupName: "talonflame" },
  { name: "vivillon", lookupName: "vivillon" },
  { name: "floette", lookupName: "floette" },
  { name: "florges", lookupName: "florges" },
  { name: "pangoro", lookupName: "pangoro" },
  { name: "furfrou", lookupName: "furfrou" },
  { name: "meowstic", lookupName: "meowstic" },
  { name: "aegislash", lookupName: "aegislash" },
  { name: "aromatisse", lookupName: "aromatisse" },
  { name: "slurpuff", lookupName: "slurpuff" },
  { name: "clawitzer", lookupName: "clawitzer" },
  { name: "heliolisk", lookupName: "heliolisk" },
  { name: "tyrantrum", lookupName: "tyrantrum" },
  { name: "aurorus", lookupName: "aurorus" },
  { name: "sylveon", lookupName: "sylveon" },
  { name: "hawlucha", lookupName: "hawlucha" },
  { name: "dedenne", lookupName: "dedenne" },
  { name: "goodra", lookupName: "goodra" },
  { name: "goodra-hisui", lookupName: "goodrahisui" },
  { name: "klefki", lookupName: "klefki" },
  { name: "trevenant", lookupName: "trevenant" },
  { name: "gourgeist", lookupName: "gourgeist" },
  { name: "avalugg", lookupName: "avalugg" },
  { name: "avalugg-hisui", lookupName: "avalugghisui" },
  { name: "noivern", lookupName: "noivern" },
  { name: "decidueye", lookupName: "decidueye" },
  { name: "decidueye-hisui", lookupName: "decidueyehisui" },
  { name: "incineroar", lookupName: "incineroar" },
  { name: "primarina", lookupName: "primarina" },
  { name: "toucannon", lookupName: "toucannon" },
  { name: "crabominable", lookupName: "crabominable" },
  { name: "lycanroc", lookupName: "lycanroc" },
  { name: "lycanroc-midnight", lookupName: "lycanrocmidnight" },
  { name: "lycanroc-dusk", lookupName: "lycanrocdusk" },
  { name: "toxapex", lookupName: "toxapex" },
  { name: "mudsdale", lookupName: "mudsdale" },
  { name: "araquanid", lookupName: "araquanid" },
  { name: "salazzle", lookupName: "salazzle" },
  { name: "tsareena", lookupName: "tsareena" },
  { name: "oranguru", lookupName: "oranguru" },
  { name: "passimian", lookupName: "passimian" },
  { name: "mimikyu", lookupName: "mimikyu" },
  { name: "drampa", lookupName: "drampa" },
  { name: "kommo-o", lookupName: "kommoo" },
  { name: "corviknight", lookupName: "corviknight" },
  { name: "flapple", lookupName: "flapple" },
  { name: "appletun", lookupName: "appletun" },
  { name: "sandaconda", lookupName: "sandaconda" },
  { name: "polteageist", lookupName: "polteageist" },
  { name: "hatterene", lookupName: "hatterene" },
  { name: "mr-rime", lookupName: "mrrime" },
  { name: "runerigus", lookupName: "runerigus" },
  { name: "alcremie", lookupName: "alcremie" },
  { name: "morpeko", lookupName: "morpeko" },
  { name: "dragapult", lookupName: "dragapult" },
  { name: "wyrdeer", lookupName: "wyrdeer" },
  { name: "kleavor", lookupName: "kleavor" },
  { name: "basculegion", lookupName: "basculegion" },
  { name: "basculegion-f", lookupName: "basculegionf" },
  { name: "sneasler", lookupName: "sneasler" },
  { name: "meowscarada", lookupName: "meowscarada" },
  { name: "skeledirge", lookupName: "skeledirge" },
  { name: "quaquaval", lookupName: "quaquaval" },
  { name: "maushold", lookupName: "maushold" },
  { name: "garganacl", lookupName: "garganacl" },
  { name: "armarouge", lookupName: "armarouge" },
  { name: "ceruledge", lookupName: "ceruledge" },
  { name: "bellibolt", lookupName: "bellibolt" },
  { name: "scovillain", lookupName: "scovillain" },
  { name: "espathra", lookupName: "espathra" },
  { name: "tinkaton", lookupName: "tinkaton" },
  { name: "palafin", lookupName: "palafin" },
  { name: "orthworm", lookupName: "orthworm" },
  { name: "glimmora", lookupName: "glimmora" },
  { name: "farigiraf", lookupName: "farigiraf" },
  { name: "kingambit", lookupName: "kingambit" },
  { name: "sinistcha", lookupName: "sinistcha" },
  { name: "archaludon", lookupName: "archaludon" },
  { name: "hydrapple", lookupName: "hydrapple" },
];

const GRAPHQL_URL = "https://graphqlpokemon.favware.tech/v8";

interface GQLResponse {
  data: {
    getPokemon: {
      num: number;
      types: Array<{ name: string }>;
      baseStats: {
        hp: number;
        attack: number;
        defense: number;
        specialattack: number;
        specialdefense: number;
        speed: number;
      };
      abilities: { first: { name: string }; second?: { name: string }; hidden?: { name: string }; special?: { name: string } };
      weight: number;
    };
  };
}

async function fetchPokemon(lookupName: string) {
  const query = `{ getPokemon(pokemon: ${lookupName}) { num types { name } baseStats { hp attack defense specialattack specialdefense speed } abilities { first { name } second { name } hidden { name } } weight } }`;
  const resp = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await resp.json() as GQLResponse | { errors: unknown[]; data?: GQLResponse["data"] };
  if ("errors" in json && json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data!.getPokemon;
}

function toDisplayName(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function main() {
  console.log("Clearing existing pokemon data...");
  await db.delete(pokemonTable);

  console.log(`Seeding ${REG_MA_POKEMON.length} Pokemon...`);

  for (let i = 0; i < REG_MA_POKEMON.length; i++) {
    const { name, lookupName } = REG_MA_POKEMON[i];
    try {
      const poke = await fetchPokemon(lookupName);

      const abilities: string[] = [poke.abilities.first.name];
      if (poke.abilities.second) abilities.push(poke.abilities.second.name);
      if (poke.abilities.hidden) abilities.push(poke.abilities.hidden.name);

      const baseStats = {
        hp: poke.baseStats.hp,
        attack: poke.baseStats.attack,
        defense: poke.baseStats.defense,
        specialAttack: poke.baseStats.specialattack,
        specialDefense: poke.baseStats.specialdefense,
        speed: poke.baseStats.speed,
      };

      await db.insert(pokemonTable).values({
        name,
        dexNumber: poke.num,
        types: poke.types.map((t) => t.name.toLowerCase()),
        baseStats,
        abilities,
        spriteUrl: `https://play.pokemonshowdown.com/sprites/ani/${name}.gif`,
        weightKg: Math.round(poke.weight),
      });

      console.log(`  [${i + 1}/${REG_MA_POKEMON.length}] ${name} (dex #${poke.num})`);
    } catch (err) {
      console.error(`  FAILED ${name} (lookup: ${lookupName}):`, (err as Error).message);
    }

    // Rate limit: small delay between requests
    if (i % 5 === 4) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log("Done seeding Pokemon!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
