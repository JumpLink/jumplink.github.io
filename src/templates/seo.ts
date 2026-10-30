// `@gjsify/site` does not export its SEO helpers and its `exports` map blocks deep imports, so
// reach the file by path.
export {
    blogPostingJsonLd,
    personJsonLd,
    robotsTxt,
    sitemapXml,
} from '../../node_modules/@gjsify/site/lib/render/seo.js';
