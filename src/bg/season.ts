// Seasonal additions to the background: Halloween around 31 October, Christmas from Advent to
// Epiphany.
//
// Like `scene.ts` this module is pure data and geometry — the static SVG, the inline boot script
// and the Excalibur scene all read it, none of them is read by it.
//
// The site is static, so the season cannot be decided when it is built: a page built on 30 October
// would show Halloween until the next deploy. It is decided in the visitor's browser instead, by a
// tiny script in `<head>` that puts `data-season` on `<html>`. The windows below are the only copy
// of the dates; that script is generated from them.

import { BEACON_LEFT, BEACON_TIP, BEACON_X, HORIZON, W, hash, kugelbakeCells, type Cell, type Run } from './scene.js';

export type Season = 'halloween' | 'christmas';

export const parseSeason = (value: string | null | undefined): Season | null =>
    value === 'halloween' || value === 'christmas' ? value : null;

interface SeasonWindow {
    season: Season;
    /** `month * 100 + day`, both ends inclusive. A window with `to < from` wraps over New Year. */
    from: number;
    to: number;
}

export const SEASON_WINDOWS: readonly SeasonWindow[] = [
    { season: 'halloween', from: 1024, to: 1103 },
    { season: 'christmas', from: 1201, to: 106 },
];

const inWindow = (n: number, w: SeasonWindow) =>
    w.from <= w.to ? n >= w.from && n <= w.to : n >= w.from || n <= w.to;

export function seasonOn(date: Date): Season | null {
    const n = (date.getMonth() + 1) * 100 + date.getDate();
    return SEASON_WINDOWS.find((w) => inWindow(n, w))?.season ?? null;
}

/**
 * The same decision as `seasonOn`, as the script that runs before the first paint. `?season=` is a
 * way to look at a season out of season (`none` switches it off); it is not remembered.
 */
export const SEASON_BOOT = `(function(){var r=document.documentElement,w=${JSON.stringify(SEASON_WINDOWS)},m=/[?&]season=(\\w+)/.exec(location.search),s=m&&m[1];
if(!s){var d=new Date(),n=(d.getMonth()+1)*100+d.getDate();
for(var i=0;i<w.length;i++){var a=w[i];if(a.from<=a.to?n>=a.from&&n<=a.to:n>=a.from||n<=a.to){s=a.season;break}}}
if(s==="halloween"||s==="christmas")r.dataset.season=s})()`;

// ---------------------------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------------------------

/**
 * The two colours that change with the scheme: a silhouette has to stay lighter than the night sky
 * and darker than the day sky, and snow has to read on both. Everything else is the same by day and
 * by night — pumpkins and reindeer are lit by themselves.
 */
export interface SeasonColors {
    dark: string;
    snow: string;
}

export const NIGHT_SEASON: SeasonColors = { dark: '#5a45a0', snow: '#f4f0ff' };
export const DAY_SEASON: SeasonColors = { dark: '#2f2056', snow: '#ffffff' };

/**
 * `b` bat and witch silhouette · `o` pumpkin · `e` its ridges · `y` candle glow · `g` stem · `p`
 * ghost · `k` its eyes · `r` red coat · `w` fur · `f` face · `n` reindeer and sack · `x` red nose ·
 * `l` gold.
 */
const FIXED: Record<string, string> = {
    o: '#f58a1f',
    e: '#b8481a',
    y: '#ffd45a',
    g: '#4fa05a',
    p: '#e7defc',
    k: '#1f1638',
    r: '#d6304a',
    w: '#f4f0ff',
    f: '#f2b896',
    n: '#8a5a3c',
    x: '#ff3030',
    l: '#ffcf4a',
};

/** `dim` is the candle at the bottom of a flicker. */
export const seasonPalette = (colors: SeasonColors, dim = false): Record<string, string> => ({
    ...FIXED,
    b: colors.dark,
    ...(dim ? { y: '#f0a030' } : {}),
});

export const staticPalette = (): Record<string, string> => ({ ...FIXED, b: 'var(--bg-bat)' });

// ---------------------------------------------------------------------------------------------
// Sprites
// ---------------------------------------------------------------------------------------------

/** Two wing positions, 7 × 4. */
export const BAT_FRAMES = [
    ['b.....b', 'bb.b.bb', '.bbbbb.', '..b.b..'],
    ['..b.b..', '.bbbbb.', 'bb.b.bb', 'b.....b'],
];

/** Where the bats that are there from the start hang about, so the static picture can place them. */
export const BAT_HOMES: readonly (readonly [number, number])[] = [
    [96, 58],
    [112, 70],
    [84, 78],
];

/** A witch on a broom, 21 × 8, flying to the right; the stick is row 6. */
export const WITCH = [
    '..............b......',
    '.............bbb.....',
    '...........bbbbbbb...',
    '..............bb.....',
    '.............bbbb....',
    '.bb.........bbbbb....',
    'bbbbbbbbbbbbbbbbbb...',
    '.bb...........b.b....',
];
export const WITCH_STICK = 6;

/** A ghost, 7 × 8: two hems, so it seems to drift. */
export const GHOST_FRAMES = [
    ['..ppp..', '.ppppp.', 'ppppppp', 'pkpppkp', 'pkpppkp', 'pppkppp', 'ppppppp', 'p.p.p.p'],
    ['..ppp..', '.ppppp.', 'ppppppp', 'pkpppkp', 'pkpppkp', 'pppkppp', 'ppppppp', '.p.p.p.'],
];

/** The jack-o'-lantern, 7 × 7. */
export const PUMPKIN = ['...g...', '.ooeoo.', 'oooeooo', 'oyoeoyo', 'ooyyyoo', 'oyoyoyo', '.ooeoo.'];

/** It floats right under the waterline, right of the figure: further down, on a tall window, the home text starts there. It bobs a row up and down with the swell. */
export const PUMPKIN_POS = { x: 110, y: HORIZON + 2 };

/** Its light in the water, relative to a point eight rows under its top. */
export const PUMPKIN_REFLECTION: Run[] = [
    { x: 2, y: 0, w: 3 },
    { x: 1, y: 2, w: 5 },
    { x: 2, y: 4, w: 3 },
    { x: 3, y: 6, w: 1 },
];

const REINDEER = ['.......n.n', '........nn', '.......nnn', 'nnnnnnnnnx', 'nnnnnnnnn.'];
const LEGS = [
    ['n.n....n.n', 'n.......n.'],
    ['.nn....nn.', '..........'],
];
const reindeer = (frame: number, lead: boolean) =>
    [...REINDEER, ...LEGS[frame]!].map((row) => (lead ? row : row.replace('x', 'n')));

const SLEIGH = [
    '....w.........',
    '...rrr........',
    '...wfw........',
    '.nnrrr.......l',
    'nnnrrrr......l',
    'llllllllllllll',
    '.rrrrrrrrrrrr.',
    '.l..........l.',
    'llllllllllllll',
];

interface Part {
    rows: string[];
    x: number;
    y: number;
}

/** Lay parts onto one grid; later parts win where they overlap. */
function compose(width: number, height: number, parts: Part[]): string[] {
    const grid = Array.from({ length: height }, () => Array<string>(width).fill('.'));
    for (const part of parts) {
        part.rows.forEach((row, dy) => {
            [...row].forEach((char, dx) => {
                if (char !== '.') grid[part.y + dy]![part.x + dx] = char;
            });
        });
    }
    return grid.map((row) => row.join(''));
}

/** Santa's sleigh with two reindeer, flying to the right; the team gallops through two frames. */
export const SLEIGH_FRAMES = [0, 1].map((frame) =>
    compose(36, 9, [
        { rows: SLEIGH, x: 0, y: 0 },
        { rows: reindeer(1 - frame, false), x: 15, y: 1 },
        { rows: reindeer(frame, true), x: 26, y: 0 },
        { rows: ['l'], x: 14, y: 4 },
        { rows: ['l'], x: 25, y: 4 },
    ]),
);
/** Row of the runner, where the gold dust starts. */
export const SLEIGH_RUNNER = 7;

/** The pixels of one colour in a sprite, as runs. */
export function spriteRuns(rows: string[], char: string): Run[] {
    const runs: Run[] = [];
    rows.forEach((row, y) => {
        let x = 0;
        while (x < row.length) {
            if (row[x] !== char) {
                x++;
                continue;
            }
            const start = x;
            while (row[x] === char) x++;
            runs.push({ x: start, y, w: x - start });
        }
    });
    return runs;
}

// ---------------------------------------------------------------------------------------------
// Snow
// ---------------------------------------------------------------------------------------------

export interface Flake {
    /** Column the flake sways around. */
    x: number;
    /** Pixels per second. */
    speed: number;
    /** Half the width of the sway, in pixels. */
    sway: number;
    /** Seconds per sway. */
    period: number;
    /** 0…1 — where in its fall and its sway it starts. */
    phase: number;
    /** 1 is a dot, 3 a small plus. */
    size: 1 | 3;
}

const FLAKES = 46;
/** Flakes die in the sea, this many rows below the waterline. */
const SNOW_DEPTH = 34;
const FALL = HORIZON + SNOW_DEPTH;
export const SNOW_OPACITY = 0.85;

export function snowField(): Flake[] {
    return Array.from({ length: FLAKES }, (_, i) => ({
        x: Math.floor(hash(i, 501) * W),
        speed: 5 + hash(i, 502) * 8,
        sway: 1.5 + hash(i, 503) * 3,
        period: 4 + hash(i, 504) * 5,
        phase: hash(i, 505),
        size: hash(i, 506) < 0.2 ? 3 : 1,
    }));
}

/**
 * Where a flake is `t` seconds in: its centre, and how much of it is left — flakes thin out over
 * the sea instead of piling up on a line. `t = 0` is what the static SVG shows, so the canvas takes
 * over from the same picture.
 */
export function flakeAt(flake: Flake, t: number): { x: number; y: number; fade: number } {
    const y = Math.round(((flake.phase * FALL + flake.speed * t) % FALL) - 4);
    const x = Math.round(flake.x + flake.sway * Math.sin(2 * Math.PI * (t / flake.period + flake.phase)));
    return { x, y, fade: y < HORIZON ? 1 : Math.max(0, 1 - (y - HORIZON) / SNOW_DEPTH) };
}

export const flakeCells = (x: number, y: number, size: 1 | 3): Cell[] =>
    size === 1
        ? [{ x, y }]
        : [
              { x, y },
              { x: x - 1, y },
              { x: x + 1, y },
              { x, y: y - 1 },
              { x, y: y + 1 },
          ];

// ---------------------------------------------------------------------------------------------
// The Kugelbake at Christmas
// ---------------------------------------------------------------------------------------------

export interface PaintGroup {
    color: string;
    cells: Cell[];
}

const GOLD = '#ffcf4a';
const BULBS = ['#ff4a6a', GOLD, '#3fd0c9', '#6aa8ff', '#d98cff'];
const STAR = ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'];
const STAR_H = STAR.length;

/**
 * Where the lights sit, as column and row of the beacon's own grid: the ball, the box, the
 * crossbeam, the outer edge of both legs and the centre post. Every spot is checked against the
 * silhouette, so a light never hangs in the air.
 */
const LIGHTS: readonly (readonly [number, number])[] = [
    [11, 3], [9, 6], [13, 6],
    [7, 11], [11, 11], [15, 11], [7, 13], [15, 13], [7, 16], [15, 16], [7, 19], [15, 19],
    [4, 21], [11, 21], [18, 21],
    [5, 24], [17, 24], [11, 26], [4, 27], [18, 27], [3, 30], [19, 30], [11, 31],
    [3, 33], [19, 33], [1, 36], [21, 36], [11, 38], [0, 39], [22, 39],
];

/** A bauble on a string off the crossbeam: the string's column, and the colour. */
const BAUBLES = [
    { col: 7, color: '#ff4a6a' },
    { col: 15, color: '#6aa8ff' },
];

const beacon = kugelbakeCells();
const lit = new Set(beacon.map((c) => `${c.x},${c.y}`));

/** The box the decoration is drawn in: the beacon plus the star above it. */
export const DECOR_BOX = {
    x: BEACON_LEFT,
    y: BEACON_TIP - STAR_H,
    w: Math.max(...beacon.map((c) => c.x)) - BEACON_LEFT + 1,
    h: Math.max(...beacon.map((c) => c.y)) - (BEACON_TIP - STAR_H) + 1,
};

export const DECOR_FRAMES = 3;

/** A gold star on the tip, two baubles under the crossbeam and the lights. In each frame a third
 * of the lights is out, which is what makes the string twinkle. */
export function christmasDecor(frame: number): PaintGroup[] {
    const groups = new Map<string, Cell[]>();
    const put = (color: string, x: number, y: number) => {
        const list = groups.get(color) ?? [];
        list.push({ x, y });
        groups.set(color, list);
    };

    STAR.forEach((row, dy) =>
        [...row].forEach((char, dx) => {
            if (char === 'y') put(GOLD, BEACON_X - 2 + dx, BEACON_TIP - STAR_H + dy);
        }),
    );

    for (const { col, color } of BAUBLES) {
        put(GOLD, BEACON_LEFT + col, BEACON_TIP + 22);
        for (const dy of [23, 24]) for (const dx of [0, 1]) put(color, BEACON_LEFT + col - dx, BEACON_TIP + dy);
    }

    LIGHTS.forEach(([col, row], i) => {
        const x = BEACON_LEFT + col;
        const y = BEACON_TIP + row;
        if (i % DECOR_FRAMES === frame || !lit.has(`${x},${y}`)) return;
        put(BULBS[i % BULBS.length]!, x, y);
    });

    return [...groups].map(([color, cells]) => ({ color, cells }));
}
