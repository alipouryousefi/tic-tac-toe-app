import { Pressable, View } from 'react-native';

import {
  difficulties,
  difficultyLabels,
  playModes,
  playerMarks,
} from '@/constants/welcome.constants';
import type { MatchSetupFormProps } from '@/types/welcome.types';

import { GameMark } from './game-mark';
import { WelcomeText } from './welcome-text';

export function MatchSetupForm({ draft, onChange }: MatchSetupFormProps) {
  const firstPlayer = draft.mark === 'X' ? 'You make the first move.' :
    draft.mode === 'friend' ? 'Your friend makes the first move.' : 'The device makes the first move.';

  return (
    <View className="gap-7 px-6 py-6">
      <View className="gap-3" accessibilityRole="radiogroup" accessibilityLabel="Choose your opponent">
        <WelcomeText className="text-[15px] font-semibold">Who are you playing?</WelcomeText>
        {playModes.map((mode) => {
          const selected = draft.mode === mode.value;

          return (
            <Pressable
              key={mode.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${mode.title}. ${mode.description}`}
              onPress={() => onChange({ ...draft, mode: mode.value })}
              testID={`setup-mode-${mode.value}`}
              className={`min-h-[78px] flex-row items-center justify-between gap-4 rounded-[20px] border p-4 active:opacity-70 ${selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}>
              <View className="flex-1 gap-1">
                <WelcomeText className="text-[15px] font-semibold">{mode.title}</WelcomeText>
                <WelcomeText tone="muted" className="text-[12px] leading-[19px]">{mode.description}</WelcomeText>
              </View>
              <View className={`h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${selected ? 'border-accent' : 'border-line'}`}>
                {selected && <View className="h-[10px] w-[10px] rounded-full bg-accent" />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-3" accessibilityRole="radiogroup" accessibilityLabel="Choose your mark">
        <View className="gap-1">
          <WelcomeText className="text-[15px] font-semibold">Pick your side</WelcomeText>
          <WelcomeText tone="muted" className="text-[12px] leading-[20px]">X always goes first. {firstPlayer}</WelcomeText>
        </View>
        <View className="flex-row gap-3">
          {playerMarks.map((mark) => (
            <Pressable
              key={mark}
              accessibilityRole="radio"
              accessibilityLabel={`Play as ${mark}`}
              accessibilityState={{ checked: draft.mark === mark }}
              onPress={() => onChange({ ...draft, mark })}
              testID={`setup-mark-${mark.toLowerCase()}`}
              className={`min-h-[92px] flex-1 items-center justify-center gap-2 rounded-[20px] border py-4 active:opacity-70 ${draft.mark === mark ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}>
              <GameMark mark={mark} size="small" tone={mark === 'X' ? 'blue' : 'warm'} />
              <WelcomeText tone="muted" className="text-[11px] font-medium">{mark === 'X' ? 'The first move' : 'The next move'}</WelcomeText>
            </Pressable>
          ))}
        </View>
      </View>

      {draft.mode === 'device' && (
        <View className="gap-3" accessibilityRole="radiogroup" accessibilityLabel="Choose device difficulty">
          <WelcomeText className="text-[15px] font-semibold">Choose your challenge</WelcomeText>
          <View className="flex-row flex-wrap gap-2">
            {difficulties.map((difficulty) => (
              <Pressable
                key={difficulty}
                accessibilityRole="radio"
                accessibilityLabel={`${difficultyLabels[difficulty]} difficulty`}
                accessibilityState={{ checked: draft.difficulty === difficulty }}
                onPress={() => onChange({ ...draft, difficulty })}
                testID={`setup-difficulty-${difficulty}`}
                className={`min-h-[48px] grow items-center justify-center rounded-[16px] border px-4 py-3 active:opacity-70 ${draft.difficulty === difficulty ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}>
                <WelcomeText className="text-[13px] font-semibold">{difficultyLabels[difficulty]}</WelcomeText>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
