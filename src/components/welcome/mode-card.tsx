import { Pressable, View } from 'react-native';

import type { ModeCardProps } from '@/types/welcome.types';

import { GameMark } from './game-mark';
import { WelcomeText } from './welcome-text';

export function ModeCard({ mode, selected, onPress }: ModeCardProps) {
  const isFriend = mode === 'friend';

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={isFriend ? 'With a friend' : 'Vs. the device'}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      testID={`mode-${mode}`}
      className={`min-h-[124px] flex-1 rounded-[22px] border p-[16px] active:opacity-70 ${
        selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
      }`}>
      <View className="mb-[14px] flex-row items-center justify-between">
        <View className="flex-row items-center gap-[7px]">
          <GameMark mark={isFriend ? 'X' : 'O'} size="small" tone={isFriend ? 'blue' : 'warm'} />
          {isFriend && <GameMark mark="O" size="small" tone="warm" />}
          {!isFriend && (
            <View className="h-[20px] w-[26px] items-center justify-center rounded-[5px] border-2 border-player-o/50">
              <View className="h-[3px] w-[10px] rounded-full bg-player-o/60" />
            </View>
          )}
        </View>
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          className={`h-[20px] w-[20px] items-center justify-center rounded-full border ${
            selected ? 'border-action bg-action' : 'border-line'
          }`}>
          {selected && (
            <WelcomeText tone="white" className="text-[12px] font-bold leading-[16px]">
              ✓
            </WelcomeText>
          )}
        </View>
      </View>
      <WelcomeText className="text-[14px] font-semibold leading-[21px]">
        {isFriend ? 'With a friend' : 'Vs. the device'}
      </WelcomeText>
      <WelcomeText tone="muted" className="mt-[3px] text-[11px] leading-[17px]">
        {isFriend ? 'Pass, play, repeat.' : 'Your own little challenge.'}
      </WelcomeText>
    </Pressable>
  );
}
