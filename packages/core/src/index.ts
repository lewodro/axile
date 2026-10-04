import { market,marketView,chess,chessView,nim,nimView,shift,shiftView,dilemma,dilemmaView,cards,cardsView,rng,STAT_KEYS,type GameId,type LifeState,type Role,type Stats,type StatDeltas,type MarketState,type ChessState,type NimState,type ShiftState,type DilemmaState,type CardsState,type GameEngine } from '@axile/engines';
export type GameState=MarketState|ChessState|NimState|ShiftState|DilemmaState|CardsState;
export type LifeStatus='active'|'completed'|'collapsed';
export type LifeRunState='paused'|'waiting'|'thinking'|'playing'|'provider_error'|'completed'|'dead';
export const ROLES:Record<Role,{stats:Stats;games:GameId[];description:string}>={
 trader:{stats:{money:30,health:45,fame:15,sanity:35},games:['market','chess'],description:'Charts at 4am. Sleep is a position you closed.'},
 worker:{stats:{money:35,health:65,fame:5,sanity:65},games:['nim','shift'],description:'Reliable until the universe files an objection.'},
 family:{stats:{money:25,health:60,fame:10,sanity:70},games:['dilemma','cards'],description:'Trust is an asset with strange liquidity.'},
 wildcard:{stats:{money:40,health:45,fame:40,sanity:30},games:['market','chess','nim','shift','dilemma','cards'],description:'No strategy. A respectable amount of nerve.'}
};
export const DEMO_ROSTER:[{id:string;name:string;sprite:Role;role:Role;personality:string},...{id:string;name:string;sprite:Role;role:Role;personality:string}[]]=[
 {id:'axile-uninsured',name:'The Uninsured',sprite:'trader',role:'trader',personality:'Risk-seeking. Prefer a meaningful wager when the game offers one, but reason from the visible state.'},
 {id:'axile-soft-landing',name:'Soft Landing',sprite:'worker',role:'worker',personality:'Conservative. Preserve health and avoid avoidable losses when legal choices allow it.'},
 {id:'axile-relevant-person',name:'A Relevant Person',sprite:'family',role:'family',personality:'Status-focused. Notice opportunities to earn recognition and explain the social cost.'},
 {id:'axile-long-term',name:'The Long-Term Plan',sprite:'wildcard',role:'wildcard',personality:'Balanced. Weigh immediate reward against the remaining life and current reserves.'},
 {id:'axile-office-weather',name:'Office Weather',sprite:'worker',role:'worker',personality:'Chaotic but attentive. Consider unusual legal moves without inventing information.'},
 {id:'axile-margin-call',name:'The Margin Call',sprite:'trader',role:'trader',personality:'Health-focused. Treat physical capacity as a scarce resource and favor sustainable decisions.'},
];
export const ACHIEVEMENT_BONUSES={LONG_LIFE:20,BROKE_BUT_FAMOUS:15,UNTOUCHABLE:12,STILL_SANE:12,MARKET_SURVIVOR:10,PERFECT_GAME:5} as const;
export type Achievement=keyof typeof ACHIEVEMENT_BONUSES;
export interface AgentIdentity { id:string;name:string;sprite:string;provider:string;personality?:string|null }
export interface TurnRecord { index:number;age:number;game:GameId;stateBefore:unknown;move:string;reason:string;deltas:StatDeltas;statsAfter:Stats;engineLog:string[];invalid:boolean;completedGame:boolean;providerError:string|null }
export interface Life { id:string;agent:AgentIdentity;role:Role;seed:string;status:LifeStatus;runState:LifeRunState;autoRun:boolean;version:number;deathCause:string|null;stats:Stats;age:number;turnIndex:number;game:GameId|null;gameState:GameState|null;moveIndex:number;turns:TurnRecord[];achievements:Achievement[];achievementBonus:number;score:number|null;startedAt:string;endedAt:string|null }
export interface AgentPrompt { identity:AgentIdentity;role:Role;age:number;stats:Stats;game:GameId;gameState:unknown;legalMoves:string[];recentHistory:Pick<TurnRecord,'game'|'move'|'deltas'>[];turnIndex:number;moveIndex:number;seedHint:string }
export interface AgentDecision {move:string;reason:string}
export interface AgentProvider {decide(prompt:AgentPrompt):Promise<AgentDecision>}
const engines={market,chess,nim,shift,dilemma,cards};
const views={market:marketView,chess:chessView,nim:nimView,shift:shiftView,dilemma:dilemmaView,cards:cardsView};
function engine(game:GameId):GameEngine<GameState>{return engines[game] as unknown as GameEngine<GameState>}
function view(game:GameId,state:GameState):unknown{return (views[game] as (s:GameState)=>unknown)(state)}
export function clamp(value:number){return Math.max(0,Math.min(100,Math.round(value)))}
export function applyDeltas(stats:Stats,deltas:StatDeltas):Stats {return Object.fromEntries(STAT_KEYS.map(key=>[key,clamp(stats[key]+(deltas[key]??0))])) as Stats}
export function chapterGame(role:Role,seed:string,index:number):GameId{return rng(`${seed}:chapter:${index}`).pick(ROLES[role].games)}
export function achievements(life:Life):Achievement[]{const result:Achievement[]=[];
 if(life.turnIndex===14)result.push('LONG_LIFE');
 if(life.stats.money<=10&&life.stats.fame>=80)result.push('BROKE_BUT_FAMOUS');
 if(life.stats.health>=90)result.push('UNTOUCHABLE');
 if(life.stats.sanity>=90)result.push('STILL_SANE');
 const chapters=new Map<number,TurnRecord[]>();
 for(const turn of life.turns)chapters.set(turn.index,[...(chapters.get(turn.index)??[]),turn]);
 const completed=[...chapters.values()].filter(turns=>turns.at(-1)?.completedGame);
 if(completed.filter(turns=>turns[0].game==='market'&&turns.reduce((sum,t)=>sum+(t.deltas.money??0),0)>0).length>=2)result.push('MARKET_SURVIVOR');
 if(completed.some(turns=>turns.every(t=>STAT_KEYS.every(key=>(t.deltas[key]??0)>=0))))result.push('PERFECT_GAME');
 return result;
}
export function scoreLife(life:Life){const awards=achievements(life),bonus=awards.reduce((sum,a)=>sum+ACHIEVEMENT_BONUSES[a],0);return {achievements:awards,achievementBonus:bonus,score:life.age+STAT_KEYS.reduce((sum,k)=>sum+life.stats[k],0)+bonus}}
export function createLife(input:{id:string;agent:AgentIdentity;role:Role;seed:string;now?:string;autoRun?:boolean}):Life {const game=chapterGame(input.role,input.seed,0),stats={...ROLES[input.role].stats},autoRun=input.autoRun??false;return {id:input.id,agent:input.agent,role:input.role,seed:input.seed,status:'active',runState:autoRun?'waiting':'paused',autoRun,version:0,deathCause:null,stats,age:0,turnIndex:0,game,gameState:engine(game).init(`${input.seed}:0:${game}`,{...stats,role:input.role,age:0,turnIndex:0}),moveIndex:0,turns:[],achievements:[],achievementBonus:0,score:null,startedAt:input.now??new Date().toISOString(),endedAt:null};}
export function promptFor(life:Life):AgentPrompt{if(life.status!=='active'||!life.game||!life.gameState)throw new Error('LIFE_ENDED');return {identity:life.agent,role:life.role,age:life.age,stats:life.stats,game:life.game,gameState:view(life.game,life.gameState),legalMoves:engine(life.game).legalMoves(life.gameState),recentHistory:life.turns.slice(-3).map(({game,move,deltas})=>({game,move,deltas})),turnIndex:life.turnIndex,moveIndex:life.moveIndex,seedHint:`${life.seed}:${life.turnIndex}:${life.moveIndex}`};}
export function stepLife(life:Life,decision:AgentDecision,now?:string):Life{
 if(life.status!=='active'||!life.game||!life.gameState)throw new Error('LIFE_ENDED');
 const game=life.game,state=life.gameState,legal=engine(game).legalMoves(state),invalid=!legal.includes(decision.move);
 if(!legal.length)throw new Error('NO_LEGAL_MOVES');
 const move=invalid?legal[0]:decision.move,result=engine(game).resolve(state,move);
 const deltas={...result.statDeltas};if(invalid)deltas.sanity=(deltas.sanity??0)-2;
 const stats=applyDeltas(life.stats,deltas),collapsedStats=STAT_KEYS.filter(key=>stats[key]===0),collapsed=collapsedStats.length>0;
 const turn:TurnRecord={index:life.turnIndex,age:life.age,game,stateBefore:view(game,state),move,reason:decision.reason,deltas,statsAfter:stats,engineLog:invalid?['INVALID_AGENT_MOVE',...result.log]:result.log,invalid,completedGame:result.done,providerError:null};
 let next:Life={...life,version:life.version+1,stats,runState:life.autoRun?'playing':'paused',gameState:result.state,moveIndex:life.moveIndex+1,turns:[...life.turns,turn]};
 if(collapsed){next={...next,status:'collapsed',runState:'dead',deathCause:collapsedStats.join(','),game:null,gameState:null,endedAt:now??new Date().toISOString()};}
 else if(result.done){const turnIndex=life.turnIndex+1,age=turnIndex*5,completed=turnIndex===14;
  if(completed)next={...next,turnIndex,age,status:'completed',runState:'completed',game:null,gameState:null,endedAt:now??new Date().toISOString()};
  else {const nextGame=chapterGame(life.role,life.seed,turnIndex),lifeState:LifeState={...stats,role:life.role,age,turnIndex};next={...next,runState:life.autoRun?'playing':'paused',age,turnIndex,game:nextGame,gameState:engine(nextGame).init(`${life.seed}:${turnIndex}:${nextGame}`,lifeState),moveIndex:0};}
 }
 if(next.status!=='active')next={...next,...scoreLife(next)};
 return next;
}
function providerErrorCode(error:unknown):string {const code=error instanceof Error?error.message:'PROVIDER_ERROR';return /^[A-Z0-9_]{1,48}$/.test(code)?code:'PROVIDER_ERROR';}
export async function advanceLife(life:Life,provider:AgentProvider,now?:string):Promise<Life>{const prompt=promptFor(life);let decision:AgentDecision|undefined,lastError:unknown;
 for(let attempt=0;attempt<2;attempt++){try{const candidate=await provider.decide(prompt);if(typeof candidate?.move!=='string'||typeof candidate?.reason!=='string'||candidate.reason.length>1000){lastError=new Error('PROVIDER_INVALID_RESPONSE');continue;}if(prompt.legalMoves.includes(candidate.move)){decision={move:candidate.move,reason:candidate.reason.trim()||'No reason supplied.'};break;}lastError=new Error('PROVIDER_INVALID_MOVE');}catch(error){lastError=error;}}
 if(decision)return stepLife(life,decision,now);
 const code=providerErrorCode(lastError),invalid=code==='PROVIDER_INVALID_MOVE';
 let next=stepLife(life,{move:invalid?'INVALID_AGENT_MOVE':prompt.legalMoves[0]!,reason:`The provider failed (${code}). A deterministic legal fallback was used.`},now);
 const lastTurn=next.turns.at(-1)!;
 next={...next,runState:next.status==='active'?'provider_error':next.runState,turns:[...next.turns.slice(0,-1),{...lastTurn,providerError:code}]};
 return next;
}
export async function runLife(life:Life,provider:AgentProvider,onTurn?:(life:Life,turn:TurnRecord)=>Promise<void>):Promise<Life>{let current=life;for(let steps=0;current.status==='active'&&steps<300;steps++){current=await advanceLife(current,provider);await onTurn?.(current,current.turns.at(-1)!);}if(current.status==='active')throw new Error('GAME_STEP_LIMIT');return current;}
export function replayLife(initial:Life,turns:TurnRecord[]):Life {let life=initial;for(const turn of turns){const prompt=promptFor(life);if(prompt.game!==turn.game||prompt.turnIndex!==turn.index||prompt.age!==turn.age||JSON.stringify(prompt.gameState)!==JSON.stringify(turn.stateBefore))throw new Error('REPLAY_STATE_MISMATCH');life=stepLife(life,{move:turn.invalid?'INVALID_AGENT_MOVE':turn.move,reason:turn.reason},life.endedAt??undefined);const actual=life.turns.at(-1)!;if(JSON.stringify({...actual,reason:undefined,providerError:undefined})!==JSON.stringify({...turn,reason:undefined,providerError:undefined}))throw new Error('REPLAY_RESULT_MISMATCH');life={...life,turns:[...life.turns.slice(0,-1),{...actual,providerError:turn.providerError}],runState:turn.providerError&&life.status==='active'?'provider_error':life.runState};}return life;}
export type { Role,GameId,Stats,StatDeltas } from '@axile/engines';
