// The animated background: the sea off Cuxhaven, the Kugelbake on the left and a stretch of the
// harbour far off on the right.
//
// This module is pure data and geometry. The build renders it once as a static SVG
// (`static-svg.ts`), the browser bundle draws and animates the same shapes with Excalibur
// (`browser.ts`). Nothing here touches the DOM, GJS or Excalibur, so both sides agree on where
// the horizon and the beacon are.

/** Logical canvas. Everything below is in these pixels; the page scales them by an integer. */
export const W = 320;
export const H = 180;
/** Row of the waterline: sky above, sea below. */
export const HORIZON = 112;
/**
 * Column the Kugelbake stands on: far out to the left, in the gap between the navigation and the
 * headline. A wide screen shows the scene from column 0 (`--view-x: 0`), so this column alone decides
 * where the beacon lands, and anything much further right stands it behind the name.
 *
 * Without the sidebar the headline starts at the left gutter, and there is no column left of it to
 * stand in. Narrow screens therefore start the view at column 40 (`--view-x` in `site.css`) and
 * show only the beacon's right third at the edge of the screen.
 */
export const BEACON_X = 36;

export interface Cell {
    x: number;
    y: number;
}

export interface Run {
    x: number;
    y: number;
    w: number;
}

/** Colour roles of the scene. The CSS gradient behind the canvas owns the sky itself. */
export interface SceneColors {
    seaNear: string;
    seaMid: string;
    seaFar: string;
    foam: string;
    wood: string;
    star: string;
    /** Moon at night, sun by day. */
    disc: string;
    glitter: string;
    hull: string;
    sail: string;
    bird: string;
    lightRed: string;
    lightGreen: string;
    lightWhite: string;
    /** Containers on the cargo ship, and its bridge. */
    cargo: string;
    deck: string;
    /** The harbour: its silhouette, and its warm and white lamps — the silhouette's colour by day. */
    harbour: string;
    lampWarm: string;
    lampWhite: string;
}

/** jumplink16, as the scene uses it. Night is the dike after dark, day the same water at noon. */
export const NIGHT: SceneColors = {
    seaNear: '#070a1c',
    seaMid: '#0d1430',
    seaFar: '#16254a',
    foam: '#6b7fae',
    wood: '#0a0714',
    star: '#ddd0ff',
    disc: '#ddd0ff',
    glitter: '#b69cff',
    hull: '#0e0a1a',
    sail: '#46307d',
    bird: '#1f1638',
    lightRed: '#e05a8a',
    lightGreen: '#3fd0c9',
    lightWhite: '#f4f0ff',
    cargo: '#46307d',
    deck: '#46307d',
    harbour: '#120c24',
    lampWarm: '#ffb45a',
    lampWhite: '#f4f0ff',
};

// By day the water gets *lighter* with depth, not darker: the page below the band is bright haze,
// so a dark near band would put a lid between the sea and the rest of the page. At night it runs
// the other way, which is what the sea actually does after dark.
export const DAY: SceneColors = {
    seaNear: '#9fd5e0',
    seaMid: '#86c9d8',
    seaFar: '#6fbdd0',
    foam: '#d7f1f3',
    wood: '#7d4436',
    star: 'transparent',
    disc: '#ffcf4a',
    glitter: '#fff4cf',
    hull: '#2f2056',
    sail: '#f4f0ff',
    bird: '#46307d',
    lightRed: '#e05a8a',
    lightGreen: '#1c7a4a',
    lightWhite: '#f4f0ff',
    cargo: '#e05a8a',
    deck: '#46307d',
    // Haze: far enough off that it is lighter than anything on the water.
    harbour: '#9fb8cc',
    lampWarm: '#9fb8cc',
    lampWhite: '#9fb8cc',
};

/**
 * Deterministic noise, so the static SVG and the canvas place the same stars and wave crests.
 *
 * The avalanche steps are not decoration. A plain `imul(x, C) ^ imul(y, D)` keeps its high bits
 * almost linear in `x`, so thresholding it picks the same columns over and over — the wave crests
 * lined up in visible vertical stripes every ~58 px until this was mixed properly.
 */
const hash = (a: number, b: number) => {
    let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ 0x9e3779b9;
    h ^= h >>> 15;
    h = Math.imul(h, 0x2545f491);
    h ^= h >>> 13;
    h = Math.imul(h, 0x3b9ac585);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
};

// ---------------------------------------------------------------------------------------------
// The Kugelbake
// ---------------------------------------------------------------------------------------------

/** Lowest row of the beacon: its plinth stands just behind the waterline. */
export const BEACON_BASE = HORIZON + 1;

/**
 * The Kugelbake as drawn from photos of the real one, top to bottom: the small cross-ball, the
 * ball on its mast, the slatted box, the crossbeam with its two brackets, and the open A-frame —
 * two splayed legs, a centre post and two pairs of diagonal braces — on its stone plinth.
 * Mirror-symmetric around the middle column, which sits on `BEACON_X`.
 */
const KUGELBAKE = [
    '...........#...........',
    '..........###..........',
    '...........#...........',
    '...........#...........',
    '..........###..........',
    '.........#####.........',
    '.........#####.........',
    '.........#####.........',
    '..........###..........',
    '...........#...........',
    '...........#...........',
    '.......#########.......',
    '.......#.#.#.#.#.......',
    '.......#.#.#.#.#.......',
    '.......#.#.#.#.#.......',
    '.......#.#.#.#.#.......',
    '.......#.#.#.#.#.......',
    '.......#.#.#.#.#.......',
    '.......#.#.#.#.#.......',
    '.......#.#.#.#.#.......',
    '.......#.#.#.#.#.......',
    '....###############....',
    '.....##....#....##.....',
    '......#....#....#......',
    '.....#.....#.....#.....',
    '.....#....###....#.....',
    '.....#...#.#.#...#.....',
    '....#...#..#..#...#....',
    '....#...#..#..#...#....',
    '....#..#...#...#..#....',
    '...#..#....#....#..#...',
    '...#.#.....#.....#.#...',
    '...#.#.....#.....#.#...',
    '...##.....###.....##...',
    '..##.....#.#.#.....##..',
    '..#.....#..#..#.....#..',
    '..#....#...#...#....#..',
    '.#...#.....#.....#...#.',
    '.#..#......#......#..#.',
    '.#.#.......#.......#.#.',
    '#.#........#........#.#',
    '##.........#.........##',
    '#######################',
];

/** Top row of the cross-ball; stars keep clear of everything below it. */
const BEACON_TIP = BEACON_BASE - KUGELBAKE.length + 1;

/** The beacon as a silhouette, in cells relative to the scene grid. */
export function kugelbakeCells(): Cell[] {
    const half = (KUGELBAKE[0]!.length - 1) / 2;
    const cells: Cell[] = [];
    KUGELBAKE.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            if (row[x] === '#') cells.push({ x: BEACON_X - half + x, y: BEACON_TIP + y });
        }
    });
    return cells;
}

// ---------------------------------------------------------------------------------------------
// The harbour
// ---------------------------------------------------------------------------------------------

/**
 * A stretch of the harbour seen from the dike: sheds, a tower and one container crane, small
 * because it is kilometres off. `o` and `w` are warm and white lamps — lit windows and the quay's
 * lights at night, plain silhouette by day.
 *
 * It does not stand on a fixed column. The scene is wider than most screens and pans, so a fixed
 * column would show the harbour on one screen and cut it off on the next; instead both renderers
 * pin it to the right edge of the viewport, `--harbour-edge` columns in (`site.css`) — on a phone
 * that is negative, and only the harbour's left third shows.
 */
const HARBOUR = [
    '..............o.........................',
    '..............#.........................',
    '.............###........................',
    '..###################...................',
    '..#..........#....#.....w...............',
    '..#..........#....#....###..............',
    '.............#....#....###..............',
    '.............######....###..............',
    '.............#....#....###.....o........',
    '.............#....#....###....###.......',
    '#########....#....#...#####...###.......',
    '#o###w###....#....#...##w##..#####..w...',
    '#########..o.#....#..#############.###..',
    '########################w##########o###.',
    'w#o####w####o#####o######o#####w####o###',
];

export const HARBOUR_W = HARBOUR[0]!.length;
export const HARBOUR_H = HARBOUR.length;
/** Its bottom row sits on the last row of sky: the quay is on the far shore, not on the water. */
export const HARBOUR_TOP = HORIZON - HARBOUR_H;
/** How far the longest reflection reaches below the horizon. */
export const REFLECTION_H = 22;

export type LampKind = 'lampWarm' | 'lampWhite';

export interface Lamp extends Cell {
    kind: LampKind;
}

const LAMPS: Record<string, LampKind> = { o: 'lampWarm', w: 'lampWhite' };

/** The silhouette and the lamps, relative to the harbour's own top-left corner. */
export function harbourCells(): { solid: Cell[]; lamps: Lamp[] } {
    const solid: Cell[] = [];
    const lamps: Lamp[] = [];
    HARBOUR.forEach((row, y) => {
        [...row].forEach((char, x) => {
            if (char === '#') solid.push({ x, y });
            else if (LAMPS[char]) lamps.push({ x, y, kind: LAMPS[char]! });
        });
    });
    return { solid, lamps };
}

/**
 * The lamps mirrored in the water, the way they are on a calm night in the photos: long vertical
 * streaks, broken up, fading with depth. A lamp low on the quay throws a longer streak than one up
 * on the crane, which is the wrong way round optically and the right way round to look at — the
 * quay lights are what the water actually carries. Rows are below the horizon, columns relative
 * to the harbour; `frame` shuffles which dashes are lit.
 */
export function reflectionRuns(frame: number): Record<LampKind, Run[]> {
    const runs: Record<LampKind, Run[]> = { lampWarm: [], lampWhite: [] };
    for (const lamp of harbourCells().lamps) {
        const low = lamp.y / (HARBOUR_H - 1);
        const length = Math.round(6 + low * (REFLECTION_H - 8) * (0.6 + 0.4 * hash(lamp.x, 71)));
        for (let y = 1; y < length; y++) {
            const fade = 1 - y / length;
            if (hash(lamp.x * 13 + frame * 5, y + lamp.y * 17) > 0.25 + 0.65 * fade) continue;
            runs[lamp.kind].push({ x: lamp.x, y, w: 1 });
        }
    }
    return runs;
}

/** How bright the reflections are against the night water. */
export const REFLECTION_OPACITY = 0.55;

// ---------------------------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------------------------

export interface Star {
    x: number;
    y: number;
    /** 0…1 — where in its twinkle cycle this star starts. */
    phase: number;
    /** Seconds per cycle. */
    period: number;
    /** Brightest opacity. */
    peak: number;
}

const STAR_COUNT = 60;

/** Stars thin out toward the horizon, and none sit on the beacon or inside the disc. */
export function starField(): Star[] {
    const stars: Star[] = [];
    for (let i = 0; stars.length < STAR_COUNT && i < STAR_COUNT * 6; i++) {
        const x = Math.floor(hash(i, 11) * W);
        const y = Math.floor(hash(i, 23) ** 1.7 * (HORIZON - 14));
        if (Math.abs(x - BEACON_X) < 14 && y > BEACON_TIP - 5) continue;
        if ((x - DISC.x) ** 2 + (y - DISC.y) ** 2 < (DISC.r + 3) ** 2) continue;
        stars.push({
            x,
            y,
            phase: hash(i, 31),
            period: 1.8 + hash(i, 43) * 4.5,
            peak: 0.22 + hash(i, 57) ** 2 * 0.7,
        });
    }
    return stars;
}

// ---------------------------------------------------------------------------------------------
// The sea
// ---------------------------------------------------------------------------------------------

/** How the three sea colours are stacked, as rows below the horizon. */
export const SEA_BANDS = [
    { from: 0, to: 10, key: 'seaFar' },
    { from: 10, to: 32, key: 'seaMid' },
    { from: 32, to: H - HORIZON, key: 'seaNear' },
] as const;

/** Smooth 1-D value noise, one control point every six columns. */
function wobble(x: number, seed: number): number {
    const step = 6;
    const i = Math.floor(x / step);
    const f = x / step - i;
    const t = f * f * (3 - 2 * f);
    const a = hash(i, seed);
    return a + (hash(i + 1, seed) - a) * t;
}

/** How far a band's upper edge strays from its nominal row, in either direction. */
const BAND_JITTER = 2;

/**
 * The row — below the horizon — where sea band `i` begins in column `x`.
 *
 * An ordered dither between the two colours was the obvious way to soften the seam, and it read
 * as exactly what it was: a checked belt ruled across the whole width. A boundary that wanders a
 * couple of rows reads as water, and costs the same.
 */
export function bandTop(i: number, x: number): number {
    const band = SEA_BANDS[i]!;
    return band.from + Math.round((wobble(x, 900 + i) * 2 - 1) * BAND_JITTER);
}

export interface WaveBand {
    /** Rows below the horizon. */
    depth: number;
    /** Pixels per second the band drifts; closer water runs faster. */
    speed: number;
    /** How bright this band's crests are. The page sinks: the near water is further from the
     * horizon and closer to the deep, so the foam thins out rather than stopping at a line.
     * Both renderers read this instead of each picking its own number. */
    opacity: number;
    /** Crests across one canvas width, each on row 0 or 1 of the band — a dead-straight line of
     * dashes reads as a ruler, two staggered rows read as water. Every run fits inside `[0, W)`,
     * so the browser can lay two copies side by side and scroll a width without a seam. */
    runs: Run[];
}

const BAND_COUNT = 11;

/** Wave crests as short bright dashes, denser and longer toward the viewer. */
export function waveBands(): WaveBand[] {
    const bands: WaveBand[] = [];
    for (let i = 0; i < BAND_COUNT; i++) {
        // Rows crowd together near the horizon, the way a flat sea foreshortens.
        const depth = Math.round(2 + ((H - HORIZON - 6) * (i / (BAND_COUNT - 1)) ** 1.55));
        const t = i / (BAND_COUNT - 1);
        const runs: Run[] = [];
        for (let x = 0; x < W; x++) {
            if (hash(x, 100 + i) > 0.012 + t * 0.038) continue;
            const w = Math.min(1 + Math.floor(hash(x, 200 + i) * (1 + t * 4)), W - x);
            runs.push({ x, y: hash(x, 300 + i) > 0.5 ? 1 : 0, w });
            x += w + 1;
        }
        bands.push({ depth, speed: 1.4 + t * t * 9, opacity: WAVE_OPACITY * (1 - 0.8 * t ** 1.2), runs });
    }
    return bands;
}

/** Brightest the foam ever gets, at the horizon. Anything more and the crests read as a pattern
 * printed on the water rather than light on it. */
const WAVE_OPACITY = 0.34;

/** The light path under the disc. Low enough that text can cross it and still clear AA. */
export const GLITTER_OPACITY = 0.24;

// ---------------------------------------------------------------------------------------------
// Moon / sun
// ---------------------------------------------------------------------------------------------

/**
 * The moon or the sun. `x` is not free: the disc and the Kugelbake are pinned to the same scene,
 * so panning to place one places the other. A wide screen shows both, the disc over the name. A
 * phone shows about 130 columns from column 40 on — the last third of the beacon — and the disc
 * has to fit in that, which is why it is not further right.
 *
 * `y` leaves the top of the sky to the name: the headline stands at the top of the band, above
 * the disc, so neither covers the moving scene. At 56 there was no room for both above the disc
 * at 1440 px; 66 makes that room and still leaves the disc high above the harbour.
 */
export const DISC = { x: 150, y: 66, r: 7 };

/** The filled disc as horizontal runs. */
export function discRuns(r = DISC.r): Run[] {
    const runs: Run[] = [];
    for (let dy = -r; dy <= r; dy++) {
        // `round`, not `floor`: flooring leaves a single-pixel spike at each pole, which at
        // integer scale reads as a lump rather than a disc.
        const half = Math.round(Math.sqrt(r * r - dy * dy));
        runs.push({ x: -half, y: dy, w: 2 * half + 1 });
    }
    return runs;
}

/** Half-width of the light path `y` rows below the horizon. A narrow column of evenly spaced
 * dashes reads as a ladder, so it opens out — but slowly: a wide cone of dots reads as static. */
export const glitterHalf = (y: number) => 1 + Math.floor(y / 4);

/** The reflection under the disc: broken dashes that thin out toward the viewer and toward the
 * edges of the path, so the light fades away instead of ending at a line. */
export function glitterRuns(frame: number): Run[] {
    const runs: Run[] = [];
    const depth = H - HORIZON;
    for (let y = 1; y < depth; y += 2) {
        const half = glitterHalf(y);
        const near = 1 - (y / depth) ** 2.4;
        for (let x = -half; x <= half; x++) {
            const edge = Math.abs(x) / (half + 1);
            if (hash(x + frame * 7, y) > 0.36 * near * (1 - edge) ** 1.5) continue;
            runs.push({ x, y, w: 1 + (hash(x, y + frame) > 0.8 ? 1 : 0) });
        }
    }
    return runs;
}

// ---------------------------------------------------------------------------------------------
// Sprites for the random events, as pixel rows ('.' is transparent)
// ---------------------------------------------------------------------------------------------

/** `h` = hull, `s` = sail, `d` = bridge, `c` = containers, `r`/`g`/`w` = position lights. */
export const CARGO_SHIP = [
    '.............................',
    '..........................w..',
    '..........................d..',
    '....ccc...cc....ccc.......d..',
    '...cccc..cccc..cccc.......dd.',
    'r.hhhhhhhhhhhhhhhhhhhhhhhhhsg',
    '.hhhhhhhhhhhhhhhhhhhhhhhhhhh.',
    '..hhhhhhhhhhhhhhhhhhhhhhhhh..',
];

export const CUTTER = [
    '....w....',
    '....s....',
    '....s....',
    '..sssss..',
    'r.hhhhh.g',
    '.hhhhhhh.',
];

/** Two wing positions; the gull is three pixels of silhouette either way. */
export const GULL_FRAMES = [
    ['b...b', '.b.b.', '..b..'],
    ['.....', 'bb.bb', '..b..'],
    ['..b..', '.b.b.', 'b...b'],
    ['.....', 'bb.bb', '..b..'],
];

export const PLANE = ['..w..', 'r.w.g', '..w..'];
