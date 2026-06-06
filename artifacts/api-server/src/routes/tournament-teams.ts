import { Router } from "express";
import { db, tournamentEventsTable, tournamentTeamsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

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
    .orderBy(asc(tournamentEventsTable.date));
  res.json(events);
});

router.get("/tournament-events/:slug", async (req, res) => {
  const { slug } = req.params;
  const [event] = await db
    .select()
    .from(tournamentEventsTable)
    .where(eq(tournamentEventsTable.slug, slug));
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

export default router;
