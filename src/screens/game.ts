import { navigateTo } from '../router';
import { settings, setGameResult, type ThemeId, type PlayerColor } from '../state';

// Theme-spezifische Datei-Pfade der Kartenmotive (Vorderseiten-Präfix + Rückseite).
// Die Dateinamen unterscheiden sich pro Theme, deshalb hier zentral gemappt.
const THEME_CARDS: Record<ThemeId, { prefix: string; back: string }> = {
  'code-vibes': {
    prefix: '/assets/cards/code-vibes/Code_Vibes_Card_',
    back: '/assets/cards/code-vibes/Code_Vibes_Card_back.png',
  },
  gaming: {
    prefix: '/assets/cards/gaming/k',
    back: '/assets/cards/gaming/back-site.png',
  },
};

// Spaltenzahl je Spielfeldgröße (16 = 4×4, 24 = 6×4, 36 = 6×6).
// Board-Layout je Spielfeldgröße: Spalten + Board-Maße + Gap (Figma-Werte).
const BOARD: Record<number, { cols: number; width: number; height: number; gap: number }> = {
  16: { cols: 4, width: 530, height: 530, gap: 16 },
  24: { cols: 6, width: 750, height: 500, gap: 6 },
  36: { cols: 6, width: 750, height: 750, gap: 6 },
};

// Gaming-Theme: schmalere Karten (105px) → eigene Board-Maße (vorerst nur 16).
const GAMING_BOARD: Record<number, { cols: number; width: number; height: number; gap: number }> = {
  16: { cols: 4, width: 468, height: 528, gap: 16 },
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
  document.body.dataset.theme = theme; // Theme am body, damit der Frame-Hintergrund mitfärbt
  const player: PlayerColor = settings.player ?? 'blue';
  const boardSize = settings.boardSize ?? 16;
  const cards = THEME_CARDS[theme];
  const board =
    (theme === 'gaming' ? GAMING_BOARD[boardSize] : undefined) ?? BOARD[boardSize] ?? BOARD[16];

  // Führungs-Pills gibt es nur beim großen 36er-Board.
  const indicatorsHtml =
    boardSize === 36
      ? `<span class="game__col-indicator" aria-hidden="true"></span>
         <span class="game__row-indicator" aria-hidden="true"></span>`
      : '';
  const headerBase = `/assets/header/${theme}`;

  // Quelle des "Current player"-Icons: im Gaming-Theme ein weißer Bauer (die
  // Spielerfarbe kommt vom Hintergrund), sonst das farbige Header-PNG je Spieler.
  const turnIconSrc = (p: PlayerColor): string =>
    theme === 'gaming' ? '/assets/icons/chess_pawn-White.svg' : `${headerBase}/player-${p}.png`;

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

      <!-- Glanz bei einem Paar: zieht diagonal in der Spielerfarbe über die Section -->
      <div class="game__flash" aria-hidden="true"></div>

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
          <img class="game__turn-icon" src="${turnIconSrc(player)}" alt="${player}" />
        </div>
        </div>

        <!-- RECHTS: Exit -->
        <button class="game__exit" type="button">
          <img class="game__exit-icon game__exit-icon--default" src="${headerBase}/exit.png" alt="" />
          <img class="game__exit-icon game__exit-icon--hover" src="/assets/icons/move_item_2.png" alt="" />
          <span>Exit game</span>
        </button>
      </header>

      <div class="game__board" style="--cols: ${board.cols}; --board-w: ${board.width}px; --board-h: ${board.height}px; --board-gap: ${board.gap}px">
        <!-- Führungs-Pills (nur bei 36 Karten): rutschen zur Spalte (oben) / Zeile (links) -->
        ${indicatorsHtml}
        ${cardsHtml}
      </div>

      <!-- Exit-Bestätigung (erscheint beim Klick auf "Exit game") -->
      <div class="game__modal" aria-hidden="true">
        <div class="game__dialog" role="dialog" aria-modal="true" aria-labelledby="quit-title">
          <h2 class="game__dialog-title" id="quit-title">Are you sure you want to quit the game?</h2>
          <div class="game__dialog-actions">
            <button class="game__dialog-btn game__dialog-btn--stay" type="button">${theme === 'gaming' ? 'No, back to game' : 'Back to game'}</button>
            <button class="game__dialog-btn game__dialog-btn--leave" type="button">${theme === 'gaming' ? 'Yes, quit game' : 'Exit game'}</button>
          </div>
        </div>
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

  /** Punkt für einen bestimmten Spieler vergeben + Anzeige aktualisieren. */
  function addPoint(color: PlayerColor): void {
    scores[color] += 1;
    const el = scoreValue[color];
    if (el) el.textContent = String(scores[color]);
  }

  /** Zum anderen Spieler wechseln + Indikator-Farbe und Cursor-Farbe umschalten. */
  function switchPlayer(): void {
    currentPlayer = currentPlayer === 'blue' ? 'orange' : 'blue';
    if (turnIcon) {
      turnIcon.src = turnIconSrc(currentPlayer);
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

    // Über Header und Spielfeld verschwindet der farbige Punkt (dort gilt der native Cursor).
    [root.querySelector<HTMLElement>('.game__header'), root.querySelector<HTMLElement>('.game__board')]
      .forEach((zone) => {
        zone?.addEventListener('pointerenter', () => cursor.classList.remove('is-visible'));
        zone?.addEventListener('pointerleave', () => cursor.classList.add('is-visible'));
      });
  }

  // --- Glanz-Effekt: diagonaler Lichtstreifen in Spielerfarbe über die ganze Section ---
  const flash = root.querySelector<HTMLElement>('.game__flash');

  /** Spielt den Glanz einmal ab; das Promise löst sich, wenn die Animation vorbei ist. */
  function playFlash(): Promise<void> {
    return new Promise((resolve) => {
      if (!flash) {
        resolve();
        return;
      }
      flash.classList.remove('is-active');
      void flash.offsetWidth; // Reflow → Animation lässt sich neu starten
      flash.classList.add('is-active');
      flash.addEventListener(
        'animationend',
        () => {
          flash.classList.remove('is-active');
          resolve();
        },
        { once: true },
      );
    });
  }

  // --- Aufdeck-/Match-Logik ---
  let firstCard: HTMLButtonElement | null = null; // erste aufgedeckte Karte (wartet auf die zweite)
  let lockBoard = false; // blockiert Klicks während Vergleich/Animation
  let matchedPairs = 0; // Anzahl bereits gefundener Paare
  const totalPairs = boardSize / 2; // Spielende, wenn alle gefunden sind

  /** Ende der Partie: Gewinner/Verlierer bestimmen und zum Game-Over wechseln. */
  function endGame(): void {
    const isDraw = scores.blue === scores.orange; // Gleichstand → Draw-Frame
    const winner: PlayerColor = scores.blue >= scores.orange ? 'blue' : 'orange';
    const loser: PlayerColor = winner === 'blue' ? 'orange' : 'blue';
    setGameResult({ scores: { ...scores }, winner, loser, isDraw });
    navigateTo('gameover');
  }

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

    if (first.dataset.motif === second.dataset.motif) {
      // Paar gefunden – der Spieler bleibt dran und kann SOFORT die nächste Karte
      // aufdecken. Die Effekte (Sprung, Ausblenden, Glanz) und der Punkt laufen
      // asynchron im Hintergrund weiter, ohne das Brett zu sperren.
      const scoringPlayer = currentPlayer; // wem der Punkt gehört – bleibt fix, auch bei schnellem Weiterspielen
      matchedPairs += 1;
      const isLastPair = matchedPairs === totalPairs;
      if (isLastPair) lockBoard = true; // letztes Paar: bis zum Game-Over gesperrt lassen

      window.setTimeout(() => {
        // 1. Karten springen kurz + blenden auf 0.1 aus.
        first.classList.add('is-matched');
        second.classList.add('is-matched');
        // 2. Nach Sprung (650ms) + Ausblenden (300ms) den Glanz diagonal über die Section ziehen.
        window.setTimeout(() => {
          playFlash().then(() => {
            // 3. Erst nach dem Glanz den Punkt vergeben (immer dem richtigen Spieler).
            addPoint(scoringPlayer);
            // Alle Paare gefunden → Partie beenden.
            if (isLastPair) endGame();
          });
        }, 950);
      }, 450);
    } else {
      // Kein Paar: Brett sperren, nach kurzer Zeit beide wieder verdecken und Spieler wechseln.
      lockBoard = true;
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

  // --- Exit-Bestätigung: Popup öffnen/schließen ---
  const modal = root.querySelector<HTMLElement>('.game__modal');

  function openModal(): void {
    modal?.classList.add('is-open');
    section?.classList.add('is-modal-open'); // Cursor-Punkt aus, nativer Cursor an
  }

  function closeModal(): void {
    if (!modal) return;
    // Erst die Herausfahr-Animation abspielen, dann tatsächlich ausblenden.
    modal.classList.add('is-closing');
    const dialog = modal.querySelector<HTMLElement>('.game__dialog');
    const finish = (): void => {
      modal.classList.remove('is-open', 'is-closing');
      section?.classList.remove('is-modal-open');
    };
    if (dialog) {
      dialog.addEventListener('animationend', finish, { once: true });
    } else {
      finish();
    }
  }

  root.querySelector<HTMLButtonElement>('.game__exit')?.addEventListener('click', openModal);
  // "Back to game" → Popup schließen, weiterspielen.
  root.querySelector<HTMLButtonElement>('.game__dialog-btn--stay')?.addEventListener('click', closeModal);
  // "Exit game" → zurück zu den Settings.
  root
    .querySelector<HTMLButtonElement>('.game__dialog-btn--leave')
    ?.addEventListener('click', () => navigateTo('settings'));
  // Klick auf den abgedunkelten Hintergrund schließt ebenfalls.
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  // --- Abkürzung für die Abgabe/Demo ---
  // Klick auf das Spieler-Icon deckt alle Karten auf und springt zum Game-Over,
  // damit man den Endscreen ansehen kann, ohne durchspielen zu müssen.
  turnIcon?.addEventListener('click', () => {
    if (lockBoard) return;
    lockBoard = true;
    const allCards = root.querySelectorAll<HTMLButtonElement>('.card');
    allCards.forEach((card) => card.classList.add('is-flipped')); // alle aufdecken
    window.setTimeout(() => {
      allCards.forEach((card) => card.classList.add('is-matched')); // Match-Effekt
      window.setTimeout(endGame, 700); // danach Game-Over anzeigen
    }, 700);
  });
}
