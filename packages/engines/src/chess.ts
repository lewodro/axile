import { Chess } from 'chess.js';
import { rng } from './rng';
import { assertMove, type GameEngine } from './types';
const puzzles = [
  { fen: '7k/8/5K2/6Q1/8/8/8/8 w - - 0 1', line: ['Qg7#'], reply: '', label: 'Mate in one' },
  { fen: '7k/8/5K2/8/4Q3/8/8/8 w - - 0 1', line: ['Qe7', 'Qg7#'], reply: 'Kg8', label: 'Mate in two' }
] as const;
export interface ChessState { puzzle: number; fen: string; step: number; done: boolean; solved: boolean }
export const chess: GameEngine<ChessState> = {
  init(seed) { const puzzle = rng(seed).int(0, puzzles.length - 1); return { puzzle, fen: puzzles[puzzle].fen, step: 0, done: false, solved: false }; },
  legalMoves: state => state.done ? [] : new Chess(state.fen).moves(),
  resolve(state, move) {
    assertMove(this.legalMoves(state), move);
    const puzzle = puzzles[state.puzzle];
    if (move !== puzzle.line[state.step]) return { state: { ...state, done: true }, statDeltas: { sanity: -4 }, log: ['The position survived your idea.'], done: true };
    const board = new Chess(state.fen); board.move(move);
    const step = state.step + 1, done = step === puzzle.line.length;
    if (!done) board.move(puzzle.reply);
    return { state: { ...state, fen: board.fen(), step, done, solved: done }, statDeltas: done ? { fame: 5, money: 2 } : {}, log: done ? ['A small piece of certainty.'] : [`${move}; opponent answered ${puzzle.reply}.`], done };
  }
};
export function chessView(state: ChessState) { return { fen: state.fen, puzzle: puzzles[state.puzzle].label, move: state.step + 1 }; }
