import { code, figure, figures, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { SAMPLE_SIZES, layoutSvg } from "../diagram.mjs";

const faqs = [
  [
    "Why is the last row not stretched to the full width?",
    "On purpose. The row at the end of the array keeps its natural proportions (its height is at most targetRowHeight) instead of being stretched to fill the container, which would blow a few images up and make them blurry. When the next page arrives that row is no longer the last one, so it is recalculated and filled. Once the list is fully loaded (hasMore is false) the last row stays as it is.",
  ],
  [
    "Why does a row have empty space on its right?",
    "Apart from the last row there is one reason: an image in that row was capped by maxItemWidth, typically a very wide panorama. The component keeps every image at or below maxItemWidth even if that leaves the row short. Raise maxItemWidth to at least the container width, or stop limiting it, and the row fills again.",
  ],
  [
    "Images look slightly cropped or stretched. Why?",
    "Every row must end exactly at the container edge while the row height is limited to sizeRange, so an image's aspect ratio can differ a little from the original. Use object-fit: cover on the img: the difference then shows up as a sliver of cropping instead of distortion. The narrower sizeRange is, the tighter the row height is held and the more visible the difference becomes.",
  ],
  [
    "Why is the real row height different from targetRowHeight?",
    "targetRowHeight is only the starting point: it sets each image's ideal width and therefore how many images go into a row. The row height is then scaled to whatever makes the row fill the width and clamped to sizeRange, so rows can differ in height. Narrow sizeRange if you want all rows to be almost the same height.",
  ],
  [
    "Do the rows above jump when the next page loads?",
    "No. Rows are built greedily in order, so data appended at the end never changes rows that are already complete. Only the previous last row is recalculated, because it is no longer the last one and now gets more images and fills the width.",
  ],
  [
    "Can I put a title and description under each image?",
    "Not really. The row height is decided by the layout, and the height you receive is the whole space the image gets, so there is no room reserved below it. Overlay text on the image instead (for example a caption that appears on hover), or use the waterfall layout, which lets cards have different heights.",
  ],
  [
    "What happens when the window width changes?",
    "The component observes its container width and recalculates every row when it changes: how many images go in a row, the row heights and every image width adjust on their own. If you want a different row height on small screens, pass different targetRowHeight and sizeRange values per breakpoint, see Recipes below.",
  ],
];

export default function equalHeightPage() {
  const demo = SAMPLE_SIZES.slice(0, 16);
  // 并排对比用较少的图片，两张图的高度才不会差太多
  const few = SAMPLE_SIZES.slice(0, 10);

  const basic = layoutSvg(
    demo,
    { width: 640, targetRowHeight: 90, gap: 6, sizeRange: [80, 100], maxStretchRatio: 1.5 },
    "Equal-height layout: every row has the same height and ends at the right edge, the last row keeps its natural proportions",
  );

  const smallRows = layoutSvg(
    few,
    { width: 300, targetRowHeight: 50, gap: 4, sizeRange: [44, 56] },
    "Smaller target row height: more images per row",
  );
  const bigRows = layoutSvg(
    few,
    { width: 300, targetRowHeight: 100, gap: 4, sizeRange: [90, 110] },
    "Larger target row height: fewer images per row",
  );

  const loose = layoutSvg(
    few,
    { width: 300, targetRowHeight: 70, gap: 4, sizeRange: [60, 80], maxStretchRatio: 1.5 },
    "Layout with maxStretchRatio 1.5",
  );
  const strict = layoutSvg(
    few,
    { width: 300, targetRowHeight: 70, gap: 4, sizeRange: [60, 80], maxStretchRatio: 1.2 },
    "Layout with maxStretchRatio 1.2",
  );

  return {
    nav: "FullWidthEqualHeightMasonry",
    title: "FullWidthEqualHeightMasonry – Complete Guide to the React Justified Layout",
    description:
      "Complete reference for FullWidthEqualHeightMasonry: a Google Photos style equal-height layout for React, with layout diagrams, data and size contract, how the options work together, recipes, the controlled Core component, a comparison with the waterfall layout and a FAQ.",
    h1: "FullWidthEqualHeightMasonry",
    lead: "A Google Photos style layout: images keep their aspect ratio, every row has the same height, and rows are scaled to fill the container width exactly. Only the rows near the viewport are rendered.",
    faq: faqs,
    body: join(
      h2("overview", "Overview"),
      p("`FullWidthEqualHeightMasonry` lays images out row by row: **every row has the same height and ends at the right edge, and every image keeps its own aspect ratio**. How many images fit in a row follows from their proportions rather than from a fixed number of columns, which makes it a good fit for photo albums, timelines and search results where the images are the content."),
      figure(
        basic.svg,
        `Layout for a 640px container with a 90px target row height and 6px gap (${basic.rows} rows, the numbers are the image aspect ratios). Solid rows end at the right edge; the dashed last row keeps its natural proportions and is not stretched.`,
      ),
      ul([
        "All rows have the same height, and the gap between rows and between images is `gap`.",
        "Each image keeps its aspect ratio, with only a small deviation, see [how the options work together](#params).",
        "Only rows within `buffer` pixels of the viewport are rendered, so thousands of images do not slow the page down.",
        "The next page is requested as the user nears the bottom, with a single request in flight at a time.",
      ]),

      h2("quick-start", "Quick start"),
      code(`import { FullWidthEqualHeightMasonry } from "react-hybrid-masonry";

type Photo = { id: number; url: string; title: string; width: number; height: number };

async function loadData(page: number, pageSize: number) {
  const res = await fetch("/api/photos?page=" + page + "&size=" + pageSize);
  const json = await res.json();
  return { data: json.items as Photo[], hasMore: json.hasMore as boolean };
}

export function PhotoAlbum() {
  return (
    <FullWidthEqualHeightMasonry
      loadData={loadData}
      pageSize={30}
      targetRowHeight={245}
      sizeRange={[230, 260]}
      gap={8}
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
      note("Every item needs a width and a height before it loads: the component computes positions from them instead of waiting for the images to download. See [data and sizes](#data) below."),

      h2("data", "Data and sizes"),
      h3("Where sizes come from"),
      p("The size of each item is read from the first pair of fields that exists: `width`/`height`, `w`/`h`, `imgW`/`imgH`. Use `mapSize` when your data is shaped differently:"),
      code(`<FullWidthEqualHeightMasonry
  mapSize={(raw) => ({ width: raw.cover.w, height: raw.cover.h })}
  loadData={loadData}
  renderItem={renderCard}
/>`),
      p("Internally the component turns `width / height` into a `widthRatio` per image, and the whole layout depends on that ratio only, so any unit works: pixels, or plain ratio values such as `4` and `3`."),
      note("Items without valid sizes cannot be laid out: a missing width or height gives `NaN` and every position in that row breaks. If the API may omit fields, give `mapSize` a fallback, for example `{ width: raw.w || 4, height: raw.h || 3 }`."),
      h3("What renderItem receives"),
      p("The `item` passed to `renderItem(item, index)` is your original object plus the fields below, calculated by the layout. Your own fields (`url`, `title`, ...) are kept:"),
      table(
        ["Field", "Meaning"],
        [
          ["`x`", "Distance from the left edge of the container (px)."],
          ["`y`", "Distance from the top of the container (px)."],
          ["`width`", "Laid-out width (px). It **replaces the `width` in your data**."],
          ["`height`", "Laid-out height (px), the same for every image in a row. It **also replaces the `height` in your data**."],
          ["`widthRatio`", "The aspect ratio `width / height`."],
        ],
      ),
      p("`index` is the position of the item among **all loaded data**. It stays the same while scrolling, so it is safe to use for a `key` or for tracking. To keep the original dimensions, have your API use other field names such as `w`/`h` and read them through `mapSize`."),

      h2("render", "Rendering cards"),
      ul([
        "The root element you return must be **absolutely positioned** with the `left`, `top`, `width` and `height` you receive.",
        "Give the root element a stable `key`, such as `item.id`.",
        "Use `object-fit: cover` on images. To make each row end exactly at the edge an image's ratio can deviate slightly, and `cover` turns that deviation into a sliver of cropping instead of distortion.",
        "Put captions on top of the image. The layout decides the row height, so there is no extra space below an image.",
      ]),
      code(`const Card = React.memo(function Card({ item }: { item: Photo & { x: number; y: number; width: number; height: number } }) {
  return (
    <figure
      className="card"
      style={{ position: "absolute", left: item.x, top: item.y, width: item.width, height: item.height, margin: 0 }}
    >
      <img src={item.url} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <figcaption className="card-caption">{item.title}</figcaption>
    </figure>
  );
});

// .card { overflow: hidden; border-radius: 6px; }
// .card-caption { position: absolute; inset: auto 0 0 0; padding: 24px 12px 10px; opacity: 0; transition: opacity .2s;
//   background: linear-gradient(to top, rgba(0,0,0,.6), transparent); color: #fff; }
// .card:hover .card-caption { opacity: 1; }`),
      p("While the width stays the same the layout result is stable, and visible items keep the same object reference as you scroll, so wrapping the card in `React.memo` avoids re-rendering it on scroll, see [performance tuning](@/guides/performance/)."),

      h2("props", "Props"),
      table(
        ["Prop", "Type", "Default", "Description"],
        [
          ["`loadData`", "`(page, pageSize) => Promise<{ data: any[]; hasMore: boolean }>`", "–", "Load one page of data. Pages start at 1."],
          ["`renderItem`", "`(item, index) => ReactNode`", "required", "Render one positioned item. `index` is its position among all loaded data."],
          ["`pageSize`", "`number`", "`50`", "Number of items requested per page."],
          ["`targetRowHeight`", "`number`", "`245`", "Target row height; decides how many images go into a row. The actual height is adjusted within `sizeRange`."],
          ["`sizeRange`", "`[number, number]`", "`[230, 260]`", "Allowed row height `[min, max]`."],
          ["`maxItemWidth`", "`number`", "`975`", "Maximum width of a single item."],
          ["`maxStretchRatio`", "`number`", "`1.5`", "A row keeps taking images until filling it needs an enlargement no greater than this value. Shrinking is not limited."],
          ["`gap`", "`number`", "`8`", "Horizontal and vertical space between items (px)."],
          ["`buffer`", "`number`", "`1500`", "Extra distance above and below the viewport that is still rendered (px)."],
          ["`loadMoreThreshold`", "`number`", "`500`", "How far from the bottom (px) the next page is requested."],
          ["`mapSize`", "`(raw) => { width, height }`", "–", "Map your data to a width and height."],
          ["`enableAnimation`", "`boolean`", "`true`", "Reserved, currently has no effect."],
        ],
      ),
      note("This component currently has **no** `initialItems`/`initialHasMore`; the first page is loaded through `loadData` after mounting. When you need full control of the data, use the [Core component](#core) below."),

      h2("params", "How the options work together"),
      h3("targetRowHeight and sizeRange"),
      p("The two options do different jobs. `targetRowHeight` decides **how many images go into a row**: the component uses it to compute each image's ideal width and keeps adding images until filling the row needs an enlargement no greater than `maxStretchRatio`. `sizeRange` decides the **final row height limits**: the height needed to fill the row is clamped into this range, and then the image widths are distributed proportionally so the row ends exactly at the container edge."),
      figures(
        [smallRows.svg, `Target row height 50px: ${smallRows.rows} rows, more images per row.`],
        [bigRows.svg, `Target row height 100px: ${bigRows.rows} rows, fewer images per row.`],
      ),
      p("To make images larger overall, raise `targetRowHeight` and `sizeRange` together. If you raise only one of them, the other pulls the row height back."),
      h3("maxStretchRatio"),
      p("It controls how much a row is willing to enlarge its images. A smaller value makes a row take more images before it ends, so images are enlarged less; a larger value ends rows earlier with fewer images that are enlarged more. **Shrinking is not limited.**"),
      figures(
        [loose.svg, `\`maxStretchRatio\` 1.5: ${loose.rows} rows.`],
        [strict.svg, `\`maxStretchRatio\` 1.2: ${strict.rows} rows, denser rows overall.`],
      ),
      h3("maxItemWidth"),
      p("The width limit of a single image. A very wide panorama would otherwise take the whole row; with the limit it is cut to `maxItemWidth`, and the row may end up short on the right. If you want every row to fill the width, set it to at least the container width."),
      h3("gap, buffer and loadMoreThreshold"),
      ul([
        "`gap` is both the horizontal and the vertical spacing.",
        "`buffer` is the distance above and below the viewport that is still rendered. Raise it to reduce blank areas during fast scrolling, at the price of more nodes in the DOM.",
        "`loadMoreThreshold` is how early the next page is requested. Raise it on slow networks so the data arrives before the user reaches the bottom.",
      ]),

      h2("behaviour", "Behaviour"),
      ul([
        "Rows are built greedily: an image keeps being added while filling the current row would need an enlargement above `maxStretchRatio`; shrinking is never limited.",
        "The row height is then clamped to `sizeRange` and the widths are distributed by cumulative ratio, so the row ends exactly at the container edge and rounding errors are not left to the last image.",
        "**The last row is not stretched.** It keeps its natural proportions (at most `targetRowHeight` high), so a handful of images are never blown up. It is recalculated when the next page arrives.",
        "No item is wider than `maxItemWidth`, so a very wide panorama does not take a whole row.",
        "Every row is recalculated when the container width changes (window resize, a hidden tab becoming visible).",
      ]),
      p("The full procedure with formulas is in [how the equal-height layout works](@/guides/equal-height-algorithm/)."),

      h2("recipes", "Recipes"),
      table(
        ["Use case", "Options", "Result"],
        [
          ["Albums, photography (large)", "`targetRowHeight={320}` `sizeRange={[300, 360]}` `gap={8}`", "2 to 3 images per row at desktop widths, generous pictures."],
          ["Stock sites, search results (default)", "`targetRowHeight={245}` `sizeRange={[230, 260]}` `gap={8}`", "About 3 images per row at desktop widths, a balance of density and look."],
          ["Thumbnail wall", "`targetRowHeight={160}` `sizeRange={[140, 180]}` `gap={4}`", "About 5 images per row at desktop widths, many images per screen."],
          ["Phone", "`targetRowHeight={120}` `sizeRange={[100, 140]}` `gap={4}`", "2 images per row at portrait phone widths."],
        ],
      ),
      h3("Switching options per breakpoint"),
      p("All of these are plain props, so you can pass different values per screen width. Keep `sizeRange` outside the component or in `useMemo`: it is a dependency of the layout calculation, and passing a new array on every render makes every row recalculate."),
      code(`import { useEffect, useMemo, useState } from "react";

function useRowConfig() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return useMemo(
    () =>
      narrow
        ? { targetRowHeight: 120, sizeRange: [100, 140] as [number, number], gap: 4 }
        : { targetRowHeight: 245, sizeRange: [230, 260] as [number, number], gap: 8 },
    [narrow],
  );
}

<FullWidthEqualHeightMasonry {...useRowConfig()} loadData={loadData} renderItem={renderCard} />`),
      p("There is no `window` during server rendering, so this hook uses the desktop options on the first render and switches after mounting. More responsive patterns are in [responsive layouts](@/guides/responsive/)."),

      h2("core", "Controlled usage: the Core component"),
      p("If your data is already managed by React Query, SWR, Redux or similar, use `FullWidthEqualHeightMasonryCore` directly. It only does layout, virtual scrolling and the near-the-bottom callback: it does not fetch and it does not deduplicate requests."),
      code(`import { FullWidthEqualHeightMasonryCore } from "react-hybrid-masonry";

function Album() {
  const { photos, hasNextPage, isFetching, fetchNextPage } = usePhotos(); // your own data layer

  // Core needs a widthRatio on every item, and a stable items reference
  const items = useMemo(
    () => photos.map((p) => ({ ...p, widthRatio: p.width / p.height })),
    [photos],
  );

  return (
    <FullWidthEqualHeightMasonryCore
      items={items}
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
          ["`items`", "`any[]`", "required", "All loaded data; every item needs a `widthRatio` (width / height)."],
          ["`renderItem`", "`(item, index) => ReactNode`", "required", "As above."],
          ["`onLoadMore`", "`() => void`", "–", "Called near the bottom. Only fires while `hasMore` is true and `loading` is false."],
          ["`hasMore`", "`boolean`", "`true`", "Whether more data exists."],
          ["`loading`", "`boolean`", "`false`", "Whether a request is in flight. Set it to `true` during the request and back to `false` afterwards; the component uses the change to check again whether it should keep loading."],
          ["`targetRowHeight`", "`number`", "`245`", "As above."],
          ["`sizeRange`", "`[number, number]`", "`[230, 260]`", "As above."],
          ["`maxItemWidth`", "`number`", "`975`", "As above."],
          ["`maxStretchRatio`", "`number`", "`1.5`", "As above."],
          ["`gap`", "`number`", "`8`", "As above."],
          ["`buffer`", "`number`", "`1000`", "Note: differs from the default of the component above."],
          ["`loadMoreThreshold`", "`number`", "`800`", "Note: differs from the default of the component above."],
        ],
      ),
      note("`FullWidthEqualHeightMasonry` is the Core component plus data loading, paging and the `widthRatio` calculation, so the layout behaviour is identical."),

      h2("compare", "Choosing between this and the waterfall"),
      table(
        ["", "FullWidthEqualHeightMasonry", "VirtualMasonry"],
        [
          ["Arrangement", "By rows, each row has the same height and fills the width", "By columns, each item goes into the shortest column"],
          ["Image proportions", "Every image keeps its ratio, widths differ", "Columns have the same width, heights follow the ratio"],
          ["Columns", "No fixed column count, it follows the image ratios", "Set by `minColumnWidth` or `columns`"],
          ["Card content", "Image-first, text sits on top of the image", "Card heights may differ, good for cards with text"],
          ["End of list", "The last row keeps its natural proportions", "Columns naturally end at different lengths"],
          ["Good for", "Albums, asset libraries, search results", "Image walls, product feeds, content cards"],
        ],
      ),
      p("When the API or the content decides which one to show, use [DynamicMasonryView](@/dynamic-view/)."),

      h2("faq", "FAQ"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("Related: [how the equal-height layout works](@/guides/equal-height-algorithm/), [responsive layouts](@/guides/responsive/), [pagination and infinite scroll](@/guides/pagination/), [performance tuning](@/guides/performance/)."),
    ),
  };
}
