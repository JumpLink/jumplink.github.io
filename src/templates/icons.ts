// Icons from Pixelarticons 2.4.2 (https://github.com/halfmage/pixelarticons, MIT, © Gerrit
// Halfmann) — the set the old site used. Only the path data is copied, one entry per icon: to add
// one, copy the `d` of `svg/<name>.svg` from the package. Inline rather than <img>, so an icon
// takes `currentColor` and follows the link's colour in both schemes.

const PATHS = {
    'code': 'M11 18H9v-4h2v4Zm-4-1H5v-2h2v2Zm12-2v2h-2v-2h2ZM5 15H3v-2h2v2Zm16 0h-2v-2h2v2Zm-8-1h-2v-4h2v4ZM3 13H1v-2h2v2Zm20 0h-2v-2h2v2ZM5 11H3V9h2v2Zm16 0h-2V9h2v2Zm-6-1h-2V6h2v4ZM7 9H5V7h2v2Zm12 0h-2V7h2v2Z',
    'github': 'M5 2h4v2H7v2H5V2Zm0 10H3V6h2v6Zm2 2H5v-2h2v2Zm2 2v-2H7v2H3v-2H1v2h2v2h4v4h2v-4h2v-2H9Zm0 0v2H7v-2h2Zm6-12v2H9V4h6Zm4 2h-2V4h-2V2h4v4Zm0 6V6h2v6h-2Zm-2 2v-2h2v2h-2Zm-2 2v-2h2v2h-2Zm0 2h-2v-2h2v2Zm0 0h2v4h-2v-4Z',
    'heart': 'M13 22h-2v-2h2v2Zm-2-2H9v-2h2v2Zm4 0h-2v-2h2v2Zm-6-2H7v-2h2v2Zm8 0h-2v-2h2v2ZM7 16H5v-2h2v2Zm12 0h-2v-2h2v2ZM5 14H3v-2h2v2Zm16 0h-2v-2h2v2ZM3 12H1V6h2v6Zm20 0h-2V6h2v6ZM13 8h-2V6h2v2ZM5 6H3V4h2v2Zm6 0H9V4h2v2Zm4 0h-2V4h2v2Zm6 0h-2V4h2v2ZM9 4H5V2h4v2Zm10 0h-4V2h4v2Z',
    'info-box': 'M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zm-9 5h2V7h-2zm0 8h2v-6h-2z',
    'mastodon': 'M11 20v2H7v-2h4Zm-4-2v2H5v-2h2Zm6 0v2h-2v-2h2ZM5 6v12H3V6h2Zm6 10v2H9v-2h2Zm8-2v2h-8v-2h8Zm2-8v8h-2V6h2ZM9 8v4H7V8h2Zm8 0v4h-2V8h2Zm-4 0v2h-2V8h2Zm-2-2v2H9V6h2Zm4 0v2h-2V6h2ZM7 4v2H5V4h2Zm12 0v2h-2V4h2Zm-2-2v2H7V2h10Z',
    'menu': 'M20 18H4v-2h16v2Zm0-5H4v-2h16v2Zm0-5H4V6h16v2Z',
    'rss': 'M4 10h6v2H4zm8 4h2v6h-2zm6 0h2v6h-2zM4 16h4v4H4zm12-6h2v4h-2zm-2-2h2v2h-2zM4 4h6v2H4zm6 2h4v2h-4zm0 6h2v2h-2z',
    'shield': 'M4 2h16v2H4zM2 4h2v10H2zm18 0h2v10h-2zM4 14h2v2H4zm2 2h2v2H6zm4 4h4v2h-4zm10-6h-2v2h2zm-2 2h-2v2h2zm-2 2h-2v2h2zm-6 0H8v2h2z',
} as const;

export type IconName = keyof typeof PATHS;

/** A 24 × 24 icon, drawn at whole pixels; decorative, so the text beside it carries the meaning. */
export function icon(name: IconName): string {
    return `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="${PATHS[name]}"/></svg>`;
}
