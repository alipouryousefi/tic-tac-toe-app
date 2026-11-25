import type { TextProps } from 'react-native';

export type PlayMode = 'friend' | 'device';
export type PlayerMark = 'X' | 'O';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type WelcomeModalKind = 'setup' | 'history' | null;

export type MatchSetup = {
  mode: PlayMode;
  mark: PlayerMark;
  difficulty: Difficulty;
};

export type WelcomeTextProps = TextProps & {
  tone?: 'ink' | 'muted' | 'accent' | 'accent-ink' | 'warm' | 'white';
};

export type GameMarkProps = {
  mark: PlayerMark;
  size?: 'small' | 'medium' | 'large';
  tone?: 'blue' | 'warm' | 'white';
};

export type ModeCardProps = {
  mode: PlayMode;
  selected: boolean;
  onPress: () => void;
};

export type WelcomeModalProps = {
  modal: WelcomeModalKind;
  draft: MatchSetup;
  onChange: (setup: MatchSetup) => void;
  onClose: () => void;
  onStart: () => void;
  onDismiss: () => void;
};

export type MatchSetupFormProps = Pick<WelcomeModalProps, 'draft' | 'onChange'>;
