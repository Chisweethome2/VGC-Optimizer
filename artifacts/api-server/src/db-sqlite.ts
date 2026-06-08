import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

const sqlite = new Database("vgc-local.db");
sqlite.pragma("journal_mode = WAL");
export const sqliteDb = drizzle(sqlite);

export const movesTable = sqliteTable("moves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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

export const pokemonTable = sqliteTable("pokemon", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  dexNumber: integer("dex_number").notNull(),
  types: text("types", { mode: "json" }).$type<string[]>().notNull(),
  baseStats: text("base_stats", { mode: "json" }).$type<Record<string, number>>().notNull(),
  abilities: text("abilities", { mode: "json" }).$type<string[]>().notNull(),
  spriteUrl: text("sprite_url"),
  weightKg: integer("weight_kg"),
});

export const teamsTable = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  regulation: text("regulation").notNull(),
  description: text("description"),
  slots: text("slots", { mode: "json" }).$type<any[]>().notNull(),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull().default("datetime('now')"),
  updatedAt: text("updated_at").notNull().default("datetime('now')"),
});

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default("datetime('now')"),
});

export const sessionsTable = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  userId: integer("user_id").notNull(),
  createdAt: text("created_at").notNull().default("datetime('now')"),
});

export const naturesTable = sqliteTable("natures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  increasedStat: text("increased_stat"),
  decreasedStat: text("decreased_stat"),
});

export const itemsTable = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  displayName: text("display_name"),
  category: text("category"),
  description: text("description"),
});

export const tournamentEventsTable = sqliteTable("tournament_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  location: text("location"),
  regulation: text("regulation").notNull(),
  date: text("date"),
  usageStats: text("usage_stats", { mode: "json" }).$type<any[]>(),
  createdAt: text("created_at").notNull().default("datetime('now')"),
});

export const tournamentTeamsTable = sqliteTable("tournament_teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventSlug: text("event_slug").notNull(),
  playerName: text("player_name").notNull(),
  placement: text("placement").notNull(),
  placementOrder: integer("placement_order").notNull(),
  pokemon: text("pokemon", { mode: "json" }).$type<string[]>().notNull(),
  pokemonDisplay: text("pokemon_display", { mode: "json" }).$type<string[]>(),
  rentalCode: text("rental_code"),
  createdAt: text("created_at").notNull().default("datetime('now')"),
});

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    power INTEGER,
    accuracy INTEGER,
    pp INTEGER,
    priority INTEGER DEFAULT 0,
    target TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS pokemon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    dex_number INTEGER NOT NULL,
    types TEXT NOT NULL,
    base_stats TEXT NOT NULL,
    abilities TEXT NOT NULL,
    sprite_url TEXT,
    weight_kg INTEGER
  );

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    regulation TEXT NOT NULL,
    description TEXT,
    slots TEXT NOT NULL,
    user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tournament_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    location TEXT,
    regulation TEXT NOT NULL,
    date TEXT,
    usage_stats TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tournament_teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_slug TEXT NOT NULL,
    player_name TEXT NOT NULL,
    placement TEXT NOT NULL,
    placement_order INTEGER NOT NULL,
    pokemon TEXT NOT NULL,
    pokemon_display TEXT,
    rental_code TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS natures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    increased_stat TEXT,
    decreased_stat TEXT
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    category TEXT,
    description TEXT
  );
`);
