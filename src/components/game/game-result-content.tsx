import { SymbolView } from 'expo-symbols';
import { Pressable, View } from 'react-native';

import { WelcomeText } from '@/components/welcome/welcome-text';
import { gameMenuActionIcons, gameMenuCopy, gameResultStyles, gameUiCopy } from '@/constants/game-ui.constants';
import { useTheme } from '@/hooks/use-theme';
import type { GameResultContentProps } from '@/types/game-ui.types';

export function GameResultContent({
  result,
  busy,
  error,
  onHome,
  onPlayAgain,
}: GameResultContentProps) {
  const theme = useTheme();
  const styles = gameResultStyles[result.kind];

  return (
    <View className="gap-6">
      <View className="items-center gap-5 pb-2 pt-2">
        <View className={`h-20 w-20 items-center justify-center rounded-full ${styles.badge}`}>
          <SymbolView
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            name={styles.icon}
            size={32}
            tintColor={theme.text}
          />
        </View>
        <WelcomeText
          accessibilityRole="header"
          testID="game-result-title"
          tone={styles.titleTone}
          className="text-center text-[32px] font-bold leading-[42px] tracking-[-1px]">
          {result.title}
        </WelcomeText>
      </View>
      {error && (
        <WelcomeText accessibilityRole="alert" className="rounded-2xl bg-warm-soft p-4 text-[13px] leading-[22px]">
          {error}
        </WelcomeText>
      )}
      <View className="flex-row items-stretch gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={onHome}
          testID="result-home"
          className="min-h-[96px] min-w-0 flex-1 items-center justify-center gap-3 rounded-2xl bg-canvas px-3 py-4 active:bg-accent-soft disabled:opacity-50">
          <SymbolView
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            name={gameMenuActionIcons.home}
            size={22}
            tintColor={theme.text}
          />
          <WelcomeText className="w-full text-center text-[13px] font-semibold leading-[20px]">
            {gameMenuCopy.home}
          </WelcomeText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={gameUiCopy.playAgain}
          accessibilityState={{ disabled: busy, busy }}
          disabled={busy}
          onPress={onPlayAgain}
          testID="result-play-again"
          className="min-h-[96px] min-w-0 flex-1 items-center justify-center gap-3 rounded-2xl bg-action px-3 py-4 active:opacity-75 disabled:opacity-50">
          <SymbolView
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            name={gameMenuActionIcons.restart}
            size={22}
            tintColor="white"
          />
          <WelcomeText tone="white" className="w-full text-center text-[13px] font-semibold leading-[20px]">
            {busy ? gameMenuCopy.saving : gameUiCopy.playAgain}
          </WelcomeText>
        </Pressable>
      </View>
    </View>
  );
}
