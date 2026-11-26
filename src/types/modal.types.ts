import type { ReactNode } from 'react';

export type ScreenModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
};
