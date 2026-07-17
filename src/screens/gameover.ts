import { navigateTo } from '../router';
import { settings, gameResult, type PlayerColor, type ThemeId } from '../state';

/** Resolved result of the last game, with fallbacks for a direct visit. */
interface ResolvedResult {
  winner: PlayerColor;
  loser: PlayerColor;
  scores: Record<PlayerColor, number>;
  isDraw: boolean;
}

/** Renders the game-over screen: final score plus the winner or draw frame. */
export function renderGameOver(root: HTMLElement): void {
  const theme = settings.theme;
  const result = resolveResult();
  document.body.dataset.theme = theme;
  root.innerHTML = gameOverMarkup(theme, result) + resultFrame(theme, result);
  root
    .querySelector<HTMLButtonElement>('.winner__back')
    ?.addEventListener('click', () => navigateTo('settings'));
}

/** Reads the last result from state, with fallbacks if the screen is opened directly. */
function resolveResult(): ResolvedResult {
  return {
    winner: gameResult?.winner ?? 'blue',
    loser: gameResult?.loser ?? 'orange',
    scores: gameResult?.scores ?? { blue: 0, orange: 0 },
    isDraw: gameResult?.isDraw ?? false,
  };
}

/** Builds the "Game over" headline and the final score block. */
function gameOverMarkup(theme: ThemeId, result: ResolvedResult): string {
  const headerBase = `/assets/header/${theme}`;
  return `
    <section class="gameover" data-theme="${theme}" data-loser="${result.loser}" data-winner="${result.winner}">
      <div class="gameover__headline">
        <h1 class="gameover__title">Game over</h1>
      </div>
      <div class="gameover__result">
        <p class="gameover__subtitle">Final score</p>
        ${scoresMarkup(headerBase, result.scores)}
      </div>
    </section>
  `;
}

/** Builds the two-player score row. */
function scoresMarkup(headerBase: string, scores: Record<PlayerColor, number>): string {
  return `
    <div class="gameover__scores">
      ${scoreMarkup(headerBase, 'blue', 'Blue', scores.blue)}
      ${scoreMarkup(headerBase, 'orange', 'Orange', scores.orange)}
    </div>`;
}

/** Builds a single player score entry. */
function scoreMarkup(headerBase: string, color: PlayerColor, label: string, value: number): string {
  return `
    <span class="gameover__score" data-color="${color}">
      <img src="${headerBase}/player-${color}.png" alt="" />
      <span class="gameover__score-label">${label}</span>
      <b>${value}</b>
    </span>`;
}

/** Picks the winner or draw frame that slides in after the score. */
function resultFrame(theme: ThemeId, result: ResolvedResult): string {
  return result.isDraw ? drawFrame(theme) : winnerFrame(theme, result.winner);
}

/** Builds the winner frame (confetti, name, player/trophy icon, back button). */
function winnerFrame(theme: ThemeId, winner: PlayerColor): string {
  const icon =
    theme === 'gaming' ? '/assets/icons/pockal%201.png' : `/assets/icons/player_${winner}_label.svg`;
  const name = theme === 'gaming' ? `${capitalize(winner)} Player` : `${winner.toUpperCase()} PLAYER`;
  return `
    <section class="winner" data-theme="${theme}" data-winner="${winner}">
      <img class="winner__confetti" src="/assets/icons/Confetti.svg" alt="" aria-hidden="true" />
      <div class="winner__content">
        <div class="winner__text">
          <p class="winner__intro">The winner is</p>
          <h2 class="winner__name">${name}</h2>
        </div>
        <img class="winner__icon" src="${icon}" alt="" />
        <button class="winner__back" type="button">${backLabel(theme)}</button>
      </div>
    </section>`;
}

/** Builds the draw frame (tie), shown instead of a winner. */
function drawFrame(theme: ThemeId): string {
  const word =
    theme === 'gaming'
      ? '<span class="draw__word">DRAW</span>'
      : '<img class="draw__word" src="/assets/icons/draw.svg" alt="Draw" />';
  const icon = theme === 'gaming' ? '/assets/icons/draw_Icon.svg' : '/assets/icons/Scale_Icon.svg';
  return `
    <section class="draw" data-theme="${theme}">
      <div class="draw__content">
        <div class="draw__text">
          <p class="draw__intro">It's a</p>
          ${word}
        </div>
        <img class="draw__icon" src="${icon}" alt="" />
        <button class="winner__back" type="button">${backLabel(theme)}</button>
      </div>
    </section>`;
}

/** Label for the back button (differs per theme). */
function backLabel(theme: ThemeId): string {
  return theme === 'gaming' ? 'Home' : 'Back to start';
}

/** Capitalizes the first letter of a word. */
function capitalize(word: string): string {
  return `${word[0].toUpperCase()}${word.slice(1)}`;
}
