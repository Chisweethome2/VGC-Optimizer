import { pgTable, serial, text, integer, jsonb } from "drizzle-orm/pg-core";

export const pokemonTable = pgTable("pokemon", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  dexNumber: integer("dex_number").notNull(),
  types: jsonb("types").$type<string[]>().notNull(),
  baseStats: jsonb("base_stats").$type<Record<string, number>>().notNull(),
  abilities: jsonb("abilities").$type<string[]>().notNull(),
  spriteUrl: text("sprite_url"),
  weightKg: integer("weight_kg"),
});

export type Pokemon = typeof pokemonTable.$inferSelect;
