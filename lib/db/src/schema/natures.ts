import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const naturesTable = pgTable("natures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  increasedStat: text("increased_stat"),
  decreasedStat: text("decreased_stat"),
});

export type Nature = typeof naturesTable.$inferSelect;
