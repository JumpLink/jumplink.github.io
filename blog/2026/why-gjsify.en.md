---
title: Why gjsify
date: 2026-10-28
summary: gjsify brings the standard Node.js and web APIs to GJS, so TypeScript apps and npm packages run natively on GNOME.
tags: [gjsify, GNOME]
---

GNOME apps can be written in JavaScript. The runtime is GJS, powered by SpiderMonkey. But GJS is
neither Node.js nor a browser: there is no `node:fs`, no `fetch`, no `<canvas>` and no npm
ecosystem waiting for you. Many libraries, whether an HTTP client, a game engine or a crypto
library, assume APIs that GJS does not have.

[gjsify](https://gjsify.org/) fills that gap. It reimplements the Node.js, web and DOM APIs on top
of GNOME's own libraries:

| You write | gjsify runs it on |
| --- | --- |
| `node:fs`, `node:net`, `node:crypto` | Gio, GLib |
| `fetch`, `WebSocket`, `XMLHttpRequest` | Soup 3 |
| `<canvas>` 2D and WebGL | Cairo, Gtk.GLArea |
| WebRTC, WebAudio, `<video>` | GStreamer |
| `node:sqlite` | libsqlite3 |

This makes the standard APIs available in GJS. Libraries written for Node.js or the browser now run
directly on GJS, with no browser engine and no Node.js runtime. There is no wrapper server, no
bundled Chromium and no shelling out to Node. The result is a real GTK 4 and Adwaita app that you
can ship as a Flatpak and that still speaks the language of the wider JavaScript world.

## And the other way round

If you prefer Node.js or Bun, you can keep using them. For that I built the reverse direction too:
the GJS APIs, meaning GTK, Adwaita and everything else GObject Introspection offers, are available
under those runtimes as well. So every native API runs on every runtime.

And it behaves the same there. Tests make sure of that: the same tests check the Node.js APIs, the
web APIs, the GObject Introspection APIs and the GJS runtime APIs on each runtime, and the result has
to be exactly the same everywhere. That is why you can switch the runtime during development without
touching the code.

It opens up other systems as well: with gjsify you can ship GJS apps for macOS and Windows, as an
`.app` and `.dmg`, or as a program folder and `.msi`.

## What I wanted from it

- **Native on GNOME first.** GJS is the main target.
- **The ecosystem, unmodified.** The test is whether npm packages run as they are. The Excalibur.js
  game engine, WebTorrent, socket.io, three.js, axios and the Anthropic MCP SDK all run on GJS
  through gjsify, checked against their own upstream tests.
- **One source, several runtimes.** GJS, Node.js, Bun, the browser and
  NativeScript. Each package says which of
  them it reaches, and the build picks the right implementation.
- **No Node.js required.** Install, build, run, test, publish and the Flatpak step all run on GJS
  itself.

## Why I build my apps this way

I know TypeScript, the web and its tooling well, and I want to write GNOME apps without leaving
that. [ts-for-gir](https://github.com/gjsify/ts-for-gir) gives me types for GTK and every other
introspected library, gjsify gives me the APIs and the toolchain. My own apps, such as
[Beifahrer](https://jumplink.eu/beifahrer/), [Steuererklärung](https://jumplink.eu/steuererklaerung/)
and [Learn 6502 Assembly](https://flathub.org/apps/eu.jumplink.Learn6502), are the first test: if
something is missing, I fix it in gjsify instead of working around it in the app.

The code is on [GitHub](https://github.com/gjsify/gjsify), the documentation at
[gjsify.org](https://gjsify.org/gjsify/).
