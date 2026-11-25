import { createContext, use, useCallback, useMemo, useRef, useState } from 'react';

import type {
  CompletedGame,
  GameHistoryContextValue,
  GameHistoryEntry,
  GameHistoryProviderProps,
} from '@/types/game-history.types';

const GameHistoryContext = createContext<GameHistoryContextValue | null>(null);

export function GameHistoryProvider({ children }: GameHistoryProviderProps) {
  const [games, setGames] = useState<readonly GameHistoryEntry[]>([]);
  const nextId = useRef(0);

  const recordGame = useCallback((game: CompletedGame) => {
    const entry: GameHistoryEntry = {
      ...game,
      setup: { ...game.setup },
      id: `game-${nextId.current++}`,
    };

    setGames((current) =>
      [entry, ...current].sort((first, second) => second.completedAt - first.completedAt),
    );
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
