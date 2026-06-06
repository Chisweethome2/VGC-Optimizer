import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  effect: text("effect"),
  spriteUrl: text("sprite_url"),
  megaFor: text("mega_for"),
});

export type Item = typeof itemsTable.$inferSelect;
