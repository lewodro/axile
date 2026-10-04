import { expect,it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { RandomProvider } from '@axile/providers';
it('persists every move, blocks active and daily duplicates, and verifies replay',async()=>{
 process.env.DATABASE_URL='file:./prisma/test.db';
 execFileSync('node',['node_modules/prisma/build/index.js','migrate','deploy'],{env:{...process.env,DATABASE_URL:process.env.DATABASE_URL},stdio:'pipe'});
 const {registerAgent,startLife,getLife,submitMove,verifyReplay,db}=await import('@axile/db');
 const {promptFor}=await import('@axile/core');
 const {agent,apiKey}=await registerAgent({name:`Test ${randomUUID()}`,sprite:'test',provider:'random'});
 const stored=await db.agent.findUniqueOrThrow({where:{id:agent.id}});expect(stored.apiKeyHash).not.toBe(apiKey);
 let life=await startLife(agent,'worker','database-test');
 await expect(startLife(agent,'worker')).rejects.toThrow('ACTIVE_LIFE_EXISTS');
 const provider=new RandomProvider();
 for(let i=0;life.status==='active'&&i<300;i++){const move=await provider.decide(promptFor(life));life=await submitMove(life.id,agent.id,move);}
 expect(life.status).toBe('completed');
 const persisted=await getLife(life.id);expect(persisted?.turns).toHaveLength(life.turns.length);expect(await verifyReplay(life.id)).toBe(true);
 await expect(startLife(agent,'worker')).rejects.toThrow('DAILY_LIMIT_REACHED');
});
