// Pieces that appear on more than one page. Each one has a single markup and a single class in
// the stylesheet, so a change to it shows everywhere at once (see docs/design.md, "One look").

import { esc, formatPostDate, postDescription, postUrl, tagUrl, type BlogPost } from '@gjsify/site';
import type { Ctx } from './layout.js';

export interface Chip {
    text: string;
    href?: string;
    /** Marks the chip of the page you are on (a tag page's own tag). */
    current?: boolean;
    rel?: string;
}

/** A row of pixel-framed chips: skills on the home page and the CV, tags in the logbook. */
export function chips(items: readonly Chip[], label?: string): string {
    if (items.length === 0) return '';
    const chip = (i: Chip) =>
        i.href
            ? `<li><a class="chip" href="${esc(i.href)}"${i.rel ? ` rel="${esc(i.rel)}"` : ''}${i.current ? ' aria-current="page"' : ''}>${esc(i.text)}</a></li>`
            : `<li><span class="chip">${esc(i.text)}</span></li>`;
    return `<ul class="chips"${label ? ` aria-label="${esc(label)}"` : ''}>${items.map(chip).join('')}</ul>`;
}

const ecommerce = (name: string) => /e-?commerce/i.test(name);

/**
 * The skills, one group per résumé entry, one chip per keyword. The home page and the CV render
 * the same data through this one function, so there is one list to keep true and one look.
 * E-commerce goes last: it is the old shop work, kept low on purpose.
 */
export function skillGroups(c: Ctx): string {
    const groups = [...(c.resume.skills ?? [])]
        .filter((s) => s.name && (s.keywords?.length ?? 0) > 0)
        .sort((a, b) => Number(ecommerce(a.name)) - Number(ecommerce(b.name)));
    if (groups.length === 0) return '';
    const items = groups.map(
        (g) => `<li><h3 class="kicker group-name">${esc(g.name)}</h3>${chips((g.keywords ?? []).map((k) => ({ text: k })))}</li>`,
    );
    return `<ul class="groups" aria-label="${esc(c.t('Skill tree'))}">${items.join('')}</ul>`;
}

/** A post's tags as chips, each linking to its tag page; `current` marks the page's own tag. */
export const tagChips = (c: Ctx, tags: readonly string[], current?: string) =>
    chips(tags.map((tag) => ({ text: tag, href: tagUrl(c.site.config, c.lang, tag), rel: 'tag', current: tag === current })));

export const dateLine = (c: Ctx, post: BlogPost, extra = '') =>
    `<p class="kicker"><time datetime="${esc(post.date)}">${esc(formatPostDate(post.date, c.lang))}</time>${extra}</p>`;

/**
 * Logbook entries as a list: date, title, summary, tags. The logbook index and the last entries
 * on the home page are the same list; `level` is the only difference, because on the home page
 * the titles sit under the section's own h2.
 */
export function entryList(c: Ctx, posts: readonly BlogPost[], level: 2 | 3 = 2): string {
    const items = posts.map(
        (p) => `<li><article>
${dateLine(c, p)}
<h${level} class="entry-title"><a href="${esc(postUrl(c.site.config, p))}">${esc(p.title)}</a></h${level}>
<p class="clamp">${esc(postDescription(p))}</p>
${tagChips(c, p.tags)}
</article></li>`,
    );
    return `<ol class="entries">${items.join('')}</ol>`;
}
