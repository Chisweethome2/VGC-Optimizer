import { Router } from "express";
import { db, teamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

router.get("/teams", async (req, res) => {
  try {
    const teams = await db.select().from(teamsTable).orderBy(teamsTable.updatedAt);
    res.json(
      teams.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list teams");
    res.status(500).json({ error: "Failed to list teams" });
  }
});

router.post("/teams", async (req, res) => {
  try {
    const { name, regulation, description, slots } = req.body;
    if (!name || !regulation || !Array.isArray(slots)) {
      return res.status(400).json({ error: "name, regulation, and slots are required" });
    }
    const [team] = await db
      .insert(teamsTable)
      .values({ name, regulation, description: description ?? null, slots })
      .returning();
    res.status(201).json({
      ...team,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create team");
    res.status(500).json({ error: "Failed to create team" });
  }
});

router.get("/teams/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] ?? "");
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, id));
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json({
      ...team,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get team");
    res.status(500).json({ error: "Failed to get team" });
  }
});

router.put("/teams/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] ?? "");
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const { name, regulation, description, slots } = req.body;
    if (!name || !regulation || !Array.isArray(slots)) {
      return res.status(400).json({ error: "name, regulation, and slots are required" });
    }
    const [team] = await db
      .update(teamsTable)
      .set({ name, regulation, description: description ?? null, slots, updatedAt: new Date() })
      .where(eq(teamsTable.id, id))
      .returning();
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json({
      ...team,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update team");
    res.status(500).json({ error: "Failed to update team" });
  }
});

router.delete("/teams/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] ?? "");
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await db.delete(teamsTable).where(eq(teamsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete team");
    res.status(500).json({ error: "Failed to delete team" });
  }
});

export default router;
