// Home page, read top to bottom as one dive: the name standing in the sky, then the pixel figure
// on the dike with the character sheet that belongs to it, then the projects as windows floating
// on the water, then the last log entries.
//
// The sky, the sea and the Kugelbake are not on this page: they are the background of every page
// (see `src/bg/`), so the home page is only what stands in front of them.

import { esc, relatedText, relatedUrl, type RelatedApp } from '@gjsify/site';
import { entryList, skillGroups } from './components.js';
import { document, inlineMd, urlOf, urlsFor, type Ctx, type ProjectEntry, type ProjectImage } from './layout.js';

/** Part one: the name in the sky. No box, no card — the sky is the backdrop and the name is in it. */
function sky(c: Ctx): string {
    const { basics } = c.resume;
    return `<section class="sky">
<h1 class="name">${esc(basics.name)}</h1>
${basics.label ? `<p class="tagline">${esc(basics.label)}</p>` : ''}
</section>`;
}

/**
 * The pixel figure, standing on a line that reads as the dike's edge — never floating.
 *
 * The scale is the stylesheet's decision, because only it knows the viewport; the configuration
 * only says how far it may go. `trim` is the share of the source image that is empty on each
 * side: it is taken out of the layout width so the sheet beside the figure is not pushed away by
 * transparent pixels, while the image itself still draws at full width.
 *
 * The scale moves in `steps` per whole multiple of the source size: 1 for real pixel art, where a
 * fractional scale would tear the grid; more for a source without one. `baseline` moves the dike line up
 * to the row the feet actually stand on, so a source with empty rows below the figure does not
 * draw the line through thin air. `minScale` lets a large source go below 1× on a phone; there
 * the image is resampled smoothly, since a source without a pixel grid has no pixels to keep.
 */
function figure(c: Ctx): string {
    const { full } = c.site.avatar;
    const max = full.size * full.scale;
    const alt = c.t('Pixel-art figure of {name} on the dike', { name: c.resume.basics.name });
    const vars = [
        `--fig-max:${max}px`,
        `--fig-min:${full.size * Math.min(full.minScale ?? 1, 1)}px`,
        `--fig-step:${full.size / (full.steps ?? 1)}px`,
        `--fig-unit:${full.size}`,
        `--trim:${full.trim ?? 0}`,
        `--fig-floor:${full.baseline ?? 0}`,
    ].join(';');
    // The same breakpoint as `min(78vw, 90vh) < size` in the stylesheet's `--fig`.
    const smooth =
        (full.minScale ?? 1) < 1
            ? `<style>@media (max-width: ${Math.ceil(full.size / 0.78) - 1}px), (max-height: ${Math.ceil(full.size / 0.9) - 1}px) { .avatar-full { image-rendering: auto; } }</style>\n`
            : '';
    return `${smooth}<div class="figure" style="${vars}">
<img class="avatar-full" src="${esc(c.site.config.base + full.src)}" width="${max}" height="${max}" alt="${esc(alt)}" decoding="async">
</div>`;
}

/** Part two: the figure and, beside it, what it can do — free-standing text, no window around it. */
function hero(c: Ctx): string {
    const intro = (c.resume.basics.summary ?? '').split(/\n\s*\n/)[0]?.trim();
    return `<section class="hero">
${figure(c)}
<div class="roll">
${intro ? `<p class="intro">${inlineMd(intro)}</p>` : ''}
${skillGroups(c)}
</div>
</section>`;
}

interface ResolvedProject {
    name: string;
    summary: string;
    url: string;
    icon?: string;
    image?: ProjectImage;
}

/** An entry of `jumplink.projects` with its text filled in — from the app's metainfo or inline. */
function resolve(c: Ctx, entry: ProjectEntry, apps: RelatedApp[]): ResolvedProject | undefined {
    const base = c.site.config.base;
    const image = entry.image && {
        light: base + entry.image.light,
        ...(entry.image.dark ? { dark: base + entry.image.dark } : {}),
    };
    const icon = entry.icon && base + entry.icon;
    if (entry.app !== undefined) {
        const app = apps.find((a) => a.url === entry.app);
        if (!app) return undefined;
        return {
            name: relatedText(app.name, c.lang),
            summary: relatedText(app.summary, c.lang),
            url: relatedUrl(app, c.lang),
            icon: icon ?? app.icon,
            image,
        };
    }
    if (entry.url === undefined || entry.name === undefined) return undefined;
    return {
        name: entry.name,
        summary: entry.summary?.[c.lang] ?? entry.summary?.[c.site.config.defaultLanguage] ?? '',
        url: entry.url,
        icon,
        image,
    };
}

/**
 * One project as a window standing on the water: the screenshot is the object, the words stand
 * free beside it. A project without a screenshot is just its icon and the words.
 */
function window_(p: ResolvedProject): string {
    const shot = p.image
        ? `<picture class="shot">${p.image.dark ? `<source srcset="${esc(p.image.dark)}" media="(prefers-color-scheme: dark)">` : ''}<img src="${esc(p.image.light)}" alt="" loading="lazy" decoding="async"></picture>`
        : '';
    const icon = p.icon ? `<img class="win-icon" src="${esc(p.icon)}" width="48" height="48" alt="">` : '';
    return `<li class="win${p.image ? '' : ' win--plain'}"><a href="${esc(p.url)}">${shot}<span class="win-text">${icon}<strong>${esc(p.name)}</strong><span>${esc(p.summary)}</span></span></a></li>`;
}

/** The screenshots first, then the projects without one in their own list — mixed into the
 * screenshot grid, a name and a line of text went under between two windows. */
function list(cls: string, entries: ResolvedProject[]): string {
    return entries.length === 0 ? '' : `<ul class="${cls}">${entries.map(window_).join('')}</ul>`;
}

function projects(c: Ctx): string {
    const entries = c.site.projects
        .filter((entry) => entry.home !== false)
        .map((entry) => resolve(c, entry, c.site.data.apps))
        .filter((p): p is ResolvedProject => p !== undefined);
    if (entries.length === 0) return '';
    return `<section class="block" id="projects" aria-labelledby="projects-h">
<p class="kicker">${esc(c.t('Inventory'))}</p>
<h2 id="projects-h">${esc(c.t('Things I made'))}</h2>
<div id="apps">${list('windows', entries.filter((p) => p.image))}${list('windows windows--plain', entries.filter((p) => !p.image))}</div>
</section>`;
}

function latest(c: Ctx): string {
    const posts = c.site.posts.filter((p) => p.lang === c.lang).slice(0, 3);
    if (!c.site.config.blog || posts.length === 0) return '';
    return `<section class="block" aria-labelledby="log-h">
<p class="kicker">${esc(c.t('Latest entries'))}</p>
<h2 id="log-h">${esc(c.t('Logbook'))}</h2>
${entryList(c, posts, 3)}
<p><a class="more-link" href="${esc(urlOf.blog(c))}">${esc(c.t('All entries'))}</a></p>
</section>`;
}

export function homePage(c: Ctx): string {
    const { basics } = c.resume;
    const main = `<div class="wrap">
${sky(c)}
${hero(c)}
${projects(c)}
${latest(c)}
</div>`;
    return document(
        c,
        {
            title: `${basics.name} – ${basics.label ?? c.t('Software and writing by {name}.', { name: basics.name })}`,
            description: c.t('Software and writing by {name}.', { name: basics.name }),
            urls: urlsFor(c, (lang) => urlOf.home(c, lang)),
            home: true,
            bodyClass: 'home',
        },
        main,
    );
}
