// 生成静态文档站（中英文各一套）到 demo/public/docs，并生成 sitemap.xml。
// 用法：npm run docs。生成结果会提交进仓库，GitHub Pages 构建时随 demo 一起发布。
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { esc, md } from "./helpers.mjs";
import en from "./content-en.mjs";
import zh from "./content-zh.mjs";

const ORIGIN = "https://bamboo742.github.io";
const BASE = "/react-hybrid-masonry";
const REPO = "https://github.com/Bamboo742/react-hybrid-masonry";
const NPM = "https://www.npmjs.com/package/react-hybrid-masonry";
const LASTMOD = "2026-10-28";

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

function render(site, slug, orderedSlugs) {
  const page = site.pages[slug];
  const lang = site.lang;
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

  const sidebar = site.groups
    .map(
      (g) =>
        `<li class="group">${esc(g.title)}</li>` +
        g.pages
          .map((s) => {
            const cur = s === slug;
            const sub = cur
              ? `<ul class="sub">${toc
                  .map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`)
                  .join("")}</ul>`
              : "";
            return `<li><a href="${pagePath(lang, s)}"${
              cur ? ' class="current" aria-current="page"' : ""
            }>${esc(site.pages[s].nav)}</a>${sub}</li>`;
          })
          .join(""),
    )
    .join("");

  const pager = `<nav class="pager" aria-label="${esc(site.ui.pager)}">${
    prev
      ? `<a rel="prev" href="${pagePath(lang, prev)}"><small>${esc(site.ui.prev)}</small>${esc(site.pages[prev].nav)}</a>`
      : "<span></span>"
  }${
    next
      ? `<a rel="next" href="${pagePath(lang, next)}"><small>${esc(site.ui.next)}</small>${esc(site.pages[next].nav)}</a>`
      : "<span></span>"
  }</nav>`;

  const hasOther = other.pages[slug] !== undefined;
  const alternates = hasOther
    ? `<link rel="alternate" hreflang="en" href="${ORIGIN}${pagePath("en", slug)}" />
    <link rel="alternate" hreflang="zh-CN" href="${ORIGIN}${pagePath("zh", slug)}" />
    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${pagePath("en", slug)}" />`
    : "";

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
    <link rel="stylesheet" href="${BASE}/docs/docs.css" />
    <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>
  </head>
  <body>
    <header class="site-header">
      <div class="bar">
        <a class="brand" href="${BASE}/">${esc(site.siteName)}</a>
        <nav aria-label="${esc(site.ui.siteNav)}">
          <a href="${BASE}/">${esc(site.ui.demo)}</a>
          <a href="${REPO}">GitHub</a>
          <a href="${NPM}">npm</a>
          <a href="${hasOther ? pagePath(other.lang, slug) : pagePath(other.lang, "")}" hreflang="${other.htmlLang}" lang="${other.htmlLang}">${esc(site.ui.switchLang)}</a>
        </nav>
      </div>
    </header>
    <div class="layout">
      <nav class="toc" aria-label="${esc(site.ui.docsNav)}"><ul>${sidebar}</ul></nav>
      <main>
        <h1>${md(page.h1)}</h1>
        <p class="lead">${md(page.lead)}</p>
${body}
${pager}
      </main>
    </div>
    <footer>MIT License · <a href="${REPO}">react-hybrid-masonry</a> · <a href="${NPM}">npm</a></footer>
  </body>
</html>
`;
}

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
  for (const slug of ordered) {
    const dir = join(
      outRoot,
      site.lang === "en" ? "" : "zh",
      ...(slug === "" ? [] : slug.split("/")),
    );
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), render(site, slug, ordered));
    urls.push(`${ORIGIN}${pagePath(site.lang, slug)}`);
  }
}

writeFileSync(
  join(root, "demo/public/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${LASTMOD}</lastmod></url>`).join("\n")}
</urlset>
`,
);

console.log(`生成 ${urls.length - 1} 个文档页 + sitemap.xml`);
