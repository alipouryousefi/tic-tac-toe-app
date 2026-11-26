export const deviceThinkDelay = 400;

export const gameMenuIcon = {
  ios: 'ellipsis',
  android: 'more_horiz',
  web: 'more_horiz',
} as const;

export const gameMenuActionIcons = {
  pause: { ios: 'pause.fill', android: 'pause', web: 'pause' },
  continue: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  restart: { ios: 'arrow.counterclockwise', android: 'replay', web: 'replay' },
  home: { ios: 'house', android: 'home', web: 'home' },
  finished: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' },
} as const;

export const gameMenuCopy = {
  open: 'Open game menu',
  close: 'Close game menu',
  title: 'Game menu',
  pausedTitle: 'Game paused',
  finishedTitle: 'Round complete',
  continue: 'Continue',
  home: 'Go to home',
  saving: 'Saving…',
} as const;

export const gameMenuLayout = { edgeSpacing: 20 } as const;

export const gameResultStyles = {
  win: {
    titleTone: 'positive',
    badge: 'bg-positive-soft',
    icon: { ios: 'trophy', android: 'emoji_events', web: 'emoji_events' },
  },
  loss: {
    titleTone: 'negative',
    badge: 'bg-negative-soft',
    icon: { ios: 'flag.checkered', android: 'flag', web: 'flag' },
  },
  draw: {
    titleTone: 'accent-ink',
    badge: 'bg-accent-soft',
    icon: { ios: 'equal', android: 'equal', web: 'equal' },
  },
} as const;

export const boardRows = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
] as const;

export const gameUiCopy = {
  kicker: 'A LITTLE FRIENDLY COMPETITION',
  friendMode: 'With a friend',
  deviceMode: 'Vs. the device',
  back: 'Back to welcome',
  restart: 'Restart game',
  playAgain: 'Play again',
  retry: 'Try again',
  loading: 'Loading your game…',
  loadingDescription: 'Picking up where you left off.',
  noSession: 'No game in progress',
  noSessionDescription: 'Start a new round from the welcome page.',
  loadError: 'We couldn’t open your game',
  yourTurn: 'Your turn',
  deviceTurn: 'Device’s turn',
  deviceThinking: 'Thinking of the next move…',
  friendTurnHint: 'Pass the phone after your move.',
  youWon: 'You won!',
  youLost: 'You lost.',
  deviceWon: 'The device wins.',
  winHint: 'Three in a row. Fancy another round?',
  draw: 'It’s a draw.',
  drawHint: 'No room left. Time for a rematch?',
  you: 'You',
  device: 'Device',
  savedHint: 'Saved after every move. You can come back later.',
  emptyCell: 'empty',
} as const;
