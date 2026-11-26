import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { gameHistoryCopy } from '@/constants/game-history.constants';
import { createGameHistoryEntry, mergeGameHistory } from '@/game/game-history.logic';
import { loadGameHistory } from '@/game/session.storage';
import type {
  CompletedGame,
  GameHistoryContextValue,
  GameHistoryEntry,
  GameHistoryProviderProps,
} from '@/types/game-history.types';

const GameHistoryContext = createContext<GameHistoryContextValue | null>(null);

export function GameHistoryProvider({ children }: GameHistoryProviderProps) {
  const [games, setGames] = useState<readonly GameHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(false);
  const loadRevision = useRef(0);

  const restoreHistory = useCallback(() => {
    const revision = ++loadRevision.current;

    return loadGameHistory().then((saved) => {
      if (isMounted.current && revision === loadRevision.current) {
        // A round may finish while the initial history read is still in flight.
        setGames((current) => mergeGameHistory(current, saved));
      }
    }, () => {
      if (isMounted.current && revision === loadRevision.current) {
        setError(gameHistoryCopy.loadFailed);
      }
    }).finally(() => {
      if (isMounted.current && revision === loadRevision.current) {
        setIsLoading(false);
      }
    });
  }, []);

  const reloadHistory = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return restoreHistory();
  }, [restoreHistory]);

  useEffect(() => {
    isMounted.current = true;
    void restoreHistory();

    return () => {
      isMounted.current = false;
      loadRevision.current += 1;
    };
  }, [restoreHistory]);

  const recordGame = useCallback((game: CompletedGame) => {
    // Session storage has already committed this result with the final move.
    const entry = createGameHistoryEntry(game);
    setGames((current) => mergeGameHistory([entry], current));
  }, []);

  const value = useMemo(() => ({
    games,
    recordGame,
    isLoading,
    error,
    reloadHistory,
  }), [games, recordGame, isLoading, error, reloadHistory]);

  return <GameHistoryContext value={value}>{children}</GameHistoryContext>;
}

export function useGameHistory() {
  const history = use(GameHistoryContext);

  if (!history) {
    throw new Error('useGameHistory must be used within GameHistoryProvider.');
  }

  return history;
}
