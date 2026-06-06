import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const statSpreadSchema = z.object({
  hp: z.number().optional(),
  attack: z.number().optional(),
  defense: z.number().optional(),
  specialAttack: z.number().optional(),
  specialDefense: z.number().optional(),
  speed: z.number().optional(),
});

const teamSlotSchema = z.object({
  slot: z.number(),
  pokemonName: z.string(),
  moves: z.array(z.string()).max(4),
  ability: z.string(),
  item: z.string(),
  nature: z.string(),
  teraType: z.string(),
  evs: statSpreadSchema.optional(),
  ivs: statSpreadSchema.optional(),
});

export const teamsTable = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  regulation: text("regulation").notNull(),
  description: text("description"),
  slots: jsonb("slots").notNull().$type<z.infer<typeof teamSlotSchema>[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTeamSchema = createInsertSchema(teamsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teamsTable.$inferSelect;
export { teamSlotSchema, statSpreadSchema };
