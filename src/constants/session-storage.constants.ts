export const sessionStorageConfig = {
  databaseName: 'tic-tac-toe-session.db',
  webDatabaseName: 'tic-tac-toe-session',
  webVersion: 1,
  webStoreName: 'game-session',
  webSessionKey: 'current-session',
  webHistoryKey: 'completed-games',
} as const;

export const sessionStorageSql = {
  initialize: `
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    CREATE TABLE IF NOT EXISTS game_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS game_history (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL
    );
  `,
  load: 'SELECT payload FROM game_session WHERE id = 1;',
  save: `
    INSERT INTO game_session (id, payload) VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload;
  `,
  loadHistory: 'SELECT payload FROM game_history WHERE id = 1;',
  saveHistory: `
    INSERT INTO game_history (id, payload) VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload;
  `,
} as const;

export const sessionStorageMessages = {
  invalidSavedGame: 'Your saved game could not be read. Start a new game to replace it.',
  invalidNewGame: 'This game could not be saved. Try starting a new game.',
  invalidHistory: 'Your game history could not be read. Try again.',
  unavailable: 'Local game storage is unavailable. Try again.',
  blocked: 'Close other tabs for this game, then try again.',
  readFailed: 'Your saved game could not be loaded. Try again.',
  writeFailed: 'Your game could not be saved. Try again.',
} as const;
