// Shared page shell: context, <head>, sidebar, footer. Every template is a plain function that
// returns a string; user-visible text goes through `esc`.

import {
    absoluteUrl,
    blogFeedUrl,
    blogIndexUrl,
    developerPageUrl,
    esc,
    githubUrl,
    languageName,
    sitePageUrl,
    type BlogPost,
    type DeveloperData,
    type DeveloperSiteConfig,
    type Resume,
} from '@gjsify/site';
import { staticHarbourSvg, staticSceneSvg } from '../bg/static-svg.js';
import { icon, type IconName } from './icons.js';
import type { Translate } from '../i18n.js';

export interface AvatarImage {
    src: string;
    size: number;
    /** Largest whole-number upscale the page may use. The stylesheet steps down from here. */
    scale: number;
    /** Smallest scale, for a source too large for a phone at 1×. Below 1× the browser resamples
     * smoothly — dropping every other pixel would tear a source that has no pixel grid. */
    minScale?: number;
    /** Scale stops per whole multiple, 1 by default. A source without a pixel grid has no pixels
     * to keep square, so 3 (4/3×, 5/3×, …) buys a figure that fills the screen without a seam. */
    steps?: number;
    /** Share of the source image that is empty on each side, as a fraction of its width. */
    trim?: number;
    /** Source pixels between the figure's feet and the lower edge of the image — the row the
     * page draws the dike line on. */
    baseline?: number;
}

export interface Avatar {
    full: AvatarImage;
    /** Favicon, a path below the site root. The full figure when unset — legible at 16 px only if
     * it is a head, so a figure taller than wide wants its own crop here. */
    icon?: string;
}

/**
 * Screenshot of a project. `dark` is used whenever the page shows its night scheme — the system
 * setting, or the one the reader forced by clicking the sun or the moon — when the file exists.
 *
 * The file is shown as delivered: its shadow and rounded corners come from the window it was taken
 * of, and the page adds nothing. A shot that looks wrong is fixed by retaking it.
 */
export interface ProjectImage {
    light: string;
    dark?: string;
}

/**
 * One entry of `jumplink.projects` in `package.json`. Either it points at an app of
 * `gjsify.site.developer.apps` with `app`, and name, summary and icon come from that app's
 * metainfo — translations included, which is why they are not repeated here — or it stands on its
 * own with `url`, `name` and a `summary` per language.
 */
export interface ProjectEntry {
    app?: string;
    url?: string;
    name?: string;
    summary?: Record<string, string>;
    /** Site-relative icon path; overrides the metainfo icon of an `app` entry. */
    icon?: string;
    image?: ProjectImage;
    /** `false` keeps the entry off the home page; the CV still takes its icon. */
    home?: boolean;
}

export interface Site {
    config: DeveloperSiteConfig;
    data: DeveloperData;
    posts: BlogPost[];
    avatar: Avatar;
    projects: ProjectEntry[];
    cssHref: string;
    /** Hashed URL of the background bundle; missing when it was not built. */
    bgHref?: string;
}

export interface Ctx {
    site: Site;
    lang: string;
    t: Translate;
    resume: Resume;
}

export type NavId = 'blog' | 'cv' | 'support';

export interface Page {
    title: string;
    description: string;
    /** Root-relative URL of this page in each language that has it. */
    urls: Record<string, string>;
    ogType?: 'website' | 'article' | 'profile';
    /** Ready-made `<script type="application/ld+json">` elements. */
    jsonLd?: string[];
    /** Extra feeds: the blog feed of the language is always linked. */
    feeds?: { title: string; href: string }[];
    current?: NavId;
    home?: boolean;
    bodyClass?: string;
}

export const ogLocale = (lang: string) => (lang === 'de' ? 'de_DE' : 'en_US');

export const urlOf = {
    home: (c: Ctx, lang = c.lang) => sitePageUrl(c.site.config, lang),
    view: (c: Ctx, view: 'cv' | 'support' | 'privacy' | 'legal-notice', lang = c.lang) =>
        developerPageUrl(c.site, lang, view),
    blog: (c: Ctx, lang = c.lang) => blogIndexUrl(c.site.config, lang),
    feed: (c: Ctx, lang = c.lang) => blogFeedUrl(c.site.config, lang),
};

/** Both languages of a page that exists everywhere under the same path. */
export function urlsFor(c: Ctx, path: (lang: string) => string): Record<string, string> {
    return Object.fromEntries(c.site.config.languages.map((lang) => [lang, path(lang)]));
}

function profile(c: Ctx, network: string) {
    return c.resume.basics.profiles.find((p) => p.network.toLowerCase() === network && p.url);
}

function head(c: Ctx, page: Page): string {
    const { config } = c.site;
    const abs = (path: string) => absoluteUrl(config, path);
    const self = page.urls[c.lang] ?? urlOf.home(c);
    const alternates = Object.entries(page.urls).map(
        ([code, url]) => `<link rel="alternate" hreflang="${esc(code)}" href="${esc(abs(url))}">`,
    );
    const fallback = page.urls[config.defaultLanguage];
    if (fallback) alternates.push(`<link rel="alternate" hreflang="x-default" href="${esc(abs(fallback))}">`);
    const feeds = [{ title: `${c.resume.basics.name} – ${c.t('Logbook')}`, href: urlOf.feed(c) }, ...(page.feeds ?? [])];
    const image = c.resume.basics.image ? abs(c.resume.basics.image) : undefined;
    const og: [string, string | undefined][] = [
        ['og:title', page.title],
        ['og:description', page.description],
        ['og:url', abs(self)],
        ['og:type', page.ogType ?? 'website'],
        ['og:site_name', c.resume.basics.name],
        ['og:locale', ogLocale(c.lang)],
        ['og:image', image],
    ];
    return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="color-scheme" content="dark light">
<link rel="canonical" href="${esc(abs(self))}">
${alternates.join('\n')}
${og
    .filter(([, value]) => value)
    .map(([property, value]) => `<meta property="${property}" content="${esc(value ?? '')}">`)
    .join('\n')}
<meta name="twitter:card" content="summary">
${feeds.map((f) => `<link rel="alternate" type="application/atom+xml" title="${esc(f.title)}" href="${esc(f.href)}">`).join('\n')}
<link rel="icon" href="${esc(config.base + (c.site.avatar.icon ?? c.site.avatar.full.src))}" type="image/png">
<link rel="preload" href="${esc(config.base + 'assets/fonts/adwaita-sans-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${esc(config.base + 'assets/fonts/ark-pixel-10px-proportional-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${esc(c.site.cssHref)}">
${(page.jsonLd ?? []).join('\n')}`;
}

function languageSwitch(c: Ctx, page: Page): string {
    const items = c.site.config.languages.map((code) => {
        const url = page.urls[code] ?? urlOf.home(c, code);
        const name = languageName(code);
        return code === c.lang
            ? `<li><a href="${esc(url)}" lang="${esc(code)}" aria-current="true" title="${esc(name)}">${esc(code.toUpperCase())}</a></li>`
            : `<li><a href="${esc(url)}" lang="${esc(code)}"${page.urls[code] ? ` hreflang="${esc(code)}"` : ''} title="${esc(name)}">${esc(code.toUpperCase())}</a></li>`;
    });
    return `<nav class="lang" aria-label="${esc(c.t('Language'))}"><ul>${items.join('')}</ul></nav>`;
}

export function menuEntries(c: Ctx): { id: NavId; label: string; href: string }[] {
    const entries: { id: NavId; label: string; href: string }[] = [];
    if (c.site.config.blog) entries.push({ id: 'blog', label: c.t('Logbook'), href: urlOf.blog(c) });
    entries.push({ id: 'cv', label: c.t('CV'), href: urlOf.view(c, 'cv') });
    if (c.site.config.support.length > 0) entries.push({ id: 'support', label: c.t('Support'), href: urlOf.view(c, 'support') });
    return entries;
}

/**
 * The navigation, identical on every page: the menu and the language switch, nothing else.
 *
 * The name is not repeated here. It stands in the sky on the home page, which the first menu
 * entry leads back to, and a second copy of it in the margin of every page was one name too
 * many.
 *
 * It is one element in one place in the source order — a wide screen puts it in the left margin,
 * a narrow one slides it in from the side. Without JavaScript the stylesheet leaves it in the
 * flow as a plain list of links, which is why the toggle is hidden until `<html>` is marked `js`.
 */
function sidebar(c: Ctx, page: Page): string {
    const items = [
        { label: c.t('Home page'), href: urlOf.home(c), current: page.home === true },
        ...menuEntries(c).map((e) => ({ label: e.label, href: e.href, current: e.id === page.current })),
    ].map(
        (e) => `<li><a href="${esc(e.href)}"${e.current ? ' aria-current="page"' : ''}>${esc(e.label)}</a></li>`,
    );
    return `<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="side">
${icon('menu')}${esc(c.t('Menu'))}
</button>
<div class="nav-backdrop"></div>
<div class="side" id="side">
<nav class="nav" aria-label="${esc(c.t('Main menu'))}"><ul>${items.join('')}</ul></nav>
${languageSwitch(c, page)}
</div>`;
}

function footer(c: Ctx): string {
    const { config } = c.site;
    const links: { label: string; href: string; icon: IconName; rel?: string }[] = [];
    if (config.support.length > 0) links.push({ label: c.t('Support'), href: urlOf.view(c, 'support'), icon: 'heart' });
    if (config.privacy) links.push({ label: c.t('Privacy'), href: urlOf.view(c, 'privacy'), icon: 'shield' });
    if (config.legalNotice) links.push({ label: c.t('Legal notice'), href: urlOf.view(c, 'legal-notice'), icon: 'info-box' });
    const github = profile(c, 'github');
    if (github?.url) links.push({ label: 'GitHub', href: github.url, icon: 'github' });
    const mastodon = profile(c, 'mastodon');
    if (mastodon?.url) links.push({ label: 'Mastodon', href: mastodon.url, icon: 'mastodon', rel: 'me' });
    const source = githubUrl(config.repository);
    if (source) links.push({ label: c.t('Source code'), href: source, icon: 'code' });
    if (config.blog) links.push({ label: c.t('Atom feed'), href: urlOf.feed(c), icon: 'rss', rel: 'alternate' });
    const items = links.map(
        (l) => `<li><a href="${esc(l.href)}"${l.rel ? ` rel="${l.rel}"` : ''}>${icon(l.icon)}${esc(l.label)}</a></li>`,
    );
    return `<footer class="site-footer"><ul>${items.join('')}</ul><p>© ${new Date().getUTCFullYear()} ${esc(c.resume.basics.name)}</p></footer>`;
}

/**
 * The background: a band at the very top of the document, not a fixed backdrop. It holds the CSS
 * sky, the static scene over it, and — only if the bundle was built and the reader did not ask
 * for less motion — a canvas that takes the scene over. `.bg-deep` is the dive: a gradient from
 * the sea into the colour `html` carries for the whole page below, so the band has no lower edge.
 *
 * The loader is inline because it is shorter than the request it would cost, and it runs on idle
 * so the background never competes with the first paint.
 */
function background(c: Ctx): string {
    const load = c.site.bgHref
        ? `<script>(function(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;` +
          `var g=function(){import(${JSON.stringify(c.site.bgHref)}).catch(function(){})};` +
          `window.requestIdleCallback?requestIdleCallback(g,{timeout:3000}):addEventListener("load",g)})()</script>`
        : '';
    return `<div class="bg" aria-hidden="true"><div class="bg-sky"></div>${staticSceneSvg()}${staticHarbourSvg()}<div class="bg-deep"></div></div>
${load}`;
}

/**
 * The drawer. Only below the sidebar's breakpoint does the stylesheet make any of this visible;
 * the script is the same on every width and simply opens and closes an element. Escape closes it,
 * opening moves focus into the menu and closing puts it back on the button.
 */
const DRAWER = `(function(){
var r=document.documentElement,b=document.querySelector(".nav-toggle"),s=document.getElementById("side"),k=document.querySelector(".nav-backdrop");
if(!b||!s||!k)return;
function set(open){r.classList.toggle("nav-open",open);b.setAttribute("aria-expanded",open?"true":"false");
if(open){s.setAttribute("data-open","");var a=s.querySelector("a");if(a)a.focus()}else{s.removeAttribute("data-open")}}
b.addEventListener("click",function(){var open=b.getAttribute("aria-expanded")==="true";set(!open);if(open)b.focus()});
k.addEventListener("click",function(){set(false);b.focus()});
addEventListener("keydown",function(e){if(e.key==="Escape"&&r.classList.contains("nav-open")){set(false);b.focus()}});
})()`;

/**
 * The first thing the page runs: mark the document as scripted, and put a scheme the reader chose
 * on an earlier page back on `<html>` before anything is painted. Reading it later — from the
 * module at the end of the body — would show one frame of the system scheme on every navigation,
 * which is the flash this exists to avoid.
 */
const SCHEME_BOOT = `(function(){var r=document.documentElement;r.classList.add("js");
try{var s=localStorage.getItem("scheme");if(s==="light"||s==="dark")r.dataset.scheme=s}catch(e){}})()`;

/**
 * Sun and moon. The button sits over the disc — the stylesheet places it, off the same grid as the
 * scene — and swaps day for night.
 *
 * The forced scheme is `data-scheme` on `<html>`, which sets `color-scheme` and so carries every
 * `light-dark()` token with it. Three things do not follow on their own. A `<picture>` source
 * matches on a media query and a media query cannot see an attribute, so those are rewritten here
 * to `all` / `not all` while an override is active and handed back their own query when it is
 * dropped. The canvas has its own palette and listens for the event below. And the next page
 * starts from scratch, which is what `localStorage` and the boot script above are for.
 *
 * A click always shows the opposite of what is on screen. When that opposite is what the system
 * asks for anyway, the override is dropped instead of pinned: two clicks put the page back under
 * the system setting, and leave it free to follow a system that changes later.
 */
const SCHEME = `(function(){
var r=document.documentElement,b=document.querySelector(".scheme-toggle"),v=document.querySelector(".dusk");
if(!b)return;
var sys=matchMedia("(prefers-color-scheme: dark)");
var pics=[].map.call(document.querySelectorAll("picture source"),function(s){return[s,s.media]})
.filter(function(p){return p[1].indexOf("prefers-color-scheme")>=0});
function sync(){var f=r.dataset.scheme;
for(var i=0;i<pics.length;i++){var s=pics[i][0],m=pics[i][1];
s.media=f?(/dark/.test(m)===(f==="dark")?"all":"not all"):m}}
function apply(next){
if(next===(sys.matches?"dark":"light"))delete r.dataset.scheme;else r.dataset.scheme=next;
try{if(r.dataset.scheme)localStorage.setItem("scheme",r.dataset.scheme);else localStorage.removeItem("scheme")}catch(e){}
sync();dispatchEvent(new CustomEvent("jl:scheme",{detail:{dark:next==="dark"}}))}
if(v)v.addEventListener("animationend",function(){v.removeAttribute("data-on")});
b.addEventListener("click",function(){
var shown=r.dataset.scheme||(sys.matches?"dark":"light"),next=shown==="dark"?"light":"dark";
if(!v||matchMedia("(prefers-reduced-motion: reduce)").matches)return apply(next);
v.removeAttribute("data-on");void v.offsetWidth;v.setAttribute("data-on","");
setTimeout(function(){apply(next)},410)});
sys.addEventListener("change",sync);sync()})()`;

export function document(c: Ctx, page: Page, main: string): string {
    return `<!doctype html>
<html lang="${esc(c.lang)}">
<head>
${head(c, page)}
<script>${SCHEME_BOOT}</script>
</head>
<body${page.bodyClass ? ` class="${esc(page.bodyClass)}"` : ''}>
${background(c)}
<a class="skip" href="#main">${esc(c.t('Skip to content'))}</a>
<div class="shell">
${sidebar(c, page)}
<div class="col">
<main id="main">
${main}
</main>
${footer(c)}
</div>
</div>
<button class="scheme-toggle" type="button" aria-label="${esc(c.t('Switch day and night'))}"></button>
<div class="dusk" aria-hidden="true"></div>
<script>${DRAWER}</script>
<script>${SCHEME}</script>
</body>
</html>
`;
}

export const kicker = (text: string) => `<p class="kicker">${esc(text)}</p>`;

/** Escapes text and turns `[text](https://…)` links into anchors. */
export function inlineMd(text: string): string {
    return esc(text).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
}
