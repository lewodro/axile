export const STAT_KEYS = ['money', 'health', 'fame', 'sanity'] as const;
export type Stat = typeof STAT_KEYS[number];
export type Stats = Record<Stat, number>;
export type StatDeltas = Partial<Stats>;
export type Role = 'trader' | 'worker' | 'family' | 'wildcard';
export type GameId = 'market' | 'chess' | 'nim' | 'shift' | 'dilemma' | 'cards';
export interface LifeState extends Stats { role: Role; age: number; turnIndex: number }
export interface Resolution<S> { state: S; statDeltas: StatDeltas; log: string[]; done: boolean }
export interface GameEngine<S> {
  init(seed: string, life: LifeState): S;
  legalMoves(state: S): string[];
  resolve(state: S, move: string): Resolution<S>;
}
export function assertMove(moves: string[], move: string): void {
  if (!moves.includes(move)) throw new Error(`INVALID_MOVE: ${move}`);
}
