import 'dotenv/config';
import { DEMO_ROSTER } from '@axile/core';
import { db, logEvent, runnableLives, runAgentTurn, seedDemoAgents, setRunnerState, startLife } from '@axile/db';
import { configuredProviderName, providerFromEnv } from '@axile/providers';

const intervalMs = boundedInteger(process.env.SPECTATOR_INTERVAL_MS, 1000, 250, 30000);
const presentationMs = boundedInteger(process.env.SPECTATOR_PRESENTATION_DELAY_MS, 450, 0, 10000);
const providerName = configuredProviderName();
const provider = providerFromEnv();
let running = true;
process.on('SIGINT', () => { running = false; });
process.on('SIGTERM', () => { running = false; });

function boundedInteger(raw: string | undefined, fallback: number, minimum: number, maximum: number) {
  const value = Number(raw ?? fallback);
  return Number.isInteger(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
}

async function ensureRosterLives() {
  const agents = await seedDemoAgents(providerName);
  for (const agent of agents) {
    const active = await db.activeLife.findUnique({ where: { agentId: agent.id } });
    if (active) continue;
    try {
      const role = DEMO_ROSTER.find(item => item.id === agent.id)?.role;
      if (role) await startLife(agent, role, undefined, { autoRun: true });
    } catch (error) {
      const code = error instanceof Error && /^[A-Z0-9_]{1,48}$/.test(error.message) ? error.message : 'ROSTER_PROVISION_FAILED';
      if (code !== 'DAILY_LIMIT_REACHED') logEvent('roster_provision_error', { agentId: agent.id, code });
    }
  }
}

async function advanceActiveLives() {
  const lives = await runnableLives();
  await Promise.all(lives.map(async ({ id }) => {
    try {
      const life = await runAgentTurn(id, provider);
      if (life.status === 'active') {
        await pause(presentationMs);
        await setRunnerState(id, 'waiting');
      }
    } catch (error) {
      const code = error instanceof Error && /^[A-Z0-9_]{1,48}$/.test(error.message) ? error.message : 'TURN_EXECUTION_FAILED';
      if (code !== 'STALE_LIFE' && code !== 'LIFE_ENDED') logEvent('arena_turn_error', { lifeId: id, code });
      await setRunnerState(id, 'waiting');
    }
  }));
}

logEvent('arena_worker_started', { provider: providerName, intervalMs });
try {
  while (running) {
    try {
      await ensureRosterLives();
      await advanceActiveLives();
    } catch (error) {
      const code = error instanceof Error && /^[A-Z0-9_]{1,48}$/.test(error.message) ? error.message : 'ARENA_WORKER_FAILED';
      logEvent('arena_worker_error', { code });
    }
    await pause(intervalMs);
  }
} finally {
  await db.$disconnect();
}

function pause(ms: number) { return new Promise<void>(resolve => setTimeout(resolve, ms)); }
