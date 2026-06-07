import { Router } from "express";
import { db, tournamentEventsTable, tournamentTeamsTable } from "@workspace/db";
import { eq, asc, desc } from "drizzle-orm";

const router = Router();

router.get("/tournament-teams", async (req, res) => {
  const { event } = req.query as { event?: string };
  const query = db
    .select()
    .from(tournamentTeamsTable)
    .orderBy(asc(tournamentTeamsTable.placementOrder));

  const teams = event
    ? await db
        .select()
        .from(tournamentTeamsTable)
        .where(eq(tournamentTeamsTable.eventSlug, event))
        .orderBy(asc(tournamentTeamsTable.placementOrder))
    : await query;

  res.json(teams);
});

router.get("/tournament-events", async (_req, res) => {
  const events = await db
    .select()
    .from(tournamentEventsTable)
    .orderBy(desc(tournamentEventsTable.date));
  res.json(events);
});

router.get("/tournament-events/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const [event] = await db
      .select()
      .from(tournamentEventsTable)
      .where(eq(tournamentEventsTable.slug, slug));
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }
    res.json(event);
  } catch (err) {
    console.error("Tournament event error:", err);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
