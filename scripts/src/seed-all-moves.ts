import { db, movesTable } from "@workspace/db";

const CSV_BASE = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv";

interface MoveCSV {
  id: string;
  identifier: string;
  type_id: string;
  power: string;
  pp: string;
  accuracy: string;
  priority: string;
  target_id: string;
  damage_class_id: string;
  effect_id: string;
  effect_chance: string;
}

async function fetchCSV(filename: string): Promise<string> {
  const resp = await fetch(`${CSV_BASE}/${filename}`);
  if (!resp.ok) throw new Error(`Failed to fetch ${filename}: ${resp.status}`);
  return resp.text();
}

function parseCSV<T extends Record<string, string>>(csv: string): T[] {
  const lines = csv.trim().split("\n");
  if (lines.length === 0) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const obj: Record<string, string> = {};
    const values = line.split(",");
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj as T;
  });
}

function toDisplayName(identifier: string): string {
  return identifier
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function main() {
  console.log("Fetching CSVs...");
  
  const [movesCsv, typesCsv, targetsCsv, flavorsCsv] = await Promise.all([
    fetchCSV("moves.csv"),
    fetchCSV("types.csv"),
    fetchCSV("move_target_prose.csv"),
    fetchCSV("move_flavor_text.csv"),
  ]);

  const moves = parseCSV<MoveCSV>(movesCsv);
  const typesRaw = parseCSV<{ id: string; identifier: string }>(typesCsv);
  const targetsRaw = parseCSV<{ move_target_id: string; local_language_id: string; name: string }>(targetsCsv);
  const flavorsRaw = parseCSV<{ move_id: string; local_language_id: string; flavor_text: string; version_group_id: string }>(flavorsCsv);

  const typeMap = new Map<string, string>();
  for (const t of typesRaw) typeMap.set(t.id, t.identifier);

  const targetMap = new Map<string, string>();
  for (const t of targetsRaw) {
    if (t.local_language_id === "9") {
      targetMap.set(t.move_target_id, t.name);
    }
  }

  const flavorMap = new Map<string, string>();
  for (const f of flavorsRaw) {
    if (f.local_language_id === "9" && f.version_group_id === "25") {
      const txt = f.flavor_text.replace(/\n/g, " ").replace(/\f/g, " ");
      if (!flavorMap.has(f.move_id)) {
        flavorMap.set(f.move_id, txt);
      }
    }
  }

  const damageClassMap: Record<string, string> = { "1": "status", "2": "physical", "3": "special" };

  console.log(`Processing ${moves.length} moves...`);
  console.log("Clearing existing moves...");
  await db.delete(movesTable);

  const BATCH_SIZE = 200;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < moves.length; i += BATCH_SIZE) {
    const batch = moves.slice(i, i + BATCH_SIZE);
    const values = batch.map(m => {
      const power = m.power ? parseInt(m.power) : null;
      const accuracy = m.accuracy ? parseInt(m.accuracy) : null;
      const pp = m.pp ? parseInt(m.pp) : null;
      const priority = m.priority ? parseInt(m.priority) : 0;
      const type = typeMap.get(m.type_id) ?? "???";
      const category = damageClassMap[m.damage_class_id] ?? "status";
      const target = targetMap.get(m.target_id) ?? null;
      const desc = flavorMap.get(m.id) ?? null;

      return {
        name: m.identifier,
        displayName: toDisplayName(m.identifier),
        type,
        category,
        power,
        accuracy,
        pp,
        priority,
        target,
        description: desc,
      };
    });

    for (const v of values) {
      try {
        await db.insert(movesTable).values(v);
        inserted++;
      } catch {
        skipped++;
      }
    }

    console.log(`  [${Math.min(i + BATCH_SIZE, moves.length)}/${moves.length}] inserted ${inserted}, skipped ${skipped}`);
  }

  console.log(`Done! Inserted ${inserted} moves.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
