import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { defaultMatchSetup } from '@/constants/welcome.constants';
import type { MatchSetup, PlayMode, WelcomeModalKind } from '@/types/welcome.types';

export function useWelcome() {
  const [savedSetup, setSavedSetup] = useState<MatchSetup | null>(null);
  const [selectedMode, setSelectedMode] = useState<PlayMode>(defaultMatchSetup.mode);
  const [draft, setDraft] = useState<MatchSetup>({ ...defaultMatchSetup });
  const [modal, setModal] = useState<WelcomeModalKind>(null);
  const pendingGame = useRef<MatchSetup | null>(null);

  const openGame = useCallback(() => {
    const setup = pendingGame.current;

    if (!setup) {
      return;
    }

    pendingGame.current = null;
    router.push({ pathname: '/game', params: { ...setup } });
  }, []);

  useEffect(() => {
    // iOS waits for the native modal dismissal callback before navigation.
    if (process.env.EXPO_OS !== 'ios' && modal === null) {
      openGame();
    }
  }, [modal, openGame]);

  function openSetup() {
    const nextSetup = savedSetup ?? defaultMatchSetup;
    setDraft({ ...nextSetup, mode: selectedMode });
    setModal('setup');
  }

  function startGame() {
    if (modal !== 'setup' || pendingGame.current) {
      return;
    }

    const setup = { ...draft };
    pendingGame.current = setup;
    setSavedSetup(setup);
    setSelectedMode(setup.mode);
    setModal(null);
  }

  return {
    savedSetup: savedSetup?.mode === selectedMode ? savedSetup : null,
    selectedMode,
    selectMode: setSelectedMode,
    draft,
    modal,
    openSetup,
    openHistory: () => setModal('history'),
    closeModal: () => setModal(null),
    updateDraft: setDraft,
    startGame,
    onModalDismiss: openGame,
  };
}
