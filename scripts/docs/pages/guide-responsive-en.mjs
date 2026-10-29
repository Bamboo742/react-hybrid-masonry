import { code, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { SAMPLE_SIZES, columnCount, columnWidth, computeLayout } from "../diagram.mjs";

const faqs = [
  [
    "The component is inside a dialog or a tab and is empty when it opens.",
    "A hidden parent (display: none) has a width of 0, and the component renders nothing: positions can only be computed once a real width has been measured. When the container becomes visible, ResizeObserver and visibilitychange trigger a new measurement, so it normally lays itself out as soon as it is shown; if your dialog animation keeps the width at 0, mounting the component after the animation starts works as well.",
  ],
  [
    "Is the column count based on the window width or the container width?",
    "The container width. The component measures its own outer container, so next to a sidebar or inside a split layout the columns follow the width it really gets, not the whole window. It is only based on the window when you choose columns yourself from window.innerWidth.",
  ],
  [
    "Images are too large or too small on phones.",
    "For the waterfall adjust minColumnWidth (or use columns directly), for the equal-height layout adjust targetRowHeight and sizeRange. Common phone settings are 2 columns for the waterfall and a row height of about 120 for the equal-height layout.",
  ],
  [
    "Touch screens have no hover. What about text that only appears on hover?",
    "Use the @media (hover: none) media query to keep captions always visible on touch devices, or use a permanent gradient bar at the bottom.",
  ],
  [
    "Do cards flicker when I resize the window?",
    "No. Positions are recalculated when the width changes and the cards are the same elements, only their left, top, width and height change. You can add a transition to the cards for smoothness, but every frame recalculates the positions of all loaded items, so it is better not to with a lot of data.",
  ],
];

export default function responsiveGuide() {
  const widths = [320, 375, 768, 1024, 1280, 1600, 1920];
  const wf = { minColumnWidth: 160, gap: 12 };
  const wfCell = (w) => {
    const o = { ...wf, width: w };
    const cols = columnCount(o);
    return `${cols} cols · ${Math.round(columnWidth(o, cols))}px`;
  };

  const perRow = (opts) => {
    const { items } = computeLayout(SAMPLE_SIZES, opts);
    const counts = {};
    items.forEach((it) => (counts[it.row] = (counts[it.row] || 0) + 1));
    return Object.values(counts).slice(0, 5).join(" · ");
  };
  const desktopCfg = { targetRowHeight: 245, sizeRange: [230, 260], gap: 8 };
  const mobileCfg = { targetRowHeight: 120, sizeRange: [100, 140], gap: 4 };

  return {
    nav: "Responsive layouts",
    title: "Responsive React Masonry and Equal-Height Layouts: Breakpoints and Container Width",
    description:
      "How react-hybrid-masonry reacts to container width changes, how to choose the column count per window breakpoint or container width, how the equal-height layout behaves on phones and desktops, and notes for dialogs, tabs and touch devices.",
    h1: "Responsive layouts",
    lead: "The layout follows the container width. This page shows how to control it at each size.",
    faq: faqs,
    body: join(
      h2("measure", "How the width is measured"),
      p("The width of the layout container (`100%` of the parent's width) is read at the moments below, and state is only updated when the width really changed:"),
      table(
        ["When", "Purpose"],
        [
          ["On mount", "The first width, so the layout can be computed."],
          ["`ResizeObserver` notification", "The container width changed (window resize, dragging a split, a sidebar opening)."],
          ["Window `resize`", "Fallback: normal resizing while the document stays visible."],
          ["`visibilitychange`", "Fallback: the tab was resized in the background, read again the moment it is visible."],
        ],
      ),
      p("So the parent must have a real width. A hidden parent (`display: none`) renders nothing until it is shown. The two fallbacks make sure the layout is still correct after a tab was resized while in the background."),

      h2("waterfall", "Waterfall: limits by width"),
      p("With `minColumnWidth` and `maxColumnWidth` the column count follows the width, see [columns and column width](@/virtual-masonry/#columns). That is enough when you only need columns of a sensible size. Here is what `minColumnWidth={160}` and `gap={12}` produce at various widths:"),
      table(["Container width", "Columns and column width"], widths.map((w) => [`${w}px`, wfCell(w)])),

      h2("breakpoints", "Waterfall: columns per breakpoint"),
      p("When the design asks for an exact column count at specific widths, work it out yourself and pass `columns`. `matchMedia` is cheaper than listening to `resize`: it only updates when a breakpoint is crossed:"),
      code(`import { useEffect, useState } from "react";

const QUERIES = [
  ["(min-width: 1600px)", 6],
  ["(min-width: 1280px)", 5],
  ["(min-width: 992px)", 4],
  ["(min-width: 640px)", 3],
] as const;

function pick() {
  const hit = QUERIES.find(([query]) => window.matchMedia(query).matches);
  return hit ? hit[1] : 2;
}

function useColumns() {
  const [columns, setColumns] = useState(2); // the server and the first render use the smallest count
  useEffect(() => {
    const lists = QUERIES.map(([query]) => window.matchMedia(query));
    const update = () => setColumns(pick());
    update();
    lists.forEach((list) => list.addEventListener("change", update));
    return () => lists.forEach((list) => list.removeEventListener("change", update));
  }, []);
  return columns;
}

function Gallery() {
  const columns = useColumns();
  return <VirtualMasonry columns={columns} gap={16} loadData={loadData} renderItem={renderCard} />;
}`),
      p("With `DynamicMasonryView` the same works through `waterfallConfig={{ columns }}`."),

      h2("container", "By container width instead of window width"),
      p("Choosing columns from the window width is inaccurate in split or sidebar layouts: the window is wide but the gallery only gets a small part of it. Measure the gallery's own container instead:"),
      code(`function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

function Board() {
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const columns = width >= 1200 ? 5 : width >= 900 ? 4 : width >= 600 ? 3 : 2;

  return (
    <div ref={ref}>
      {width > 0 && <VirtualMasonry columns={columns} gap={16} loadData={loadData} renderItem={renderCard} />}
    </div>
  );
}`),
      note("You do not need this hook when you only use `minColumnWidth` and `maxColumnWidth`: the component already calculates from the width of its own container. The hook only helps when you want to set `columns` exactly."),

      h2("equal-height", "Equal-height layout"),
      p("The equal-height layout has no column count: whenever the width changes every row is built again by the same rules, so the number of images per row changes on its own. To adjust the look per breakpoint pass different `targetRowHeight` and `sizeRange` values, for example a smaller row height on phones. Here is how many images the same 20 pictures put in each row at different widths (first 5 rows; with only 20 pictures the last row can be short on wide screens):"),
      table(
        ["Container width", "Default (row height 245, gap 8)", "Phone (row height 120, gap 4)"],
        [375, 768, 1280, 1920].map((w) => [
          `${w}px`,
          perRow({ width: w, ...desktopCfg }),
          perRow({ width: w, ...mobileCfg }),
        ]),
      ),
      p("With the same row height a narrow screen fits only 1 to 2 images per row, so on phones you usually lower the row height to keep about 2 images per row. Switching the options per breakpoint:"),
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

  // sizeRange must keep a stable reference, otherwise every render recalculates all rows
  return useMemo(
    () =>
      narrow
        ? { targetRowHeight: 120, sizeRange: [100, 140] as [number, number], gap: 4 }
        : { targetRowHeight: 245, sizeRange: [230, 260] as [number, number], gap: 8 },
    [narrow],
  );
}

<FullWidthEqualHeightMasonry {...useRowConfig()} loadData={loadData} renderItem={renderCard} />`),

      h2("hidden", "Dialogs, tabs and collapsed panels"),
      ul([
        "A container with `display: none` has a width of 0 and renders nothing. Once it becomes visible it is measured and laid out again.",
        "With tabs, it is safer to mount only the list of the current tab. A hidden list that stays mounted does not trigger loading (invisible elements never enter the viewport), but its loaded data and computed positions still use memory.",
        "Inside a dialog, scrolling the dialog does not drive the list: the component follows the **window** scroll and does not support scrolling inside the dialog's own scroll container. When a long list has to be shown in a dialog, use a full-page layout without an inner scroll area.",
      ]),

      h2("touch", "Touch devices"),
      p("Touch screens have no hover. If titles and actions on a card only appear on hover, they can never be seen on touch devices. Keep them visible with a media query:"),
      code(`.card-caption { opacity: 0; transition: opacity 0.2s; }
.card:hover .card-caption { opacity: 1; }

@media (hover: none) {
  .card-caption { opacity: 1; }
}`),

      h2("cost", "What resizing costs"),
      p("Every width change recalculates the layout of all loaded items. With thousands of items that is cheap (see the numbers in [performance tuning](@/guides/performance/)), but do not change `gap`, `columns` or size options on every animation frame. While you drag the window the browser fires `ResizeObserver` quickly and the component updates frame by frame."),

      h2("faq", "FAQ"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("Related: [columns and column width in VirtualMasonry](@/virtual-masonry/#columns), [recipes for FullWidthEqualHeightMasonry](@/equal-height/#recipes)."),
    ),
  };
}
