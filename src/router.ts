import { renderHome } from './screens/home';
import { renderSettings } from './screens/settings';

// Die möglichen Screens der App.
export type Screen = 'home' | 'settings' | 'game' | 'gameover';

// Das Wurzel-Element, in das alle Screens gerendert werden.
const root = document.getElementById('app');

/**
 * Wechselt den sichtbaren Screen, indem das Wurzel-Element neu befüllt wird.
 * (Single-Page-App ohne Framework: ein Screen wird gerendert, der vorige verschwindet.)
 */
export function navigateTo(screen: Screen): void {
  if (!root) return;
  root.innerHTML = '';

  // Aktiven Screen am <body> markieren, damit das CSS pro Screen reagieren kann
  // (z.B. heller Hintergrund auf der Settings-Seite).
  document.body.dataset.screen = screen;

  switch (screen) {
    case 'home':
      renderHome(root);
      break;
    case 'settings':
      renderSettings(root);
      break;
    default:
      // Platzhalter, bis Settings / Game / GameOver gebaut sind.
      root.innerHTML = `<p style="color:#fff;padding:2rem;font-family:sans-serif;">
        Screen „${screen}" kommt als Nächstes …</p>`;
  }
}
