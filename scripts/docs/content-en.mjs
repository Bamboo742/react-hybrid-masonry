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
    "Either loadData returned hasMore: false, or a page request rejected. A failed request sets hasMore to false so the library does not retry in a loop. Remount the component (change its key) to start again, or catch the error inside loadData and return an empty page with hasMore: true if you prefer to keep going.",
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

    "guides/pagination": {
      nav: "Pagination & infinite scroll",
      title: "Pagination and Infinite Scroll in react-hybrid-masonry",
      description:
        "How loadData, hasMore, loadMoreThreshold and request concurrency work in react-hybrid-masonry, how failures are handled, and how to reset a list when filters change.",
      h1: "Pagination and infinite scroll",
      lead: "How pages are requested, when the next one starts, what happens on errors and how to start over.",
      body: join(
        h2("contract", "The loadData contract"),
        code(`type LoadData = (
  page: number, // starts at 1 and increases by 1 for every successful request
  pageSize: number,
) => Promise<{ data: any[]; hasMore: boolean }>;`),
        p("The component keeps all loaded items. Return only the new page from `loadData`; the library appends it. Page numbers are tracked inside the component, you do not have to count them."),
        h2("trigger", "When the next page starts"),
        p("A 1px marker sits at the bottom of the layout. An `IntersectionObserver` with `rootMargin: loadMoreThreshold` watches it, so the next request starts when the bottom is `loadMoreThreshold` px away from the viewport. After every page finishes the observer is subscribed again, which re-checks the current state: if the marker is still near the viewport (a fast scroll outran the content) the next page starts immediately."),
        ul([
          "Raise `loadMoreThreshold` if users scroll fast or your API is slow.",
          "Make sure `pageSize` fills more than a screen. With very small pages the marker stays visible after each response and requests chain one after another.",
        ]),
        h2("concurrency", "One request at a time"),
        p("A new request never starts while another is running. The guard is synchronous, so even a burst of triggers in the same frame results in a single request, and responses cannot arrive out of page order."),
        h2("errors", "When a request fails"),
        p("A rejected `loadData` is logged with `console.error` and **automatic paging stops** (`hasMore` becomes false). This prevents a broken endpoint from being called in an endless loop while the marker is still visible. Choose how you want to recover:"),
        ul([
          "Remount the component with a new `key` to start again from page 1.",
          "Catch errors inside your `loadData` and return `{ data: [], hasMore: true }` after your own retry logic, if you want paging to continue.",
        ]),
        h2("reset", "Starting over when filters change"),
        p("The component loads page 1 on mount and never reloads by itself. When the query changes, remount it:"),
        code(`<VirtualMasonry
  key={JSON.stringify(filters)}
  loadData={(page, size) => fetchImages({ ...filters, page, size })}
  renderItem={renderCard}
/>`),
        h2("dynamic", "With DynamicMasonryView"),
        p("`DynamicMasonryView` calls page 1 itself to find the layout type and hands that response to the inner layout, so page 1 is requested once. Changing the controlled `isMasonry` prop remounts the inner layout and requests page 1 again."),
        h2("keys", "Unique items"),
        p("The library does not remove duplicates. If your API can return the same record on two pages (for example when new items are inserted while the user scrolls), de-duplicate inside `loadData` and keep `key` stable and unique."),
      ),
    },

    "guides/nextjs-ssr": {
      nav: "Next.js & SSR",
      title: "Using react-hybrid-masonry with Next.js and Server-Side Rendering",
      description:
        "How to use the React masonry components in the Next.js App Router and with SSR: the use client directive, hydration safety, initialItems for a prefetched first page and what the server HTML contains.",
      h1: "Next.js and server-side rendering",
      lead: "What works on the server, what is deferred to the browser and how to hand over a prefetched first page.",
      body: join(
        h2("use-client", "Add the use client directive"),
        p("The components use React hooks and are published without a directive. In the Next.js App Router import them from a client file:"),
        code(`"use client";

import { VirtualMasonry } from "react-hybrid-masonry";

export default function Gallery({ first }: { first: { items: any[]; hasMore: boolean } }) {
  return (
    <VirtualMasonry
      initialItems={first.items}
      initialHasMore={first.hasMore}
      loadData={(page, size) => fetch("/api/images?page=" + page + "&size=" + size).then((r) => r.json())}
      renderItem={(item) => <Card item={item} />}
    />
  );
}`),
        h2("initial", "Hand over a prefetched first page"),
        p("Fetch page 1 in a server component and pass it as `initialItems`. The component then starts with that data, does **not** show the loading state and does **not** request page 1 again; the first `loadData` call is for page 2."),
        code(`// app/gallery/page.tsx (server component)
import Gallery from "./Gallery";

export default async function Page() {
  const res = await fetch("https://api.example.com/images?page=1&size=30");
  const first = await res.json();
  return <Gallery first={{ items: first.items, hasMore: first.hasMore }} />;
}`),
        note("`initialItems` is available on `VirtualMasonry`. `DynamicMasonryView` and `FullWidthEqualHeightMasonry` load their first page on the client."),
        h2("hydration", "Hydration is safe"),
        p("Layout effects use `useLayoutEffect` in the browser and fall back to `useEffect` on the server. The container width is unknown during the server render, so the first render is an empty container on both sides and there is no hydration mismatch. Positions are computed right after mount, once the width is measured."),
        h2("html", "What the server HTML contains"),
        p("Because positions depend on the measured width, the **server HTML does not contain the cards**, even with `initialItems`. If search engines must see the content, additionally render a crawlable list (for example links in the page, or a `<noscript>` block) next to the layout, or keep this gallery for content that does not need to be indexed."),
        h2("lazy", "Loading it lazily"),
        p("The layout is only useful in the browser, so it can be split out of the initial bundle:"),
        code(`import dynamic from "next/dynamic";

const Gallery = dynamic(() => import("./Gallery"), { ssr: false });`),
        p("Use this only when you do not need `initialItems` to avoid a loading flash."),
      ),
    },

    "guides/responsive": {
      nav: "Responsive layouts",
      title: "Responsive Masonry Layouts in React: Columns per Breakpoint",
      description:
        "How react-hybrid-masonry reacts to container width changes, how to choose the column count per breakpoint and how the equal-height layout adapts to different screens.",
      h1: "Responsive layouts",
      lead: "The layout follows the container width. Here is how to control what it does at each size.",
      body: join(
        h2("measure", "How the width is measured"),
        p("The width of the layout container (`100%` of its parent) is read on mount and again on `ResizeObserver` notifications, window `resize` and `visibilitychange`. The extra listeners keep the layout correct when the window was resized while the tab was in the background. The state is only updated when the width actually changed."),
        p("The parent must therefore have a real width. A hidden parent (`display: none`) renders nothing until it is shown."),
        h2("waterfall", "Waterfall: by width limits"),
        p("With `minColumnWidth` and `maxColumnWidth` the column count follows the width, see [how the column count is chosen](@/virtual-masonry/#columns). This works well when you only need columns of a sensible size."),
        h2("breakpoints", "Waterfall: columns per breakpoint"),
        p("When a design asks for an exact number of columns at specific widths, compute it yourself and pass `columns`:"),
        code(`import { useEffect, useState } from "react";

function useColumns() {
  const [columns, setColumns] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setColumns(w >= 1600 ? 6 : w >= 1280 ? 5 : w >= 992 ? 4 : w >= 640 ? 3 : 2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return columns;
}

function Gallery() {
  const columns = useColumns();
  return <VirtualMasonry columns={columns} gap={16} loadData={loadData} renderItem={renderCard} />;
}`),
        p("The same works for `waterfallConfig={{ columns }}` in `DynamicMasonryView`."),
        h2("equal-height", "Equal-height rows"),
        p("The equal-height layout has no column count: rows are rebuilt for every width by the same rule, so the number of images per row changes by itself. Adjust the look per breakpoint by passing different `targetRowHeight` and `sizeRange`, for example smaller rows on phones:"),
        code(`const small = window.innerWidth < 640;

<FullWidthEqualHeightMasonry
  targetRowHeight={small ? 140 : 245}
  sizeRange={small ? [120, 170] : [230, 260]}
  gap={small ? 4 : 8}
  loadData={loadData}
  renderItem={renderCard}
/>`),
        h2("cost", "Cost of resizing"),
        p("Every width change recomputes the layout of all loaded items. It is cheap for thousands of items, but avoid changing `gap`, `columns` or size options on every animation frame."),
      ),
    },

    "guides/performance": {
      nav: "Performance tuning",
      title: "Performance Tuning for React Virtual Masonry: buffer, threshold and images",
      description:
        "Practical tips to keep a long React masonry gallery smooth: buffer and loadMoreThreshold, stable item references, image dimensions, lazy images and memoized cards.",
      h1: "Performance tuning",
      lead: "What the library does for you, and what to check in your own cards.",
      body: join(
        h2("built-in", "What is already optimized"),
        ul([
          "Only items inside the viewport plus `buffer` are mounted; the rest of the list costs nothing in the DOM.",
          "The scroll position is updated at most once per animation frame (`requestAnimationFrame`).",
          "Item objects keep their identity while scrolling. They only change when items or the container width change, so memoized children do not re-render on every scroll.",
          "Layouts are cached with `useMemo`; scrolling does not recompute positions.",
        ]),
        h2("buffer", "buffer"),
        p("`buffer` (default `1500`) is the distance above and below the viewport that stays mounted. A larger value shows fewer blank areas when scrolling fast but mounts more cards and requests more images at once. A smaller value saves work but reveals the loading process on fast scrolls."),
        note("Tune `buffer` and `loadMoreThreshold` while looking at the number of images requested and at your performance scores, do not just increase them until the picture looks better."),
        h2("threshold", "loadMoreThreshold"),
        p("A larger `loadMoreThreshold` starts the next request earlier, which hides latency, but loads data users may never scroll to. Choose it according to your API latency and page size."),
        h2("images", "Images"),
        ul([
          "Give every item its real `width` and `height` in the data. The layout is computed from them before the image loads, so nothing jumps when images arrive.",
          "Use `loading=\"lazy\"` and `decoding=\"async\"` on images, and serve thumbnails near the displayed size.",
          "Use `object-fit: cover` so a slightly different rounded size never distorts the picture.",
        ]),
        code(`<img src={item.thumb} alt={item.title} width={item.width} height={item.height}
     loading="lazy" decoding="async"
     style={{ width: "100%", height: "100%", objectFit: "cover" }} />`),
        h2("cards", "Cards"),
        ul([
          "Wrap the card in `React.memo`. Because item identities are stable, it re-renders only when its item changes.",
          "Keep `renderItem` cheap. Do not create observers or heavy state in every card; use a shared one where possible.",
          "Always set `key={item.id}` on the returned element.",
        ]),
        code(`const Card = React.memo(function Card({ item }: { item: any }) {
  return (
    <div style={{ position: "absolute", left: item.x, top: item.y, width: item.width, height: item.height }}>
      <img src={item.thumb} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
});

<VirtualMasonry renderItem={(item) => <Card key={item.id} item={item} />} /* ... */ />`),
        h2("page-size", "pageSize"),
        p("Choose a page size that fills more than one screen including the threshold. Pages that are too small cause request chains; pages that are too large delay the first paint. 30 to 50 is a good starting range."),
      ),
    },

    "guides/equal-height-algorithm": {
      nav: "How the equal-height layout works",
      title: "How the Equal-Height (Justified) Layout Algorithm Works",
      description:
        "Step by step explanation of the row-filling algorithm used by FullWidthEqualHeightMasonry: greedy row building, scale calculation, size range clamping, width distribution without rounding drift and the last row rule.",
      h1: "How the equal-height layout works",
      lead: "The row-filling algorithm, step by step. Useful when you tune `maxStretchRatio` and `sizeRange`.",
      body: join(
        h2("input", "Input"),
        p("Every item has an aspect ratio `r = width / height`. Using the target row height `H`, the ideal width of an item is `r * H`. `W` is the container width and `g` the gap."),
        h2("rows", "1. Build a row greedily"),
        p("Start a row with the next image. Before adding another image, compute the scale needed to make the current row fill the container:"),
        code(`scale = (W - (n - 1) * g) / sum(r_i * H)   // n images in the row`, "text"),
        ul([
          "If `scale <= maxStretchRatio`, the row is full enough: close it.",
          "Otherwise add the next image and test again. Adding an image always brings the scale closer to 1.",
          "If the row already needs to **shrink** (`scale < 1`) it is closed as well, with no limit on shrinking.",
        ]),
        p("Because one image almost always needs a large enlargement to fill a row, this rule produces rows of at least two images without a special case."),
        h2("height", "2. Compute and clamp the row height"),
        code(`rowHeight = H * scale
rowHeight = clamp(rowHeight, minHeight, maxHeight)   // sizeRange`, "text"),
        p("`sizeRange` is an independent visual density limit, so it is always applied. When the clamp prevents an exact fill, the next step makes the row end at the edge anyway."),
        h2("widths", "3. Distribute widths without drift"),
        p("Each image gets `r_i * rowHeight` as its ideal width. To make the row end exactly at the container edge, the right edge of image `i` is computed from the cumulative share of the ideal widths, then rounded:"),
        code(`available = W - (n - 1) * g
rightEdge_i = (sum(ideal_0..i) / sum(ideal_all)) * available + i * g
width_i     = round(rightEdge_i - x_i)`, "text"),
        p("Rounding errors therefore never accumulate and are not pushed onto the last image, whose proportions would otherwise differ visibly from its real picture. Every width is then capped at `maxItemWidth`."),
        h2("last", "4. The last row"),
        ul([
          "The row at the end of the loaded data is **not stretched**; its height is clamped between `sizeRange[0]` and `targetRowHeight`.",
          "If its natural width would overflow the container, all of its images are scaled down by the same factor.",
          "When another page arrives, the former last row becomes a normal row and is recomputed.",
        ]),
        h2("virtual", "5. Virtualization"),
        p("Each item gets `x`, `y`, `width`, `height` and `originalIndex`. Only items that intersect the viewport extended by `buffer` are rendered, using the item's `originalIndex` as the React key. The total height `minHeight` of the container is the bottom of the last row."),
        h2("tips", "Tuning hints"),
        ul([
          "Many rows with 2 images means a large `targetRowHeight` for the container width: lower it or widen `sizeRange`.",
          "A very narrow `sizeRange` makes rows exact but allows only a few combinations; widen it if rows look uneven.",
          "Lower `maxStretchRatio` for less enlargement, raise it to close rows earlier.",
        ]),
      ),
    },

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
