import 'dotenv/config';
import { configuredProviderName } from '@axile/providers';
import { db, seedDemoAgents } from '@axile/db';

const agents = await seedDemoAgents(configuredProviderName());
for (const agent of agents) console.log(`SEEDED AGENT ${agent.name} (${agent.provider})`);
await db.$disconnect();
