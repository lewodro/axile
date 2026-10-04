import { rng } from './rng';
import { assertMove, type GameEngine } from './types';
export type Choice = 'cooperate'|'defect';
export interface DilemmaState { strategy:'kind'|'hostile'|'mirror'|'grudge'|'mixed'; seed:string; rounds:{you:Choice;them:Choice}[]; done:boolean }
export const dilemma:GameEngine<DilemmaState>={
 init(seed){return {strategy:rng(seed).pick(['kind','hostile','mirror','grudge','mixed'] as const),seed,rounds:[],done:false};},
 legalMoves:state=>state.done?[]:['cooperate','defect'],
 resolve(state,move){
  assertMove(this.legalMoves(state),move); const you=move as Choice, index=state.rounds.length;
  const them:Choice=state.strategy==='kind'?'cooperate':state.strategy==='hostile'?'defect':state.strategy==='mirror'?(state.rounds.at(-1)?.you??'cooperate'):state.strategy==='grudge'?(state.rounds.some(x=>x.you==='defect')?'defect':'cooperate'):(rng(`${state.seed}:pd:${index}`).int(0,1)===0?'cooperate':'defect');
  const rounds=[...state.rounds,{you,them}], done=rounds.length===5;
  const money=you==='cooperate'?(them==='cooperate'?3:-2):(them==='cooperate'?5:-1);
  const sanity=you==='cooperate'&&them==='cooperate'?2:you==='defect'&&them==='defect'?-2:-1;
  return {state:{...state,rounds,done},statDeltas:{money,sanity},log:[`Round ${rounds.length}: you ${you}; they ${them}.`],done};
 }
};
export function dilemmaView(state:DilemmaState){return {round:state.rounds.length+1,total:5,history:state.rounds};}
