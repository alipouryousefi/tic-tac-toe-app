import { View } from 'react-native';

import {
  gameMarkBorders,
  gameMarkFills,
  gameMarkSizes,
  gameMarkStrokes,
} from '@/constants/welcome-styles.constants';
import type { GameMarkProps } from '@/types/welcome.types';

export function GameMark({ mark, size = 'medium', tone = 'blue' }: GameMarkProps) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      className={`items-center justify-center ${gameMarkSizes[size]}`}>
      {mark === 'X' ? (
        <>
          <View className={`absolute h-[18%] w-full rotate-45 rounded-full ${gameMarkFills[tone]}`} />
          <View className={`absolute h-[18%] w-full -rotate-45 rounded-full ${gameMarkFills[tone]}`} />
        </>
      ) : (
        <View className={`h-full w-full rounded-full ${gameMarkStrokes[size]} ${gameMarkBorders[tone]}`} />
      )}
    </View>
  );
}
