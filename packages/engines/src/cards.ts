import { rng } from './rng';
import { assertMove, type GameEngine } from './types';
export interface CardsState { deck:number[]; cursor:number; visible:number; done:boolean }
export const cards:GameEngine<CardsState>={
 init(seed){const deck=rng(seed).shuffle(Array.from({length:52},(_,i)=>i%13+1));return {deck,cursor:0,visible:deck[0],done:false};},
 legalMoves:state=>state.done?[]:['higher','lower'],
 resolve(state,move){
  assertMove(this.legalMoves(state),move);const next=state.deck[state.cursor+1], correct=move==='higher'?next>state.visible:next<state.visible;
  const cursor=state.cursor+1,done=cursor===5;
  return {state:{...state,cursor,visible:next,done},statDeltas:{money:correct?3:-3,sanity:next===state.visible?-1:correct?1:-1},log:[`The next card was ${next}. ${next===state.visible?'A tie; the house kept the point.':correct?'You called it.':'You did not call it.'}`],done};
 }
};
export function cardsView(state:CardsState){return {visible:state.visible,round:state.cursor+1,total:5};}
