import { navigateTo } from '../router';
import { settings, type ThemeId, type PlayerColor, type BoardSize } from '../state';

// Section icons (colors are baked into the SVGs).
const iconTheme = `<img src="/assets/icons/palette.svg" alt="" />`;
const iconPlayer = `<img src="/assets/icons/chess_pawn.svg" alt="" />`;
const iconBoard = `<img src="/assets/icons/style.svg" alt="" />`;
const iconArrow = `<img class="radio__arrow" src="/assets/icons/Line%203.svg" alt="" aria-hidden="true" />`;
const iconPlay = `<img src="/assets/icons/smart_display.svg" alt="" />`;

/** Renders the settings screen and wires all selection interactions. */
export function renderSettings(root: HTMLElement): void {
  root.innerHTML = settingsMarkup();
  setupOptionChanges(root);
  updateStepperReady(root);
  setupThemePreviewHover(root);
  setupStepperExpand(root);
  setupStartButton(root);
}

/** Builds the full settings markup. */
function settingsMarkup(): string {
  return `
    <section class="settings">
      <div class="settings__panel">
        <h1 class="settings__title">Settings</h1>
        <div class="settings__body">
          <form class="settings__options">
            ${themeGroup()}
            ${playerGroup()}
            ${boardGroup()}
          </form>
          ${previewAndStepper()}
        </div>
      </div>
    </section>
  `;
}

/** Builds the "Game themes" option group. */
function themeGroup(): string {
  const items =
    radio('theme', 'code-vibes', 'Code vibes theme', settings.theme === 'code-vibes', true) +
    radio('theme', 'gaming', 'Gaming theme', settings.theme === 'gaming', true);
  return optionGroup(iconTheme, 'Game themes', items);
}

/** Builds the "Choose player" option group. */
function playerGroup(): string {
  const items =
    radio('player', 'blue', 'Blue', settings.player === 'blue', true) +
    radio('player', 'orange', 'Orange', settings.player === 'orange', true);
  return optionGroup(iconPlayer, 'Choose player', items);
}

/** Builds the "Board size" option group. */
function boardGroup(): string {
  const items =
    radio('board', '16', '16 cards', settings.boardSize === 16, true) +
    radio('board', '24', '24 cards', settings.boardSize === 24, true) +
    radio('board', '36', '36 cards', settings.boardSize === 36, true);
  return optionGroup(iconBoard, 'Board size', items);
}

/** Wraps option items in a titled fieldset. */
function optionGroup(icon: string, title: string, items: string): string {
  return `
    <fieldset class="option-group">
      <legend class="option-group__title">${icon}<span>${title}</span></legend>
      <div class="option-group__items">${items}</div>
    </fieldset>`;
}

/** Builds a single radio option; withArrow adds the yellow arrow (themes only). */
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

/** Builds the preview image plus the stepper navigation. */
function previewAndStepper(): string {
  return `
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
    </div>`;
}

/** Persists selection changes to state and refreshes the stepper. */
function setupOptionChanges(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('.settings__options');
  const preview = root.querySelector<HTMLElement>('.preview');
  form?.addEventListener('change', (event) => {
    applyOption(event.target as HTMLInputElement, preview);
    updateStepperReady(root);
    refreshStepperValues(root);
  });
}

/** Writes a single changed option to the central state. */
function applyOption(input: HTMLInputElement, preview: HTMLElement | null): void {
  switch (input.name) {
    case 'theme':
      settings.theme = input.value as ThemeId;
      if (preview) preview.dataset.theme = settings.theme;
      break;
    case 'player':
      settings.player = input.value as PlayerColor;
      break;
    case 'board':
      settings.boardSize = Number(input.value) as BoardSize;
      break;
  }
}

/** Marks the stepper ready (clickable) once player and size are chosen. */
function updateStepperReady(root: HTMLElement): void {
  const ready = settings.player !== null && settings.boardSize !== null;
  root.querySelector('.stepper')?.classList.toggle('is-ready', ready);
}

/** Updates the displayed stepper values, but only while it is expanded. */
function refreshStepperValues(root: HTMLElement): void {
  const stepper = root.querySelector('.stepper');
  if (!stepper?.classList.contains('is-expanded')) return;
  root.querySelectorAll<HTMLElement>('.stepper__item').forEach((it) => {
    const value = stepValue(it.dataset.step ?? '');
    if (value) it.textContent = value;
  });
}

/** Lets the preview follow theme hovering, back to the real choice on leave. */
function setupThemePreviewHover(root: HTMLElement): void {
  const preview = root.querySelector<HTMLElement>('.preview');
  root.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => {
    const main = input.closest('.radio__main');
    main?.addEventListener('mouseenter', () => {
      if (preview) preview.dataset.theme = input.value;
    });
    main?.addEventListener('mouseleave', () => {
      if (preview) preview.dataset.theme = settings.theme;
    });
  });
}

/** Wires a click on any stepper item to expand it into the chosen values. */
function setupStepperExpand(root: HTMLElement): void {
  const stepper = root.querySelector<HTMLElement>('.stepper');
  const steps = root.querySelector<HTMLElement>('.stepper__steps');
  const stepItems = root.querySelectorAll<HTMLElement>('.stepper__item');
  stepItems.forEach((item) => {
    item.addEventListener('click', () => expandStepper(stepper, steps, stepItems));
  });
}

/** Expands the stepper, then reveals the chosen values after the width animation. */
function expandStepper(
  stepper: HTMLElement | null,
  steps: HTMLElement | null,
  stepItems: NodeListOf<HTMLElement>,
): void {
  if (stepper?.classList.contains('is-expanded')) return;
  if (settings.player === null || settings.boardSize === null) return;
  steps?.classList.add('is-hidden');
  stepper?.classList.add('is-expanded');
  window.setTimeout(() => {
    revealStepValues(stepItems);
    steps?.classList.remove('is-hidden');
  }, 250);
}

/** Replaces the step labels with the chosen values. */
function revealStepValues(stepItems: NodeListOf<HTMLElement>): void {
  stepItems.forEach((it) => {
    const value = stepValue(it.dataset.step ?? '');
    if (value) {
      it.textContent = value;
      it.classList.add('is-value');
    }
  });
}

/** Chosen value for a stepper item, or null if nothing is selected yet. */
function stepValue(step: string): string | null {
  switch (step) {
    case 'theme':
      return settings.theme === 'code-vibes' ? 'Code theme' : 'Gaming theme';
    case 'player':
      return settings.player ? `${capitalize(settings.player)} Player` : null;
    case 'board':
      return settings.boardSize ? `Board-${settings.boardSize} Cards` : null;
    default:
      return null;
  }
}

/** Start button leads to the game, but only once player and size are chosen. */
function setupStartButton(root: HTMLElement): void {
  root.querySelector<HTMLButtonElement>('.stepper__start')?.addEventListener('click', () => {
    if (settings.player === null || settings.boardSize === null) return;
    navigateTo('game');
  });
}

/** Capitalizes the first letter of a word. */
function capitalize(word: string): string {
  return `${word[0].toUpperCase()}${word.slice(1)}`;
}
