import { FlatList, View } from 'react-native';

import { gameHistoryCopy, gameHistoryDateOptions } from '@/constants/game-history.constants';
import { difficultyLabels } from '@/constants/welcome.constants';
import type { GameHistoryEntry, GameHistoryListProps } from '@/types/game-history.types';

import { GameMark } from './game-mark';
import { WelcomeText } from './welcome-text';

function getResultLabel({ winner, setup }: GameHistoryEntry) {
  if (winner === null) {
    return gameHistoryCopy.results.draw;
  }

  if (setup.mode === 'friend') {
    return `${winner} won`;
  }

  return winner === setup.mark ? gameHistoryCopy.results.win : gameHistoryCopy.results.loss;
}

export function GameHistoryList({ games, header, footer }: GameHistoryListProps) {
  return (
    <View className="min-h-0 flex-1">
      <FlatList
        className="min-h-0 flex-1"
        contentContainerClassName="grow"
        contentInsetAdjustmentBehavior="never"
        data={games}
        keyExtractor={(game) => game.id}
        ListHeaderComponent={header}
        testID="game-history-list"
        ListEmptyComponent={
          <View className="min-h-[260px] items-center justify-center px-6 py-10" testID="empty-game-history">
            <View className="mb-5 flex-row items-center gap-3 rounded-[24px] bg-accent-soft p-5">
              <GameMark mark="X" size="small" />
              <GameMark mark="O" size="small" tone="warm" />
            </View>
            <WelcomeText accessibilityRole="header" className="text-center text-[18px] font-semibold">
              {gameHistoryCopy.emptyTitle}
            </WelcomeText>
            <WelcomeText tone="muted" className="mt-2 max-w-[260px] text-center text-[13px] leading-[22px]">
              {gameHistoryCopy.emptyDescription}
            </WelcomeText>
          </View>
        }
        renderItem={({ item: game }) => {
          const result = getResultLabel(game);

          return (
            <View className="mx-6 border-b border-line py-4" testID={`history-game-${game.id}`}>
              <View className="flex-row items-start gap-3">
                <View className="h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-canvas">
                  <GameMark mark={game.setup.mark} size="small" tone={game.setup.mark === 'X' ? 'blue' : 'warm'} />
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <WelcomeText className="text-[14px] font-semibold">
                      {gameHistoryCopy.opponents[game.setup.mode]}
                    </WelcomeText>
                    <View className="rounded-full border border-line bg-canvas px-3 py-1">
                      <WelcomeText className="text-[11px] font-semibold">{result}</WelcomeText>
                    </View>
                  </View>
                  <WelcomeText tone="muted" className="text-[12px] leading-[20px]">
                    {game.setup.mode === 'device' && `${difficultyLabels[game.setup.difficulty]} · `}
                    {gameHistoryCopy.playedAs} {game.setup.mark}
                  </WelcomeText>
                  <WelcomeText tone="muted" className="text-[11px] leading-[18px]">
                    {new Date(game.completedAt).toLocaleString(undefined, gameHistoryDateOptions)}
                  </WelcomeText>
                </View>
              </View>
            </View>
          );
        }}
      />
      {footer}
    </View>
  );
}
