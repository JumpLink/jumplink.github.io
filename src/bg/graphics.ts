// Scene data → Excalibur graphics.
//
// Every graphic here is an `ex.Canvas` with `cache: true`: the draw handler runs once, the result
// is kept as a bitmap and reused. `ex.Canvas` is documented as a low-performance API because it
// re-rasters on each draw, and caching is exactly what switches that off. Nothing in the running
// scene re-rasters — motion is actor position and opacity only.

import { Canvas, ImageFiltering, Vector, type Graphic } from 'excalibur';
import {
    discRuns,
    glitterHalf,
    glitterRuns,
    harbourCells,
    kugelbakeCells,
    reflectionRuns,
    waveBands,
    DISC,
    H,
    HARBOUR_H,
    HARBOUR_W,
    HORIZON,
    REFLECTION_H,
    SEA_BANDS,
    W,
    bandTop,
    type Run,
    type SceneColors,
    type WaveBand,
} from './scene.js';

export const SEA_H = H - HORIZON;

type Draw = (ctx: CanvasRenderingContext2D) => void;

/** A cached raster with its top-left corner as the origin, so scene coordinates map straight in. */
function raster(width: number, height: number, draw: Draw): Graphic {
    return new Canvas({
        width,
        height,
        cache: true,
        smoothing: false,
        filtering: ImageFiltering.Pixel,
        origin: Vector.Zero,
        draw,
    });
}

const fillRuns = (ctx: CanvasRenderingContext2D, runs: Run[], color: string, dx = 0, dy = 0) => {
    ctx.fillStyle = color;
    for (const run of runs) ctx.fillRect(run.x + dx, run.y + dy, run.w, 1);
};

/**
 * The sea as one bitmap: the far colour across the whole depth, then each nearer band painted
 * over it from its own ragged upper edge down to the bottom. Painting top-down and overlapping is
 * what keeps the wandering seams gap-free, whatever `bandTop` returns.
 */
export function seaGraphic(colors: SceneColors): Graphic {
    return raster(W, SEA_H, (ctx) => {
        ctx.fillStyle = colors[SEA_BANDS[0]!.key];
        ctx.fillRect(0, 0, W, SEA_H);
        for (let i = 1; i < SEA_BANDS.length; i++) {
            ctx.fillStyle = colors[SEA_BANDS[i]!.key];
            for (let x = 0; x < W; x++) {
                const top = bandTop(i, x);
                ctx.fillRect(x, top, 1, SEA_H - top);
            }
        }
    });
}

/** One wave band, laid out twice so the actor can scroll a full width before it wraps. */
export function waveGraphic(band: WaveBand, colors: SceneColors): Graphic {
    return raster(2 * W, 2, (ctx) => {
        fillRuns(ctx, band.runs, colors.foam);
        fillRuns(ctx, band.runs, colors.foam, W);
    });
}

export const waveLayers = (colors: SceneColors) =>
    waveBands().map((band) => ({ band, graphic: waveGraphic(band, colors) }));

/** A single sky pixel. Shared by every star; each one dims and brightens on its own. */
export const starGraphic = (colors: SceneColors): Graphic =>
    raster(1, 1, (ctx) => {
        ctx.fillStyle = colors.star;
        ctx.fillRect(0, 0, 1, 1);
    });

/** Moon by night, sun by day — same disc, same place. */
export function discGraphic(colors: SceneColors): Graphic {
    const size = DISC.r * 2 + 1;
    return raster(size, size, (ctx) =>
        fillRuns(ctx, discRuns(), colors.disc, DISC.r, DISC.r),
    );
}

const GLITTER_FRAMES = 4;

/** The reflection under the disc, as a handful of frames the scene cycles slowly. */
export function glitterGraphics(colors: SceneColors): Graphic[] {
    const half = glitterHalf(SEA_H);
    return Array.from({ length: GLITTER_FRAMES }, (_, frame) =>
        raster(2 * half + 1, SEA_H, (ctx) => fillRuns(ctx, glitterRuns(frame), colors.glitter, half)),
    );
}

export const GLITTER_ANCHOR = { x: DISC.x - glitterHalf(SEA_H), y: HORIZON };

/** The Kugelbake: lattice, mast and the ball of crossed hoops, as one silhouette. */
export function beaconGraphic(colors: SceneColors): { graphic: Graphic; x: number; y: number } {
    const cells = kugelbakeCells();
    const minX = Math.min(...cells.map((c) => c.x));
    const minY = Math.min(...cells.map((c) => c.y));
    const width = Math.max(...cells.map((c) => c.x)) - minX + 1;
    const height = Math.max(...cells.map((c) => c.y)) - minY + 1;
    const graphic = raster(width, height, (ctx) => {
        ctx.fillStyle = colors.wood;
        for (const cell of cells) ctx.fillRect(cell.x - minX, cell.y - minY, 1, 1);
    });
    return { graphic, x: minX, y: minY };
}

/** The harbour with its lamps, as one silhouette. By day the lamps are the silhouette's colour. */
export function harbourGraphic(colors: SceneColors): Graphic {
    const { solid, lamps } = harbourCells();
    return raster(HARBOUR_W, HARBOUR_H, (ctx) => {
        ctx.fillStyle = colors.harbour;
        for (const cell of solid) ctx.fillRect(cell.x, cell.y, 1, 1);
        for (const lamp of lamps) {
            ctx.fillStyle = colors[lamp.kind];
            ctx.fillRect(lamp.x, lamp.y, 1, 1);
        }
    });
}

const REFLECTION_FRAMES = 4;

/** The lamps' streaks on the water, a few frames for the scene to shuffle through. */
export function reflectionGraphics(colors: SceneColors): Graphic[] {
    return Array.from({ length: REFLECTION_FRAMES }, (_, frame) =>
        raster(HARBOUR_W, REFLECTION_H, (ctx) => {
            const runs = reflectionRuns(frame);
            fillRuns(ctx, runs.lampWarm, colors.lampWarm);
            fillRuns(ctx, runs.lampWhite, colors.lampWhite);
        }),
    );
}

// ---------------------------------------------------------------------------------------------
// Sprites
// ---------------------------------------------------------------------------------------------

/** Which scene colour each character in a sprite row stands for. */
function paletteFor(colors: SceneColors): Record<string, string> {
    return {
        h: colors.hull,
        s: colors.sail,
        c: colors.cargo,
        d: colors.deck,
        b: colors.bird,
        r: colors.lightRed,
        g: colors.lightGreen,
        w: colors.lightWhite,
    };
}

/** Characters that are navigation lights, and can therefore be blinked off. */
const LIGHTS = new Set(['r', 'g', 'w']);

export interface SpriteGraphic {
    graphic: Graphic;
    width: number;
    height: number;
}

export function spriteGraphic(rows: string[], colors: SceneColors, lightsOn = true): SpriteGraphic {
    const palette = paletteFor(colors);
    const width = Math.max(...rows.map((r) => r.length));
    const height = rows.length;
    const graphic = raster(width, height, (ctx) => {
        rows.forEach((row, y) => {
            [...row].forEach((char, x) => {
                if (char === '.') return;
                if (!lightsOn && LIGHTS.has(char)) return;
                const color = palette[char];
                if (!color) return;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            });
        });
    });
    return { graphic, width, height };
}

/** A sprite in two states, for anything whose lights blink. */
export const blinkingSprite = (rows: string[], colors: SceneColors) => ({
    on: spriteGraphic(rows, colors, true),
    off: spriteGraphic(rows, colors, false),
});

/**
 * A shooting star: a diagonal streak running down and to the right, which is the direction it
 * travels — the head is the bright bottom-right pixel, the tail fades out behind it.
 */
export function streakGraphic(colors: SceneColors, length = 9): SpriteGraphic {
    const graphic = raster(length, length, (ctx) => {
        ctx.fillStyle = colors.lightWhite;
        for (let i = 0; i < length; i++) {
            ctx.globalAlpha = ((i + 1) / length) ** 1.6;
            ctx.fillRect(i, i, 1, 1);
        }
        ctx.globalAlpha = 1;
    });
    return { graphic, width: length, height: length };
}
