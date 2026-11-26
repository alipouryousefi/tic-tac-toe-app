import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useGameSession } from '@/hooks/game-session-provider';

export function useGameMenu() {
  const { isLoading, isSaving, restartSession } = useGameSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const restarting = useRef(false);
  const pendingHome = useRef(false);

  const finishGoingHome = useCallback(() => {
    if (pendingHome.current) {
      pendingHome.current = false;
      router.dismissTo('/');
    }
  }, []);

  useEffect(() => {
    // iOS finishes navigation after the native modal has dismissed.
    if (process.env.EXPO_OS !== 'ios' && !isOpen) {
      finishGoingHome();
    }
  }, [isOpen, isLeaving, finishGoingHome]);

  function open() {
    if (!isSaving && !restarting.current && !pendingHome.current) {
      setIsOpen(true);
    }
  }

  function close() {
    if (!isSaving && !restarting.current) {
      setIsOpen(false);
    }
  }

  function goHome() {
    if (isSaving || restarting.current || pendingHome.current) {
      return;
    }

    pendingHome.current = true;
    setIsLeaving(true);
    setIsOpen(false);
  }

  async function restart() {
    if (isLoading || isSaving || restarting.current || pendingHome.current) {
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
    onDismiss: finishGoingHome,
  };
}
