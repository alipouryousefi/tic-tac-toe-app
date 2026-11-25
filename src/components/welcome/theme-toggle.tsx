import { SymbolView } from 'expo-symbols';
import { Pressable } from 'react-native';

import { themeToggleOptions } from '@/constants/theme';
import { useAppTheme } from '@/hooks/app-theme-provider';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { colorScheme, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const option = themeToggleOptions[colorScheme];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={option.label}
      onPress={toggleTheme}
      testID="toggle-theme"
      className="h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full border border-line bg-surface active:opacity-70">
      <SymbolView
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        name={option.icon}
        size={24}
        tintColor={theme.text}
      />
    </Pressable>
  );
}
