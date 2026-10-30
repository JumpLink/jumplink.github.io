// Pieces that appear on more than one page. Each one has a single markup and a single class in
// the stylesheet, so a change to it shows everywhere at once (see docs/design.md, "One look").

import { esc } from '@gjsify/site';
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
