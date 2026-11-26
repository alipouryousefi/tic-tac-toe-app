import type { ReactNode } from 'react';

import type { GameSession } from '@/types/game.types';
import type { MatchSetup } from '@/types/welcome.types';

export type SessionUpdate = (current: GameSession | null) => GameSession | null;

export type GameSessionContextValue = {
  session: GameSession | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  startSession: (setup: MatchSetup) => Promise<boolean>;
  playMove: (index: number) => Promise<boolean>;
  playDeviceMove: (expectedSession: GameSession) => Promise<boolean>;
  restartSession: () => Promise<boolean>;
  reloadSession: () => Promise<void>;
};

export type GameSessionProviderProps = {
  children: ReactNode;
};
