import type { ReactNode } from 'react';

import type { MatchSetup, PlayerMark } from '@/types/welcome.types';

export type CompletedGame = Readonly<{
  sessionId: string;
  setup: Readonly<MatchSetup>;
  winner: PlayerMark | null;
  completedAt: number;
}>;

export type GameHistoryEntry = Readonly<CompletedGame & { id: string }>;

export type GameHistoryContextValue = {
  games: readonly GameHistoryEntry[];
  recordGame: (game: CompletedGame) => void;
  isLoading: boolean;
  error: string | null;
  reloadHistory: () => Promise<void>;
};

export type GameHistoryProviderProps = {
  children: ReactNode;
};

export type GameHistoryListProps = {
  games: readonly GameHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};
