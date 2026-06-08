import { Router } from "express";
import { db, naturesTable, itemsTable, movesTable } from "../lib/db";
import { eq, ilike, and, or } from "drizzle-orm";

const router = Router();

router.get("/natures", async (_req, res) => {
  try {
    const natures = await db.select().from(naturesTable).orderBy(naturesTable.name);
    res.json(natures);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch natures" });
  }
});

router.get("/items", async (req, res) => {
  try {
    const category = req.query["category"] as string | undefined;
    const q = (req.query["q"] as string | undefined)?.toLowerCase().trim();

    const conditions = [];
    if (category) conditions.push(eq(itemsTable.category, category));
    if (q) conditions.push(ilike(itemsTable.displayName, `%${q}%`));

    const items = conditions.length > 0
      ? await db.select().from(itemsTable).where(and(...conditions)).orderBy(itemsTable.displayName)
      : await db.select().from(itemsTable).orderBy(itemsTable.displayName);

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

router.get("/moves", async (req, res) => {
  try {
    const q = (req.query["q"] as string | undefined)?.toLowerCase().trim();
    const type = req.query["type"] as string | undefined;
    const category = req.query["category"] as string | undefined;

    const conditions = [];
    if (q) conditions.push(ilike(movesTable.displayName, `%${q}%`));
    if (type) conditions.push(eq(movesTable.type, type));
    if (category) conditions.push(eq(movesTable.category, category));

    const moves = conditions.length > 0
      ? await db.select().from(movesTable).where(and(...conditions)).orderBy(movesTable.displayName)
      : await db.select().from(movesTable).orderBy(movesTable.displayName);

    res.json(moves);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch moves" });
  }
});

export default router;
