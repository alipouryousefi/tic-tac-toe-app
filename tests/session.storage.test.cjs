const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { test } = require('node:test');

const { createGameSession, applyMove, getCurrentPlayer } = require('@/game/game.logic');
const { createGameHistoryEntry, getCompletedGame } = require('@/game/game-history.logic');
const { sessionStorageConfig } = require('@/constants/session-storage.constants');

function createSession(id = 'round-1') {
  return createGameSession({ mode: 'friend', mark: 'X', difficulty: 'normal' }, id, 1000);
}

function completeSession(id, completedAt, draw = false) {
  let session = createSession(id);
  const moves = draw ? [0, 1, 2, 4, 3, 5, 7, 6, 8] : [0, 3, 1, 4, 2];

  for (const [turn, index] of moves.entries()) {
    session = applyMove(session, index, getCurrentPlayer(session.board), completedAt - moves.length + turn + 1);
  }

  return session;
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

    const adapter = {
      execAsync: async (sql) => {
        if (failInitializations > 0) {
          failInitializations -= 1;
          throw new Error('Temporary schema initialization failure');
        }
        database.exec(sql);
      },
      getFirstAsync: async (sql, ...bindings) => database.prepare(sql).get(...bindings) ?? null,
      runAsync: async (sql, ...bindings) => database.prepare(sql).run(...bindings),
      withExclusiveTransactionAsync: async (task) => {
        database.exec('BEGIN IMMEDIATE');
        try {
          await task(adapter);
          database.exec('COMMIT');
        } catch (error) {
          database.exec('ROLLBACK');
          throw error;
        }
      },
      closeAsync: async () => {
        closeCount += 1;
        database.close();
      },
    };
    return adapter;
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
    seedLegacySession(session) {
      const database = new DatabaseSync(databasePath);
      database.exec('CREATE TABLE game_session (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL)');
      database.prepare('INSERT INTO game_session (id, payload) VALUES (1, ?)').run(JSON.stringify(session));
      database.close();
    },
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

test('history restores only the five latest completed games after reopening', async (t) => {
  const harness = createStorageHarness(t);
  const storage = harness.reload();
  assert.deepEqual(await storage.loadGameHistory(), []);
  const completed = Array.from({ length: 7 }, (_, index) => completeSession(`history-${index}`, 2000 + index * 100, index % 2 === 0));

  for (const session of completed) {
    await storage.saveGameSession(session);
  }

  const history = await harness.reload().loadGameHistory();
  assert.deepEqual(history, completed.slice(-5).reverse().map((session) => createGameHistoryEntry(getCompletedGame(session))));
  assert.ok(history.some((game) => game.winner === null));
  assert.ok(history.some((game) => game.winner === 'X'));
});

test('re-saving a completed session does not duplicate it or displace another recent game', async (t) => {
  const harness = createStorageHarness(t);
  const storage = harness.reload();
  const completed = Array.from({ length: 5 }, (_, index) => completeSession(`duplicate-${index}`, 2000 + index * 100));

  for (const session of completed) {
    await storage.saveGameSession(session);
  }

  const before = await storage.loadGameHistory();
  await harness.reload().saveGameSession(completed[2]);
  assert.deepEqual(await storage.loadGameHistory(), before);
});

test('starting or restarting an unfinished game preserves completed history', async (t) => {
  const harness = createStorageHarness(t);
  const storage = harness.reload();
  await storage.saveGameSession(completeSession('finished-round', 2000));
  const history = await storage.loadGameHistory();

  await storage.saveGameSession(createSession('new-round'));
  await storage.saveGameSession(createSession('restarted-round'));

  assert.deepEqual(await harness.reload().loadGameHistory(), history);
  assert.equal((await storage.loadGameSession()).id, 'restarted-round');
});

test('a failed history write rolls back both the terminal snapshot and history', async (t) => {
  const harness = createStorageHarness(t);
  const storage = harness.reload();
  await storage.saveGameSession(completeSession('earlier-round', 2000));
  const history = await storage.loadGameHistory();
  let previous = createSession('current-round');
  for (const [turn, index] of [0, 3, 1, 4].entries()) {
    previous = applyMove(previous, index, getCurrentPlayer(previous.board), 3000 + turn);
  }
  await storage.saveGameSession(previous);
  const completed = applyMove(previous, 2, 'X', 4000);

  harness.database().exec(`
    CREATE TRIGGER fail_history_insert BEFORE INSERT ON game_history
    BEGIN SELECT RAISE(ABORT, 'forced history failure'); END;
    CREATE TRIGGER fail_history_update BEFORE UPDATE ON game_history
    BEGIN SELECT RAISE(ABORT, 'forced history failure'); END;
  `);
  await assert.rejects(storage.saveGameSession(completed), /forced history failure/);
  assert.deepEqual(await storage.loadGameSession(), previous);
  assert.deepEqual(await storage.loadGameHistory(), history);

  harness.database().exec('DROP TRIGGER fail_history_insert; DROP TRIGGER fail_history_update;');
  await storage.saveGameSession(completed);
  assert.deepEqual(await storage.loadGameSession(), completed);
  assert.equal((await storage.loadGameHistory())[0].id, 'current-round');
});

test('adding history storage preserves an existing session-only database', async (t) => {
  const harness = createStorageHarness(t);
  const legacy = applyMove(createSession('legacy-round'), 4, 'X', 2000);
  harness.seedLegacySession(legacy);

  const storage = harness.reload();
  assert.deepEqual(await storage.loadGameSession(), legacy);
  assert.deepEqual(await storage.loadGameHistory(), []);
  await storage.saveGameSession(completeSession('first-recorded-round', 3000));
  assert.equal((await harness.reload().loadGameHistory())[0].id, 'first-recorded-round');
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
