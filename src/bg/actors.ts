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
    discGraphic,
    glitterGraphics,
    harbourGraphic,
    reflectionGraphics,
    seaGraphic,
    spriteGraphic,
    starGraphic,
    streakGraphic,
    waveLayers,
    GLITTER_ANCHOR,
    type SpriteGraphic,
} from './graphics.js';
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
const Z = { sky: 0, disc: 10, harbour: 20, sea: 30, reflection: 34, ship: 36, wave: 40, near: 50, beacon: 60 };

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

/** A gull crossing the sky, flapping, drifting a little up or down as it goes. */
function gull(colors: SceneColors, delay: number): Actor {
    const frames = GULL_FRAMES.map((rows) => spriteGraphic(rows, colors));
    const animation = new Animation({
        frames: frames.map((f) => ({ graphic: f.graphic, duration: rnd(110, 150) })),
        strategy: AnimationStrategy.Loop,
        origin: TOP_LEFT,
    });
    const width = frames[0]!.width;
    const speed = pick([1, -1]) * rnd(26, 40);
    const y0 = rnd(26, HORIZON - 24);
    const actor = drifter(animation, width, y0, speed, Z.near);
    actor.graphics.isVisible = false;
    let t = 0;
    actor.on('postupdate', ({ elapsed }) => {
        t += elapsed / 1000;
        if (t < delay) {
            actor.pos = vec(speed > 0 ? -width : W, y0);
            return;
        }
        actor.graphics.isVisible = true;
        actor.pos = vec(actor.pos.x, Math.round(y0 + 7 * Math.sin(t * 0.7)));
    });
    return actor;
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
    private beaconVisible = true;

    constructor(colors: SceneColors, night: boolean) {
        super();
        this.colors = colors;
        this.night = night;
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
    }

    /** Inner pages leave the Kugelbake out, see `--beacon` in `site.css`. */
    showBeacon(visible: boolean): void {
        this.beaconVisible = visible;
        if (this.beacon) this.beacon.graphics.isVisible = visible;
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
}
