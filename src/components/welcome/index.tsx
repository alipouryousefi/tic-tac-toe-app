import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gameHistoryCopy } from '@/constants/game-history.constants';
import { difficultyLabels, startGameCopy } from '@/constants/welcome.constants';

import { ModeCard } from './mode-card';
import { useWelcome } from './use-welcome';
import { WelcomeHero } from './welcome-hero';
import { WelcomeModal } from './welcome-modal';
import { WelcomeText } from './welcome-text';

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    savedSetup,
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


            <Pressable
              accessibilityRole="button"
              accessibilityHint={startGameCopy.openHint}
              onPress={openSetup}
              testID="open-match-setup"
              className="mt-[20px] min-h-[56px] flex-row items-center justify-center gap-[14px] rounded-[18px] bg-action px-[24px] py-[16px] active:opacity-75">
              <WelcomeText tone="white" className="text-[15px] font-semibold leading-[22px]">
                {startGameCopy.buttonLabel}
              </WelcomeText>
              <WelcomeText tone="white" accessible={false} className="text-[23px] leading-[24px]">
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
