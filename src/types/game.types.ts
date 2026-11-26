import type { MatchSetup, PlayerMark } from '@/types/welcome.types';

export type GameCell = PlayerMark | null;
export type GameBoard = readonly GameCell[];

export type GameSession = {
  version: 1;
  id: string;
  setup: MatchSetup;
  board: GameBoard;
  startedAt: number;
  updatedAt: number;
};

export type GameOutcome =
  | { status: 'playing' | 'draw'; winner: null; winningLine: null }
  | { status: 'won'; winner: PlayerMark; winningLine: readonly number[] };
