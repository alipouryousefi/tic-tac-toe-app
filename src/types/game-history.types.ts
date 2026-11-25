import type { ReactElement, ReactNode } from 'react';

import type { MatchSetup, PlayerMark } from '@/types/welcome.types';

export type CompletedGame = Readonly<{
  setup: Readonly<MatchSetup>;
  winner: PlayerMark | null;
  completedAt: number;
}>;

export type GameHistoryEntry = Readonly<CompletedGame & { id: string }>;

export type GameHistoryContextValue = {
  games: readonly GameHistoryEntry[];
  recordGame: (game: CompletedGame) => void;
};

export type GameHistoryProviderProps = {
  children: ReactNode;
};

export type GameHistoryListProps = {
  games: readonly GameHistoryEntry[];
  header: ReactElement;
  footer: ReactElement;
};
