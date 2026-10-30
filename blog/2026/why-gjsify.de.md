---
title: Warum gjsify
date: 2026-10-28
summary: gjsify bringt die Standard-APIs von Node.js und dem Web nach GJS, damit TypeScript-Apps und npm-Pakete nativ auf GNOME laufen.
tags: [gjsify, GNOME]
---

GNOME-Apps lassen sich in JavaScript schreiben. Die Laufzeit heißt GJS und basiert auf SpiderMonkey.
GJS ist aber weder Node.js noch ein Browser: Es gibt kein `node:fs`, kein `fetch`, kein
`<canvas>` und kein npm-Ökosystem. Viele Bibliotheken, ob HTTP-Client, Game-Engine oder
Krypto-Bibliothek, setzen APIs voraus, die GJS nicht hat.

[gjsify](https://gjsify.org/) schließt diese Lücke. Es baut die Node.js-, Web- und DOM-APIs auf
GNOMEs eigenen Bibliotheken nach:

| Im Code | gjsify setzt es um auf |
| --- | --- |
| `node:fs`, `node:net`, `node:crypto` | Gio, GLib |
| `fetch`, `WebSocket`, `XMLHttpRequest` | Soup 3 |
| `<canvas>` 2D und WebGL | Cairo, Gtk.GLArea |
| WebRTC, WebAudio, `<video>` | GStreamer |
| `node:sqlite` | libsqlite3 |

Damit stehen die Standard-APIs in GJS zur Verfügung. Bibliotheken, die für Node.js oder den Browser
geschrieben wurden, laufen jetzt direkt unter GJS, ohne Browser-Engine und ohne
Node.js-Laufzeit. Es gibt keinen Zwischenserver, kein mitgeliefertes Chromium und keinen Aufruf von
Node. Heraus kommt eine echte GTK-4- und Adwaita-App, die sich als Flatpak ausliefern lässt und
trotzdem die Sprache der übrigen JavaScript-Welt spricht.

## Und andersherum

Wer lieber mit Node.js oder Bun arbeitet, kann das weiter tun. Dafür habe ich auch den umgekehrten
Weg gebaut: Die GJS-APIs, also GTK, Adwaita und alles andere, was GObject Introspection anbietet,
stehen auch unter diesen Laufzeiten zur Verfügung. So laufen alle nativen APIs unter allen
Laufzeiten.

Und sie verhalten sich dort gleich. Das stelle ich mit Tests sicher: Dieselben Tests prüfen die
Node.js-APIs, die Web-APIs, die GObject-Introspection-APIs und die GJS-Laufzeit-APIs auf jeder
Laufzeit, und das Ergebnis muss überall genau dasselbe sein. Deshalb lässt sich die Laufzeit
während der Entwicklung einfach wechseln, ohne den Code anzufassen.

Das öffnet auch andere Systeme: Mit gjsify lassen sich GJS-Apps für macOS und Windows ausliefern,
als `.app` und `.dmg` beziehungsweise als Programmordner und `.msi`.

## Was ich davon wollte

- **Zuerst nativ auf GNOME.** GJS ist das Hauptziel.
- **Das Ökosystem, unverändert.** Der Test ist, ob npm-Pakete so laufen, wie sie sind. Die
  Game-Engine Excalibur.js, WebTorrent, socket.io, three.js, axios und das Anthropic-MCP-SDK laufen
  über gjsify auf GJS, geprüft mit ihren eigenen Upstream-Tests.
- **Ein Quelltext, mehrere Laufzeiten.** GJS, Node.js, Bun, der Browser und
  NativeScript. Jedes Paket gibt an,
  welche davon es erreicht, und der Build wählt die passende Implementierung.
- **Kein Node.js nötig.** Installieren, Bauen, Starten, Testen, Veröffentlichen und der
  Flatpak-Schritt laufen auf GJS selbst.

## Warum ich meine Apps so baue

TypeScript, das Web und sein Werkzeug kenne ich gut, und ich will GNOME-Apps schreiben, ohne das zu
verlassen. [ts-for-gir](https://github.com/gjsify/ts-for-gir) liefert mir Typen für GTK und jede
andere introspektierbare Bibliothek, gjsify die APIs und die Werkzeugkette. Meine eigenen Apps wie
[Beifahrer](https://jumplink.eu/beifahrer/), [Steuererklärung](https://jumplink.eu/steuererklaerung/)
und [Learn 6502 Assembly](https://flathub.org/apps/eu.jumplink.Learn6502) sind der erste Test:
Fehlt etwas, behebe ich es in gjsify, statt es in der App zu umgehen.

Der Code liegt auf [GitHub](https://github.com/gjsify/gjsify), die Dokumentation auf
[gjsify.org](https://gjsify.org/gjsify/).
