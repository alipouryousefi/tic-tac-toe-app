import { Pressable, View } from 'react-native';

import { boardRows, gameUiCopy } from '@/constants/game-ui.constants';
import type { GameBoardProps } from '@/types/game-ui.types';

import { GameMark } from '@/components/welcome/game-mark';

export function GameBoard({ board, currentPlayer, winningLine, disabled, onPress }: GameBoardProps) {
  return (
    <View className="w-full max-w-[380px] self-center gap-[8px]" testID="game-board">
      {boardRows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-[8px]">
          {row.map((index, columnIndex) => {
            const mark = board[index];
            const isWinning = winningLine?.includes(index) ?? false;
            const cellDisabled = disabled || mark !== null;
            const cellStyle = isWinning
              ? mark === 'O' ? 'border-player-o bg-warm-soft' : 'border-accent bg-accent-soft'
              : 'border-line bg-surface';

            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={`Row ${rowIndex + 1}, column ${columnIndex + 1}, ${mark ?? gameUiCopy.emptyCell}`}
                accessibilityHint={cellDisabled ? undefined : `Place ${currentPlayer} in this square`}
                accessibilityState={{ disabled: cellDisabled }}
                disabled={cellDisabled}
                onPress={() => onPress(index)}
                testID={`game-cell-${index}`}
                className={`aspect-square min-h-[72px] flex-1 items-center justify-center rounded-[20px] border-2 active:opacity-70 ${cellStyle}`}>
                {mark && <GameMark mark={mark} size="medium" tone={mark === 'X' ? 'blue' : 'warm'} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
