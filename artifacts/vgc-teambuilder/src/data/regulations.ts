export interface Regulation {
  id: string; name: string; label: string; description: string;
  startDate: string; endDate: string; allowedSeriesName: string;
  restrictedLegendariesAllowed: number; notes: string;
  isActive?: boolean;
}

const RAW_REGULATIONS: Regulation[] = [
  { id: "reg-e", name: "Regulation E", label: "Reg E", description: "Scarlet & Violet — Base Paldea Pokédex only, no legendaries.", startDate: "2023-04-01", endDate: "2023-09-30", allowedSeriesName: "SV Series 1", restrictedLegendariesAllowed: 0, notes: "Game: Pokémon Scarlet & Violet VGC. Base Paldea Pokédex only." },
  { id: "reg-f", name: "Regulation F", label: "Reg F", description: "Scarlet & Violet — Full Paldea Pokédex including Kitakami and Blueberry DLC, no restricted legendaries.", startDate: "2023-10-01", endDate: "2024-04-30", allowedSeriesName: "SV Series 2", restrictedLegendariesAllowed: 0, notes: "Game: Pokémon Scarlet & Violet VGC. Paradox Pokémon and sub-legendaries allowed." },
  { id: "reg-g", name: "Regulation G", label: "Reg G", description: "Scarlet & Violet — Full SV Pokédex plus one restricted legendary per team.", startDate: "2024-05-01", endDate: "2024-09-30", allowedSeriesName: "SV Series 3", restrictedLegendariesAllowed: 1, notes: "Game: Pokémon Scarlet & Violet VGC. Miraidon/Koraidon meta dominates." },
  { id: "reg-h", name: "Regulation H", label: "Reg H", description: "Scarlet & Violet — Full SV Pokédex with two restricted legendaries per team.", startDate: "2024-10-01", endDate: "2025-03-31", allowedSeriesName: "SV Series 4", restrictedLegendariesAllowed: 2, notes: "Game: Pokémon Scarlet & Violet VGC. Two restricted legendaries per team." },
  { id: "reg-i", name: "Regulation I", label: "Reg I", description: "Scarlet & Violet — Full SV Pokédex, no restricted legendaries. Final SV VGC format.", startDate: "2025-04-01", endDate: "2025-05-31", allowedSeriesName: "SV Series 5", restrictedLegendariesAllowed: 0, notes: "Game: Pokémon Scarlet & Violet VGC. Last SV format before Pokémon Champions era." },
  { id: "reg-ma", name: "Regulation Set M-A", label: "Reg M-A", description: "Pokémon Champions — first regulation set. Curated roster of ~150 Pokémon from across all generations, with Mega Evolution enabled once per battle. No duplicate held items.", startDate: "2026-04-08", endDate: "2026-06-17", allowedSeriesName: "Champions Season M-1 / M-2", restrictedLegendariesAllowed: 0, notes: "Game: Pokémon Champions. Mega Evolution: one Mega per battle. No duplicate held items." },
];

function isActive(start: string, end: string): boolean {
  const now = new Date();
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() + 14);
  return now >= new Date(start) && now <= endDate;
}

export function getAllRegulations(): Regulation[] {
  return RAW_REGULATIONS.map((r) => ({
    ...r,
    isActive: isActive(r.startDate, r.endDate),
    label: isActive(r.startDate, r.endDate) ? `${r.label} (Current)` : r.label,
  }));
}

export function getCurrentRegulation(): Regulation | null {
  return getAllRegulations().find((r) => r.isActive) ?? null;
}
