import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/client';
import {
  advanceLife,
  createLife,
  DEMO_ROSTER,
  promptFor,
  replayLife,
  stepLife,
  ROLES,
  type Achievement,
  type AgentDecision,
  type AgentIdentity,
  type AgentProvider,
  type GameId,
  type GameState,
  type Life,
  type LifeRunState,
  type Role,
  type TurnRecord,
} from '@axile/core';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' });
const globalDb = globalThis as typeof globalThis & { axileDb?: PrismaClient };
export const db = globalDb.axileDb ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalDb.axileDb = db;

export function logEvent(event: string, data: Record<string, string | number | boolean | null>) {
  console.info(JSON.stringify({ event, ...data }));
}

export function hashKey(key: string) { return createHash('sha256').update(key).digest('hex'); }
export function keyMatches(key: string, hash: string) {
  const a = Buffer.from(hashKey(key), 'hex'), b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
export function newKey() { return `ax_${randomBytes(32).toString('base64url')}`; }

export async function authenticate(header: string | null): Promise<AgentIdentity | null> {
  const key = header?.match(/^Bearer (ax_[A-Za-z0-9_-]+)$/)?.[1];
  if (!key) return null;
  const agent = await db.agent.findUnique({ where: { apiKeyHash: hashKey(key) } });
  return agent ? { id: agent.id, name: agent.name, sprite: agent.sprite, provider: agent.provider, personality: agent.personality } : null;
}

export async function registerAgent(input: { name: string; sprite: string; provider: string; personality?: string }) {
  const apiKey = newKey(), id = randomUUID();
  const agent = await db.agent.create({ data: { id, name: input.name, sprite: input.sprite, provider: input.provider, personality: input.personality, apiKeyHash: hashKey(apiKey) } });
  logEvent('agent_created', { agentId: id });
  return { agent: { id: agent.id, name: agent.name, sprite: agent.sprite, provider: agent.provider, personality: agent.personality }, apiKey };
}

export async function seedDemoAgents(provider: string) {
  const agents: AgentIdentity[] = [];
  for (const demo of DEMO_ROSTER) {
    const row = await db.agent.upsert({
      where: { id: demo.id },
      update: { name: demo.name, sprite: demo.sprite, provider, personality: demo.personality },
      create: { id: demo.id, name: demo.name, sprite: demo.sprite, provider, personality: demo.personality },
    });
    agents.push({ id: row.id, name: row.name, sprite: row.sprite, provider: row.provider, personality: row.personality });
  }
  return agents;
}

function toData(life: Life) {
  return {
    status: life.status,
    money: life.stats.money,
    health: life.stats.health,
    fame: life.stats.fame,
    sanity: life.stats.sanity,
    age: life.age,
    turnIndex: life.turnIndex,
    moveIndex: life.moveIndex,
    game: life.game,
    gameStateJson: life.gameState ? JSON.stringify(life.gameState) : null,
    score: life.score,
    achievementBonus: life.achievementBonus,
    achievementsJson: JSON.stringify(life.achievements),
    endedAt: life.endedAt ? new Date(life.endedAt) : null,
    autoRun: life.autoRun,
    runState: life.runState,
    deathCause: life.deathCause,
  };
}

export async function startLife(agent: AgentIdentity, role: Role, seed?: string, options: { autoRun?: boolean } = {}) {
  if (!(role in ROLES)) throw new Error('INVALID_ROLE');
  const now = new Date(), day = now.toISOString().slice(0, 10);
  const rawLimit = Number(process.env.MAX_LIVES_PER_AGENT_PER_DAY ?? 1);
  if (!Number.isInteger(rawLimit) || rawLimit < 1) throw new Error('INVALID_DAILY_LIMIT');
  const life = createLife({ id: randomUUID(), agent, role, seed: seed ?? randomBytes(24).toString('hex'), now: now.toISOString(), autoRun: options.autoRun });
  await db.$transaction(async tx => {
    const active = await tx.activeLife.findUnique({ where: { agentId: agent.id } });
    if (active) throw new Error('ACTIVE_LIFE_EXISTS');
    const used = await tx.participation.count({ where: { agentId: agent.id, day } });
    if (used >= rawLimit) throw new Error('DAILY_LIMIT_REACHED');
    await tx.life.create({ data: { id: life.id, agentId: agent.id, role, seed: life.seed, ...toData(life), startedAt: now } });
    await tx.activeLife.create({ data: { agentId: agent.id, lifeId: life.id } });
    await tx.participation.create({ data: { id: randomUUID(), agentId: agent.id, day, slot: used } });
  });
  logEvent('life_created', { lifeId: life.id, agentId: agent.id, role });
  return life;
}

export async function getLife(id: string): Promise<Life | null> {
  const row = await db.life.findUnique({ where: { id }, include: { agent: true, turns: { orderBy: [{ index: 'asc' }, { moveIndex: 'asc' }] } } });
  if (!row) return null;
  const agent: AgentIdentity = { id: row.agent.id, name: row.agent.name, sprite: row.agent.sprite, provider: row.agent.provider, personality: row.agent.personality };
  const turns: TurnRecord[] = row.turns.map(turn => ({
    index: turn.index,
    age: turn.age,
    game: turn.game as GameId,
    stateBefore: JSON.parse(turn.stateBeforeJson),
    move: turn.move,
    reason: turn.reason,
    deltas: JSON.parse(turn.deltasJson),
    statsAfter: JSON.parse(turn.statsAfterJson),
    engineLog: JSON.parse(turn.engineLogJson),
    invalid: turn.invalid,
    completedGame: turn.completedGame,
    providerError: turn.providerError,
  }));
  return {
    id: row.id,
    agent,
    role: row.role as Role,
    seed: row.seed,
    status: row.status as Life['status'],
    runState: row.runState as LifeRunState,
    autoRun: row.autoRun,
    version: row.version,
    deathCause: row.deathCause,
    stats: { money: row.money, health: row.health, fame: row.fame, sanity: row.sanity },
    age: row.age,
    turnIndex: row.turnIndex,
    game: row.game as GameId | null,
    gameState: row.gameStateJson ? JSON.parse(row.gameStateJson) as GameState : null,
    moveIndex: row.moveIndex,
    turns,
    achievements: JSON.parse(row.achievementsJson) as Achievement[],
    achievementBonus: row.achievementBonus,
    score: row.score,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
  };
}

async function persistTurn(previous: Life, next: Life, agentId: string) {
  const turn = next.turns.at(-1);
  if (!turn) throw new Error('TURN_MISSING');
  await db.$transaction(async tx => {
    const updated = await tx.life.updateMany({ where: { id: previous.id, version: previous.version, status: 'active' }, data: { ...toData(next), version: { increment: 1 } } });
    if (updated.count !== 1) throw new Error('STALE_LIFE');
    await tx.turn.create({ data: {
      id: randomUUID(), lifeId: previous.id, index: turn.index, moveIndex: previous.moveIndex, age: turn.age, game: turn.game,
      stateBeforeJson: JSON.stringify(turn.stateBefore), move: turn.move, reason: turn.reason, deltasJson: JSON.stringify(turn.deltas),
      statsAfterJson: JSON.stringify(turn.statsAfter), engineLogJson: JSON.stringify(turn.engineLog), invalid: turn.invalid,
      completedGame: turn.completedGame, providerError: turn.providerError,
    } });
    if (next.status !== 'active') await tx.activeLife.deleteMany({ where: { agentId, lifeId: previous.id } });
  });

  logEvent('agent_decision', { lifeId: previous.id, agentId, move: turn.move, invalid: turn.invalid });
  if (turn.providerError) logEvent('provider_error', { lifeId: previous.id, provider: previous.agent.provider, code: turn.providerError });
  logEvent('game_resolved', { lifeId: previous.id, game: turn.game, done: turn.completedGame });
  logEvent('stat_update', { lifeId: previous.id, money: next.stats.money, health: next.stats.health, fame: next.stats.fame, sanity: next.stats.sanity });
  if (next.status !== 'active') {
    logEvent(next.status === 'collapsed' ? 'death' : 'life_completed', { lifeId: previous.id, age: next.age, cause: next.deathCause });
    logEvent('score_generated', { lifeId: previous.id, score: next.score ?? 0 });
  }
  return next;
}

export async function submitMove(id: string, agentId: string, decision: AgentDecision) {
  const previous = await getLife(id);
  if (!previous) throw new Error('LIFE_NOT_FOUND');
  if (previous.agent.id !== agentId) throw new Error('NOT_YOUR_LIFE');
  if (previous.status !== 'active') throw new Error('LIFE_ENDED');
  return persistTurn(previous, stepLife(previous, decision), agentId);
}

export async function runAgentTurn(id: string, provider: AgentProvider) {
  const previous = await getLife(id);
  if (!previous) throw new Error('LIFE_NOT_FOUND');
  if (previous.status !== 'active') throw new Error('LIFE_ENDED');
  if (!previous.autoRun) throw new Error('LIFE_NOT_AUTOMATIC');
  const claimed = await db.life.updateMany({ where: { id, version: previous.version, status: 'active', autoRun: true }, data: { runState: 'thinking' } });
  if (claimed.count !== 1) throw new Error('STALE_LIFE');
  const next = await advanceLife(previous, provider);
  return persistTurn(previous, next, previous.agent.id);
}

export async function setLifeAutoRun(id: string, agentId: string, autoRun: boolean) {
  const life = await getLife(id);
  if (!life) throw new Error('LIFE_NOT_FOUND');
  if (life.agent.id !== agentId) throw new Error('NOT_YOUR_LIFE');
  if (life.status !== 'active') throw new Error('LIFE_ENDED');
  const updated = await db.life.updateMany({
    where: { id, version: life.version, status: 'active' },
    data: { autoRun, runState: autoRun ? 'waiting' : 'paused', version: { increment: 1 } },
  });
  if (updated.count !== 1) throw new Error('STALE_LIFE');
  const next = await getLife(id);
  if (!next) throw new Error('LIFE_NOT_FOUND');
  return next;
}

export async function setRunnerState(id: string, state: LifeRunState) {
  await db.life.updateMany({ where: { id, status: 'active', autoRun: true }, data: { runState: state } });
}

export async function runnableLives() {
  return db.life.findMany({ where: { status: 'active', autoRun: true }, orderBy: { startedAt: 'asc' }, select: { id: true } });
}

export function publicLife(life: Life) {
  const prompt = life.status === 'active' ? promptFor(life) : null;
  const visiblePrompt = prompt ? {
    identity: prompt.identity, role: prompt.role, age: prompt.age, stats: prompt.stats, game: prompt.game,
    gameState: prompt.gameState, legalMoves: prompt.legalMoves, recentHistory: prompt.recentHistory,
    turnIndex: prompt.turnIndex, moveIndex: prompt.moveIndex,
  } : null;
  return {
    id: life.id, agent: life.agent, role: life.role, status: life.status, runState: life.runState, autoRun: life.autoRun,
    deathCause: life.deathCause, stats: life.stats, age: life.age, turnIndex: life.turnIndex, moveIndex: life.moveIndex,
    game: life.game, prompt: visiblePrompt, turns: life.turns, achievements: life.achievements,
    achievementBonus: life.achievementBonus, score: life.score, startedAt: life.startedAt, endedAt: life.endedAt,
  };
}

export async function verifyReplay(id: string) {
  const life = await getLife(id);
  if (!life) throw new Error('LIFE_NOT_FOUND');
  const initial = createLife({ id: life.id, agent: life.agent, role: life.role, seed: life.seed, now: life.startedAt, autoRun: life.autoRun });
  const replayed = replayLife(initial, life.turns);
  return replayed.status === life.status
    && replayed.age === life.age
    && replayed.turnIndex === life.turnIndex
    && replayed.deathCause === life.deathCause
    && replayed.score === life.score
    && replayed.achievementBonus === life.achievementBonus
    && JSON.stringify(replayed.achievements) === JSON.stringify(life.achievements)
    && JSON.stringify(replayed.stats) === JSON.stringify(life.stats)
    && replayed.game === life.game
    && JSON.stringify(replayed.gameState) === JSON.stringify(life.gameState);
}

export async function leaderboard() {
  return db.life.findMany({ where: { status: { in: ['completed', 'collapsed'] }, score: { not: null } }, orderBy: [{ score: 'desc' }, { endedAt: 'asc' }], take: 100, include: { agent: true } });
}

export async function arenaSummary() {
  const [activeLives, completedLives, recentLives, topLives] = await Promise.all([
    db.life.count({ where: { status: 'active' } }),
    db.life.count({ where: { status: { in: ['completed', 'collapsed'] } } }),
    db.life.findMany({ where: { status: { in: ['active', 'completed', 'collapsed'] } }, orderBy: { startedAt: 'desc' }, take: 4, include: { agent: true } }),
    leaderboard(),
  ]);
  return {
    activeLives,
    completedLives,
    recentLives: recentLives.map(life => ({ id: life.id, name: life.agent.name, sprite: life.agent.sprite, provider: life.agent.provider, role: life.role, age: life.age, status: life.status, score: life.score })),
    topLife: topLives[0] ? { id: topLives[0].id, name: topLives[0].agent.name, score: topLives[0].score } : null,
  };
}
