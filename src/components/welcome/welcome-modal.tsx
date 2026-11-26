import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/close-icon';
import { ScreenModal } from '@/components/screen-modal';
import { gameHistoryCopy } from '@/constants/game-history.constants';
import { startGameCopy, welcomeModalLayout } from '@/constants/welcome.constants';
import { useGameHistory } from '@/hooks/game-history-provider';
import type { WelcomeModalProps } from '@/types/welcome.types';

import { GameHistoryList } from './game-history-list';
import { MatchSetupForm } from './match-setup-form';
import { WelcomeText } from './welcome-text';

export function WelcomeModal({
  busy,
  error,
  hasUnfinishedGame,
  modal,
  draft,
  onChange,
  onClose,
  onStart,
}: WelcomeModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { games, isLoading, error: historyError, reloadHistory } = useGameHistory();
  const [displayedModal, setDisplayedModal] = useState(modal ?? 'history');

  // Keep the selected dialog content stable during its exit animation.
  if (modal !== null && modal !== displayedModal) {
    setDisplayedModal(modal);
  }

  const isSetup = displayedModal === 'setup';
  const availableHeight = Math.max(
    0,
    height - insets.top - insets.bottom - welcomeModalLayout.edgeSpacing * 2,
  );
  const modalHeight = Math.min(
    isSetup ? welcomeModalLayout.setupHeight : welcomeModalLayout.historyHeight,
    availableHeight,
  );

  const header = (
    <View className="shrink-0 flex-row items-center justify-between gap-3 border-b border-line px-6 pb-4 pt-5">
      <View className="flex-1 gap-1">
        <WelcomeText tone="accent-ink" className="text-[10px] font-bold tracking-[2px]">
          {isSetup ? 'A FEW LITTLE CHOICES' : gameHistoryCopy.kicker}
        </WelcomeText>
        <WelcomeText accessibilityRole="header" className="text-[25px] font-bold leading-[33px]">
          {isSetup ? 'Make it your match' : gameHistoryCopy.title}
        </WelcomeText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isSetup ? 'Cancel match setup' : gameHistoryCopy.closeLabel}
        onPress={onClose}
        disabled={busy}
        accessibilityState={{ disabled: busy }}
        testID="close-welcome-modal"
        className="h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-canvas active:opacity-60 disabled:opacity-50">
        <CloseIcon />
      </Pressable>
    </View>
  );

  const setupFooter = (
    <View className="mt-auto gap-3 border-t border-line px-6 pb-6 pt-4">
      {hasUnfinishedGame && (
        <WelcomeText tone="muted" className="text-center text-[11px] leading-[18px]">
          {startGameCopy.replacementNote}
        </WelcomeText>
      )}
      {error && (
        <WelcomeText accessibilityRole="alert" className="text-center text-[12px] leading-[20px]">
          {error}
        </WelcomeText>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={onStart}
        disabled={busy}
        accessibilityState={{ disabled: busy, busy }}
        testID="confirm-start-game"
        className="min-h-[54px] items-center justify-center rounded-[18px] bg-action px-5 py-4 active:opacity-75 disabled:opacity-50">
        <WelcomeText tone="white" className="text-[15px] font-semibold">
          {busy ? startGameCopy.startingLabel : startGameCopy.confirmLabel}
        </WelcomeText>
      </Pressable>
    </View>
  );

  return (
    <ScreenModal
      visible={modal !== null}
      onRequestClose={onClose}>
      <View
        className="flex-1 items-center justify-center"
        style={{
          paddingTop: insets.top + welcomeModalLayout.edgeSpacing,
          paddingBottom: insets.bottom + welcomeModalLayout.edgeSpacing,
          paddingLeft: insets.left + welcomeModalLayout.edgeSpacing,
          paddingRight: insets.right + welcomeModalLayout.edgeSpacing,
        }}>
        <Pressable
          accessible={false}
          focusable={false}
          importantForAccessibility="no-hide-descendants"
          onPress={onClose}
          disabled={busy}
          testID="dismiss-welcome-modal-backdrop"
          className="absolute inset-0 bg-black/60"
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          testID={isSetup ? 'match-setup-modal' : 'game-history-modal'}
          className="min-h-0 w-full max-w-[440px] overflow-hidden rounded-[28px] border border-line bg-surface"
          style={{ height: modalHeight }}>
          {isSetup ? (
            <ScrollView
              className="min-h-0 flex-1"
              contentContainerClassName="grow"
              contentInsetAdjustmentBehavior="never">
              {header}
              <MatchSetupForm draft={draft} onChange={onChange} busy={busy} />
              {setupFooter}
            </ScrollView>
          ) : (
            <>
              {header}
              <GameHistoryList
                games={games}
                isLoading={isLoading}
                error={historyError}
                onRetry={() => void reloadHistory()}
              />
            </>
          )}
        </View>
      </View>
    </ScreenModal>
  );
}
