// Central app state: stores the selection made on the settings screen.
// The game screen later reads these values to build the correct board.

export type ThemeId = 'code-vibes' | 'gaming';
export type PlayerColor = 'blue' | 'orange';
export type BoardSize = 16 | 24 | 36;

/** User selection from the settings screen. */
export interface GameSettings {
  theme: ThemeId;
  player: PlayerColor | null;
  boardSize: BoardSize | null;
}

// Defaults: only the theme is pre-selected, the user picks player and size.
export const settings: GameSettings = {
  theme: 'code-vibes',
  player: null,
  boardSize: null,
};

/** Result of the last game: set by the game screen, read by the game-over screen. */
export interface GameResult {
  scores: Record<PlayerColor, number>;
  winner: PlayerColor;
  loser: PlayerColor;
  isDraw: boolean;
}

export let gameResult: GameResult | null = null;

/** Stores the result of the finished game for the game-over screen. */
export function setGameResult(result: GameResult): void {
  gameResult = result;
}
