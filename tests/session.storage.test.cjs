const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { test } = require('node:test');

const { createGameSession, applyMove, getCurrentPlayer } = require('@/game/game.logic');
const { sessionStorageConfig } = require('@/constants/session-storage.constants');

function createSession(id = 'round-1') {
  return createGameSession({ mode: 'friend', mark: 'X', difficulty: 'normal' }, id, 1000);
}

function createStorageHarness(t, { failOpens = 0, failInitializations = 0 } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tic-tac-toe-session-'));
  const databasePath = path.join(directory, sessionStorageConfig.databaseName);
  const connections = [];
  let openCount = 0;
  let closeCount = 0;

  const openDatabaseAsync = async () => {
    openCount += 1;

    if (failOpens > 0) {
      failOpens -= 1;
      throw new Error('Temporary database open failure');
    }

    const database = new DatabaseSync(databasePath);
    connections.push(database);

    return {
      execAsync: async (sql) => {
        if (failInitializations > 0) {
          failInitializations -= 1;
          throw new Error('Temporary schema initialization failure');
        }
        database.exec(sql);
      },
      getFirstAsync: async (sql, ...bindings) => database.prepare(sql).get(...bindings) ?? null,
      runAsync: async (sql, ...bindings) => database.prepare(sql).run(...bindings),
      closeAsync: async () => {
        closeCount += 1;
        database.close();
      },
    };
  };

  function reload() {
    const filename = require.resolve('@/game/session.storage');
    delete require.cache[filename];
    const load = Module._load;
    Module._load = function (request, parent, isMain) {
      if (request === 'expo-sqlite') return { openDatabaseAsync };
      return load.call(this, request, parent, isMain);
    };

    try {
      return require(filename);
    } finally {
      Module._load = load;
    }
  }

  t.after(() => {
    delete require.cache[require.resolve('@/game/session.storage')];
    for (const database of connections) {
      try {
        database.close();
      } catch {
        // Initialization failure may already have closed this connection.
      }
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });

  return {
    reload,
    database: () => connections.at(-1),
    openCount: () => openCount,
    closeCount: () => closeCount,
  };
}

test('storage opens lazily and restores the exact board after reopening the database', async (t) => {
  const harness = createStorageHarness(t);
  const storage = harness.reload();
  assert.equal(harness.openCount(), 0);
  assert.equal(await storage.loadGameSession(), null);

  let session = createSession();
  for (const [turn, index] of [0, 4, 1].entries()) {
    session = applyMove(session, index, getCurrentPlayer(session.board), 2000 + turn);
  }
  await storage.saveGameSession(session);

  const reopenedStorage = harness.reload();
  assert.deepEqual(await reopenedStorage.loadGameSession(), session);
  assert.equal(harness.openCount(), 2);
});

test('saving a new session replaces the single database slot', async (t) => {
  const harness = createStorageHarness(t);
  const storage = harness.reload();
  await storage.saveGameSession(createSession('old-round'));
  const next = createSession('new-round-with-a-quote-\'');
  await storage.saveGameSession(next);

  assert.equal(harness.database().prepare('SELECT COUNT(*) AS total FROM game_session').get().total, 1);
  assert.deepEqual(await storage.loadGameSession(), next);
});

test('a completed game is also restored as a completed snapshot', async (t) => {
  const harness = createStorageHarness(t);
  const storage = harness.reload();
  let session = createSession();
  for (const [turn, index] of [0, 3, 1, 4, 2].entries()) {
    session = applyMove(session, index, getCurrentPlayer(session.board), 2000 + turn);
  }

  await storage.saveGameSession(session);
  assert.deepEqual(await harness.reload().loadGameSession(), session);
});

test('corrupt data is rejected without silently deleting it, and a new game can replace it', async (t) => {
  const harness = createStorageHarness(t);
  const storage = harness.reload();
  await storage.saveGameSession(createSession());
  harness.database().prepare('UPDATE game_session SET payload = ? WHERE id = 1').run('{broken json');

  await assert.rejects(storage.loadGameSession(), /saved game could not be read/);
  assert.equal(harness.database().prepare('SELECT payload FROM game_session WHERE id = 1').get().payload, '{broken json');

  const replacement = createSession('replacement');
  await storage.saveGameSession(replacement);
  assert.deepEqual(await storage.loadGameSession(), replacement);
});

test('invalid snapshots cannot overwrite a valid saved game', async (t) => {
  const harness = createStorageHarness(t);
  const storage = harness.reload();
  const valid = createSession();
  await storage.saveGameSession(valid);

  await assert.rejects(storage.saveGameSession({ ...valid, board: [] }), /could not be saved/);
  assert.deepEqual(await storage.loadGameSession(), valid);
});

test('a failed open can be retried', async (t) => {
  const harness = createStorageHarness(t, { failOpens: 1 });
  const storage = harness.reload();
  await assert.rejects(storage.loadGameSession(), /Temporary database open failure/);
  assert.equal(await storage.loadGameSession(), null);
  assert.equal(harness.openCount(), 2);
});

test('failed schema initialization closes the connection and can be retried', async (t) => {
  const harness = createStorageHarness(t, { failInitializations: 1 });
  const storage = harness.reload();
  await assert.rejects(storage.loadGameSession(), /Temporary schema initialization failure/);
  assert.equal(harness.closeCount(), 1);
  assert.equal(await storage.loadGameSession(), null);
  assert.equal(harness.openCount(), 2);
});

test('the browser adapter imports safely without IndexedDB and reports unavailable storage', async () => {
  const storage = require('@/game/session.storage.web');
  await assert.rejects(storage.loadGameSession(), /Local game storage is unavailable/);
});
