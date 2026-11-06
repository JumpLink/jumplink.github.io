---
title: Learn 6502 läuft jetzt auf Linux, macOS, Windows und Android
date: 2026-11-06
summary: Learn 6502 Assembly läuft jetzt auf Linux, macOS, Windows und Android, alles aus einer TypeScript-Codebasis. Wie gjsify das möglich macht und welche Rolle KI dabei spielt.
tags: [gjsify, GNOME, Android]
---

Ich freue mich, dass [Learn 6502 Assembly](https://jumplink.eu/Learn6502/de/) ab Version 0.9.0 auf
Linux, macOS, Windows und Android läuft 🐧🍏🪟🤖. Auf dem Smartphone lief Learn 6502 übrigens schon vorher, auf
meinem OnePlus 6T mit [postmarketOS](https://postmarketos.org/) als ganz normale GNOME-App. Neu ist,
dass es jetzt auch auf Android läuft.

![Learn 6502 auf zwei Smartphones im Herbstlaub: links ein OnePlus 6T mit postmarketOS und GNOME Mobile, rechts ein Samsung Galaxy S9 mit /e/OS](learn6502-everywhere-phones.webp "Learn 6502 auf zwei Smartphones im Herbstlaub: links ein OnePlus 6T mit postmarketOS und GNOME Mobile, rechts ein Samsung Galaxy S9 mit /e/OS")

Alle Downloads findest du auf der [App-Seite](https://jumplink.eu/Learn6502/de/). Unter
Linux ist [Flathub](https://flathub.org/apps/eu.jumplink.Learn6502) weiterhin der empfohlene Weg. Was
die App kann, steht im [ersten Artikel](/de/blog/learn6502/). Hier geht es darum, wie eine GNOME-App
auf vier Systeme kommt, ohne dass ich vier Apps pflegen muss.

## Ein Code, vier Systeme

Learn 6502 ist in TypeScript geschrieben, die Oberfläche in Blueprint für GTK 4 und libadwaita.
Dieser Code läuft überall, nur jeweils auf einer anderen Laufzeit:

| System | Laufzeit | GTK und Adwaita kommen von |
| --- | --- | --- |
| Linux | [GJS](https://gjs.guide/) | der GNOME-Runtime im Flatpak |
| macOS, Windows | [Node.js](https://nodejs.org/) | [`@gjsify/node-gi`](https://gjsify.org/gjsify/projects/node-gi/) und einer mitgelieferten GTK-Laufzeit |
| Android | [NativeScript](https://nativescript.org/) | [`@gjsify/adwaita-nativescript`](https://gjsify.org/gjsify/adwaita/), echten Android-Views im Adwaita-Stil |

Unter Linux ist Learn 6502 eine normale GJS-App. Für macOS und Windows habe ich die
Laufzeitumgebung von GJS für Node.js nachgebaut. `@gjsify/node-gi` lädt `gi://`-Namespaces wie GLib,
Gtk und Adw in Node.js und verhält sich dabei wie GJS. Die Grundlage war
[node-gtk](https://github.com/romgrk/node-gtk), daraus ist node-gi entstanden und inzwischen
weitgehend neu geschrieben. Damit ich mich auf "verhält sich wie GJS" verlassen kann, laufen
dieselben Tests auf beiden Laufzeiten.

Auf Android gibt es kein GTK. Dort läuft die App in NativeScript, und `@gjsify/adwaita-nativescript`
baut aus denselben Blueprint-Dateien native Android-Views, die aussehen wie libadwaita. Ein WebView
ist nicht im Spiel. GLib und GObject kommen auch hier über node-gi.

Dass GTK unter Android nicht laufen kann, stimmt so allerdings nicht mehr. Florian "sp1rit" arbeitet
an einem Android-Backend für GTK, und [GeopJr](https://geopjr.dev/) zeigt auf
[GTK 4 Android](https://gtk4android.geopjr.dev/) inoffizielle Test-Builds von GTK- und
Adwaita-Apps wie der Adwaita-Demo oder Tuba. Damit experimentieren wir auch: Mit
`@gjsify/gi-runtime-android-gtk` bringt gjsify GTK 4 und libadwaita in eine NativeScript-App. Wenn
das gut genug läuft, können wir uns den Nachbau der Adwaita-Widgets sparen und echtes GTK auf
Android nutzen.

Die Android-Version ist noch experimentell. Die Grundlagen funktionieren, du kannst das Tutorial
lesen, Code schreiben und ihn auf der Konsole laufen lassen. Rechne aber damit, dass hier und da
noch etwas hakt.

## Und andersherum

Die Brücke führt in beide Richtungen. [gjsify](https://gjsify.org/gjsify/) bringt Node.js- und
Web-APIs nach GJS und setzt sie auf GNOMEs eigenen Bibliotheken um: `node:fs` auf Gio, `fetch` auf
Soup, [`node:sqlite`](https://nodejs.org/api/sqlite.html) auf libsqlite3.

Neu ist [`@gjsify/napi`](https://gjsify.org/gjsify/projects/napi/), eine Umsetzung von
[Node-API](https://nodejs.org/api/n-api.html) für GJS. Damit lädt GJS native Node.js-Module, also
`.node`-Dateien, die eigentlich für Node.js kompiliert wurden.
[better-sqlite3](https://github.com/WiseLibs/better-sqlite3) läuft so unverändert in GJS und liefert
byteweise dieselben Ergebnisse wie unter Node.js.

Mich beeindruckt, was mit KI inzwischen möglich ist. Node-API für GJS umsetzen oder die
Adwaita-Widgets für Android nachbauen, das wäre für mich allein vor ein paar Jahren nicht machbar
gewesen.

Der Code ist damit in beide Richtungen kompatibel. Welche Laufzeit ich nehme, entscheide ich beim
Bauen und nicht beim Schreiben.

gjsify selbst läuft ebenfalls auf GJS. Installieren, Bauen, Testen, das Flatpak und die Pakete für
macOS und Windows gehen auf einem Rechner ohne Node.js. Node.js ist eine Laufzeit, die du wählen
kannst, keine Pflicht. Mehr dazu in [Warum gjsify](/de/blog/why-gjsify/) und
[Mit gjsify GNOME-Apps für Linux, macOS und Windows ausliefern](/de/blog/macos-signing/).

## Ein großes Experiment

gjsify ist noch stark in Entwicklung und im Grunde ein großes Experiment. Die Idee: Jedes
JavaScript, ob für Node.js oder den Browser geschrieben, soll in einer nativen Adwaita-App laufen.
Ein guter Teil davon funktioniert schon. Die Game-Engine Excalibur.js, three.js, socket.io und
WebTorrent laufen über gjsify auf GJS, geprüft mit ihren eigenen Test-Suites. Was noch fehlt, steht
im [Projektstatus](https://github.com/gjsify/gjsify/tree/main/status).

## Angefangen hat es ohne KI

Angefangen hat alles mit [ts-for-gir](https://github.com/gjsify/ts-for-gir). Ich wollte GNOME-Apps
in TypeScript schreiben und brauchte dafür Typen für GTK und die anderen GObject-Bibliotheken.
KI-Werkzeuge gab es damals nicht. Rund drei Jahre habe ich in meiner Freizeit daran gearbeitet, bis
Parser und Generator wirklich gute Typen erzeugt haben. Heute schreibt man so einen Generator mit KI
in kurzer Zeit, und er funktioniert sogar gut. Inzwischen gibt es auch neue Projekte wie
[GTKX](https://gtkx.dev/), die ihre Bindings ebenfalls aus GObject Introspection erzeugen.

Learn 6502 selbst habe ich noch weitgehend von Hand geschrieben. Geholfen hat eine bessere
KI-Autovervollständigung, und schon die war viel wert.

Auch gjsify habe ich ohne KI begonnen. Einige Node.js-Module wie `node:fs` habe ich von Hand
nachgebaut und viel ausprobiert. Für eine Person war das Projekt aber zu groß. Mit KI hat sich das
geändert, heute entsteht gjsify fast vollständig durch Agentic Coding.

Die Regeln gebe ich vor. Linux-Standards wie die
[XDG Desktop Portals](https://flatpak.github.io/xdg-desktop-portal/), GJS und Web-Standards haben
immer Vorrang, und wo es einen offenen Standard gibt, nutzen wir ihn. Fehlt einer App etwas, wird es
in gjsify gebaut, mit Test, statt es in der App zu umgehen. Damit komme ich gerade zu sehr guten
Ergebnissen. Ohne diese Hilfe wäre Learn 6502 nicht auf Android und Windows angekommen.

## Warum ich KI trotzdem nutze

Ich weiß, dass KI in der Open-Source-Szene verpönt ist, und das aus gutem Grund. Die Trainingsdaten
wurden ohne Zustimmung genommen, der Energieverbrauch ist hoch, und die gesellschaftlichen Folgen
werden groß sein. Das alles sehe ich sehr kritisch. Aufhalten werden wir diese Entwicklung aber
nicht, indem wir KI ablehnen oder ignorieren.

Was wir tun können, ist KI als Werkzeug für mehr und bessere freie Software zu nutzen. Software, die
uns unabhängiger von großen Konzernen macht. Und wir sollten gemeinsam offene Modelle fördern, damit
die beste KI am Ende nicht einigen wenigen Menschen oder Unternehmen gehört.

Deshalb habe ich auch [Steuererklärung](https://jumplink.eu/steuererklaerung/) gestartet. Mit der
App kann jeder in Deutschland seine Steuererklärung kostenlos machen. Gerade Menschen mit wenig Geld
geben oft keine Steuererklärung ab und haben dadurch am Ende noch weniger. Mein Ziel ist, die App so
einfach zu machen, dass das kein Hindernis mehr ist.

## Ausprobieren

- Learn 6502: [Downloads](https://jumplink.eu/Learn6502/de/),
  [Quellcode](https://github.com/JumpLink/Learn6502), Übersetzen auf
  [Weblate](https://hosted.weblate.org/engage/eu-jumplink-learn6502/)
- gjsify: [Dokumentation](https://gjsify.org/gjsify/), [GitHub](https://github.com/gjsify/gjsify),
  und für den Einstieg [Eine GNOME-App in TypeScript, in fünf Minuten](/de/blog/gjsify-first-app/)

Ich hoffe, dass gjsify auch für dich ein nützliches Werkzeug ist. Rückmeldungen und Fehlerberichte
nehme ich gern auf [GitHub](https://github.com/gjsify/gjsify/issues) entgegen.
