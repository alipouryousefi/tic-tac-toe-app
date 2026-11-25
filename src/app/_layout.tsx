import '@/global.css';

import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppFonts } from '@/constants/fonts';
import { gamePageAnimations } from '@/constants/navigation.constants';
import { GameHistoryProvider } from '@/hooks/game-history-provider';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 200, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(AppFonts);
  const colorScheme = useColorScheme();
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GameHistoryProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="game"
            options={{
              animation: reducedMotion
                ? gamePageAnimations.reducedMotion
                : gamePageAnimations.standard,
              animationMatchesGesture: true,
            }}
          />
        </Stack>
      </GameHistoryProvider>
    </ThemeProvider>
  );
}
