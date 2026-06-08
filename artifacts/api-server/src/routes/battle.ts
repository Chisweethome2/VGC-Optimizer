import { Router } from "express";
import { db, teamsTable, movesTable, pokemonTable } from "../lib/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";
import { initBattle, executeTurn, getAIMoves } from "../lib/battle/engine";
import { getChampions, getChampion, buildChampionBattlePokemon } from "../lib/battle/champions";
import {
  type BattlePokemon,
  type BattleMove,
  type Stat,
  type PlayerChoice,
  natureMultiplier,
  calcStat,
  calcHp,
} from "../lib/battle/types";

const router = Router();

const battles = new Map<string, { state: any; userId: number }>();
let battleIdCounter = 0;

function buildMovesMap(moves: any[]) {
  const map = new Map<string, any>();
  for (const m of moves) map.set(m.name, m);
  return map;
}

function getMoveTarget(dbMove: any): string {
  const t = (dbMove?.target || "").toLowerCase();
  const valid: string[] = ["single", "all-opponents", "all-adjacent", "self", "ally", "user-or-ally", "user", "random-opponent", "all-others"];
  if (valid.includes(t)) return t;
  if (t.includes("opponent") && t.includes("all")) return "all-opponents";
  if (t.includes("adjacent")) return "all-adjacent";
  if (t.includes("self") || t.includes("user")) return "self";
  if (t.includes("ally")) return "ally";
  return "single";
}

function teamSlotsToBattlePokemon(
  slots: any[],
  pokemonData: Record<string, any>,
  movesMap: Map<string, any>,
): BattlePokemon[] {
  return slots.map((slot: any) => {
    const poke = pokemonData[slot.pokemonName];
    const baseStats = poke?.baseStats || { hp: 60, attack: 60, defense: 60, specialAttack: 60, specialDefense: 60, speed: 60 };
    const nm = (stat: Stat) => natureMultiplier(slot.nature, stat);
    const evs = slot.evs || { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
    const ivs = slot.ivs || { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 };

    const stats: Record<Stat, number> = {
      hp: calcHp(baseStats.hp ?? 60, ivs.hp ?? 31, evs.hp ?? 0, 50),
      attack: calcStat(baseStats.attack ?? 60, ivs.attack ?? 31, evs.attack ?? 0, 50, nm("attack")),
      defense: calcStat(baseStats.defense ?? 60, ivs.defense ?? 31, evs.defense ?? 0, 50, nm("defense")),
      specialAttack: calcStat(baseStats.specialAttack ?? 60, ivs.specialAttack ?? 31, evs.specialAttack ?? 0, 50, nm("specialAttack")),
      specialDefense: calcStat(baseStats.specialDefense ?? 60, ivs.specialDefense ?? 31, evs.specialDefense ?? 0, 50, nm("specialDefense")),
      speed: calcStat(baseStats.speed ?? 60, ivs.speed ?? 31, evs.speed ?? 0, 50, nm("speed")),
    };
    const maxHp = calcHp(baseStats.hp ?? 60, ivs.hp ?? 31, evs.hp ?? 0, 50);

    const battleMoves: BattleMove[] = (slot.moves || []).slice(0, 4).map((moveName: string) => {
      const key = (moveName || "").toLowerCase().replace(/\s+/g, "-");
      const m = movesMap.get(key);
      const maxPp = m?.pp ?? 10;
      return {
        name: key,
        displayName: m?.displayName || moveName,
        type: m?.type || "normal",
        category: (m?.category || "physical") as "physical" | "special" | "status",
        power: m?.power ?? null,
        accuracy: m?.accuracy ?? null,
        priority: m?.priority ?? 0,
      target: getMoveTarget(m) as BattleMove["target"],
        pp: maxPp,
        maxPp,
        makesContact: false,
      };
    });

    return {
      name: slot.pokemonName,
      dexNumber: poke?.dexNumber ?? 0,
      types: poke?.types || ["normal"],
      ability: slot.ability || "???",
      item: slot.item || "",
      nature: slot.nature || "Serious",
      baseStats,
      currentHp: maxHp,
      maxHp,
      stats,
      evs,
      ivs,
      moves: battleMoves,
      isFainted: false,
      turnsOnField: 0,
      protected: false,
      protectCount: 0,
      perishTurns: 0,
      status: "none",
      sleepTurns: 0,
      toxicCounter: 0,
      statStages: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
      helpingHand: false,
      lockedMove: -1,
    };
  });
}

// List available champions
router.get("/battle/champions", (_req, res) => {
  const champs = getChampions().map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    description: c.description,
    difficulty: c.difficulty,
    teamSize: c.team.length,
    teamPreview: c.team.map((p) => ({ name: p.name, types: p.types })),
  }));
  res.json(champs);
});

// Start a battle against a champion
router.post("/battle/challenge/:championId", requireAuth, async (req, res) => {
  try {
    const championId = String(req.params.championId);
    const { teamId } = req.body;
    const uid = (req as any).user.id;

    const champion = getChampion(championId);
    if (!champion) { res.status(404).json({ error: "Champion not found" }); return; }

    const [team] = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.id, parseInt(teamId || "0")));

    if (!team) { res.status(404).json({ error: "Team not found" }); return; }
    if (team.userId && team.userId !== uid) { res.status(404).json({ error: "Team not found" }); return; }

    const slots = team.slots as any[];
    if (slots.length < 1) {
      res.status(400).json({ error: "Team has no Pokemon" });
      return;
    }

    const allMoves = await db.select().from(movesTable);
    const pokemonNames = slots.map((s: any) => s.pokemonName.toLowerCase());
    const allPokes = await db.select().from(pokemonTable);

    const pokemonData: Record<string, any> = {};
    for (const p of allPokes) pokemonData[p.name] = p;

    const movesMap = buildMovesMap(allMoves);
    const championMovesMap = buildMovesMap(allMoves);

    const playerTeam = teamSlotsToBattlePokemon(slots, pokemonData, movesMap);
    const opponentTeam = buildChampionBattlePokemon(champion, championMovesMap);

    const battleId = `battle-${++battleIdCounter}`;
    const state = initBattle(playerTeam, opponentTeam);

    state.log.push({
      turn: 0, type: "activate", actor: "opponent", actorName: champion.name,
      message: `${champion.title} ${champion.name} wants to battle! (Doubles)`,
    });
    for (const pi of state.player.activeIndices) {
      if (pi >= 0) state.log.push({
        turn: 0, type: "activate", actor: "player", actorName: "You",
        message: `Go! ${playerTeam[pi]?.name}!`,
      });
    }
    for (const oi of state.opponent.activeIndices) {
      if (oi >= 0) state.log.push({
        turn: 0, type: "activate", actor: "opponent", actorName: champion.name,
        message: `${champion.name} sent out ${opponentTeam[oi]?.name}!`,
      });
    }

    battles.set(battleId, { state, userId: uid });
    res.json({ battleId, state: sanitizeState(state) });
  } catch (err) {
    console.error("Challenge error:", err);
    res.status(500).json({ error: "Failed to start battle" });
  }
});

// Execute a turn
router.post("/battle/turn", requireAuth, async (req, res) => {
  try {
    const { battleId, choices } = req.body;
    const uid = (req as any).user.id;

    const entry = battles.get(battleId);
    if (!entry || entry.userId !== uid) {
      res.status(404).json({ error: "Battle not found" });
      return;
    }

    if (entry.state.phase === "finished") {
      res.json({ state: sanitizeState(entry.state) });
      return;
    }

    // Parse player choices from frontend
    // Frontend sends: { choices: [{ type: "move", moveIndex: 0, moveTarget: 0 }, ...] }
    const playerChoices: PlayerChoice[] = Array.isArray(choices)
      ? choices.map((c: any) => ({
          type: c.type || "move",
          moveIndex: c.moveIndex ?? 0,
          moveTarget: c.moveTarget ?? 0,
          switchIndex: c.switchIndex,
        }))
      : [{ type: "move", moveIndex: 0, moveTarget: 0 }, { type: "move", moveIndex: 0, moveTarget: 0 }];

    const aiChoices = getAIMoves(entry.state);
    const newState = executeTurn(entry.state, playerChoices, aiChoices);

    battles.set(battleId, { ...entry, state: newState });
    res.json({ state: sanitizeState(newState) });
  } catch (err) {
    console.error("Turn error:", err);
    res.status(500).json({ error: "Failed to execute turn" });
  }
});

// Get current battle state
router.get("/battle/state/:battleId", requireAuth, async (req, res) => {
  try {
    const battleId = String(req.params.battleId);
    const uid = (req as any).user.id;
    const entry = battles.get(battleId);
    if (!entry || entry.userId !== uid) {
      res.status(404).json({ error: "Battle not found" });
      return;
    }
    res.json({ state: sanitizeState(entry.state) });
  } catch (err) {
    console.error("State error:", err);
    res.status(500).json({ error: "Failed" });
  }
});

function sanitizeState(state: any) {
  return {
    phase: state.phase,
    turn: state.turn,
    winner: state.winner,
    weather: state.weather,
    weatherTurns: state.weatherTurns,
    terrain: state.terrain,
    terrainTurns: state.terrainTurns,
    tailwind: state.tailwind,
    trickRoom: state.trickRoom,
    trickRoomTurns: state.trickRoomTurns,
    player: {
      team: state.player.team.map((p: any) => ({
        name: p.name,
        dexNumber: p.dexNumber,
        types: p.types,
        ability: p.ability,
        item: p.item,
        currentHp: p.currentHp,
        maxHp: p.maxHp,
        stats: p.stats,
        moves: p.moves,
        isFainted: p.isFainted,
        status: p.status,
        statStages: p.statStages,
        perishTurns: p.perishTurns,
      })),
      activeIndices: state.player.activeIndices,
    },
    opponent: {
      team: state.opponent.team.map((p: any) => ({
        name: p.name,
        dexNumber: p.dexNumber,
        types: p.types,
        ability: p.ability,
        item: p.item,
        currentHp: p.currentHp,
        maxHp: p.maxHp,
        stats: p.stats,
        moves: p.moves,
        isFainted: p.isFainted,
        status: p.status,
        statStages: p.statStages,
        perishTurns: p.perishTurns,
      })),
      activeIndices: state.opponent.activeIndices,
    },
    log: state.log,
  };
}

export default router;
