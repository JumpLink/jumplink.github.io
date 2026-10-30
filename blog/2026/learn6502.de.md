---
title: Learn 6502 Assembly als GNOME-App
date: 2026-10-29
summary: Learn 6502 Assembly ist eine GNOME-App mit Tutorial, Editor, Debugger und virtuellem Display, basierend auf Nick Morgans easy6502.
tags: [GNOME, gjsify]
---

Der 6502 ist der Prozessor von Commodore 64, NES und Apple II. Nick Morgans
[easy6502](https://github.com/skilldrick/easy6502) ist ein Web-Tutorial, das seine
Assemblersprache Schritt für Schritt erklärt. Daraus habe ich eine native GNOME-App gemacht:
**Learn 6502 Assembly**.

Das steckt drin:

- **Ein interaktives Tutorial**, das die Kernkonzepte durchgeht.
- **Ein Code-Editor** mit Syntaxhervorhebung.
- **Ein Assembler und ein Debugger**, die Register, Flags und Speicher zeigen, während der Code läuft.
- **Ein virtuelles Display**, auf dem man das Ergebnis sieht und mit dem sich kleine Spiele und
  Grafiken bauen lassen.

Die App ist in TypeScript mit GJS und libadwaita geschrieben und wird mit
[gjsify](https://gjsify.org/) gebaut. Das Repository enthält mehr als die Desktop-App: Assembler,
Simulator und Disassembler stecken in einem eigenen Paket, `@learn6502/core`, und derselbe Code
treibt auch eine Web-Version und eine Android-App an. Tutorial-Inhalte und Übersetzungen sind
ebenfalls eigene Pakete, übersetzt wird auf Weblate.

Die App gibt es auf [Flathub](https://flathub.org/apps/eu.jumplink.Learn6502). Der Code steht unter
GPL-3.0, der Tutorialtext unter CC BY 4.0, wie im Original.
