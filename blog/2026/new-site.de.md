---
title: Ein neues jumplink.eu, gebaut mit den eigenen Werkzeugen
date: 2026-10-26
summary: jumplink.eu ist jetzt eine statische Seite aus @gjsify/site — demselben Paket, das die Seiten meiner GNOME-Apps baut.
tags: [gjsify, GNOME]
draft: true
---

Jahrelang war jumplink.eu ein einseitiger Lebenslauf in Riba.js, meinem eigenen Web-Framework. Er
funktioniert noch, sagte aber nicht mehr, woran ich meine Zeit verbringe: an
[gjsify](https://gjsify.org/) und den GNOME-Apps, die ich damit baue.

Die neue Seite erzeugt `@gjsify/site`, das Paket, das schon die Download-Seiten von
[Beifahrer](https://jumplink.eu/beifahrer/) und [Steuererklärung](https://jumplink.eu/steuererklaerung/)
aus ihren AppStream-Metadaten baut. Dafür hat es zwei Dinge gelernt:

- **Entwicklerseiten.** Statt der Metadaten einer App kann eine Seite eine Person beschreiben: ein
  Hub, der ihre Apps verlinkt, und ein Lebenslauf aus einer [JSON-Resume](https://jsonresume.org/)-Datei
  je Sprache.
- **Ein Blog.** Markdown-Dateien in git, mit Frontmatter für Titel, Datum und Tags. Der Build
  schreibt eine Übersicht, Tag-Seiten, einen Atom-Feed je Sprache und je Tag und eine
  Vorschaukarte für jeden Beitrag.

Beides ist schlichte Konfiguration in der `package.json`; wer mit gjsify eine App-Seite baut, kann
genauso einen Blog ergänzen. Die Pixelschrift und die ungeglätteten Bilder sind eine Theme-Option,
kein Fork.

Die alte Seite bleibt im Repository unter dem Tag `v2-riba` erhalten.
