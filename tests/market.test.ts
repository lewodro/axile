import { expect, it } from 'vitest';
import { market, marketView, type LifeState } from '@axile/engines';
const life: LifeState = { role: 'trader', money: 30, health: 45, fame: 15, sanity: 35, age: 0, turnIndex: 0 };
it('market is reproducible and hides the future', () => {
  let a = market.init('a', life), b = market.init('a', life);
  expect(marketView(a).history).toHaveLength(8);
  for (const move of ['long:25', 'short:100', 'hold', 'long:50']) { const x = market.resolve(a, move), y = market.resolve(b, move); expect(x).toEqual(y); a = x.state; b = y.state; }
  expect(a.done).toBe(true); expect(market.legalMoves(a)).toEqual([]);
});
it('accepts every legal position without mutating input', () => { const s = market.init('b', life), copy = structuredClone(s); for (const m of market.legalMoves(s)) expect(market.resolve(s,m).state.cursor).toBe(8); expect(s).toEqual(copy); });
it('rejects invalid market moves', () => { expect(() => market.resolve(market.init('a', life), 'long:101')).toThrow('INVALID_MOVE'); });
