import { useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { dialogMotion } from '@/constants/navigation.constants';
import type { ScreenModalProps } from '@/types/modal.types';

const easing = Easing.bezier(...dialogMotion.easing);
const entering = FadeIn.duration(dialogMotion.duration).easing(easing).reduceMotion(ReduceMotion.System);
const exiting = FadeOut.duration(dialogMotion.duration).easing(easing).reduceMotion(ReduceMotion.System);

export function ScreenModal({ visible, onRequestClose, children }: ScreenModalProps) {
  const isFocused = useIsFocused();

  useFocusEffect(useCallback(() => {
    if (!visible) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onRequestClose();
      return true;
    });

    return () => subscription.remove();
  }, [visible, onRequestClose]));

  if (!visible || !isFocused) {
    return null;
  }

  return (
    <Animated.View
      accessibilityViewIsModal
      onAccessibilityEscape={onRequestClose}
      entering={entering}
      exiting={exiting}
      className="absolute inset-0 z-50">
      {children}
    </Animated.View>
  );
}
