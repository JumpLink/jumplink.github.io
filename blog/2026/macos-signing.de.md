---
title: Mit gjsify GNOME-Apps für Linux, macOS und Windows ausliefern
date: 2026-11-01
summary: gjsify ship baut aus deiner App Pakete für Linux, macOS und Windows. Für den Mac signiert und notarisiert es jetzt auch, mit einem Befehl und ohne Packaging-Dateien im Repo.
tags: [gjsify, macOS]
---

Eine App zu schreiben ist die eine Hälfte, sie bei Leuten zum Laufen zu bringen die andere. Mit
`gjsify ship` baust du aus deinem Projekt installierbare Pakete, ohne Packaging-Dateien im Repo
und ohne `dpkg-deb`, `rpmbuild` oder `hdiutil` von Hand zu bedienen. Neu ist, dass `ship` für macOS
jetzt auch **signiert und von Apple notarisieren lässt**. Das habe ich bei drei Apps benutzt:
[Learn 6502 Assembly](https://github.com/JumpLink/easy6502),
[Steuererklärung](https://github.com/JumpLink/steuererklaerung) und
[Beifahrer](https://github.com/JumpLink/beifahrer). Alle drei gibt es jetzt als dmg für Apple
Silicon und für Intel, und macOS öffnet sie ohne Warnung.

## Ein Befehl pro Betriebssystem

`ship` führt das `build`-Skript deines Projekts aus, stellt eine Nutzlast zusammen und verpackt sie
je Format. Welche Bibliotheken eine Linux-Distribution braucht, liest es aus deinem Bundle. Die
Einstellungen stehen in einem `gjsify.ship`-Block in der `package.json`.

```sh
gjsify ship linux --target deb,rpm,appimage
gjsify ship darwin --arch arm64 --target macos-app-zip,macos-app-dmg
```

Linux bekommt `.deb`, `.rpm` und AppImage. Für den Mac entstehen eine `.app` als `.zip` und als
`.dmg`, eine Architektur pro Lauf. Die Apps tragen ihre Laufzeit selbst mit: Wer sie
herunterlädt, braucht weder GJS noch GTK auf dem Rechner. Windows bekommt einen MSI-Installer. Den
signiere ich noch nicht, dazu unten mehr.

## Signieren und notarisieren

Ohne Signatur öffnet macOS eine heruntergeladene App nicht, das Quarantäne-Flag des Browsers lässt
Gatekeeper sie ablehnen. Dafür brauchst du drei Dinge:

- eine Mitgliedschaft im Apple Developer Program,
- ein Zertifikat vom Typ *Developer ID Application* im Schlüsselbund,
- einen Zugang für `notarytool`, zum Beispiel einen App-Store-Connect-API-Schlüssel, abgelegt als
  Profil mit `xcrun notarytool store-credentials`.

Dann kommen zwei Flags dazu:

```sh
gjsify ship darwin --arch arm64 --target macos-app-dmg \
  --sign "Developer ID Application: Dein Name (TEAMID)" \
  --notarize mein-notary-profil
```

`--sign` signiert jedes ausführbare Bild in der App, das dmg-Image dazu. `--notarize` schickt
das Ergebnis an Apple, wartet auf die Freigabe und heftet das Ticket an die Datei. Fehlt die
Identität, packt `ship` ohne Signatur und sagt das laut. Ein stilles „signiert“ gibt es nicht.

In CI läuft das auf einem Mac-Runner. Zertifikat und API-Schlüssel liegen als Secrets im
Repository, der Job importiert sie in einen Wegwerf-Schlüsselbund. Bei mir hängen an jeder App fünf
Secrets, und die Releases baut die CI. Danach prüft der Job pro Architektur
`codesign --verify`, `spctl` mit gesetztem Quarantäne-Flag und `stapler validate`.

## Was ich unterwegs gelernt habe

Den Stolperstein habe ich bei Steuererklärung gefunden, und er lag im Werkzeug, nicht in der App:
Der Umlaut im Namen machte die Signatur ungültig. `codesign` leitet den Bezeichner des mitgelieferten
Interpreters aus dem Dateinamen ab, und das dmg speichert Namen anders zerlegt als das Siegel sie
berechnet hat. Das `.zip` war in Ordnung, dieselbe App im eingehängten dmg nicht. Notarisierung und
`stapler validate` bestehen trotzdem, erst Gatekeeper lehnt die App beim Start ab.
`ship` behandelt beides inzwischen selbst
([#2466](https://github.com/gjsify/gjsify/pull/2466),
[#2480](https://github.com/gjsify/gjsify/pull/2480), enthalten ab gjsify 0.64.14), und ein Test
mountet ein dmg mit Umlaut in den Dateinamen und prüft die Signatur darin. Du musst dafür nichts
tun, auch nicht bei einem Namen wie „Steuererklärung“.

Die Lehre daraus gilt für jede Auslieferung: Prüfe das fertige dmg auf einem echten Mac. Ich nehme
das MacBook für arm64 und eine macOS-VM für Intel. Beide bekommen das Quarantäne-Flag wie nach einem
Browser-Download, dann `spctl` und `codesign --verify --deep --strict` auf der App im eingehängten
Image. Eine grüne CI hätte den Fehler allein nicht gezeigt.

## Und Windows?

Das MSI baut `ship` schon, und die CI installiert und startet es testweise. Es ist aber unsigniert,
und Windows warnt davor. Das Zertifikat von Microsoft steht noch aus, danach folgt die Anbindung an
die CI.

Mehr zu den Formaten steht in der Anleitung
[Ship your app](https://gjsify.org/gjsify/ship/).
