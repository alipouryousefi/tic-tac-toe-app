const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const nativeWeb = require('react-native-web');

const { gameHistoryCopy } = require('@/constants/game-history.constants');

let retryProps;

function loadHistoryList() {
  const previousLoad = Module._load;
  const existingModules = new Set(Object.keys(require.cache));
  const sourceDirectory = path.resolve(path.dirname(module.filename), '../src') + path.sep;

  Module._load = function (request, parent, isMain) {
    if (request === 'react-native') {
      return {
        ...nativeWeb,
        Pressable: (props) => {
          if (props.testID === 'retry-load-history') retryProps = props;
          return React.createElement(nativeWeb.Pressable, props);
        },
      };
    }
    return previousLoad.call(this, request, parent, isMain);
  };

  try {
    return require('@/components/welcome/game-history-list').GameHistoryList;
  } finally {
    Module._load = previousLoad;
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(sourceDirectory) && !existingModules.has(filename)) {
        delete require.cache[filename];
      }
    }
  }
}

const GameHistoryList = loadHistoryList();

function renderHistory(overrides = {}) {
  retryProps = undefined;
  return renderToStaticMarkup(React.createElement(GameHistoryList, {
    games: [],
    isLoading: false,
    error: null,
    onRetry() {},
    ...overrides,
  }));
}

function entry(id, winner, setup = {}) {
  return {
    id,
    sessionId: id,
    setup: { mode: 'friend', mark: 'X', difficulty: 'normal', ...setup },
    winner,
    completedAt: 1000,
  };
}

test('history loading does not claim that there are no completed games', () => {
  const html = renderHistory({ isLoading: true });
  assert.ok(html.includes('data-testid="loading-game-history"'));
  assert.ok(html.includes(gameHistoryCopy.loading));
  assert.ok(!html.includes(gameHistoryCopy.emptyTitle));
  assert.ok(!html.includes('data-testid="empty-game-history"'));
  assert.ok(!html.includes('data-testid="retry-load-history"'));
});

test('a successfully loaded empty history explains where the last five results will appear', () => {
  const html = renderHistory();
  assert.ok(html.includes('data-testid="empty-game-history"'));
  assert.ok(html.includes(gameHistoryCopy.emptyTitle));
  assert.ok(html.includes(gameHistoryCopy.emptyDescription));
  assert.ok(!html.includes('data-testid="loading-game-history"'));
});

test('a history load failure exposes a retry without showing the empty-history message', () => {
  let retries = 0;
  const onRetry = () => { retries += 1; };
  const html = renderHistory({ error: gameHistoryCopy.loadFailed, onRetry });
  assert.ok(html.includes(gameHistoryCopy.loadFailed));
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes('data-testid="retry-load-history"'));
  assert.ok(!html.includes(gameHistoryCopy.emptyTitle));
  assert.ok(!html.includes('data-testid="empty-game-history"'));
  assert.equal(retryProps.disabled, false);
  retryProps.onPress();
  assert.equal(retries, 1);

  renderHistory({ error: gameHistoryCopy.loadFailed, isLoading: true, onRetry });
  assert.equal(retryProps.disabled, true, 'The pending retry cannot be submitted again');
});

test('existing history stays visible after a load failure and labels friend, device and draw results', () => {
  const games = [
    entry('friend-win', 'O'),
    entry('human-win', 'O', { mode: 'device', mark: 'O', difficulty: 'hard' }),
    entry('device-win', 'O', { mode: 'device', mark: 'X' }),
    entry('draw', null),
  ];
  const html = renderHistory({ games, error: gameHistoryCopy.loadFailed });

  for (const game of games) assert.ok(html.includes(`data-testid="history-game-${game.id}"`));
  for (const label of ['O won', 'You won', 'Device won', 'Draw', 'With a friend', 'Vs. the device']) {
    assert.ok(html.includes(label), `Missing result label: ${label}`);
  }
  assert.ok(html.includes(gameHistoryCopy.loadFailed));
  assert.ok(html.includes('data-testid="retry-load-history"'));
  assert.ok(!html.includes('data-testid="empty-game-history"'));
  assert.ok(!html.includes('data-testid="loading-game-history"'));
});
