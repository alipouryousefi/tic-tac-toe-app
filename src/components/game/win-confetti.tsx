import { useCallback, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { PIConfetti } from 'react-native-fast-confetti';

import { confettiSettings } from '@/constants/confetti.constants';
import type { WinConfettiProps } from '@/types/game-ui.types';

export function WinConfetti({ playing }: WinConfettiProps) {
  const { width, height } = useWindowDimensions();
  const [viewport] = useState(() => ({ width, height }));
  const [finished, setFinished] = useState(false);
  const finish = useCallback(() => setFinished(true), []);
  const celebration = useMemo(() => (
    <PIConfetti
      autoplay
      autoStartDelay={0}
      sprayDuration={0}
      initialScale={1}
      infinite={false}
      fadeOutOnEnd
      colors={confettiSettings.colors}
      containerStyle={viewport}
      onAnimationEnd={finish}>
      <PIConfetti.Origin blastPosition="center" count={confettiSettings.pieceCount}>
        <PIConfetti.Flake width={8} height={14} radius={2} />
        <PIConfetti.Flake size={10} radius={5} />
        <PIConfetti.Flake width={6} height={16} radius={2} />
      </PIConfetti.Origin>
    </PIConfetti>
  ), [viewport, finish]);

  if (!playing || finished) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="win-confetti"
      className="absolute inset-0 overflow-hidden">
      {celebration}
    </View>
  );
}
