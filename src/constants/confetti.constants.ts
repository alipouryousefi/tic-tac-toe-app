const confettiColors = ['#22A7F0', '#F5B642', '#EC7B54', '#6BCB9A', '#BC8BEB', '#FF8BB3'];

export const confettiSettings = {
  pieceCount: 180,
  // A positive duration avoids division by zero and emits on the first web frame.
  spawnDuration: 1,
  wind: 0,
  colors: confettiColors,
} as const;
