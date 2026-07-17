import { renderHome } from './screens/home';
import { renderSettings } from './screens/settings';
import { renderGame } from './screens/game';
import { renderGameOver } from './screens/gameover';

// Possible screens of the app.
export type Screen = 'home' | 'settings' | 'game' | 'gameover';

// Root element that all screens are rendered into.
const root = document.getElementById('app');

/**
 * Switches the visible screen by re-filling the root element.
 * Single-page app without a framework: one screen renders, the previous one disappears.
 */
export function navigateTo(screen: Screen): void {
  if (!root) return;
  root.innerHTML = '';
  document.body.dataset.screen = screen;
  renderScreen(screen);
}

/** Renders the given screen into the root element. */
function renderScreen(screen: Screen): void {
  switch (screen) {
    case 'home':
      renderHome(root!);
      break;
    case 'settings':
      renderSettings(root!);
      break;
    case 'game':
      renderGame(root!);
      break;
    case 'gameover':
      renderGameOver(root!);
      break;
  }
}
