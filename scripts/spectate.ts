import { randomUUID } from 'node:crypto';
import { db,startLife,submitMove,logEvent } from '@axile/db';
import { promptFor,type Role } from '@axile/core';
import { RandomProvider,llmFromEnv } from '@axile/providers';
const roles:Role[]=['trader','worker','family','wildcard'];
const names=['The Uninsured','Mother of Spreadsheets','A Modest Disaster','The Last Optimist'];
const interval=Math.max(1000,Number(process.env.SPECTATOR_INTERVAL_MS??12000));
const provider=process.env.LLM_API_URL?llmFromEnv():new RandomProvider();
let running=true;process.on('SIGINT',()=>{running=false});process.on('SIGTERM',()=>{running=false});
for(let sequence=0;running;sequence++){
 const role=roles[sequence%roles.length],id=randomUUID();
 const row=await db.agent.create({data:{id,name:names[sequence%names.length],sprite:role,provider:provider instanceof RandomProvider?'random':'llm'}});
 let life=await startLife({id:row.id,name:row.name,sprite:row.sprite,provider:row.provider},role);
 logEvent('spectator_started',{lifeId:life.id,agentId:id});
 while(running&&life.status==='active'){
  const prompt=promptFor(life);let decision;
  try{decision=await provider.decide(prompt);}catch{decision={move:'INVALID_AGENT_MOVE',reason:'No valid response; deterministic fallback used.'};}
  life=await submitMove(life.id,id,decision);
  await new Promise(resolve=>setTimeout(resolve,interval));
 }
}
await db.$disconnect();
