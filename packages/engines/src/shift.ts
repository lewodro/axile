import { rng } from './rng';
import { assertMove, type GameEngine } from './types';
export interface ShiftState { board: string[]; seed: string; ply: number; done: boolean; winner: 'X'|'O'|null }
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function winner(board: string[], token: string) { return lines.some(line => line.every(i => board[i] === token)); }
function moves(board: string[], token: string) {
  const own = board.flatMap((cell,i)=>cell===token?[i]:[]), empty = board.flatMap((cell,i)=>cell==='.'?[i]:[]);
  return own.length < 3 ? empty.map(i=>String(i)) : own.flatMap(from=>empty.map(to=>`${from}>${to}`));
}
function apply(board: string[], token: string, move: string) { const result=[...board]; const parts=move.split('>').map(Number); if(parts.length===2) result[parts[0]]='.'; result[parts.at(-1)!]=token; return result; }
export const shift: GameEngine<ShiftState> = {
  init(seed) { return { board: Array(9).fill('.'), seed, ply: 0, done: false, winner: null }; },
  legalMoves: state => state.done ? [] : moves(state.board,'X'),
  resolve(state,move) {
    assertMove(this.legalMoves(state),move);
    let board=apply(state.board,'X',move), ply=state.ply+1;
    if(winner(board,'X')) return { state:{...state,board,ply,done:true,winner:'X'},statDeltas:{money:4,fame:2},log:['Three marks in a row. Against all odds.'],done:true };
    const choices=moves(board,'O');
    const win=choices.find(candidate=>winner(apply(board,'O',candidate),'O'));
    const block=choices.find(candidate=>winner(apply(board,'X',candidate),'X'));
    const reply=win ?? block ?? rng(`${state.seed}:shift:${ply}`).pick(choices);
    board=apply(board,'O',reply); ply++;
    const lost=winner(board,'O'), done=lost || ply>=18;
    return { state:{...state,board,ply,done,winner:lost?'O':null},statDeltas:lost?{sanity:-3}:done?{sanity:1}:{},log:[`You played ${move}; the board answered ${reply}.`,lost?'A line appeared. It was not yours.':done?'The board outlived its argument.':'Another move remains.'],done };
  }
};
export function shiftView(state:ShiftState){return {board:state.board,round:Math.ceil(state.ply/2),winner:state.winner};}
