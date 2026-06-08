import { Router } from "express";
import { db, pokemonTable } from "../lib/db";
import { ilike, inArray } from "drizzle-orm";
import { eligibleByRegulation, REGULATION_MA_ELIGIBLE } from "./regulations";

const router = Router();

function spriteUrl(dexNumber: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNumber}.png`;
}

function artworkUrl(dexNumber: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`;
}

router.get("/pokemon/search", async (req, res) => {
  try {
    const q = (req.query["q"] as string ?? "").toLowerCase().trim();
    const regulation = req.query["regulation"] as string | undefined;

    if (!q || q.length < 2) {
      res.json([]);
      return;
    }

    const pool: string[] = regulation
      ? (eligibleByRegulation[regulation] ?? REGULATION_MA_ELIGIBLE)
      : REGULATION_MA_ELIGIBLE;

    const nameFilter = pool.filter((n) => n.includes(q)).slice(0, 12);

    if (nameFilter.length === 0) {
      res.json([]);
      return;
    }

    const rows = await db
      .select({
        name: pokemonTable.name,
        dexNumber: pokemonTable.dexNumber,
        types: pokemonTable.types,
      })
      .from(pokemonTable)
      .where(inArray(pokemonTable.name, nameFilter));

    const resultMap = new Map(rows.map((r) => [r.name, r]));
    const results = nameFilter
      .map((n) => {
        const r = resultMap.get(n);
        return r
          ? {
              name: r.name,
              dexNumber: r.dexNumber,
              types: r.types,
              spriteUrl: spriteUrl(r.dexNumber),
              isLegendary: false,
            }
          : null;
      })
      .filter(Boolean);

    res.json(results);
  } catch (err) {
    console.error("Pokemon search error:", err);
    res.status(500).json({ error: "Failed to search Pokemon" });
  }
});

router.get("/pokemon/:name", async (req, res) => {
  try {
    const name = String(req.params.name);

    const rows = await db
      .select()
      .from(pokemonTable)
      .where(ilike(pokemonTable.name, name.toLowerCase()));

    const poke = rows[0];
    if (!poke) {
      res.status(404).json({ error: "Pokemon not found" });
      return;
    }

    res.json({
      name: poke.name,
      dexNumber: poke.dexNumber,
      types: poke.types,
      baseStats: poke.baseStats,
      abilities: poke.abilities,
      spriteUrl: spriteUrl(poke.dexNumber),
      artworkUrl: artworkUrl(poke.dexNumber),
      learnableMoves: [],
      weightKg: poke.weightKg,
    });
  } catch (err) {
    console.error("Pokemon detail error:", err);
    res.status(500).json({ error: "Failed to fetch Pokemon data" });
  }
});

export default router;
