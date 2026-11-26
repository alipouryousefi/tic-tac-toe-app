const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

let currentGame;
let navigationCalls = [];
let stateWrites = [];
let events = [];
let effects = [];
let blurListeners = [];

const navigation = {
  addListener: (name, callback) => {
    const listener = { name, callback, active: true };
    blurListeners.push(listener);
    return () => { listener.active = false; };
  },
};

function recordNavigation(method, args) {
  const event = { method, args };
  navigationCalls.push(event);
  events.push(event);
}

function emitBlur() {
  for (const listener of blurListeners) {
    if (listener.active && listener.name === 'blur') listener.callback();
  }
}

function loadHooks() {
  const previousLoad = Module._load;
  const existingModules = new Set(Object.keys(require.cache));
  const sourceDirectory = path.resolve(path.dirname(module.filename), '../src') + path.sep;

  Module._load = function (request, parent, isMain) {
    if (request === 'react') {
      return {
        ...React,
        useState: (initial) => {
          const [value, setValue] = React.useState(initial);
          return [value, (next) => {
            stateWrites.push(next);
            events.push({ method: 'state', value: next });
            setValue(next);
          }];
        },
        useEffect: (effect) => {
          effects.push(effect);
        },
      };
    }
    if (request === 'expo-router') {
      return {
        useNavigation: () => navigation,
        router: {
          navigate: (...args) => recordNavigation('navigate', args),
          dismissTo: (...args) => recordNavigation('dismissTo', args),
        },
      };
    }
    if (request === '@/hooks/game-session-provider') {
      return { useGameSession: () => currentGame };
    }
    return previousLoad.call(this, request, parent, isMain);
  };

  try {
    return {
      useWelcome: require('@/components/welcome/use-welcome').useWelcome,
      useGameMenu: require('@/hooks/use-game-menu').useGameMenu,
    };
  } finally {
    Module._load = previousLoad;
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(sourceDirectory) && !existingModules.has(filename)) {
        delete require.cache[filename];
      }
    }
  }
}

const { useWelcome, useGameMenu } = loadHooks();

function captureHook(useHook, overrides = {}, openSetup = false) {
  currentGame = {
    session: null,
    isLoading: false,
    isSaving: false,
    error: null,
    startSession: async () => false,
    restartSession: async () => false,
    reloadSession: async () => {},
    ...overrides,
  };
  let captured;

  function Capture() {
    effects = [];
    const state = useHook();
    // A render-phase update lets the real hook finish opening setup before capture.
    if (openSetup && state.modal === null) state.openSetup();
    captured = state;
    return null;
  }

  renderToStaticMarkup(React.createElement(Capture));
  // Server rendering does not run effects; attach the latest committed blur listener.
  for (const effect of effects) effect();
  stateWrites = [];
  events = [];
  return captured;
}

test.beforeEach(() => {
  navigationCalls = [];
  stateWrites = [];
  events = [];
  effects = [];
  blurListeners = [];
});

test('Start saves and navigates before clearing setup on blur', async () => {
  let finishSave;
  const save = new Promise((resolve) => { finishSave = resolve; });
  const setups = [];
  const welcome = captureHook(useWelcome, {
    startSession: (setup) => {
      setups.push(setup);
      return save;
    },
  }, true);
  assert.equal(welcome.modal, 'setup');

  const starting = welcome.startGame();
  await welcome.startGame();
  assert.equal(setups.length, 1, 'Repeated presses cannot start a second save');
  assert.deepEqual(navigationCalls, [], 'Navigation must wait for persistence');

  finishSave(true);
  await starting;
  assert.deepEqual(navigationCalls, [{
    method: 'navigate',
    args: [{ pathname: '/game', params: setups[0] }],
  }]);
  assert.ok(!stateWrites.includes(null), 'Setup must remain open when navigation starts');
  assert.ok(!stateWrites.includes(false), 'Setup stays busy until the route blurs');

  await welcome.startGame();
  welcome.closeModal();
  assert.equal(setups.length, 1, 'Start remains locked while navigation awaits blur');
  assert.equal(navigationCalls.length, 1, 'An outgoing setup cannot navigate twice');
  assert.ok(!stateWrites.includes(null), 'Dismissal cannot run ahead of navigation');

  emitBlur();
  const navigateIndex = events.findIndex((event) => event.method === 'navigate');
  const clearIndex = events.findIndex((event) => event.method === 'state' && event.value === null);
  assert.ok(clearIndex > navigateIndex, 'Only blur after navigation clears setup');
  assert.equal(stateWrites.filter((value) => value === null).length, 1);
  assert.ok(stateWrites.includes(false), 'Blur releases the busy state');

  emitBlur();
  assert.equal(stateWrites.filter((value) => value === null).length, 1, 'Further blur events do not clear again');
});

test('a failed Start stays on the current page and can be retried', async () => {
  let attempts = 0;
  const welcome = captureHook(useWelcome, {
    startSession: async () => ++attempts > 1,
  }, true);

  await welcome.startGame();
  assert.deepEqual(navigationCalls, []);
  assert.ok(!stateWrites.includes(null), 'An unsuccessful save keeps setup open');
  assert.ok(stateWrites.includes(false), 'An unsuccessful save releases the busy state');
  emitBlur();
  assert.ok(!stateWrites.includes(null), 'Blur without successful navigation does not clear setup');

  await welcome.startGame();
  assert.equal(navigationCalls.length, 1);
  assert.equal(navigationCalls[0].method, 'navigate');
});

test('Home navigates immediately without a dismissal event and ignores repeated presses', () => {
  const menu = captureHook(useGameMenu);
  menu.goHome();
  assert.deepEqual(navigationCalls, [{ method: 'dismissTo', args: ['/'] }]);
  menu.goHome();
  assert.equal(navigationCalls.length, 1);
});

test('Home cannot navigate while a move is being saved', () => {
  const menu = captureHook(useGameMenu, { isSaving: true });
  menu.goHome();
  assert.deepEqual(navigationCalls, []);
});

test('Home waits for an in-flight restart before allowing navigation', async () => {
  let finishRestart;
  const save = new Promise((resolve) => { finishRestart = resolve; });
  const menu = captureHook(useGameMenu, { restartSession: () => save });

  const restarting = menu.restart();
  menu.goHome();
  assert.deepEqual(navigationCalls, []);

  finishRestart(false);
  await restarting;
  menu.goHome();
  assert.deepEqual(navigationCalls, [{ method: 'dismissTo', args: ['/'] }]);
});
