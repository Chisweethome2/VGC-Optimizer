import Database from "better-sqlite3";

const db = new Database("vgc-local.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS natures (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, increased_stat TEXT, decreased_stat TEXT);
  CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, display_name TEXT, category TEXT, description TEXT);
  CREATE TABLE IF NOT EXISTS pokemon (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, dex_number INTEGER NOT NULL, types TEXT NOT NULL, base_stats TEXT NOT NULL, abilities TEXT NOT NULL, sprite_url TEXT, weight_kg INTEGER);
  CREATE TABLE IF NOT EXISTS moves (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, type TEXT NOT NULL, category TEXT NOT NULL, power INTEGER, accuracy INTEGER, pp INTEGER, priority INTEGER DEFAULT 0, target TEXT, description TEXT);
  CREATE TABLE IF NOT EXISTS teams (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, regulation TEXT NOT NULL, description TEXT, slots TEXT NOT NULL, user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE, user_id INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS tournament_events (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, location TEXT, regulation TEXT NOT NULL, date TEXT, usage_stats TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS tournament_teams (id INTEGER PRIMARY KEY AUTOINCREMENT, event_slug TEXT NOT NULL, player_name TEXT NOT NULL, placement TEXT NOT NULL, placement_order INTEGER NOT NULL, pokemon TEXT NOT NULL, pokemon_display TEXT, rental_code TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
`);

const count = db.prepare("SELECT COUNT(*) as c FROM natures").get();
if (count.c === 0) {
  const natures = ['Adamant','Bashful','Bold','Brave','Calm','Careful','Docile','Gentle','Hardy','Hasty','Impish','Jolly','Lax','Lonely','Mild','Modest','Naive','Naughty','Quiet','Quirky','Rash','Relaxed','Sassy','Serious','Timid'];
  const items = ['Sitrus Berry','Life Orb','Focus Sash','Choice Band','Choice Scarf','Choice Specs','Assault Vest','Leftovers','Weakness Policy','Rocky Helmet','Occa Berry','Rindo Berry','Flame Orb','Rusted Sword'];
  const stmtN = db.prepare('INSERT OR IGNORE INTO natures (name) VALUES (?)');
  const stmtI = db.prepare('INSERT OR IGNORE INTO items (name, display_name) VALUES (?, ?)');
  natures.forEach(n => stmtN.run(n));
  items.forEach(i => stmtI.run(i, i));
  
  const pokemon = [
    ['incineroar', 727, '["fire","dark"]', '{"hp":95,"attack":115,"defense":90,"specialAttack":80,"specialDefense":90,"speed":60}', '["Intimidate"]'],
    ['rillaboom', 812, '["grass"]', '{"hp":100,"attack":125,"defense":90,"specialAttack":60,"specialDefense":70,"speed":85}', '["Grassy Surge"]'],
    ['indeedee-f', 876, '["psychic","normal"]', '{"hp":70,"attack":55,"defense":65,"specialAttack":95,"specialDefense":105,"speed":85}', '["Psychic Surge"]'],
    ['charizard', 6, '["fire","flying"]', '{"hp":78,"attack":84,"defense":78,"specialAttack":109,"specialDefense":85,"speed":100}', '["Solar Power"]'],
    ['tapu-fini', 788, '["water","fairy"]', '{"hp":70,"attack":75,"defense":115,"specialAttack":95,"specialDefense":130,"speed":85}', '["Misty Surge"]'],
    ['amoonguss', 591, '["grass","poison"]', '{"hp":114,"attack":85,"defense":70,"specialAttack":85,"specialDefense":80,"speed":30}', '["Regenerator"]'],
    ['tyranitar', 248, '["rock","dark"]', '{"hp":100,"attack":134,"defense":110,"specialAttack":95,"specialDefense":100,"speed":61}', '["Sand Stream"]'],
    ['pachirisu', 417, '["electric"]', '{"hp":60,"attack":45,"defense":70,"specialAttack":45,"specialDefense":90,"speed":95}', '["Volt Absorb"]'],
    ['garchomp', 445, '["dragon","ground"]', '{"hp":108,"attack":130,"defense":95,"specialAttack":80,"specialDefense":85,"speed":102}', '["Rough Skin"]'],
    ['hydreigon', 635, '["dark","dragon"]', '{"hp":92,"attack":105,"defense":90,"specialAttack":125,"specialDefense":90,"speed":98}', '["Levitate"]'],
    ['metagross', 376, '["steel","psychic"]', '{"hp":80,"attack":135,"defense":130,"specialAttack":95,"specialDefense":90,"speed":70}', '["Clear Body"]'],
    ['rotom-wash', 479, '["electric","water"]', '{"hp":50,"attack":65,"defense":107,"specialAttack":105,"specialDefense":107,"speed":86}', '["Levitate"]'],
  ];
  const stmtP = db.prepare('INSERT OR IGNORE INTO pokemon (name, dex_number, types, base_stats, abilities) VALUES (?, ?, ?, ?, ?)');
  pokemon.forEach(p => stmtP.run(p[0], p[1], p[2], p[3], p[4]));

  const moves = [
    ['flare-blitz','Flare Blitz','fire','physical',120,100,15,0],['knock-off','Knock Off','dark','physical',65,100,20,0],
    ['fake-out','Fake Out','normal','physical',40,100,10,3],['parting-shot','Parting Shot','dark','status',null,100,20,0],
    ['protect','Protect','normal','status',null,null,10,4],['follow-me','Follow Me','normal','status',null,null,20,2],
    ['tailwind','Tailwind','flying','status',null,null,15,0],['trick-room','Trick Room','psychic','status',null,null,5,-7],
    ['earthquake','Earthquake','ground','physical',100,100,10,0],['rock-slide','Rock Slide','rock','physical',75,90,10,0],
    ['spore','Spore','grass','status',null,100,15,0],['rage-powder','Rage Powder','bug','status',null,null,20,2],
    ['will-o-wisp','Will-O-Wisp','fire','status',null,85,15,0],['perish-song','Perish Song','normal','status',null,null,5,0],
    ['thunder-wave','Thunder Wave','electric','status',null,90,20,0],['draco-meteor','Draco Meteor','dragon','special',130,90,5,0],
    ['u-turn','U-turn','bug','physical',70,100,20,0],['volt-switch','Volt Switch','electric','special',70,100,20,0],
    ['nuzzle','Nuzzle','electric','physical',20,100,20,0],['swords-dance','Swords Dance','normal','status',null,null,20,0],
  ];
  const stmtM = db.prepare('INSERT OR IGNORE INTO moves (name, display_name, type, category, power, accuracy, pp, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  moves.forEach(m => stmtM.run(m[0],m[1],m[2],m[3],m[4],m[5],m[6],m[7]));

  console.log(`Seeded ${natures.length} natures, ${items.length} items, ${pokemon.length} pokemon, ${moves.length} moves`);
}

// Seed tournament data
const eventCount = db.prepare("SELECT COUNT(*) as c FROM tournament_events").get();
if (eventCount.c === 0) {
  // Turin Special Championships
  db.prepare("INSERT INTO tournament_events (slug,name,location,regulation,date,usage_stats) VALUES (?,?,?,?,?,?)").run(
    "turin-special-2026","Turin Special Championships","Turin, Italy","Regulation Set M-A","2026-06-07",
    JSON.stringify([{rank:1,pokemon:"basculegion",pokemonDisplay:"Basculegion (M)",phase1Pct:51.7,phase2Pct:54.8},{rank:2,pokemon:"garchomp",pokemonDisplay:"Garchomp",phase1Pct:49.1,phase2Pct:51.9},{rank:3,pokemon:"kingambit",pokemonDisplay:"Kingambit",phase1Pct:44.4,phase2Pct:62.2},{rank:4,pokemon:"charizard",pokemonDisplay:"Charizard",phase1Pct:39.6,phase2Pct:43.7},{rank:5,pokemon:"sneasler",pokemonDisplay:"Sneasler",phase1Pct:35.7,phase2Pct:34.1},{rank:6,pokemon:"incineroar",pokemonDisplay:"Incineroar",phase1Pct:34.8,phase2Pct:43.7},{rank:7,pokemon:"floette",pokemonDisplay:"Floette (Eternal)",phase1Pct:30.4,phase2Pct:46.7},{rank:8,pokemon:"sinistcha",pokemonDisplay:"Sinistcha",phase1Pct:25.6,phase2Pct:33.3},{rank:9,pokemon:"whimsicott",pokemonDisplay:"Whimsicott",phase1Pct:22.3,phase2Pct:23.7},{rank:10,pokemon:"archaludon",pokemonDisplay:"Archaludon",phase1Pct:17.0,phase2Pct:11.1},{rank:11,pokemon:"aerodactyl",pokemonDisplay:"Aerodactyl",phase1Pct:16.4,phase2Pct:11.9},{rank:12,pokemon:"mega-charizard-y",pokemonDisplay:"Mega Charizard Y",phase1Pct:34.9,phase2Pct:38.5},{rank:13,pokemon:"mega-floette",pokemonDisplay:"Mega Floette",phase1Pct:30.3,phase2Pct:46.7},{rank:14,pokemon:"pelipper",pokemonDisplay:"Pelipper",phase1Pct:14.0,phase2Pct:11.1}])
  );
  const tt = db.prepare("INSERT INTO tournament_teams (event_slug,player_name,placement,placement_order,pokemon,pokemon_display) VALUES (?,?,?,?,?,?)");
  [["turin-special-2026","Marco Silva","1st",1,'["Mega Floette","Mega Gengar","Basculegion","Kingambit","Sinistcha","Whimsicott"]','["Mega Floette","Mega Gengar","Basculegion","Kingambit","Sinistcha","Whimsicott"]'],["turin-special-2026","Louis Fontvieille","2nd",2,'["Mega Charizard Y","Garchomp","Incineroar","Sneasler","Basculegion","Whimsicott"]','["Mega Charizard Y","Garchomp","Incineroar","Sneasler","Basculegion","Whimsicott"]'],["turin-special-2026","Davide Carrer","Top 4",3,'["Kingambit","Charizard","Basculegion","Floette","Sinistcha","Aerodactyl"]','["Kingambit","Charizard","Basculegion","Floette","Sinistcha","Aerodactyl"]'],["turin-special-2026","Arash Ommati","Top 4",4,'["Mega Charizard Y","Garchomp","Incineroar","Sneasler","Basculegion","Whimsicott"]','["Mega Charizard Y","Garchomp","Incineroar","Sneasler","Basculegion","Whimsicott"]'],["turin-special-2026","Lorenzo Profeta","Top 8",5,'["Kingambit","Basculegion","Floette","Sinistcha","Garchomp","Pelipper"]','["Kingambit","Basculegion","Floette","Sinistcha","Garchomp","Pelipper"]'],["turin-special-2026","Matteo Ghisini","Top 8",6,'["Mega Aerodactyl","Garchomp","Incineroar","Sneasler","Basculegion","Whimsicott"]','["Mega Aerodactyl","Garchomp","Incineroar","Sneasler","Basculegion","Whimsicott"]'],["turin-special-2026","Giuseppe Musicco","Top 8",7,'["Charizard","Kingambit","Archaludon","Basculegion","Floette","Sinistcha"]','["Charizard","Kingambit","Archaludon","Basculegion","Floette","Sinistcha"]'],["turin-special-2026","Louis Markl","Top 8",8,'["Mega Charizard Y","Garchomp","Kingambit","Basculegion","Sneasler","Whimsicott"]','["Mega Charizard Y","Garchomp","Kingambit","Basculegion","Sneasler","Whimsicott"]']].forEach(t=>tt.run(t[0],t[1],t[2],t[3],t[4],t[5]));

  // Indy Regionals
  db.prepare("INSERT INTO tournament_events (slug,name,location,regulation,date,usage_stats) VALUES (?,?,?,?,?,?)").run(
    "indy-regionals-2026","Indianapolis Regional Championships","Indianapolis, IN","Regulation Set M-A","2026-05-31",
    JSON.stringify([{rank:1,pokemon:"basculegion",pokemonDisplay:"Basculegion (M)",phase1Pct:50.3,phase2Pct:59.3},{rank:2,pokemon:"kingambit",pokemonDisplay:"Kingambit",phase1Pct:48.2,phase2Pct:60.7},{rank:3,pokemon:"garchomp",pokemonDisplay:"Garchomp",phase1Pct:44.7,phase2Pct:58.6},{rank:4,pokemon:"charizard",pokemonDisplay:"Charizard",phase1Pct:34.8,phase2Pct:42.8},{rank:5,pokemon:"sneasler",pokemonDisplay:"Sneasler",phase1Pct:33.0,phase2Pct:27.6},{rank:6,pokemon:"whimsicott",pokemonDisplay:"Whimsicott",phase1Pct:27.0,phase2Pct:29.0},{rank:7,pokemon:"incineroar",pokemonDisplay:"Incineroar",phase1Pct:26.4,phase2Pct:31.7},{rank:8,pokemon:"aerodactyl",pokemonDisplay:"Aerodactyl",phase1Pct:22.5,phase2Pct:20.7},{rank:9,pokemon:"floette",pokemonDisplay:"Floette (Eternal)",phase1Pct:21.1,phase2Pct:34.5},{rank:10,pokemon:"sylveon",pokemonDisplay:"Sylveon",phase1Pct:16.3,phase2Pct:16.6},{rank:11,pokemon:"glimmora",pokemonDisplay:"Glimmora",phase1Pct:15.0,phase2Pct:14.5},{rank:12,pokemon:"farigiraf",pokemonDisplay:"Farigiraf",phase1Pct:14.4,phase2Pct:14.5},{rank:13,pokemon:"sinistcha",pokemonDisplay:"Sinistcha",phase1Pct:14.4,phase2Pct:16.6},{rank:14,pokemon:"dragonite",pokemonDisplay:"Dragonite",phase1Pct:14.4,phase2Pct:14.5}])
  );
  [["indy-regionals-2026","Arsal Puri","1st",1,'["Mega Charizard Y","Mega Floette","Basculegion","Kingambit","Garchomp","Whimsicott"]','["Mega Charizard Y","Mega Floette","Basculegion","Kingambit","Garchomp","Whimsicott"]'],["indy-regionals-2026","Wolfe Glick","2nd",2,'["Mega Charizard Y","Floette","Garchomp","Basculegion","Sneasler","Incineroar"]','["Mega Charizard Y","Floette","Garchomp","Basculegion","Sneasler","Incineroar"]'],["indy-regionals-2026","Michael Zhang","Top 4",3,'["Kingambit","Basculegion","Charizard","Garchomp","Whimsicott","Sylveon"]','["Kingambit","Basculegion","Charizard","Garchomp","Whimsicott","Sylveon"]'],["indy-regionals-2026","Nick Navarre","Top 4",4,'["Mega Aerodactyl","Kingambit","Basculegion","Garchomp","Incineroar","Whimsicott"]','["Mega Aerodactyl","Kingambit","Basculegion","Garchomp","Incineroar","Whimsicott"]'],["indy-regionals-2026","Evan Scott","Top 8",5,'["Charizard","Floette","Garchomp","Basculegion","Sneasler","Kingambit"]','["Charizard","Floette","Garchomp","Basculegion","Sneasler","Kingambit"]'],["indy-regionals-2026","Alex Underhill","Top 8",6,'["Kingambit","Garchomp","Charizard","Basculegion","Sylveon","Whimsicott"]','["Kingambit","Garchomp","Charizard","Basculegion","Sylveon","Whimsicott"]'],["indy-regionals-2026","MJ Rogers","Top 8",7,'["Mega Charizard Y","Incineroar","Basculegion","Garchomp","Sneasler","Whimsicott"]','["Mega Charizard Y","Incineroar","Basculegion","Garchomp","Sneasler","Whimsicott"]'],["indy-regionals-2026","William Brown","Top 8",8,'["Kingambit","Charizard","Basculegion","Aerodactyl","Glimmora","Whimsicott"]','["Kingambit","Charizard","Basculegion","Aerodactyl","Glimmora","Whimsicott"]']].forEach(t=>tt.run(t[0],t[1],t[2],t[3],t[4],t[5]));
  console.log("Seeded Turin + Indy tournament data");
}

db.close();
