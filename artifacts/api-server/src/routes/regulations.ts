import { Router } from "express";

const router = Router();

export const regulations = [
  {
    id: "reg-e",
    name: "Regulation E",
    label: "Reg E",
    description: "Scarlet & Violet Series 1 — Paldea starters and early game Pokemon, no legendaries.",
    isActive: false,
    startDate: "2023-04-01",
    endDate: "2023-09-30",
    allowedSeriesName: "Series 1",
    restrictedLegendariesAllowed: 0,
    notes: "Base Paldea Pokedex only.",
  },
  {
    id: "reg-f",
    name: "Regulation F",
    label: "Reg F",
    description: "Full Paldea Pokedex including the Kitakami and Blueberry additions. No restricted legendaries.",
    isActive: false,
    startDate: "2023-10-01",
    endDate: "2024-04-30",
    allowedSeriesName: "Series 2",
    restrictedLegendariesAllowed: 0,
    notes: "Paradox Pokemon and sub-legendaries allowed.",
  },
  {
    id: "reg-g",
    name: "Regulation G",
    label: "Reg G",
    description: "Full SV Pokedex plus one restricted legendary per team. The restricted era begins.",
    isActive: false,
    startDate: "2024-05-01",
    endDate: "2024-09-30",
    allowedSeriesName: "Series 3",
    restrictedLegendariesAllowed: 1,
    notes: "One restricted legendary allowed per team. Miraidon/Koraidon meta dominates.",
  },
  {
    id: "reg-h",
    name: "Regulation H",
    label: "Reg H",
    description: "Full SV Pokedex, two restricted legendaries per team. High-powered double-restricted teams become the norm.",
    isActive: false,
    startDate: "2024-10-01",
    endDate: "2025-03-31",
    allowedSeriesName: "Series 4",
    restrictedLegendariesAllowed: 2,
    notes: "Two restricted legendaries per team. Complex team-building with legendary synergies required.",
  },
  {
    id: "reg-i",
    name: "Regulation I",
    label: "Reg I",
    description: "Back to non-restricted: full SV Pokedex but no restricted legendaries. Focus returns to team synergy and strategy.",
    isActive: false,
    startDate: "2025-04-01",
    endDate: "2025-05-31",
    allowedSeriesName: "Series 5",
    restrictedLegendariesAllowed: 0,
    notes: "No restricted legendaries. Paradox Pokemon and sub-legends like Chien-Pao and Chi-Yu are the power picks.",
  },
  {
    id: "reg-ma",
    name: "Regulation MA",
    label: "Reg MA (Current)",
    description: "Champions Regulation — the 2025 World Championship format. Full SV Pokedex plus Pokemon from the National Dex via HOME transfers, with two restricted legendaries allowed per team. The biggest and most complex VGC format ever.",
    isActive: true,
    startDate: "2025-06-01",
    endDate: null,
    allowedSeriesName: "Champions Series",
    restrictedLegendariesAllowed: 2,
    notes: "Two restricted legendaries allowed. National Dex Pokemon usable via HOME. Home-only moves available. Incredibly wide Pokemon and move pool — expect wild team diversity at Worlds.",
  },
];

router.get("/regulations", (req, res) => {
  res.json(regulations);
});

router.get("/regulations/current", (req, res) => {
  const current = regulations.find((r) => r.isActive);
  if (!current) {
    return res.status(404).json({ error: "No active regulation found" });
  }
  res.json(current);
});

export default router;
