import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { gameHistoryCopy } from '@/constants/game-history.constants';
import { defaultMatchSetup } from '@/constants/welcome.constants';
import { getCurrentPlayer, getGameOutcome } from '@/game/game.logic';
import { useGameSession } from '@/hooks/game-session-provider';
import type { MatchSetup, PlayMode, WelcomeModalKind } from '@/types/welcome.types';

export function useWelcome() {
  const { session, isLoading, isSaving, error, startSession, reloadSession } = useGameSession();
  const [savedSetup, setSavedSetup] = useState<MatchSetup | null>(null);
  const [selectedMode, setSelectedMode] = useState<PlayMode>(defaultMatchSetup.mode);
  const [draft, setDraft] = useState<MatchSetup>({ ...defaultMatchSetup });
  const [modal, setModal] = useState<WelcomeModalKind>(null);
  const pendingGame = useRef<MatchSetup | null>(null);
  const starting = useRef(false);
  const [isStarting, setIsStarting] = useState(false);
  const canResume = !!session && getGameOutcome(session.board).status === 'playing';
  const resumeDescription = canResume && session
    ? `${gameHistoryCopy.opponents[session.setup.mode]} · ${getCurrentPlayer(session.board)} to play`
    : null;

  const openGame = useCallback(() => {
    const setup = pendingGame.current;

    if (!setup) {
      return;
    }

    pendingGame.current = null;
    router.navigate({ pathname: '/game', params: { ...setup } });
  }, []);

  useEffect(() => {
    // iOS waits for the native modal dismissal callback before navigation.
    if (process.env.EXPO_OS !== 'ios' && modal === null) {
      openGame();
    }
  }, [modal, openGame]);

  function openSetup() {
    if (isLoading || isSaving || starting.current) {
      return;
    }

    const nextSetup = savedSetup ?? session?.setup ?? defaultMatchSetup;
    setDraft({ ...nextSetup, mode: selectedMode });
    setModal('setup');
  }

  async function startGame() {
    if (modal !== 'setup' || pendingGame.current || starting.current) {
      return;
    }

    const setup = { ...draft };
    starting.current = true;
    setIsStarting(true);

    try {
      const created = await startSession(setup);

      if (created) {
        pendingGame.current = setup;
        setSavedSetup(setup);
        setSelectedMode(setup.mode);
        setModal(null);
      }
    } finally {
      starting.current = false;
      setIsStarting(false);
    }
  }

  function resumeGame() {
    if (canResume && session && !isLoading && !isSaving) {
      router.navigate({ pathname: '/game', params: { ...session.setup } });
    }
  }

  function closeModal() {
    if (!starting.current) {
      setModal(null);
    }
  }

  return {
    savedSetup: savedSetup?.mode === selectedMode ? savedSetup : null,
    selectedMode,
    selectMode: setSelectedMode,
    draft,
    modal,
    canResume,
    resumeDescription,
    resumeGame,
    isLoading,
    isStarting,
    isBusy: isLoading || isSaving || isStarting,
    error,
    reloadSession,
    openSetup,
    openHistory: () => {
      if (!starting.current) setModal('history');
    },
    closeModal,
    updateDraft: (setup: MatchSetup) => {
      if (!starting.current) setDraft(setup);
    },
    startGame,
    onModalDismiss: openGame,
  };
}
