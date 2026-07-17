import { navigateTo } from '../router';
import { settings, type ThemeId, type PlayerColor, type BoardSize } from '../state';

// --- Section-Icons (Farben sind in den SVGs eingebacken) ---
const iconTheme = `<img src="/assets/icons/palette.svg" alt="" />`;      // #DA1EBA (Pink)
const iconPlayer = `<img src="/assets/icons/chess_pawn.svg" alt="" />`;  // #1AE5BE (Türkis)
const iconBoard = `<img src="/assets/icons/style.svg" alt="" />`;        // #0635C9 (Blau)
// Gelbe Pfeil-Linie neben dem ausgewählten Theme (Farbe im SVG eingebacken).
const iconArrow = `<img class="radio__arrow" src="/assets/icons/Line%203.svg" alt="" aria-hidden="true" />`;
const iconPlay = `<img src="/assets/icons/smart_display.svg" alt="" />`;

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
          <div class="preview__wrapper">
            <div class="preview" data-theme="${settings.theme}"></div>
            </div>

            <nav class="stepper">
              <div class="stepper__steps">
                <span class="stepper__item" data-step="theme" data-label="Game theme">Game theme</span>
                <span class="stepper__item" data-step="player" data-label="Player">Player</span>
                <span class="stepper__item" data-step="board" data-label="Board size">Board size</span>
              </div>
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
    updateStepperReady(); // Stepper klickbar machen, sobald alles gewählt ist
    refreshStepperValues(); // falls schon aufgeklappt: Anzeige an neue Wahl anpassen
  });

  // Stepper ist nur klickbar (pointer), wenn Spieler UND Größe gewählt sind.
  function updateStepperReady(): void {
    const ready = settings.player !== null && settings.boardSize !== null;
    root.querySelector('.stepper')?.classList.toggle('is-ready', ready);
  }
  updateStepperReady(); // Ausgangszustand setzen (z.B. bei bereits gewählten Werten)

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

  // --- Stepper: Klick auf ein Item zeigt den gewählten Wert (nochmal klicken → Label) ---
  // Gewählter Wert für ein Stepper-Item (oder null, wenn noch nichts gewählt).
  function stepValue(step: string): string | null {
    switch (step) {
      case 'theme':
        return settings.theme === 'code-vibes' ? 'Code theme' : 'Gaming theme';
      case 'player':
        return settings.player
          ? `${settings.player[0].toUpperCase()}${settings.player.slice(1)} Player`
          : null;
      case 'board':
        return settings.boardSize ? `Board-${settings.boardSize} Cards` : null;
      default:
        return null;
    }
  }

  const stepper = root.querySelector<HTMLElement>('.stepper');
  const steps = root.querySelector<HTMLElement>('.stepper__steps');
  const stepItems = root.querySelectorAll<HTMLElement>('.stepper__item');
  stepItems.forEach((item) => {
    item.addEventListener('click', () => {
      if (stepper?.classList.contains('is-expanded')) return; // schon offen → nichts tun

      // Nur klickbar, wenn Spieler UND Größe gewählt sind – sonst passiert nichts.
      if (settings.player === null || settings.boardSize === null) return;

      // 1. Alte Labels sofort ausblenden + Stepper breiter werden lassen (250ms).
      steps?.classList.add('is-hidden');
      stepper?.classList.add('is-expanded');

      // 2. Erst NACH der Breiten-Animation die Werte setzen und sanft einblenden
      //    (sonst würde der längere Text in den noch schmalen Stepper umbrechen).
      window.setTimeout(() => {
        stepItems.forEach((it) => {
          const value = stepValue(it.dataset.step ?? '');
          if (value) {
            it.textContent = value;
            it.classList.add('is-value');
          }
        });
        steps?.classList.remove('is-hidden'); // Werte mit Verlauf einblenden
      }, 250); // = Dauer der Breiten-Transition
    });
  });

  // Aktualisiert die angezeigten Werte im Stepper – aber nur, wenn er schon
  // aufgeklappt ist (also bereits Werte statt Labels zeigt).
  function refreshStepperValues(): void {
    if (!stepper?.classList.contains('is-expanded')) return;
    stepItems.forEach((it) => {
      const value = stepValue(it.dataset.step ?? '');
      if (value) it.textContent = value;
    });
  }

  // Start → zum Spielfeld. Der Button ist erst klickbar, wenn Spieler UND Größe
  // gewählt sind (siehe .stepper.is-ready); vorher passiert bewusst nichts.
  root.querySelector<HTMLButtonElement>('.stepper__start')
    ?.addEventListener('click', () => {
      if (settings.player === null || settings.boardSize === null) return;
      navigateTo('game');
    });
}
