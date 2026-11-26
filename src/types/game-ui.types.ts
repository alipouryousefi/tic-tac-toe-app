import type { PlayerMark } from '@/types/welcome.types';

export type GameResultKind = 'win' | 'loss' | 'draw';

export type GameResultDetails = {
  kind: GameResultKind;
  title: string;
};

export type GameBoardProps = {
  board: readonly (PlayerMark | null)[];
  currentPlayer: PlayerMark;
  winningLine: readonly number[] | null;
  disabled: boolean;
  onPress: (index: number) => void;
};

export type GameMenuModalProps = {
  visible: boolean;
  busy: boolean;
  canRestart: boolean;
  isFinished: boolean;
  error: string | null;
  result?: GameResultDetails | null;
  onClose: () => void;
  onDismiss: () => void;
  onHome: () => void;
  onRestart: () => void;
};

export type GameResultContentProps = {
  result: GameResultDetails;
  busy: boolean;
  error: string | null;
  onHome: () => void;
  onPlayAgain: () => void;
};
