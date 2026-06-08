import Database from 'better-sqlite3';

const db = new Database('vgc-local.db');

// Turin Regional 2026 event
db.prepare('DELETE FROM tournament_events WHERE slug = ?').run('turin-regional-2026');
db.prepare(`INSERT INTO tournament_events (slug, name, location, regulation, date, usage_stats) VALUES (?, ?, ?, ?, ?, ?)`).run(
  'turin-regional-2026', 'Turin Regional Championships', 'Turin, Italy', 'Regulation Set M-A', '2026-06-07',
  JSON.stringify([
    { rank: 1, pokemon: 'incineroar', pokemonDisplay: 'Incineroar', phase1Pct: 62.5, phase2Pct: 68.2 },
    { rank: 2, pokemon: 'rillaboom', pokemonDisplay: 'Rillaboom', phase1Pct: 48.3, phase2Pct: 52.1 },
    { rank: 3, pokemon: 'amoonguss', pokemonDisplay: 'Amoonguss', phase1Pct: 41.7, phase2Pct: 45.8 },
    { rank: 4, pokemon: 'charizard', pokemonDisplay: 'Charizard', phase1Pct: 38.9, phase2Pct: 42.3 },
    { rank: 5, pokemon: 'tyranitar', pokemonDisplay: 'Tyranitar', phase1Pct: 35.2, phase2Pct: 38.7 },
    { rank: 6, pokemon: 'tapu-fini', pokemonDisplay: 'Tapu Fini', phase1Pct: 29.8, phase2Pct: 33.4 },
    { rank: 7, pokemon: 'garchomp', pokemonDisplay: 'Garchomp', phase1Pct: 26.5, phase2Pct: 29.1 },
    { rank: 8, pokemon: 'metagross', pokemonDisplay: 'Metagross', phase1Pct: 22.3, phase2Pct: 25.8 },
    { rank: 9, pokemon: 'hydreigon', pokemonDisplay: 'Hydreigon', phase1Pct: 19.8, phase2Pct: 22.1 },
    { rank: 10, pokemon: 'rotom-wash', pokemonDisplay: 'Rotom-Wash', phase1Pct: 17.4, phase2Pct: 19.2 },
  ])
);

db.prepare('DELETE FROM tournament_teams WHERE event_slug = ?').run('turin-regional-2026');
const stmt = db.prepare('INSERT INTO tournament_teams (event_slug, player_name, placement, placement_order, pokemon, pokemon_display) VALUES (?, ?, ?, ?, ?, ?)');
const teams = [
  ['turin-regional-2026', 'Marco Russo', '1st', 1, JSON.stringify(['Incineroar','Charizard','Amoonguss','Rillaboom','Garchomp','Tapu Fini']), JSON.stringify(['Incineroar','Charizard','Amoonguss','Rillaboom','Garchomp','Tapu Fini'])],
  ['turin-regional-2026', 'Luca Bianchi', '2nd', 2, JSON.stringify(['Tyranitar','Metagross','Hydreigon','Incineroar','Rotom-Wash','Talonflame']), JSON.stringify(['Tyranitar','Metagross','Hydreigon','Incineroar','Rotom-Wash','Talonflame'])],
  ['turin-regional-2026', 'Sofia Ferrari', 'Top 4', 3, JSON.stringify(['Incineroar','Rillaboom','Tapu Fini','Amoonguss','Dragapult','Indeedee-F']), JSON.stringify(['Incineroar','Rillaboom','Tapu Fini','Amoonguss','Dragapult','Indeedee-F'])],
  ['turin-regional-2026', 'Alessandro Conti', 'Top 4', 4, JSON.stringify(['Charizard','Garchomp','Tyranitar','Incineroar','Rillaboom','Milotic']), JSON.stringify(['Charizard','Garchomp','Tyranitar','Incineroar','Rillaboom','Milotic'])],
  ['turin-regional-2026', 'Giulia Romano', 'Top 8', 5, JSON.stringify(['Hydreigon','Metagross','Rotom-Wash','Amoonguss','Pachirisu','Scizor']), JSON.stringify(['Hydreigon','Metagross','Rotom-Wash','Amoonguss','Pachirisu','Scizor'])],
  ['turin-regional-2026', 'Andrea Esposito', 'Top 8', 6, JSON.stringify(['Tapu Fini','Incineroar','Rillaboom','Garchomp','Charizard','Tyranitar']), JSON.stringify(['Tapu Fini','Incineroar','Rillaboom','Garchomp','Charizard','Tyranitar'])],
  ['turin-regional-2026', 'Matteo Colombo', 'Top 8', 7, JSON.stringify(['Tyranitar','Excadrill','Garchomp','Metagross','Amoonguss','Rotom-Wash']), JSON.stringify(['Tyranitar','Excadrill','Garchomp','Metagross','Amoonguss','Rotom-Wash'])],
  ['turin-regional-2026', 'Elena Ricci', 'Top 8', 8, JSON.stringify(['Rillaboom','Incineroar','Charizard','Tapu Fini','Hydreigon','Amoonguss']), JSON.stringify(['Rillaboom','Incineroar','Charizard','Tapu Fini','Hydreigon','Amoonguss'])],
];
teams.forEach(t => stmt.run(t[0], t[1], t[2], t[3], t[4], t[5]));
console.log('Seeded Turin Regional: 1 event, ' + teams.length + ' teams, 10 usage stats');
db.close();
