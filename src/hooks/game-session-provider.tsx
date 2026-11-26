import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { gameSessionMessages } from '@/constants/game-session.constants';
import { getCompletedGame } from '@/game/game-history.logic';
import {
  applyMove,
  createGameSession,
  getCurrentPlayer,
  getDeviceMove,
} from '@/game/game.logic';
import { loadGameSession, saveGameSession } from '@/game/session.storage';
import { useGameHistory } from '@/hooks/game-history-provider';
import type {
  GameSessionContextValue,
  GameSessionProviderProps,
  SessionUpdate,
} from '@/types/game-session.types';
import type { GameSession } from '@/types/game.types';
import type { MatchSetup } from '@/types/welcome.types';

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

function createSessionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function GameSessionProvider({ children }: GameSessionProviderProps) {
  const { recordGame } = useGameHistory();
  const [session, setSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentSession = useRef<GameSession | null>(null);
  const isMounted = useRef(false);
  const isReady = useRef(false);
  const saveInProgress = useRef(false);
  const loadRevision = useRef(0);

  const restoreSession = useCallback(() => {
    const revision = ++loadRevision.current;
    isReady.current = false;

    return loadGameSession().then((savedSession) => {
      if (isMounted.current && revision === loadRevision.current) {
        currentSession.current = savedSession;
        setSession(savedSession);
      }
    }, () => {
      if (isMounted.current && revision === loadRevision.current) {
        setError(gameSessionMessages.loadFailed);
      }
    }).finally(() => {
      if (isMounted.current && revision === loadRevision.current) {
        // A new game may explicitly replace a corrupt snapshot after restore fails.
        isReady.current = true;
        setIsLoading(false);
      }
    });
  }, []);

  const reloadSession = useCallback(async () => {
    if (saveInProgress.current) {
      return;
    }

    setIsLoading(true);
    setError(null);
    await restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    isMounted.current = true;
    void restoreSession();

    return () => {
      isMounted.current = false;
      isReady.current = false;
      loadRevision.current += 1;
    };
  }, [restoreSession]);

  const commitSession = useCallback(async (update: SessionUpdate, failureMessage: string) => {
    if (!isReady.current || saveInProgress.current) {
      return false;
    }

    try {
      const previous = currentSession.current;
      const next = update(previous);

      if (!next || next === previous) {
        return false;
      }

      saveInProgress.current = true;
      setIsSaving(true);
      setError(null);

      // Publish only committed snapshots, so the visible board always has a saved copy.
      await saveGameSession(next);
      currentSession.current = next;

      if (isMounted.current) {
        setSession(next);
        const completedGame = getCompletedGame(next);

        if (completedGame) {
          recordGame(completedGame);
        }
      }

      return true;
    } catch {
      if (isMounted.current) {
        setError(failureMessage);
      }
      return false;
    } finally {
      saveInProgress.current = false;
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  }, [recordGame]);

  const startSession = useCallback((setup: MatchSetup) => commitSession(
    () => createGameSession(setup, createSessionId(), Date.now()),
    gameSessionMessages.startFailed,
  ), [commitSession]);

  const playMove = useCallback((index: number) => commitSession((current) => {
    if (!current) {
      return null;
    }

    const player = getCurrentPlayer(current.board);
    if (current.setup.mode === 'device' && player !== current.setup.mark) {
      return current;
    }

    return applyMove(current, index, player, Date.now());
  }, gameSessionMessages.moveFailed), [commitSession]);

  const playDeviceMove = useCallback((expectedSession: GameSession) => commitSession((current) => {
    if (!current || current !== expectedSession) {
      return current;
    }

    const index = getDeviceMove(current);
    return index === null
      ? current
      : applyMove(current, index, getCurrentPlayer(current.board), Date.now());
  }, gameSessionMessages.moveFailed), [commitSession]);

  const restartSession = useCallback(() => commitSession(
    (current) => current
      ? createGameSession(current.setup, createSessionId(), Date.now())
      : null,
    gameSessionMessages.restartFailed,
  ), [commitSession]);

  const value = useMemo(() => ({
    session,
    isLoading,
    isSaving,
    error,
    startSession,
    playMove,
    playDeviceMove,
    restartSession,
    reloadSession,
  }), [session, isLoading, isSaving, error, startSession, playMove, playDeviceMove, restartSession, reloadSession]);

  return <GameSessionContext value={value}>{children}</GameSessionContext>;
}

export function useGameSession() {
  const game = use(GameSessionContext);

  if (!game) {
    throw new Error('useGameSession must be used within GameSessionProvider.');
  }

  return game;
}
