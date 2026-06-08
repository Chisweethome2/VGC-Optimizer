import app from "./app";
import { logger } from "./lib/logger";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { initBattle, executeTurn } from "./lib/battle/engine";
import { getSession } from "./routes/auth";
import { db, teamsTable, movesTable, pokemonTable } from "./lib/db";
import { eq } from "drizzle-orm";
import type { BattlePokemon, Stat, BattleMove, PlayerChoice } from "./lib/battle/types";
import { natureMultiplier, calcStat, calcHp } from "./lib/battle/types";
import { parse } from "url";

const rawPort = process.env["PORT"];

if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

interface PvPClient {
  ws: WebSocket;
  userId: number;
  email: string;
  inBattle: boolean;
}

const clients = new Map<WebSocket, PvPClient>();
const pendingQueue: PvPClient[] = [];
const pvpBattles = new Map<string, { state: any; player1: PvPClient; player2: PvPClient }>();
let pvpBattleId = 0;

const COOKIE_NAME = "vgc_session";

function parseCookies(raw: string): Record<string, string> {
  const map: Record<string, string> = {};
  raw.split(";").forEach((c) => {
    const [key, ...val] = c.trim().split("=");
    if (key) map[key] = val.join("=");
  });
  return map;
}

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

wss.on("connection", async (ws, req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];

  if (!token) { ws.close(4001, "Not authenticated"); return; }
  const user = await getSession(token);
  if (!user) { ws.close(4001, "Invalid session"); return; }

  const client: PvPClient = { ws, userId: user.id, email: user.email, inBattle: false };
  clients.set(ws, client);

  ws.send(JSON.stringify({ type: "connected", userId: user.id, email: user.email }));

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      await handleMessage(client, msg);
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
    }
  });

  ws.on("close", () => {
    const idx = pendingQueue.indexOf(client);
    if (idx >= 0) pendingQueue.splice(idx, 1);
    for (const [bId, battle] of pvpBattles) {
      if (battle.player1 === client) {
        battle.player2.ws.send(JSON.stringify({ type: "pvp_opponent_disconnected", battleId: bId }));
        pvpBattles.delete(bId);
      } else if (battle.player2 === client) {
        battle.player1.ws.send(JSON.stringify({ type: "pvp_opponent_disconnected", battleId: bId }));
        pvpBattles.delete(bId);
      }
    }
    clients.delete(ws);
  });
});

async function handleMessage(client: PvPClient, msg: any) {
  switch (msg.type) {
    case "pvp_queue": {
      if (client.inBattle) return;
      const { teamId } = msg;
      try {
        const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, parseInt(teamId)));
        if (!team || team.userId !== client.userId) {
          client.ws.send(JSON.stringify({ type: "error", message: "Team not found" }));
          return;
        }
        (client as any).queuedTeamId = teamId;
      } catch {
        client.ws.send(JSON.stringify({ type: "error", message: "Invalid team" }));
        return;
      }
      if (pendingQueue.length > 0) {
        const opponent = pendingQueue.shift()!;
        if (opponent.ws.readyState !== WebSocket.OPEN) return;
        startPvPBattle(client, opponent);
      } else {
        pendingQueue.push(client);
        client.ws.send(JSON.stringify({ type: "queued", position: pendingQueue.length }));
      }
      break;
    }
    case "pvp_cancel": {
      const idx = pendingQueue.indexOf(client);
      if (idx >= 0) pendingQueue.splice(idx, 1);
      client.ws.send(JSON.stringify({ type: "queue_cancelled" }));
      break;
    }
    case "pvp_move": {
      if (!client.inBattle) return;
      const { battleId, choices } = msg;
      const battle = pvpBattles.get(battleId);
      if (!battle) return;

      const isP1 = battle.player1 === client;
      const parsedChoices: PlayerChoice[] = Array.isArray(choices)
        ? choices.map((c: any) => ({
            type: c.type || "move",
            moveIndex: c.moveIndex ?? 0,
            moveTarget: c.moveTarget ?? 0,
            switchIndex: c.switchIndex,
          }))
        : [{ type: "move", moveIndex: 0, moveTarget: 0 }, { type: "move", moveIndex: 0, moveTarget: 0 }];

      if (isP1) (battle as any).p1Choices = parsedChoices;
      else (battle as any).p2Choices = parsedChoices;

      if ((battle as any).p1Choices && (battle as any).p2Choices) {
        const p1c = (battle as any).p1Choices;
        const p2c = (battle as any).p2Choices;

        const newState = executeTurn(battle.state, p1c, p2c);
        battle.state = newState;
        delete (battle as any).p1Choices;
        delete (battle as any).p2Choices;

        const p1Sanitized = sanitizeState(newState, "p1");
        const p2Sanitized = sanitizeState(newState, "p2");
        battle.player1.ws.send(JSON.stringify({ type: "pvp_update", battleId, state: p1Sanitized }));
        battle.player2.ws.send(JSON.stringify({ type: "pvp_update", battleId, state: p2Sanitized }));

        if (newState.phase === "finished") {
          battle.player1.inBattle = false;
          battle.player2.inBattle = false;
          pvpBattles.delete(battleId);
        }
      } else {
        client.ws.send(JSON.stringify({ type: "move_submitted", battleId }));
      }
      break;
    }
  }
}

async function startPvPBattle(p1: PvPClient, p2: PvPClient) {
  try {
    const teamId1 = (p1 as any).queuedTeamId;
    const teamId2 = (p2 as any).queuedTeamId;

    const [team1, team2] = await Promise.all([
      db.select().from(teamsTable).where(eq(teamsTable.id, parseInt(teamId1))),
      db.select().from(teamsTable).where(eq(teamsTable.id, parseInt(teamId2))),
    ]);
    if (!team1[0] || !team2[0]) throw new Error("Team not found");

    const [allMoves, allPokes] = await Promise.all([
      db.select().from(movesTable),
      db.select().from(pokemonTable),
    ]);

    const movesMap = buildMovesMap(allMoves);
    const pokemonData: Record<string, any> = {};
    for (const p of allPokes) pokemonData[p.name] = p;

    const pTeam = teamSlotsToBattlePokemon(team1[0].slots as any[], pokemonData, movesMap);
    const oTeam = teamSlotsToBattlePokemon(team2[0].slots as any[], pokemonData, movesMap);

    const battleId = `pvp-${++pvpBattleId}`;
    const state = initBattle(pTeam, oTeam);

    state.log.push({ turn: 0, type: "activate", actor: "player", actorName: "Battle", message: `${p1.email} vs ${p2.email}!` });
    for (const idx of state.player.activeIndices) {
      if (idx >= 0) state.log.push({ turn: 0, type: "activate", actor: "player", actorName: p1.email, message: `Go! ${pTeam[idx].name}!` });
    }
    for (const idx of state.opponent.activeIndices) {
      if (idx >= 0) state.log.push({ turn: 0, type: "activate", actor: "opponent", actorName: p2.email, message: `Go! ${oTeam[idx].name}!` });
    }

    p1.inBattle = true;
    p2.inBattle = true;

    pvpBattles.set(battleId, { state, player1: p1, player2: p2 });

    p1.ws.send(JSON.stringify({ type: "pvp_start", battleId, state: sanitizeState(state, "p1"), opponent: p2.email }));
    p2.ws.send(JSON.stringify({ type: "pvp_start", battleId, state: sanitizeState(state, "p2"), opponent: p1.email }));
  } catch (err) {
    p1.ws.send(JSON.stringify({ type: "error", message: "Failed to start battle" }));
    p2.ws.send(JSON.stringify({ type: "error", message: "Failed to start battle" }));
  }
}

function sanitizeState(state: any, perspective: "p1" | "p2" = "p1") {
  const isP1 = perspective === "p1";
  const playerTeam = isP1 ? state.player.team : state.opponent.team;
  const opponentTeam = isP1 ? state.opponent.team : state.player.team;
  const playerIndices = isP1 ? state.player.activeIndices : state.opponent.activeIndices;
  const opponentIndices = isP1 ? state.opponent.activeIndices : state.player.activeIndices;

  return {
    phase: state.phase,
    turn: state.turn,
    winner: state.winner === "player"
      ? (isP1 ? "player" : "opponent")
      : state.winner === "opponent"
        ? (isP1 ? "opponent" : "player")
        : null,
    weather: state.weather,
    weatherTurns: state.weatherTurns,
    terrain: state.terrain,
    terrainTurns: state.terrainTurns,
    tailwind: isP1 ? state.tailwind : { player: state.tailwind.opponent, opponent: state.tailwind.player },
    trickRoom: state.trickRoom,
    trickRoomTurns: state.trickRoomTurns,
    player: {
      team: playerTeam.map((p: any) => ({
        name: p.name, dexNumber: p.dexNumber, types: p.types, ability: p.ability, item: p.item,
        currentHp: p.currentHp, maxHp: p.maxHp, stats: p.stats, moves: p.moves,
        isFainted: p.isFainted, status: p.status, statStages: p.statStages, perishTurns: p.perishTurns,
      })),
      activeIndices: playerIndices,
    },
    opponent: {
      team: opponentTeam.map((p: any) => ({
        name: p.name, dexNumber: p.dexNumber, types: p.types, ability: p.ability, item: p.item,
        currentHp: p.currentHp, maxHp: p.maxHp, stats: p.stats, moves: p.moves,
        isFainted: p.isFainted, status: p.status, statStages: p.statStages, perishTurns: p.perishTurns,
      })),
      activeIndices: opponentIndices,
    },
    log: state.log,
  };
}

server.listen(port, (err?: Error) => {
  if (err) { logger.error({ err }, "Error listening on port"); process.exit(1); }
  logger.info({ port }, "Server listening");
});
