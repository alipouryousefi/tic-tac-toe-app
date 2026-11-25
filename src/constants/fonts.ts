import type { FontFamilyDefinition } from 'expo-font';

export const AppFontFamily = 'Plus Jakarta Sans';

export const AppFonts: FontFamilyDefinition[] = [
  {
    fontFamily: AppFontFamily,
    fontDefinitions: [
      {
        path: require('@/assets/fonts/PlusJakartaSans-Regular.ttf'),
        weight: 400,
        style: 'normal',
      },
      {
        path: require('@/assets/fonts/PlusJakartaSans-Medium.ttf'),
        weight: 500,
        style: 'normal',
      },
      {
        path: require('@/assets/fonts/PlusJakartaSans-SemiBold.ttf'),
        weight: 600,
        style: 'normal',
      },
      {
        path: require('@/assets/fonts/PlusJakartaSans-Bold.ttf'),
        weight: 700,
        style: 'normal',
      },
    ],
  },
];
