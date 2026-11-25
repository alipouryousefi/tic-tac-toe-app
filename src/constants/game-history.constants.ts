export const gameHistoryCopy = {
  title: 'Game history',
  kicker: 'YOUR RECENT ROUNDS',
  openHint: 'View your completed games',
  closeLabel: 'Close game history',
  doneLabel: 'Done',
  emptyTitle: 'No games yet',
  emptyDescription: 'Your completed games will appear here.',
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
