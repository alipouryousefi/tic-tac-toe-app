export const gameHistoryLimit = 5;

export const gameHistoryCopy = {
  title: 'Game history',
  kicker: 'YOUR RECENT ROUNDS',
  openHint: 'View your last five completed games',
  closeLabel: 'Close game history',
  emptyTitle: 'No games yet',
  emptyDescription: 'Your last five completed games will appear here.',
  loading: 'Loading your recent games…',
  loadFailed: 'Your game history could not be loaded. Try again.',
  retryLabel: 'Try again',
  playedAs: 'Played as',
  opponents: {
    friend: 'With a friend',
    device: 'Vs. the device',
  },
  results: {
    draw: 'Draw',
    win: 'You won',
    loss: 'Device won',
  },
} as const;

export const gameHistoryDateOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};
