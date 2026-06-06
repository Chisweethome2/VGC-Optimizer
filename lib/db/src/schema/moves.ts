import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const movesTable = pgTable("moves", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  power: integer("power"),
  accuracy: integer("accuracy"),
  pp: integer("pp"),
  priority: integer("priority").default(0),
  target: text("target"),
  description: text("description"),
});

export type Move = typeof movesTable.$inferSelect;
