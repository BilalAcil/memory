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
// Board-Layout je Spielfeldgröße: Spalten + Board-Maße + Gap (Figma-Werte).
const BOARD: Record<number, { cols: number; width: number; height: number; gap: number }> = {
  16: { cols: 4, width: 530, height: 530, gap: 16 },
  24: { cols: 6, width: 750, height: 500, gap: 6 },
  36: { cols: 6, width: 750, height: 750, gap: 6 },
};

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
  const board = BOARD[boardSize] ?? BOARD[16];

  // Führungs-Pills gibt es nur beim großen 36er-Board.
  const indicatorsHtml =
    boardSize === 36
      ? `<span class="game__col-indicator" aria-hidden="true"></span>
         <span class="game__row-indicator" aria-hidden="true"></span>`
      : '';
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
    <section class="game" data-theme="${theme}" data-current-player="${player}">
      <!-- Farbiger Cursor-Follower (folgt der Maus, Farbe = aktiver Spieler) -->
      <div class="game__cursor" aria-hidden="true"></div>

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

      <div class="game__board" style="--cols: ${board.cols}; --board-w: ${board.width}px; --board-h: ${board.height}px; --board-gap: ${board.gap}px">
        <!-- Führungs-Pills (nur bei 36 Karten): rutschen zur Spalte (oben) / Zeile (links) -->
        ${indicatorsHtml}
        ${cardsHtml}
      </div>
    </section>
  `;

  // --- Spielstand: aktueller Spieler + Punkte ---
  let currentPlayer: PlayerColor = player; // startet mit dem in den Settings gewählten Spieler
  const scores: Record<PlayerColor, number> = { blue: 0, orange: 0 };

  const section = root.querySelector<HTMLElement>('.game');
  const turnIcon = root.querySelector<HTMLImageElement>('.game__turn-icon');
  const scoreValue: Record<PlayerColor, HTMLElement | null> = {
    blue: root.querySelector('.score__value[data-color="blue"]'),
    orange: root.querySelector('.score__value[data-color="orange"]'),
  };

  /** Punkt für den aktuellen Spieler vergeben + Anzeige aktualisieren. */
  function addPoint(): void {
    scores[currentPlayer] += 1;
    const el = scoreValue[currentPlayer];
    if (el) el.textContent = String(scores[currentPlayer]);
  }

  /** Zum anderen Spieler wechseln + Indikator-Farbe und Cursor-Farbe umschalten. */
  function switchPlayer(): void {
    currentPlayer = currentPlayer === 'blue' ? 'orange' : 'blue';
    if (turnIcon) {
      turnIcon.src = `${headerBase}/player-${currentPlayer}.png`;
      turnIcon.alt = currentPlayer;
    }
    section?.setAttribute('data-current-player', currentPlayer); // steuert die Cursor-Farbe
  }

  // --- Farbiger Cursor-Follower: folgt der Maus über dem Spielfeld ---
  const cursor = root.querySelector<HTMLElement>('.game__cursor');
  if (section && cursor) {
    section.addEventListener('pointermove', (event) => {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    });
    section.addEventListener('pointerenter', () => cursor.classList.add('is-visible'));
    section.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  }

  // --- Aufdeck-/Match-Logik ---
  let firstCard: HTMLButtonElement | null = null; // erste aufgedeckte Karte (wartet auf die zweite)
  let lockBoard = false; // blockiert Klicks während Vergleich/Animation

  function handleCardClick(card: HTMLButtonElement): void {
    // Ignorieren, wenn gesperrt oder Karte schon offen/gefunden.
    if (lockBoard) return;
    if (card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;

    card.classList.add('is-flipped');

    // Erste Karte → merken, offen liegen lassen.
    if (!firstCard) {
      firstCard = card;
      return;
    }

    // Zweite Karte → vergleichen.
    const first = firstCard;
    const second = card;
    firstCard = null;
    lockBoard = true;

    if (first.dataset.motif === second.dataset.motif) {
      // Paar: Punkt für den aktuellen Spieler – er bleibt dran.
      addPoint();
      // Nach dem Flip kurz glänzen + abheben, dann offen liegen lassen.
      window.setTimeout(() => {
        first.classList.add('is-matched');
        second.classList.add('is-matched');
        lockBoard = false;
      }, 450);
    } else {
      // Kein Paar: nach kurzer Zeit beide wieder verdecken und Spieler wechseln.
      window.setTimeout(() => {
        first.classList.remove('is-flipped');
        second.classList.remove('is-flipped');
        switchPlayer();
        lockBoard = false;
      }, 900);
    }
  }

  // Führungs-Pills: zur Spalte (oben) bzw. Zeile (links) der gehoverten Karte gleiten.
  const colIndicator = root.querySelector<HTMLElement>('.game__col-indicator');
  const rowIndicator = root.querySelector<HTMLElement>('.game__row-indicator');

  root.querySelectorAll<HTMLButtonElement>('.card').forEach((card) => {
    card.addEventListener('click', () => handleCardClick(card));
    card.addEventListener('pointerenter', () => {
      // offsetLeft/Top sind relativ zum Board (position: relative) → Mittelpunkt der Karte.
      if (colIndicator) colIndicator.style.left = `${card.offsetLeft + card.offsetWidth / 2}px`;
      if (rowIndicator) rowIndicator.style.top = `${card.offsetTop + card.offsetHeight / 2}px`;
    });
  });

  // Exit → vorerst zurück zu den Settings (Bestätigungs-Popup folgt später).
  root
    .querySelector<HTMLButtonElement>('.game__exit')
    ?.addEventListener('click', () => navigateTo('settings'));
}
