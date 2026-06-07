import { Router } from "express";
import { requireAuth } from "./auth";

const router = Router();

const GRACE_DAYS = 14;

function computeLabel(reg: typeof RAW_REGULATIONS[0], active: boolean): string {
  const base = reg.label.split(" (")[0];
  return active ? `${base} (Current)` : base;
}

function isRegActive(start: string, end: string): boolean {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  // Stay current for GRACE_DAYS after end date for transition
  const graceEnd = new Date(endDate);
  graceEnd.setDate(graceEnd.getDate() + GRACE_DAYS);
  return now >= startDate && now <= graceEnd;
}

const RAW_REGULATIONS = [
  {
    id: "reg-e",
    name: "Regulation E",
    label: "Reg E",
    description: "Scarlet & Violet — Base Paldea Pok\u00e9dex only, no legendaries.",
    startDate: "2023-04-01",
    endDate: "2023-09-30",
    allowedSeriesName: "SV Series 1",
    restrictedLegendariesAllowed: 0,
    notes: "Game: Pok\u00e9mon Scarlet & Violet VGC. Base Paldea Pok\u00e9dex only.",
  },
  {
    id: "reg-f",
    name: "Regulation F",
    label: "Reg F",
    description: "Scarlet & Violet — Full Paldea Pok\u00e9dex including Kitakami and Blueberry DLC, no restricted legendaries.",
    startDate: "2023-10-01",
    endDate: "2024-04-30",
    allowedSeriesName: "SV Series 2",
    restrictedLegendariesAllowed: 0,
    notes: "Game: Pok\u00e9mon Scarlet & Violet VGC. Paradox Pok\u00e9mon and sub-legendaries allowed.",
  },
  {
    id: "reg-g",
    name: "Regulation G",
    label: "Reg G",
    description: "Scarlet & Violet — Full SV Pok\u00e9dex plus one restricted legendary per team.",
    startDate: "2024-05-01",
    endDate: "2024-09-30",
    allowedSeriesName: "SV Series 3",
    restrictedLegendariesAllowed: 1,
    notes: "Game: Pok\u00e9mon Scarlet & Violet VGC. Miraidon/Koraidon meta dominates.",
  },
  {
    id: "reg-h",
    name: "Regulation H",
    label: "Reg H",
    description: "Scarlet & Violet — Full SV Pok\u00e9dex with two restricted legendaries per team.",
    startDate: "2024-10-01",
    endDate: "2025-03-31",
    allowedSeriesName: "SV Series 4",
    restrictedLegendariesAllowed: 2,
    notes: "Game: Pok\u00e9mon Scarlet & Violet VGC. Two restricted legendaries per team.",
  },
  {
    id: "reg-i",
    name: "Regulation I",
    label: "Reg I",
    description: "Scarlet & Violet — Full SV Pok\u00e9dex, no restricted legendaries. Final SV VGC format.",
    startDate: "2025-04-01",
    endDate: "2025-05-31",
    allowedSeriesName: "SV Series 5",
    restrictedLegendariesAllowed: 0,
    notes: "Game: Pok\u00e9mon Scarlet & Violet VGC. Last SV format before Pok\u00e9mon Champions era.",
  },
  {
    id: "reg-ma",
    name: "Regulation Set M-A",
    label: "Reg M-A",
    description: "Pok\u00e9mon Champions — first regulation set. Curated roster of ~150 Pok\u00e9mon from across all generations, with Mega Evolution enabled once per battle. No duplicate held items.",
    startDate: "2026-04-08",
    endDate: "2026-06-17",
    allowedSeriesName: "Champions Season M-1 / M-2",
    restrictedLegendariesAllowed: 0,
    notes: "Game: Pok\u00e9mon Champions. Mega Evolution: one Mega per battle. No duplicate held items. Warm-Up Challenge, Global Challenge 2026 I, PJCS 2026 Qualifiers.",
  },
];

// Dynamic regulation list computed at request time
function getRegulations() {
  return RAW_REGULATIONS.map((r) => ({
    ...r,
    isActive: isRegActive(r.startDate, r.endDate),
    label: computeLabel(r, isRegActive(r.startDate, r.endDate)),
  }));
}

export const REGULATION_MA_ELIGIBLE = [
  "venusaur","charizard","blastoise","beedrill","pidgeot","arbok","pikachu","raichu",
  "raichu-alola","clefable","ninetales","ninetales-alola","arcanine","arcanine-hisui",
  "alakazam","machamp","victreebel","slowbro","slowbro-galar","gengar","kangaskhan",
  "starmie","pinsir","tauros","tauros-paldea-combat","tauros-paldea-blaze","tauros-paldea-aqua",
  "gyarados","ditto","vaporeon","jolteon","flareon","aerodactyl","snorlax","dragonite",
  "meganium","typhlosion","typhlosion-hisui","feraligatr","ariados","ampharos","azumarill",
  "politoed","espeon","umbreon","slowking","slowking-galar","forretress","steelix","scizor",
  "heracross","skarmory","houndoom","tyranitar","pelipper","gardevoir","sableye","aggron",
  "medicham","manectric","sharpedo","camerupt","torkoal","altaria","milotic","castform",
  "banette","chimecho","absol","glalie","torterra","infernape","empoleon","luxray",
  "roserade","rampardos","bastiodon","lopunny","spiritomb","garchomp","lucario","hippowdon",
  "toxicroak","abomasnow","weavile","rhyperior","leafeon","glaceon","gliscor","mamoswine",
  "gallade","froslass","rotom","rotom-heat","rotom-wash","rotom-frost","rotom-fan","rotom-mow",
  "serperior","emboar","samurott","samurott-hisui","watchog","liepard","simisage","simisear",
  "simipour","excadrill","audino","conkeldurr","whimsicott","krookodile","cofagrigus",
  "garbodor","zoroark","zoroark-hisui","reuniclus","vanilluxe","emolga","chandelure",
  "beartic","stunfisk","stunfisk-galar","golurk","hydreigon","volcarona","chesnaught",
  "delphox","greninja","diggersby","talonflame","vivillon","floette","florges","pangoro",
  "furfrou","meowstic","aegislash","aromatisse","slurpuff","clawitzer","heliolisk",
  "tyrantrum","aurorus","sylveon","hawlucha","dedenne","goodra","goodra-hisui","klefki",
  "trevenant","gourgeist","avalugg","avalugg-hisui","noivern","decidueye","decidueye-hisui",
  "incineroar","primarina","toucannon","crabominable","lycanroc","lycanroc-midnight",
  "lycanroc-dusk","toxapex","mudsdale","araquanid","salazzle","tsareena","oranguru",
  "passimian","mimikyu","drampa","kommo-o","corviknight","flapple","appletun","sandaconda",
  "polteageist","hatterene","mr-rime","runerigus","alcremie","morpeko","dragapult",
  "wyrdeer","kleavor","basculegion","basculegion-f","sneasler","meowscarada","skeledirge",
  "quaquaval","maushold","garganacl","armarouge","ceruledge","bellibolt","scovillain",
  "espathra","tinkaton","palafin","orthworm","glimmora","farigiraf","kingambit",
  "sinistcha","archaludon","hydrapple",
  "zacian","calyrex-shadow","tapu-fini","indeedee-f","landorus-therian",
  "urshifu-rapid","metagross","gastrodon","pachirisu","amoonguss",
];

export const REGULATION_MA_MEGAS = [
  "mega-venusaur","mega-charizard-x","mega-charizard-y","mega-blastoise",
  "mega-beedrill","mega-pidgeot","mega-clefable","mega-alakazam","mega-victreebel",
  "mega-slowbro","mega-gengar","mega-kangaskhan","mega-starmie","mega-pinsir",
  "mega-gyarados","mega-aerodactyl","mega-dragonite","mega-meganium","mega-feraligatr",
  "mega-ampharos","mega-steelix","mega-scizor","mega-heracross","mega-skarmory",
  "mega-houndoom","mega-tyranitar","mega-gardevoir","mega-sableye","mega-aggron",
  "mega-medicham","mega-manectric","mega-sharpedo","mega-camerupt","mega-altaria",
  "mega-banette","mega-chimecho","mega-absol","mega-glalie","mega-lopunny",
  "mega-garchomp","mega-lucario","mega-abomasnow","mega-gallade","mega-froslass",
  "mega-emboar","mega-excadrill","mega-audino","mega-chandelure","mega-golurk",
  "mega-chesnaught","mega-delphox","mega-greninja","mega-floette","mega-meowstic",
  "mega-hawlucha","mega-crabominable","mega-drampa","mega-scovillain","mega-glimmora",
];

export const eligibleByRegulation: Record<string, string[]> = {
  "reg-ma": REGULATION_MA_ELIGIBLE,
};

router.get("/regulations", (_req, res) => {
  res.json(getRegulations());
});

router.get("/regulations/current", (_req, res) => {
  try {
    const all = getRegulations();
    const current = all.find((r) => r.isActive);
    if (!current) {
      res.status(404).json({ error: "No active regulation found" });
      return;
    }
    res.json(current);
  } catch (err) {
    console.error("Regulation error:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// Admin: update or add a regulation
router.post("/regulations/update", requireAuth, (req, res) => {
  try {
    const reg = req.body;
    if (!reg.id || !reg.name || !reg.startDate || !reg.endDate) {
      res.status(400).json({ error: "id, name, startDate, endDate required" });
      return;
    }
    const idx = RAW_REGULATIONS.findIndex((r) => r.id === reg.id);
    const entry = {
      id: reg.id,
      name: reg.name,
      label: reg.label || reg.name.split(" —")[0],
      description: reg.description || "",
      startDate: reg.startDate,
      endDate: reg.endDate,
      allowedSeriesName: reg.allowedSeriesName || "",
      restrictedLegendariesAllowed: reg.restrictedLegendariesAllowed ?? 0,
      notes: reg.notes || "",
    };
    if (idx >= 0) {
      RAW_REGULATIONS[idx] = entry;
    } else {
      RAW_REGULATIONS.push(entry);
    }
    res.json({ ok: true, id: reg.id });
  } catch {
    res.status(500).json({ error: "Failed to update regulation" });
  }
});

export default router;
