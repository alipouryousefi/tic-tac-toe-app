import { createContext, use, useCallback, useMemo, useState } from 'react';

import type {
  CompletedGame,
  GameHistoryContextValue,
  GameHistoryEntry,
  GameHistoryProviderProps,
} from '@/types/game-history.types';

const GameHistoryContext = createContext<GameHistoryContextValue | null>(null);

export function GameHistoryProvider({ children }: GameHistoryProviderProps) {
  const [games, setGames] = useState<readonly GameHistoryEntry[]>([]);

  const recordGame = useCallback((game: CompletedGame) => {
    const entry: GameHistoryEntry = {
      ...game,
      setup: { ...game.setup },
      id: game.sessionId,
    };

    setGames((current) => {
      if (current.some((existing) => existing.id === entry.id)) {
        return current;
      }

      return [entry, ...current].sort((first, second) => second.completedAt - first.completedAt);
    });
  }, []);

  const value = useMemo(() => ({ games, recordGame }), [games, recordGame]);

  return <GameHistoryContext value={value}>{children}</GameHistoryContext>;
}

export function useGameHistory() {
  const history = use(GameHistoryContext);

  if (!history) {
    throw new Error('useGameHistory must be used within GameHistoryProvider.');
  }

  return history;
}
