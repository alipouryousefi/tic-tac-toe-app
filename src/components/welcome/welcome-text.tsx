import { Text } from 'react-native';

import { welcomeTextTones } from '@/constants/welcome-styles.constants';
import type { WelcomeTextProps } from '@/types/welcome.types';

export function WelcomeText({ className = '', tone = 'ink', ...props }: WelcomeTextProps) {
  return <Text className={`font-sans ${welcomeTextTones[tone]} ${className}`} {...props} />;
}
