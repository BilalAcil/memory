# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sprache / Language

Der Entwickler arbeitet auf Deutsch. Kommentare im Code und Kommunikation auf Deutsch.

## Befehle

```bash
npm run dev      # Vite Dev-Server starten (HMR)
npm run build    # Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal testen
```

Es gibt **keine Tests** (`npm test` ist nur ein Platzhalter, der mit Fehler abbricht).
TypeScript-Typprüfung läuft über den Editor / Vite — es gibt kein separates `tsc`-Skript;
`noEmit: true` ist gesetzt, Vite übernimmt den Build.

## Projekt-Ziel

Ein **Memory-Kartenspiel** als Abschlussprojekt der Developer Akademie. Die vollständigen
Anforderungen stehen in `public/Memory Checkliste.pdf`. Kurzfassung der User Stories:

1. **Startseite** mit Start-Button → führt zur Settings-Page. Animiertes Controller-Icon.
2. **Settings**: Spielerfarbe (2 Spieler, z.B. Blau/Orange), Spielfeldgröße (4x4 / 4x6 / 6x6),
   Themes (mind. 2 wählbar).
3. **Layouts** (mind. 2): verändern Farbschema **und** die Themengebiete der Memory-Bilder.
4. **Spielfeld**: Größe gemäß Auswahl, Theme in Farbe + Motiven; Header mit Punktestand,
   aktivem Spieler und "Exit Game"-Button. Karten drehen sich beim Klick mit flüssiger Animation.
5. **Game-Over**: Anzeige mit Punktestand, Gewinner (meiste Punkte), neue Runde starten.

Code Conventions gemäß Developer-Akademie-Guidelines für HTML und TypeScript einhalten.

## Aktueller Stand & Architektur

Das Projekt ist **am Anfang** — bisher nur Boilerplate:

- `index.html` — Einstiegspunkt, lädt `src/main.ts` als Modul. Enthält aktuell nur
  ein `<section id="field">` mit einem Start-Button.
- `src/main.ts` — App-Entry. Importiert aktuell nur das Stylesheet.
- `src/styles/style.scss` — globales SCSS (über `main.ts` importiert, kein CSS-Modules-Setup).
- `public/` — statische Assets (Bilder, PDF), wird 1:1 ins Build kopiert.

Es gibt **noch keine** Komponenten-, Routing- oder State-Struktur. Beim Aufbau:
Single-Page-App ohne Framework (Vanilla TS + DOM). Screens (Home / Settings / Game / GameOver)
werden voraussichtlich durch Ein-/Ausblenden im DOM bzw. dynamisches Rendern realisiert.

## Wichtige Hinweise

- **`vite.config.ts` `base: "/"`** — der ursprüngliche Vorlagen-Wert `/projects/banana/`
  wurde entfernt (sorgte dafür, dass der Dev-Server die App nicht unter der Root-Adresse
  auslieferte). Beim Deployment auf einen Unterpfad ggf. wieder anpassen.
- `src` ist die einzige Quelle für die TS-Kompilierung (`include: ["src"]`).
