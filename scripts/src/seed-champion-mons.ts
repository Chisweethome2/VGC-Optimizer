import { db, pokemonTable } from "@workspace/db";

const NEW_MONS = [
  { lookup: "zacian", name: "zacian" },
  { lookup: "calyrexshadow", name: "calyrex-shadow" },
  { lookup: "tapufini", name: "tapu-fini" },
  { lookup: "indeedeef", name: "indeedee-f" },
  { lookup: "landorustherian", name: "landorus-therian" },
  { lookup: "urshifurapidstrike", name: "urshifu-rapid" },
  { lookup: "metagross", name: "metagross" },
  { lookup: "gastrodon", name: "gastrodon" },
  { lookup: "pachirisu", name: "pachirisu" },
  { lookup: "amoonguss", name: "amoonguss" },
];

async function main() {
  for (const { lookup, name } of NEW_MONS) {
    const query = `{ getPokemon(pokemon: ${lookup}) { num types { name } baseStats { hp attack defense specialattack specialdefense speed } abilities { first { name } second { name } hidden { name } } weight } }`;
    const resp = await fetch("https://graphqlpokemon.favware.tech/v8", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await resp.json() as any;
    if (!json.data?.getPokemon) {
      console.log("FAIL:", name, JSON.stringify(json.errors || "unknown"));
      continue;
    }
    const poke = json.data.getPokemon;
    const abilities: string[] = [poke.abilities.first.name];
    if (poke.abilities.second) abilities.push(poke.abilities.second.name);
    if (poke.abilities.hidden) abilities.push(poke.abilities.hidden.name);

    const baseStats = {
      hp: poke.baseStats.hp, attack: poke.baseStats.attack, defense: poke.baseStats.defense,
      specialAttack: poke.baseStats.specialattack, specialDefense: poke.baseStats.specialdefense, speed: poke.baseStats.speed,
    };

    try {
      await db.insert(pokemonTable).values({
        name, dexNumber: poke.num, types: poke.types.map((t: any) => t.name.toLowerCase()),
        baseStats, abilities,
        spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + poke.num + ".png",
        weightKg: Math.round(poke.weight),
      });
      console.log("OK:", name, "#" + poke.num);
    } catch(e: any) { console.log("SKIP:", name, e.message.slice(0, 60)); }
  }
  console.log("Done!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
