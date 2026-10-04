import { rng } from './rng';
import { assertMove, type GameEngine } from './types';
export interface NimState { piles: number[]; skill: number; seed: string; step: number; done: boolean }
function options(piles: number[]) { return piles.flatMap((count, pile) => Array.from({length: count}, (_, index) => `${pile}:${index+1}`)); }
function take(piles: number[], move: string) { const [pile, amount] = move.split(':').map(Number); return piles.map((n, i) => i === pile ? n - amount : n); }
export const nim: GameEngine<NimState> = {
  init(seed) { const random = rng(seed); return { piles: [random.int(1,3), random.int(2,4), random.int(3,5)], skill: random.int(0,4), seed, step: 0, done: false }; },
  legalMoves: state => state.done ? [] : options(state.piles),
  resolve(state, move) {
    assertMove(this.legalMoves(state), move);
    let piles = take(state.piles, move); const step = state.step + 1;
    if (piles.every(n => n === 0)) return { state: { ...state, piles, step, done: true }, statDeltas: { money: 5, sanity: 2 }, log: ['You took the last stone. Wages arrived.'], done: true };
    const choices = options(piles);
    const winning = choices.filter(candidate => take(piles,candidate).reduce((xor,n) => xor ^ n, 0) === 0);
    const random = rng(`${state.seed}:nim:${step}`);
    const reply = state.skill >= 2 && winning.length ? winning[0] : random.pick(choices);
    piles = take(piles,reply);
    const done = piles.every(n => n === 0);
    return { state: { ...state, piles, step, done }, statDeltas: done ? { sanity: -4, health: -1 } : {}, log: [`You removed ${move}. Opponent removed ${reply}.`, done ? 'The last stone belonged to someone else.' : 'The stones remain.'].filter(Boolean), done };
  }
};
export function nimView(state: NimState) { return { piles: state.piles, rounds: state.step }; }
