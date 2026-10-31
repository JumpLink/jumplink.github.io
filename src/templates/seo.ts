// `@gjsify/site` does not export its SEO helpers and its `exports` map blocks deep imports, so
// reach the file by path.
export {
    blogPostingJsonLd,
    personJsonLd,
    robotsTxt,
    sitemapXml,
} from '../../node_modules/@gjsify/site/lib/render/seo.js';

/** Markdown reduced to the words it shows: links become their text, emphasis marks go. */
export const plainText = (markdown: string | undefined): string | undefined =>
    markdown
        ?.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*`]+/g, '')
        .trim();

// `@gjsify/site` has no `WebSite` helper yet; its own `jsonLdScript` is not exported either.
export function websiteJsonLd(input: { name: string; url: string; lang: string; sameAs: readonly string[] }): string {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: input.name,
        url: input.url,
        inLanguage: input.lang,
        author: {
            '@type': 'Person',
            name: input.name,
            url: input.url,
            sameAs: input.sameAs.length > 0 ? input.sameAs : undefined,
        },
    };
    return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
