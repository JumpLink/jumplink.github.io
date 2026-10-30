---
title: Learn 6502 Assembly, a GNOME app
date: 2026-10-29
summary: Learn 6502 Assembly is a GNOME app with tutorial, editor, debugger and a virtual display, based on Nick Morgan's easy6502.
tags: [GNOME, gjsify]
---

The 6502 is the processor of the Commodore 64, the NES and the Apple II. Nick Morgan's
[easy6502](https://github.com/skilldrick/easy6502) is a web tutorial that teaches its assembly
language step by step. I turned it into a native GNOME app: **Learn 6502 Assembly**.

What is in it:

- **An interactive tutorial** that walks through the core concepts.
- **A code editor** with syntax highlighting.
- **An assembler and a debugger** that show registers, flags and memory while the code runs.
- **A virtual display** where you see the result, which is what makes small games and graphics
  possible.

It is written in TypeScript with GJS and libadwaita, and built with [gjsify](https://gjsify.org/).
The repository holds more than the desktop app: the assembler, simulator and disassembler live in
their own package, `@learn6502/core`, and the same code also drives a web version and an Android
app. The tutorial content and the translations are separate packages too, and translating happens on
Weblate.

The app is on [Flathub](https://flathub.org/apps/eu.jumplink.Learn6502). The code is GPL-3.0; the
tutorial text is CC BY 4.0, as in the original.
