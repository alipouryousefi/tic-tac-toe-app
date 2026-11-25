import { View } from 'react-native';

export function CloseIcon() {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="h-[20px] w-[20px] items-center justify-center">
      <View className="absolute h-[2px] w-[20px] rotate-45 rounded-full bg-muted" />
      <View className="absolute h-[2px] w-[20px] -rotate-45 rounded-full bg-muted" />
    </View>
  );
}
