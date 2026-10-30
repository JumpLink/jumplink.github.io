// The logbook: index, tag pages, posts and the Atom feeds.

import {
    absoluteUrl,
    atomFeed,
    blogFeedUrl,
    blogIndexUrl,
    esc,
    formatPostDate,
    postDescription,
    postUrl,
    tagUrl,
    tagsOf,
    type BlogPost,
} from '@gjsify/site';
import { chips } from './components.js';
import { document, kicker, urlOf, urlsFor, type Ctx } from './layout.js';
import { blogPostingJsonLd } from './seo.js';

const inLang = (c: Ctx) => c.site.posts.filter((p) => p.lang === c.lang);

// Tags wear the same chips as the skills: all of them once under the h1 of the index, and each
// entry's own under its summary or title.
const tagChips = (c: Ctx, tags: readonly string[], current?: string) =>
    chips(tags.map((tag) => ({ text: tag, href: tagUrl(c.site.config, c.lang, tag), rel: 'tag', current: tag === current })));

const dateLine = (c: Ctx, post: BlogPost, extra = '') =>
    `<p class="kicker"><time datetime="${esc(post.date)}">${esc(formatPostDate(post.date, c.lang))}</time>${extra}</p>`;

// Every tag has its own feed, so a reader (or Planet GNOME) can follow one topic only.
const tagFeeds = (c: Ctx, tags: readonly string[]) =>
    tags.map((tag) => ({ title: `${c.resume.basics.name} – ${tag}`, href: blogFeedUrl(c.site.config, c.lang, tag) }));

export function blogIndexPage(c: Ctx, tag?: string): string {
    const { config } = c.site;
    const name = c.resume.basics.name;
    const posts = inLang(c).filter((p) => tag === undefined || p.tags.includes(tag));
    const heading = tag ? c.t('Entries tagged “{tag}”', { tag }) : c.t('Logbook');
    const items = posts.map(
        (p) => `<li><article>
${dateLine(c, p)}
<h2><a href="${esc(postUrl(config, p))}">${esc(p.title)}</a></h2>
<p class="clamp">${esc(postDescription(p))}</p>
${tagChips(c, p.tags)}
</article></li>`,
    );
    const list =
        posts.length > 0 ? `<ol class="entries">${items.join('')}</ol>` : `<p>${esc(c.t('No entries in this language yet.'))}</p>`;
    const feed = urlOf.feed(c);
    const tagFeed = tag ? blogFeedUrl(config, c.lang, tag) : undefined;
    const tags = tagsOf(c.site.posts, c.lang);
    const link = (href: string, text: string) => `<a class="more-link" href="${esc(href)}">${esc(text)}</a>`;
    const subscribe = link(tagFeed ?? feed, tag ? c.t('Subscribe to “{tag}”', { tag }) : c.t('Subscribe to the feed'));
    const byTopic =
        tag || tags.length === 0
            ? ''
            : ` · ${esc(c.t('By topic:'))} ${tags.map((t) => link(blogFeedUrl(config, c.lang, t), t)).join(', ')}`;
    const back = tag ? ` · ${link(urlOf.blog(c), c.t('All entries'))}` : '';
    const main = `<div class="wrap prose-page">
${kicker(tag ? c.t('Logbook') : c.t('Entries by {name}', { name }))}
<h1>${esc(heading)}</h1>
${tags.length > 0 ? `<nav class="tagnav" aria-label="${esc(c.t('All tags'))}">${tagChips(c, tags, tag)}</nav>` : ''}
${list}
<p>${subscribe}${byTopic}${back}</p>
</div>`;
    return document(
        c,
        {
            title: `${heading} – ${name}`,
            description: c.t('Entries by {name}', { name }),
            urls: urlsFor(c, (lang) => (tag ? tagUrl(config, lang, tag) : blogIndexUrl(config, lang))),
            feeds: tagFeeds(c, tag ? [tag] : tags),
            current: 'blog',
        },
        main,
    );
}

export function blogPostPage(c: Ctx, post: BlogPost, html: string): string {
    const { config } = c.site;
    const name = c.resume.basics.name;
    const same = inLang(c);
    const at = same.findIndex((p) => p.slug === post.slug);
    const newer = at > 0 ? same[at - 1] : undefined;
    const older = at >= 0 ? same[at + 1] : undefined;
    const updated =
        post.updated && post.updated !== post.date
            ? ` · ${esc(c.t('Updated {date}', { date: formatPostDate(post.updated, c.lang) }))}`
            : '';
    const pager = (p: BlogPost | undefined, label: string, cls: string) =>
        p ? `<a class="${cls}" href="${esc(postUrl(config, p))}"><span class="kicker">${esc(label)}</span>${esc(p.title)}</a>` : '';
    const support = config.support.length > 0
        ? `<aside class="support-note"><p>${esc(c.t('If this post was useful to you, you can support my work.'))} <a href="${esc(urlOf.view(c, 'support'))}">${esc(c.t('Support my work'))}</a></p></aside>`
        : '';
    const translations = c.site.posts.filter((p) => p.slug === post.slug);
    const main = `<article class="wrap prose-page">
<header>
${dateLine(c, post, `${updated}${post.draft ? ` · ${esc(c.t('Draft'))}` : ''}`)}
<h1>${esc(post.title)}</h1>
${tagChips(c, post.tags)}
</header>
<div class="prose">${html}</div>
${support}
<nav class="pager" aria-label="${esc(c.t('Logbook'))}">${pager(newer, c.t('Newer entry'), 'newer')}${pager(older, c.t('Older entry'), 'older')}</nav>
<p><a class="more-link" href="${esc(urlOf.blog(c))}">${esc(c.t('Back to the logbook'))}</a></p>
</article>`;
    return document(
        c,
        {
            title: `${post.title} – ${name}`,
            description: postDescription(post),
            urls: Object.fromEntries(translations.map((p) => [p.lang, postUrl(config, p)])),
            ogType: 'article',
            feeds: tagFeeds(c, post.tags),
            jsonLd: [
                blogPostingJsonLd({
                    title: post.title,
                    description: postDescription(post),
                    url: absoluteUrl(config, postUrl(config, post)),
                    published: post.date,
                    updated: post.updated,
                    author: name,
                    authorUrl: c.resume.basics.url,
                    image: c.resume.basics.image ? absoluteUrl(config, c.resume.basics.image) : undefined,
                    lang: post.lang,
                    tags: post.tags,
                }),
            ],
            current: 'blog',
        },
        main,
    );
}

export function blogFeed(c: Ctx, html: ReadonlyMap<string, string>, tag?: string): string {
    const { config } = c.site;
    const name = c.resume.basics.name;
    const origin = new URL(config.url).origin;
    const absolutize = (value: string) => value.replace(/(\s(?:href|src)=")\//g, `$1${origin}/`);
    const posts = inLang(c).filter((p) => tag === undefined || p.tags.includes(tag));
    const self = absoluteUrl(config, blogFeedUrl(config, c.lang, tag));
    return atomFeed(
        {
            id: self,
            title: tag ? `${name} – ${tag}` : `${name} – ${c.t('Logbook')}`,
            selfUrl: self,
            siteUrl: absoluteUrl(config, tag ? tagUrl(config, c.lang, tag) : blogIndexUrl(config, c.lang)),
            lang: c.lang,
            author: { name, uri: c.resume.basics.url },
        },
        posts.map((p) => {
            const url = absoluteUrl(config, postUrl(config, p));
            return {
                id: url,
                url,
                title: p.title,
                published: p.date,
                updated: p.updated,
                summary: p.summary,
                contentHtml: absolutize(html.get(`${p.lang}/${p.slug}`) ?? ''),
                tags: p.tags,
            };
        }),
    );
}
