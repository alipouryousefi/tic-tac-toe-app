import { useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameMark } from '@/components/welcome/game-mark';
import { WelcomeText } from '@/components/welcome/welcome-text';
import { deviceThinkDelay, gameMenuCopy, gameMenuIcon, gameUiCopy } from '@/constants/game-ui.constants';
import { difficultyLabels, playerMarks } from '@/constants/welcome.constants';
import { getCurrentPlayer, getGameOutcome } from '@/game/game.logic';
import { getGameResult } from '@/game/game-presentation';
import { useGameSession } from '@/hooks/game-session-provider';
import { useGameMenu } from '@/hooks/use-game-menu';
import { useTheme } from '@/hooks/use-theme';
import type { GameSession } from '@/types/game.types';
import type { PlayerMark } from '@/types/welcome.types';

import { GameBoard } from './game-board';
import { GameMenuModal } from './game-menu-modal';

function getStatus(session: GameSession, currentPlayer: PlayerMark) {
  if (session.setup.mode === 'friend') {
    return { title: `${currentPlayer}’s turn`, description: gameUiCopy.friendTurnHint };
  }

  if (currentPlayer !== session.setup.mark) {
    return { title: gameUiCopy.deviceTurn, description: gameUiCopy.deviceThinking };
  }

  return {
    title: gameUiCopy.yourTurn,
  };
}

export function GamePage() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const menu = useGameMenu();
  const {
    session,
    isLoading,
    isSaving,
    error,
    playMove,
    playDeviceMove,
    reloadSession,
  } = useGameSession();
  const outcome = session ? getGameOutcome(session.board) : null;
  const currentPlayer = session ? getCurrentPlayer(session.board) : 'X';
  const isDeviceTurn = session?.setup.mode === 'device'
    && outcome?.status === 'playing'
    && currentPlayer !== session.setup.mark;
  const isFinished = outcome !== null && outcome.status !== 'playing';
  const headerPlayer = isFinished ? currentPlayer === 'X' ? 'O' : 'X' : currentPlayer;
  const status = session ? getStatus(session, headerPlayer) : null;
  const result = useMemo(() => session ? getGameResult(session) : null, [session]);
  const modalVisible = !isLoading && !menu.isLeaving && (menu.isOpen || result !== null);
  const menuDisabled = menu.busy || menu.isLeaving || result !== null;

  useFocusEffect(useCallback(() => {
    if (!session || !isDeviceTurn || isLoading || isSaving || error || menu.isOpen || menu.isLeaving) {
      return;
    }

    const expectedSession = session;
    let focused = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function updateTimer() {
      clearTimeout(timer);

      if (AppState.currentState === 'active') {
        timer = setTimeout(() => {
          if (focused && AppState.currentState === 'active') {
            void playDeviceMove(expectedSession);
          }
        }, deviceThinkDelay);
      }
    }

    const subscription = AppState.addEventListener('change', updateTimer);
    updateTimer();

    return () => {
      focused = false;
      clearTimeout(timer);
      subscription.remove();
    };
  }, [session, isDeviceTurn, isLoading, isSaving, error, menu.isOpen, menu.isLeaving, playDeviceMove]));

  return (
    <View className="flex-1 bg-canvas" testID="game-screen">
      <ScrollView
        className="flex-1"
        accessibilityElementsHidden={modalVisible}
        importantForAccessibility={modalVisible ? 'no-hide-descendants' : 'auto'}
        contentContainerClassName="grow"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
        }}>
        <View className="mx-auto w-full max-w-[440px] flex-1">
          <View className="flex-row justify-end">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={gameMenuCopy.open}
              accessibilityState={{ disabled: menuDisabled, expanded: menu.isOpen }}
              disabled={menuDisabled}
              onPress={menu.open}
              testID="open-game-menu"
              className="h-[48px] w-[48px] items-center justify-center rounded-full border border-line bg-surface active:opacity-70 disabled:opacity-50">
              <SymbolView
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                name={gameMenuIcon}
                size={24}
                tintColor={theme.text}
              />
            </Pressable>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center gap-4 py-16">
              <ActivityIndicator color={theme.text} />
              <WelcomeText accessibilityRole="header" className="text-center text-[22px] font-bold">
                {gameUiCopy.loading}
              </WelcomeText>
              <WelcomeText tone="muted" className="text-center text-[13px] leading-[22px]">
                {gameUiCopy.loadingDescription}
              </WelcomeText>
            </View>
          ) : session && outcome && status ? (
            <View className="flex-1 justify-center py-6">
              <WelcomeText tone="muted" className="text-center text-[10px] font-semibold tracking-[2px]">
                {gameUiCopy.kicker}
              </WelcomeText>
              <WelcomeText tone="muted" className="mt-3 text-center text-[13px] leading-[22px]">
                {session.setup.mode === 'friend'
                  ? gameUiCopy.friendMode
                  : `${gameUiCopy.deviceMode} · ${difficultyLabels[session.setup.difficulty]}`}
              </WelcomeText>
              <View accessibilityLiveRegion="polite" className="mt-3 gap-2">
                <WelcomeText accessibilityRole="header" testID="game-status-title" className="text-center text-[32px] font-bold leading-[42px] tracking-[-1px]">
                  {status.title}
                </WelcomeText>
       
              </View>

              <View className="mb-5 mt-6 flex-row gap-3">
                {playerMarks.map((mark) => {
                  const active = outcome.status === 'playing' && currentPlayer === mark;
                  const label = session.setup.mode === 'friend'
                    ? `Player ${mark}`
                    : session.setup.mark === mark ? gameUiCopy.you : gameUiCopy.device;

                  return (
                    <View key={mark} className={`min-h-[64px] flex-1 flex-row flex-wrap content-center items-center justify-center gap-3 rounded-[18px] border px-3 py-3 ${active ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}>
                      <GameMark mark={mark} size="small" tone={mark === 'X' ? 'blue' : 'warm'} />
                      <WelcomeText className="text-center text-[13px] font-semibold leading-[24px]">{label}</WelcomeText>
                    </View>
                  );
                })}
              </View>

              <GameBoard
                board={session.board}
                currentPlayer={currentPlayer}
                winningLine={outcome.winningLine}
                disabled={isSaving || isDeviceTurn || isFinished || menu.isOpen || menu.isLeaving}
                onPress={(index) => { void playMove(index); }}
              />

              {error && (
                <View accessibilityRole="alert" className="mt-5 gap-3 rounded-[18px] border border-player-o/30 bg-warm-soft p-4">
                  <WelcomeText className="text-[13px] leading-[22px]">{error}</WelcomeText>
                  <Pressable accessibilityRole="button" disabled={isSaving} onPress={() => { void reloadSession(); }} className="min-h-[48px] items-center justify-center rounded-[12px] bg-surface px-4 py-3 active:opacity-70">
                    <WelcomeText className="text-[13px] font-semibold">{gameUiCopy.retry}</WelcomeText>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <View className="flex-1 justify-center gap-4 py-16">
              <WelcomeText accessibilityRole="header" className="text-center text-[26px] font-bold leading-[35px]">
                {error ? gameUiCopy.loadError : gameUiCopy.noSession}
              </WelcomeText>
              <WelcomeText tone="muted" className="text-center text-[13px] leading-[22px]">
                {error ?? gameUiCopy.noSessionDescription}
              </WelcomeText>
              {error && (
                <Pressable accessibilityRole="button" onPress={() => { void reloadSession(); }} testID="retry-load-game" className="min-h-[54px] items-center justify-center rounded-[18px] bg-action px-5 py-4 active:opacity-70">
                  <WelcomeText tone="white" className="text-[15px] font-semibold">{gameUiCopy.retry}</WelcomeText>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <GameMenuModal
        visible={modalVisible}
        busy={menu.busy}
        canRestart={session !== null && !isLoading}
        isFinished={isFinished}
        error={error}
        result={result}
        onClose={menu.close}
        onHome={menu.goHome}
        onRestart={() => { void menu.restart(); }}
      />
    </View>
  );
}
