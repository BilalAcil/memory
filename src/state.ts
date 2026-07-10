// === Zentraler App-Zustand (State) ===
// Hier merkt sich die App die Auswahl aus den Settings.
// Der Game-Screen liest diese Werte später aus, um das richtige Spielfeld aufzubauen.

export type ThemeId = 'code-vibes' | 'gaming';
export type PlayerColor = 'blue' | 'orange';
export type BoardSize = 16 | 24 | 36;

export interface GameSettings {
  theme: ThemeId;               // gewähltes Layout/Theme (von Anfang an vorausgewählt)
  player: PlayerColor | null;   // Startspieler-Farbe — null = noch nicht gewählt
  boardSize: BoardSize | null;  // Anzahl Karten — null = noch nicht gewählt
}

// Startwerte: nur das Theme ist vorausgewählt, Spieler & Größe wählt der Nutzer.
export const settings: GameSettings = {
  theme: 'code-vibes',
  player: null,
  boardSize: null,
};

// === Ergebnis der letzten Partie ===
// Wird vom Game-Screen gesetzt (wenn alle Paare gefunden sind) und vom
// Game-Over-Screen gelesen: Punktestände, Gewinner und Verlierer.
export interface GameResult {
  scores: Record<PlayerColor, number>;
  winner: PlayerColor; // meiste Punkte (bei Gleichstand irrelevant, siehe isDraw)
  loser: PlayerColor;  // wenigste Punkte
  isDraw: boolean;     // true = Gleichstand (Draw-Frame statt Winner-Frame)
}

export let gameResult: GameResult | null = null;

export function setGameResult(result: GameResult): void {
  gameResult = result;
}
