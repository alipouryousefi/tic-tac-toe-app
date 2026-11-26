const assert = require('node:assert/strict');
const { setImmediate: nextTurn } = require('node:timers/promises');
const { test } = require('node:test');

const { createGameSession } = require('@/game/game.logic');
const { sessionStorageConfig } = require('@/constants/session-storage.constants');

function createSession(id = 'round-1') {
  return createGameSession({ mode: 'friend', mark: 'X', difficulty: 'normal' }, id, 1000);
}

function createIndexedDbHarness(t, { initialPayload, failOpens = 0 } = {}) {
  const previousIndexedDb = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  let payload = initialPayload;
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
          const transaction = {
            error: null,
            objectStore() {
              return {
                get(key) {
                  assert.equal(key, sessionStorageConfig.webSessionKey);
                  const request = {};
                  queueMicrotask(() => {
                    request.result = payload;
                    request.onsuccess?.();
                    transaction.oncomplete?.();
                  });
                  return request;
                },
                put(value, key) {
                  assert.equal(mode, 'readwrite');
                  assert.equal(options.durability, 'strict');
                  assert.equal(key, sessionStorageConfig.webSessionKey);
                  write = { value, transaction };
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
    payload: () => payload,
    async waitForWrite() {
      for (let attempt = 0; attempt < 10 && !write; attempt += 1) await nextTurn();
      assert.ok(write, 'A write transaction should have been created');
    },
    completeWrite() {
      assert.ok(write);
      payload = write.value;
      write.transaction.oncomplete();
      write = null;
    },
    abortWrite() {
      assert.ok(write);
      write.transaction.error = new Error('Storage quota exceeded');
      write.transaction.onabort();
      write = null;
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
