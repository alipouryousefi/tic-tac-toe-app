const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { setImmediate: nextTurn } = require('node:timers/promises');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((finish, fail) => {
    resolve = finish;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function completedGame(number) {
  return {
    sessionId: `round-${number}`,
    setup: { mode: 'friend', mark: 'X', difficulty: 'normal' },
    winner: number % 2 === 0 ? null : 'X',
    completedAt: 1000 + number,
  };
}

function historyEntry(number) {
  const game = completedGame(number);
  return { ...game, id: game.sessionId };
}

function createHistoryHarness(loadGameHistory) {
  const previousLoad = Module._load;
  const existingModules = new Set(Object.keys(require.cache));
  const sourceDirectory = path.resolve(path.dirname(module.filename), '../src') + path.sep;
  const states = [];
  const effects = [];
  let stateWrites = 0;
  let captured;

  Module._load = function (request, parent, isMain) {
    if (request === 'react') {
      return {
        ...React,
        useState: (initial) => {
          const [value, setValue] = React.useState(initial);
          const state = { value };
          states.push(state);
          return [value, (next) => {
            state.value = typeof next === 'function' ? next(state.value) : next;
            stateWrites += 1;
            setValue(next);
          }];
        },
        useEffect: (effect) => { effects.push(effect); },
      };
    }
    if (request === '@/game/session.storage') return { loadGameHistory };
    return previousLoad.call(this, request, parent, isMain);
  };

  try {
    const { GameHistoryProvider, useGameHistory } = require('@/hooks/game-history-provider');
    function Capture() {
      captured = useGameHistory();
      return null;
    }

    renderToStaticMarkup(React.createElement(GameHistoryProvider, null, React.createElement(Capture)));
  } finally {
    Module._load = previousLoad;
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(sourceDirectory) && !existingModules.has(filename)) {
        delete require.cache[filename];
      }
    }
  }

  // Server rendering does not run effects; exercise the provider's real startup and cleanup.
  const cleanups = effects.map((effect) => effect()).filter((cleanup) => typeof cleanup === 'function');

  return {
    recordGame: (...args) => captured.recordGame(...args),
    reloadHistory: () => captured.reloadHistory(),
    snapshot: () => ({ games: states[0].value, isLoading: states[1].value, error: states[2].value }),
    stateWrites: () => stateWrites,
    unmount: () => { for (const cleanup of cleanups) cleanup(); },
  };
}

test('history startup restores only the five newest unique completed games', async () => {
  const loading = deferred();
  const history = createHistoryHarness(() => loading.promise);
  assert.deepEqual(history.snapshot(), { games: [], isLoading: true, error: null });

  loading.resolve([historyEntry(2), historyEntry(6), historyEntry(4), historyEntry(6), historyEntry(1), historyEntry(5), historyEntry(3)]);
  await nextTurn();

  assert.deepEqual(history.snapshot().games.map((game) => game.id), ['round-6', 'round-5', 'round-4', 'round-3', 'round-2']);
  assert.equal(history.snapshot().isLoading, false);
  assert.equal(history.snapshot().error, null);
  history.unmount();
});

test('a result recorded during restoration survives the pending history load', async () => {
  const loading = deferred();
  const history = createHistoryHarness(() => loading.promise);
  history.recordGame(completedGame(7));
  assert.deepEqual(history.snapshot().games.map((game) => game.id), ['round-7']);

  loading.resolve([historyEntry(1), historyEntry(2), historyEntry(3), historyEntry(4), historyEntry(5)]);
  await nextTurn();

  assert.deepEqual(history.snapshot().games.map((game) => game.id), ['round-7', 'round-5', 'round-4', 'round-3', 'round-2']);
  history.unmount();
});

test('recording keeps five results without duplicates or mutable setup references', async () => {
  const history = createHistoryHarness(async () => []);
  await nextTurn();

  for (let number = 1; number <= 7; number += 1) history.recordGame(completedGame(number));
  history.recordGame(completedGame(6));
  const last = completedGame(8);
  history.recordGame(last);
  last.setup.mark = 'O';

  assert.deepEqual(history.snapshot().games.map((game) => game.id), ['round-8', 'round-7', 'round-6', 'round-5', 'round-4']);
  assert.equal(history.snapshot().games[0].setup.mark, 'X');
  history.unmount();
});

test('failed restoration exposes a retry and does not erase results recorded in memory', async () => {
  const firstLoad = deferred();
  const retryLoad = deferred();
  let attempts = 0;
  const history = createHistoryHarness(() => ++attempts === 1 ? firstLoad.promise : retryLoad.promise);
  history.recordGame(completedGame(7));
  firstLoad.reject(new Error('Database unavailable'));
  await nextTurn();

  assert.equal(history.snapshot().isLoading, false);
  assert.ok(history.snapshot().error);
  assert.deepEqual(history.snapshot().games.map((game) => game.id), ['round-7']);

  const retry = history.reloadHistory();
  assert.equal(attempts, 2);
  assert.equal(history.snapshot().isLoading, true);
  assert.equal(history.snapshot().error, null);
  retryLoad.resolve([historyEntry(6)]);
  await retry;

  assert.equal(history.snapshot().isLoading, false);
  assert.equal(history.snapshot().error, null);
  assert.deepEqual(history.snapshot().games.map((game) => game.id), ['round-7', 'round-6']);
  history.unmount();
});

test('an unmounted history provider ignores a late restoration result', async () => {
  const loading = deferred();
  const history = createHistoryHarness(() => loading.promise);
  history.unmount();
  const writesBeforeCompletion = history.stateWrites();
  loading.resolve([historyEntry(1)]);
  await nextTurn();

  assert.equal(history.stateWrites(), writesBeforeCompletion);
  assert.deepEqual(history.snapshot().games, []);
});
