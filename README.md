# Memory

Ein **Memory-Kartenspiel**, umgesetzt im Rahmen der Developer Akademie – als
Single-Page-App mit **Vanilla TypeScript**, **SCSS** und **Vite** (ohne Framework).

## Features

- **Startseite** mit animiertem Controller-Icon und Play-Button.
- **Settings**: Auswahl von Spielerfarbe (Blau / Orange), Spielfeldgröße (4x4 / 4x6 / 6x6)
  und Theme.
- **2 Themes / Layouts**, die Farbschema **und** Kartenmotive ändern:
  - **Code vibes** (Türkis, Code-Motive)
  - **Gaming** (Teal/Pink, Gaming-Motive, Orbitron-Schrift)
- **Spielfeld** mit Header (Punktestand, aktiver Spieler, "Exit Game"),
  3D-Flip-Animation beim Aufdecken und Match-Erkennung.
- **Game-Over** mit Endstand, **Gewinner-Anzeige** (meiste Punkte) bzw.
  **Unentschieden-Screen**, und der Möglichkeit, eine neue Runde zu starten.

## Befehle

```bash
npm install      # Abhängigkeiten installieren
npm run dev      # Dev-Server mit Hot-Reload starten
npm run build    # Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal testen
```

## Projektstruktur

```
public/            Statische Assets (Karten, Icons, Vorschauen)
src/
  main.ts          App-Entry (laedt das Stylesheet)
  router.ts        Screen-Router (Home / Settings / Game / Game-Over)
  state.ts         Zentraler App-Zustand (Auswahl + Spielergebnis)
  screens/         Ein Modul pro Screen (home, settings, game, gameover)
  styles/          SCSS (Design-Tokens, Basis, ein Partial pro Screen)
```

## Extras

- **Vollständig zweites Theme (Gaming)** inkl. eigenem Exit-Dialog und eigenen
  Game-Over-/Winner-/Draw-Screens.
- **Unentschieden-Screen** ("It's a DRAW") über die reine Gewinner-Anzeige hinaus.
- **Exit-Bestätigungs-Popup**, farbiger Cursor-Follower, Match-Glanz-Effekt,
  Führungs-Pills beim 6x6-Feld und eine Feder-Animation am Settings-Stepper.
- **Demo-Abkürzung:** Ein Klick auf das Spieler-Icon im Spiel-Header (neben
  "Current player") deckt sofort alle Karten auf und springt zum Game-Over –
  gedacht, um den Endscreen ohne komplettes Durchspielen anzusehen.
