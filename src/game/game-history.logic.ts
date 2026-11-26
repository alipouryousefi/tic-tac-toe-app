import { gameHistoryLimit } from '@/constants/game-history.constants';
import { sessionStorageMessages } from '@/constants/session-storage.constants';
import type { CompletedGame, GameHistoryEntry } from '@/types/game-history.types';
import type { GameSession } from '@/types/game.types';

import { getGameOutcome } from './game.logic';

export function getCompletedGame(session: GameSession): CompletedGame | null {
  const outcome = getGameOutcome(session.board);

  return outcome.status === 'playing' ? null : {
    sessionId: session.id,
    setup: session.setup,
    winner: outcome.winner,
    completedAt: session.updatedAt,
  };
}

export function createGameHistoryEntry(game: CompletedGame): GameHistoryEntry {
  return { ...game, setup: { ...game.setup }, id: game.sessionId };
}

export function mergeGameHistory(
  ...groups: readonly (readonly GameHistoryEntry[])[]
): readonly GameHistoryEntry[] {
  const unique = new Map<string, GameHistoryEntry>();

  for (const group of groups) {
    for (const game of group) {
      if (!unique.has(game.id)) {
        unique.set(game.id, game);
      }
    }
  }

  return [...unique.values()]
    .sort((first, second) => second.completedAt - first.completedAt)
    .slice(0, gameHistoryLimit);
}

function isGameHistoryEntry(value: unknown): value is GameHistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const game = value as Partial<GameHistoryEntry>;
  const setup = game.setup;

  return typeof game.sessionId === 'string' && game.sessionId.trim().length > 0 &&
    game.id === game.sessionId &&
    typeof game.completedAt === 'number' && Number.isSafeInteger(game.completedAt) &&
    game.completedAt >= 0 &&
    (game.winner === null || game.winner === 'X' || game.winner === 'O') &&
    typeof setup === 'object' && setup !== null &&
    (setup.mode === 'friend' || setup.mode === 'device') &&
    (setup.mark === 'X' || setup.mark === 'O') &&
    (setup.difficulty === 'easy' || setup.difficulty === 'normal' || setup.difficulty === 'hard');
}

export function deserializeGameHistory(payload: unknown): readonly GameHistoryEntry[] {
  if (payload === undefined) {
    return [];
  }

  let games: unknown;

  try {
    games = typeof payload === 'string' ? JSON.parse(payload) : null;
  } catch {
    throw new Error(sessionStorageMessages.invalidHistory);
  }

  if (!Array.isArray(games) || !games.every(isGameHistoryEntry)) {
    throw new Error(sessionStorageMessages.invalidHistory);
  }

  return mergeGameHistory(games);
}
