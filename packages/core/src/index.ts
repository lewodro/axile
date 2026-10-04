import { market,marketView,chess,chessView,nim,nimView,shift,shiftView,dilemma,dilemmaView,cards,cardsView,rng,STAT_KEYS,type GameId,type LifeState,type Role,type Stats,type StatDeltas,type MarketState,type ChessState,type NimState,type ShiftState,type DilemmaState,type CardsState,type GameEngine } from '@axile/engines';
export type GameState=MarketState|ChessState|NimState|ShiftState|DilemmaState|CardsState;
export type LifeStatus='active'|'completed'|'collapsed';
export const ROLES:Record<Role,{stats:Stats;games:GameId[];description:string}>={
 trader:{stats:{money:30,health:45,fame:15,sanity:35},games:['market','chess'],description:'Charts at 4am. Sleep is a position you closed.'},
 worker:{stats:{money:35,health:65,fame:5,sanity:65},games:['nim','shift'],description:'Reliable until the universe files an objection.'},
 family:{stats:{money:25,health:60,fame:10,sanity:70},games:['dilemma','cards'],description:'Trust is an asset with strange liquidity.'},
 wildcard:{stats:{money:40,health:45,fame:40,sanity:30},games:['market','chess','nim','shift','dilemma','cards'],description:'No strategy. A respectable amount of nerve.'}
};
export const ACHIEVEMENT_BONUSES={LONG_LIFE:20,BROKE_BUT_FAMOUS:15,UNTOUCHABLE:12,STILL_SANE:12,MARKET_SURVIVOR:10,PERFECT_GAME:5} as const;
export type Achievement=keyof typeof ACHIEVEMENT_BONUSES;
export interface AgentIdentity { id:string;name:string;sprite:string;provider:string }
export interface TurnRecord { index:number;age:number;game:GameId;stateBefore:unknown;move:string;reason:string;deltas:StatDeltas;statsAfter:Stats;engineLog:string[];invalid:boolean;completedGame:boolean }
export interface Life { id:string;agent:AgentIdentity;role:Role;seed:string;status:LifeStatus;stats:Stats;age:number;turnIndex:number;game:GameId|null;gameState:GameState|null;moveIndex:number;turns:TurnRecord[];achievements:Achievement[];achievementBonus:number;score:number|null;startedAt:string;endedAt:string|null }
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
export function createLife(input:{id:string;agent:AgentIdentity;role:Role;seed:string;now?:string}):Life {const game=chapterGame(input.role,input.seed,0),stats={...ROLES[input.role].stats};return {id:input.id,agent:input.agent,role:input.role,seed:input.seed,status:'active',stats,age:0,turnIndex:0,game,gameState:engine(game).init(`${input.seed}:0:${game}`,{...stats,role:input.role,age:0,turnIndex:0}),moveIndex:0,turns:[],achievements:[],achievementBonus:0,score:null,startedAt:input.now??new Date().toISOString(),endedAt:null};}
export function promptFor(life:Life):AgentPrompt{if(life.status!=='active'||!life.game||!life.gameState)throw new Error('LIFE_ENDED');return {identity:life.agent,role:life.role,age:life.age,stats:life.stats,game:life.game,gameState:view(life.game,life.gameState),legalMoves:engine(life.game).legalMoves(life.gameState),recentHistory:life.turns.slice(-3).map(({game,move,deltas})=>({game,move,deltas})),turnIndex:life.turnIndex,moveIndex:life.moveIndex,seedHint:`${life.seed}:${life.turnIndex}:${life.moveIndex}`};}
export function stepLife(life:Life,decision:AgentDecision,now?:string):Life{
 if(life.status!=='active'||!life.game||!life.gameState)throw new Error('LIFE_ENDED');
 const game=life.game,state=life.gameState,legal=engine(game).legalMoves(state),invalid=!legal.includes(decision.move);
 if(!legal.length)throw new Error('NO_LEGAL_MOVES');
 const move=invalid?legal[0]:decision.move,result=engine(game).resolve(state,move);
 const deltas={...result.statDeltas};if(invalid)deltas.sanity=(deltas.sanity??0)-2;
 const stats=applyDeltas(life.stats,deltas),collapsed=STAT_KEYS.some(key=>stats[key]===0);
 const turn:TurnRecord={index:life.turnIndex,age:life.age,game,stateBefore:view(game,state),move,reason:decision.reason,deltas,statsAfter:stats,engineLog:invalid?['INVALID_AGENT_MOVE',...result.log]:result.log,invalid,completedGame:result.done};
 let next:Life={...life,stats,gameState:result.state,moveIndex:life.moveIndex+1,turns:[...life.turns,turn]};
 if(collapsed){next={...next,status:'collapsed',game:null,gameState:null,endedAt:now??new Date().toISOString()};}
 else if(result.done){const turnIndex=life.turnIndex+1,age=turnIndex*5,completed=turnIndex===14;
  if(completed)next={...next,turnIndex,age,status:'completed',game:null,gameState:null,endedAt:now??new Date().toISOString()};
  else {const nextGame=chapterGame(life.role,life.seed,turnIndex),lifeState:LifeState={...stats,role:life.role,age,turnIndex};next={...next,age,turnIndex,game:nextGame,gameState:engine(nextGame).init(`${life.seed}:${turnIndex}:${nextGame}`,lifeState),moveIndex:0};}
 }
 if(next.status!=='active')next={...next,...scoreLife(next)};
 return next;
}
export async function advanceLife(life:Life,provider:AgentProvider,now?:string):Promise<Life>{const prompt=promptFor(life);let decision:AgentDecision|undefined;
 for(let attempt=0;attempt<2;attempt++){try{const candidate=await provider.decide(prompt);if(prompt.legalMoves.includes(candidate.move)){decision=candidate;break;}}catch{/* deterministic fallback after retry */}}
 return stepLife(life,decision??{move:'INVALID_AGENT_MOVE',reason:'No valid response; the first legal move was used.'},now);
}
export async function runLife(life:Life,provider:AgentProvider,onTurn?:(life:Life,turn:TurnRecord)=>Promise<void>):Promise<Life>{let current=life;for(let steps=0;current.status==='active'&&steps<300;steps++){current=await advanceLife(current,provider);await onTurn?.(current,current.turns.at(-1)!);}if(current.status==='active')throw new Error('GAME_STEP_LIMIT');return current;}
export function replayLife(initial:Life,turns:TurnRecord[]):Life {let life=initial;for(const turn of turns){const prompt=promptFor(life);if(prompt.game!==turn.game||prompt.turnIndex!==turn.index||prompt.age!==turn.age||JSON.stringify(prompt.gameState)!==JSON.stringify(turn.stateBefore))throw new Error('REPLAY_STATE_MISMATCH');life=stepLife(life,{move:turn.invalid?'INVALID_AGENT_MOVE':turn.move,reason:turn.reason},life.endedAt??undefined);const actual=life.turns.at(-1)!;if(JSON.stringify({...actual,reason:undefined})!==JSON.stringify({...turn,reason:undefined}))throw new Error('REPLAY_RESULT_MISMATCH');}return life;}
export type { Role,GameId,Stats,StatDeltas } from '@axile/engines';
