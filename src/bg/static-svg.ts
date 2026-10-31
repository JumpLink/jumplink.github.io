// The background without JavaScript: one inline SVG of the same scene, standing still.
//
// This is what a reader sees before the bundle loads, with `prefers-reduced-motion: reduce`, and
// forever if JavaScript never arrives. It is inlined into every page, so it is written as path
// data rather than rects — same pixels, a fraction of the bytes. The sky is not in here: that is
// the CSS gradient behind it, which also carries the colour scheme.

import {
    discRuns,
    glitterRuns,
    harbourCells,
    kugelbakeCells,
    reflectionRuns,
    starField,
    waveBands,
    DISC,
    GLITTER_OPACITY,
    H,
    HARBOUR_H,
    HARBOUR_W,
    HORIZON,
    REFLECTION_H,
    REFLECTION_OPACITY,
    SEA_BANDS,
    W,
    bandTop,
    type Run,
} from './scene.js';
import {
    BAT_FRAMES,
    BAT_HOMES,
    PUMPKIN,
    PUMPKIN_POS,
    SNOW_OPACITY,
    christmasDecor,
    flakeAt,
    flakeCells,
    snowField,
    spriteRuns,
    staticPalette,
} from './season.js';

/**
 * Runs as one `path`: a one-unit stroke per run. The `+ 0.5` puts the stroke's centre line on the
 * middle of the pixel row, so it covers exactly that row instead of straddling two.
 */
function path(runs: Run[], stroke: string, opacity?: number): string {
    if (runs.length === 0) return '';
    const d = runs.map((r) => `M${r.x} ${r.y + 0.5}h${r.w}`).join('');
    const alpha = opacity === undefined ? '' : ` opacity="${opacity}"`;
    return `<path d="${d}" stroke="${stroke}"${alpha}/>`;
}

/** Vertical runs as one `path`, for the sea bands: a column each, from `y` to the sea floor. */
function columns(tops: number[], stroke: string): string {
    const d = tops
        .map((top, x) => `M${x + 0.5} ${HORIZON + top}V${H}`)
        .join('');
    return `<path d="${d}" stroke="${stroke}"/>`;
}

/**
 * The sea, mirroring `seaGraphic`: the far colour across the whole depth, then each nearer band
 * over it from its own ragged upper edge down to the floor.
 */
function sea(): string {
    const parts = [
        path(
            Array.from({ length: H - HORIZON }, (_, y) => ({ x: 0, y: HORIZON + y, w: W })),
            `var(--bg-${SEA_BANDS[0]!.key})`,
        ),
    ];
    for (let i = 1; i < SEA_BANDS.length; i++) {
        const tops = Array.from({ length: W }, (_, x) => bandTop(i, x));
        parts.push(columns(tops, `var(--bg-${SEA_BANDS[i]!.key})`));
    }
    return parts.join('');
}

/** A sprite as one path per colour, its top-left corner at `(x, y)`. */
function spritePaths(rows: string[], x: number, y: number): string {
    const palette = staticPalette();
    return Object.keys(palette)
        .map((char) =>
            path(
                spriteRuns(rows, char).map((r) => ({ ...r, x: r.x + x, y: r.y + y })),
                palette[char]!,
            ),
        )
        .join('');
}

/** The pixels a season adds. Each group stays hidden until `<html data-season>` names its season;
 * the Kugelbake's own pieces go inside the beacon's group, so they leave with it on inner pages. */
function seasons(): { sky: string; beacon: string } {
    const bats = BAT_HOMES.map(([x, y]) => spritePaths(BAT_FRAMES[0]!, x, y)).join('');
    const pumpkin = spritePaths(PUMPKIN, PUMPKIN_POS.x, PUMPKIN_POS.y);

    // One path per fade step, like the stars: a flake thins out over the sea.
    const buckets = new Map<string, Run[]>();
    for (const flake of snowField()) {
        const { x, y, fade } = flakeAt(flake, 0);
        if (fade <= 0) continue;
        const key = (SNOW_OPACITY * (Math.round(fade * 4) / 4)).toFixed(2);
        const runs = buckets.get(key) ?? [];
        runs.push(...flakeCells(x, y, flake.size).map((c) => ({ x: c.x, y: c.y, w: 1 })));
        buckets.set(key, runs);
    }
    const snow = [...buckets].map(([opacity, runs]) => path(runs, 'var(--bg-snow)', Number(opacity))).join('');

    const decor = christmasDecor(0)
        .map((group) => path(group.cells.map((c) => ({ x: c.x, y: c.y, w: 1 })), group.color))
        .join('');

    return {
        sky: `<g class="bg-halloween">${bats}</g><g class="bg-christmas">${snow}</g>`,
        beacon: `<g class="bg-halloween">${pumpkin}</g><g class="bg-christmas">${decor}</g>`,
    };
}

/**
 * The scene as a single `<svg>`, sized in logical pixels and scaled by CSS. `shape-rendering`
 * keeps the upscale crisp; the viewBox is the same grid the canvas uses.
 *
 * The stylesheet gives this element exactly 320 × 180 *whole* CSS pixels per scene pixel — the
 * same integer box the canvas gets — so the two are interchangeable. Letterboxing the fallback
 * like that is the fix for the moon sliding up by about 48 px at the hand-over: an SVG that was
 * free to fill the band chose a fractional scale, the canvas could not.
 */
export function staticSceneSvg(): string {
    const parts: string[] = [];

    // Stars: one path per opacity step, rounded, so the file stays short.
    const buckets = new Map<string, Run[]>();
    for (const star of starField()) {
        const key = (Math.round(star.peak * 4) / 4).toFixed(2);
        const runs = buckets.get(key) ?? [];
        runs.push({ x: star.x, y: star.y, w: 1 });
        buckets.set(key, runs);
    }
    const stars = [...buckets]
        .map(([opacity, runs]) => path(runs, 'var(--bg-star)', Number(opacity)))
        .join('');
    parts.push(`<g class="bg-night">${stars}</g>`);

    // Moon or sun, in the same spot either way; the CSS variable carries which.
    const disc = discRuns().map((r) => ({ x: DISC.x + r.x, y: DISC.y + r.y, w: r.w }));
    parts.push(path(disc, 'var(--bg-disc)'));

    parts.push(sea());

    const glitter = glitterRuns(0).map((r) => ({ x: DISC.x + r.x, y: HORIZON + r.y, w: r.w }));
    parts.push(path(glitter, 'var(--bg-glitter)', GLITTER_OPACITY));

    // One path per band, not one for all of them: each band carries its own opacity, which is how
    // the foam fades out with depth here as well as on the canvas.
    for (const band of waveBands()) {
        const crests = band.runs.map((run) => ({ x: run.x, y: HORIZON + band.depth + run.y, w: run.w }));
        parts.push(path(crests, 'var(--bg-foam)', Number(band.opacity.toFixed(3))));
    }

    const beacon = kugelbakeCells().map((c) => ({ x: c.x, y: c.y, w: 1 }));
    const season = seasons();
    parts.push(season.sky);
    parts.push(`<g class="bg-beacon">${path(beacon, 'var(--bg-wood)')}${season.beacon}</g>`);

    return `<svg class="bg-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" shape-rendering="crispEdges" fill="none" stroke-width="1">${parts.join('')}</svg>`;
}

/**
 * The harbour, its own small `<svg>` because it is pinned to the right edge of the viewport rather
 * than to a column of the scene (see `HARBOUR` in `scene.ts`). Its box runs from the harbour's top
 * row down past the waterline, so the lamps' reflections fit in it. By day the lamps take the
 * silhouette's colour and the reflections are transparent — both through `light-dark()`.
 */
export function staticHarbourSvg(): string {
    const { solid, lamps } = harbourCells();
    const cells = (list: { x: number; y: number }[]) => list.map((c) => ({ x: c.x, y: c.y, w: 1 }));
    const parts = [path(cells(solid), 'var(--bg-harbour)')];
    for (const kind of ['lampWarm', 'lampWhite'] as const) {
        parts.push(path(cells(lamps.filter((l) => l.kind === kind)), `var(--bg-${kind})`));
        const streaks = reflectionRuns(0)[kind].map((r) => ({ ...r, y: HARBOUR_H + r.y }));
        parts.push(path(streaks, `var(--bg-${kind}-water)`, REFLECTION_OPACITY));
    }
    return `<svg class="bg-harbour" viewBox="0 0 ${HARBOUR_W} ${HARBOUR_H + REFLECTION_H}" aria-hidden="true" focusable="false" shape-rendering="crispEdges" fill="none" stroke-width="1">${parts.join('')}</svg>`;
}
