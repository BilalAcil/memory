import { navigateTo } from '../router';
import { settings, gameResult, type PlayerColor } from '../state';

/**
 * Rendert den Game-Over-Screen: zuerst "Game over_01" (Endstand), danach fährt
 * nach 1200ms der Ergebnis-Frame von oben herein – entweder "Winner_01" (Gewinner
 * mit Konfetti + Spieler-Icon) oder "Draw_01" (Unentschieden mit Waage-Icon).
 */
export function renderGameOver(root: HTMLElement): void {
  const theme = settings.theme;
  document.body.dataset.theme = theme; // Theme am body (färbt den Frame-Hintergrund im Gaming-Theme)
  // Fallback, falls der Screen ohne Ergebnis erreicht wird (im Spielfluss nicht der Fall).
  const winner: PlayerColor = gameResult?.winner ?? 'blue';
  const loser: PlayerColor = gameResult?.loser ?? 'orange';
  const scores = gameResult?.scores ?? { blue: 0, orange: 0 };
  const isDraw = gameResult?.isDraw ?? false;
  const headerBase = `/assets/header/${theme}`;

  // Theme-abhängige Winner-Details: Gaming zeigt einen Pokal + "Home"-Button
  // und den Namen in Groß-/Kleinschreibung ("Blue Player" statt "BLUE PLAYER").
  const winnerIcon =
    theme === 'gaming' ? '/assets/icons/pockal%201.png' : `/assets/icons/player_${winner}_label.svg`;
  const backLabel = theme === 'gaming' ? 'Home' : 'Back to start';
  const winnerName =
    theme === 'gaming'
      ? `${winner[0].toUpperCase()}${winner.slice(1)} Player`
      : `${winner.toUpperCase()} PLAYER`;

  // Draw-Frame: Gaming zeigt "DRAW" als Text (Orbitron) + eigenes pinkes Waage-Icon.
  const drawWord =
    theme === 'gaming'
      ? '<span class="draw__word">DRAW</span>'
      : '<img class="draw__word" src="/assets/icons/draw.svg" alt="Draw" />';
  const drawIcon =
    theme === 'gaming' ? '/assets/icons/draw_Icon.svg' : '/assets/icons/Scale_Icon.svg';

  // Ergebnis-Frame: bei Gleichstand der Draw-Frame, sonst der Winner-Frame.
  const resultFrame = isDraw
    ? `
    <!-- Draw_01: Unentschieden – fährt nach 1200ms von oben herein -->
    <section class="draw" data-theme="${theme}">
      <div class="draw__content">
        <div class="draw__text">
          <p class="draw__intro">It's a</p>
          ${drawWord}
        </div>

        <img class="draw__icon" src="${drawIcon}" alt="" />

        <button class="winner__back" type="button">${backLabel}</button>
      </div>
    </section>`
    : `
    <!-- Winner_01: Gewinner – fährt nach 1200ms von oben herein -->
    <section class="winner" data-theme="${theme}" data-winner="${winner}">
      <img class="winner__confetti" src="/assets/icons/Confetti.svg" alt="" aria-hidden="true" />

      <div class="winner__content">
        <div class="winner__text">
          <p class="winner__intro">The winner is</p>
          <h2 class="winner__name">${winnerName}</h2>
        </div>

        <img class="winner__icon" src="${winnerIcon}" alt="" />

        <button class="winner__back" type="button">${backLabel}</button>
      </div>
    </section>`;

  root.innerHTML = `
    <section class="gameover" data-theme="${theme}" data-loser="${loser}" data-winner="${winner}">
      <!-- 1. Titel -->
      <div class="gameover__headline">
        <h1 class="gameover__title">Game over</h1>
      </div>

      <!-- 2. "Final score" + Endstand beider Spieler -->
      <div class="gameover__result">
        <p class="gameover__subtitle">Final score</p>
        <div class="gameover__scores">
          <span class="gameover__score" data-color="blue">
            <img src="${headerBase}/player-blue.png" alt="" />
            <span class="gameover__score-label">Blue</span>
            <b>${scores.blue}</b>
          </span>
          <span class="gameover__score" data-color="orange">
            <img src="${headerBase}/player-orange.png" alt="" />
            <span class="gameover__score-label">Orange</span>
            <b>${scores.orange}</b>
          </span>
        </div>
      </div>
    </section>
    ${resultFrame}
  `;

  // "Back to start" → zurück zur Settings-Seite.
  root
    .querySelector<HTMLButtonElement>('.winner__back')
    ?.addEventListener('click', () => navigateTo('settings'));
}
