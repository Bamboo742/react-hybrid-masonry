import paginationGuide from "./pages/guide-pagination-en.mjs";
import nextjsGuide from "./pages/guide-nextjs-en.mjs";
import responsiveGuide from "./pages/guide-responsive-en.mjs";
import performanceGuide from "./pages/guide-performance-en.mjs";
import algorithmGuide from "./pages/guide-algorithm-en.mjs";
import equalHeightPage from "./pages/equal-height-en.mjs";
import virtualMasonryPage from "./pages/virtual-masonry-en.mjs";
import dynamicViewPage from "./pages/dynamic-view-en.mjs";
import { code, h2, h3, join, note, ol, p, table, ul } from "./helpers.mjs";

const card = String.raw`<div
  style={{
    position: "absolute",
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
  }}
>
  <img src={item.url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
</div>`;

const faqs = [
  [
    "Does it scroll inside its own container?",
    "No. It follows the window scroll and reads its own position with getBoundingClientRect, so put it in a normally scrolling page. Scrolling inside a nested overflow container is not supported.",
  ],
  [
    "Items are stacked at the top-left or overlap each other. Why?",
    "The root element returned by renderItem must use position: absolute together with the given left, top, width and height. Without it the browser lays the items out as normal blocks.",
  ],
  [
    "The container is tall but empty.",
    "Positions are only computed after the container width has been measured, so a container that is hidden (display: none) or has zero width renders nothing. Make sure it has a real width. Opening a hidden tab triggers a re-measure through visibilitychange and ResizeObserver.",
  ],
  [
    "Why do I get duplicate key warnings or flickering cards in the waterfall layout?",
    "In VirtualMasonry the second argument of renderItem is the index among the currently rendered items, not the index in your data, and it changes while you scroll. Always put a stable key (for example key={item.id}) on the element you return.",
  ],
  [
    "Loading stopped and never continues.",
    "Either loadData returned hasMore: false, or a page request rejected. A failed request sets hasMore to false so the library does not retry in a loop. Remount the component (change its key) to start again, or retry inside loadData and return normally once a retry succeeds, throwing only if every retry fails. Do not return an empty page with hasMore: true: the page number advances and the failed page is skipped.",
  ],
  [
    "The same page is requested twice.",
    "Only one request is in flight at a time, so this is almost always React StrictMode running effects twice in development, or the component being mounted twice. In DynamicMasonryView the page-1 response used to pick the layout is cached and reused, so page 1 is not requested again by the inner layout.",
  ],
  [
    "The layout does not switch when I change the API response.",
    "In uncontrolled mode the layout type is read once, from the first loadData call. Pass the isMasonry prop to switch at runtime. Switching remounts the active layout and loads from page 1 again.",
  ],
  [
    "I get a hooks error in the Next.js App Router.",
    "The components use React hooks and are not marked with the use client directive. Import them from a file that starts with use client.",
  ],
  [
    "Does enableAnimation do anything?",
    "Not at the moment. It is accepted for API symmetry between the components and reserved for later; items are positioned without a transition.",
  ],
  [
    "Which fields are used as the item size?",
    "width/height, then w/h, then imgW/imgH. Use mapSize for any other field names. Items without a valid size cannot be laid out, so make sure every item has one.",
  ],
];

export default {
  lang: "en",
  htmlLang: "en",
  ogLocale: "en_US",
  siteName: "React Hybrid Masonry",
  docsName: "Docs",
  ui: {
    demo: "Live demo",
    switchLang: "简体中文",
    siteNav: "Site",
    docsNav: "Documentation",
    pager: "Pages",
    prev: "Previous",
    next: "Next",
    docs: "Docs",
    search: "Search",
    searchPlaceholder: "Search the docs",
    noResults: "No results for",
    onThisPage: "On this page",
    theme: "Toggle color theme",
    menu: "Menu",
    copy: "Copy",
    copied: "Copied",
    backToTop: "Back to top",
    footerNote: "Released under the MIT License.",
  },
  groups: [
    { title: "Getting started", pages: [""] },
    { title: "Components", pages: ["virtual-masonry", "equal-height", "dynamic-view"] },
    {
      title: "Guides",
      pages: [
        "guides/pagination",
        "guides/nextjs-ssr",
        "guides/responsive",
        "guides/performance",
        "guides/equal-height-algorithm",
      ],
    },
    { title: "Reference", pages: ["faq", "changelog"] },
  ],
  pages: {
    "": {
      nav: "Introduction",
      title: "React Hybrid Masonry Docs – Virtual Scrolling Waterfall & Equal-Height Layout",
      description:
        "Documentation for react-hybrid-masonry: a zero-dependency React library for virtual-scrolling masonry (waterfall) and Google Photos style equal-height layouts with infinite scroll and dynamic layout switching.",
      h1: "React Hybrid Masonry documentation",
      lead: "A zero-dependency React library for virtual-scrolling **waterfall (masonry)** and **equal-height** layouts, with infinite scroll and layout switching driven by your API.",
      body: join(
        h2("features", "Features"),
        ul([
          "**Virtual scrolling** – only items near the viewport are rendered, so very long lists stay fast.",
          "**Waterfall layout** – Pinterest style, each item goes to the shortest column.",
          "**Equal-height layout** – Google Photos style, every row has the same height and each image keeps its aspect ratio.",
          "**Dynamic layout** – let the first API response decide which of the two layouts is used.",
          "**Infinite scroll** – built on `IntersectionObserver` with a configurable preload distance; only one page request is in flight at a time.",
          "**Responsive** – the container width is observed, columns and rows are recomputed when it changes.",
          "Written in TypeScript, with a peer dependency on React 16.8 or newer and no other dependencies.",
        ]),
        h2("install", "Installation"),
        code(`npm install react-hybrid-masonry
# or
yarn add react-hybrid-masonry
# or
pnpm add react-hybrid-masonry`),
        h2("quick-start", "Quick start"),
        p("All three components share one contract: `loadData(page, pageSize)` returns `{ data, hasMore }`, every item has a width and a height, and `renderItem` draws an item at the position the library computed."),
        code(`import { VirtualMasonry } from "react-hybrid-masonry";

export function Gallery() {
  const loadData = async (page: number, pageSize: number) => {
    const res = await fetch("/api/images?page=" + page + "&size=" + pageSize);
    const json = await res.json();
    return { data: json.items, hasMore: json.hasMore };
  };

  return (
    <VirtualMasonry
      loadData={loadData}
      pageSize={30}
      minColumnWidth={200}
      maxColumnWidth={350}
      gap={16}
      renderItem={(item) => (
        <div key={item.id} style={{ position: "absolute", left: item.x, top: item.y, width: item.width, height: item.height }}>
          <img src={item.url} alt={item.title} style={{ width: "100%", height: "100%" }} />
        </div>
      )}
    />
  );
}`),
        h2("choose", "Which component should I use?"),
        table(
          ["Component", "Layout", "Use it for"],
          [
            ["[VirtualMasonry](@/virtual-masonry/)", "Waterfall: equal-width columns, items of different heights", "Image walls, product feeds, cards of different heights"],
            ["[FullWidthEqualHeightMasonry](@/equal-height/)", "Rows of equal height that fill the full width", "Photo albums, timelines, search results made of images"],
            ["[DynamicMasonryView](@/dynamic-view/)", "Either of the two, chosen at runtime", "When the back end or the content decides how a list is shown"],
          ],
        ),
        h2("data-contract", "The data contract"),
        p("The components need the size of every item to compute its place before the image has loaded. The size is read from the first of these field pairs that exists: `width`/`height`, `w`/`h`, `imgW`/`imgH`. For any other shape pass `mapSize`:"),
        code(`<VirtualMasonry
  mapSize={(raw) => ({ width: raw.cover.w, height: raw.cover.h })}
  /* ... */
/>`),
        p("Every item handed to `renderItem` is your original object plus the computed `x`, `y`, `width` and `height` (and `widthRatio`). Your own fields such as `url` or `title` are preserved."),
        h2("render-contract", "The render contract"),
        ul([
          "The root element returned by `renderItem` must be **absolutely positioned** with the given `left`, `top`, `width` and `height`.",
          "Set a stable `key` (for example `item.id`) on that element. In the waterfall layout the `index` argument counts only the items currently rendered and changes while scrolling.",
          "The components scroll with the **window**, not with an inner container. See [the FAQ](@/faq/).",
        ]),
        note("Next: read the page for the component you picked, or jump to the [pagination guide](@/guides/pagination/)."),
      ),
    },

    "virtual-masonry": virtualMasonryPage(),

    "equal-height": equalHeightPage(),

    "dynamic-view": dynamicViewPage(),

    "guides/pagination": paginationGuide(),

    "guides/nextjs-ssr": nextjsGuide(),

    "guides/responsive": responsiveGuide(),

    "guides/performance": performanceGuide(),

    "guides/equal-height-algorithm": algorithmGuide(),

    faq: {
      nav: "FAQ & troubleshooting",
      title: "react-hybrid-masonry FAQ and Troubleshooting",
      description:
        "Answers to common problems with react-hybrid-masonry: blank containers, overlapping items, duplicate keys, loading that stops, Next.js hooks errors and layout switching.",
      h1: "FAQ and troubleshooting",
      lead: "Common questions and the usual cause of problems.",
      faq: faqs,
      body: join(...faqs.map(([q, a]) => join(h3(q), p(a)))),
    },

    changelog: {
      nav: "Changelog",
      title: "react-hybrid-masonry Changelog",
      description:
        "Release notes for react-hybrid-masonry: new columns and initialItems options, request handling fixes, a rewritten equal-height row algorithm and more.",
      h1: "Changelog",
      lead: "Notable changes to the library.",
      body: join(
        h2("1.1.0", "1.1.0"),
        h3("Added"),
        ul([
          "`VirtualMasonry`: `columns` to fix the column count, `initialItems` and `initialHasMore` to start from a prefetched first page.",
          "`DynamicMasonryView`: `waterfallConfig.columns`.",
          "Server rendering support: layout effects fall back to `useEffect` on the server.",
        ]),
        h3("Changed"),
        ul([
          "Equal-height layout: new row building rule driven by `maxStretchRatio`, widths distributed from cumulative ratios so rounding errors no longer end up on the last image, and the last row is scaled down uniformly when it overflows.",
          "Waterfall layout: when `maxColumnWidth` is set, columns are only added while the new column width stays at or above `minColumnWidth`.",
        ]),
        h3("Fixed"),
        ul([
          "Quick scrolling could start two page requests at once; a synchronous guard now allows a single request.",
          "A failed request is no longer retried in an endless loop; paging stops until the component is remounted.",
          "Container width could stay stale after a window was resized in a background tab; `resize` and `visibilitychange` now re-measure it.",
          "Equal-height scroll position used a cached `offsetTop`; it now reads `getBoundingClientRect`, so content above the list can change height safely.",
          "Visible items kept a stable identity while scrolling, so memoized cards no longer re-render on every scroll event.",
        ]),
        h2("1.0.1", "1.0.1"),
        p("First public release on [npm](https://www.npmjs.com/package/react-hybrid-masonry): `VirtualMasonry`, `FullWidthEqualHeightMasonry` and `DynamicMasonryView`."),
      ),
    },
  },
};
