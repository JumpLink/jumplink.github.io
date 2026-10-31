// The living scene: what stands still, what always moves, and what turns up now and then.
//
// Everything is an `ex.Actor` carrying one cached graphic. Nothing re-rasters while the scene
// runs; motion is position and opacity. The scene is rebuilt from scratch when the colour scheme
// flips, which is rare enough to cost nothing.

import {
    Actor,
    Animation,
    AnimationStrategy,
    Scene,
    Vector,
    vec,
    type Engine,
    type Graphic,
} from 'excalibur';
import {
    beaconGraphic,
    blinkingSprite,
    cellsGraphic,
    discGraphic,
    glitterGraphics,
    harbourGraphic,
    reflectionGraphics,
    runsGraphic,
    seaGraphic,
    seasonSprite,
    spriteGraphic,
    starGraphic,
    streakGraphic,
    waveLayers,
    GLITTER_ANCHOR,
    type SpriteGraphic,
} from './graphics.js';
import {
    BAT_FRAMES,
    BAT_HOMES,
    DAY_SEASON,
    DECOR_BOX,
    DECOR_FRAMES,
    GHOST_FRAMES,
    NIGHT_SEASON,
    PUMPKIN,
    PUMPKIN_POS,
    PUMPKIN_REFLECTION,
    SLEIGH_FRAMES,
    SLEIGH_RUNNER,
    SNOW_OPACITY,
    WITCH,
    WITCH_STICK,
    christmasDecor,
    flakeAt,
    flakeCells,
    seasonPalette,
    snowField,
    type Flake,
    type Season,
    type SeasonColors,
} from './season.js';
import {
    starField,
    CARGO_SHIP,
    CUTTER,
    DISC,
    GLITTER_OPACITY,
    GULL_FRAMES,
    H,
    HARBOUR_TOP,
    HARBOUR_W,
    HORIZON,
    PLANE,
    REFLECTION_OPACITY,
    W,
    type SceneColors,
    type WaveBand,
} from './scene.js';

// Ships sit on the sea, not behind it: behind it, the water covered the whole hull, and by day
// all that was left was a pale bridge against a pale sky.
const Z = {
    sky: 0,
    disc: 10,
    harbour: 20,
    sea: 30,
    reflection: 34,
    ship: 36,
    wave: 40,
    near: 50,
    snow: 55,
    beacon: 60,
    decor: 61,
};

const TOP_LEFT = Vector.Zero;

function sprite(graphic: Graphic, pos: Vector, z: number): Actor {
    const actor = new Actor({ pos, z, anchor: TOP_LEFT });
    actor.graphics.use(graphic);
    return actor;
}

/** Random float in `[min, max)`. */
const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!;

// ---------------------------------------------------------------------------------------------
// The constant scene
// ---------------------------------------------------------------------------------------------

/** One star, fading in and out on its own period. */
function starActor(graphic: Graphic, star: ReturnType<typeof starField>[number]): Actor {
    const actor = sprite(graphic, vec(star.x, star.y), Z.sky);
    let t = star.phase * star.period;
    actor.on('postupdate', ({ elapsed }) => {
        t = (t + elapsed / 1000) % star.period;
        const wave = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / star.period);
        actor.graphics.opacity = star.peak * (0.25 + 0.75 * wave);
    });
    return actor;
}

/** One band of wave crests, drifting shoreward and wrapping after a full canvas width. */
function waveActor(graphic: Graphic, band: WaveBand): Actor {
    const { depth, speed } = band;
    const y = HORIZON + depth;
    const actor = sprite(graphic, vec(0, y), Z.wave);
    actor.graphics.opacity = band.opacity;
    let x = -Math.random() * W;
    actor.on('postupdate', ({ elapsed }) => {
        x = (x + (speed * elapsed) / 1000) % W;
        // Whole pixels only: a crest that lands between two columns would shimmer.
        actor.pos = vec(-Math.floor(x), y);
    });
    return actor;
}

/** The moonlight (or sunlight) on the water, cycling through a few frames. */
function glitterActor(frames: Graphic[]): Actor {
    const animation = new Animation({
        frames: frames.map((graphic) => ({ graphic, duration: 320 })),
        strategy: AnimationStrategy.Loop,
        origin: TOP_LEFT,
    });
    const actor = sprite(animation, vec(GLITTER_ANCHOR.x, GLITTER_ANCHOR.y), Z.wave);
    actor.graphics.opacity = GLITTER_OPACITY;
    return actor;
}

/** The harbour lamps on the water, flickering through their frames a little faster than the
 * moonlight: small lights break up more on the swell than one big one does. */
function reflectionActor(frames: Graphic[], x: number): Actor {
    const animation = new Animation({
        frames: frames.map((graphic) => ({ graphic, duration: 240 })),
        strategy: AnimationStrategy.Loop,
        origin: TOP_LEFT,
    });
    const actor = sprite(animation, vec(x, HORIZON), Z.reflection);
    actor.graphics.opacity = REFLECTION_OPACITY;
    return actor;
}

// ---------------------------------------------------------------------------------------------
// Passers-by
// ---------------------------------------------------------------------------------------------

/** Travels horizontally at `speed` px/s and leaves the scene for good once it is past the edge. */
function drifter(graphic: Graphic, width: number, y: number, speed: number, z: number): Actor {
    const fromLeft = speed > 0;
    const actor = sprite(graphic, vec(fromLeft ? -width : W, y), z);
    actor.graphics.flipHorizontal = !fromLeft;
    let x = actor.pos.x;
    actor.on('postupdate', ({ elapsed }) => {
        x += (speed * elapsed) / 1000;
        actor.pos = vec(Math.round(x), y);
        if (fromLeft ? x > W : x < -width) actor.kill();
    });
    return actor;
}

/** Same, but the navigation lights blink about once a second. */
function blinker(pair: { on: SpriteGraphic; off: SpriteGraphic }, y: number, speed: number): Actor {
    const animation = new Animation({
        frames: [
            { graphic: pair.on.graphic, duration: 180 },
            { graphic: pair.off.graphic, duration: 820 },
        ],
        strategy: AnimationStrategy.Loop,
        origin: TOP_LEFT,
    });
    return drifter(animation, pair.on.width, y, speed, Z.sky);
}

/** The cargo ship's top row: its lowest hull row lies on the first row of water. */
const cargoY = (height: number) => HORIZON - height + 2;

function cargoShip(colors: SceneColors): Actor {
    const ship = spriteGraphic(CARGO_SHIP, colors);
    const speed = pick([1, -1]) * rnd(5, 8);
    return drifter(ship.graphic, ship.width, cargoY(ship.height), speed, Z.ship);
}

function cutter(colors: SceneColors): Actor {
    const boat = spriteGraphic(CUTTER, colors);
    const speed = pick([1, -1]) * rnd(10, 15);
    return drifter(boat.graphic, boat.width, HORIZON + rnd(8, 18), speed, Z.near);
}

interface FlyerOptions {
    frames: SpriteGraphic[];
    /** Milliseconds per frame, picked once per frame from this range. */
    frameMs: [number, number];
    /** Pixels per second; the sign is the direction. */
    speed: number;
    y: number;
    /** Seconds before it appears. */
    delay?: number;
    /** Rows it drifts up and down as it goes. */
    bob?: number;
    z?: number;
    opacity?: number;
    /** Something it leaves behind: called with a scene pixel behind it, every `every` seconds. */
    trail?: { row: number; every: number; emit: (x: number, y: number) => void };
}

/** Anything that crosses the sky flapping: a gull, a bat, a witch, a sleigh. */
function flyer({ frames, frameMs, speed, y, delay = 0, bob = 0, z = Z.near, opacity, trail }: FlyerOptions): Actor {
    const animation = new Animation({
        frames: frames.map((f) => ({ graphic: f.graphic, duration: rnd(...frameMs) })),
        strategy: AnimationStrategy.Loop,
        origin: TOP_LEFT,
    });
    const width = frames[0]!.width;
    const actor = drifter(animation, width, y, speed, z);
    actor.graphics.isVisible = false;
    if (opacity !== undefined) actor.graphics.opacity = opacity;
    let t = 0;
    let sinceTrail = 0;
    actor.on('postupdate', ({ elapsed }) => {
        t += elapsed / 1000;
        if (t < delay) {
            actor.pos = vec(speed > 0 ? -width : W, y);
            return;
        }
        actor.graphics.isVisible = true;
        const top = Math.round(y + bob * Math.sin(t * 0.7));
        actor.pos = vec(actor.pos.x, top);
        if (!trail) return;
        sinceTrail += elapsed / 1000;
        if (sinceTrail < trail.every) return;
        sinceTrail = 0;
        const rear = speed > 0 ? actor.pos.x : actor.pos.x + width - 1;
        trail.emit(rear, top + trail.row);
    });
    return actor;
}

/** A gull crossing the sky, flapping, drifting a little up or down as it goes. */
function gull(colors: SceneColors, delay: number): Actor {
    return flyer({
        frames: GULL_FRAMES.map((rows) => spriteGraphic(rows, colors)),
        frameMs: [110, 150],
        speed: pick([1, -1]) * rnd(26, 40),
        y: rnd(26, HORIZON - 24),
        delay,
        bob: 7,
    });
}

function plane(colors: SceneColors): Actor {
    return blinker(blinkingSprite(PLANE, colors), rnd(14, 44), pick([1, -1]) * rnd(16, 24));
}

function nightShip(colors: SceneColors): Actor {
    const rows = Math.random() < 0.5 ? CARGO_SHIP : CUTTER;
    const pair = blinkingSprite(rows, colors);
    const far = rows === CARGO_SHIP;
    const y = far ? cargoY(pair.on.height) : HORIZON + rnd(8, 18);
    return drifter(pair.on.graphic, pair.on.width, y, pick([1, -1]) * rnd(5, 12), far ? Z.ship : Z.near);
}

/** A shooting star: a fast diagonal streak in the upper sky that fades as it falls. */
function shootingStar(colors: SceneColors): Actor {
    const streak = streakGraphic(colors);
    const from = vec(rnd(20, W - 80), rnd(6, 34));
    const actor = sprite(streak.graphic, from, Z.sky);
    const speed = rnd(150, 230);
    const life = rnd(0.5, 0.9);
    let t = 0;
    actor.on('postupdate', ({ elapsed }) => {
        t += elapsed / 1000;
        actor.pos = vec(Math.round(from.x + speed * t), Math.round(from.y + speed * 0.55 * t));
        actor.graphics.opacity = Math.max(0, 1 - (t / life) ** 2);
        if (t > life || actor.pos.x > W) actor.kill();
    });
    return actor;
}

// ---------------------------------------------------------------------------------------------
// The seasons
// ---------------------------------------------------------------------------------------------

/** One spark of a witch's broom or the sleigh's runners: it sinks and goes out. */
function spark(graphic: Graphic, x: number, y: number): Actor {
    const actor = sprite(graphic, vec(x, y), Z.near);
    let t = 0;
    actor.on('postupdate', ({ elapsed }) => {
        t += elapsed / 1000;
        actor.pos = vec(x, Math.round(y + 5 * t));
        actor.graphics.opacity = Math.max(0, 1 - t / 0.9);
        if (t > 0.9) actor.kill();
    });
    return actor;
}

const dot = (color: string) => runsGraphic(1, 1, [{ x: 0, y: 0, w: 1 }], color);

/** A few bats crossing together: same direction, much the same speed, never in step. */
function batFlock(colors: SeasonColors): Actor[] {
    const frames = BAT_FRAMES.map((rows) => seasonSprite(rows, seasonPalette(colors)));
    const speed = pick([1, -1]) * rnd(24, 34);
    const y = rnd(22, 66);
    return Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, i) =>
        flyer({
            frames,
            frameMs: [80, 110],
            speed: speed * rnd(0.9, 1.1),
            y: y + rnd(-14, 14),
            delay: i * rnd(0.2, 0.8),
            bob: 4,
        }),
    );
}

function witch(colors: SeasonColors, scene: Scene): Actor {
    const sparks = [dot('#ffd45a'), dot('#f58a1f')];
    return flyer({
        frames: [seasonSprite(WITCH, seasonPalette(colors))],
        frameMs: [1000, 1000],
        speed: pick([1, -1]) * rnd(34, 46),
        y: rnd(22, 62),
        bob: 5,
        trail: { row: WITCH_STICK, every: 0.09, emit: (x, y) => scene.add(spark(pick(sparks), x, y)) },
    });
}

/** Night only: it is pale, and it is slow. */
function ghost(colors: SeasonColors): Actor {
    return flyer({
        frames: GHOST_FRAMES.map((rows) => seasonSprite(rows, seasonPalette(colors))),
        frameMs: [450, 550],
        speed: pick([1, -1]) * rnd(6, 10),
        y: rnd(36, HORIZON - 30),
        bob: 4,
        opacity: 0.85,
    });
}

function sleigh(colors: SeasonColors, scene: Scene): Actor {
    const dust = [dot('#ffcf4a'), dot('#fff3b0')];
    return flyer({
        frames: SLEIGH_FRAMES.map((rows) => seasonSprite(rows, seasonPalette(colors))),
        frameMs: [150, 150],
        speed: pick([1, -1]) * rnd(34, 44),
        y: rnd(16, 46),
        bob: 3,
        trail: { row: SLEIGH_RUNNER, every: 0.06, emit: (x, y) => scene.add(spark(pick(dust), x, y)) },
    });
}

/** The bats that were there all along: fluttering round the spot the static picture puts them. */
function lingeringBat(frames: SpriteGraphic[], [hx, hy]: readonly [number, number], i: number): Actor {
    const animation = new Animation({
        frames: frames.map((f) => ({ graphic: f.graphic, duration: 90 + i * 15 })),
        strategy: AnimationStrategy.Loop,
        origin: TOP_LEFT,
    });
    const actor = sprite(animation, vec(hx, hy), Z.near);
    let t = 0;
    actor.on('postupdate', ({ elapsed }) => {
        t += elapsed / 1000;
        actor.pos = vec(
            hx + Math.round(4 * Math.sin(t * (0.8 + 0.25 * i))),
            hy + Math.round(2 * Math.sin(t * (1.3 + 0.2 * i))),
        );
    });
    return actor;
}

/** The jack-o'-lantern in the water by the Kugelbake: its candle flickers, the swell lifts it a
 * row now and then, and by night it throws its light on the sea. */
function pumpkin(colors: SeasonColors, night: boolean): Actor[] {
    const bright = seasonSprite(PUMPKIN, seasonPalette(colors)).graphic;
    const dim = seasonSprite(PUMPKIN, seasonPalette(colors, true)).graphic;
    const animation = new Animation({
        frames: [
            { graphic: bright, duration: 900 },
            { graphic: dim, duration: 110 },
            { graphic: bright, duration: 520 },
            { graphic: dim, duration: 150 },
        ],
        strategy: AnimationStrategy.Loop,
        origin: TOP_LEFT,
    });
    const { x, y } = PUMPKIN_POS;
    const actor = sprite(animation, vec(x, y), Z.near);
    const light = night ? sprite(runsGraphic(7, 7, PUMPKIN_REFLECTION, '#f58a1f'), vec(x, y + 8), Z.near) : undefined;
    if (light) light.graphics.opacity = 0.4;
    let t = 0;
    actor.on('postupdate', ({ elapsed }) => {
        t += elapsed / 1000;
        const lift = Math.round(0.5 + 0.5 * Math.sin(t * 1.3 - Math.PI / 2));
        actor.pos = vec(x, y + lift);
        if (light) light.pos = vec(x, y + 8 + lift);
    });
    return light ? [actor, light] : [actor];
}

/** One flake: a dot or a small plus, sinking and swaying. */
function flakeActor(graphic: Graphic, flake: Flake): Actor {
    const reach = flake.size === 3 ? 1 : 0;
    const actor = sprite(graphic, Vector.Zero, Z.snow);
    let t = 0;
    const place = () => {
        const { x, y, fade } = flakeAt(flake, t);
        actor.pos = vec(x - reach, y - reach);
        actor.graphics.opacity = SNOW_OPACITY * fade;
    };
    place();
    actor.on('postupdate', ({ elapsed }) => {
        t += elapsed / 1000;
        place();
    });
    return actor;
}

function snowfall(colors: SeasonColors): Actor[] {
    const graphics = {
        1: cellsGraphic(1, 1, [{ color: colors.snow, cells: flakeCells(0, 0, 1) }], 0, 0),
        3: cellsGraphic(3, 3, [{ color: colors.snow, cells: flakeCells(1, 1, 3) }], 0, 0),
    };
    return snowField().map((flake) => flakeActor(graphics[flake.size], flake));
}

/** Star, baubles and lights on the Kugelbake, twinkling through a few frames. */
function christmasTree(): Actor {
    const animation = new Animation({
        frames: Array.from({ length: DECOR_FRAMES }, (_, frame) => ({
            graphic: cellsGraphic(DECOR_BOX.w, DECOR_BOX.h, christmasDecor(frame), -DECOR_BOX.x, -DECOR_BOX.y),
            duration: 460,
        })),
        strategy: AnimationStrategy.Loop,
        origin: TOP_LEFT,
    });
    return sprite(animation, vec(DECOR_BOX.x, DECOR_BOX.y), Z.decor);
}

// ---------------------------------------------------------------------------------------------
// The scene
// ---------------------------------------------------------------------------------------------

/** Seconds until the first passer-by, and the window between the ones after it. */
const FIRST_EVENT = 5;
const EVENT_GAP: [number, number] = [15, 60];

export class BackgroundScene extends Scene {
    private colors: SceneColors;
    private night: boolean;
    private countdown = FIRST_EVENT;
    /** Column the harbour starts on; `browser.ts` sets it from the viewport, see `placeHarbour`. */
    private harbourX = W - HARBOUR_W;
    private harbour: Actor[] = [];
    private beacon?: Actor;
    /** What belongs to the Kugelbake — the pumpkin beside it, the lights on it — and goes with it. */
    private extras: Actor[] = [];
    private beaconVisible = true;
    private season: Season | null;
    /** The first passer-by of a season is always one of its own, so a visitor sees it at once. */
    private firstEvent = true;

    constructor(colors: SceneColors, night: boolean, season: Season | null = null) {
        super();
        this.colors = colors;
        this.night = night;
        this.season = season;
    }

    onInitialize(): void {
        this.camera.pos = vec(W / 2, H / 2);
        this.camera.zoom = 1;
        this.build();
    }

    /** Swap day for night (or back) by rebuilding: it happens once in a blue moon. */
    setTheme(colors: SceneColors, night: boolean): void {
        this.colors = colors;
        this.night = night;
        this.clear(false);
        this.harbour = [];
        this.build();
        this.countdown = FIRST_EVENT;
        this.firstEvent = true;
    }

    private build(): void {
        const { colors } = this;

        if (this.night) {
            const star = starGraphic(colors);
            for (const spec of starField()) this.add(starActor(star, spec));
        }

        this.add(sprite(discGraphic(colors), vec(DISC.x - DISC.r, DISC.y - DISC.r), Z.disc));
        this.add(sprite(seaGraphic(colors), vec(0, HORIZON), Z.sea));
        this.add(glitterActor(glitterGraphics(colors)));
        for (const layer of waveLayers(colors)) {
            this.add(waveActor(layer.graphic, layer.band));
        }

        this.harbour.push(sprite(harbourGraphic(colors), vec(this.harbourX, HARBOUR_TOP), Z.harbour));
        if (this.night) this.harbour.push(reflectionActor(reflectionGraphics(colors), this.harbourX));
        for (const actor of this.harbour) this.add(actor);

        const beacon = beaconGraphic(colors);
        this.beacon = sprite(beacon.graphic, vec(beacon.x, beacon.y), Z.beacon);
        this.beacon.graphics.isVisible = this.beaconVisible;
        this.add(this.beacon);

        this.extras = [];
        this.buildSeason();
        for (const actor of this.extras) {
            actor.graphics.isVisible = this.beaconVisible;
            this.add(actor);
        }
    }

    private seasonColors = (): SeasonColors => (this.night ? NIGHT_SEASON : DAY_SEASON);

    /** What a season leaves standing in the scene; its passers-by come from `spawnSeasonal`. */
    private buildSeason(): void {
        const colors = this.seasonColors();
        if (this.season === 'halloween') {
            const bats = BAT_FRAMES.map((rows) => seasonSprite(rows, seasonPalette(colors)));
            BAT_HOMES.forEach((home, i) => this.add(lingeringBat(bats, home, i)));
            this.extras.push(...pumpkin(colors, this.night));
        } else if (this.season === 'christmas') {
            for (const flake of snowfall(colors)) this.add(flake);
            this.extras.push(christmasTree());
        }
    }

    /** Inner pages leave the Kugelbake out, see `--beacon` in `site.css`. */
    showBeacon(visible: boolean): void {
        this.beaconVisible = visible;
        if (this.beacon) this.beacon.graphics.isVisible = visible;
        for (const actor of this.extras) actor.graphics.isVisible = visible;
    }

    /** Keep the harbour at the right edge of whatever part of the scene the viewport shows. */
    placeHarbour(x: number): void {
        this.harbourX = x;
        for (const actor of this.harbour) actor.pos = vec(x, actor.pos.y);
    }

    onPreUpdate(_engine: Engine, elapsed: number): void {
        this.countdown -= elapsed / 1000;
        if (this.countdown > 0) return;
        this.countdown = rnd(...EVENT_GAP);
        this.spawnEvent();
    }

    private spawnEvent(): void {
        const { colors } = this;
        const seasonal = this.season !== null && (this.firstEvent || Math.random() < 0.55);
        this.firstEvent = false;
        if (seasonal) {
            this.spawnSeasonal();
            return;
        }
        if (this.night) {
            const roll = Math.random();
            if (roll < 0.45) this.add(shootingStar(colors));
            else if (roll < 0.8) this.add(plane(colors));
            else this.add(nightShip(colors));
            return;
        }
        const roll = Math.random();
        if (roll < 0.35) this.add(cargoShip(colors));
        else if (roll < 0.6) this.add(cutter(colors));
        else for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.add(gull(colors, i * rnd(0.3, 1.1)));
    }

    private spawnSeasonal(): void {
        const colors = this.seasonColors();
        if (this.season === 'christmas') {
            this.add(sleigh(colors, this));
            return;
        }
        const roll = Math.random();
        if (this.night && roll < 0.25) this.add(ghost(colors));
        else if (roll < 0.6) for (const bat of batFlock(colors)) this.add(bat);
        else this.add(witch(colors, this));
    }
}
