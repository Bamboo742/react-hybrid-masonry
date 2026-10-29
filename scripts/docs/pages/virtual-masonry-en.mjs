import { code, figure, h2, h3, join, note, ol, p, table, ul } from "../helpers.mjs";
import { SAMPLE_SIZES, columnCount, columnWidth, masonrySvg } from "../diagram.mjs";

const faqs = [
  [
    "The column count is not what I expected.",
    "Without columns, the count is derived from the container width: floor(container width / minColumnWidth) first, and then columns are added one by one when maxColumnWidth is set. The first step does not account for gap, so the real column width can be slightly below minColumnWidth (by less than one gap). When you need to hit the design's column count exactly at a given width, pass columns and switch it per breakpoint.",
  ],
  [
    "There is empty space on the right once I set maxColumnWidth.",
    "Yes. When the column width is capped by maxColumnWidth, the whole grid is left-aligned and the right side stays empty. To center it, wrap VirtualMasonry in a container with max-width and margin: 0 auto so the container is exactly as wide as the grid, or use columns so the columns follow the container width.",
  ],
  [
    "Why is the order not left to right, row by row?",
    "The rule of a waterfall layout is that each new item goes into the currently shortest column, so two consecutive items are not necessarily in the same row, and the visual reading order is down one column, then the next. If content must be read strictly row by row, use the equal-height layout or a plain CSS grid.",
  ],
  [
    "Cards flicker while scrolling, or the console warns about duplicate keys.",
    "The second argument of renderItem is the position among the currently rendered items and it changes while scrolling, so it cannot be used as a key. Set a stable key on the root element you return, such as key={item.id}.",
  ],
  [
    "Does a card's height jump before its image has loaded?",
    "No. The height is computed from the width and height in your data and does not depend on the image download, so the reserved size is right from the start. This requires accurate sizes on every item.",
  ],
  [
    "How do I restart the list when filters change?",
    "Give the component a new key, for example key={JSON.stringify(filters)}. It is remounted and loads from page 1 again. See the pagination and infinite scroll page.",
  ],
  [
    "Can I insert ad slots or placeholder cards into the list?",
    "Yes. Mix any objects that have a width and a height into the data returned by loadData; they are placed into the shortest column like every other item. Render different content in renderItem from your own field, for example item.type.",
  ],
];

export default function virtualMasonryPage() {
  const demoSizes = SAMPLE_SIZES.slice(0, 12);
  const basic = masonrySvg(
    demoSizes,
    { width: 640, columns: 4, gap: 12 },
    "Waterfall layout: 4 columns, the numbers show the order in which items were placed",
  );

  // Container width -> columns and column width, computed with the same rules as the component.
  const widths = [320, 480, 768, 1024, 1280, 1440, 1920];
  const cfgA = { minColumnWidth: 200, gap: 16 };
  const cfgB = { minColumnWidth: 200, maxColumnWidth: 210, gap: 16 };
  const cell = (cfg, width) => {
    const o = { ...cfg, width };
    const cols = columnCount(o);
    const cw = columnWidth(o, cols);
    const blank = Math.round(width - (cols * cw + (cols - 1) * o.gap));
    return `${cols} cols · ${Math.round(cw)}px` + (blank > 1 ? ` (${blank}px empty on the right)` : "");
  };
  const widthTable = table(
    ["Container width", "`minColumnWidth={200}`", "`minColumnWidth={200}` `maxColumnWidth={210}`"],
    widths.map((w) => [`${w}px`, cell(cfgA, w), cell(cfgB, w)]),
  );

  return {
    nav: "VirtualMasonry",
    title: "VirtualMasonry – Complete Guide to the React Virtual Scrolling Masonry Layout",
    description:
      "Complete reference for VirtualMasonry: a React waterfall (Pinterest style) layout with a layout diagram, the column count and width rules, the data and size contract, virtual scrolling and infinite loading, SSR initial data, the controlled Core component and a FAQ.",
    h1: "VirtualMasonry",
    lead: "A Pinterest style waterfall layout: columns have the same width, items keep their aspect ratio and go into the shortest column. Only the items near the viewport are rendered.",
    faq: faqs,
    body: join(
      h2("overview", "Overview"),
      p("`VirtualMasonry` arranges items in columns of equal width: **every new item goes into the currently shortest column, and its height follows its own aspect ratio**. The column count follows the container width (or you set it), so the same data is 2 columns on a phone and can be 6 on a wide screen. It suits image walls, product feeds and content cards of different heights."),
      figure(
        basic.svg,
        "A 4-column layout with a 12px gap. The numbers show the order in which items were placed: each new item goes into the column that is shortest at that moment, so consecutive numbers are not necessarily in the same row.",
      ),
      ul([
        "Columns have the same width and item heights follow the aspect ratio in your data, independent of the image download.",
        "Only items within `buffer` pixels of the viewport are rendered, so thousands of cards do not slow the page down.",
        "The next page is requested as the user nears the bottom, with a single request in flight at a time.",
        "Columns and positions are recalculated when the container width changes.",
      ]),

      h2("quick-start", "Quick start"),
      code(`import { VirtualMasonry } from "react-hybrid-masonry";

type Pin = { id: number; url: string; title: string; width: number; height: number };

async function loadData(page: number, pageSize: number) {
  const res = await fetch("/api/pins?page=" + page + "&size=" + pageSize);
  const json = await res.json();
  return { data: json.items as Pin[], hasMore: json.hasMore as boolean };
}

export function PinBoard() {
  return (
    <VirtualMasonry
      loadData={loadData}
      pageSize={30}
      minColumnWidth={200}
      maxColumnWidth={350}
      gap={16}
      renderItem={(item) => (
        <div
          key={item.id}
          style={{ position: "absolute", left: item.x, top: item.y, width: item.width, height: item.height }}
        >
          <img
            src={item.url}
            alt={item.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}
    />
  );
}`),
      note("Every item needs a width and a height before it loads: the component computes positions from them. See [data and sizes](#data) below."),

      h2("data", "Data and sizes"),
      h3("Where sizes come from"),
      p("The size of each item is read from the first pair of fields that exists: `width`/`height`, `w`/`h`, `imgW`/`imgH`. Use `mapSize` when your data is shaped differently:"),
      code(`<VirtualMasonry
  mapSize={(raw) => ({ width: raw.cover.w, height: raw.cover.h })}
  loadData={loadData}
  renderItem={renderCard}
/>`),
      p("The layout only uses the `height / width` ratio, so any unit works: pixels, or plain ratio values such as `4` and `3`."),
      note("Items without valid sizes cannot be laid out: a missing width or height gives `NaN`, and the positions of every item after it break. If the API may omit fields, give `mapSize` a fallback, for example `{ width: raw.w || 4, height: raw.h || 3 }`."),
      h3("What renderItem receives"),
      p("The `item` passed to `renderItem(item, index)` is your original object plus the fields below, calculated by the layout. Your own fields (`url`, `title`, ...) are kept:"),
      table(
        ["Field", "Meaning"],
        [
          ["`x`", "Distance from the left edge of the container (px). May be fractional."],
          ["`y`", "Distance from the top of the container (px). May be fractional."],
          ["`width`", "The column width (px), the same for every item in one layout. It **replaces the `width` in your data**."],
          ["`height`", "The height calculated from the aspect ratio (px). It **replaces the `height` in your data**."],
          ["`widthRatio`", "The original aspect ratio `width / height`."],
        ],
      ),
      p("`index` is the position of the item among the **currently rendered items**. It changes while scrolling, so **do not use it as a `key`**. To keep the original dimensions, have your API use other field names such as `w`/`h` and read them through `mapSize`. Positions and sizes can be fractional; if you need whole pixels, round them yourself in `renderItem`."),

      h2("render", "Rendering cards"),
      ul([
        "The root element you return must be **absolutely positioned** with the `left`, `top`, `width` and `height` you receive.",
        "Give the root element a stable `key`, such as `item.id`.",
        "Inside the card you are free to lay things out: image, title, buttons. The height is `item.height`, and the content has to fit it.",
        "For images use `width: 100%; height: 100%; object-fit: cover`, so they do not distort when the ratio differs from the data.",
      ]),
      code(`const Card = React.memo(function Card({ item }: { item: Pin & { x: number; y: number; width: number; height: number } }) {
  return (
    <article
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        overflow: "hidden",
        borderRadius: 12,
      }}
    >
      <img src={item.url} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </article>
  );
});

<VirtualMasonry loadData={loadData} renderItem={(item) => <Card key={item.id} item={item} />} />`),
      p("While the width stays the same the layout result is stable, and visible items keep the same object reference as you scroll, so wrapping the card in `React.memo` avoids re-rendering it on scroll, see [performance tuning](@/guides/performance/)."),

      h2("props", "Props"),
      table(
        ["Prop", "Type", "Default", "Description"],
        [
          ["`loadData`", "`(page, pageSize) => Promise<{ data: any[]; hasMore: boolean }>`", "–", "Load one page of data. Pages start at 1. Without it the component stays empty."],
          ["`renderItem`", "`(item, index) => ReactNode`", "required", "Render one item. `index` is its position among the **currently rendered** items."],
          ["`pageSize`", "`number`", "`50`", "Number of items requested per page."],
          ["`minColumnWidth`", "`number`", "`200`", "Minimum column width (px), used to derive the column count."],
          ["`maxColumnWidth`", "`number`", "–", "Maximum column width (px)."],
          ["`columns`", "`number`", "–", "Set the column count directly instead of deriving it from the width."],
          ["`gap`", "`number`", "`16`", "Horizontal and vertical space between items (px)."],
          ["`buffer`", "`number`", "`1500`", "Extra distance above and below the viewport that is still rendered (px)."],
          ["`loadMoreThreshold`", "`number`", "`800`", "How far from the bottom (px) the next page is requested."],
          ["`mapSize`", "`(raw) => { width, height }`", "–", "Map your data to a width and height."],
          ["`initialItems`", "`any[]`", "–", "A first page you already have (for example prefetched during SSR). Page 1 is not requested again; loading continues from page 2."],
          ["`initialHasMore`", "`boolean`", "`true`", "Used with `initialItems`: whether more data exists after the first page."],
          ["`enableAnimation`", "`boolean`", "`true`", "Reserved, currently has no effect."],
        ],
      ),

      h2("columns", "Columns and column width"),
      p("The column count is determined in this order:"),
      ol([
        "If `columns` is set it is used as is, and the width options no longer take part.",
        "Otherwise start with `floor(container width / minColumnWidth)` columns, at least 1.",
        "If `maxColumnWidth` is set and the columns are wider than it, columns are added one by one (up to 20) until they fit; but if one more column would make them narrower than `minColumnWidth`, no further column is added. When the two limits cannot both be met, the minimum wins.",
      ]),
      p("The column width is `(container width - gap * (columns - 1)) / columns`, capped at `maxColumnWidth`. Here is what the same rules produce (16px gap):"),
      widthTable,
      ul([
        "**The minimum width does not include the gap**: step 2 divides the container width by `minColumnWidth` without subtracting `gap`, so the real column width can be slightly below `minColumnWidth` (by less than one `gap`). In the table, 1024px gives 5 columns of 192px while `minColumnWidth` is 200.",
        "**When `maxColumnWidth` takes effect the grid is left-aligned** and the right side stays empty, see the FAQ below.",
        "To hit the design's column count exactly at every width, use `columns` and pass it per breakpoint.",
      ]),

      h2("rules", "Placement rules"),
      ul([
        "Each item goes into the **currently shortest column**; when several columns are equally tall, the leftmost of them is used.",
        "Item height = `column width * (original height / original width)`, and the gap between items (horizontal and vertical) is `gap`.",
        "Once an item is placed it never moves: new data is only appended below the columns, so content you have already seen does not jump.",
        "The minimum height of the container equals the height of the tallest column, so the scrollbar always matches the content.",
      ]),
      note("The reading order of a waterfall is down the columns, not row by row from left to right. When content must be read strictly by row, use the [equal-height layout](@/equal-height/)."),

      h2("loading", "Scrolling, virtualization and loading"),
      ul([
        "The component follows the **window** scroll and reads its own position with `getBoundingClientRect`, so place it in a normally scrolling page. Scrolling inside a nested `overflow` container is not supported.",
        "Items within `buffer` pixels above and below the viewport are rendered, and scroll position updates are throttled per frame (`requestAnimationFrame`), so fast scrolling stays smooth.",
        "An invisible trigger at the bottom of the container requests the next page when it is `loadMoreThreshold` away from the viewport. Only one request is in flight at a time.",
        "A failed request (a rejected `loadData`) stops automatic paging to avoid endless retries; remount the component to start again, see [pagination and infinite scroll](@/guides/pagination/).",
      ]),
      h3("Showing a loading state"),
      p("The component does not render a loading indicator itself. If you want one, keep the state in your `loadData` and put the indicator under the list (the container has a minimum height, so it always sits below the content):"),
      code(`function Board() {
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      return await fetchPins(page, pageSize);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <VirtualMasonry loadData={loadData} renderItem={renderCard} />
      {loading && <p style={{ textAlign: "center" }}>Loading…</p>}
    </>
  );
}`),

      h2("ssr", "Initial data and SSR"),
      p("When you already have the first page (on the server or elsewhere), pass it as `initialItems`. The component renders the first screen from it without requesting page 1, and the next request is page 2:"),
      code(`// app/pins/page.tsx (server component)
import Board from "./Board";

export default async function Page() {
  const first = await fetchPins(1, 30);
  return <Board initialItems={first.items} initialHasMore={first.hasMore} />;
}

// app/pins/Board.tsx
"use client";

import { VirtualMasonry } from "react-hybrid-masonry";

export default function Board({ initialItems, initialHasMore }) {
  return (
    <VirtualMasonry
      initialItems={initialItems}
      initialHasMore={initialHasMore}
      pageSize={30}
      loadData={(page, size) => fetchPinsFromApi(page, size)} // the first call requests page 2
      renderItem={renderCard}
    />
  );
}`),
      note("Positions can only be computed once the browser has measured the container width, so the server-rendered HTML **does not contain the cards**. `initialItems` saves the request for the first screen, not the first-screen HTML. When search engines must index the content, render a crawlable list separately, see [Next.js and SSR](@/guides/nextjs-ssr/)."),

      h2("recipes", "Recipes"),
      table(
        ["Use case", "Options", "Result"],
        [
          ["Image wall", "`minColumnWidth={240}` `maxColumnWidth={360}` `gap={16}`", "Columns are added and removed with the width and stay in a comfortable width range."],
          ["Product feed", "`columns={2}` (phone) / `columns={4}` (desktop) `gap={12}`", "A fixed column count that matches the design at every breakpoint."],
          ["Compact feed", "`minColumnWidth={160}` `gap={8}`", "Narrower columns and smaller gaps, more content per screen."],
        ],
      ),
      h3("Setting the columns per breakpoint"),
      code(`import { useEffect, useState } from "react";

function useColumns() {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setColumns(width < 640 ? 2 : width < 1024 ? 3 : 4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}

<VirtualMasonry columns={useColumns()} gap={12} loadData={loadData} renderItem={renderCard} />`),
      p("There is no `window` during server rendering, so this hook uses the desktop column count on the first render and switches after mounting. More patterns are in [responsive layouts](@/guides/responsive/)."),

      h2("core", "Controlled usage: the Core component"),
      p("If your data is already managed by React Query, SWR, Redux or similar, use `VirtualMasonryCore` directly. It only does layout, virtual scrolling and the near-the-bottom callback: it does not fetch and it does not deduplicate requests."),
      code(`import { VirtualMasonryCore } from "react-hybrid-masonry";

function Board() {
  const { pins, hasNextPage, isFetching, fetchNextPage } = usePins(); // your own data layer

  return (
    <VirtualMasonryCore
      items={pins} // every item needs a width and a height
      hasMore={hasNextPage}
      loading={isFetching}
      onLoadMore={fetchNextPage}
      renderItem={(item) => <Card key={item.id} item={item} />}
    />
  );
}`),
      table(
        ["Prop", "Type", "Default", "Description"],
        [
          ["`items`", "`any[]`", "required", "All loaded data; every item needs a numeric `width` and `height`."],
          ["`renderItem`", "`(item, index) => ReactNode`", "required", "As above."],
          ["`onLoadMore`", "`() => void`", "–", "Called near the bottom. Only fires while `hasMore` is true and `loading` is false."],
          ["`hasMore`", "`boolean`", "`true`", "Whether more data exists."],
          ["`loading`", "`boolean`", "`false`", "Whether a request is in flight. Set it to `true` during the request and back to `false` afterwards; the component uses the change to check again whether it should keep loading."],
          ["`minColumnWidth`", "`number`", "`200`", "As above."],
          ["`maxColumnWidth`", "`number`", "–", "As above."],
          ["`columns`", "`number`", "–", "As above."],
          ["`gap`", "`number`", "`16`", "As above."],
          ["`buffer`", "`number`", "`300`", "Note: differs from the default of the component above (1500)."],
          ["`loadMoreThreshold`", "`number`", "`500`", "Note: differs from the default of the component above (800)."],
        ],
      ),
      note("`VirtualMasonry` is the Core component plus data loading, paging and `mapSize` handling, so the layout behaviour is identical. Core reads `item.width` and `item.height` directly and never calls `mapSize`; map your data first if needed."),

      h2("faq", "FAQ"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("Related: [pagination and infinite scroll](@/guides/pagination/), [responsive layouts](@/guides/responsive/), [performance tuning](@/guides/performance/), [Next.js and SSR](@/guides/nextjs-ssr/)."),
    ),
  };
}
