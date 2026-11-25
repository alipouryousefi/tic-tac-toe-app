import type { TextProps, ViewProps } from 'react-native';

import type { Colors } from '@/constants/theme';

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};
