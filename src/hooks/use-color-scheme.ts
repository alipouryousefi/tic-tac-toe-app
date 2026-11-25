import { useAppTheme } from '@/hooks/app-theme-provider';

export function useColorScheme() {
  return useAppTheme().colorScheme;
}
