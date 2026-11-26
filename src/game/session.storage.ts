import { openDatabaseAsync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { sessionStorageConfig, sessionStorageSql } from '@/constants/session-storage.constants';
import type { GameHistoryEntry } from '@/types/game-history.types';
import type { GameSession } from '@/types/game.types';
import type { StoredGameSessionRow } from '@/types/session-storage.types';

import {
  createGameHistoryEntry,
  deserializeGameHistory,
  getCompletedGame,
  mergeGameHistory,
} from './game-history.logic';
import { deserializeGameSession, serializeGameSession } from './session.serialization';

let databasePromise: Promise<SQLiteDatabase> | null = null;

function openSessionDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(sessionStorageConfig.databaseName)
      .then(async (database) => {
        try {
          await database.execAsync(sessionStorageSql.initialize);
          return database;
        } catch (error) {
          await database.closeAsync().catch(() => undefined);
          throw error;
        }
      })
      .catch((error) => {
        databasePromise = null;
        throw error;
      });
  }

  return databasePromise;
}

export async function loadGameSession(): Promise<GameSession | null> {
  const database = await openSessionDatabase();
  const row = await database.getFirstAsync<StoredGameSessionRow>(sessionStorageSql.load);

  return row ? deserializeGameSession(row.payload) : null;
}

export async function saveGameSession(session: GameSession): Promise<void> {
  const payload = serializeGameSession(session);
  const database = await openSessionDatabase();
  const completedGame = getCompletedGame(session);

  if (!completedGame) {
    await database.runAsync(sessionStorageSql.save, payload);
    return;
  }

  // The final board and its history entry must either both commit or both fail.
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const row = await transaction.getFirstAsync<StoredGameSessionRow>(sessionStorageSql.loadHistory);
    const games = mergeGameHistory(
      [createGameHistoryEntry(completedGame)],
      deserializeGameHistory(row?.payload),
    );

    await transaction.runAsync(sessionStorageSql.save, payload);
    await transaction.runAsync(sessionStorageSql.saveHistory, JSON.stringify(games));
  });
}

export async function loadGameHistory(): Promise<readonly GameHistoryEntry[]> {
  const database = await openSessionDatabase();
  const row = await database.getFirstAsync<StoredGameSessionRow>(sessionStorageSql.loadHistory);

  return deserializeGameHistory(row?.payload);
}
