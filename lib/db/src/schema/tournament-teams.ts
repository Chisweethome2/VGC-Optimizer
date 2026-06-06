import { pgTable, serial, text, integer, timestamp, jsonb, real } from "drizzle-orm/pg-core";

export const tournamentEventsTable = pgTable("tournament_events", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  location: text("location"),
  regulation: text("regulation").notNull(),
  date: text("date"),
  usageStats: jsonb("usage_stats").$type<UsageStat[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tournamentTeamsTable = pgTable("tournament_teams", {
  id: serial("id").primaryKey(),
  eventSlug: text("event_slug").notNull(),
  playerName: text("player_name").notNull(),
  placement: text("placement").notNull(),
  placementOrder: integer("placement_order").notNull(),
  pokemon: jsonb("pokemon").notNull().$type<string[]>(),
  pokemonDisplay: jsonb("pokemon_display").$type<string[]>(),
  rentalCode: text("rental_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface UsageStat {
  rank: number;
  pokemon: string;
  pokemonDisplay: string;
  phase1Pct: number;
  phase2Pct: number | null;
}

export type TournamentEvent = typeof tournamentEventsTable.$inferSelect;
export type TournamentTeam = typeof tournamentTeamsTable.$inferSelect;
