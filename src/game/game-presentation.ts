import { gameUiCopy } from '@/constants/game-ui.constants';
import type { GameResultDetails } from '@/types/game-ui.types';
import type { GameSession } from '@/types/game.types';

import { getGameOutcome } from './game.logic';

export function getGameResult(session: GameSession): GameResultDetails | null {
  const outcome = getGameOutcome(session.board);

  if (outcome.status === 'playing') {
    return null;
  }

  if (outcome.status === 'draw') {
    return { kind: 'draw', title: gameUiCopy.draw };
  }

  if (session.setup.mode === 'friend') {
    return { kind: 'win', title: `${outcome.winner} wins!` };
  }

  return outcome.winner === session.setup.mark
    ? { kind: 'win', title: gameUiCopy.youWon }
    : { kind: 'loss', title: gameUiCopy.youLost };
}
