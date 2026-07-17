import { navigateTo } from '../router';
import { settings, setGameResult, type ThemeId, type PlayerColor } from '../state';

/** Front-face prefix and back-face path of a theme's card motifs. */
interface CardSet {
  prefix: string;
  back: string;
}

/** Board dimensions for a given card count (Figma values). */
interface BoardDims {
  cols: number;
  width: number;
  height: number;
  gap: number;
}

/** Immutable configuration derived from the settings before rendering. */
interface GameConfig {
  theme: ThemeId;
  player: PlayerColor;
  boardSize: number;
  cards: CardSet;
  board: BoardDims;
  headerBase: string;
  deck: number[];
}

/** Mutable game state plus DOM references, shared across all handlers. */
interface GameContext {
  root: HTMLElement;
  section: HTMLElement | null;
  theme: ThemeId;
  headerBase: string;
  turnIcon: HTMLImageElement | null;
  scoreValue: Record<PlayerColor, HTMLElement | null>;
  flash: HTMLElement | null;
  currentPlayer: PlayerColor;
  scores: Record<PlayerColor, number>;
  firstCard: HTMLButtonElement | null;
  lockBoard: boolean;
  matchedPairs: number;
  totalPairs: number;
}

// Theme-specific card paths (file names differ per theme).
const THEME_CARDS: Record<ThemeId, CardSet> = {
  'code-vibes': {
    prefix: '/assets/cards/code-vibes/Code_Vibes_Card_',
    back: '/assets/cards/code-vibes/Code_Vibes_Card_back.png',
  },
  gaming: {
    prefix: '/assets/cards/gaming/k',
    back: '/assets/cards/gaming/back-site.png',
  },
};

// Board layout per card count (16 = 4x4, 24 = 6x4, 36 = 6x6).
const BOARD: Record<number, BoardDims> = {
  16: { cols: 4, width: 530, height: 530, gap: 16 },
  24: { cols: 6, width: 750, height: 500, gap: 6 },
  36: { cols: 6, width: 750, height: 750, gap: 6 },
};

// Gaming theme uses narrower cards, so it needs its own board dimensions.
const GAMING_BOARD: Record<number, BoardDims> = {
  16: { cols: 4, width: 468, height: 528, gap: 16 },
};

/** Renders the game screen: header, board and exit dialog, then wires them up. */
export function renderGame(root: HTMLElement): void {
  const config = resolveConfig();
  document.body.dataset.theme = config.theme;
  root.innerHTML = gameMarkup(config);
  const ctx = createContext(root, config);
  setupCursor(ctx);
  setupBoard(ctx);
  setupModal(ctx);
  setupDemoShortcut(ctx);
}

/** Gathers theme, player, board and a shuffled deck from the settings. */
function resolveConfig(): GameConfig {
  const theme = settings.theme;
  const player: PlayerColor = settings.player ?? 'blue';
  const boardSize = settings.boardSize ?? 16;
  return {
    theme,
    player,
    boardSize,
    cards: THEME_CARDS[theme],
    board: resolveBoard(theme, boardSize),
    headerBase: `/assets/header/${theme}`,
    deck: buildDeck(boardSize),
  };
}

/** Picks the board dimensions, preferring gaming-specific ones when present. */
function resolveBoard(theme: ThemeId, boardSize: number): BoardDims {
  return (theme === 'gaming' ? GAMING_BOARD[boardSize] : undefined) ?? BOARD[boardSize] ?? BOARD[16];
}

/** Source of the "current player" icon (white pawn in gaming, colored PNG otherwise). */
function turnIconSrc(theme: ThemeId, headerBase: string, player: PlayerColor): string {
  return theme === 'gaming' ? '/assets/icons/chess_pawn-White.svg' : `${headerBase}/player-${player}.png`;
}

/** Shuffles an array in place (Fisher-Yates) and returns a new order. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Builds the shuffled deck: two cards per motif (16 cards = 8 pairs). */
function buildDeck(boardSize: number): number[] {
  const pairs = boardSize / 2;
  const motifs = Array.from({ length: pairs }, (_, i) => i + 1);
  return shuffle([...motifs, ...motifs]);
}

/** Creates the mutable context with all DOM references the handlers need. */
function createContext(root: HTMLElement, config: GameConfig): GameContext {
  return {
    root,
    section: root.querySelector<HTMLElement>('.game'),
    theme: config.theme,
    headerBase: config.headerBase,
    turnIcon: root.querySelector<HTMLImageElement>('.game__turn-icon'),
    scoreValue: queryScoreValues(root),
    flash: root.querySelector<HTMLElement>('.game__flash'),
    currentPlayer: config.player,
    scores: { blue: 0, orange: 0 },
    firstCard: null,
    lockBoard: false,
    matchedPairs: 0,
    totalPairs: config.boardSize / 2,
  };
}

/** Looks up both score value elements. */
function queryScoreValues(root: HTMLElement): Record<PlayerColor, HTMLElement | null> {
  return {
    blue: root.querySelector('.score__value[data-color="blue"]'),
    orange: root.querySelector('.score__value[data-color="orange"]'),
  };
}

/** Builds the full game markup (cursor, flash, header, board, dialog). */
function gameMarkup(config: GameConfig): string {
  const turnSrc = turnIconSrc(config.theme, config.headerBase, config.player);
  return `
    <section class="game" data-theme="${config.theme}" data-current-player="${config.player}">
      <div class="game__cursor" aria-hidden="true"></div>
      <div class="game__flash" aria-hidden="true"></div>
      ${headerMarkup(config, turnSrc)}
      ${boardMarkup(config)}
      ${modalMarkup(config.theme)}
    </section>
  `;
}

/** Builds the header: scores, current player and exit button. */
function headerMarkup(config: GameConfig, turnSrc: string): string {
  return `
    <header class="game__header">
      <div class="game__status">
        ${scoresMarkup(config.headerBase)}
        <div class="game__turn">
          <span>Current player:</span>
          <img class="game__turn-icon" src="${turnSrc}" alt="${config.player}" />
        </div>
      </div>
      ${exitButtonMarkup(config.headerBase)}
    </header>`;
}

/** Builds both player score displays. */
function scoresMarkup(headerBase: string): string {
  return `
    <div class="game__scores">
      ${scoreMarkup(headerBase, 'blue', 'Blue')}
      ${scoreMarkup(headerBase, 'orange', 'Orange')}
    </div>`;
}

/** Builds a single player score display. */
function scoreMarkup(headerBase: string, color: PlayerColor, label: string): string {
  return `
    <span class="score" data-color="${color}">
      <img src="${headerBase}/player-${color}.png" alt="" />
      <span class="score__label">${label}</span>
      <b class="score__value" data-color="${color}">0</b>
    </span>`;
}

/** Builds the exit button with default and hover icons. */
function exitButtonMarkup(headerBase: string): string {
  return `
    <button class="game__exit" type="button">
      <img class="game__exit-icon game__exit-icon--default" src="${headerBase}/exit.png" alt="" />
      <img class="game__exit-icon game__exit-icon--hover" src="/assets/icons/move_item_2.png" alt="" />
      <span>Exit game</span>
    </button>`;
}

/** Builds the board container with guide indicators and all cards. */
function boardMarkup(config: GameConfig): string {
  const { board } = config;
  const style = `--cols: ${board.cols}; --board-w: ${board.width}px; --board-h: ${board.height}px; --board-gap: ${board.gap}px`;
  return `
    <div class="game__board" style="${style}">
      ${indicatorsMarkup(config.boardSize)}
      ${cardsMarkup(config.deck, config.cards)}
    </div>`;
}

/** Guide pills exist only on the large 36-card board. */
function indicatorsMarkup(boardSize: number): string {
  if (boardSize !== 36) return '';
  return `
    <span class="game__col-indicator" aria-hidden="true"></span>
    <span class="game__row-indicator" aria-hidden="true"></span>`;
}

/** Builds the markup for the whole deck. */
function cardsMarkup(deck: number[], cards: CardSet): string {
  return deck.map((motif, index) => cardMarkup(cards, motif, index)).join('');
}

/** Builds a single face-down card (back visible, front behind the flip). */
function cardMarkup(cards: CardSet, motif: number, index: number): string {
  return `
    <button class="card" type="button" data-index="${index}" data-motif="${motif}">
      <span class="card__inner">
        <span class="card__face card__face--back"><img src="${cards.back}" alt="" /></span>
        <span class="card__face card__face--front"><img src="${cards.prefix}${motif}.png" alt="" /></span>
      </span>
    </button>`;
}

/** Builds the exit confirmation dialog (labels differ per theme). */
function modalMarkup(theme: ThemeId): string {
  const stay = theme === 'gaming' ? 'No, back to game' : 'Back to game';
  const leave = theme === 'gaming' ? 'Yes, quit game' : 'Exit game';
  return `
    <div class="game__modal" aria-hidden="true">
      <div class="game__dialog" role="dialog" aria-modal="true" aria-labelledby="quit-title">
        <h2 class="game__dialog-title" id="quit-title">Are you sure you want to quit the game?</h2>
        <div class="game__dialog-actions">
          <button class="game__dialog-btn game__dialog-btn--stay" type="button">${stay}</button>
          <button class="game__dialog-btn game__dialog-btn--leave" type="button">${leave}</button>
        </div>
      </div>
    </div>`;
}

/** Adds a point for the given player and updates the display. */
function addPoint(ctx: GameContext, color: PlayerColor): void {
  const el = ctx.scoreValue[color];
  ctx.scores[color] += 1;
  if (el) el.textContent = String(ctx.scores[color]);
}

/** Switches to the other player and updates the turn icon and cursor color. */
function switchPlayer(ctx: GameContext): void {
  ctx.currentPlayer = ctx.currentPlayer === 'blue' ? 'orange' : 'blue';
  if (ctx.turnIcon) {
    ctx.turnIcon.src = turnIconSrc(ctx.theme, ctx.headerBase, ctx.currentPlayer);
    ctx.turnIcon.alt = ctx.currentPlayer;
  }
  ctx.section?.setAttribute('data-current-player', ctx.currentPlayer);
}

/** Plays the diagonal glint once; resolves when the animation is done. */
function playFlash(ctx: GameContext): Promise<void> {
  return new Promise((resolve) => {
    const flash = ctx.flash;
    if (!flash) return resolve();
    flash.classList.remove('is-active');
    void flash.offsetWidth;
    flash.classList.add('is-active');
    flash.addEventListener('animationend', () => {
      flash.classList.remove('is-active');
      resolve();
    }, { once: true });
  });
}

/** Ends the game: determines winner/loser and moves to the game-over screen. */
function endGame(ctx: GameContext): void {
  const isDraw = ctx.scores.blue === ctx.scores.orange;
  const winner: PlayerColor = ctx.scores.blue >= ctx.scores.orange ? 'blue' : 'orange';
  const loser: PlayerColor = winner === 'blue' ? 'orange' : 'blue';
  setGameResult({ scores: { ...ctx.scores }, winner, loser, isDraw });
  navigateTo('gameover');
}

/** Flips a clicked card and, on the second one, compares the pair. */
function handleCardClick(ctx: GameContext, card: HTMLButtonElement): void {
  if (ctx.lockBoard) return;
  if (card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;
  card.classList.add('is-flipped');
  if (!ctx.firstCard) {
    ctx.firstCard = card;
    return;
  }
  const first = ctx.firstCard;
  ctx.firstCard = null;
  compareCards(ctx, first, card);
}

/** Routes the two revealed cards to the match or mismatch handler. */
function compareCards(ctx: GameContext, first: HTMLButtonElement, second: HTMLButtonElement): void {
  if (first.dataset.motif === second.dataset.motif) {
    handleMatch(ctx, first, second);
  } else {
    handleMismatch(ctx, first, second);
  }
}

/** Match: player stays and can click immediately; effects run asynchronously. */
function handleMatch(ctx: GameContext, first: HTMLButtonElement, second: HTMLButtonElement): void {
  const scoringPlayer = ctx.currentPlayer;
  ctx.matchedPairs += 1;
  const isLastPair = ctx.matchedPairs === ctx.totalPairs;
  if (isLastPair) ctx.lockBoard = true;
  window.setTimeout(() => {
    first.classList.add('is-matched');
    second.classList.add('is-matched');
    window.setTimeout(() => runMatchReward(ctx, scoringPlayer, isLastPair), 950);
  }, 450);
}

/** Plays the glint, then awards the point (and ends the game on the last pair). */
function runMatchReward(ctx: GameContext, scoringPlayer: PlayerColor, isLastPair: boolean): void {
  playFlash(ctx).then(() => {
    addPoint(ctx, scoringPlayer);
    if (isLastPair) endGame(ctx);
  });
}

/** Mismatch: lock the board, flip both back and switch player after a moment. */
function handleMismatch(ctx: GameContext, first: HTMLButtonElement, second: HTMLButtonElement): void {
  ctx.lockBoard = true;
  window.setTimeout(() => {
    first.classList.remove('is-flipped');
    second.classList.remove('is-flipped');
    switchPlayer(ctx);
    ctx.lockBoard = false;
  }, 900);
}

/** Wires card clicks and the guide indicators. */
function setupBoard(ctx: GameContext): void {
  const colIndicator = ctx.root.querySelector<HTMLElement>('.game__col-indicator');
  const rowIndicator = ctx.root.querySelector<HTMLElement>('.game__row-indicator');
  ctx.root.querySelectorAll<HTMLButtonElement>('.card').forEach((card) => {
    card.addEventListener('click', () => handleCardClick(ctx, card));
    card.addEventListener('pointerenter', () => moveIndicators(card, colIndicator, rowIndicator));
  });
}

/** Slides the guide pills to the column/row of the hovered card. */
function moveIndicators(
  card: HTMLButtonElement,
  colIndicator: HTMLElement | null,
  rowIndicator: HTMLElement | null,
): void {
  if (colIndicator) colIndicator.style.left = `${card.offsetLeft + card.offsetWidth / 2}px`;
  if (rowIndicator) rowIndicator.style.top = `${card.offsetTop + card.offsetHeight / 2}px`;
}

/** Sets up the colored cursor follower over the game section. */
function setupCursor(ctx: GameContext): void {
  const cursor = ctx.root.querySelector<HTMLElement>('.game__cursor');
  const section = ctx.section;
  if (!section || !cursor) return;
  section.addEventListener('pointermove', (event) => {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  });
  section.addEventListener('pointerenter', () => cursor.classList.add('is-visible'));
  section.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  hideCursorOverZones(ctx.root, cursor);
}

/** Hides the cursor dot over header and board (native cursor applies there). */
function hideCursorOverZones(root: HTMLElement, cursor: HTMLElement): void {
  const zones = [
    root.querySelector<HTMLElement>('.game__header'),
    root.querySelector<HTMLElement>('.game__board'),
  ];
  zones.forEach((zone) => {
    zone?.addEventListener('pointerenter', () => cursor.classList.remove('is-visible'));
    zone?.addEventListener('pointerleave', () => cursor.classList.add('is-visible'));
  });
}

/** Wires the exit dialog: open, stay, leave and backdrop click. */
function setupModal(ctx: GameContext): void {
  const modal = ctx.root.querySelector<HTMLElement>('.game__modal');
  ctx.root.querySelector<HTMLButtonElement>('.game__exit')
    ?.addEventListener('click', () => openModal(ctx, modal));
  ctx.root.querySelector<HTMLButtonElement>('.game__dialog-btn--stay')
    ?.addEventListener('click', () => closeModal(ctx, modal));
  ctx.root.querySelector<HTMLButtonElement>('.game__dialog-btn--leave')
    ?.addEventListener('click', () => navigateTo('settings'));
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(ctx, modal);
  });
}

/** Opens the exit dialog and hides the cursor dot. */
function openModal(ctx: GameContext, modal: HTMLElement | null): void {
  modal?.classList.add('is-open');
  ctx.section?.classList.add('is-modal-open');
}

/** Plays the close animation, then actually hides the dialog. */
function closeModal(ctx: GameContext, modal: HTMLElement | null): void {
  if (!modal) return;
  const dialog = modal.querySelector<HTMLElement>('.game__dialog');
  const finish = (): void => {
    modal.classList.remove('is-open', 'is-closing');
    ctx.section?.classList.remove('is-modal-open');
  };
  modal.classList.add('is-closing');
  if (dialog) dialog.addEventListener('animationend', finish, { once: true });
  else finish();
}

/** Demo shortcut: clicking the player icon reveals all cards and ends the game. */
function setupDemoShortcut(ctx: GameContext): void {
  ctx.turnIcon?.addEventListener('click', () => {
    if (ctx.lockBoard) return;
    const allCards = ctx.root.querySelectorAll<HTMLButtonElement>('.card');
    ctx.lockBoard = true;
    allCards.forEach((card) => card.classList.add('is-flipped'));
    window.setTimeout(() => {
      allCards.forEach((card) => card.classList.add('is-matched'));
      window.setTimeout(() => endGame(ctx), 700);
    }, 700);
  });
}
