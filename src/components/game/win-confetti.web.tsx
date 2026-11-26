import { useState } from 'react';
import Confetti from 'react-confetti';
import { View, useWindowDimensions } from 'react-native';

import { confettiSettings } from '@/constants/confetti.constants';
import type { WinConfettiProps } from '@/types/game-ui.types';

export function WinConfetti({ playing }: WinConfettiProps) {
  const { width, height } = useWindowDimensions();
  const [finished, setFinished] = useState(false);

  if (!playing || finished || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      testID="win-confetti"
      className="absolute inset-0 overflow-hidden">
      <Confetti
        width={width}
        height={height}
        numberOfPieces={confettiSettings.pieceCount}
        colors={confettiSettings.colors}
        wind={confettiSettings.wind}
        tweenDuration={confettiSettings.spawnDuration}
        recycle={false}
        onConfettiComplete={() => setFinished(true)}
      />
    </View>
  );
}
