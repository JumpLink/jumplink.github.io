// Character sheet: the résumé as a page that prints as a plain CV.

import { absoluteUrl, esc, formatResumeDate, relatedText } from '@gjsify/site';
import { skillGroups } from './components.js';
import { document, kicker, urlOf, urlsFor, type Ctx } from './layout.js';
import { personJsonLd } from './seo.js';

const range = (c: Ctx, start?: string, end?: string) => {
    if (!start && !end) return '';
    const from = start ? formatResumeDate(start, c.lang) : '';
    const to = end ? formatResumeDate(end, c.lang) : c.t('today');
    return `${from} – ${to}`;
};

const link = (url: string | undefined, text: string) =>
    url ? `<a href="${esc(url)}">${esc(text)}</a>` : esc(text);

const highlights = (items: readonly string[]) =>
    items.length > 0 ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';

/** Section with a HUD kicker; `heading` adds a pixel h2 that says something else, otherwise the kicker is the heading. */
function section(id: string, title: string, body: string, heading?: string): string {
    if (!body) return '';
    const top = heading
        ? `<p class="kicker">${esc(title)}</p><h2 id="${id}">${esc(heading)}</h2>`
        : `<h2 class="kicker" id="${id}">${esc(title)}</h2>`;
    return `<section class="block" aria-labelledby="${id}">${top}${body}</section>`;
}

/** Shop-era work: collapsed under "Earlier quests". Age alone does not send a project there. */
const isEarlier = (p: { keywords: readonly string[] }) => p.keywords.some((k) => /shopify/i.test(k));

export function cvPage(c: Ctx): string {
    const { resume, t } = c;
    const { basics } = resume;
    const where = [basics.location?.city, basics.location?.region, basics.location?.countryCode].filter(Boolean).join(', ');
    const icons = new Map(c.site.data.apps.map((a) => [relatedText(a.name, c.lang).toLowerCase(), a.icon]));
    // The icons set in `jumplink.projects`, matched by link: the résumé names a project its own
    // way ("CORRECTIV-App" for the entry "CORRECTIV Workbench"), the URL is the same.
    const projectIcons = new Map(
        c.site.projects.flatMap((e) => (e.icon ? [[e.url ?? e.app, c.site.config.base + e.icon] as const] : [])),
    );

    const work = resume.work.map(
        (w) => `<li class="quest">
<p class="kicker">${esc(range(c, w.startDate, w.endDate))}${w.location ? ` · ${esc(w.location)}` : ''}</p>
<h3>${esc(w.position ?? w.name)}${w.position ? ` · ${link(w.url, w.name)}` : ''}</h3>
${w.summary ? `<p>${esc(w.summary)}</p>` : ''}
${highlights(w.highlights)}
</li>`,
    );
    const slot = (p: (typeof resume.projects)[number]) => {
        const icon = (p.url && projectIcons.get(p.url)) || icons.get(p.name.toLowerCase());
        const art = icon
            ? `<img src="${esc(icon)}" width="48" height="48" alt="">`
            : '<span class="glyph" aria-hidden="true"></span>';
        return `<li class="slot"><a href="${esc(p.url ?? '#')}">${art}<span class="slot-text"><strong>${esc(p.name)}</strong>${p.description ? `<span class="clamp">${esc(p.description)}</span>` : ''}</span></a></li>`;
    };
    const current = resume.projects.filter((p) => !isEarlier(p));
    const earlier = resume.projects.filter(isEarlier);
    const items =
        current.length > 0
            ? `<ul class="inventory">${current.map(slot).join('')}</ul>${
                  earlier.length > 0
                      ? `<details class="earlier"><summary>${esc(t('Earlier quests'))}</summary><ul class="inventory">${earlier.map(slot).join('')}</ul></details>`
                      : ''
              }`
            : '';
    const education = resume.education.map(
        (e) => `<li><span class="when">${esc(range(c, e.startDate, e.endDate).replace(/ – /, '–'))}</span> <strong>${link(e.url, e.institution)}</strong>${(e.area ?? e.studyType) ? ` · ${esc(e.area ?? e.studyType ?? '')}` : ''}</li>`,
    );
    const languages = resume.languages.map((l) => `<li>${esc(l.language)}${l.fluency ? ` <span class="when">${esc(l.fluency)}</span>` : ''}</li>`);
    const profiles = basics.profiles
        .filter((p) => p.url)
        .map((p) => `<li><a href="${esc(p.url ?? '')}" rel="me">${esc(p.network)}</a></li>`);

    // The figure, the label and the intro stand on the home page; here only the title, and for
    // paper the lines a printed CV needs at its head.
    const head = `<header class="cv-head">
${kicker(basics.name)}
<h1>${esc(t('CV'))}</h1>
<div class="print-only">
${basics.label ? `<p class="label">${esc(basics.label)}</p>` : ''}
${where ? `<p class="where">${esc(where)}</p>` : ''}
<p>${esc(basics.url ?? '')}${basics.email ? ` · ${esc(basics.email)}` : ''}</p>
</div>
</header>`;

    const main = `<div class="wrap prose-page cv">
${head}
${section('cv-work', t('Quests'), work.length ? `<ol class="timeline">${work.join('')}</ol>` : '', t('Work and projects'))}
${section('cv-items', t('Items'), items, t('Things I made'))}
${section('cv-skills', t('Skills'), skillGroups(c))}
${section('cv-edu', t('Education'), education.length ? `<ul class="plainlist">${education.join('')}</ul>` : '')}
${section('cv-lang', t('Languages'), languages.length ? `<ul class="inline">${languages.join('')}</ul>` : '')}
${section('cv-profiles', t('Profiles'), profiles.length ? `<ul class="inline">${profiles.join('')}</ul>` : '')}
</div>`;

    const { config } = c.site;
    return document(
        c,
        {
            title: `${t('CV')} – ${basics.name}`,
            description: t('Experience, projects and skills of {name}.', { name: basics.name }),
            urls: urlsFor(c, (lang) => urlOf.view(c, 'cv', lang)),
            ogType: 'profile',
            current: 'cv',
            jsonLd: [
                personJsonLd({
                    name: basics.name,
                    url: basics.url ?? config.url,
                    jobTitle: basics.label,
                    description: basics.summary?.split(/\n\s*\n/)[0]?.trim(),
                    image: basics.image ? absoluteUrl(config, basics.image) : undefined,
                    email: basics.email,
                    sameAs: basics.profiles.map((p) => p.url).filter((u): u is string => Boolean(u)),
                }),
            ],
        },
        main,
    );
}
