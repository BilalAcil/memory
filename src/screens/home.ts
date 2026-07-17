import { navigateTo } from '../router';

/** Renders the home screen and wires the play button to the settings screen. */
export function renderHome(root: HTMLElement): void {
  root.innerHTML = homeMarkup();
  const playButton = root.querySelector<HTMLButtonElement>('.btn-play');
  playButton?.addEventListener('click', () => navigateTo('settings'));
}

/** Builds the home screen markup. */
function homeMarkup(): string {
  return `
    <section class="home">
      <img class="home__watermark" src="/assets/icons/stadia_controller.svg" alt="" aria-hidden="true" />

      <div class="home__content">
        <p class="home__eyebrow">It's play time.</p>
        <h1 class="home__title">Ready to play?</h1>
      </div>

      <button class="btn-play" type="button">
        <img class="btn-play__icon" src="/assets/icons/controller.svg" alt="" />
        <span>Play</span>
        <span class="btn-play__arrow">
          <img class="btn-play__arrow-thin" src="/assets/icons/arrow-right.svg" alt="" />
          <img class="btn-play__arrow-bold" src="/assets/icons/arrow-right-bold.svg" alt="" />
        </span>
      </button>
    </section>
  `;
}
