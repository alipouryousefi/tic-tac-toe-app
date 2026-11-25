import { View } from 'react-native';

import { GameMark } from './game-mark';

export function WelcomeHero() {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="h-[180px] w-[288px] max-w-full self-center">
      <View className="absolute left-[8px] top-[30px] h-[128px] w-[270px] -rotate-12 rounded-[100px] border border-line" />
      <View className="absolute left-[24px] top-[20px] h-[120px] w-[120px] -rotate-12 items-center justify-center rounded-[30px] border-2 border-accent/10 border-b-[6px] bg-accent-soft">
        <GameMark mark="X" size="large" />
      </View>
      <View className="absolute right-[23px] top-[54px] h-[108px] w-[108px] rotate-12 items-center justify-center rounded-[30px] border-2 border-player-o/10 border-b-[6px] bg-warm-soft">
        <GameMark mark="O" size="large" tone="warm" />
      </View>
      <View className="absolute right-[42px] top-[10px] h-[18px] w-[18px] items-center justify-center">
        <View className="absolute h-[3px] w-[18px] rounded-full bg-player-o/60" />
        <View className="absolute h-[18px] w-[3px] rounded-full bg-player-o/60" />
      </View>
      <View className="absolute bottom-[20px] left-[37px] h-[8px] w-[8px] rounded-full bg-accent/35" />
      <View className="absolute right-[8px] top-[113px] h-[5px] w-[5px] rounded-full bg-player-o/50" />
      <View className="absolute bottom-[8px] left-[128px] h-[4px] w-[35px] rounded-full bg-line" />
    </View>
  );
}
