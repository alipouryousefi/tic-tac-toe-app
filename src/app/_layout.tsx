import '@/global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { AppFonts } from '@/constants/fonts';
import { gamePageAnimations } from '@/constants/navigation.constants';
import { AppThemeProvider } from '@/hooks/app-theme-provider';
import { GameHistoryProvider } from '@/hooks/game-history-provider';
import { GameSessionProvider } from '@/hooks/game-session-provider';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 200, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(AppFonts);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hide();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppThemeProvider>
      <GameHistoryProvider>
        <GameSessionProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen
              name="game"
              options={{
                animation: reducedMotion
                  ? gamePageAnimations.reducedMotion
                  : gamePageAnimations.standard,
                animationDuration: gamePageAnimations.duration,
                fullScreenGestureEnabled: false,
              }}
            />
          </Stack>
        </GameSessionProvider>
      </GameHistoryProvider>
    </AppThemeProvider>
  );
}
