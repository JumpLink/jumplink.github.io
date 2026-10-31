# Design: "Am Deich"

The look of jumplink.eu. Read this before touching a template or the CSS.

## Idea

Pascal lives in Cuxhaven, on the North Sea coast. The site is that coast: you arrive above the
water, with the **Kugelbake** (Cuxhaven's beacon) on the horizon and the name standing in the
sky; you scroll down and the sea darkens, the waves go out, and you end up in quiet deep water
where the reading happens. The scene is pixel art; the page is not. That contrast is the whole
design — a small, hand-set world above large, modern type.

Four rules keep it from turning into a costume:

1. **Reading comes first.** Type is large, set in a modern grotesk, and no line of it ever sits
   on top of the picture. Where they would meet, the picture moves.
2. **Pixels are an accent, not a skin.** The scene, the avatar and small kickers are pixel art.
   Everything else — buttons, body text, the few remaining frames — is plain: thin 1px lines,
   modest radius, no 9-slice borders, no dialogue boxes.
3. **One motif.** The scene happens once, at the top of the document. It does not repeat, it does
   not tile, and it does not follow you down the page.
4. **Free-standing by default.** Text sits on the page, not in a card. A box is for one thing that
   really is an object; a section of a page is not an object.

## Vocabulary

| Site part | Motif | Notes |
| --- | --- | --- |
| Background | The coast, once, at the top of the document | A band that scrolls away into deep water |
| Navigation | A list in the margin, on every page | Sidebar on desktop, off-canvas drawer below 1000 px |
| Home, upper | The name standing in the sky | No box, no card; the largest type on the site |
| Home, lower | The figure on the dike, the finished sheet beside it | Sheet is **locked**: the character exists already |
| Projects | Free-floating windows, each a screenshot | Drifting idly, lifting on hover; no card around them |
| Blog | **Logbuch** (ship's log) | Index lists entries with the date as a kicker; posts read like articles |
| CV | Character sheet, long form | No portrait or intro (the home page has both): a title, work as a timeline, skills; prints plain with name, label and contact at the head |
| Support, privacy, legal notice | Plain pages | Prose in a measure, nothing else |

Section kickers are small monospace caps with wide letter spacing (`letter-spacing: .22em`),
taken from the talk [agentic coding](https://jumplink.eu/talk-agentic-coding/).

## Layout and navigation

One shell, every page: `.shell` is a two-column grid of `var(--side-w)` and the content column.
The sidebar is sticky, has no background of its own and is set in the same grotesk as the page —
navigation as a list in the margin, not a bar across the top. There is no header.

It holds **nothing but the navigation and the language switch**. The name and the city used to
stand above it, which repeated on every page what the home page already says in the sky and what
the CV says in its own fields — three copies of one fact, and the sidebar is the only one of the
three that is not making a point. Removing them left the site without a link home, so "Home page"
became the first nav item. (The msgid is `'Home page'` → "Startseite". `'Home'` is already taken
by the CV's location field, where German wants "Zuhause" — the same English word, two different
sentences.)

Every entry leads to its own page. An "Apps" entry that jumped to `#apps` on the home page was
dropped: a menu item that lands on the home page and scrolls read as a second "Home page".

Below 1000 px the grid collapses and the sidebar becomes an off-canvas drawer, but **only under
`html.js`**: without JavaScript the nav list stays in the flow, because a toggle that cannot
toggle is worse than a visible list. The toggle, the backdrop and the drawer transform are all
gated on that class, which is set in `<head>` so there is no flash of the wrong layout.

Width is the other half of it. `.wrap` is `86rem` wide with a `--gutter` that grows with the
viewport, type is `clamp()`-sized throughout, and **free-standing text is the default**: a box
(`.frame`, `.quest`) is for a single element that really is an object — a quest — never for a
section of the page.

## Palette jumplink16

Used **only** for UI and the scene. Characters (the avatar, other figures) keep their own colours.

| Token | Hex | Role |
| --- | --- | --- |
| `--p0` | `#0e0a1a` | night, dark background |
| `--p1` | `#1f1638` | dark surface |
| `--p2` | `#2f2056` | raised surface, dike |
| `--p3` | `#46307d` | hairlines on light |
| `--p4` | `#6b3fd4` | accent (light mode) |
| `--p5` | `#8b65e8` | accent hover |
| `--p6` | `#b69cff` | accent (dark mode) |
| `--p7` | `#ddd0ff` | light surface, moon |
| `--p8` | `#f4f0ff` | paper, foam |
| `--g0` | `#5a4b6e` | muted text on light |
| `--g1` | `#9a8fb0` | muted text on dark |
| `--s0`…`--s3` | `#f6d3ae` `#e8b07a` `#b0644a` `#7d4436` | sand, dunes, wood |
| `--gold` | `#ffcf4a` | sun and stars — **scene only** |
| `--sea` | `#3fd0c9` | the sea — **scene only** |
| `--rose` | `#e05a8a` | rare highlight |

**The accent is purple, everywhere.** Links, focus rings, the talent-tree
pips: all `--p4`…`--p6`, never the teal or the gold. A link on dark is `#c4a6ff`, on light the
darker `#3f1f9e`, and neither glows: a purple halo under the links read as a second, louder style
next to the flat pixel picture, and it went; both clear AA against their background. The two
bright palette entries stay defined because the *picture* needs them — a sun is gold, the sea is
teal — but nothing in the interface may borrow them, or the site has three accents and no accent.
The red and green on the Kugelbake are the exception that proves it: those are navigation lights,
part of the scene, not UI colour.

A second set of tokens dresses panels — `--win-bg`, `--win-title`, `--slot-bg` / `--slot-line` for a talent slot, `--raised-solid` for
an opaque panel. They are aliases onto the palette above, so a palette change carries.

`--shade` is the shadow colour and a plain colour like any other; every use is
`color-mix(in srgb, var(--shade) <alpha>, transparent)`. It used to be **space-separated** bare
channels for `rgb(var(--shade) / <alpha>)`, and written with commas that expands to
`rgb(8, 6, 22 / .5)` — legacy and modern syntax mixed, invalid, and it takes the whole declaration
with it in silence. That typo once killed every drop shadow, both window rings and the drawer
backdrop at the same time, and nothing in the build reports it. A colour token cannot be written
that way at all, which is the reason it is one now; should a bare-channel token ever come back, it
follows the old rule.

Dark mode is the coast at night, light mode the same coast at a hazy noon.

**Every colour is one `light-dark(day, night)` pair, not a day block plus a
`prefers-color-scheme` override.** `:root` declares `color-scheme: light dark`, and that is the
whole of the scheme branching for colour. The reason is the easter egg below: clicking the sun
forces a scheme by setting `color-scheme` on `<html>`, which `light-dark()` follows and a media
query cannot see. Two parallel lists of thirty tokens would have drifted apart the first time one
of them was edited alone, and the forced scheme is exactly where that drift would show. The price
is a browser floor of Baseline 2024 (Chrome 123, Firefox 120, Safari 17.5) — the same floor
`color-mix()` already set here.

Two values are left over, because `light-dark()` only takes colours: `--sky-mid` / `--sky-far`,
the two middle stops of the sky gradient, which sit a little higher at night. Those get a block per
scheme — four of them, so a
forced scheme beats both the default and the media query.

The background follows the scheme **live**: a change of scheme rebuilds the scene without a
reload, whether it came from the system or from a click on the disc.

## The background

The scene is **a band at the top of the document, not a wallpaper**. `.bg` is absolutely
positioned at `top: 0`, `var(--scene-h)` tall, `z-index: -1`, `pointer-events: none`; the page
scrolls past it and `html { background: var(--deep) }` carries on underneath — dark blue at night,
a pale blue-grey by day. A fourth layer, `.bg-deep`, fades the band into that colour from
`--deep-at` down (62 % on the home page, 78 % on the short strip everywhere else), and the waves
and the glitter fade out with depth on their own (`WAVE_OPACITY`,
`GLITTER_OPACITY`), so the sea gets calmer the further down it goes and the reader ends up in
quiet water. Nothing dims as you scroll: the picture simply ends.

`--scene-h` is clamped in **pixels** (`clamp(620px, 82vh, 820px)`), not in `vh` alone. A
viewport-only height grows with the viewport, and a full-page screenshot makes the viewport as
tall as the document — which once rendered the Kugelbake as tall as the figure. A phone gets a
shorter band (`clamp(420px, 62vh, 620px)`), a screen from 1600 px up a taller one
(`clamp(820px, 92vh, 1040px)`): there, `--bg-unit` is driven by the *width*, so the scene scales
up and the sun or moon would otherwise sit behind the name instead of above it.

All of these live on **`body`**, not on `:root`. A custom property substitutes on the element
that declares it, so a `:root` copy would never see `body:not(.home)`'s shorter `--scene-h` and
the strip pages would compute their geometry from the home page's numbers. `.bg` only does
position and height.

Only the home page gets the full band. Everywhere else (`body:not(.home)`) it is a strip, and the
prose starts below it: an article has nothing to put in the sky, and a Kugelbake behind a
paragraph is not a background, it is a thing in the way of the text.

Inside the band, three layers:

1. **`.bg-sky`** — the sky as a plain CSS gradient (`--sky`). Smooth on purpose: a gradient drawn
   into a 320×180 canvas and scaled up bands badly.
2. **`.bg-svg`** — the scene as a static SVG of `<rect>`s, inline in the HTML. This is what a
   reader sees without JavaScript and under `prefers-reduced-motion: reduce`. Its fills are CSS
   variables (`--bg-star`, `--bg-disc`, `--bg-glitter`, `--bg-foam`, `--bg-wood`,
   `--bg-sea{Far,Mid,Near}`, `--bg-harbour`, `--bg-lamp{Warm,White}[-water]`), so one SVG serves
   both schemes. The harbour is a second, small SVG, `.bg-harbour` (see below).
3. **`.bg-canvas`** — the animated scene, created by JavaScript and only once it runs, so a reader
   without it never meets an empty canvas. When it appears, `.bg--live` hides the SVG.

The canvas is an [Excalibur](https://excaliburjs.com/) engine at 320×180 logical pixels with
`antialiasing: false`, `suppressHiDPIScaling: true` and `image-rendering: pixelated`, scaled by an
integer factor (2…12) so every source pixel stays square. Geometry lives in two places that must
agree — `src/bg/browser.ts` and the `.bg*` rules in `site.css`: the horizon at `--horizon-at`
(62.22 % of the band, `HORIZON / H`) and the view at `--view-x` (the scene column at the viewport's left edge).
Both are **owned by the stylesheet**; `browser.ts` reads them off the element with one generic
`cssRatio(host, name, fallback)` rather than keeping copies that drift, and both sides round the
scale with the same `round(up, …)` / `Math.ceil` so the moon does not jump when the canvas takes
over from the SVG.

The Kugelbake stands on the left (`BEACON_X` 36), in the gap between the sidebar and the headline;
a wide screen shows the scene from column 0. Without the sidebar (≤1000 px) the headline starts at
the left gutter, exactly where the beacon would be, so the view starts at column 40
(`--view-x`): the beacon's right third shows, cut off by the edge of the screen. The disc moved
from column 180 to 150 for that — a phone shows about 130 columns, and from column 40 on the disc
at 180 fell off the right edge. Earlier it stood on the right at 82 %, and every position
nearer the middle put it inside the headline.

On the right edge, a stretch of the harbour far off: sheds, a tower, one container crane. By day a
hazy silhouette, at night dark with warm and white lamps and their long, broken reflections on the
water. It is pinned to the **viewport's** right edge, `--harbour-edge` scene columns in (4), not to a column of the
scene — the scene pans, and a fixed column showed the harbour on one screen and cut it off on the
next. `browser.ts` moves the actor, the stylesheet places `.bg-harbour`; both round the edge down to
a whole column. Phones (≤480 px) set `--harbour-edge: -25`, so only its left third shows: the
tagline runs nearly to the right edge there, and the whole harbour stood in it. Inner pages leave the Kugelbake out (`--beacon: 0`): their band is
so short that the beacon reached up into the sidebar's links.

The name and the tagline stand at the top of the sky — level with the sidebar's first link on a
wide screen, just under the menu button on a phone — and the sun or moon hangs below them
(`DISC.y` 72); `.sky`'s `padding-top` is as large as reads well but capped so name, one line
of tagline and 1.5rem of air still fit above the disc's top row. The text used to start under the disc, which put it right in the middle of the
animated sky; above the disc it covers only the empty top rows.

The sea is three bands, far to near, each painted from a wandering upper edge (`bandTop`) down to
the floor. An ordered dither between the colours was the first attempt and read as exactly what it
was: a checked belt ruled across the whole width.

Always moving: the sea in three bands, the sun or moon, and at night the stars twinkling and the
harbour lamps flickering on the water. On top of that, timed events — the first after about 5 s,
then every 15–60 s: by day a container ship (rose containers, dark hull) on the horizon, a fishing
cutter or gulls; by night a shooting star, an aircraft with blinking navigation lights, now and
then a ship showing position lights. Ships sit in front of the sea layer: behind it, the water hid
the whole hull, and by day only a pale bridge was left against a pale sky.

Rules it keeps:

- Loaded **after** first paint, via `requestIdleCallback` and a dynamic `import()`. A missing or
  failed bundle is not an error: the static scene stays.
- `aria-hidden="true"`, never focusable, never in the tab order.
- Paused with `engine.clock.stop()` while the tab is hidden; frame rate capped.
- Not built at all under `prefers-reduced-motion: reduce`.

The bundle is produced by the gjsify CLI (`npm run bundle:bg` → `gjsify build src/bg/browser.ts
--app browser`) and hashed into `assets/bg-<hash>.js` by `build/site.ts`. It is **124 KiB
gzipped**, which is the price of the engine; it loads after the page is readable and never blocks
it.

### The sun and the moon switch the scheme

Whoever clicks the disc gets the other half of the day. There is no button to see: a transparent
`<button class="scheme-toggle">` sits exactly over the sun or the moon, the cursor turns into a
pointer on it, and that is the only hint it gives.

Its box is the disc's own bounding box in scene pixels — centre `(150, 72)`, radius 7, so columns
143…157 and rows 65…79 — placed with the same `--bg-unit`, `--bg-top` and `--bg-left` the scene is
placed with. **That makes the geometry pure CSS:** it follows every resize without a listener, and
it is the same box for the static SVG and for the canvas, because both are pinned to that one
integer grid. `--bg-left` exists only for this; it used to be a one-off `clamp()` inside
`.bg-svg`. The button is a child of `body`, not of `.bg` — that layer sits behind the page with
`pointer-events: none` — and it comes last in the source so it never gets in front of the skip
link in the tab order. Keyboard reaches it, `:focus-visible` rings it, and it has an i18n'd
`aria-label` ("Switch day and night" / "Tag und Nacht wechseln") because there is nothing inside it
to read.

**No JavaScript, no button:** the stylesheet only shows it once the inline script has marked
`<html>` as `js`, the same gate the drawer toggle uses. Nothing else changes.

A click puts the opposite of what is on screen into `data-scheme` on `<html>`, which sets
`color-scheme` and so carries every `light-dark()` token with it. Three things do not follow on
their own:

- **`<picture>` sources** match on a media query, and a media query cannot see an attribute. While
  an override is active the inline script rewrites each scheme `media` to `all` or `not all`; when
  the override is dropped it hands the source its own query back. The markup keeps the plain
  `media="(prefers-color-scheme: dark)"`, so the no-JavaScript path is untouched.
- **The canvas** has its own palette. An attribute change is not observable, so the script says so
  with a `jl:scheme` event on `window`, and `browser.ts` repaints the scene from it exactly as it
  already does from the media query.
- **The next page** starts from scratch. The choice goes into `localStorage` and a tiny script in
  `<head>` puts it back on `<html>` before the first paint. Reading it from the module at the end
  of the body would show one frame of the system scheme on every navigation, which is the flash
  this avoids.

**The way back to the system setting:** a click always shows the opposite of the current view, but
when that opposite is what the system asks for anyway, the override is *dropped* instead of pinned.
So two clicks return the page to `prefers-color-scheme` — and leave it free to follow a system that
changes later, instead of freezing it at today's answer. Nothing else on the site mentions the
scheme, so this is also the only way to clear it, which is why it has to be the obvious one.

The reward is a **dusk veil**: a fixed, full-bleed `.dusk` layer fades to 96 % over 820 ms with the
attribute flipped at 410 ms, so the page darkens, changes underneath, and comes back. It is not the
sun visibly setting, because there is one WebGL context — it cannot be duplicated and it repaints
the frame the palette changes. A veil covers that snap for the canvas and for the SVG fallback
alike. Under `prefers-reduced-motion: reduce` the blanket `animation: none` rule removes it and the
switch is instant.

## Type

| Role | Face | Notes |
| --- | --- | --- |
| Everything readable | **Adwaita Sans** (OFL), variable, self-hosted | `assets/fonts/adwaita-sans-latin.woff2`, latin + latin-ext, preloaded |
| The name | **Ark Pixel 10px** (proportional, OFL) | Only the name in the sky — only at 30 / 40 / 60 / 80 px |
| Code | the system monospace stack | No webfont |

Everything except the name is Adwaita Sans: headings (800/700, `letter-spacing: -.02em`), the CV
years (800, accent), kickers (semibold, uppercase, tracked `.18em`) and labels. Pixel type was
tried for headings and for labels; with the pixel figure, the pixel scene and pixel headings the
page read as mixed, so the pixel face is now the one teaser in the sky and the pixel look comes
from the images.

No CDN: both faces are files in the repo. The display font is configured once, in
`package.json` → `gjsify.site.theme.displayFont`.

The name on the home page is the largest thing on the site and it is set **in the pixel font**, at
the integer sizes 32 / 48 / 64 / 80 px (base, ≥720, ≥1280, ≥1600) with `letter-spacing: 0`. Ark
Pixel is a bitmap face: at 51.4 px from a `clamp()` it is a blurred grotesk wearing pixel
clothing, and the one place the typeface is actually doing the work is the one place it may not be
resampled. A `max-width: 18ch` keeps it from running under the Kugelbake. Print falls back to the
grotesk at 20 pt — a bitmap font at 300 dpi is a smudge. Everything that is read in sentences
stays Adwaita Sans. Headings do not sit in boxes.

## Pixel rules

What is left of pixel art follows the same rules as before:

- Every pixel image is a PNG at native size, shown at an **integer** scale (`×2`, `×3`, `×4`) with
  `image-rendering: pixelated`. The figure follows it too: its source is snapped to a real pixel
  grid (one source pixel per cell), so `jumplink.avatar.full.steps` is 1 and it shows at 1× or 2×.
  A source without a grid may set `steps: 3` to step by thirds (4/3×, 5/3×, …) — for the earlier
  gridless figure that kept the edges crisper than smooth resampling. Below 1× (`minScale`) the
  browser resamples it smoothly instead. `width`/`height` are set to the scaled size so nothing is
  resampled.
- The scene is drawn in code, never as a generated bitmap: palette tokens → `<rect>`s for the
  static SVG, palette tokens → cached `ex.Canvas` graphics for the animated one.
- The Kugelbake is a tapering, cross-braced lattice with a ball of crossed hoops on top. It is a
  wooden beacon, not a transmission tower; keep the taper and the hoops recognisable.
- The figure stands **on** the dike line, never in the water and never floating. How far its feet
  sit above the lower edge of the PNG is a property of the PNG, so it is configured
  (`jumplink.avatar.full.baseline`, in source pixels) and emitted as `--fig-floor`;
  `.figure::after` multiplies it by the current scale to put the line under the shoes. Hardcoding
  it means the next avatar hovers or wades.

## The home page

Two halves, and the split is the point.

**Above:** the name, set in the sky, free-standing, the largest type on the site. Under it one
line — the `label` from the resume, nothing else — and then open sky down to the waterline. There
is no card here and no "hero section"; the band *is* the picture.

**Below:** the figure standing on the dike, with the character sheet beside it. The sheet is
**finished**: this is not character creation, the character exists. Hence no "New character
created" kicker, no empty slots and no counting. There are no class/home facts and no buttons
beside the figure either: the tagline in the sky already says the class, and the sidebar already
links the logbook and the CV. The hero is pulled up into the scene band (`margin-top: -.36 ×
--scene-h`), so the figure's head reaches the waterline and it stands in front of the sea rather
than below it.

### No pixel window

The CV used to open with `.pixel-window`, a framed box with the bust portrait, the label and the
intro — all of which the home page already shows beside the figure. Pascal had it removed, and the
bust with it: the site has one avatar. The CV starts with a plain title like every other page.

`.frame` is still around for a flat box with a hairline.

### The skill tree

The skills are groups, not a meter: one `<h3>` per résumé group as an accent kicker, and one pixel
chip per keyword (`skillGroups()` in `src/templates/components.ts`). The home page and the CV call
the same function, so they look the same; free text behind a pip on the home page and chips in the
CV once showed the same data in two styles, and Pascal had them unified on the chips. There is no
visible "skill tree" label (it is the list's `aria-label`).

There are no numbers and no bars anywhere, because a bar invites the question "out of what?" and
any answer to that is a lie. There are also no framework names: a list of them dates the page the
moment one falls out of fashion, and four groups of three to five honest entries say more about
what someone can do than twenty logos. A claim that is not in `content/resume.*.json` as evidence
does not get a slot — that is how "teaching & talks" came out again.

A screen reader gets a nested list of named skills, which is the honest version of the same thing.
The CV renders the same data, so there is one list to keep true, not two.

## The avatar is swappable

The figure is not final. Its files and scale are configured in one place (`package.json` →
`jumplink.avatar`), never hardcoded in a template:

```json
"jumplink": {
  "avatar": {
    "full": { "src": "assets/pixel/pascal-full-fringe.png", "size": 768, "scale": 2,
              "minScale": 0.5, "steps": 1, "trim": 0.33, "baseline": 26 },
    "icon": "assets/pixel/pascal-bust.png"
  }
}
```

`icon` is only the favicon — the full figure is unreadable at 16 px — and falls back to the
figure when unset. Replacing the PNGs (same names) or pointing to new ones is the whole change. The source is used
as is — never downscaled at build time: halving a source without a pixel grid threw away the eyes
and the beard, and Pascal saw it side by side.

- `scale` is the largest factor the figure may reach.
- `steps` is how many stops there are per whole multiple, 1 by default. The home page picks the
  largest stop that fits (`round(down, min(78vw, 90vh), var(--fig-step))`, with `--fig-step =
  size / steps`), so a small window gets a smaller figure and the size does not drift with every
  pixel of window width. Keep 1 for real pixel art; the current source has no grid and uses 3.
- `minScale` is the floor, 1 by default. Below 1× the image is resampled smoothly (a `<style>`
  emitted next to the figure, at the matching breakpoint), since nearest-neighbour downscaling
  drops whole rows.

In practice, with the values above: 640 px in a 1440×900 browser window, 768 px at
1920×1080, 1152 px at 2560×1440, 256 px on a phone (heights minus the browser's own toolbars). The clamp against `90vh` keeps the figure inside the screen it
is standing in.

`trim` is the share of the PNG's width that is empty on each side. The figure is drawn in a square
frame, but a standing person is not square: without it the sheet beside the figure is pushed off
by a column of nothing. It shrinks only the space the image *claims* — the image itself still
draws at full width, overflowing into the margin — so the pixels are untouched and only the layout
changes.

## Projects on the home page

Also config, in `package.json` → `jumplink.projects`, in display order. Two shapes:

```json
"projects": [
  {
    "app": "https://jumplink.eu/Learn6502/",
    "image": { "light": "assets/projects/learn6502-light.webp" }
  },
  {
    "url": "https://gjsify.org/",
    "name": "gjsify",
    "summary": { "en": "…", "de": "…" }
  }
]
```

- **`app`** must match one URL in `gjsify.site.developer.apps`. Name, summary and icon then come
  from that app's metainfo, so translations stay out of `package.json`. An entry whose URL matches
  no app is skipped.
- **`url` + `name`** is for anything that is not one of those apps; `summary` is per language.
- **`image`** is optional. `light` is required, `dark` optional; the entry renders a `<picture>`
  with the dark source behind `media="(prefers-color-scheme: dark)"`. Without an image the project
  falls back to its icon and a line of text — that is a deliberate ranking, not a defect.

They are **windows, not cards**: no frame, no panel, no background. Each one lifts and tilts
slightly under the pointer and carries its name and one line of summary as free-standing text
underneath. Under `prefers-reduced-motion: reduce` nothing tilts.

**They do not drift.** An idle float (±6 px, ±0.3°, 6.4–9.8 s, staggered per window) was built
and tuned in round 3 and removed again: Pascal found it unnecessary once the windows stood still.

At most **two windows side by side**, at any width: fewer, larger screenshots read better than a
wall of them.

**Projects without a screenshot get their own list** (`.windows--plain`) below the screenshots,
in narrower columns. Mixed into the screenshot grid, an icon and one line of text went under
between two windows.

**Screenshots are shown as delivered.** `.shot img` has no `border-radius`, no `box-shadow` and
no `filter`: the window's own shadow and rounded corners are in the file's alpha channel, taken
with `headless-run --window-shot`, exactly as Flathub wants them. A shot whose shading is broken
is retaken in the app's repository, never patched on the page. Earlier rounds cropped the shots
to the window box, re-rounded the corners themselves and drew a CSS `drop-shadow` behind them;
Pascal rejected that as working around bad images instead of fixing them.

**All shots are the mobile layout, the same size, light and dark.** Every project on the home
page shows its narrow (360 px logical) window, so the windows line up as one row of equals, and
`light` and `dark` are both expected — the page follows the reader's scheme.

Screenshots: PNG or WebP with alpha, in `assets/projects/`; a conversion may resize but never
crop, flatten or recolour. **Only demo content.**
A screenshot of one of Pascal's own apps may not show a client name, a real amount, a tax number
or a real mailbox; a screenshot from an employer's private repository may not be published at all.
When in doubt the project goes without one.

## One look

A piece that appears on more than one page has one function in `src/templates/components.ts` and
one rule set in the "Shared pieces" section of `site.css`. Change it there and it changes
everywhere; do not give a page its own variant. Today that is `chips()` (the pixel chip: skills
and tags) and `skillGroups()` (the skills on the home page and the CV).

## The CV timeline

One 2 px rail down the left, a 10 px accent square on it per job, the job as free text beside it.
The date range in the kicker is the only date: a large year in its own column said the same thing
twice and split the page in two. Every highlight is shown; a "2 more" toggle hid half of a job.

## The logbook

Same rule as everywhere else: free-standing text, no boxes.

- **Tags are chips, like the skills.** The index and every tag page list all tags once under the
  h1; the current tag is a filled chip. Each entry on the index carries its own tags under its
  summary, and a post under its h1, as `rel="tag"` links. The kicker holds only the date (and
  "Entwurf"). Plain words in the kicker were tried first; Pascal wanted the same look as the skills.
- **A feed per topic.** Every tag has `/<lang>/blog/tags/<slug>/feed.xml` next to the full feed, so
  a reader subscribes to one topic only; Planet GNOME reads the `gnome` feed and gets only GNOME
  posts. The index footer links the full feed and the topic feeds, a tag page links its own, and
  each page announces them as `<link rel="alternate">`.
- **The support note under a post is muted text**, not a `.frame`. It is an aside, and a box made
  it the loudest thing on the page.
- **Headings inside a post.** The Markdown renderer shifts headings down one level under the page's
  h1, so an article's `##` arrives as an h3. `.prose h2, .prose h3` therefore get the section size
  and `.prose h4` the smaller one; styling by the source level made every section heading look
  like a paragraph lead-in.
- **Tables** have no cage: left-aligned header, a hairline under each row, room above and below so
  the next paragraph does not stick to the last row.

Every post starts as `draft: true`; `gjsify run build:drafts` shows them locally, the deploy build
leaves them out. Pascal decides which ones go live.
