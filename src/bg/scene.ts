// The animated background: the sea off Cuxhaven with the Kugelbake on the horizon.
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
 * Column the Kugelbake stands on. `browser.ts` pins this column to the same fraction of the
 * viewport (`--beacon-at`), which is what keeps the beacon out from behind the headline.
 *
 * It sits far out to the right, at 82 % of the width, and that is not cosmetic: on every viewport
 * wide enough to drive the scale the scene is exactly as wide as the screen, the pan clamps to
 * zero and the beacon lands at `BEACON_X / W` whatever `--beacon-at` says. Standing it at the
 * middle of the scene therefore stood it in the middle of the screen, under the first line of
 * text. The only lever that actually moves it is this column.
 */
export const BEACON_X = 262;

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
 * so panning to place one places the other. The two are kept 82 columns apart — at the smallest
 * upscale that is 164 px, which still fits on a phone next to each other; the first draft had
 * them 200 columns apart and placing the beacon at 82 % pushed the moon off the left edge of a
 * 390 px screen.
 *
 * `y` is what makes it visible: it is high in the sky, and the stylesheet pads the headline down
 * past `y + r` (see `--sky-top`), so the disc stands in open sky *above* the name instead of
 * behind the line of text. Low in the sky it was simply hidden by the tagline on a wide screen.
 */
export const DISC = { x: 180, y: 56, r: 7 };

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

/** `h` = hull, `s` = superstructure/sail, `c` = cargo, `r`/`g`/`w` = position lights. */
export const CARGO_SHIP = [
    '.............................',
    '..........................w..',
    '..........................s..',
    '....ccc...cc....ccc.......s..',
    '...cccc..cccc..cccc.......ss.',
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
