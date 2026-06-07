import { Router } from "express";
import { db, teamsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth";
import { logger } from "../lib/logger";

const router = Router();

function userId(req: any): number | null {
  return req.user?.id ?? null;
}

router.get("/teams", requireAuth, async (req, res) => {
  try {
    const uid = userId(req);
    if (uid == null) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const teams = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.userId, uid))
      .orderBy(teamsTable.updatedAt);
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

router.post("/teams", requireAuth, async (req, res) => {
  try {
    const { name, regulation, description, slots } = req.body;
    if (!name || !regulation || !Array.isArray(slots)) {
      res.status(400).json({ error: "name, regulation, and slots are required" });
      return;
    }
    const uid = userId(req);
    const [team] = await db
      .insert(teamsTable)
      .values({ name, regulation, description: description ?? null, slots, userId: uid })
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

router.get("/teams/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const uid = userId(req);
    if (uid == null) { res.status(401).json({ error: "Not authenticated" }); return; }
    const [team] = await db.select().from(teamsTable).where(and(eq(teamsTable.id, id), eq(teamsTable.userId, uid)));
    if (!team) { res.status(404).json({ error: "Team not found" }); return; }
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

router.put("/teams/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const uid = userId(req);
    if (uid == null) { res.status(401).json({ error: "Not authenticated" }); return; }
    const { name, regulation, description, slots } = req.body;
    if (!name || !regulation || !Array.isArray(slots)) {
      res.status(400).json({ error: "name, regulation, and slots are required" });
      return;
    }
    const [team] = await db
      .update(teamsTable)
      .set({ name, regulation, description: description ?? null, slots, updatedAt: new Date() })
      .where(and(eq(teamsTable.id, id), eq(teamsTable.userId, uid)))
      .returning();
    if (!team) { res.status(404).json({ error: "Team not found" }); return; }
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

router.delete("/teams/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const uid = userId(req);
    if (uid == null) { res.status(401).json({ error: "Not authenticated" }); return; }
    await db.delete(teamsTable).where(and(eq(teamsTable.id, id), eq(teamsTable.userId, uid)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete team");
    res.status(500).json({ error: "Failed to delete team" });
  }
});

export default router;
