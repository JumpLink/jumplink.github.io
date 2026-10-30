// Plain pages: support, privacy, legal notice, and the root language redirect.

import {
    absoluteUrl,
    epcPayload,
    esc,
    formatIban,
    languageName,
    qrSvg,
    renderMarkdown,
    sitePageUrl,
    type DeveloperSiteConfig,
    type SiteSupportSepa,
} from '@gjsify/site';
import { document, kicker, urlOf, urlsFor, type Ctx } from './layout.js';

function sepa(c: Ctx, entry: SiteSupportSepa): string {
    const reference = entry.reference ?? c.resume.basics.name;
    const payload = epcPayload({ name: entry.name, iban: entry.iban, bic: entry.bic, reference });
    return `<section class="sepa frame" aria-labelledby="sepa-h">
<div>
<h2 id="sepa-h">${esc(c.t('Bank transfer'))}</h2>
<dl>
<dt>${esc(c.t('Recipient'))}</dt><dd>${esc(entry.name)}</dd>
<dt>IBAN</dt><dd><code>${esc(formatIban(entry.iban))}</code></dd>
${entry.bic ? `<dt>BIC</dt><dd><code>${esc(entry.bic)}</code></dd>` : ''}
<dt>${esc(c.t('Reference'))}</dt><dd>${esc(reference)}</dd>
</dl>
</div>
<figure>${qrSvg(payload, c.t('QR code for a bank transfer'))}<figcaption class="kicker">${esc(c.t('Scan with your banking app'))}</figcaption></figure>
</section>`;
}

export function supportPage(c: Ctx): string {
    const { support } = c.site.config;
    const links = support.flatMap((e) =>
        e.kind === 'sepa' || !('url' in e) ? [] : [`<li class="frame"><a href="${esc(e.url)}">${esc(e.kind)}</a></li>`],
    );
    const card = support.find((e): e is SiteSupportSepa => e.kind === 'sepa');
    const name = c.resume.basics.name;
    const description = c.t('{name} writes free software. Support the work with a transfer or a service.', { name });
    const main = `<div class="wrap prose-page">
${kicker(c.t('Support'))}
<h1>${esc(c.t('Support my work'))}</h1>
<p>${esc(description)}</p>
${links.length ? `<ul class="support-links">${links.join('')}</ul>` : ''}
${card ? sepa(c, card) : ''}
</div>`;
    return document(
        c,
        {
            title: `${c.t('Support')} – ${name}`,
            description,
            urls: urlsFor(c, (lang) => urlOf.view(c, 'support', lang)),
            current: 'support',
        },
        main,
    );
}

export function statementPage(c: Ctx, view: 'privacy' | 'legal-notice', markdown: string): string {
    const name = c.resume.basics.name;
    const title = view === 'privacy' ? c.t('Privacy') : c.t('Legal notice');
    const description = view === 'privacy' ? c.t('What this site does with data.') : c.t('Who publishes this site, and how to reach them.');
    const main = `<div class="wrap prose-page">
${kicker(title)}
<h1>${esc(title)}</h1>
<div class="prose">${renderMarkdown(markdown)}</div>
</div>`;
    return document(
        c,
        { title: `${title} – ${name}`, description, urls: urlsFor(c, (lang) => urlOf.view(c, view, lang)) },
        main,
    );
}

/** `/`: picks a language from `navigator.languages`; without script, a list of links. */
export function rootRedirect(config: DeveloperSiteConfig, name: string, cssHref: string): string {
    const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
    const choose = `var l=${json(config.languages)},d=${json(config.defaultLanguage)},p=(navigator.languages||[navigator.language]).map(function(x){return String(x).toLowerCase()}),c=d;for(var i=0;i<p.length;i++){var m=l.filter(function(x){return p[i]===x.toLowerCase()||p[i].split("-")[0]===x.toLowerCase()})[0];if(m){c=m;break}}location.replace(${json(config.base)}+c+"/")`;
    const home = (code: string) => sitePageUrl(config, code);
    const alternates = config.languages.map(
        (code) => `<link rel="alternate" hreflang="${esc(code)}" href="${esc(absoluteUrl(config, home(code)))}">`,
    );
    const fallback = absoluteUrl(config, home(config.defaultLanguage));
    return `<!doctype html>
<html lang="${esc(config.defaultLanguage)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${esc(name)}</title>
<link rel="canonical" href="${esc(fallback)}">
${alternates.join('\n')}
<link rel="alternate" hreflang="x-default" href="${esc(fallback)}">
<link rel="stylesheet" href="${esc(cssHref)}">
<script>${choose}</script>
<noscript><meta http-equiv="refresh" content="0; url=${esc(home(config.defaultLanguage))}"></noscript>
</head>
<body class="root">
<main id="main" class="wrap">
<h1>${esc(name)}</h1>
<ul class="support-links">${config.languages.map((code) => `<li class="frame"><a href="${esc(home(code))}" hreflang="${esc(code)}" lang="${esc(code)}">${esc(languageName(code))}</a></li>`).join('')}</ul>
</main>
</body>
</html>
`;
}
