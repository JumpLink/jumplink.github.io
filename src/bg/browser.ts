// Browser entry for the animated background.
//
// This is the only module that touches the DOM. The page ships without it and looks finished:
// the CSS gradient is the sky, an inline SVG is the sea and the Kugelbake. This bundle is
// imported on idle, puts a canvas on top of that SVG and hides it once the first frame is out,
// so the hand-over is invisible.
//
// It deliberately does nothing when the reader asked for less motion, when the tab is hidden, or
// when WebGL is unavailable — in each case the static picture simply stays.

import { Color, DisplayMode, Engine } from 'excalibur';
import { BackgroundScene } from './actors.js';
import { BEACON_X, DAY, H, HORIZON, NIGHT, W } from './scene.js';

// Where the scene is pinned inside the band. Every line below is the arithmetic the stylesheet
// does for `.bg-svg` — the same scale, the same two clamps — because the canvas is laid over that
// SVG and then hides it. Get one of them wrong and the moon jumps at the hand-over.
/** The waterline sits this far down the band on the home page. Inner pages push it almost to the
 * bottom edge of their much shorter band, so the sky — and the disc in it — still has room. */
const HORIZON_AT = 0.6222;
/** Largest and smallest upscale, mirroring the `clamp()` on `--bg-unit`. */
const MIN_UNIT = 2;
const MAX_UNIT = 12;
/**
 * Two numbers the stylesheet owns, because both differ per page and per breakpoint: how far down
 * the band the waterline sits (`--horizon-at`) and how far across the viewport the Kugelbake
 * stands (`--beacon-at`). Read them from the host rather than keeping a second copy here that
 * drifts out of step and makes the scene jump at the canvas hand-over.
 */
function cssRatio(host: Element, name: string, fallback: number): number {
    const value = Number.parseFloat(getComputedStyle(host).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
}

/**
 * Which palette the page is showing. `data-scheme` on `<html>` is the scheme the reader forced by
 * clicking the sun or the moon, and it wins over the system setting — the same order the
 * stylesheet uses, where that attribute sets `color-scheme` and every `light-dark()` follows it.
 * Only when there is no override does the media query decide.
 */
const prefersDark = () => {
    const forced = document.documentElement.dataset.scheme;
    if (forced === 'dark' || forced === 'light') return forced === 'dark';
    return !window.matchMedia('(prefers-color-scheme: light)').matches;
};

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Smallest whole-number scale that still covers the band, bounded so a wide desktop screen does
 * not get absurdly chunky pixels and a phone still sees the whole width.
 */
function scaleFor(width: number, height: number): number {
    return clamp(MIN_UNIT, Math.ceil(Math.max(width / W, height / H)), MAX_UNIT);
}

function layout(host: HTMLElement, canvas: HTMLCanvasElement, engine: Engine): void {
    const vw = window.innerWidth;
    // The band's own height, not the viewport's: the scene scrolls away with the page, and the
    // stylesheet clamps that height in pixels.
    const bandH = host.clientHeight;
    const scale = scaleFor(vw, bandH);
    const width = W * scale;
    const height = H * scale;

    // Pin the horizon and the beacon where the design wants them, then pull the canvas back
    // inside the band if that would expose an edge.
    const horizonAt = cssRatio(host, '--horizon-at', HORIZON_AT);
    const beaconAt = cssRatio(host, '--beacon-at', BEACON_X / W);
    const top = clamp(bandH - height, Math.round(bandH * horizonAt - HORIZON * scale), 0);
    const left = clamp(vw - width, Math.round(vw * beaconAt - BEACON_X * scale), 0);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;

    engine.screen.viewport = { width, height };
    engine.screen.applyResolutionAndViewport();
}

export function start(): void {
    const host = document.querySelector<HTMLElement>('.bg');
    if (!host || host.querySelector('canvas')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'bg-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);

    let engine: Engine;
    try {
        engine = new Engine({
            canvasElement: canvas,
            displayMode: DisplayMode.Fixed,
            resolution: { width: W, height: H },
            viewport: { width: W * 2, height: H * 2 },
            // Not `pixelArt: true`: that preset smooths texel edges and writes an inline
            // `image-rendering: auto` on the canvas, which beats the stylesheet and blurs the
            // upscale. `antialiasing: false` gives nearest-neighbour filtering and `pixelated`.
            antialiasing: false,
            // The canvas is scaled by whole numbers and drawn with `image-rendering: pixelated`,
            // so letting the device pixel ratio multiply the backing store buys nothing and costs
            // memory on a HiDPI screen.
            suppressHiDPIScaling: true,
            backgroundColor: Color.Transparent,
            enableCanvasTransparency: true,
            maxFps: 30,
            suppressPlayButton: true,
            suppressConsoleBootMessage: true,
            suppressMinimumBrowserFeatureDetection: true,
        });
    } catch {
        // No WebGL, or a context the engine refuses: leave the static picture in place.
        canvas.remove();
        return;
    }

    const scene = new BackgroundScene(prefersDark() ? NIGHT : DAY, prefersDark());
    const game = engine.addScene('bg', scene);

    const relayout = () => layout(host, canvas, engine);
    relayout();
    window.addEventListener('resize', relayout, { passive: true });

    // Two ways the scheme can change under the canvas: the system setting, and the reader clicking
    // the sun or the moon. The second one is an attribute on `<html>`, which nothing can listen
    // to, so the inline script that sets it says so with an event.
    const repaint = () => scene.setTheme(prefersDark() ? NIGHT : DAY, prefersDark());
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', repaint);
    window.addEventListener('jl:scheme', repaint);

    // A background that keeps running in a tab nobody is looking at is pure battery. Stopping the
    // clock parks the loop without tearing the engine down, so coming back is a single frame.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) engine.clock.stop();
        else if (!engine.clock.isRunning()) engine.clock.start();
    });

    void game.start('bg').then(() => host.classList.add('bg--live'));
}

start();
