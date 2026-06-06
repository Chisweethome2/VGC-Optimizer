import { db, tournamentEventsTable, tournamentTeamsTable } from "@workspace/db";

// ── Dex number → { apiName, displayName } ────────────────────────────────────
const DEX_MAP: Record<string, { api: string; display: string }> = {
  "0003":           { api: "venusaur",          display: "Venusaur" },
  "0006-mega-x":    { api: "charizard",          display: "Mega Charizard X" },
  "0006-mega-y":    { api: "charizard",          display: "Mega Charizard Y" },
  "0009-mega":      { api: "blastoise",          display: "Mega Blastoise" },
  "0036":           { api: "clefable",           display: "Clefable" },
  "0038-alola":     { api: "ninetales-alola",    display: "Alolan Ninetales" },
  "0059-hisui":     { api: "arcanine-hisui",     display: "Hisuian Arcanine" },
  "0094":           { api: "gengar",             display: "Gengar" },
  "0094-mega":      { api: "gengar",             display: "Mega Gengar" },
  "0115-mega":      { api: "kangaskhan",         display: "Mega Kangaskhan" },
  "0130-mega":      { api: "gyarados",           display: "Mega Gyarados" },
  "0130":           { api: "gyarados",           display: "Gyarados" },
  "0142":           { api: "aerodactyl",         display: "Aerodactyl" },
  "0142-mega":      { api: "aerodactyl",         display: "Mega Aerodactyl" },
  "0149":           { api: "dragonite",          display: "Dragonite" },
  "0149-mega":      { api: "dragonite",          display: "Mega Dragonite" },
  "0186":           { api: "politoed",           display: "Politoed" },
  "0208-mega":      { api: "steelix",            display: "Mega Steelix" },
  "0212-mega":      { api: "scizor",             display: "Mega Scizor" },
  "0227-mega":      { api: "skarmory",           display: "Mega Skarmory" },
  "0248":           { api: "tyranitar",          display: "Tyranitar" },
  "0248-mega":      { api: "tyranitar",          display: "Mega Tyranitar" },
  "0279":           { api: "pelipper",           display: "Pelipper" },
  "0282-mega":      { api: "gardevoir",          display: "Mega Gardevoir" },
  "0302":           { api: "sableye",            display: "Sableye" },
  "0310-mega":      { api: "manectric",          display: "Mega Manectric" },
  "0324":           { api: "torkoal",            display: "Torkoal" },
  "0350":           { api: "milotic",            display: "Milotic" },
  "0445":           { api: "garchomp",           display: "Garchomp" },
  "0445-mega":      { api: "garchomp",           display: "Mega Garchomp" },
  "0455":           { api: "carnivine",          display: "Carnivine" },
  "0478-mega":      { api: "froslass",           display: "Mega Froslass" },
  "0479-wash":      { api: "rotom-wash",         display: "Wash Rotom" },
  "0503-hisui":     { api: "samurott-hisui",     display: "Hisuian Samurott" },
  "0530":           { api: "excadrill",          display: "Excadrill" },
  "0547":           { api: "whimsicott",         display: "Whimsicott" },
  "0635":           { api: "hydreigon",          display: "Hydreigon" },
  "0637":           { api: "volcarona",          display: "Volcarona" },
  "0655-mega":      { api: "delphox",            display: "Mega Delphox" },
  "0663":           { api: "talonflame",         display: "Talonflame" },
  "0666":           { api: "vivillon",           display: "Vivillon" },
  "0666-garden":    { api: "vivillon",           display: "Vivillon (Garden)" },
  "0666-fancy":     { api: "vivillon",           display: "Vivillon (Fancy)" },
  "0670-mega":      { api: "floette",            display: "Mega Floette (Eternal)" },
  "0670-eternal":   { api: "floette",            display: "Floette (Eternal)" },
  "0681":           { api: "aegislash",          display: "Aegislash" },
  "0700":           { api: "sylveon",            display: "Sylveon" },
  "0727":           { api: "incineroar",         display: "Incineroar" },
  "0730":           { api: "primarina",          display: "Primarina" },
  "0778":           { api: "mimikyu",            display: "Mimikyu" },
  "0784":           { api: "kommo-o",            display: "Kommo-o" },
  "0823":           { api: "corviknight",        display: "Corviknight" },
  "0900":           { api: "kleavor",            display: "Kleavor" },
  "0902":           { api: "basculegion",        display: "Basculegion" },
  "0903":           { api: "sneasler",           display: "Sneasler" },
  "0925":           { api: "maushold",           display: "Maushold" },
  "0925-three":     { api: "maushold",           display: "Maushold (Three)" },
  "0937":           { api: "ceruledge",          display: "Ceruledge" },
  "0952-mega":      { api: "scovillain",         display: "Mega Scovillain" },
  "0956":           { api: "espathra",           display: "Espathra" },
  "0959":           { api: "tinkaton",           display: "Tinkaton" },
  "0964-hero":      { api: "palafin",            display: "Palafin-Hero" },
  "0970":           { api: "glimmora",           display: "Glimmora" },
  "0981":           { api: "farigiraf",          display: "Farigiraf" },
  "0983":           { api: "kingambit",          display: "Kingambit" },
  "1013":           { api: "sinistcha",          display: "Sinistcha" },
  "1018":           { api: "archaludon",         display: "Archaludon" },
};

function parseTeam(raw: string): { api: string[]; display: string[] } {
  const tokens = raw.match(/:([^:]+):/g) ?? [];
  const api: string[] = [];
  const display: string[] = [];
  for (const t of tokens) {
    const key = t.replace(/:/g, "");
    const entry = DEX_MAP[key];
    if (entry) {
      api.push(entry.api);
      display.push(entry.display);
    } else {
      api.push(key);
      display.push(key);
    }
  }
  return { api, display };
}

const EVENT_SLUG = "indy-regionals-2026";

type TeamRow = {
  placement: string;
  placementOrder: number;
  playerName: string;
  rawTeam: string;
  rentalCode?: string;
};

const TEAMS: TeamRow[] = [
  // ── Top 1 ──────────────────────────────────────────────────────────────────
  { placement: "1st", placementOrder: 1,  playerName: "Arsal Puri",        rawTeam: ":0670-mega::0006-mega-y::0003::1013::0727::0445:" },
  // ── Top 2 ──────────────────────────────────────────────────────────────────
  { placement: "2nd", placementOrder: 2,  playerName: "Wolfe Glick",       rawTeam: ":0248-mega::0208-mega::1013::0903::0663::0479-wash:" },
  // ── Top 4 ──────────────────────────────────────────────────────────────────
  { placement: "Top 4", placementOrder: 3, playerName: "Michael Zhang",    rawTeam: ":0478-mega::0248-mega::0823::0635::0445::0059-hisui:" },
  { placement: "Top 4", placementOrder: 4, playerName: "Nick Navarre",     rawTeam: ":0670-mega::0983::0964-hero::0903::0727::0663:" },
  // ── Top 8 ──────────────────────────────────────────────────────────────────
  { placement: "Top 8", placementOrder: 5, playerName: "Evan Scott",       rawTeam: ":0478-mega::0970::0823::0727::0547::0445:" },
  { placement: "Top 8", placementOrder: 6, playerName: "Alex Underhill",   rawTeam: ":0478-mega::0149-mega::0983::0903::0902::0445:" },
  { placement: "Top 8", placementOrder: 7, playerName: "MJ Rogers",        rawTeam: ":0445-mega::0006-mega-y::0981::0727::0700::0142:", rentalCode: "408G4 NJ09W" },
  { placement: "Top 8", placementOrder: 8, playerName: "William Brown",    rawTeam: ":0952-mega::0149-mega::1018::0956::0903::0186:", rentalCode: "A3AEM 9TLPP" },
  // ── Top 16 ─────────────────────────────────────────────────────────────────
  { placement: "Top 16", placementOrder: 9,  playerName: "Nathaniel Sitler",  rawTeam: ":0670-mega::0130-mega::1013::0903::0727::0445:" },
  { placement: "Top 16", placementOrder: 10, playerName: "Brendan DeWerth",   rawTeam: ":0248-mega::0823::0778::0635::0530::0479-wash:" },
  { placement: "Top 16", placementOrder: 11, playerName: "Chase Thompson",    rawTeam: ":0248-mega::1013::0823::0784::0530::0130:" },
  { placement: "Top 16", placementOrder: 12, playerName: "Collin Heier",      rawTeam: ":0478-mega::0149-mega::0983::0964-hero::0903::0445:" },
  { placement: "Top 16", placementOrder: 13, playerName: "Christopher Han",   rawTeam: ":0006-mega-y::0983::0903::0902::0547::0445:" },
  { placement: "Top 16", placementOrder: 14, playerName: "Noah Gardner",      rawTeam: ":0670-mega::0983::0903::0902::0925::0727:" },
  { placement: "Top 16", placementOrder: 15, playerName: "AJ Morton",         rawTeam: ":0670-mega::0006-mega-x::1013::0983::0903::0727:" },
  { placement: "Top 16", placementOrder: 16, playerName: "Patrick Dillon",    rawTeam: ":0670-mega::0248-mega::1013::0727::0530::0479-wash:" },
  // ── Top 32 ─────────────────────────────────────────────────────────────────
  { placement: "Top 32", placementOrder: 17, playerName: "Stephen Brown",     rawTeam: ":0006-mega-y::0981::0727::0700::0445::0142:" },
  { placement: "Top 32", placementOrder: 18, playerName: "Joel S.",            rawTeam: ":0952-mega::0142-mega::0983::0902::0700::0445:" },
  { placement: "Top 32", placementOrder: 19, playerName: "Jeremy Barnes",     rawTeam: ":0115-mega::0009-mega::0981::0902::0666::0324:" },
  { placement: "Top 32", placementOrder: 20, playerName: "Joshua Lorcy",      rawTeam: ":0670-mega::0655-mega::1013::0903::0902::0727:" },
  { placement: "Top 32", placementOrder: 21, playerName: "Siddharth Singhal", rawTeam: ":0670-mega::0006-mega-y::0003::1013::0727::0445:" },
  { placement: "Top 32", placementOrder: 22, playerName: "Paul Chua",         rawTeam: ":0142-mega::0006-mega-y::0983::0902::0700::0445:" },
  { placement: "Top 32", placementOrder: 23, playerName: "Dominic Vogel",     rawTeam: ":0006-mega-y::0983::0903::0902::0547::0445:" },
  { placement: "Top 32", placementOrder: 24, playerName: "Nicholas Donnelly", rawTeam: ":0670-mega::0655-mega::1013::0925::0902::0727:" },
  { placement: "Top 32", placementOrder: 25, playerName: "Andrew Ding",       rawTeam: ":0670-mega::0142-mega::0983::0964-hero::0903::0727:" },
  { placement: "Top 32", placementOrder: 26, playerName: "Alyssa Smith",      rawTeam: ":0006-mega-y::0983::0970::0902::0547::0445:" },
  { placement: "Top 32", placementOrder: 27, playerName: "Raghav Malaviya",   rawTeam: ":0478-mega::0149-mega::0983::0903::0902::0445:" },
  { placement: "Top 32", placementOrder: 28, playerName: "Giovanni Cischke",  rawTeam: ":0142-mega::0006-mega-y::0983::0902::0700::0445:" },
  { placement: "Top 32", placementOrder: 29, playerName: "Montana Mott",      rawTeam: ":0149-mega::0006-mega-y::0983::0902::0547::0445:" },
  { placement: "Top 32", placementOrder: 30, playerName: "Norah Bowman",      rawTeam: ":0142-mega::0115-mega::0981::0902::0700::0324:" },
  { placement: "Top 32", placementOrder: 31, playerName: "Tyler Coleman",     rawTeam: ":0094-mega::1013::0959::0784::0727::0186:" },
  { placement: "Top 32", placementOrder: 32, playerName: "Aaron Perez",       rawTeam: ":0115-mega::0983::0981::0700::0666::0445:" },
  // ── Top 64 ─────────────────────────────────────────────────────────────────
  { placement: "Top 64", placementOrder: 33, playerName: "Zachary Carlson",   rawTeam: ":0149-mega::0006-mega-y::0983::0902::0547::0445:" },
  { placement: "Top 64", placementOrder: 34, playerName: "Justin Knox",       rawTeam: ":0670-mega::0006-mega-y::0983::0900::0547::0445:" },
  { placement: "Top 64", placementOrder: 35, playerName: "Pranav Sharma",     rawTeam: ":0149-mega::1018::0983::0903::0902::0279:" },
  { placement: "Top 64", placementOrder: 36, playerName: "Richard Wan",       rawTeam: ":0478-mega::0142-mega::0983::0903::0902::0445:" },
  { placement: "Top 64", placementOrder: 37, playerName: "Jeffrey Lehmann",   rawTeam: ":0670-mega::0655-mega::1013::0925::0902::0727:" },
  { placement: "Top 64", placementOrder: 38, playerName: "Rishi Gupta",       rawTeam: ":0142-mega::0094-mega::0983::0903::0727::0666:" },
  { placement: "Top 64", placementOrder: 39, playerName: "Kenneth Lin",       rawTeam: ":0142-mega::0006-mega-y::0983::0902::0700::0445:" },
  { placement: "Top 64", placementOrder: 40, playerName: "Daniel Mandeville", rawTeam: ":0006-mega-y::0981::0727::0700::0445::0142:" },
  { placement: "Top 64", placementOrder: 41, playerName: "Brian Jens",        rawTeam: ":0670-mega::0006-mega-x::1013::0983::0903::0727:" },
  { placement: "Top 64", placementOrder: 42, playerName: "Adrian Hazel",      rawTeam: ":0670-mega::0006-mega-y::1013::0727::0681::0445:" },
  { placement: "Top 64", placementOrder: 43, playerName: "Kevin Swastek",     rawTeam: ":0670-mega::0981::0902::0635::0547::0248:" },
  { placement: "Top 64", placementOrder: 44, playerName: "Yuki Zaninovich",   rawTeam: ":0670-mega::1018::0902::0666::0663::0302:" },
  { placement: "Top 64", placementOrder: 45, playerName: "Adit Selvaraj",     rawTeam: ":0478-mega::0983::0903::0902::0547::0059-hisui:" },
  { placement: "Top 64", placementOrder: 46, playerName: "Ezequiel Cordero",  rawTeam: ":0670-mega::0006-mega-y::0983::0902::0547::0445:" },
  { placement: "Top 64", placementOrder: 47, playerName: "Henry Rich",        rawTeam: ":0282-mega::0983::0925::0902::0663::0445:" },
  { placement: "Top 64", placementOrder: 48, playerName: "Aidan Patterson",   rawTeam: ":0006-mega-y::0983::0903::0902::0900::0547:" },
  { placement: "Top 64", placementOrder: 49, playerName: "Thomas Gravouille", rawTeam: ":0282-mega::1018::0925::0902::0455::0279:" },
  { placement: "Top 64", placementOrder: 50, playerName: "Chris Millard",     rawTeam: ":0670-mega::1013::0727::0681::0637::0445:" },
  { placement: "Top 64", placementOrder: 51, playerName: "Sierra Elsbecker",  rawTeam: ":0310-mega::0006-mega-y::1013::0983::0730::0445:" },
  { placement: "Top 64", placementOrder: 52, playerName: "Andrew Block",      rawTeam: ":0670-mega::1018::0956::0902::0681::0279:", rentalCode: "3F8J5 TV5GT" },
  { placement: "Top 64", placementOrder: 53, playerName: "Everett Filloon",   rawTeam: ":0149-mega::0006-mega-y::0983::0902::0547::0445:" },
  { placement: "Top 64", placementOrder: 54, playerName: "Samuel Kidane",     rawTeam: ":0212-mega::0149-mega::1018::0903::0902::0279:" },
  { placement: "Top 64", placementOrder: 55, playerName: "David Rosemon",     rawTeam: ":0006-mega-y::0981::0727::0700::0445::0142:" },
  { placement: "Top 64", placementOrder: 56, playerName: "Chandler Brtek",    rawTeam: ":0248-mega::0823::0778::0635::0530::0479-wash:" },
  { placement: "Top 64", placementOrder: 57, playerName: "Ryan Loseto",       rawTeam: ":0006-mega-y::0983::0903::0902::0547::0445:" },
  { placement: "Top 64", placementOrder: 58, playerName: "Shiliang Tang",     rawTeam: ":0670-mega::0142-mega::0983::0964-hero::0903::0727:" },
  { placement: "Top 64", placementOrder: 59, playerName: "William Marks",     rawTeam: ":0670-mega::0227-mega::0903::0902::0727::0547:" },
  { placement: "Top 64", placementOrder: 60, playerName: "Toler Webb",        rawTeam: ":0282-mega::0983::0925-three::0902::0663::0445:" },
  { placement: "Top 64", placementOrder: 61, playerName: "Logan Castro",      rawTeam: ":0670-mega::0006-mega-y::1013::0727::0681::0445:" },
  { placement: "Top 64", placementOrder: 62, playerName: "Dawei Si",          rawTeam: ":0670-mega::1013::0937::0727::0666-garden::0350:" },
  { placement: "Top 64", placementOrder: 63, playerName: "Steven Gillespie",  rawTeam: ":0952-mega::1018::0956::0727::0700::0186:" },
  { placement: "Top 64", placementOrder: 64, playerName: "Kylan Van Severen", rawTeam: ":0670-mega::0006-mega-y::0983::0902::0547::0445:" },
];

const USAGE_STATS = [
  { rank: 1,  pokemon: "basculegion",    pokemonDisplay: "Basculegion",       phase1Pct: 50.3, phase2Pct: 59.3 },
  { rank: 2,  pokemon: "kingambit",      pokemonDisplay: "Kingambit",         phase1Pct: 48.2, phase2Pct: 60.7 },
  { rank: 3,  pokemon: "garchomp",       pokemonDisplay: "Garchomp",          phase1Pct: 44.7, phase2Pct: 58.6 },
  { rank: 4,  pokemon: "charizard",      pokemonDisplay: "Charizard",         phase1Pct: 34.8, phase2Pct: 42.8 },
  { rank: 5,  pokemon: "sneasler",       pokemonDisplay: "Sneasler",          phase1Pct: 33.0, phase2Pct: 27.6 },
  { rank: 6,  pokemon: "whimsicott",     pokemonDisplay: "Whimsicott",        phase1Pct: 27.0, phase2Pct: 29.0 },
  { rank: 7,  pokemon: "incineroar",     pokemonDisplay: "Incineroar",        phase1Pct: 26.4, phase2Pct: 31.7 },
  { rank: 8,  pokemon: "aerodactyl",     pokemonDisplay: "Aerodactyl",        phase1Pct: 22.5, phase2Pct: 20.7 },
  { rank: 9,  pokemon: "floette",        pokemonDisplay: "Floette (Eternal)", phase1Pct: 21.1, phase2Pct: 34.5 },
  { rank: 10, pokemon: "sylveon",        pokemonDisplay: "Sylveon",           phase1Pct: 16.3, phase2Pct: 16.6 },
  { rank: 11, pokemon: "glimmora",       pokemonDisplay: "Glimmora",          phase1Pct: 15.0, phase2Pct: 14.5 },
  { rank: 12, pokemon: "farigiraf",      pokemonDisplay: "Farigiraf",         phase1Pct: 14.4, phase2Pct: 14.5 },
  { rank: 13, pokemon: "sinistcha",      pokemonDisplay: "Sinistcha",         phase1Pct: 14.4, phase2Pct: 16.6 },
  { rank: 14, pokemon: "dragonite",      pokemonDisplay: "Dragonite",         phase1Pct: 14.4, phase2Pct: 14.5 },
];

async function seed() {
  console.log("Seeding Indy Regionals 2026 event...");
  await db
    .insert(tournamentEventsTable)
    .values({
      slug: EVENT_SLUG,
      name: "Indy Regionals 2026",
      location: "Indianapolis, IN",
      regulation: "reg-ma",
      date: "2026-05-31",
      usageStats: USAGE_STATS,
    })
    .onConflictDoNothing();
  console.log("Event seeded.");

  console.log(`Seeding ${TEAMS.length} teams...`);
  const rows = TEAMS.map((t) => {
    const parsed = parseTeam(t.rawTeam);
    return {
      eventSlug: EVENT_SLUG,
      playerName: t.playerName,
      placement: t.placement,
      placementOrder: t.placementOrder,
      pokemon: parsed.api,
      pokemonDisplay: parsed.display,
      rentalCode: t.rentalCode ?? null,
    };
  });

  await db.insert(tournamentTeamsTable).values(rows).onConflictDoNothing();
  console.log(`Seeded ${rows.length} teams.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
