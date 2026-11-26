const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  createGameHistoryEntry,
  deserializeGameHistory,
  getCompletedGame,
  mergeGameHistory,
} = require('@/game/game-history.logic');
const { applyMove, createGameSession, getCurrentPlayer } = require('@/game/game.logic');

function completedEntry(id, completedAt, winner = 'X') {
  return {
    id,
    sessionId: id,
    setup: { mode: 'friend', mark: 'X', difficulty: 'normal' },
    winner,
    completedAt,
  };
}

function playSession(moves) {
  let session = createGameSession({ mode: 'device', mark: 'O', difficulty: 'hard' }, 'completed-round', 1000);
  for (const [turn, index] of moves.entries()) {
    session = applyMove(session, index, getCurrentPlayer(session.board), 2000 + turn);
  }
  return session;
}

test('history includes completed wins and draws, and excludes unfinished games', () => {
  assert.equal(getCompletedGame(playSession([0, 4])), null);

  for (const [moves, winner] of [
    [[0, 3, 1, 4, 2], 'X'],
    [[0, 3, 1, 4, 8, 5], 'O'],
    [[0, 1, 2, 4, 3, 5, 7, 6, 8], null],
  ]) {
    const session = playSession(moves);
    assert.deepEqual(getCompletedGame(session), {
      sessionId: session.id,
      setup: session.setup,
      winner,
      completedAt: session.updatedAt,
    });
  }
});

test('history entries use the session identity and copy match settings', () => {
  const completed = getCompletedGame(playSession([0, 3, 1, 4, 2]));
  const entry = createGameHistoryEntry(completed);
  assert.deepEqual(entry, { ...completed, id: completed.sessionId });
  assert.notEqual(entry.setup, completed.setup);
});

test('merging restored and newly completed matches deduplicates and keeps the latest five', () => {
  const entries = Array.from({ length: 7 }, (_, index) => completedEntry(`round-${index}`, 1000 + index));
  const restored = [entries[0], entries[5], entries[2], entries[4]];
  const recordedDuringRestore = [entries[6], entries[1], entries[3], entries[5]];
  const previousRestored = JSON.stringify(restored);
  const previousRecorded = JSON.stringify(recordedDuringRestore);

  assert.deepEqual(mergeGameHistory(restored, recordedDuringRestore), entries.slice(2).reverse());
  assert.equal(JSON.stringify(restored), previousRestored);
  assert.equal(JSON.stringify(recordedDuringRestore), previousRecorded);
  assert.deepEqual(mergeGameHistory(), []);
});

test('deserialization normalizes valid saved history and handles an absent record', () => {
  assert.deepEqual(deserializeGameHistory(undefined), []);
  const entries = Array.from({ length: 7 }, (_, index) => completedEntry(`saved-${index}`, index, index % 2 ? 'O' : null));
  assert.deepEqual(deserializeGameHistory(JSON.stringify([...entries, entries[3]])), entries.slice(2).reverse());
});

test('invalid history payloads and fields are rejected', () => {
  const valid = completedEntry('valid-round', 1000);
  const invalidEntries = [
    { ...valid, id: 'different-round' },
    { ...valid, id: '', sessionId: '' },
    { ...valid, id: ' ', sessionId: ' ' },
    { ...valid, completedAt: -1 },
    { ...valid, completedAt: null },
    { ...valid, winner: 'Z' },
    { ...valid, setup: null },
    { ...valid, setup: { ...valid.setup, mode: 'online' } },
    { ...valid, setup: { ...valid.setup, mark: 'Z' } },
    { ...valid, setup: { ...valid.setup, difficulty: 'expert' } },
  ];

  for (const payload of ['{broken json', '{}', 'null', JSON.stringify([null]), ...invalidEntries.map((entry) => JSON.stringify([entry]))]) {
    assert.throws(() => deserializeGameHistory(payload));
  }
});
