const assert = require('node:assert/strict');
const test = require('node:test');

const {
  applyMove,
  createGameSession,
  getCurrentPlayer,
  getDeviceMove,
  getGameOutcome,
  isGameSession,
} = require('@/game/game.logic');

function newSession(overrides = {}) {
  return createGameSession({ mode: 'friend', mark: 'X', difficulty: 'normal', ...overrides }, 'test-game', 100);
}

function play(session, moves) {
  return moves.reduce(
    (current, index) => applyMove(current, index, getCurrentPlayer(current.board), current.updatedAt + 1),
    session,
  );
}

test('new sessions clone setup, start empty, and give X the first turn', () => {
  const setup = { mode: 'friend', mark: 'O', difficulty: 'hard' };
  const session = createGameSession(setup, 'first-game', 100);
  assert.deepEqual(session.board, Array(9).fill(null));
  assert.notEqual(session.setup, setup);
  assert.equal(getCurrentPlayer(session.board), 'X');
  assert.equal(getGameOutcome(session.board).status, 'playing');
  assert.equal(isGameSession(session), true);
  setup.mark = 'X';
  assert.equal(session.setup.mark, 'O');
});

test('all eight winning lines are detected for either mark', () => {
  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  for (const mark of ['X', 'O']) {
    for (const line of lines) {
      const board = Array(9).fill(null);
      for (const index of line) board[index] = mark;
      assert.deepEqual(getGameOutcome(board), { status: 'won', winner: mark, winningLine: line });
    }
  }
});

test('a full board without a winning line is a draw, while a ninth-move win stays a win', () => {
  const draw = play(newSession(), [0, 1, 2, 4, 3, 5, 7, 6, 8]);
  assert.deepEqual(getGameOutcome(draw.board), { status: 'draw', winner: null, winningLine: null });
  const finalWin = play(newSession(), [0, 1, 2, 3, 4, 5, 7, 6, 8]);
  assert.equal(getGameOutcome(finalWin.board).status, 'won');
  assert.equal(getGameOutcome(finalWin.board).winner, 'X');
});

test('moves alternate turns and update immutably; invalid moves preserve the original session', () => {
  const empty = newSession();
  Object.freeze(empty.board);
  Object.freeze(empty.setup);
  Object.freeze(empty);
  for (const index of [-1, 9, 1.5, NaN, Infinity]) {
    assert.equal(applyMove(empty, index, 'X', 101), empty);
  }
  assert.equal(applyMove(empty, 0, 'O', 101), empty);
  assert.equal(applyMove(empty, 0, 'X', NaN), empty);
  const first = applyMove(empty, 0, 'X', 101);
  assert.notEqual(first, empty);
  assert.notEqual(first.board, empty.board);
  assert.equal(empty.board[0], null);
  assert.equal(first.board[0], 'X');
  assert.equal(first.updatedAt, 101);
  assert.equal(getCurrentPlayer(first.board), 'O');
  assert.equal(applyMove(first, 0, 'O', 102), first);
  assert.equal(applyMove(first, 1, 'X', 102), first);
  assert.equal(applyMove(first, 1, 'O', 50).updatedAt, 101);
  assert.equal(getCurrentPlayer(applyMove(first, 1, 'O', 102).board), 'X');
});

test('won and drawn games refuse every further move', () => {
  const ended = [
    play(newSession(), [0, 3, 1, 4, 2]),
    play(newSession(), [0, 1, 2, 4, 3, 5, 7, 6, 8]),
  ];
  for (const session of ended) {
    for (let index = 0; index < 9; index += 1) {
      assert.equal(applyMove(session, index, getCurrentPlayer(session.board), 200), session);
    }
  }
});

test('device only plays on its own turn in an unfinished device game', () => {
  assert.equal(getDeviceMove(newSession()), null);
  assert.equal(getDeviceMove(newSession({ mode: 'device' })), null);
  const deviceStarts = newSession({ mode: 'device', mark: 'O' });
  assert.equal(getDeviceMove(deviceStarts, () => 0), 4);
  for (const sample of [-1, 0, 0.5, 1, NaN, Infinity]) {
    const easy = { ...deviceStarts, setup: { ...deviceStarts.setup, difficulty: 'easy' } };
    const move = getDeviceMove(easy, () => sample);
    assert.ok(Number.isInteger(move) && move >= 0 && move < 9);
  }
  const finished = play(newSession({ mode: 'device' }), [0, 3, 1, 4, 2]);
  assert.equal(getDeviceMove(finished), null);
});

test('balanced device takes its own win before blocking, and blocks immediate losses', () => {
  const win = play(newSession({ mode: 'device' }), [0, 3, 1, 4, 6]);
  assert.equal(getDeviceMove(win), 5);
  const block = play(newSession({ mode: 'device' }), [0, 4, 1]);
  assert.equal(getDeviceMove(block), 2);
});

test('hard device blocks the opposite-corner fork', () => {
  const fork = play(newSession({ mode: 'device', difficulty: 'hard' }), [0, 4, 8]);
  assert.ok([1, 3, 5, 7].includes(getDeviceMove(fork)));
});

test('hard device cannot lose against any legal human play as either mark', () => {
  for (const human of ['X', 'O']) {
    const visited = new Set();
    let finishedGames = 0;
    function explore(session) {
      const key = session.board.map((cell) => cell ?? '-').join('');
      if (visited.has(key)) return;
      visited.add(key);
      const outcome = getGameOutcome(session.board);
      if (outcome.status !== 'playing') {
        assert.notEqual(outcome.winner, human, `Hard device lost to ${human}: ${key}`);
        finishedGames += 1;
        return;
      }
      const turn = getCurrentPlayer(session.board);
      if (turn !== human) {
        const move = getDeviceMove(session);
        assert.notEqual(move, null);
        const next = applyMove(session, move, turn, session.updatedAt + 1);
        assert.notEqual(next, session);
        explore(next);
        return;
      }
      session.board.forEach((cell, index) => {
        if (cell === null) explore(applyMove(session, index, human, session.updatedAt + 1));
      });
    }
    explore(newSession({ mode: 'device', mark: human, difficulty: 'hard' }));
    assert.ok(finishedGames > 0);
  }
});

test('session validation rejects malformed metadata and accepts serialized snapshots', () => {
  const valid = play(newSession(), [0, 4, 1]);
  assert.equal(isGameSession(JSON.parse(JSON.stringify(valid))), true);
  for (const value of [
    null,
    [],
    { ...valid, version: 2 },
    { ...valid, id: '' },
    { ...valid, board: [] },
    { ...valid, board: [...valid.board.slice(0, 8), 'bad'] },
    { ...valid, startedAt: NaN },
    { ...valid, updatedAt: 1 },
    { ...valid, setup: { ...valid.setup, difficulty: 'impossible' } },
    { ...valid, setup: { ...valid.setup, mode: 'online' } },
    { ...valid, setup: { ...valid.setup, mark: 'Y' } },
  ]) {
    assert.equal(isGameSession(value), false);
  }
});

test('persisted-board validation accepts exactly positions reachable without playing past a result', () => {
  const reachable = new Set();
  function visit(board, turn) {
    const key = board.map((cell) => cell ?? '-').join('');
    if (reachable.has(key)) return;
    reachable.add(key);
    if (getGameOutcome(board).status !== 'playing') return;
    board.forEach((cell, index) => {
      if (cell !== null) return;
      const next = [...board];
      next[index] = turn;
      visit(next, turn === 'X' ? 'O' : 'X');
    });
  }
  visit(Array(9).fill(null), 'X');
  const base = newSession();
  for (let encoded = 0; encoded < 3 ** 9; encoded += 1) {
    let remainder = encoded;
    const board = Array.from({ length: 9 }, () => {
      const cell = [null, 'X', 'O'][remainder % 3];
      remainder = Math.floor(remainder / 3);
      return cell;
    });
    const key = board.map((cell) => cell ?? '-').join('');
    assert.equal(isGameSession({ ...base, board }), reachable.has(key), key);
  }
});
