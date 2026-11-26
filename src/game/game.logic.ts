import { deviceMoveOrder, gameBoardSize, winningLines } from '@/constants/game.constants';
import type { GameBoard, GameOutcome, GameSession } from '@/types/game.types';
import type { MatchSetup, PlayerMark } from '@/types/welcome.types';

export function createGameSession(setup: MatchSetup, id: string, now: number): GameSession {
  return {
    version: 1,
    id,
    setup: { ...setup },
    board: Array.from({ length: gameBoardSize }, () => null),
    startedAt: now,
    updatedAt: now,
  };
}

export function getGameOutcome(board: GameBoard): GameOutcome {
  for (const line of winningLines) {
    const [first, second, third] = line;
    const mark = board[first];

    if ((mark === 'X' || mark === 'O') && mark === board[second] && mark === board[third]) {
      return { status: 'won', winner: mark, winningLine: line };
    }
  }

  if (board.length === gameBoardSize && board.every((cell) => cell !== null)) {
    return { status: 'draw', winner: null, winningLine: null };
  }

  return { status: 'playing', winner: null, winningLine: null };
}

export function getCurrentPlayer(board: GameBoard): PlayerMark {
  const xCount = board.filter((cell) => cell === 'X').length;
  const oCount = board.filter((cell) => cell === 'O').length;

  return xCount === oCount ? 'X' : 'O';
}

export function applyMove(
  session: GameSession,
  index: number,
  mark: PlayerMark,
  now: number,
): GameSession {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= gameBoardSize ||
    session.board.length !== gameBoardSize ||
    session.board[index] !== null ||
    mark !== getCurrentPlayer(session.board) ||
    getGameOutcome(session.board).status !== 'playing' ||
    !Number.isSafeInteger(now)
  ) {
    return session;
  }

  const board = [...session.board];
  board[index] = mark;

  return { ...session, board, updatedAt: Math.max(now, session.updatedAt) };
}

function getOtherPlayer(mark: PlayerMark): PlayerMark {
  return mark === 'X' ? 'O' : 'X';
}

function getAvailableMoves(board: GameBoard): number[] {
  return deviceMoveOrder.filter((index) => board[index] === null);
}

function getWinningMove(board: GameBoard, mark: PlayerMark): number | null {
  for (const index of getAvailableMoves(board)) {
    const nextBoard = [...board];
    nextBoard[index] = mark;

    if (getGameOutcome(nextBoard).winner === mark) {
      return index;
    }
  }

  return null;
}

function scoreBoard(
  board: GameBoard,
  turn: PlayerMark,
  device: PlayerMark,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const outcome = getGameOutcome(board);

  if (outcome.status === 'won') {
    const score = gameBoardSize + 1 - depth;
    return outcome.winner === device ? score : -score;
  }

  if (outcome.status === 'draw') {
    return 0;
  }

  const maximizing = turn === device;
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const index of getAvailableMoves(board)) {
    const nextBoard = [...board];
    nextBoard[index] = turn;
    const score = scoreBoard(nextBoard, getOtherPlayer(turn), device, depth + 1, alpha, beta);

    if (maximizing) {
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);
    } else {
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) {
      break;
    }
  }

  return bestScore;
}

function getBestMove(board: GameBoard, device: PlayerMark): number | null {
  let bestMove: number | null = null;
  let bestScore = -Infinity;

  for (const index of getAvailableMoves(board)) {
    const nextBoard = [...board];
    nextBoard[index] = device;
    const score = scoreBoard(nextBoard, getOtherPlayer(device), device, 1, -Infinity, Infinity);

    if (score > bestScore) {
      bestMove = index;
      bestScore = score;
    }
  }

  return bestMove;
}

export function getDeviceMove(session: GameSession, random = Math.random): number | null {
  if (
    session.setup.mode !== 'device' ||
    getGameOutcome(session.board).status !== 'playing' ||
    getCurrentPlayer(session.board) === session.setup.mark
  ) {
    return null;
  }

  const available = getAvailableMoves(session.board);

  if (available.length === 0) {
    return null;
  }

  const device = getOtherPlayer(session.setup.mark);

  if (session.setup.difficulty === 'hard') {
    return getBestMove(session.board, device);
  }

  if (session.setup.difficulty === 'normal') {
    const winningMove = getWinningMove(session.board, device);

    if (winningMove !== null) {
      return winningMove;
    }

    const blockingMove = getWinningMove(session.board, session.setup.mark);

    if (blockingMove !== null) {
      return blockingMove;
    }
  }

  const sample = random();
  const index = Number.isFinite(sample)
    ? Math.min(available.length - 1, Math.max(0, Math.floor(sample * available.length)))
    : 0;

  return available[index];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isReachableBoard(board: GameBoard): boolean {
  const xCount = board.filter((cell) => cell === 'X').length;
  const oCount = board.filter((cell) => cell === 'O').length;

  if (xCount === 0 && oCount === 0) {
    return true;
  }

  if (xCount !== oCount && xCount !== oCount + 1) {
    return false;
  }

  const lastPlayer = xCount === oCount ? 'O' : 'X';
  const outcome = getGameOutcome(board);

  if (outcome.winner !== null && outcome.winner !== lastPlayer) {
    return false;
  }

  for (let index = 0; index < gameBoardSize; index += 1) {
    if (board[index] !== lastPlayer) {
      continue;
    }

    const previousBoard = [...board];
    previousBoard[index] = null;

    if (getGameOutcome(previousBoard).status === 'playing' && isReachableBoard(previousBoard)) {
      return true;
    }
  }

  return false;
}

export function isGameSession(value: unknown): value is GameSession {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof value.startedAt !== 'number' ||
    typeof value.updatedAt !== 'number' ||
    !Number.isSafeInteger(value.startedAt) ||
    !Number.isSafeInteger(value.updatedAt) ||
    value.startedAt < 0 ||
    value.updatedAt < value.startedAt ||
    !isRecord(value.setup) ||
    (value.setup.mode !== 'friend' && value.setup.mode !== 'device') ||
    (value.setup.mark !== 'X' && value.setup.mark !== 'O') ||
    (value.setup.difficulty !== 'easy' && value.setup.difficulty !== 'normal' && value.setup.difficulty !== 'hard') ||
    !Array.isArray(value.board) ||
    value.board.length !== gameBoardSize ||
    !value.board.every((cell: unknown) => cell === null || cell === 'X' || cell === 'O')
  ) {
    return false;
  }

  return isReachableBoard(value.board);
}
