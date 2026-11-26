import { openDatabaseAsync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { sessionStorageConfig, sessionStorageSql } from '@/constants/session-storage.constants';
import type { GameSession } from '@/types/game.types';
import type { StoredGameSessionRow } from '@/types/session-storage.types';

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

  await database.runAsync(sessionStorageSql.save, payload);
}
