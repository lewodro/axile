import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/client';
import { createLife,stepLife,promptFor,replayLife,type Life,type AgentDecision,type AgentIdentity,type Role,type TurnRecord,type GameState,type GameId,type Achievement } from '@axile/core';
import { randomUUID,createHash,randomBytes,timingSafeEqual } from 'node:crypto';
const adapter=new PrismaBetterSqlite3({url:process.env.DATABASE_URL??'file:./prisma/dev.db'});
const globalDb=globalThis as typeof globalThis & {axileDb?:PrismaClient};
export const db=globalDb.axileDb??new PrismaClient({adapter});
if(process.env.NODE_ENV!=='production')globalDb.axileDb=db;
export function logEvent(event:string,data:Record<string,string|number|boolean|null>){console.info(JSON.stringify({event,...data}));}
export function hashKey(key:string){return createHash('sha256').update(key).digest('hex');}
export function keyMatches(key:string,hash:string){const a=Buffer.from(hashKey(key),'hex'),b=Buffer.from(hash,'hex');return a.length===b.length&&timingSafeEqual(a,b)}
export function newKey(){return `ax_${randomBytes(32).toString('base64url')}`}
export async function authenticate(header:string|null):Promise<AgentIdentity|null>{const key=header?.match(/^Bearer (ax_[A-Za-z0-9_-]+)$/)?.[1];if(!key)return null;const agent=await db.agent.findUnique({where:{apiKeyHash:hashKey(key)}});return agent?{id:agent.id,name:agent.name,sprite:agent.sprite,provider:agent.provider}:null;}
export async function registerAgent(input:{name:string;sprite:string;provider:string}){const key=newKey(),id=randomUUID();const agent=await db.agent.create({data:{id,name:input.name,sprite:input.sprite,provider:input.provider,apiKeyHash:hashKey(key)}});logEvent('agent_created',{agentId:id});return {agent:{id:agent.id,name:agent.name,sprite:agent.sprite,provider:agent.provider},apiKey:key};}
function toData(life:Life){return {status:life.status,money:life.stats.money,health:life.stats.health,fame:life.stats.fame,sanity:life.stats.sanity,age:life.age,turnIndex:life.turnIndex,moveIndex:life.moveIndex,game:life.game,gameStateJson:life.gameState?JSON.stringify(life.gameState):null,score:life.score,achievementBonus:life.achievementBonus,achievementsJson:JSON.stringify(life.achievements),endedAt:life.endedAt?new Date(life.endedAt):null};}
export async function startLife(agent:AgentIdentity,role:Role,seed?:string){const now=new Date(),day=now.toISOString().slice(0,10),limit=Math.max(1,Number(process.env.MAX_LIVES_PER_AGENT_PER_DAY??1));
 if(!Number.isInteger(limit))throw new Error('INVALID_DAILY_LIMIT');
 const life=createLife({id:randomUUID(),agent,role,seed:seed??randomBytes(24).toString('hex'),now:now.toISOString()});
 await db.$transaction(async tx=>{
  const active=await tx.activeLife.findUnique({where:{agentId:agent.id}});if(active)throw new Error('ACTIVE_LIFE_EXISTS');
  const used=await tx.participation.count({where:{agentId:agent.id,day}});if(used>=limit)throw new Error('DAILY_LIMIT_REACHED');
  await tx.life.create({data:{id:life.id,agentId:agent.id,role,seed:life.seed,...toData(life),startedAt:now}});
  await tx.activeLife.create({data:{agentId:agent.id,lifeId:life.id}});
  await tx.participation.create({data:{id:randomUUID(),agentId:agent.id,day,slot:used}});
 });logEvent('life_created',{lifeId:life.id,agentId:agent.id,role});return life;
}
export async function getLife(id:string):Promise<Life|null>{const row=await db.life.findUnique({where:{id},include:{agent:true,turns:{orderBy:[{index:'asc'},{moveIndex:'asc'}]}}});if(!row)return null;
 const agent={id:row.agent.id,name:row.agent.name,sprite:row.agent.sprite,provider:row.agent.provider};
 const turns:TurnRecord[]=row.turns.map(t=>({index:t.index,age:t.age,game:t.game as GameId,stateBefore:JSON.parse(t.stateBeforeJson),move:t.move,reason:t.reason,deltas:JSON.parse(t.deltasJson),statsAfter:JSON.parse(t.statsAfterJson),engineLog:JSON.parse(t.engineLogJson),invalid:t.invalid,completedGame:t.completedGame}));
 return {id:row.id,agent,role:row.role as Role,seed:row.seed,status:row.status as Life['status'],stats:{money:row.money,health:row.health,fame:row.fame,sanity:row.sanity},age:row.age,turnIndex:row.turnIndex,moveIndex:row.moveIndex,game:row.game as GameId|null,gameState:row.gameStateJson?JSON.parse(row.gameStateJson) as GameState:null,score:row.score,achievementBonus:row.achievementBonus,achievements:JSON.parse(row.achievementsJson) as Achievement[],startedAt:row.startedAt.toISOString(),endedAt:row.endedAt?.toISOString()??null,turns};}
export async function submitMove(id:string,agentId:string,decision:AgentDecision){const previous=await getLife(id);if(!previous)throw new Error('LIFE_NOT_FOUND');if(previous.agent.id!==agentId)throw new Error('NOT_YOUR_LIFE');if(previous.status!=='active')throw new Error('LIFE_ENDED');
 const next=stepLife(previous,decision);const turn=next.turns.at(-1)!;logEvent('turn_started',{lifeId:id,agentId,game:turn.game,turn:turn.index});
 await db.$transaction(async tx=>{
  const updated=await tx.life.updateMany({where:{id,version:previous.turns.length,status:'active'},data:{...toData(next),version:{increment:1}}});
  if(updated.count!==1)throw new Error('STALE_LIFE');
  await tx.turn.create({data:{id:randomUUID(),lifeId:id,index:turn.index,moveIndex:previous.moveIndex,age:turn.age,game:turn.game,stateBeforeJson:JSON.stringify(turn.stateBefore),move:turn.move,reason:turn.reason,deltasJson:JSON.stringify(turn.deltas),statsAfterJson:JSON.stringify(turn.statsAfter),engineLogJson:JSON.stringify(turn.engineLog),invalid:turn.invalid,completedGame:turn.completedGame}});
  if(next.status!=='active')await tx.activeLife.delete({where:{agentId}});
 });
 logEvent('agent_decision',{lifeId:id,agentId,move:turn.move,invalid:turn.invalid});logEvent('game_resolved',{lifeId:id,game:turn.game,done:turn.completedGame});logEvent('stat_update',{lifeId:id,money:next.stats.money,health:next.stats.health,fame:next.stats.fame,sanity:next.stats.sanity});if(next.status!=='active'){logEvent(next.status==='collapsed'?'death':'life_completed',{lifeId:id,age:next.age});logEvent('score_generated',{lifeId:id,score:next.score??0});}
 return next;
}
export function publicLife(life:Life){const prompt=life.status==='active'?promptFor(life):null;const visiblePrompt=prompt?((({seedHint: _seedHint,...rest})=>rest)(prompt)):null;return {id:life.id,agent:life.agent,role:life.role,status:life.status,stats:life.stats,age:life.age,turnIndex:life.turnIndex,moveIndex:life.moveIndex,game:life.game,prompt:visiblePrompt,turns:life.turns,achievements:life.achievements,achievementBonus:life.achievementBonus,score:life.score,startedAt:life.startedAt,endedAt:life.endedAt};}
export async function verifyReplay(id:string){const life=await getLife(id);if(!life)throw new Error('LIFE_NOT_FOUND');const initial=createLife({id:life.id,agent:life.agent,role:life.role,seed:life.seed,now:life.startedAt});const replayed=replayLife(initial,life.turns);return replayed.score===life.score&&replayed.status===life.status&&JSON.stringify(replayed.stats)===JSON.stringify(life.stats);}
export async function leaderboard(){return db.life.findMany({where:{status:{in:['completed','collapsed']},score:{not:null}},orderBy:[{score:'desc'},{endedAt:'asc'}],take:100,include:{agent:true}})}
