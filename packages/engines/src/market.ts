import { rng } from './rng';
import { assertMove, type GameEngine } from './types';
export interface MarketState { regime: 'bull' | 'bear' | 'sideways' | 'volatile'; prices: number[]; cursor: number; done: boolean }
export const market: GameEngine<MarketState> = {
  init(seed) {
    const random = rng(seed), regime = random.pick(['bull', 'bear', 'sideways', 'volatile'] as const);
    const prices = [100];
    for (let i = 0; i < 11; i++) {
      const drift = regime === 'bull' ? 4 : regime === 'bear' ? -4 : 0;
      const spread = regime === 'volatile' ? 18 : 7;
      prices.push(Math.max(10, prices.at(-1)! + drift + random.int(-spread, spread)));
    }
    return { regime, prices, cursor: 7, done: false };
  },
  legalMoves: state => state.done ? [] : ['hold', ...['long', 'short'].flatMap(direction => [25, 50, 100].map(size => `${direction}:${size}`))],
  resolve(state, move) {
    assertMove(this.legalMoves(state), move);
    const [direction, sizeText] = move.split(':');
    const change = state.prices[state.cursor + 1] - state.prices[state.cursor];
    const size = Number(sizeText ?? 0) / 100;
    const money = Math.round(change * (direction === 'short' ? -1 : direction === 'long' ? 1 : 0) * size);
    const cursor = state.cursor + 1, done = cursor === state.prices.length - 1;
    return { state: { ...state, cursor, done }, statDeltas: { money, sanity: size === 1 ? -2 : direction === 'hold' ? 1 : 0, fame: money > 0 ? 1 : 0 }, log: [`Market moved ${change >= 0 ? '+' : ''}${change}. Position ${move}.`, 'The price was not aware of your plans.'], done };
  }
};
export function marketView(state: MarketState) { return { regime: state.regime, history: state.prices.slice(0, state.cursor + 1), round: state.cursor - 6, totalRounds: 4 }; }
