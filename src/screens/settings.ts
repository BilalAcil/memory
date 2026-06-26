import { navigateTo } from '../router';
import { settings, type ThemeId, type PlayerColor, type BoardSize } from '../state';

// --- Section-Icons (Farben sind in den SVGs eingebacken) ---
const iconTheme = `<img src="/assets/icons/palette.svg" alt="" />`;      // #DA1EBA (Pink)
const iconPlayer = `<img src="/assets/icons/chess_pawn.svg" alt="" />`;  // #1AE5BE (Türkis)
const iconBoard = `<img src="/assets/icons/style.svg" alt="" />`;        // #0635C9 (Blau)
// Gelbe Pfeil-Linie neben dem ausgewählten Theme (Farbe im SVG eingebacken).
const iconArrow = `<img class="radio__arrow" src="/assets/icons/Line%203.svg" alt="" aria-hidden="true" />`;
const iconPlay = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>`;

/**
 * Baut eine einzelne Radio-Option.
 * `checked` markiert die aktuell ausgewählte Option,
 * `withArrow` ergänzt den gelben Pfeil (nur bei den Themes).
 */
function radio(name: string, value: string, label: string, checked: boolean, withArrow = false): string {
  return `
    <div class="radio">
      <label class="radio__main">
        <input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''} />
        <span class="radio__label">${label}</span>
      </label>
      ${withArrow ? iconArrow : ''}
    </div>`;
}

/**
 * Rendert den Settings-Screen: Auswahl von Theme, Spieler und Spielfeldgröße.
 * Jede Änderung wird sofort im zentralen State gespeichert.
 */
export function renderSettings(root: HTMLElement): void {
  root.innerHTML = `
    <section class="settings">
      <div class="settings__panel">
        <h1 class="settings__title">Settings</h1>

        <div class="settings__body">
          <!-- LINKS: Auswahl-Optionen -->
          <form class="settings__options">
            <fieldset class="option-group">
              <legend class="option-group__title">${iconTheme}<span>Game themes</span></legend>
              <div class="option-group__items">
                ${radio('theme', 'code-vibes', 'Code vibes theme', settings.theme === 'code-vibes', true)}
                ${radio('theme', 'gaming', 'Gaming theme', settings.theme === 'gaming', true)}
              </div>
            </fieldset>

            <fieldset class="option-group">
              <legend class="option-group__title">${iconPlayer}<span>Choose player</span></legend>
              <div class="option-group__items">
                ${radio('player', 'blue', 'Blue', settings.player === 'blue', true)}
                ${radio('player', 'orange', 'Orange', settings.player === 'orange', true)}
              </div>
            </fieldset>

            <fieldset class="option-group">
              <legend class="option-group__title">${iconBoard}<span>Board size</span></legend>
              <div class="option-group__items">
                ${radio('board', '16', '16 cards', settings.boardSize === 16, true)}
                ${radio('board', '24', '24 cards', settings.boardSize === 24, true)}
                ${radio('board', '36', '36 cards', settings.boardSize === 36, true)}
              </div>
            </fieldset>
          </form>

          <!-- RECHTS: Vorschau + Stepper -->
          <div class="settings__preview-area">
            <div class="preview" data-theme="${settings.theme}">
              <span class="preview__hint">Vorschau (Bild folgt)</span>
            </div>

            <nav class="stepper">
              <span class="stepper__item">Game theme</span>
              <span class="stepper__sep">/</span>
              <span class="stepper__item">Player</span>
              <span class="stepper__sep">/</span>
              <span class="stepper__item">Board size</span>
              <button class="stepper__start" type="button">${iconPlay}<span>Start</span></button>
            </nav>
          </div>
        </div>
      </div>
    </section>
  `;

  // Auswahl-Änderungen in den State schreiben.
  const form = root.querySelector<HTMLFormElement>('.settings__options');
  const preview = root.querySelector<HTMLElement>('.preview');

  form?.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    switch (input.name) {
      case 'theme':
        settings.theme = input.value as ThemeId;
        if (preview) preview.dataset.theme = settings.theme; // Vorschau-Farbe umschalten
        break;
      case 'player':
        settings.player = input.value as PlayerColor;
        break;
      case 'board':
        settings.boardSize = Number(input.value) as BoardSize;
        break;
    }
  });

  // Vorschau folgt dem Hovern über die Themes (zurück zur echten Auswahl beim Wegfahren).
  // Ausgelöst über .radio__main — konsistent zu den CSS-Hover-Effekten.
  root.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => {
    const main = input.closest('.radio__main');
    main?.addEventListener('mouseenter', () => {
      if (preview) preview.dataset.theme = input.value;
    });
    main?.addEventListener('mouseleave', () => {
      if (preview) preview.dataset.theme = settings.theme;
    });
  });

  // Start → zum Spielfeld (nur wenn Spieler UND Größe gewählt sind).
  root.querySelector<HTMLButtonElement>('.stepper__start')
    ?.addEventListener('click', () => {
      if (settings.player === null || settings.boardSize === null) {
        return; // noch unvollständig — vorerst passiert nichts
      }
      navigateTo('game');
    });
}
