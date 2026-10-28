// 生成静态文档站（中英文各一套）到 demo/public/docs，并生成 sitemap.xml 与搜索索引。
// 用法：npm run docs。生成结果会提交进仓库，GitHub Pages 构建时随 demo 一起发布。
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { esc, md } from "./helpers.mjs";
import * as icon from "./icons.mjs";
import en from "./content-en.mjs";
import zh from "./content-zh.mjs";

const ORIGIN = "https://bamboo742.github.io";
const BASE = "/react-hybrid-masonry";
const REPO = "https://github.com/Bamboo742/react-hybrid-masonry";
const NPM = "https://www.npmjs.com/package/react-hybrid-masonry";
const LASTMOD = "2026-10-29";

// 在 <head> 里同步执行，先于首次绘制设置主题，避免深色用户看到一闪而过的白屏。
const THEME_BOOT = `(function(){try{var t=localStorage.getItem("rhm-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outRoot = join(root, "demo/public/docs");

const docsRoot = (lang) => (lang === "en" ? `${BASE}/docs` : `${BASE}/docs/zh`);
const pagePath = (lang, slug) =>
  slug === "" ? `${docsRoot(lang)}/` : `${docsRoot(lang)}/${slug}/`;

const tocOf = (html) =>
  [...html.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map(([, id, text]) => ({
    id,
    text,
  }));

const plainText = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

function renderSidebar(site, slug) {
  const lang = site.lang;
  return site.groups
    .map(
      (g) =>
        `<div class="nav-group"><p class="nav-title">${esc(g.title)}</p><ul>${g.pages
          .map((s) => {
            const cur = s === slug;
            return `<li><a href="${pagePath(lang, s)}"${
              cur ? ' class="current" aria-current="page"' : ""
            }>${esc(site.pages[s].nav)}</a></li>`;
          })
          .join("")}</ul></div>`,
    )
    .join("");
}

function render(site, slug, orderedSlugs) {
  const page = site.pages[slug];
  const lang = site.lang;
  const ui = site.ui;
  const other = lang === "en" ? zh : en;
  const url = pagePath(lang, slug);
  const body = page.body.replaceAll('href="@/', `href="${docsRoot(lang)}/`);
  const toc = tocOf(body);
  const idx = orderedSlugs.indexOf(slug);
  const prev = orderedSlugs[idx - 1];
  const next = orderedSlugs[idx + 1];
  const fullTitle = `${page.title} | ${site.siteName}`;
  const absUrl = `${ORIGIN}${url}`;

  const graph = [
    {
      "@type": "TechArticle",
      headline: page.h1,
      description: page.description,
      inLanguage: site.htmlLang,
      url: absUrl,
      dateModified: LASTMOD,
      isPartOf: { "@id": `${REPO}` },
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": REPO,
      name: "react-hybrid-masonry",
      programmingLanguage: "TypeScript",
      runtimePlatform: "React >= 16.8",
      license: "https://opensource.org/licenses/MIT",
      codeRepository: REPO,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.siteName, item: `${ORIGIN}${BASE}/` },
        { "@type": "ListItem", position: 2, name: site.docsName, item: `${ORIGIN}${pagePath(lang, "")}` },
        ...(slug === ""
          ? []
          : [{ "@type": "ListItem", position: 3, name: page.nav, item: absUrl }]),
      ],
    },
  ];
  if (page.faq) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: page.faq.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    });
  }

  const pager = `<nav class="pager" aria-label="${esc(ui.pager)}">${
    prev
      ? `<a rel="prev" href="${pagePath(lang, prev)}"><small>${esc(ui.prev)}</small><span>${esc(site.pages[prev].nav)}</span></a>`
      : "<span></span>"
  }${
    next
      ? `<a rel="next" href="${pagePath(lang, next)}"><small>${esc(ui.next)}</small><span>${esc(site.pages[next].nav)}</span></a>`
      : "<span></span>"
  }</nav>`;

  const hasOther = other.pages[slug] !== undefined;
  const alternates = hasOther
    ? `<link rel="alternate" hreflang="en" href="${ORIGIN}${pagePath("en", slug)}" />
    <link rel="alternate" hreflang="zh-CN" href="${ORIGIN}${pagePath("zh", slug)}" />
    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${pagePath("en", slug)}" />`
    : "";

  const tocHtml =
    toc.length > 1
      ? `<aside class="toc" aria-label="${esc(ui.onThisPage)}"><p class="toc-title">${esc(ui.onThisPage)}</p><ul>${toc
          .map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`)
          .join("")}</ul></aside>`
      : "";

  const langHref = hasOther ? pagePath(other.lang, slug) : pagePath(other.lang, "");

  return `<!DOCTYPE html>
<html lang="${site.htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(fullTitle)}</title>
    <meta name="description" content="${esc(page.description)}" />
    <link rel="canonical" href="${absUrl}" />
    ${alternates}
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${esc(site.siteName)}" />
    <meta property="og:locale" content="${site.ogLocale}" />
    <meta property="og:title" content="${esc(fullTitle)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    <meta property="og:url" content="${absUrl}" />
    <meta name="twitter:card" content="summary" />
    <meta name="color-scheme" content="light dark" />
    <link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg" />
    <script>${THEME_BOOT}</script>
    <link rel="stylesheet" href="${BASE}/theme.css" />
    <link rel="stylesheet" href="${BASE}/docs/docs.css" />
    <script defer src="${BASE}/docs/docs.js"></script>
    <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>
  </head>
  <body data-search="${docsRoot(lang)}/search.json" data-copy="${esc(ui.copy)}" data-copied="${esc(ui.copied)}" data-no-results="${esc(ui.noResults)}" data-search-placeholder="${esc(ui.searchPlaceholder)}">
    <header class="site-header">
      <div class="bar">
        <button class="icon-btn menu-btn" type="button" aria-label="${esc(ui.menu)}" aria-expanded="false" aria-controls="docs-nav">${icon.menu}</button>
        <a class="brand" href="${BASE}/">${icon.logo}<span>${esc(site.siteName)}</span></a>
        <button class="search-btn" type="button" data-search-open aria-label="${esc(ui.search)}">${icon.search}<span class="label">${esc(ui.searchPlaceholder)}</span><kbd>Ctrl K</kbd></button>
        <nav class="top-links" aria-label="${esc(ui.siteNav)}">
          <a href="${BASE}/">${esc(ui.demo)}</a>
          <a href="${pagePath(lang, "")}" class="active">${esc(ui.docs)}</a>
          <a href="${NPM}">npm</a>
          <a href="${langHref}" hreflang="${other.htmlLang}" lang="${other.htmlLang}" class="lang-switch">${esc(ui.switchLang)}</a>
        </nav>
        <a class="icon-btn" href="${REPO}" aria-label="GitHub">${icon.github}</a>
        <button class="icon-btn theme-btn" type="button" aria-label="${esc(ui.theme)}"><span class="sun">${icon.sun}</span><span class="moon">${icon.moon}</span></button>
      </div>
    </header>
    <div class="layout">
      <nav class="sidebar" id="docs-nav" aria-label="${esc(ui.docsNav)}">${renderSidebar(site, slug)}</nav>
      <main>
        <h1>${md(page.h1)}</h1>
        <p class="lead">${md(page.lead)}</p>
${body}
${pager}
      </main>
      ${tocHtml}
    </div>
    <footer class="site-footer">
      <div class="inner">
        <p>${esc(ui.footerNote)} © ${LASTMOD.slice(0, 4)} react-hybrid-masonry</p>
        <nav aria-label="${esc(ui.siteNav)}"><a href="${REPO}">GitHub</a><a href="${NPM}">npm</a><a href="${REPO}/issues">Issues</a></nav>
      </div>
    </footer>
  </body>
</html>
`;
}

// 清理上一次的生成结果（docs.css / docs.js 是手写的，保留）
rmSync(join(outRoot, "zh"), { recursive: true, force: true });
for (const dir of [
  "virtual-masonry",
  "equal-height",
  "dynamic-view",
  "guides",
  "faq",
  "changelog",
]) {
  rmSync(join(outRoot, dir), { recursive: true, force: true });
}

const urls = [`${ORIGIN}${BASE}/`];
for (const site of [en, zh]) {
  const ordered = site.groups.flatMap((g) => g.pages);
  const searchIndex = [];
  for (const slug of ordered) {
    const dir = join(
      outRoot,
      site.lang === "en" ? "" : "zh",
      ...(slug === "" ? [] : slug.split("/")),
    );
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), render(site, slug, ordered));
    urls.push(`${ORIGIN}${pagePath(site.lang, slug)}`);

    const page = site.pages[slug];
    const group = site.groups.find((g) => g.pages.includes(slug));
    searchIndex.push({
      t: page.nav,
      g: group.title,
      u: pagePath(site.lang, slug),
      h: tocOf(page.body).map((h) => ({ id: h.id, t: plainText(h.text) })),
      x: plainText(`${page.lead} ${page.body}`).slice(0, 8000),
    });
  }
  writeFileSync(
    join(outRoot, site.lang === "en" ? "" : "zh", "search.json"),
    JSON.stringify(searchIndex),
  );
}

writeFileSync(
  join(root, "demo/public/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${LASTMOD}</lastmod></url>`).join("\n")}
</urlset>
`,
);

console.log(`生成 ${urls.length - 1} 个文档页 + sitemap.xml + 搜索索引`);
