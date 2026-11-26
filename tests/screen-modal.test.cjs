const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const nativeWeb = require('react-native-web');

let focused = true;
let focusEffects = [];
let subscriptions = [];

function loadScreenModal() {
  const previousLoad = Module._load;
  const existingModules = new Set(Object.keys(require.cache));
  const sourceDirectory = path.resolve(path.dirname(module.filename), '../src') + path.sep;
  const fade = {
    duration: () => fade,
    easing: () => fade,
    reduceMotion: () => fade,
  };

  Module._load = function (request, parent, isMain) {
    if (request === 'expo-router') {
      return {
        useIsFocused: () => focused,
        useFocusEffect: (effect) => {
          if (focused) focusEffects.push(effect);
        },
      };
    }
    if (request === 'react-native') {
      return {
        BackHandler: {
          addEventListener: (name, handler) => {
            const subscription = { name, handler, removed: false };
            subscriptions.push(subscription);
            return { remove: () => { subscription.removed = true; } };
          },
        },
      };
    }
    if (request === 'react-native-reanimated') {
      return {
        __esModule: true,
        default: { View: ({ children }) => React.createElement(nativeWeb.View, null, children) },
        Easing: { bezier: () => () => 0 },
        FadeIn: fade,
        FadeOut: fade,
        ReduceMotion: { System: 'system' },
      };
    }
    return previousLoad.call(this, request, parent, isMain);
  };

  try {
    return require('@/components/screen-modal').ScreenModal;
  } finally {
    Module._load = previousLoad;
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(sourceDirectory) && !existingModules.has(filename)) {
        delete require.cache[filename];
      }
    }
  }
}

const ScreenModal = loadScreenModal();

function renderModal(visible, onRequestClose = () => {}) {
  return renderToStaticMarkup(React.createElement(
    ScreenModal,
    { visible, onRequestClose },
    React.createElement(nativeWeb.View, { testID: 'modal-body' }),
  ));
}

test.beforeEach(() => {
  focused = true;
  focusEffects = [];
  subscriptions = [];
});

test('a visible focused screen modal consumes Back, delegates dismissal, and removes its listener', () => {
  let closeRequests = 0;
  const html = renderModal(true, () => { closeRequests += 1; });
  assert.ok(html.includes('data-testid="modal-body"'));
  assert.equal(focusEffects.length, 1);

  const cleanup = focusEffects[0]();
  assert.equal(subscriptions.length, 1);
  assert.equal(subscriptions[0].name, 'hardwareBackPress');
  assert.equal(subscriptions[0].handler(), true);
  assert.equal(closeRequests, 1);

  cleanup();
  assert.equal(subscriptions[0].removed, true);
});

test('hidden or unfocused screen modals neither render nor trap Back', () => {
  assert.equal(renderModal(false), '');
  for (const effect of focusEffects) assert.equal(effect(), undefined);
  assert.equal(subscriptions.length, 0);

  focusEffects = [];
  focused = false;
  assert.equal(renderModal(true), '');
  assert.equal(focusEffects.length, 0);
  assert.equal(subscriptions.length, 0);
});
