import { navigateTo } from '../router';
import { settings, type ThemeId, type PlayerColor } from '../state';

// Theme-spezifische Datei-Pfade der Kartenmotive (Vorderseiten-Präfix + Rückseite).
// Die Dateinamen unterscheiden sich pro Theme, deshalb hier zentral gemappt.
const THEME_CARDS: Record<ThemeId, { prefix: string; back: string }> = {
  'code-vibes': {
    prefix: '/assets/cards/code-vibes/Code_Vibes_Card_',
    back: '/assets/cards/code-vibes/Code_Vibes_Card_back.png',
  },
  gaming: {
    prefix: '/assets/cards/gaming/Games_themes_Card_',
    back: '/assets/cards/gaming/Games_themes_Card_back.png',
  },
};

// Spaltenzahl je Spielfeldgröße (16 = 4×4, 24 = 6×4, 36 = 6×6).
const COLUMNS: Record<number, number> = { 16: 4, 24: 6, 36: 6 };

/** Mischt ein Array zufällig (Fisher-Yates) und gibt eine neue Reihenfolge zurück. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Baut das gemischte Deck: pro Motiv genau zwei Karten (z.B. 16 Karten → 8 Paare). */
function buildDeck(boardSize: number): number[] {
  const pairs = boardSize / 2;
  const motifs = Array.from({ length: pairs }, (_, i) => i + 1); // [1 … pairs]
  return shuffle([...motifs, ...motifs]);
}

/**
 * Rendert den Game-Screen: Header (Punkte, aktiver Spieler, Exit) + Spielfeld.
 * Aktuell noch statisch – die Flip-/Match-Logik kommt als nächster Schritt.
 */
export function renderGame(root: HTMLElement): void {
  const theme = settings.theme;
  const player: PlayerColor = settings.player ?? 'blue';
  const boardSize = settings.boardSize ?? 16;
  const cards = THEME_CARDS[theme];
  const columns = COLUMNS[boardSize] ?? 4;
  const headerBase = `/assets/header/${theme}`;

  const deck = buildDeck(boardSize);

  // Karten-Markup – alle verdeckt (Rückseite sichtbar), Vorderseite liegt im Flip dahinter.
  const cardsHtml = deck
    .map(
      (motif, index) => `
      <button class="card" type="button" data-index="${index}" data-motif="${motif}">
        <span class="card__inner">
          <span class="card__face card__face--back">
            <img src="${cards.back}" alt="" />
          </span>
          <span class="card__face card__face--front">
            <img src="${cards.prefix}${motif}.png" alt="" />
          </span>
        </span>
      </button>`,
    )
    .join('');

  root.innerHTML = `
    <section class="game" data-theme="${theme}">
      <header class="game__header">
        <!-- LINKS + MITTE zusammen in einem Container -->
        <div class="game__status">
        <!-- Punktestände -->
        <div class="game__scores">
          <span class="score" data-color="blue">
            <img src="${headerBase}/player-blue.png" alt="" />
            <span class="score__label">Blue</span>
            <b class="score__value" data-color="blue">0</b>
          </span>
          <span class="score" data-color="orange">
            <img src="${headerBase}/player-orange.png" alt="" />
            <span class="score__label">Orange</span>
            <b class="score__value" data-color="orange">0</b>
          </span>
        </div>

        <!-- Aktiver Spieler -->
        <div class="game__turn">
          <span>Current player:</span>
          <img class="game__turn-icon" src="${headerBase}/player-${player}.png" alt="${player}" />
        </div>
        </div>

        <!-- RECHTS: Exit -->
        <button class="game__exit" type="button">
          <img src="${headerBase}/exit.png" alt="" />
          <span>Exit game</span>
        </button>
      </header>

      <div class="game__board" style="--cols: ${columns}">
        ${cardsHtml}
      </div>
    </section>
  `;

  // Vorläufig: Klick dreht die Karte nur visuell um (Match-Logik kommt als Nächstes).
  root.querySelectorAll<HTMLButtonElement>('.card').forEach((card) => {
    card.addEventListener('click', () => card.classList.toggle('is-flipped'));
  });

  // Exit → vorerst zurück zu den Settings (Bestätigungs-Popup folgt später).
  root
    .querySelector<HTMLButtonElement>('.game__exit')
    ?.addEventListener('click', () => navigateTo('settings'));
}
