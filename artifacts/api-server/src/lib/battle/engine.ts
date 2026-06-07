import {
  BattlePokemon, BattleMove, BattleState, BattleEvent, Stat,
  PlayerChoice, PlayerSide, MoveTarget, StatusCondition,
  getTypeEffectiveness, applyStatStage, clampStatStage,
} from "./types";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const LEVEL = 50;
const SPREAD_DAMAGE_MULT = 0.75;

// ── Stat helpers ──────────────────────────────────────────────────────────

function effectiveStat(mon: BattlePokemon, stat: Stat, state?: BattleState): number {
  const base = stat === "hp" ? mon.stats.hp : mon.stats[stat];
  const stage = mon.statStages[stat] ?? 0;
  let val = applyStatStage(base, stage);
  // Paralysis halves speed
  if (stat === "speed" && mon.status === "paralysis") val = Math.floor(val * 0.5);
  // Burn halves physical attack
  if (stat === "attack" && mon.status === "burn") val = Math.floor(val * 0.5);
  // Tailwind doubles speed
  if (stat === "speed" && state) {
    const side = state.player.team.includes(mon) ? state.tailwind.player : state.tailwind.opponent;
    if (side) val = Math.floor(val * 2);
  }
  return val;
}

// ── Damage calculation ────────────────────────────────────────────────────

function calcDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
  spread: boolean,
  state: BattleState,
): { damage: number; effectiveness: number; crit: boolean } {
  if (!move.power) return { damage: 0, effectiveness: 0, crit: false };

  const isPhysical = move.category === "physical";
  const atkStat: Stat = isPhysical ? "attack" : "specialAttack";
  const defStat: Stat = isPhysical ? "defense" : "specialDefense";

  const A = effectiveStat(attacker, atkStat, state);
  const D = effectiveStat(defender, defStat, state);
  const defRaw = Math.max(1, D);
  let power = move.power;

  if (spread) power = Math.floor(power * SPREAD_DAMAGE_MULT);

  if (attacker.ability === "Technician" && power <= 60) power = Math.floor(power * 1.5);

  if (isPhysical && attacker.ability === "Guts" && attacker.status !== "none")
    power = Math.floor(power * 1.5);

  if (attacker.item && ["life-orb", "Life Orb"].includes(attacker.item)) power = Math.floor(power * 1.3);

  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  if (effectiveness === 0) return { damage: 0, effectiveness: 0, crit: false };

  const critRoll = move.alwaysCrit ? 1 : rand(1, 24);
  const crit = critRoll === 1;
  const critMult = crit ? 1.5 : 1;

  const random = rand(85, 100) / 100;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;

  // Weather damage boosts
  let weatherMult = 1;
  if (state.weather === "sun" && move.type === "fire") weatherMult = 1.5;
  if (state.weather === "rain" && move.type === "water") weatherMult = 1.5;
  if (state.weather === "sun" && move.type === "water") weatherMult = 0.5;
  if (state.weather === "rain" && move.type === "fire") weatherMult = 0.5;

  // Terrain boosts
  let terrainMult = 1;
  if (state.terrain === "grassy" && move.type === "grass") terrainMult = 1.3;
  if (state.terrain === "psychic" && move.type === "psychic") terrainMult = 1.3;
  if (state.terrain === "electric" && move.type === "electric") terrainMult = 1.3;
  if (state.terrain === "misty" && move.type === "dragon") terrainMult = 0.5;

  const base = (((2 * LEVEL / 5 + 2) * power * (A / defRaw)) / 50 + 2);
  const damage = Math.floor(base * critMult * random * stab * effectiveness * weatherMult * terrainMult);

  return { damage: Math.max(1, damage), effectiveness, crit };
}

// ── Team utils ────────────────────────────────────────────────────────────

function getAliveIndices(team: BattlePokemon[]): number[] {
  return team.map((p, i) => (p.isFainted ? -1 : i)).filter((i) => i >= 0);
}

function isTeamDefeated(team: BattlePokemon[]): boolean {
  return team.every((p) => p.isFainted);
}

// ── Init battle ───────────────────────────────────────────────────────────

export function initBattle(
  playerTeam: BattlePokemon[],
  opponentTeam: BattlePokemon[],
  playerLeads?: number[],
  opponentLeads?: number[],
): BattleState {
  const pIndices = playerLeads ?? bringOutNext(playerTeam, [0, Math.min(1, playerTeam.length - 1)]);
  const oIndices = opponentLeads ?? bringOutNext(opponentTeam, [0, Math.min(1, opponentTeam.length - 1)]);

  for (const p of playerTeam) {
    p.turnsOnField = 0;
    p.protected = false;
    p.protectCount = 0;
    p.perishTurns = 0;
    p.statStages = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
    p.helpingHand = false;
    p.lockedMove = -1;
    p.status = p.status ?? "none";
    p.sleepTurns = p.sleepTurns ?? 0;
    p.toxicCounter = p.toxicCounter ?? 0;
  }
  for (const p of opponentTeam) {
    p.turnsOnField = 0;
    p.protected = false;
    p.protectCount = 0;
    p.perishTurns = 0;
    p.statStages = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
    p.helpingHand = false;
    p.lockedMove = -1;
    p.status = p.status ?? "none";
    p.sleepTurns = p.sleepTurns ?? 0;
    p.toxicCounter = p.toxicCounter ?? 0;
  }

  const state: BattleState = {
    phase: "active",
    player: { team: playerTeam, activeIndices: pIndices },
    opponent: { team: opponentTeam, activeIndices: oIndices },
    turn: 0,
    log: [],
    winner: null,
    weather: "none",
    weatherTurns: 0,
    terrain: "none",
    terrainTurns: 0,
    tailwind: { player: false, opponent: false },
    trickRoom: false,
    trickRoomTurns: 0,
  };

  // Trigger abilities on entry
  triggerEntryAbilities(state);

  return state;
}

function bringOutNext(team: BattlePokemon[], currentIndices: number[]): number[] {
  const alive = getAliveIndices(team);
  const result: number[] = [];
  for (const idx of currentIndices) {
    if (idx >= 0 && !team[idx].isFainted) {
      result.push(idx);
    } else {
      for (const a of alive) {
        if (!result.includes(a)) {
          result.push(a);
          break;
        }
      }
    }
  }
  return result.slice(0, 2);
}

// ── Entry abilities ───────────────────────────────────────────────────────

function triggerEntryAbilities(state: BattleState): void {
  // Player Intimidate
  for (const idx of state.player.activeIndices) {
    if (idx < 0) continue;
    const mon = state.player.team[idx];
    if (mon.ability === "Intimidate") {
      for (const oi of state.opponent.activeIndices) {
        if (oi < 0) continue;
        const opp = state.opponent.team[oi];
        if (opp.ability === "Clear Body" || opp.ability === "Full Metal Body" || opp.ability === "Hyper Cutter") {
          state.log.push(makeLog(state.turn, "activate", "player", mon.name, `${opp.name}'s ${opp.ability} prevents stat lowering!`));
        } else {
          changeStatStage(opp, "attack", -1);
          state.log.push(makeLog(state.turn, "stat-change", "player", mon.name, `${mon.name}'s Intimidate lowered ${opp.name}'s Attack!`));
        }
      }
    }
    if (mon.ability === "Intrepid Sword") {
      changeStatStage(mon, "attack", 1);
      state.log.push(makeLog(state.turn, "stat-change", "player", mon.name, `${mon.name}'s Intrepid Sword raised its Attack!`));
    }
    // Sand Stream, etc.
    if (mon.ability === "Sand Stream" && state.weather === "none") {
      state.weather = "sand";
      state.weatherTurns = 5;
      state.log.push(makeLog(state.turn, "activate", "player", mon.name, `${mon.name}'s Sand Stream whipped up a sandstorm!`));
    }
    if (mon.ability === "Drizzle" && state.weather === "none") {
      state.weather = "rain";
      state.weatherTurns = 5;
      state.log.push(makeLog(state.turn, "activate", "player", mon.name, `${mon.name}'s Drizzle summoned rain!`));
    }
    if (mon.ability === "Drought" && state.weather === "none") {
      state.weather = "sun";
      state.weatherTurns = 5;
      state.log.push(makeLog(state.turn, "activate", "player", mon.name, `${mon.name}'s Drought intensified the sunlight!`));
    }
  }

  // Opponent Intimidate
  for (const idx of state.opponent.activeIndices) {
    if (idx < 0) continue;
    const mon = state.opponent.team[idx];
    if (mon.ability === "Intimidate") {
      for (const pi of state.player.activeIndices) {
        if (pi < 0) continue;
        const opp = state.player.team[pi];
        if (opp.ability === "Clear Body" || opp.ability === "Full Metal Body" || opp.ability === "Hyper Cutter") {
          state.log.push(makeLog(state.turn, "activate", "opponent", mon.name, `${opp.name}'s ${opp.ability} prevents stat lowering!`));
        } else {
          changeStatStage(opp, "attack", -1);
          state.log.push(makeLog(state.turn, "stat-change", "opponent", mon.name, `${mon.name}'s Intimidate lowered ${opp.name}'s Attack!`));
        }
      }
    }
    if (mon.ability === "Intrepid Sword") {
      changeStatStage(mon, "attack", 1);
      state.log.push(makeLog(state.turn, "stat-change", "opponent", mon.name, `${mon.name}'s Intrepid Sword raised its Attack!`));
    }
    if (mon.ability === "Sand Stream" && state.weather === "none") {
      state.weather = "sand";
      state.weatherTurns = 5;
      state.log.push(makeLog(state.turn, "activate", "opponent", mon.name, `${mon.name}'s Sand Stream whipped up a sandstorm!`));
    }
  }

  // Terrain-setting abilities
  for (const side of ["player", "opponent"] as PlayerSide[]) {
    const team = side === "player" ? state.player : state.opponent;
    for (const idx of team.activeIndices) {
      if (idx < 0) continue;
      const mon = team.team[idx];
      if (mon.ability === "Grassy Surge" && state.terrain === "none") {
        state.terrain = "grassy";
        state.terrainTurns = 5;
        state.log.push(makeLog(state.turn, "activate", side, mon.name, `${mon.name}'s Grassy Surge covered the field in grass!`));
      }
      if (mon.ability === "Psychic Surge" && state.terrain === "none") {
        state.terrain = "psychic";
        state.terrainTurns = 5;
        state.log.push(makeLog(state.turn, "activate", side, mon.name, `${mon.name}'s Psychic Surge created a psychic field!`));
      }
      if (mon.ability === "Electric Surge" && state.terrain === "none") {
        state.terrain = "electric";
        state.terrainTurns = 5;
        state.log.push(makeLog(state.turn, "activate", side, mon.name, `${mon.name}'s Electric Surge electrified the terrain!`));
      }
      if (mon.ability === "Misty Surge" && state.terrain === "none") {
        state.terrain = "misty";
        state.terrainTurns = 5;
        state.log.push(makeLog(state.turn, "activate", side, mon.name, `${mon.name}'s Misty Surge created a mystical mist!`));
      }
    }
  }
}

function changeStatStage(mon: BattlePokemon, stat: Stat, stages: number): void {
  mon.statStages[stat] = clampStatStage((mon.statStages[stat] ?? 0) + stages);
}

// ── Full turn execution ───────────────────────────────────────────────────

interface TurnAction {
  actor: PlayerSide;
  slot: number;
  type: "move" | "switch";
  moveIndex?: number;
  moveTarget?: number;
  switchIndex?: number;
  mon: BattlePokemon;
  speed: number;
  priority: number;
  forceSwitch: boolean;
}

export function executeTurn(
  state: BattleState,
  playerChoices: PlayerChoice[],
  opponentChoices: PlayerChoice[],
): BattleState {
  const ns: BattleState = JSON.parse(JSON.stringify(state));
  ns.turn++;

  // Reset per-turn flags
  for (const p of ns.player.team) { p.protected = false; p.helpingHand = false; }
  for (const p of ns.opponent.team) { p.protected = false; p.helpingHand = false; }

  // Process switches first
  for (let s = 0; s < 2; s++) {
    const choice = playerChoices[s];
    if (choice.type === "switch" && choice.switchIndex !== undefined) {
      resolveSwitch(ns, "player", s, choice.switchIndex);
    }
  }
  for (let s = 0; s < 2; s++) {
    const choice = opponentChoices[s];
    if (choice.type === "switch" && choice.switchIndex !== undefined) {
      resolveSwitch(ns, "opponent", s, choice.switchIndex);
    }
  }

  // Build turn order from moves
  const actions: TurnAction[] = [];

  for (let s = 0; s < 2; s++) {
    const aidx = ns.player.activeIndices[s];
    if (aidx < 0) continue;
    const mon = ns.player.team[aidx];
    if (mon.isFainted) continue;
    const choice = playerChoices[s];
    if (choice.type === "switch") continue;

    let moveIdx = choice.moveIndex ?? 0;
    // Choice lock enforcement
    if (mon.lockedMove >= 0) {
      const lockedMv = mon.moves[mon.lockedMove];
      if (lockedMv && (lockedMv.pp ?? 0) > 0) {
        moveIdx = mon.lockedMove;
      } else {
        mon.lockedMove = -1;
      }
    }
    const move = mon.moves[moveIdx];
    if (!move || (move.pp ?? 0) <= 0) continue;

    // Sleep check
    if (mon.status === "sleep") {
      ns.log.push(makeLog(ns.turn, "activate", "player", mon.name, `${mon.name} is fast asleep!`));
      mon.sleepTurns--;
      if (mon.sleepTurns <= 0) {
        mon.status = "none";
        ns.log.push(makeLog(ns.turn, "status", "player", mon.name, `${mon.name} woke up!`));
      }
      continue;
    }

    // Freeze check
    if (mon.status === "freeze") {
      if (move.type === "fire" || move.name === "scald" || move.name === "flame-wheel" || move.name === "flare-blitz") {
        mon.status = "none";
        ns.log.push(makeLog(ns.turn, "status", "player", mon.name, `${mon.name} thawed out!`));
      } else if (rand(1, 5) === 1) {
        mon.status = "none";
        ns.log.push(makeLog(ns.turn, "status", "player", mon.name, `${mon.name} thawed out!`));
      } else {
        ns.log.push(makeLog(ns.turn, "activate", "player", mon.name, `${mon.name} is frozen solid!`));
        continue;
      }
    }

    // Paralysis full-para check (25%)
    if (mon.status === "paralysis" && rand(1, 4) === 1) {
      ns.log.push(makeLog(ns.turn, "activate", "player", mon.name, `${mon.name} is paralyzed! It can't move!`));
      continue;
    }

    // Choice lock enforcement
    let actualMoveIdx = moveIdx;
    if (mon.lockedMove >= 0) {
      const lockedMv = mon.moves[mon.lockedMove];
      if (lockedMv && (lockedMv.pp ?? 0) > 0) {
        actualMoveIdx = mon.lockedMove;
      } else {
        mon.lockedMove = -1;
      }
    }

    const spd = effectiveStat(mon, "speed", ns);
    actions.push({
      actor: "player", slot: s, type: "move",
      moveIndex: choice.moveIndex, moveTarget: choice.moveTarget,
      mon, speed: spd, priority: move.priority, forceSwitch: false,
    });
  }

  for (let s = 0; s < 2; s++) {
    const aidx = ns.opponent.activeIndices[s];
    if (aidx < 0) continue;
    const mon = ns.opponent.team[aidx];
    if (mon.isFainted) continue;
    const choice = opponentChoices[s];
    if (choice.type === "switch") continue;

    let moveIdx = choice.moveIndex ?? 0;
    if (mon.lockedMove >= 0) {
      const lockedMv = mon.moves[mon.lockedMove];
      if (lockedMv && (lockedMv.pp ?? 0) > 0) {
        moveIdx = mon.lockedMove;
      } else {
        mon.lockedMove = -1;
      }
    }
    const move = mon.moves[moveIdx];
    if (!move || (move.pp ?? 0) <= 0) continue;

    if (mon.status === "sleep") {
      ns.log.push(makeLog(ns.turn, "activate", "opponent", mon.name, `${mon.name} is fast asleep!`));
      mon.sleepTurns--;
      if (mon.sleepTurns <= 0) {
        mon.status = "none";
        ns.log.push(makeLog(ns.turn, "status", "opponent", mon.name, `${mon.name} woke up!`));
      }
      continue;
    }
    if (mon.status === "freeze") {
      if (move.type === "fire" || move.name === "scald" || move.name === "flame-wheel" || move.name === "flare-blitz") {
        mon.status = "none";
        ns.log.push(makeLog(ns.turn, "status", "opponent", mon.name, `${mon.name} thawed out!`));
      } else if (rand(1, 5) === 1) {
        mon.status = "none";
        ns.log.push(makeLog(ns.turn, "status", "opponent", mon.name, `${mon.name} thawed out!`));
      } else {
        ns.log.push(makeLog(ns.turn, "activate", "opponent", mon.name, `${mon.name} is frozen solid!`));
        continue;
      }
    }
    if (mon.status === "paralysis" && rand(1, 4) === 1) {
      ns.log.push(makeLog(ns.turn, "activate", "opponent", mon.name, `${mon.name} is paralyzed! It can't move!`));
      continue;
    }

    const spd = effectiveStat(mon, "speed", ns);
    actions.push({
      actor: "opponent", slot: s, type: "move",
      moveIndex: choice.moveIndex, moveTarget: choice.moveTarget,
      mon, speed: spd, priority: move.priority, forceSwitch: false,
    });
  }

  // Sort: if Trick Room is active, slower goes first; otherwise faster goes first
  actions.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (ns.trickRoom) return a.speed - b.speed;
    return b.speed - a.speed;
  });

  // Execute moves
  for (const action of actions) {
    if (action.mon.isFainted) continue;
    const move = action.mon.moves[action.moveIndex!];
    if (!move || (move.pp ?? 0) <= 0) continue;

    // Consume PP
    move.pp = Math.max(0, (move.pp ?? 0) - 1);

    executeMove(ns, action);

    // Handle forced switches (Parting Shot, U-turn, Volt Switch, Flip Turn)
    if (!action.mon.isFainted && action.forceSwitch) {
      const side = action.actor === "player" ? ns.player : ns.opponent;
      const alive = getAliveIndices(side.team).filter(n => !side.activeIndices.includes(n));
      if (alive.length > 0) {
        resolveSwitch(ns, action.actor, action.slot, alive[0]);
      }
    }
  }

  // Increment turns on field
  for (const i of ns.player.activeIndices) if (i >= 0) ns.player.team[i].turnsOnField++;
  for (const i of ns.opponent.activeIndices) if (i >= 0) ns.opponent.team[i].turnsOnField++;

  // End-of-turn effects
  handleEndOfTurn(ns);

  // Handle faints and bring in replacements
  handleFaints(ns);

  // Decrement field condition timers
  if (ns.weatherTurns > 0) { ns.weatherTurns--; if (ns.weatherTurns === 0) { ns.weather = "none"; ns.log.push(makeLog(ns.turn, "activate", "player", "Weather", "The weather returned to normal.")); } }
  if (ns.terrainTurns > 0) { ns.terrainTurns--; if (ns.terrainTurns === 0) { ns.terrain = "none"; ns.log.push(makeLog(ns.turn, "activate", "player", "Terrain", "The terrain returned to normal.")); } }
  if (ns.trickRoomTurns > 0) { ns.trickRoomTurns--; if (ns.trickRoomTurns === 0) { ns.trickRoom = false; ns.log.push(makeLog(ns.turn, "activate", "player", "Trick Room", "The twisted dimensions returned to normal!")); } }
  if (ns.tailwind.player) { ns.tailwind.player = false; ns.log.push(makeLog(ns.turn, "activate", "player", "Tailwind", "Your team's Tailwind petered out!")); }
  if (ns.tailwind.opponent) { ns.tailwind.opponent = false; ns.log.push(makeLog(ns.turn, "activate", "opponent", "Tailwind", "The opposing team's Tailwind petered out!")); }

  // Check win
  if (isTeamDefeated(ns.player.team)) { ns.phase = "finished"; ns.winner = "opponent"; }
  else if (isTeamDefeated(ns.opponent.team)) { ns.phase = "finished"; ns.winner = "player"; }

  return ns;
}

function resolveSwitch(state: BattleState, side: PlayerSide, slot: number, newIdx: number): void {
  const team = side === "player" ? state.player : state.opponent;
  const oldIdx = team.activeIndices[slot];
  if (oldIdx >= 0) {
    const old = team.team[oldIdx];
    old.statStages = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
    old.protected = false;
    old.protectCount = 0;
    old.helpingHand = false;
    old.turnsOnField = 0;
    old.perishTurns = 0;
  }
  team.activeIndices[slot] = newIdx;
  const newcomer = team.team[newIdx];
  newcomer.turnsOnField = 0;
  state.log.push(makeLog(state.turn, "switch", side, "Trainer", `${side === "player" ? "You" : "Opponent"} sent out ${newcomer.name}!`));

  // Check entry abilities for the newcomer
  if (newcomer.ability === "Intimidate") {
    const otherTeam = side === "player" ? state.opponent : state.player;
    const otherSide = side === "player" ? "opponent" : "player";
    for (const oi of otherTeam.activeIndices) {
      if (oi < 0) continue;
      const opp = otherTeam.team[oi];
      if (opp.ability === "Clear Body" || opp.ability === "Full Metal Body" || opp.ability === "Hyper Cutter") {
        state.log.push(makeLog(state.turn, "activate", side, newcomer.name, `${opp.name}'s ${opp.ability} prevents stat lowering!`));
      } else {
        changeStatStage(opp, "attack", -1);
        state.log.push(makeLog(state.turn, "stat-change", side, newcomer.name, `${newcomer.name}'s Intimidate lowered ${opp.name}'s Attack!`));
      }
    }
  }
  if (newcomer.ability === "Sand Stream" && state.weather === "none") {
    state.weather = "sand"; state.weatherTurns = 5;
    state.log.push(makeLog(state.turn, "activate", side, newcomer.name, `${newcomer.name}'s Sand Stream whipped up a sandstorm!`));
  }
}

// ── Execute a single move ─────────────────────────────────────────────────

function checkPivotMove(state: BattleState, action: TurnAction, move: BattleMove): void {
  if (["u-turn", "volt-switch", "flip-turn"].includes(move.name)) {
    const side = action.actor === "player" ? state.player : state.opponent;
    const alive = getAliveIndices(side.team).filter(n => !side.activeIndices.includes(n));
    if (alive.length > 0) {
      action.forceSwitch = true;
    }
  }
}

function executeMove(state: BattleState, action: TurnAction): void {
  const move = action.mon.moves[action.moveIndex!];
  const attacker = action.mon;
  if (!move || attacker.isFainted) return;

  const opponents = action.actor === "player" ? state.opponent : state.player;
  const allies = action.actor === "player" ? state.player : state.opponent;
  const ownSide: PlayerSide = action.actor;

  if (move.category === "status") {
    handleStatusMove(state, action, allies, ownSide);
    return;
  }

  if (move.target === "all-opponents" || move.target === "all-adjacent" || move.target === "all-others") {
    const targets: { mon: BattlePokemon; isAlly: boolean }[] = [];
    for (const ai of opponents.activeIndices) {
      if (ai >= 0 && !opponents.team[ai].isFainted) {
        targets.push({ mon: opponents.team[ai], isAlly: false });
      }
    }
    if (move.target === "all-adjacent" || move.target === "all-others") {
      for (const ai of allies.activeIndices) {
        if (ai >= 0 && allies.team[ai] !== attacker && !allies.team[ai].isFainted) {
          targets.push({ mon: allies.team[ai], isAlly: true });
        }
      }
    }
    for (const t of targets) {
      applyDamageToTarget(state, action, t.mon, true);
    }
    checkPivotMove(state, action, move);
    return;
  }

  if (move.target === "ally" || move.target === "user-or-ally") {
    const targetSlot = action.moveTarget ?? (action.slot === 0 ? 1 : 0);
    const ally = allies.activeIndices[targetSlot];
    if (ally !== undefined && ally >= 0 && !allies.team[ally].isFainted) {
      applyDamageToTarget(state, action, allies.team[ally], false);
    }
    checkPivotMove(state, action, move);
    return;
  }

  if (move.target === "self" || move.target === "user") {
    applyDamageToTarget(state, action, attacker, false);
    checkPivotMove(state, action, move);
    return;
  }

  // Single-target move: use player's chosen target
  let targetMon: BattlePokemon | null = null;
  const defTeam = opponents.team;
  const defActive = opponents.activeIndices;

  if (defActive.length >= 1) {
    const chosenTargetSlot = action.moveTarget ?? action.slot;
    // If the chosen target is available and alive, use it
    if (chosenTargetSlot < defActive.length) {
      const defIdx = defActive[chosenTargetSlot];
      if (defIdx >= 0 && !defTeam[defIdx].isFainted) {
        targetMon = defTeam[defIdx];
      }
    }
    // Fallback: find any alive opponent
    if (!targetMon) {
      for (const ai of defActive) {
        if (ai >= 0 && !defTeam[ai].isFainted) {
          targetMon = defTeam[ai];
          break;
        }
      }
    }
  }

  if (targetMon) {
    applyDamageToTarget(state, action, targetMon, false);
    checkPivotMove(state, action, move);
  }
}

function applyDamageToTarget(
  state: BattleState,
  action: TurnAction,
  defender: BattlePokemon,
  spread: boolean,
): void {
  const move = action.mon.moves[action.moveIndex!];
  const attacker = action.mon;
  if (!move) return;

  if (defender.protected) {
    state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${defender.name} protected itself!`));
    return;
  }

  if (move.name === "fake-out" && attacker.turnsOnField > 0) {
    state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${move.displayName} failed — only works on the first turn!`));
    return;
  }

  // Accuracy check
  if (move.accuracy !== null && move.accuracy < 100) {
    if (rand(1, 100) > move.accuracy) {
      state.log.push(makeLog(state.turn, "miss", action.actor, attacker.name, `${attacker.name} used ${move.displayName}... but it missed ${defender.name}!`));
      return;
    }
  }

  const { damage, effectiveness, crit } = calcDamage(attacker, defender, move, spread, state);

  if (effectiveness === 0) {
    state.log.push(makeLog(state.turn, "immune", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! It doesn't affect ${defender.name}...`));
    return;
  }

  // Focus Sash: survive at 1 HP
  let actualDamage = damage;
  const isSash = defender.item && (defender.item === "Focus Sash" || defender.item === "focus-sash");
  if (isSash && defender.currentHp === defender.maxHp && actualDamage >= defender.currentHp) {
    actualDamage = defender.currentHp - 1;
    state.log.push(makeLog(state.turn, "activate", action.actor, defender.name, `${defender.name} hung on with its Focus Sash!`));
  }

  defender.currentHp = Math.max(0, defender.currentHp - actualDamage);

  let msg = `${attacker.name} used ${move.displayName}!`;
  if (crit) msg += " A critical hit!";
  if (effectiveness >= 2) msg += " It's super effective!";
  if (effectiveness > 0 && effectiveness < 1) msg += " It's not very effective...";
  msg += ` (${actualDamage} damage to ${defender.name})`;

  state.log.push(makeLog(state.turn, "damage", action.actor, attacker.name, msg, { damage: actualDamage, target: defender.name }));

  // Life Orb recoil
  if (attacker.item && (attacker.item === "Life Orb" || attacker.item === "life-orb")) {
    const recoil = Math.max(1, Math.floor(attacker.maxHp / 10));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
    state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} lost some HP from Life Orb!`));
    if (attacker.currentHp <= 0) {
      attacker.isFainted = true;
      state.log.push(makeLog(state.turn, "ko", action.actor, attacker.name, `${attacker.name} fainted!`));
    }
  }

  // Drain healing
  if (move.drain && actualDamage > 0) {
    const heal = Math.max(1, Math.floor(actualDamage * move.drain));
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
    state.log.push(makeLog(state.turn, "heal", action.actor, attacker.name, `${attacker.name} restored ${heal} HP!`));
  }

  // Recoil
  const recoilPct = move.recoil ?? 0;
  if (recoilPct > 0 && actualDamage > 0) {
    const recoil = Math.max(1, Math.floor(actualDamage * recoilPct));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
    state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} is damaged by recoil!`));
    if (attacker.currentHp <= 0) {
      attacker.isFainted = true;
      state.log.push(makeLog(state.turn, "ko", action.actor, attacker.name, `${attacker.name} fainted!`));
    }
  }

  // Secondary effects on defender
  if (!defender.isFainted && actualDamage > 0) {
    applyMoveEffects(state, action, defender, move);
  }

  // Self stat drops (e.g. Close Combat, Superpower)
  if (move.selfDrop && attacker.currentHp > 0) {
    changeStatStage(attacker, move.selfDrop.stat, move.selfDrop.stages);
    const dir = move.selfDrop.stages > 0 ? "rose" : "fell";
    state.log.push(makeLog(state.turn, "stat-change", action.actor, attacker.name, `${attacker.name}'s ${move.selfDrop.stat} ${dir}!`));
  }

  // Self stat boosts
  if (move.selfBoost && attacker.currentHp > 0) {
    changeStatStage(attacker, move.selfBoost.stat, move.selfBoost.stages);
    const dir = move.selfBoost.stages > 0 ? "rose" : "fell";
    state.log.push(makeLog(state.turn, "stat-change", action.actor, attacker.name, `${attacker.name}'s ${move.selfBoost.stat} ${dir}!`));
  }

  // Sitrus Berry: heal 25% when below 50%
  if (defender.currentHp > 0 && defender.currentHp < Math.floor(defender.maxHp / 2)) {
    if (defender.item && (defender.item === "Sitrus Berry" || defender.item === "sitrus-berry")) {
      const heal = Math.floor(defender.maxHp / 4);
      defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
      defender.item = "";
      state.log.push(makeLog(state.turn, "heal", action.actor, defender.name, `${defender.name} ate its Sitrus Berry and restored HP!`));
    }
  }

  // Weakness Policy
  if (effectiveness >= 2 && defender.currentHp > 0) {
    if (defender.item && (defender.item === "Weakness Policy" || defender.item === "weakness-policy")) {
      changeStatStage(defender, "attack", 2);
      changeStatStage(defender, "specialAttack", 2);
      defender.item = "";
      state.log.push(makeLog(state.turn, "stat-change", action.actor, defender.name, `${defender.name}'s Weakness Policy sharply raised its Attack and Sp. Atk!`));
    }
  }

  // Check faint
  if (defender.currentHp <= 0) {
    defender.currentHp = 0;
    defender.isFainted = true;
    state.log.push(makeLog(state.turn, "ko", action.actor, attacker.name, `${defender.name} fainted!`));
  }
}

function applyMoveEffects(state: BattleState, action: TurnAction, defender: BattlePokemon, move: BattleMove): void {
  // Flinch
  if (move.flinchChance && rand(1, 100) <= move.flinchChance) {
    // Flinch is applied but won't matter this turn (already moved)
    state.log.push(makeLog(state.turn, "activate", action.actor, action.mon.name, `${defender.name} flinched!`));
  }

  // Burn
  if (move.burnChance && defender.status === "none" && rand(1, 100) <= move.burnChance) {
    if (!defender.types.includes("fire")) {
      defender.status = "burn";
      state.log.push(makeLog(state.turn, "status", action.actor, action.mon.name, `${defender.name} was burned!`));
    }
  }

  // Paralysis
  if (move.paralysisChance && defender.status === "none" && rand(1, 100) <= move.paralysisChance) {
    if (!defender.types.includes("electric")) {
      defender.status = "paralysis";
      state.log.push(makeLog(state.turn, "status", action.actor, action.mon.name, `${defender.name} is paralyzed! It may be unable to move!`));
    }
  }

  // Poison
  if (move.poisonChance && defender.status === "none" && rand(1, 100) <= move.poisonChance) {
    if (!defender.types.includes("poison") && !defender.types.includes("steel")) {
      defender.status = "poison";
      state.log.push(makeLog(state.turn, "status", action.actor, action.mon.name, `${defender.name} was poisoned!`));
    }
  }

  // Sleep
  if (move.sleepChance && defender.status === "none" && rand(1, 100) <= move.sleepChance) {
    defender.status = "sleep";
    defender.sleepTurns = rand(1, 3);
    state.log.push(makeLog(state.turn, "status", action.actor, action.mon.name, `${defender.name} fell asleep!`));
  }

  // Freeze
  if (move.freezeChance && defender.status === "none" && rand(1, 100) <= move.freezeChance) {
    if (!defender.types.includes("ice")) {
      defender.status = "freeze";
      state.log.push(makeLog(state.turn, "status", action.actor, action.mon.name, `${defender.name} was frozen solid!`));
    }
  }

  // Target stat drops
  if (move.targetDrop && rand(1, 100) <= move.targetDrop.chance) {
    changeStatStage(defender, move.targetDrop.stat, move.targetDrop.stages);
    const dir = move.targetDrop.stages > 0 ? "rose" : "fell";
    state.log.push(makeLog(state.turn, "stat-change", action.actor, action.mon.name, `${defender.name}'s ${move.targetDrop.stat} ${dir}!`));
  }
}

// ── Status moves ──────────────────────────────────────────────────────────

function handleStatusMove(state: BattleState, action: TurnAction, allies: typeof state.player, ownSide: PlayerSide): void {
  const move = action.mon.moves[action.moveIndex!];
  const attacker = action.mon;
  if (!move) return;

  // Protection moves — consecutive use reduces success chance
  if (["protect", "wide-guard", "quick-guard", "kings-shield", "spiky-shield", "baneful-bunker"].includes(move.name)) {
    const count = attacker.protectCount ?? 0;
    const successChance = count === 0 ? 100 : count === 1 ? 50 : count === 2 ? 33 : 25;
    if (rand(1, 100) <= successChance) {
      attacker.protected = true;
      attacker.protectCount = count + 1;
      state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! It protected itself!`));
    } else {
      state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! But it failed!`));
    }
    return;
  }

  // Follow Me / Rage Powder (redirection)
  if (move.name === "follow-me" || move.name === "rage-powder") {
    state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! It draws attention!`));
    return;
  }

  // Tailwind
  if (move.name === "tailwind") {
    if (ownSide === "player") state.tailwind.player = true;
    else state.tailwind.opponent = true;
    state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! The Tailwind blows from behind!`));
    return;
  }

  // Trick Room
  if (move.name === "trick-room") {
    if (state.trickRoom) {
      state.trickRoom = false;
      state.trickRoomTurns = 0;
      state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! The twisted dimensions returned to normal!`));
    } else {
      state.trickRoom = true;
      state.trickRoomTurns = 5;
      state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! The dimensions were twisted!`));
    }
    return;
  }

  // Helping Hand
  if (move.name === "helping-hand") {
    const targetSlot = action.moveTarget ?? (action.slot === 0 ? 1 : 0);
    const allyIdx = allies.activeIndices[targetSlot];
    if (allyIdx !== undefined && allyIdx >= 0 && !allies.team[allyIdx].isFainted) {
      allies.team[allyIdx].helpingHand = true;
      state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} used Helping Hand on ${allies.team[allyIdx].name}!`));
    }
    return;
  }

  // Stat-boosting moves (simplified: check known self-boosting status moves)
  const boostMoves: Record<string, { stat: Stat; stages: number }[]> = {
    "swords-dance": [{ stat: "attack", stages: 2 }],
    "nasty-plot": [{ stat: "specialAttack", stages: 2 }],
    "calm-mind": [{ stat: "specialAttack", stages: 1 }, { stat: "specialDefense", stages: 1 }],
    "dragon-dance": [{ stat: "attack", stages: 1 }, { stat: "speed", stages: 1 }],
    "iron-defense": [{ stat: "defense", stages: 2 }],
    "agility": [{ stat: "speed", stages: 2 }],
    "bulk-up": [{ stat: "attack", stages: 1 }, { stat: "defense", stages: 1 }],
    "quiver-dance": [{ stat: "specialAttack", stages: 1 }, { stat: "specialDefense", stages: 1 }, { stat: "speed", stages: 1 }],
  };

  const boosts = boostMoves[move.name];
  if (boosts) {
    for (const b of boosts) {
      changeStatStage(attacker, b.stat, b.stages);
    }
    const desc = boosts.map(b => `${b.stat}`).join(", ");
    state.log.push(makeLog(state.turn, "stat-change", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! ${attacker.name}'s ${desc} rose!`));
    return;
  }

  // Healing moves
  if (move.name === "recover" || move.name === "slack-off" || move.name === "moonlight" || move.name === "synthesis" || move.name === "wish") {
    const heal = Math.floor(attacker.maxHp / 2);
    const healed = Math.min(heal, attacker.maxHp - attacker.currentHp);
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
    state.log.push(makeLog(state.turn, "heal", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! Restored ${healed} HP!`));
    return;
  }

  // Will-O-Wisp, Thunder Wave, Spore, Toxic, etc.
  if (move.name === "will-o-wisp") {
    const targetSlot = action.moveTarget ?? action.slot;
    const defTeam = action.actor === "player" ? state.opponent : state.player;
    const defIdx = defTeam.activeIndices[targetSlot];
    if (defIdx !== undefined && defIdx >= 0 && !defTeam.team[defIdx].isFainted) {
      const target = defTeam.team[defIdx];
      if (target.status === "none" && !target.types.includes("fire")) {
        target.status = "burn";
        state.log.push(makeLog(state.turn, "status", action.actor, attacker.name, `${target.name} was burned!`));
      } else {
        state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${move.displayName} failed!`));
      }
    }
    return;
  }

  if (move.name === "thunder-wave") {
    const targetSlot = action.moveTarget ?? action.slot;
    const defTeam = action.actor === "player" ? state.opponent : state.player;
    const defIdx = defTeam.activeIndices[targetSlot];
    if (defIdx !== undefined && defIdx >= 0 && !defTeam.team[defIdx].isFainted) {
      const target = defTeam.team[defIdx];
      if (target.status === "none" && !target.types.includes("electric")) {
        target.status = "paralysis";
        state.log.push(makeLog(state.turn, "status", action.actor, attacker.name, `${target.name} is paralyzed! It may be unable to move!`));
      } else {
        state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${move.displayName} failed!`));
      }
    }
    return;
  }

  if (move.name === "spore" || move.name === "sleep-powder") {
    const targetSlot = action.moveTarget ?? action.slot;
    const defTeam = action.actor === "player" ? state.opponent : state.player;
    const defIdx = defTeam.activeIndices[targetSlot];
    if (defIdx !== undefined && defIdx >= 0 && !defTeam.team[defIdx].isFainted) {
      const target = defTeam.team[defIdx];
      if (target.status === "none" && !target.types.includes("grass") && target.ability !== "Overcoat") {
        target.status = "sleep";
        target.sleepTurns = rand(1, 3);
        state.log.push(makeLog(state.turn, "status", action.actor, attacker.name, `${target.name} fell asleep!`));
      } else {
        state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${move.displayName} failed!`));
      }
    }
    return;
  }

  if (move.name === "toxic") {
    const targetSlot = action.moveTarget ?? action.slot;
    const defTeam = action.actor === "player" ? state.opponent : state.player;
    const defIdx = defTeam.activeIndices[targetSlot];
    if (defIdx !== undefined && defIdx >= 0 && !defTeam.team[defIdx].isFainted) {
      const target = defTeam.team[defIdx];
      if (target.status === "none" && !target.types.includes("poison") && !target.types.includes("steel")) {
        target.status = "badly-poison";
        target.toxicCounter = 1;
        state.log.push(makeLog(state.turn, "status", action.actor, attacker.name, `${target.name} was badly poisoned!`));
      } else {
        state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${move.displayName} failed!`));
      }
    }
    return;
  }

  // Nuzzle (always paralyzes)
  if (move.name === "nuzzle") {
    const targetSlot = action.moveTarget ?? action.slot;
    const defTeam = action.actor === "player" ? state.opponent : state.player;
    const defIdx = defTeam.activeIndices[targetSlot];
    if (defIdx !== undefined && defIdx >= 0 && !defTeam.team[defIdx].isFainted) {
      const target = defTeam.team[defIdx];
      if (target.status === "none" && !target.types.includes("electric")) {
        target.status = "paralysis";
        state.log.push(makeLog(state.turn, "status", action.actor, attacker.name, `${target.name} is paralyzed! It may be unable to move!`));
      } else {
        state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `But ${target.name} can't be paralyzed!`));
      }
    }
    return;
  }

  // Super Fang
  if (move.name === "super-fang") {
    const targetSlot = action.moveTarget ?? action.slot;
    const defTeam = action.actor === "player" ? state.opponent : state.player;
    const defIdx = defTeam.activeIndices[targetSlot];
    if (defIdx !== undefined && defIdx >= 0 && !defTeam.team[defIdx].isFainted) {
      const target = defTeam.team[defIdx];
      const dmg = Math.max(1, Math.floor(target.currentHp / 2));
      target.currentHp = Math.max(0, target.currentHp - dmg);
      state.log.push(makeLog(state.turn, "damage", action.actor, attacker.name, `${attacker.name} used Super Fang! (${dmg} damage to ${target.name})`));
      if (target.currentHp <= 0) {
        target.isFainted = true;
        state.log.push(makeLog(state.turn, "ko", action.actor, attacker.name, `${target.name} fainted!`));
      }
    }
    return;
  }

  // Parting Shot: lower target's Atk/SpA by 1, then user switches out
  if (move.name === "parting-shot") {
    const targetSlot = action.moveTarget ?? action.slot;
    const defTeam = action.actor === "player" ? state.opponent : state.player;
    const defIdx = defTeam.activeIndices[targetSlot];
    if (defIdx !== undefined && defIdx >= 0 && !defTeam.team[defIdx].isFainted) {
      const target = defTeam.team[defIdx];
      if (target.ability === "Clear Body" || target.ability === "Full Metal Body") {
        state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${target.name}'s ${target.ability} prevents stat lowering!`));
      } else {
        changeStatStage(target, "attack", -1);
        changeStatStage(target, "specialAttack", -1);
        state.log.push(makeLog(state.turn, "stat-change", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! ${target.name}'s Attack and Sp. Atk fell!`));
      }
    }
    // Force user to switch out
    action.forceSwitch = true;
    return;
  }

  // Perish Song: sets a 4-turn doom counter on all active Pokemon
  if (move.name === "perish-song") {
    const allActive = [...state.player.activeIndices, ...state.opponent.activeIndices];
    for (const aidx of [state.player.activeIndices[0], state.player.activeIndices[1], state.opponent.activeIndices[0], state.opponent.activeIndices[1]]) {
      if (aidx < 0) continue;
      const side = state.player.activeIndices.includes(aidx) ? state.player : state.opponent;
      const mon = side.team[aidx];
      if (mon.perishTurns === 0) {
        mon.perishTurns = 4;
      }
    }
    state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} used ${move.displayName}! All Pokemon will faint in 4 turns!`));
    return;
  }

  // U-turn / Volt Switch / Flip Turn (pivot moves, damaging — handled in damage path)
  // These are physical/special, not status — they'll go through applyDamageToTarget

  // Default fallback
  state.log.push(makeLog(state.turn, "activate", action.actor, attacker.name, `${attacker.name} used ${move.displayName}!`));
}

// ── End of turn effects ───────────────────────────────────────────────────

function handleEndOfTurn(state: BattleState): void {
  // Sandstorm damage
  if (state.weather === "sand") {
    for (const idx of state.player.activeIndices) {
      if (idx < 0) continue;
      const mon = state.player.team[idx];
      if (mon.isFainted) continue;
      if (mon.ability === "Sand Stream" || mon.ability === "Sand Rush" || mon.ability === "Sand Veil" || mon.ability === "Sand Force") continue;
      if (mon.types.includes("rock") || mon.types.includes("ground") || mon.types.includes("steel")) continue;
      const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      state.log.push(makeLog(state.turn, "damage", "player", mon.name, `${mon.name} is buffeted by the sandstorm!`));
      if (mon.currentHp <= 0) { mon.isFainted = true; state.log.push(makeLog(state.turn, "ko", "player", mon.name, `${mon.name} fainted!`)); }
    }
    for (const idx of state.opponent.activeIndices) {
      if (idx < 0) continue;
      const mon = state.opponent.team[idx];
      if (mon.isFainted) continue;
      if (mon.ability === "Sand Stream" || mon.ability === "Sand Rush" || mon.ability === "Sand Veil" || mon.ability === "Sand Force") continue;
      if (mon.types.includes("rock") || mon.types.includes("ground") || mon.types.includes("steel")) continue;
      const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      state.log.push(makeLog(state.turn, "damage", "opponent", mon.name, `${mon.name} is buffeted by the sandstorm!`));
      if (mon.currentHp <= 0) { mon.isFainted = true; state.log.push(makeLog(state.turn, "ko", "opponent", mon.name, `${mon.name} fainted!`)); }
    }
  }

  // Burn damage
  for (const idx of state.player.activeIndices) {
    if (idx < 0) continue;
    const mon = state.player.team[idx];
    if (mon.isFainted) continue;
    if (mon.status === "burn") {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      state.log.push(makeLog(state.turn, "damage", "player", mon.name, `${mon.name} is hurt by its burn!`));
      if (mon.currentHp <= 0) { mon.isFainted = true; state.log.push(makeLog(state.turn, "ko", "player", mon.name, `${mon.name} fainted!`)); }
    }
  }
  for (const idx of state.opponent.activeIndices) {
    if (idx < 0) continue;
    const mon = state.opponent.team[idx];
    if (mon.isFainted) continue;
    if (mon.status === "burn") {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      state.log.push(makeLog(state.turn, "damage", "opponent", mon.name, `${mon.name} is hurt by its burn!`));
      if (mon.currentHp <= 0) { mon.isFainted = true; state.log.push(makeLog(state.turn, "ko", "opponent", mon.name, `${mon.name} fainted!`)); }
    }
  }

  // Poison damage
  for (const idx of state.player.activeIndices) {
    if (idx < 0) continue;
    const mon = state.player.team[idx];
    if (mon.isFainted) continue;
    if (mon.status === "poison") {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 8));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      state.log.push(makeLog(state.turn, "damage", "player", mon.name, `${mon.name} is hurt by poison!`));
      if (mon.currentHp <= 0) { mon.isFainted = true; state.log.push(makeLog(state.turn, "ko", "player", mon.name, `${mon.name} fainted!`)); }
    }
    if (mon.status === "badly-poison") {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 16) * (mon.toxicCounter ?? 1));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      mon.toxicCounter++;
      state.log.push(makeLog(state.turn, "damage", "player", mon.name, `${mon.name} is hurt by the toxic poison!`));
      if (mon.currentHp <= 0) { mon.isFainted = true; state.log.push(makeLog(state.turn, "ko", "player", mon.name, `${mon.name} fainted!`)); }
    }
  }
  for (const idx of state.opponent.activeIndices) {
    if (idx < 0) continue;
    const mon = state.opponent.team[idx];
    if (mon.isFainted) continue;
    if (mon.status === "poison") {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 8));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      state.log.push(makeLog(state.turn, "damage", "opponent", mon.name, `${mon.name} is hurt by poison!`));
      if (mon.currentHp <= 0) { mon.isFainted = true; state.log.push(makeLog(state.turn, "ko", "opponent", mon.name, `${mon.name} fainted!`)); }
    }
    if (mon.status === "badly-poison") {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 16) * (mon.toxicCounter ?? 1));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      mon.toxicCounter++;
      state.log.push(makeLog(state.turn, "damage", "opponent", mon.name, `${mon.name} is hurt by the toxic poison!`));
      if (mon.currentHp <= 0) { mon.isFainted = true; state.log.push(makeLog(state.turn, "ko", "opponent", mon.name, `${mon.name} fainted!`)); }
    }
  }

  // Leftovers healing
  for (const idx of [...state.player.activeIndices, ...state.opponent.activeIndices]) {
    if (idx < 0) continue;
    const isPlayer = state.player.activeIndices.includes(idx);
    const mon = isPlayer ? state.player.team[idx] : state.opponent.team[idx];
    if (mon.isFainted) continue;
    const itemName = mon.item?.toLowerCase()?.replace(/\s+/g, "-");
    if (itemName === "leftovers") {
      const heal = Math.max(1, Math.floor(mon.maxHp / 16));
      const actualHeal = Math.min(heal, mon.maxHp - mon.currentHp);
      mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
      if (actualHeal > 0) {
        state.log.push(makeLog(state.turn, "heal", isPlayer ? "player" : "opponent", mon.name, `${mon.name} restored a little HP from Leftovers!`));
      }
    }
  }

  // Grassy Terrain healing
  if (state.terrain === "grassy") {
    for (const idx of [...state.player.activeIndices, ...state.opponent.activeIndices]) {
      if (idx < 0) continue;
      const isPlayer = state.player.activeIndices.includes(idx);
      const mon = isPlayer ? state.player.team[idx] : state.opponent.team[idx];
      if (mon.isFainted) continue;
      if (mon.types.includes("flying") || mon.ability === "Levitate") continue;
      const heal = Math.max(1, Math.floor(mon.maxHp / 16));
      mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
      state.log.push(makeLog(state.turn, "heal", isPlayer ? "player" : "opponent", mon.name, `${mon.name} restored HP from Grassy Terrain!`));
    }
  }

  // Perish Song countdown
  for (const idx of [...state.player.activeIndices, ...state.opponent.activeIndices]) {
    if (idx < 0) continue;
    const isPlayer = state.player.activeIndices.includes(idx);
    const mon = isPlayer ? state.player.team[idx] : state.opponent.team[idx];
    if (mon.isFainted) continue;
    if (mon.perishTurns > 0) {
      mon.perishTurns--;
      if (mon.perishTurns <= 0) {
        mon.currentHp = 0;
        mon.isFainted = true;
        state.log.push(makeLog(state.turn, "ko", isPlayer ? "player" : "opponent", mon.name, `${mon.name}'s Perish Song count reached zero! ${mon.name} fainted!`));
      } else {
        state.log.push(makeLog(state.turn, "activate", isPlayer ? "player" : "opponent", mon.name, `${mon.name}'s Perish count is ${mon.perishTurns}!`));
      }
    }
  }

  // Reset protect count for Pokemon that didn't use Protect this turn
  for (const p of state.player.team) { if (!p.isFainted && !p.protected) p.protectCount = 0; }
  for (const p of state.opponent.team) { if (!p.isFainted && !p.protected) p.protectCount = 0; }
}

// ── Faint handling ────────────────────────────────────────────────────────

function handleFaints(state: BattleState): void {
  for (const [i, aidx] of state.player.activeIndices.entries()) {
    if (aidx >= 0 && state.player.team[aidx].isFainted) {
      const next = getAliveIndices(state.player.team).find((n) => !state.player.activeIndices.includes(n));
      if (next !== undefined) {
        state.player.activeIndices[i] = next;
        state.player.team[next].turnsOnField = 0;
        state.log.push(makeLog(state.turn, "switch", "player", state.player.team[next].name, `Go! ${state.player.team[next].name}!`));
      } else {
        state.player.activeIndices[i] = -1;
      }
    }
  }
  for (const [i, aidx] of state.opponent.activeIndices.entries()) {
    if (aidx >= 0 && state.opponent.team[aidx].isFainted) {
      const next = getAliveIndices(state.opponent.team).find((n) => !state.opponent.activeIndices.includes(n));
      if (next !== undefined) {
        state.opponent.activeIndices[i] = next;
        state.opponent.team[next].turnsOnField = 0;
        state.log.push(makeLog(state.turn, "switch", "opponent", state.opponent.team[next].name, `Opponent sent out ${state.opponent.team[next].name}!`));
      } else {
        state.opponent.activeIndices[i] = -1;
      }
    }
  }
}

// ── Log helper ────────────────────────────────────────────────────────────

function makeLog(turn: number, type: string, actor: PlayerSide, actorName: string, message: string, detail?: Record<string, unknown>): BattleEvent {
  return { turn, type: type as any, actor, actorName, message, detail };
}

// ── AI ────────────────────────────────────────────────────────────────────

function scoreMove(
  mon: BattlePokemon,
  move: BattleMove,
  opponents: BattlePokemon[],
  ally: BattlePokemon | null,
): number {
  let score = 0;

  if (["protect", "wide-guard", "kings-shield", "spiky-shield"].includes(move.name)) {
    if (mon.currentHp < mon.maxHp * 0.4) score = 60;
    else score = 5;
    return score;
  }
  if (move.name === "fake-out" && mon.turnsOnField === 0) { score = 65; return score; }
  if (move.name === "follow-me" || move.name === "rage-powder") { score = 40; return score; }
  if (move.name === "helping-hand" && ally) { score = 45; return score; }
  if (move.name === "tailwind") { score = 55; return score; }
  if (move.name === "trick-room") { score = 60; return score; }
  if (["recover", "slack-off", "moonlight", "synthesis"].includes(move.name)) {
    if (mon.currentHp < mon.maxHp * 0.5) { score = 50; return score; }
    score = 5; return score;
  }
  if (move.name === "will-o-wisp" || move.name === "thunder-wave" || move.name === "spore" || move.name === "toxic") {
    for (const opp of opponents) {
      if (opp.status === "none" && !opp.isFainted) { score = 50; break; }
    }
    if (score === 0) score = 5;
    return score;
  }
  if (move.name === "super-fang") {
    for (const opp of opponents) if (!opp.isFainted && opp.currentHp > opp.maxHp * 0.5) { score = 45; break; }
    return score;
  }

  // Stat boosting
  const selfBoostMoves: Record<string, { stat: Stat; stages: number }[]> = {
    "swords-dance": [{ stat: "attack", stages: 2 }],
    "nasty-plot": [{ stat: "specialAttack", stages: 2 }],
    "calm-mind": [{ stat: "specialAttack", stages: 1 }, { stat: "specialDefense", stages: 1 }],
    "dragon-dance": [{ stat: "attack", stages: 1 }, { stat: "speed", stages: 1 }],
  };
  if (selfBoostMoves[move.name]) { score = 30; return score; }

  // Damaging moves
  if (move.power) {
    for (const opp of opponents) {
      if (opp.isFainted) continue;
      const eff = getTypeEffectiveness(move.type, opp.types);
      let moveScore = move.power * eff;
      if (mon.types.includes(move.type)) moveScore *= 1.2;
      if (eff >= 2) moveScore += 30;
      if (eff === 0) moveScore -= 80;
      score += moveScore;
    }
  }

  return score;
}

export function getAIMoves(state: BattleState): PlayerChoice[] {
  const choices: PlayerChoice[] = [{ type: "move" }, { type: "move" }];
  const oppMons = state.opponent.activeIndices.map((i) =>
    i >= 0 ? state.opponent.team[i] : null
  ).filter(Boolean) as BattlePokemon[];

  const playerMons = state.player.activeIndices.map((i) =>
    i >= 0 ? state.player.team[i] : null
  );

  for (let slot = 0; slot < 2; slot++) {
    const mon = playerMons[slot];
    if (!mon || mon.isFainted) { choices[slot] = { type: "move", moveIndex: 0 }; continue; }

    const allyIdx = state.player.activeIndices[1 - slot];
    const ally = allyIdx >= 0 && !state.player.team[allyIdx].isFainted ? state.player.team[allyIdx] : null;

    let bestMove = 0;
    let bestScore = -Infinity;
    let bestTarget = 0;

    for (let mi = 0; mi < mon.moves.length; mi++) {
      const move = mon.moves[mi];
      if (!move || (move.pp ?? 0) <= 0) continue;
      const s = scoreMove(mon, move, oppMons, ally);
      if (s > bestScore) {
        bestScore = s;
        bestMove = mi;
      }
    }

    // Pick best target
    const moveName = mon.moves[bestMove]?.name;
    if (["will-o-wisp", "thunder-wave", "spore", "toxic", "nuzzle", "super-fang", "helping-hand"].includes(moveName || "")) {
      // Target non-statused opponent
      for (let t = 0; t < oppMons.length; t++) {
        if (!oppMons[t].isFainted) { bestTarget = t; break; }
      }
    } else {
      // Target lowest HP opponent
      let lowestHp = Infinity;
      for (let t = 0; t < oppMons.length; t++) {
        if (!oppMons[t].isFainted && oppMons[t].currentHp < lowestHp) {
          lowestHp = oppMons[t].currentHp;
          bestTarget = t;
        }
      }
    }

    choices[slot] = { type: "move", moveIndex: bestMove, moveTarget: bestTarget };
  }

  return choices;
}
