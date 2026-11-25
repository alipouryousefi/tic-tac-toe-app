import type { Difficulty, MatchSetup } from '@/types/welcome.types';

export const startGameCopy = {
  buttonLabel: 'Start a game',
  confirmLabel: 'Start game',
  openHint: 'Choose your opponent and mark before starting the game',
} as const;

export const welcomeModalLayout = {
  edgeSpacing: 20,
  setupHeight: 720,
  historyHeight: 520,
} as const;

export const defaultMatchSetup: Readonly<MatchSetup> = {
  mode: 'friend',
  mark: 'X',
  difficulty: 'normal',
};

export const playModes = [
  { value: 'friend', title: 'With a friend', description: 'One device. Take turns.' },
  { value: 'device', title: 'Against the device', description: 'A little solo challenge.' },
] as const;

export const playerMarks = ['X', 'O'] as const;

export const difficulties = ['easy', 'normal', 'hard'] as const;

export const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  normal: 'Balanced',
  hard: 'Hard',
};

