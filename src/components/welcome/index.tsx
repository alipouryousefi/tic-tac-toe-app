import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gameHistoryCopy } from '@/constants/game-history.constants';
import { startGameCopy } from '@/constants/welcome.constants';

import { ModeCard } from './mode-card';
import { ThemeToggle } from './theme-toggle';
import { useWelcome } from './use-welcome';
import { WelcomeHero } from './welcome-hero';
import { WelcomeModal } from './welcome-modal';
import { WelcomeText } from './welcome-text';

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedMode,
    selectMode,
    draft,
    modal,
    openSetup,
    openHistory,
    closeModal,
    updateDraft,
    startGame,
    onModalDismiss,
    canResume,
    resumeDescription,
    resumeGame,
    isLoading,
    isStarting,
    isBusy,
    error,
    reloadSession,
  } = useWelcome();

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
        }}>
        <View className="mx-auto w-full max-w-[440px] flex-1">
          <View className="mb-[8px] items-end">
            <ThemeToggle />
          </View>
          <View className="flex-1 justify-center py-[12px]">
            <WelcomeHero />
            <WelcomeText
              tone="muted"
              className="mt-[4px] text-center text-[10px] font-semibold tracking-[2.6px]">
              SMALL GAME. GOOD TIMES.
            </WelcomeText>
            <View className="mt-[15px]">
              <WelcomeText
                accessibilityRole="header"
                className="text-center text-[36px] font-bold leading-[44px] tracking-[-1.6px]">
                Got a minute?
              </WelcomeText>
              <WelcomeText
                tone="accent"
                className="text-center text-[36px] font-bold leading-[44px] tracking-[-1.6px]">
                Let’s play.
              </WelcomeText>
            </View>
            <WelcomeText
              tone="muted"
              className="mx-auto mt-[13px] max-w-[290px] text-center text-[13px] leading-[22px]">
              A familiar favorite, made for a quick break.{'\n'}Good company is optional.
            </WelcomeText>

            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Choose your opponent"
              className="mt-[20px] flex-row gap-[12px]">
              <ModeCard
                mode="friend"
                selected={selectedMode === 'friend'}
                onPress={() => selectMode('friend')}
              />
              <ModeCard
                mode="device"
                selected={selectedMode === 'device'}
                onPress={() => selectMode('device')}
              />
            </View>
            {error && modal === null && (
              <View className="mt-4 gap-2 rounded-[16px] border border-player-o/30 bg-warm-soft p-4">
                <WelcomeText accessibilityRole="alert" className="text-[12px] leading-[20px]">
                  {error}
                </WelcomeText>
                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={() => void reloadSession()}
                  className="min-h-[48px] items-center justify-center rounded-[12px] bg-surface px-3 py-2 disabled:opacity-50">
                  <WelcomeText className="text-[12px] font-semibold">{startGameCopy.retryLabel}</WelcomeText>
                </Pressable>
              </View>
            )}
            {canResume && (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy }}
                disabled={isBusy}
                onPress={resumeGame}
                testID="resume-game"
                className="mt-[20px] min-h-[64px] items-center justify-center gap-1 rounded-[18px] bg-action px-6 py-4 active:opacity-75 disabled:opacity-50">
                <WelcomeText tone="white" className="text-[15px] font-semibold">
                  {startGameCopy.resumeLabel}
                </WelcomeText>
                <WelcomeText tone="white" className="text-[11px] leading-[18px]">
                  {resumeDescription}
                </WelcomeText>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityHint={startGameCopy.openHint}
              onPress={openSetup}
              disabled={isBusy}
              accessibilityState={{ disabled: isBusy, busy: isLoading }}
              testID="open-match-setup"
              className={`mt-[20px] min-h-[56px] flex-row items-center justify-center gap-[14px] rounded-[18px] border px-[24px] py-[16px] active:opacity-75 disabled:opacity-50 ${canResume ? 'border-line bg-surface' : 'border-action bg-action'}`}>
              <WelcomeText tone={canResume ? 'ink' : 'white'} className="text-[15px] font-semibold leading-[22px]">
                {isLoading ? startGameCopy.loadingLabel : canResume ? startGameCopy.newGameLabel : startGameCopy.buttonLabel}
              </WelcomeText>
              <WelcomeText tone={canResume ? 'ink' : 'white'} accessible={false} className="text-[23px] leading-[24px]">
                →
              </WelcomeText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityHint={gameHistoryCopy.openHint}
              onPress={openHistory}
              testID="open-game-history"
              className="mt-[10px] min-h-[48px] items-center justify-center rounded-[16px] border border-line bg-surface px-[24px] py-[12px] active:bg-accent-soft">
              <WelcomeText className="text-[13px] font-semibold leading-[20px]">
                {gameHistoryCopy.title}
              </WelcomeText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <WelcomeModal
        busy={isStarting}
        error={error}
        hasUnfinishedGame={canResume}
        modal={modal}
        draft={draft}
        onChange={updateDraft}
        onClose={closeModal}
        onStart={startGame}
        onDismiss={onModalDismiss}
      />
    </View>
  );
}
