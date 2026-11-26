export const gameMarkSizes = {
  small: 'h-[24px] w-[24px]',
  medium: 'h-[40px] w-[40px]',
  large: 'h-[72px] w-[72px]',
} as const;

export const gameMarkStrokes = {
  small: 'border-[4px]',
  medium: 'border-[7px]',
  large: 'border-[13px]',
} as const;

export const gameMarkFills = {
  blue: 'bg-accent',
  warm: 'bg-player-o',
  white: 'bg-white',
} as const;

export const gameMarkBorders = {
  blue: 'border-accent',
  warm: 'border-player-o',
  white: 'border-white',
} as const;

export const welcomeTextTones = {
  ink: 'text-ink',
  muted: 'text-muted',
  accent: 'text-accent',
  'accent-ink': 'text-accent-ink',
  warm: 'text-player-o',
  positive: 'text-positive',
  negative: 'text-negative',
  white: 'text-white',
} as const;
