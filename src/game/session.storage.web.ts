import { sessionStorageConfig, sessionStorageMessages } from '@/constants/session-storage.constants';
import type { GameHistoryEntry } from '@/types/game-history.types';
import type { GameSession } from '@/types/game.types';

import {
  createGameHistoryEntry,
  deserializeGameHistory,
  getCompletedGame,
  mergeGameHistory,
} from './game-history.logic';
import { deserializeGameSession, serializeGameSession } from './session.serialization';

let databasePromise: Promise<IDBDatabase> | null = null;

function openSessionDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error(sessionStorageMessages.unavailable));
  }

  if (!databasePromise) {
    const opening: Promise<IDBDatabase> = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(
        sessionStorageConfig.webDatabaseName,
        sessionStorageConfig.webVersion,
      );
      let settled = false;

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(sessionStorageConfig.webStoreName)) {
          database.createObjectStore(sessionStorageConfig.webStoreName);
        }
      };

      request.onerror = () => {
        settled = true;
        reject(request.error ?? new Error(sessionStorageMessages.unavailable));
      };

      request.onblocked = () => {
        settled = true;
        reject(new Error(sessionStorageMessages.blocked));
      };

      request.onsuccess = () => {
        const database = request.result;

        if (settled) {
          database.close();
          return;
        }

        settled = true;
        database.onversionchange = () => {
          database.close();
          if (databasePromise === opening) {
            databasePromise = null;
          }
        };
        database.onclose = () => {
          if (databasePromise === opening) {
            databasePromise = null;
          }
        };
        resolve(database);
      };
    }).catch((error) => {
      if (databasePromise === opening) {
        databasePromise = null;
      }
      throw error;
    });

    databasePromise = opening;
  }

  return databasePromise;
}

async function loadPayload(key: string): Promise<unknown> {
  const database = await openSessionDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(sessionStorageConfig.webStoreName, 'readonly');
    const request = transaction
      .objectStore(sessionStorageConfig.webStoreName)
      .get(key);
    let payload: unknown;

    request.onsuccess = () => {
      payload = request.result;
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error(sessionStorageMessages.readFailed));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error(sessionStorageMessages.readFailed));
    };
    transaction.oncomplete = () => {
      resolve(payload);
    };
  });
}

export async function loadGameSession(): Promise<GameSession | null> {
  const payload = await loadPayload(sessionStorageConfig.webSessionKey);
  return payload === undefined ? null : deserializeGameSession(payload);
}

export async function loadGameHistory(): Promise<readonly GameHistoryEntry[]> {
  return deserializeGameHistory(await loadPayload(sessionStorageConfig.webHistoryKey));
}

export async function saveGameSession(session: GameSession): Promise<void> {
  const payload = serializeGameSession(session);
  const completedGame = getCompletedGame(session);
  const database = await openSessionDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(sessionStorageConfig.webStoreName, 'readwrite', {
      durability: 'strict',
    });
    let failure: unknown;

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      reject(failure ?? transaction.error ?? new Error(sessionStorageMessages.writeFailed));
    };
    transaction.onabort = () => {
      reject(failure ?? transaction.error ?? new Error(sessionStorageMessages.writeFailed));
    };

    function abort(error: unknown) {
      failure = error;
      transaction.abort();
      reject(error);
    }

    try {
      const store = transaction.objectStore(sessionStorageConfig.webStoreName);
      store.put(payload, sessionStorageConfig.webSessionKey);

      if (completedGame) {
        const request = store.get(sessionStorageConfig.webHistoryKey);
        request.onsuccess = () => {
          try {
            const history = mergeGameHistory(
              [createGameHistoryEntry(completedGame)],
              deserializeGameHistory(request.result),
            );
            store.put(JSON.stringify(history), sessionStorageConfig.webHistoryKey);
          } catch (error) {
            abort(error);
          }
        };
      }
    } catch (error) {
      abort(error);
    }
  });
}
