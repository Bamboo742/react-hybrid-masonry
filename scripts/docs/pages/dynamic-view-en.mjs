import { code, figure, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { decisionSvg } from "../diagram.mjs";

const faqs = [
  [
    "The layout type from the API changed but the layout did not switch.",
    "In uncontrolled mode the layout type is read only once, from the first loadData(1) call, and later pages are not looked at. To switch at runtime, use the isMasonry prop.",
  ],
  [
    "Why does the list start loading from the beginning after a switch, and the scroll position is gone?",
    "The waterfall and the equal-height layouts are two different components. When isMasonry changes, the current one is unmounted and the other is mounted, and the new one loads from page 1, so the list grows back from the top and the previous scroll position is not kept. This is expected: the two layouts compute positions in completely different ways, so an already laid-out result cannot be reused between them. If you want to keep the reading position, do not switch the layout while the user is deep in the list.",
  ],
  [
    "Is page 1 requested twice?",
    "Normally no. In uncontrolled mode the component requests loadData(1, pageSize) once on mount, the result is cached and the inner layout component takes that cache. The exception is a failed first request: there is no cache then, so the inner component requests page 1 again.",
  ],
  [
    "Why is the isMasonry returned by loadData ignored in controlled mode?",
    "The isMasonry prop has the highest priority. When it is passed, the component does not request page 1 up front to determine the layout and never reads the isMasonry in the loadData result; only the prop decides the layout.",
  ],
  [
    "There is a blank area when the page opens. What can I do?",
    "In uncontrolled mode the component has to wait for page 1 to know which layout to use, and during that time it renders renderInitialLoader (a blank block if you pass nothing). Give it a skeleton, or decide the layout on the server and pass it as the isMasonry prop so there is nothing to wait for.",
  ],
  [
    "Can I use initialItems here?",
    "DynamicMasonryView currently has no initialItems or initialHasMore. To start from prefetched first-page data, use VirtualMasonry directly (it supports initialItems) and choose the layout yourself.",
  ],
  [
    "How do I share one card component between the two layouts?",
    "The third argument of renderItem tells you which layout is in use, so one card component can adapt its radius, text size and so on. Note that index means something different in the two layouts; do not use it as a key, use item.id.",
  ],
];

export default function dynamicViewPage() {
  const flow = decisionSvg({
    aria: "How the layout is decided: the isMasonry prop first, then the first API response, then defaultIsMasonry",
    mount: "Mount",
    askProp: "isMasonry\npassed?",
    yes: "yes",
    no: "no",
    useProp: "Use that value\n(controlled)",
    fetch: "Call\nloadData(1, pageSize)",
    askReturned: "isMasonry\nreturned?",
    useReturned: "Use the\nreturned value",
    useDefault: "Use\ndefaultIsMasonry",
    failed: "Page 1 request fails: onError is called, default layout is used",
  });

  return {
    nav: "DynamicMasonryView",
    title: "DynamicMasonryView – Complete Guide to Switching Between Waterfall and Equal-Height in React",
    description:
      "Complete reference for DynamicMasonryView: choose between the waterfall and the equal-height layout at runtime, with a decision flow diagram, controlled and API-driven usage, how the first page is cached, loading and error handling, per-layout options and a FAQ.",
    h1: "DynamicMasonryView",
    lead: "One component, two layouts. The layout is decided by a prop, by the first API response, or by a default.",
    faq: faqs,
    body: join(
      h2("overview", "Overview"),
      p("`DynamicMasonryView` is a selector around [VirtualMasonry](@/virtual-masonry/) (waterfall) and [FullWidthEqualHeightMasonry](@/equal-height/) (equal-height): **the API tells it which presentation a list should use**, so operations or the backend can switch per content (image-first or text cards) without the frontend maintaining two pages."),
      figure(
        flow,
        "How the layout is decided: the `isMasonry` prop first; if it is missing, page 1 is requested and its response is checked for `isMasonry`; if that is missing too, `defaultIsMasonry` is used. The dashed path is a failed page 1 request.",
      ),
      ul([
        "The component only selects. Layout, virtual scrolling and paging are done by the two inner components and behave exactly as they do on their own.",
        "Both layouts share one `loadData`, one `renderItem` and one `mapSize`, so you write a single data layer and a single card.",
        "In uncontrolled mode page 1 is requested only once: the request used to read the layout type is handed straight to the inner component.",
      ]),

      h2("quick-start", "Quick start"),
      p("The most common use: the API tells the component which layout to use in the first page."),
      code(`import { DynamicMasonryView } from "react-hybrid-masonry";

async function loadData(page: number, pageSize: number) {
  const res = await fetch("/api/content?page=" + page + "&size=" + pageSize);
  const json = await res.json();
  return page === 1
    ? { data: json.items, hasMore: json.hasMore, isMasonry: json.layoutType === "waterfall" }
    : { data: json.items, hasMore: json.hasMore };
}

export function Feed() {
  return (
    <DynamicMasonryView
      loadData={loadData}
      pageSize={30}
      waterfallConfig={{ minColumnWidth: 200, maxColumnWidth: 350, gap: 16 }}
      equalHeightConfig={{ targetRowHeight: 245, sizeRange: [230, 260], gap: 8 }}
      renderItem={(item, index, isMasonry) => (
        <div
          key={item.id}
          style={{
            position: "absolute",
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
            borderRadius: isMasonry ? 12 : 6,
            overflow: "hidden",
          }}
        >
          <img src={item.url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}
    />
  );
}`),
      note("Every item needs a width and a height before it loads: both layouts compute positions from them. The contract is the same as for [VirtualMasonry](@/virtual-masonry/#data) and [FullWidthEqualHeightMasonry](@/equal-height/#data)."),

      h2("modes", "Three ways to decide the layout"),
      h3("1. Controlled"),
      code(`<DynamicMasonryView
  isMasonry={useWaterfall} // true = waterfall, false = equal-height
  loadData={loadData}
  renderItem={(item, index, isMasonry) => /* ... */ null}
/>`),
      p("This prop has the highest priority. When it is passed, the component does **not** request page 1 up front to determine the layout, and any `isMasonry` in the `loadData` result is ignored. When it changes, the current layout component is unmounted, the other one is mounted, and the list loads from page 1 again."),
      h3("2. From the first API response"),
      p("Without an `isMasonry` prop, the component calls `loadData(1, pageSize)` once after mounting, reads `isMasonry` from the result and caches that first page, so the chosen layout shows it immediately and page 1 is not requested a second time. The layout type is **read only once**; later pages do not need to return it."),
      h3("3. The default"),
      p("If `loadData` does not return `isMasonry`, `defaultIsMasonry` is used (default `true`, the waterfall). It is also used when no `loadData` is passed."),
      note("If the first request fails, `onError` is called and the default layout is used. There is no cached page 1 then, so the inner component requests page 1 again; if that fails too, the inner component stops paging instead of retrying forever."),

      h2("controlled", "Controlled switching example"),
      p("When the user chooses the presentation, keep the state yourself:"),
      code(`function Gallery() {
  const [isMasonry, setIsMasonry] = useState(true);

  return (
    <>
      <div role="group" aria-label="Layout">
        <button aria-pressed={isMasonry} onClick={() => setIsMasonry(true)}>Waterfall</button>
        <button aria-pressed={!isMasonry} onClick={() => setIsMasonry(false)}>Equal height</button>
      </div>

      <DynamicMasonryView isMasonry={isMasonry} loadData={loadData} renderItem={renderCard} />
    </>
  );
}`),
      ul([
        "Switching remounts the layout component and the list loads from page 1 again, and the scroll position is not kept, see the FAQ.",
        "`onLayoutTypeLoaded` is called on mount and every time `isMasonry` changes.",
        "Controlled mode has no \"waiting for the layout type\" phase, so `renderInitialLoader` is never shown.",
      ]),

      h2("render", "renderItem and cards"),
      p("`renderItem(item, index, isMasonry)` has one more argument than on the individual components: it tells you which layout this render is for, so one card can adapt to both. The fields of `item` (`x`, `y`, `width`, `height`, ...) are the same as for the corresponding component, and the root element must be **absolutely positioned** as well."),
      table(
        ["", "Waterfall (`isMasonry` is `true`)", "Equal height (`isMasonry` is `false`)"],
        [
          ["`index`", "Position among the **currently rendered** items; changes while scrolling", "Position among all loaded data; stays the same while scrolling"],
          ["`item.width`", "The column width, the same for every item in one layout", "Different for every image"],
          ["`item.height`", "Calculated from the ratio, different per item", "The same within a row"],
          ["Card content", "Heights may differ, good for cards with text", "Image-first, text sits on top of the image"],
        ],
      ),
      p("In both layouts use a stable value such as `key={item.id}`; do not use `index` as the `key`."),

      h2("config", "Options for the two layouts"),
      p("`waterfallConfig` goes to the waterfall and `equalHeightConfig` to the equal-height layout. Fields you do not pass use the defaults of the corresponding component, and the two objects do not affect each other, so you can write both and let the API decide which one is used."),
      h3("waterfallConfig"),
      table(
        ["Field", "Type", "Default", "Description"],
        [
          ["`minColumnWidth`", "`number`", "`200`", "Minimum column width (px), used to derive the column count."],
          ["`maxColumnWidth`", "`number`", "–", "Maximum column width (px)."],
          ["`columns`", "`number`", "–", "Set the column count directly instead of deriving it from the width."],
          ["`gap`", "`number`", "`16`", "Space between items (px)."],
          ["`buffer`", "`number`", "`1500`", "Extra distance above and below the viewport that is still rendered (px)."],
        ],
      ),
      p("The column count rules are in [columns and column width of VirtualMasonry](@/virtual-masonry/#columns)."),
      h3("equalHeightConfig"),
      table(
        ["Field", "Type", "Default", "Description"],
        [
          ["`targetRowHeight`", "`number`", "`245`", "Target row height; decides how many images go into a row."],
          ["`sizeRange`", "`[number, number]`", "`[230, 260]`", "Allowed row height range."],
          ["`maxItemWidth`", "`number`", "`975`", "Maximum width of a single item."],
          ["`maxStretchRatio`", "`number`", "`1.5`", "How much a row is willing to enlarge its images."],
          ["`gap`", "`number`", "`8`", "Space between items (px)."],
          ["`buffer`", "`number`", "`1500`", "Extra distance around the viewport that is still rendered (px)."],
        ],
      ),
      p("How the fields work together is explained in [the options of FullWidthEqualHeightMasonry](@/equal-height/#params). Keep `sizeRange` outside the component or in `useMemo`, so a new array on every render does not make every row recalculate."),
      note("Only the fields above are exposed. `loadMoreThreshold`, `initialItems` and `initialHasMore` are not available through `DynamicMasonryView`; the inner components use their own defaults (800 for the waterfall, 500 for the equal-height layout). Use the individual component directly when you need them."),

      h2("props", "Props"),
      table(
        ["Prop", "Type", "Default", "Description"],
        [
          ["`isMasonry`", "`boolean`", "–", "Controlled mode. `true` is the waterfall, `false` the equal-height layout."],
          ["`defaultIsMasonry`", "`boolean`", "`true`", "Used when `loadData` does not return `isMasonry` (or no `loadData` is passed)."],
          ["`loadData`", "`LoadDataFn`", "–", "`(page, pageSize) => Promise<{ data, hasMore, isMasonry? }>`."],
          ["`renderItem`", "`(item, index, isMasonry) => ReactNode`", "required", "Render function; the last argument says which layout is in use."],
          ["`waterfallConfig`", "`{ minColumnWidth, maxColumnWidth, columns, gap, buffer }`", "`{}`", "Passed to [VirtualMasonry](@/virtual-masonry/)."],
          ["`equalHeightConfig`", "`{ targetRowHeight, sizeRange, maxItemWidth, maxStretchRatio, gap, buffer }`", "`{}`", "Passed to [FullWidthEqualHeightMasonry](@/equal-height/)."],
          ["`pageSize`", "`number`", "`50`", "Number of items requested per page."],
          ["`mapSize`", "`(raw) => { width, height }`", "–", "Map your data to a width and height."],
          ["`renderInitialLoader`", "`() => ReactNode`", "blank block", "Shown until the layout type is known."],
          ["`onLayoutTypeLoaded`", "`(isMasonry: boolean) => void`", "–", "Called once the layout type is known."],
          ["`onError`", "`(error: Error) => void`", "–", "Called when the first request (the one that decides the layout) fails."],
          ["`enableAnimation`", "`boolean`", "`true`", "Reserved, currently has no effect."],
        ],
      ),

      h2("states", "Loading states and errors"),
      h3("Before the layout is known"),
      p("In uncontrolled mode the component has to wait for page 1 to know which layout to use. During that time it renders the return value of `renderInitialLoader()`, or a blank block when you pass nothing. A skeleton looks like this:"),
      code(`<DynamicMasonryView
  loadData={loadData}
  renderInitialLoader={() => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ height: 160 + (i % 3) * 40, borderRadius: 12, background: "rgba(128,128,128,0.15)" }} />
      ))}
    </div>
  )}
  renderItem={renderCard}
/>`),
      h3("onLayoutTypeLoaded and onError"),
      ul([
        "`onLayoutTypeLoaded(isMasonry)`: called once the layout type is known, whether it came from the prop, the API response or the default. Use it to keep a toggle in your own UI in sync.",
        "`onError(error)`: called **only** when the first request, the one that decides the layout, fails; the default layout is used afterwards.",
        "Failures of later pages are handled by the inner component: it logs the error to the console and stops automatic paging, and it does **not** call your `onError`. To notice those failures, `try/catch` inside your own `loadData`.",
      ]),

      h2("ssr", "Server rendering"),
      p("This component only works on the client: the list itself can only be laid out once the browser has measured the container width. In uncontrolled mode it also waits for page 1, so the server-rendered HTML contains no cards. To avoid the blank phase after mounting, decide the layout on the server and pass it as `isMasonry`, which skips the wait for the layout type. When search engines must index the content, render a crawlable list separately, see [Next.js and SSR](@/guides/nextjs-ssr/)."),

      h2("exports", "Exported types"),
      code(`import { DynamicMasonryView, ViewType } from "react-hybrid-masonry";
import type { DynamicMasonryViewProps, LoadDataFn } from "react-hybrid-masonry";

// ViewType is an enum: ViewType.WATERFALL = 1, ViewType.EQUAL_HEIGHT = 2
// The component itself does not read it; it only helps you map a number from your API to isMasonry:
const isMasonry = json.viewType === ViewType.WATERFALL;`),
      note("`loadData` is typed as `LoadDataFn<T>`, and only the first call (`page === 1`) may include `isMasonry`."),

      h2("faq", "FAQ"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("Related: [VirtualMasonry](@/virtual-masonry/), [FullWidthEqualHeightMasonry](@/equal-height/), [pagination and infinite scroll](@/guides/pagination/), [responsive layouts](@/guides/responsive/)."),
    ),
  };
}
