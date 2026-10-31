// Static build of jumplink.eu. `@gjsify/site` supplies data and helpers; every page comes from
// `src/templates`. Runs on GJS (the package imports gi://GdkPixbuf), see `package.json` scripts.

import GLib from 'gi://GLib';
import { createHash } from 'node:crypto';
import type { Dirent } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import {
    absoluteUrl,
    blogAssetFiles,
    blogFeedUrl,
    blogIndexUrl,
    developerPageUrl,
    loadBlogPosts,
    loadDeveloperData,
    loadLegalNoticeStatements,
    loadPrivacyStatements,
    parseAnySiteConfig,
    postUrl,
    renderPostBody,
    sitePageUrl,
    tagUrl,
    tagsOf,
    type DeveloperSiteConfig,
    type RootManifest,
} from '@gjsify/site';
import { missing, translator } from '../src/i18n.js';
import { blogFeed, blogIndexPage, blogPostPage } from '../src/templates/blog.js';
import { cvPage } from '../src/templates/cv.js';
import { homePage } from '../src/templates/home.js';
import type { Avatar, Ctx, ProjectEntry, Site } from '../src/templates/layout.js';
import { notFoundPage, rootRedirect, statementPage, supportPage } from '../src/templates/pages.js';
import { robotsTxt, sitemapXml } from '../src/templates/seo.js';

const args = process.argv.slice(2).filter((a) => a !== '--');
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
    const at = args.indexOf(`--${name}`);
    return at >= 0 ? args[at + 1] : undefined;
};

const root = process.cwd();
const out = resolve(root, option('out') ?? '_site');
const drafts = flag('drafts');
const offline = flag('offline');

async function write(file: string, content: string) {
    await mkdir(dirname(join(out, file)), { recursive: true });
    await writeFile(join(out, file), content);
}

async function copyTree(from: string, to: string) {
    await mkdir(to, { recursive: true });
    // `@gjsify/fs`'s `readdir` is typed `string[] | Dirent[]` with no overload for `withFileTypes`,
    // so the narrowing has to happen here. Upstream: overload it the way `@types/node` does, then
    // this cast goes away.
    const entries = (await readdir(from, { withFileTypes: true })) as Dirent[];
    for (const entry of entries) {
        if (entry.isDirectory()) await copyTree(join(from, entry.name), join(to, entry.name));
        else await copyFile(join(from, entry.name), join(to, entry.name));
    }
}

/** Page URLs are root-relative and end in `/`; the file is the `index.html` below. */
const pageFile = (url: string, base: string) => `${url.slice(base.length)}index.html`;

async function main() {
    const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as RootManifest & {
        jumplink?: { avatar?: Avatar; projects?: ProjectEntry[] };
    };
    const parsed = parseAnySiteConfig(manifest);
    if (parsed.kind !== 'developer') throw new Error('gjsify.site must be a developer site');
    const config: DeveloperSiteConfig = parsed;
    const avatar = manifest.jumplink?.avatar;
    if (!avatar?.full) throw new Error('package.json: jumplink.avatar.full is required');
    const warn = (message: string) => console.warn(`warning: ${message}`);

    const data = await loadDeveloperData(config, {
        root,
        offline,
        warn,
        network: { cacheDir: join(root, 'node_modules/.cache/jumplink/http') },
    });

    const postsDir = resolve(root, config.blog?.posts ?? 'blog');
    const posts = config.blog ? await loadBlogPosts({ dir: postsDir, languages: config.languages, drafts }) : [];
    const html = new Map(posts.map((p) => [`${p.lang}/${p.slug}`, renderPostBody(config, p, postsDir, posts)]));
    const privacy = config.privacy ? await loadPrivacyStatements(config.privacy, root) : {};
    const legal = config.legalNotice ? await loadLegalNoticeStatements(config.legalNotice, root) : {};

    // Assets: wholesale copy, then the stylesheet with a content hash next to the font it references.
    await mkdir(out, { recursive: true });
    await copyTree(join(root, 'assets'), join(out, 'assets'));
    const hashed = async (file: string, content: string) => {
        const name = file.replace('*', createHash('sha256').update(content).digest('hex').slice(0, 10));
        await write(name, content);
        return `${config.base}${name}`;
    };
    const cssHref = await hashed('assets/site-*.css', await readFile(join(root, 'src/styles/site.css'), 'utf8'));

    // The animated background is a separate browser bundle (`npm run bundle:bg`). It is optional:
    // without it every page still shows the static sky and scene, so a missing file only warns.
    let bgHref: string | undefined;
    const bgBundle = join(root, 'node_modules/.cache/jumplink/bg.js');
    try {
        bgHref = await hashed('assets/bg-*.js', await readFile(bgBundle, 'utf8'));
    } catch {
        warn(`no background bundle at ${bgBundle} — run "npm run bundle:bg"`);
    }
    if (config.blog) {
        for (const file of await blogAssetFiles(postsDir)) {
            await mkdir(dirname(join(out, 'blog', file)), { recursive: true });
            await copyFile(join(postsDir, file), join(out, 'blog', file));
        }
    }

    const site: Site = { config, data, posts, avatar, projects: manifest.jumplink?.projects ?? [], cssHref, bgHref };
    const sitemap: Record<string, string>[] = [];
    const abs = (url: string) => absoluteUrl(config, url);
    const everywhere = (path: (lang: string) => string) =>
        sitemap.push(Object.fromEntries(config.languages.map((l) => [l, abs(path(l))])));

    for (const lang of config.languages) {
        const resume = data.resumes[lang];
        if (!resume) throw new Error(`no résumé for language "${lang}"`);
        const c: Ctx = { site, lang, t: translator(lang), resume };
        const put = (url: string, page: string) => write(pageFile(url, config.base), page);

        await put(sitePageUrl(config, lang), homePage(c));
        await put(developerPageUrl(site, lang, 'cv'), cvPage(c));
        if (config.support.length > 0) await put(developerPageUrl(site, lang, 'support'), supportPage(c));
        const statement = privacy[lang];
        if (statement !== undefined) await put(developerPageUrl(site, lang, 'privacy'), statementPage(c, 'privacy', statement));
        const notice = legal[lang];
        if (notice !== undefined) await put(developerPageUrl(site, lang, 'legal-notice'), statementPage(c, 'legal-notice', notice));

        if (config.blog) {
            await put(blogIndexUrl(config, lang), blogIndexPage(c));
            await write(blogFeedUrl(config, lang).slice(config.base.length), blogFeed(c, html));
            for (const tag of tagsOf(posts, lang)) {
                await put(tagUrl(config, lang, tag), blogIndexPage(c, tag));
                await write(blogFeedUrl(config, lang, tag).slice(config.base.length), blogFeed(c, html, tag));
                sitemap.push({ [lang]: abs(tagUrl(config, lang, tag)) });
            }
            for (const post of posts.filter((p) => p.lang === lang)) {
                await put(postUrl(config, post), blogPostPage(c, post, html.get(`${lang}/${post.slug}`) ?? ''));
            }
        }
    }

    everywhere((l) => sitePageUrl(config, l));
    everywhere((l) => developerPageUrl(site, l, 'cv'));
    if (config.support.length > 0) everywhere((l) => developerPageUrl(site, l, 'support'));
    if (config.privacy) everywhere((l) => developerPageUrl(site, l, 'privacy'));
    if (config.legalNotice) everywhere((l) => developerPageUrl(site, l, 'legal-notice'));
    if (config.blog) {
        everywhere((l) => blogIndexUrl(config, l));
        for (const slug of new Set(posts.map((p) => p.slug))) {
            sitemap.push(
                Object.fromEntries(posts.filter((p) => p.slug === slug).map((p) => [p.lang, abs(postUrl(config, p))])),
            );
        }
    }

    const defaultResume = data.resumes[config.defaultLanguage];
    const siteName = defaultResume?.basics.name ?? config.url;
    await write('index.html', rootRedirect(config, siteName, site.cssHref));
    await write('404.html', notFoundPage(config, siteName, site.cssHref, translator));
    await write('sitemap.xml', sitemapXml(sitemap, config.defaultLanguage));
    await write('robots.txt', robotsTxt([abs(`${config.base}sitemap.xml`)]));

    if (missing.size > 0) warn(`missing German UI strings:\n  ${[...missing].join('\n  ')}`);
    console.log(`built ${posts.length} posts, ${config.languages.length} languages → ${out}`);
}

// GJS exits once the module body returns; the async fs and network calls need a running main loop.
const loop = GLib.MainLoop.new(null, false);
let failed = false;
main()
    .catch((error: unknown) => {
        console.error(error);
        failed = true;
    })
    .finally(() => loop.quit());
loop.run();
if (failed) process.exit(1);
