import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/close-icon';
import { WelcomeText } from '@/components/welcome/welcome-text';
import {
  gameMenuActionIcons,
  gameMenuCopy,
  gameMenuIcon,
  gameMenuLayout,
  gameUiCopy,
} from '@/constants/game-ui.constants';
import { useTheme } from '@/hooks/use-theme';
import type { GameMenuModalProps } from '@/types/game-ui.types';

import { GameResultContent } from './game-result-content';

export function GameMenuModal({
  visible,
  busy,
  canRestart,
  isFinished,
  error,
  result = null,
  onClose,
  onDismiss,
  onHome,
  onRestart,
}: GameMenuModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  const [displayedResult, setDisplayedResult] = useState(result);

  // Retain the finished round during the native dismissal after Play again.
  if (visible && result !== displayedResult) {
    setDisplayedResult(result);
  }

  const isResult = displayedResult !== null;
  const dismiss = isResult ? onHome : onClose;
  const title = canRestart
    ? isFinished ? gameMenuCopy.finishedTitle : gameMenuCopy.pausedTitle
    : gameMenuCopy.title;
  const statusIcon = canRestart
    ? isFinished ? gameMenuActionIcons.finished : gameMenuActionIcons.pause
    : gameMenuIcon;
  const availableHeight = Math.max(
    0,
    height - insets.top - insets.bottom - gameMenuLayout.edgeSpacing * 2,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismiss}
      onDismiss={onDismiss}>
      <View
        className="flex-1 items-center justify-center"
        style={{
          paddingTop: insets.top + gameMenuLayout.edgeSpacing,
          paddingBottom: insets.bottom + gameMenuLayout.edgeSpacing,
          paddingLeft: insets.left + gameMenuLayout.edgeSpacing,
          paddingRight: insets.right + gameMenuLayout.edgeSpacing,
        }}>
        <Pressable
          accessible={false}
          focusable={false}
          importantForAccessibility="no-hide-descendants"
          disabled={busy || isResult}
          onPress={onClose}
          testID="dismiss-game-menu-backdrop"
          className="absolute inset-0 bg-black/45"
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={dismiss}
          testID={isResult ? 'game-result-modal' : 'game-menu'}
          className="w-full max-w-[360px] overflow-hidden rounded-[32px] border border-line bg-surface"
          style={{ maxHeight: availableHeight }}>
          <ScrollView className="shrink" contentContainerClassName="gap-6 p-6" bounces={false}>
            {displayedResult ? (
              <GameResultContent
                result={displayedResult}
                busy={busy}
                error={error}
                onHome={onHome}
                onPlayAgain={onRestart}
              />
            ) : (
              <>
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
                    <SymbolView
                      accessible={false}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      name={statusIcon}
                      size={20}
                      tintColor={theme.text}
                    />
                  </View>
                  <WelcomeText accessibilityRole="header" className="flex-1 text-[22px] font-bold leading-[30px] tracking-[-0.7px]">
                    {title}
                  </WelcomeText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={gameMenuCopy.close}
                    accessibilityState={{ disabled: busy }}
                    disabled={busy}
                    onPress={onClose}
                    testID="close-game-menu"
                    className="-mr-2 h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full active:bg-canvas disabled:opacity-50">
                    <CloseIcon />
                  </Pressable>
                </View>
                {error && (
                  <WelcomeText accessibilityRole="alert" className="rounded-2xl bg-warm-soft p-4 text-[13px] leading-[22px]">
                    {error}
                  </WelcomeText>
                )}
                <View className="gap-3">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: busy }}
                    disabled={busy}
                    onPress={onClose}
                    testID="continue-game"
                    className="min-h-[56px] flex-row items-center justify-center gap-3 rounded-2xl bg-action px-5 py-4 active:opacity-75 disabled:opacity-50">
                    <SymbolView
                      accessible={false}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      name={gameMenuActionIcons.continue}
                      size={18}
                      tintColor="white"
                    />
                    <WelcomeText tone="white" className="shrink text-center text-[15px] font-bold leading-[22px]">
                      {gameMenuCopy.continue}
                    </WelcomeText>
                  </Pressable>
                  <View className="flex-row items-stretch gap-3">
                    {canRestart && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: busy, busy }}
                        disabled={busy}
                        onPress={onRestart}
                        testID="restart-game"
                        className="min-h-[96px] min-w-0 flex-1 items-center justify-center gap-3 rounded-2xl bg-canvas px-3 py-4 active:bg-accent-soft disabled:opacity-50">
                        <SymbolView
                          accessible={false}
                          accessibilityElementsHidden
                          importantForAccessibility="no-hide-descendants"
                          name={gameMenuActionIcons.restart}
                          size={22}
                          tintColor={theme.text}
                        />
                        <WelcomeText className="w-full text-center text-[13px] font-semibold leading-[20px]">
                          {busy ? gameMenuCopy.saving : isFinished ? gameUiCopy.playAgain : gameUiCopy.restart}
                        </WelcomeText>
                      </Pressable>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: busy }}
                      disabled={busy}
                      onPress={onHome}
                      testID="game-home"
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
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
