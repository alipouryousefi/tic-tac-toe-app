import { useIsFocused } from 'expo-router';
import { Modal } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import type { ScreenModalProps } from '@/types/modal.types';

export function ScreenModal({ visible, onRequestClose, children }: ScreenModalProps) {
  const isFocused = useIsFocused();
  const reducedMotion = useReducedMotion();

  // Release the outgoing page's portal and focus trap as navigation starts.
  if (!isFocused) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onRequestClose}>
      {children}
    </Modal>
  );
}
