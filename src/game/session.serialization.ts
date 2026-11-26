import { sessionStorageMessages } from '@/constants/session-storage.constants';
import type { GameSession } from '@/types/game.types';

import { isGameSession } from './game.logic';

export function deserializeGameSession(payload: unknown): GameSession {
  let session: unknown;

  try {
    session = typeof payload === 'string' ? JSON.parse(payload) : null;
  } catch {
    throw new Error(sessionStorageMessages.invalidSavedGame);
  }

  if (!isGameSession(session)) {
    throw new Error(sessionStorageMessages.invalidSavedGame);
  }

  return session;
}

export function serializeGameSession(session: GameSession): string {
  if (!isGameSession(session)) {
    throw new Error(sessionStorageMessages.invalidNewGame);
  }

  return JSON.stringify(session);
}
