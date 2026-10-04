import { expect, it } from 'vitest';
import { chess, type LifeState } from '@axile/engines';
const life: LifeState = { role: 'trader', money: 30, health: 45, fame: 15, sanity: 35, age: 0, turnIndex: 0 };
it('plays both curated tactical lines', () => {
  const found = new Set<number>();
  for (let i=0; i<20; i++) { let state = chess.init(String(i),life); found.add(state.puzzle); const first = chess.resolve(state, state.puzzle === 0 ? 'Qg7#' : 'Qe7'); state = first.state; if (!first.done) state = chess.resolve(state, 'Qg7#').state; expect(state.solved).toBe(true); expect(chess.legalMoves(state)).toEqual([]); }
  expect(found).toEqual(new Set([0,1]));
});
it('rejects illegal SAN and penalizes a legal wrong choice', () => { const state = chess.init('a',life); expect(() => chess.resolve(state,'NotChess')).toThrow('INVALID_MOVE'); const wrong = chess.legalMoves(state).find(m => m !== (state.puzzle === 0 ? 'Qg7#' : 'Qe7'))!; expect(chess.resolve(state,wrong).statDeltas.sanity).toBe(-4); });
