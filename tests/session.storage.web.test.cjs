const assert = require('node:assert/strict');
const { setImmediate: nextTurn } = require('node:timers/promises');
const { test } = require('node:test');

const { applyMove, createGameSession, getCurrentPlayer } = require('@/game/game.logic');
const { createGameHistoryEntry, getCompletedGame } = require('@/game/game-history.logic');
const { sessionStorageConfig } = require('@/constants/session-storage.constants');

function createSession(id = 'round-1') {
  return createGameSession({ mode: 'friend', mark: 'X', difficulty: 'normal' }, id, 1000);
}

function completeSession(id, completedAt, moves = [0, 3, 1, 4, 2]) {
  let session = createSession(id);
  for (const index of moves) {
    session = applyMove(session, index, getCurrentPlayer(session.board), completedAt);
  }
  return session;
}

function createIndexedDbHarness(t, { initialPayload, initialHistory, failOpens = 0 } = {}) {
  const previousIndexedDb = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  const values = new Map();
  if (initialPayload !== undefined) values.set(sessionStorageConfig.webSessionKey, initialPayload);
  if (initialHistory !== undefined) values.set(sessionStorageConfig.webHistoryKey, initialHistory);
  let openCount = 0;
  let database;
  let write;

  globalThis.indexedDB = {
    open(name, version) {
      assert.equal(name, sessionStorageConfig.webDatabaseName);
      assert.equal(version, sessionStorageConfig.webVersion);
      openCount += 1;
      let hasStore = false;
      database = {
        objectStoreNames: { contains: () => hasStore },
        createObjectStore: (storeName) => {
          assert.equal(storeName, sessionStorageConfig.webStoreName);
          hasStore = true;
        },
        close() {},
        transaction(storeName, mode, options) {
          assert.equal(storeName, sessionStorageConfig.webStoreName);
          const staged = new Map();
          let pendingReads = 0;
          let aborted = false;
          const transaction = {
            error: null,
            abort() {
              aborted = true;
              if (write?.transaction === transaction) write = null;
              queueMicrotask(() => transaction.onabort?.());
            },
            objectStore() {
              return {
                get(key) {
                  assert.ok([
                    sessionStorageConfig.webSessionKey,
                    sessionStorageConfig.webHistoryKey,
                  ].includes(key));
                  const request = {};
                  pendingReads += 1;
                  queueMicrotask(() => {
                    if (aborted) return;
                    request.result = staged.has(key) ? staged.get(key) : values.get(key);
                    request.onsuccess?.();
                    pendingReads -= 1;
                    if (mode === 'readonly' && pendingReads === 0) transaction.oncomplete?.();
                  });
                  return request;
                },
                put(value, key) {
                  assert.equal(mode, 'readwrite');
                  assert.equal(options.durability, 'strict');
                  assert.ok([
                    sessionStorageConfig.webSessionKey,
                    sessionStorageConfig.webHistoryKey,
                  ].includes(key));
                  assert.equal(aborted, false);
                  staged.set(key, value);
                  write = { staged, transaction, pendingReads: () => pendingReads };
                  return {};
                },
              };
            },
          };
          return transaction;
        },
      };

      const request = { result: database };
      queueMicrotask(() => {
        if (failOpens > 0) {
          failOpens -= 1;
          request.error = new Error('Temporary IndexedDB open failure');
          request.onerror?.();
          return;
        }
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };

  function reload() {
    const filename = require.resolve('@/game/session.storage.web');
    delete require.cache[filename];
    return require(filename);
  }

  t.after(() => {
    delete require.cache[require.resolve('@/game/session.storage.web')];
    if (previousIndexedDb) {
      Object.defineProperty(globalThis, 'indexedDB', previousIndexedDb);
    } else {
      delete globalThis.indexedDB;
    }
  });

  return {
    reload,
    openCount: () => openCount,
    payload: () => values.get(sessionStorageConfig.webSessionKey),
    historyPayload: () => values.get(sessionStorageConfig.webHistoryKey),
    async waitForWrite() {
      for (let attempt = 0; attempt < 10 && !write; attempt += 1) await nextTurn();
      assert.ok(write, 'A write transaction should have been created');
    },
    completeWrite() {
      assert.ok(write);
      assert.equal(write.pendingReads(), 0, 'All requests must finish before commit');
      for (const [key, value] of write.staged) values.set(key, value);
      write.transaction.oncomplete();
      write = null;
    },
    abortWrite() {
      assert.ok(write);
      write.transaction.error = new Error('Storage quota exceeded');
      write.transaction.abort();
    },
    changeVersion() {
      database.onversionchange();
    },
  };
}

test('web save resolves only after the write transaction commits, and reload restores the snapshot', async (t) => {
  const harness = createIndexedDbHarness(t);
  const storage = harness.reload();
  assert.equal(harness.openCount(), 0);
  assert.equal(await storage.loadGameSession(), null);

  const session = createSession();
  let saved = false;
  const saving = storage.saveGameSession(session).then(() => { saved = true; });
  await harness.waitForWrite();
  assert.equal(saved, false);
  assert.equal(harness.payload(), undefined);

  harness.completeWrite();
  await saving;
  assert.equal(saved, true);
  assert.deepEqual(await harness.reload().loadGameSession(), session);
});

test('an aborted web write leaves the previously committed snapshot intact', async (t) => {
  const previous = createSession('previous-round');
  const harness = createIndexedDbHarness(t, { initialPayload: JSON.stringify(previous) });
  const storage = harness.reload();
  const saving = storage.saveGameSession(createSession('next-round'));
  const rejection = assert.rejects(saving, /Storage quota exceeded/);
  await harness.waitForWrite();
  harness.abortWrite();
  await rejection;

  assert.deepEqual(await storage.loadGameSession(), previous);
});

test('web storage can retry a failed open', async (t) => {
  const harness = createIndexedDbHarness(t, { failOpens: 1 });
  const storage = harness.reload();
  await assert.rejects(storage.loadGameSession(), /Temporary IndexedDB open failure/);
  assert.equal(await storage.loadGameSession(), null);
  assert.equal(harness.openCount(), 2);
});

test('invalid web payload is preserved until an explicit new game replaces it', async (t) => {
  const harness = createIndexedDbHarness(t, { initialPayload: '{broken json' });
  const storage = harness.reload();
  await assert.rejects(storage.loadGameSession(), /saved game could not be read/);
  assert.equal(harness.payload(), '{broken json');

  const session = createSession('replacement');
  const saving = storage.saveGameSession(session);
  await harness.waitForWrite();
  harness.completeWrite();
  await saving;
  assert.deepEqual(await storage.loadGameSession(), session);
});

test('a browser version change invalidates the cached connection', async (t) => {
  const session = createSession();
  const harness = createIndexedDbHarness(t, { initialPayload: JSON.stringify(session) });
  const storage = harness.reload();
  assert.deepEqual(await storage.loadGameSession(), session);
  harness.changeVersion();
  assert.deepEqual(await storage.loadGameSession(), session);
  assert.equal(harness.openCount(), 2);
});

test('web history starts empty and retains the newest five completed games across reload', async (t) => {
  const harness = createIndexedDbHarness(t);
  const storage = harness.reload();
  assert.deepEqual(await storage.loadGameHistory(), []);

  // Save out of chronological order to ensure the cap applies to completion dates.
  for (const completedAt of [3000, 7000, 2000, 6000, 4000, 8000, 5000]) {
    const saving = storage.saveGameSession(completeSession(`round-${completedAt}`, completedAt));
    await harness.waitForWrite();
    harness.completeWrite();
    await saving;
  }

  const history = await harness.reload().loadGameHistory();
  assert.deepEqual(history.map((game) => game.completedAt), [8000, 7000, 6000, 5000, 4000]);
  assert.equal(JSON.parse(harness.historyPayload()).length, 5);
  assert.deepEqual(await storage.loadGameSession(), completeSession('round-5000', 5000));
});

test('re-saving a completed web session is deduplicated and new sessions preserve history', async (t) => {
  const harness = createIndexedDbHarness(t);
  const storage = harness.reload();
  const win = completeSession('win', 3000);
  const draw = completeSession('draw', 4000, [0, 1, 2, 4, 3, 5, 7, 6, 8]);

  for (const session of [win, draw, win, createSession('new-round')]) {
    const saving = storage.saveGameSession(session);
    await harness.waitForWrite();
    harness.completeWrite();
    await saving;
  }

  assert.deepEqual(await harness.reload().loadGameHistory(), [
    createGameHistoryEntry(getCompletedGame(draw)),
    createGameHistoryEntry(getCompletedGame(win)),
  ]);
  assert.deepEqual(await storage.loadGameSession(), createSession('new-round'));
});

test('aborting a terminal web save commits neither the result nor its final board', async (t) => {
  const previous = createSession('playing');
  const previousResult = createGameHistoryEntry(getCompletedGame(completeSession('old-win', 2000)));
  const harness = createIndexedDbHarness(t, {
    initialPayload: JSON.stringify(previous),
    initialHistory: JSON.stringify([previousResult]),
  });
  const storage = harness.reload();
  let saved = false;
  const saving = storage.saveGameSession(completeSession('new-win', 3000))
    .then(() => { saved = true; });
  const rejection = assert.rejects(saving, /Storage quota exceeded/);
  await harness.waitForWrite();
  assert.equal(saved, false);
  assert.deepEqual(await storage.loadGameSession(), previous);
  assert.deepEqual(await storage.loadGameHistory(), [previousResult]);

  harness.abortWrite();
  await rejection;
  assert.equal(saved, false);
  const reopened = harness.reload();
  assert.deepEqual(await reopened.loadGameSession(), previous);
  assert.deepEqual(await reopened.loadGameHistory(), [previousResult]);
});

test('corrupt web history aborts a completed save without erasing either stored value', async (t) => {
  const previous = createSession('playing');
  const harness = createIndexedDbHarness(t, {
    initialPayload: JSON.stringify(previous),
    initialHistory: '{broken history',
  });
  const storage = harness.reload();
  await assert.rejects(storage.loadGameHistory());
  await assert.rejects(storage.saveGameSession(completeSession('new-win', 3000)));
  assert.deepEqual(await storage.loadGameSession(), previous);
  assert.equal(harness.historyPayload(), '{broken history');
});
