import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { useGameSession } from '@/hooks/game-session-provider';

export function useGameMenu() {
  const { isLoading, isSaving, restartSession } = useGameSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const restarting = useRef(false);
  const navigating = useRef(false);

  function open() {
    if (!isSaving && !restarting.current && !navigating.current) {
      setIsOpen(true);
    }
  }

  function close() {
    if (!isSaving && !restarting.current) {
      setIsOpen(false);
    }
  }

  function goHome() {
    if (isSaving || restarting.current || navigating.current) {
      return;
    }

    navigating.current = true;
    setIsLeaving(true);
    setIsOpen(false);
    router.dismissTo('/');
  }

  async function restart() {
    if (isLoading || isSaving || restarting.current || navigating.current) {
      return;
    }

    restarting.current = true;
    setIsRestarting(true);

    try {
      if (await restartSession()) {
        setIsOpen(false);
      }
    } finally {
      restarting.current = false;
      setIsRestarting(false);
    }
  }

  return {
    isOpen,
    isLeaving,
    busy: isSaving || isRestarting,
    open,
    close,
    goHome,
    restart,
  };
}
