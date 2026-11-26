const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const nativeWeb = require('react-native-web');

const { applyMove, createGameSession, getCurrentPlayer } = require('@/game/game.logic');

let currentGame;

// Native modal portals have no server host; retain their visible children for UI assertions.
const serverNative = Object.create(nativeWeb);
Object.defineProperty(serverNative, 'Modal', {
  value: ({ visible, children }) => visible ? React.createElement(nativeWeb.View, null, children) : null,
});

function loadUi() {
  const previousLoad = Module._load;
  const existingModules = new Set(Object.keys(require.cache));
  const sourceDirectory = path.resolve(path.dirname(module.filename), '../src') + path.sep;

  Module._load = function (request, parent, isMain) {
    if (request === 'react-native') return serverNative;
    if (request === 'react-native-safe-area-context') {
      return { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
    }
    if (request === 'expo-router') {
      return {
        router: { dismissTo() {}, navigate() {} },
        useFocusEffect() {},
      };
    }
    if (request === '@/hooks/game-session-provider') {
      return { useGameSession: () => currentGame };
    }
    if (request === '@/hooks/use-theme') {
      return { useTheme: () => ({ text: '#000000' }) };
    }
    if (request === 'react-native-reanimated') {
      return { useReducedMotion: () => false };
    }
    if (request === 'expo-symbols') {
      return { SymbolView: () => null };
    }
    if (request === '@/components/welcome/theme-toggle' || request === './theme-toggle') {
      return { ThemeToggle: () => React.createElement(nativeWeb.View, { testID: 'theme-toggle' }) };
    }
    if (request === './welcome-modal') {
      return { WelcomeModal: () => null };
    }

    return previousLoad.call(this, request, parent, isMain);
  };

  try {
    return {
      GameBoard: require('@/components/game/game-board').GameBoard,
      GameMenuModal: require('@/components/game/game-menu-modal').GameMenuModal,
      GamePage: require('@/components/game').GamePage,
      WelcomeScreen: require('@/components/welcome').WelcomeScreen,
    };
  } finally {
    Module._load = previousLoad;
    // Keep these component references, without leaking their mocked imports into other tests.
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(sourceDirectory) && !existingModules.has(filename)) {
        delete require.cache[filename];
      }
    }
  }
}

const { GameBoard, GameMenuModal, GamePage, WelcomeScreen } = loadUi();

function sessionWithMoves(moves = [], setup = {}) {
  const initial = createGameSession(
    { mode: 'friend', mark: 'X', difficulty: 'normal', ...setup },
    'ui-round',
    100,
  );

  return moves.reduce((session, index, turn) =>
    applyMove(session, index, getCurrentPlayer(session.board), 101 + turn), initial);
}

function renderGame(overrides = {}, Component = GamePage) {
  currentGame = {
    session: null,
    isLoading: false,
    isSaving: false,
    error: null,
    startSession: async () => false,
    playMove: async () => false,
    playDeviceMove: async () => false,
    restartSession: async () => false,
    reloadSession: async () => {},
    ...overrides,
  };

  return renderToStaticMarkup(React.createElement(Component));
}

function renderMenu(overrides = {}) {
  return renderToStaticMarkup(React.createElement(GameMenuModal, {
    visible: true,
    busy: false,
    canRestart: true,
    isFinished: false,
    error: null,
    result: null,
    onClose() {},
    onDismiss() {},
    onHome() {},
    onRestart() {},
    ...overrides,
  }));
}

function openingTag(html, testId) {
  const expression = new RegExp(`<[^>]*\\bdata-testid="${testId}"[^>]*>`);
  const match = html.match(expression);
  assert.ok(match, `Missing ${testId}`);
  return match[0];
}

function isDisabled(html, testId) {
  const tag = openingTag(html, testId);
  return /\baria-disabled="true"/.test(tag) || /\sdisabled(?:="[^"]*")?(?=\s|>)/.test(tag);
}

function titleText(html, testId) {
  const tag = openingTag(html, testId);
  const content = html.slice(html.indexOf(tag) + tag.length);
  return content.slice(0, content.indexOf('</'));
}

function assertAllCellsDisabled(html) {
  for (let index = 0; index < 9; index += 1) {
    assert.equal(isDisabled(html, `game-cell-${index}`), true, `Cell ${index} must be disabled`);
  }
}

test('the board exposes nine named squares and locks occupied squares', () => {
  const html = renderToStaticMarkup(React.createElement(GameBoard, {
    board: ['X', null, null, null, null, null, null, null, null],
    currentPlayer: 'O',
    winningLine: null,
    disabled: false,
    onPress() {},
  }));

  assert.equal((html.match(/data-testid="game-cell-\d"/g) ?? []).length, 9);
  assert.match(openingTag(html, 'game-cell-0'), /aria-label="Row 1, column 1, X"/);
  assert.match(openingTag(html, 'game-cell-8'), /aria-label="Row 3, column 3, empty"/);
  assert.equal(isDisabled(html, 'game-cell-0'), true);
  for (let index = 1; index < 9; index += 1) {
    assert.equal(isDisabled(html, `game-cell-${index}`), false);
  }
});

test('friend games show the next player and allow only empty squares', () => {
  const html = renderGame({ session: sessionWithMoves([0]) });
  assert.ok(html.includes('O’s turn'));
  assert.ok(html.includes('Pass the phone after your move.'));
  assert.equal(isDisabled(html, 'game-cell-0'), true);
  assert.equal(isDisabled(html, 'game-cell-1'), false);
  assert.equal(isDisabled(html, 'open-game-menu'), false);
  assert.ok(!html.includes('data-testid="game-home"'));
  assert.ok(!html.includes('data-testid="restart-game"'));
  assert.ok(!html.includes('data-testid="theme-toggle"'));
  assert.ok(!html.includes('data-testid="game-result-modal"'));
});

test('device turns lock the board; the human can play once the device move is committed', () => {
  const setup = { mode: 'device', mark: 'O' };
  const thinking = renderGame({ session: sessionWithMoves([], setup) });
  assert.ok(thinking.includes('Device’s turn'));
  assertAllCellsDisabled(thinking);

  const humanTurn = renderGame({ session: sessionWithMoves([4], setup) });
  assert.ok(humanTurn.includes('Your turn'));
  assert.equal(isDisabled(humanTurn, 'game-cell-4'), true);
  assert.equal(isDisabled(humanTurn, 'game-cell-0'), false);
});

test('saving blocks new moves and opening the game menu', () => {
  const html = renderGame({ session: sessionWithMoves([0]), isSaving: true });
  assertAllCellsDisabled(html);
  assert.equal(isDisabled(html, 'open-game-menu'), true);
  assert.ok(!html.includes('data-testid="game-home"'));
  assert.ok(!html.includes('data-testid="restart-game"'));
});

test('friend wins automatically show the result while retaining the last player’s turn header', () => {
  for (const [moves, winner] of [[[0, 3, 1, 4, 2], 'X'], [[0, 3, 1, 4, 8, 5], 'O']]) {
    const html = renderGame({ session: sessionWithMoves(moves) });
    openingTag(html, 'game-result-modal');
    assert.equal(titleText(html, 'game-result-title'), `${winner} wins!`);
    assert.equal(titleText(html, 'game-status-title'), `${winner}’s turn`);
    assertAllCellsDisabled(html);
    assert.equal(isDisabled(html, 'open-game-menu'), true);
    assert.equal(isDisabled(html, 'result-home'), false);
    assert.equal(isDisabled(html, 'result-play-again'), false);
    for (const testId of ['game-menu', 'continue-game', 'close-game-menu', 'game-home', 'restart-game']) {
      assert.ok(!html.includes(`data-testid="${testId}"`));
    }
  }
});

test('device results distinguish a human win from a device win', () => {
  const setup = { mode: 'device', mark: 'O' };
  const humanWin = renderGame({ session: sessionWithMoves([0, 3, 1, 4, 8, 5], setup) });
  openingTag(humanWin, 'game-result-modal');
  assert.equal(titleText(humanWin, 'game-result-title'), 'You won!');
  assert.equal(titleText(humanWin, 'game-status-title'), 'Your turn');
  assert.equal(isDisabled(humanWin, 'open-game-menu'), true);
  assertAllCellsDisabled(humanWin);

  const deviceWin = renderGame({ session: sessionWithMoves([0, 3, 1, 4, 2], setup) });
  openingTag(deviceWin, 'game-result-modal');
  assert.equal(titleText(deviceWin, 'game-result-title'), 'You lost.');
  assert.equal(titleText(deviceWin, 'game-status-title'), 'Device’s turn');
  assert.equal(isDisabled(deviceWin, 'open-game-menu'), true);
  assertAllCellsDisabled(deviceWin);
});

test('a draw automatically opens its result and retains the last turn header', () => {
  const html = renderGame({ session: sessionWithMoves([0, 1, 2, 4, 3, 5, 7, 6, 8]) });
  openingTag(html, 'game-result-modal');
  assert.equal(titleText(html, 'game-result-title'), 'It’s a draw.');
  assert.equal(titleText(html, 'game-status-title'), 'X’s turn');
  assertAllCellsDisabled(html);
  assert.equal(isDisabled(html, 'open-game-menu'), true);
  assert.equal(isDisabled(html, 'result-home'), false);
  assert.equal(isDisabled(html, 'result-play-again'), false);
});

test('restore loading and missing-session states do not show a playable board', () => {
  const loading = renderGame({ isLoading: true });
  assert.ok(loading.includes('Loading your game…'));
  assert.ok(!loading.includes('data-testid="game-board"'));

  const missing = renderGame();
  assert.ok(missing.includes('No game in progress'));
  assert.ok(!missing.includes('data-testid="game-board"'));
  assert.equal(isDisabled(missing, 'open-game-menu'), false);
  assert.ok(!missing.includes('data-testid="game-home"'));
});

test('the closed game menu does not expose continue, home, or restart actions', () => {
  for (const result of [null, { kind: 'win', title: 'X wins!' }]) {
    const html = renderMenu({ visible: false, result });
    for (const testId of ['game-menu', 'continue-game', 'game-home', 'restart-game', 'game-result-modal', 'result-home', 'result-play-again']) {
      assert.ok(!html.includes(`data-testid="${testId}"`));
    }
  }
});

test('the game menu offers continue, home, and restart, with play again for a finished game', () => {
  const playing = renderMenu();
  openingTag(playing, 'game-menu');
  assert.ok(playing.includes('Continue'));
  assert.ok(playing.includes('Restart game'));
  assert.equal(isDisabled(playing, 'continue-game'), false);
  assert.equal(isDisabled(playing, 'game-home'), false);
  assert.equal(isDisabled(playing, 'restart-game'), false);
  assert.equal(isDisabled(playing, 'close-game-menu'), false);
  assert.ok(!playing.includes('Clear the board and keep your match settings.'));
  assert.ok(!playing.includes('Your unfinished game is saved for later.'));

  const finished = renderMenu({ isFinished: true });
  assert.ok(finished.includes('Play again'));
  assert.ok(!finished.includes('Restart game'));
});

test('a committing menu blocks dismissal, home, and another restart', () => {
  const html = renderMenu({ busy: true });
  for (const testId of ['continue-game', 'close-game-menu', 'dismiss-game-menu-backdrop', 'game-home', 'restart-game']) {
    assert.equal(isDisabled(html, testId), true, `${testId} must wait for the saved restart`);
  }
});

test('the menu offers home without restart when no session is available', () => {
  const html = renderMenu({ canRestart: false });
  assert.equal(isDisabled(html, 'game-home'), false);
  assert.ok(!html.includes('data-testid="restart-game"'));
});

test('the menu keeps restart failures visible and allows a retry', () => {
  const html = renderMenu({ error: 'Your game could not be restarted. Please try again.' });
  openingTag(html, 'game-menu');
  assert.ok(html.includes('Your game could not be restarted. Please try again.'));
  assert.ok(html.includes('role="alert"'));
  assert.equal(isDisabled(html, 'restart-game'), false);
  assert.equal(isDisabled(html, 'game-home'), false);
});

test('every result variant exposes exactly Home and Play again actions', () => {
  for (const result of [
    { kind: 'win', title: 'You won!' },
    { kind: 'loss', title: 'You lost.' },
    { kind: 'draw', title: 'It’s a draw.' },
  ]) {
    const html = renderMenu({ result, isFinished: true });
    openingTag(html, 'game-result-modal');
    assert.equal(titleText(html, 'game-result-title'), result.title);
    assert.equal((html.match(/\brole="button"/g) ?? []).length, 2);
    assert.equal(isDisabled(html, 'result-home'), false);
    assert.equal(isDisabled(html, 'result-play-again'), false);
    assert.match(openingTag(html, 'result-play-again'), /aria-label="Play again"/);
    for (const testId of ['game-menu', 'continue-game', 'close-game-menu', 'game-home', 'restart-game']) {
      assert.ok(!html.includes(`data-testid="${testId}"`));
    }
    assert.equal(isDisabled(html, 'dismiss-game-menu-backdrop'), true);
  }
});

test('saving another round keeps the result visible and blocks both actions', () => {
  const result = { kind: 'win', title: 'X wins!' };
  const html = renderMenu({ result, isFinished: true, busy: true });
  assert.equal(titleText(html, 'game-result-title'), 'X wins!');
  assert.equal(isDisabled(html, 'result-home'), true);
  assert.equal(isDisabled(html, 'result-play-again'), true);
  assert.ok(html.includes('Saving…'));
});

test('a failed rematch retains its result, exposes the error, and allows retry', () => {
  const result = { kind: 'draw', title: 'It’s a draw.' };
  const error = 'Your game could not be restarted. Please try again.';
  const html = renderMenu({ result, isFinished: true, error });
  assert.equal(titleText(html, 'game-result-title'), result.title);
  assert.ok(html.includes(error));
  assert.ok(html.includes('role="alert"'));
  assert.equal(isDisabled(html, 'result-home'), false);
  assert.equal(isDisabled(html, 'result-play-again'), false);
});

test('load failures and move failures show a retry path', () => {
  const loadFailure = renderGame({ error: 'Your saved game could not be loaded.' });
  assert.ok(loadFailure.includes('Your saved game could not be loaded.'));
  assert.ok(loadFailure.includes('Try again'));
  assert.equal(isDisabled(loadFailure, 'retry-load-game'), false);

  const moveFailure = renderGame({ session: sessionWithMoves([0]), error: 'Your move was not saved.' });
  assert.ok(moveFailure.includes('Your move was not saved.'));
  assert.ok(moveFailure.includes('role="alert"'));
  assert.ok(moveFailure.includes('Try again'));
  assert.equal(isDisabled(moveFailure, 'game-cell-1'), false);
});

test('welcome offers Resume game only for an unfinished saved snapshot', () => {
  const unfinished = renderGame({ session: sessionWithMoves([0]) }, WelcomeScreen);
  assert.ok(unfinished.includes('data-testid="resume-game"'));
  assert.ok(unfinished.includes('Resume game'));
  assert.ok(unfinished.includes('With a friend · O to play'));

  const won = sessionWithMoves([0, 3, 1, 4, 2]);
  const drawn = sessionWithMoves([0, 1, 2, 4, 3, 5, 7, 6, 8]);
  for (const session of [null, won, drawn]) {
    const html = renderGame({ session }, WelcomeScreen);
    assert.ok(!html.includes('data-testid="resume-game"'));
  }
});

test('welcome disables start while restoring and resume while committing a move', () => {
  const restoring = renderGame({ isLoading: true }, WelcomeScreen);
  assert.equal(isDisabled(restoring, 'open-match-setup'), true);
  assert.ok(!restoring.includes('data-testid="resume-game"'));

  const saving = renderGame({ session: sessionWithMoves([0]), isSaving: true }, WelcomeScreen);
  assert.equal(isDisabled(saving, 'resume-game'), true);
  assert.equal(isDisabled(saving, 'open-match-setup'), true);
});
