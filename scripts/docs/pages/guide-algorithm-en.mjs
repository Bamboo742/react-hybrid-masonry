import { code, figure, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { SAMPLE_SIZES, layoutSvg, rowSteps } from "../diagram.mjs";

const faqs = [
  [
    "Why not use a globally optimal partitioning algorithm?",
    "Some libraries use linear partitioning (dynamic programming) to find one optimal split of all images into rows. The drawback is that appending data changes rows that were already laid out, so content jumps while scrolling. The greedy algorithm used here builds rows one by one in order: appending data only affects the last row, content you have already seen never moves, and the work is proportional to the number of images, which suits infinite scrolling.",
  ],
  [
    "Why does a row contain only one image?",
    "That image is very wide (a panorama, for example), and on its own filling the row already needs an enlargement no greater than maxStretchRatio, so the row ends there. Its width is also capped at maxItemWidth; when that cap is below the container width the row ends up short on the right.",
  ],
  [
    "Why are some rows slightly taller or shorter than others?",
    "Every row has to fill the container width, and the height needed varies with the proportions of the images in the row. It is clamped to sizeRange, so row heights vary within that range. Narrowing sizeRange makes the heights more even, but increases the aspect ratio deviation of images in clamped rows.",
  ],
  [
    "Why do the widths always add up to exactly the container width?",
    "Because the right edge of each image is computed directly from the cumulative share, instead of rounding every width separately and adding them up. The right edge of the last image lands exactly on the container edge, so rounding errors do not accumulate.",
  ],
];

export default function algorithmGuide() {
  const opts = { width: 640, targetRowHeight: 90, gap: 6, sizeRange: [80, 100], maxStretchRatio: 1.5 };
  const demo = SAMPLE_SIZES.slice(0, 16);
  const row = rowSteps(SAMPLE_SIZES, opts);
  const whole = layoutSvg(demo, opts, "Equal-height layout result: every row ends at the right edge, the last row keeps its natural proportions");

  const stepTable = table(
    ["Images added so far", "Row width `Σ r·H`", "Available width `W - (n-1)·g`", "Scale `scale`", "Decision"],
    row.steps.map((s) => [
      s.labels.join(", "),
      s.rowWidth.toFixed(0),
      String(s.available),
      s.scale.toFixed(2),
      s.stop ? `**${s.scale.toFixed(2)} ≤ ${opts.maxStretchRatio}: end the row**` : `${s.scale.toFixed(2)} > ${opts.maxStretchRatio}: add another`,
    ]),
  );

  const widthTable = table(
    ["Image", "Ideal width `r·rowHeight`", "Right edge", "Final width"],
    row.widths.map((w) => [w.label, w.ideal.toFixed(1), w.rightEdge.toFixed(1), `${w.width}`]),
  );

  return {
    nav: "How the equal-height layout works",
    title: "How the Equal-Height (Justified) Layout Algorithm Works: Step by Step with an Example",
    description:
      "A step-by-step explanation with real numbers of the row filling algorithm of FullWidthEqualHeightMasonry: greedy row building, the scale calculation, clamping the row height, distributing widths without accumulating rounding errors, the last row, edge cases and pseudocode.",
    h1: "How the equal-height layout works",
    lead: "A step-by-step description of the row filling algorithm with an example computed from real numbers, useful when tuning `maxStretchRatio` and `sizeRange`.",
    faq: faqs,
    body: join(
      h2("input", "Input"),
      p("Each item has an aspect ratio `r = width / height`. Computed at the target row height `H`, an item's ideal width is `r * H`. These are the symbols used:"),
      table(
        ["Symbol", "Meaning", "Matching option"],
        [
          ["`W`", "Container width", "Measured automatically"],
          ["`g`", "Space between items", "`gap`"],
          ["`H`", "Target row height", "`targetRowHeight`"],
          ["`[minH, maxH]`", "Allowed row height range", "`sizeRange`"],
          ["`maxStretch`", "The largest enlargement a row accepts", "`maxStretchRatio`"],
          ["`maxW`", "Maximum width of one image", "`maxItemWidth`"],
        ],
      ),

      h2("example", "A complete example"),
      p(`All numbers below are computed with the same rules as the component. Setup: container width \`W = ${opts.width}\`, gap \`g = ${opts.gap}\`, target row height \`H = ${opts.targetRowHeight}\`, \`sizeRange = [${opts.sizeRange[0]}, ${opts.sizeRange[1]}]\`, \`maxStretchRatio = ${opts.maxStretchRatio}\`. Images arrive in order with the aspect ratios 3:2, 2:3, 4:3, 1:1, 16:9, ...`),
      figure(
        whole.svg,
        `The whole layout (${whole.rows} rows). The first row is taken apart step by step below.`,
      ),

      h2("rows", "1. Build a row greedily"),
      p("Start a row with the next image. Before adding another image, compute the scale needed to make the current row fill the container:"),
      code(`scale = (W - (n - 1) * g) / sum(r_i * H)   // n images in the row`, "text"),
      ul([
        "If `scale <= maxStretchRatio` the row is full enough and ends.",
        "Otherwise add the next image and check again. Adding an image always brings the scale closer to 1.",
        "If the row already needs to **shrink** (`scale < 1`) it ends as well; shrinking is not limited.",
      ]),
      p("This is how the first row goes:"),
      stepTable,
      p(`The first row takes **${row.count} images**. Because a single image almost always needs a very large enlargement to fill a row, this rule needs no special case to guarantee at least two images per row.`),

      h2("height", "2. Compute and clamp the row height"),
      code(`rowHeight = H * scale
rowHeight = clamp(rowHeight, minHeight, maxHeight)   // sizeRange`, "text"),
      p(`First row: \`rowHeight = ${opts.targetRowHeight} × ${row.steps[row.steps.length - 1].scale.toFixed(2)} ≈ ${row.rawHeight.toFixed(1)}\`, which is within \`[${opts.sizeRange[0]}, ${opts.sizeRange[1]}]\`, so the row height is **${Math.round(row.rowHeight)}**.`),
      p("`sizeRange` is an independent visual density limit, so it always applies. When the clamp prevents an exact fill, the next step still makes the row end at the edge."),

      h2("widths", "3. Distribute widths without accumulating error"),
      p("The ideal width of each image is `r_i * rowHeight`. To make the row end exactly at the container edge, the right edge of image `i` is computed from the cumulative share of the ideal widths and then rounded:"),
      code(`available = W - (n - 1) * g
rightEdge_i = (sum(ideal_0..i) / sum(ideal_all)) * available + i * g
width_i     = round(rightEdge_i - x_i)`, "text"),
      p("The result for the first row:"),
      widthTable,
      p(`The widths ${row.widths.map((w) => w.width).join(" + ")} plus ${row.count - 1} gaps add up to exactly the container width ${opts.width}. Rounding errors do not accumulate and are not pushed onto the last image (which would make its proportions deviate visibly from the real picture). Finally every width is limited to \`maxItemWidth\`.`),
      note("**Where the aspect ratio deviation comes from**: once the row height is clamped to `sizeRange`, widths are still distributed to fill the row, so the displayed width of an image is `r * the row height needed to fill`, while the displayed height is the clamped row height. The deviation factor is \"row height needed to fill ÷ clamped row height\". In the example above both are equal, so there is no deviation; only clamped rows have one. The narrower `sizeRange` is, the more rows get clamped and the more visible the deviation is; `object-fit: cover` turns it into a little cropping."),

      h2("last", "4. The last row"),
      ul([
        "The row at the end of the loaded data is **not stretched**; its height is limited to between `sizeRange[0]` and `targetRowHeight`.",
        "If its natural width would exceed the container, every image in the row is scaled down by the same factor: `overflowScale = (W - total gaps) / total ideal width`.",
        "When it does not exceed it, every image keeps its natural width and the right side stays empty.",
        "When the next page arrives, the former last row becomes an ordinary row and is recalculated.",
      ]),

      h2("virtual", "5. Virtualization"),
      p("Every item gets `x`, `y`, `width`, `height` and `originalIndex`. Only items that intersect \"the viewport plus `buffer`\" are rendered, with `originalIndex` as the React key. The `minHeight` of the container is the bottom of the last row."),

      h2("pseudocode", "The whole thing as pseudocode"),
      code(`i = 0
y = 0
while i < items.length:
    row = [items[i]]; i += 1

    # 1. build the row greedily
    while i < items.length:
        scale = (W - (len(row) - 1) * g) / sum(r * H for r in row)
        if scale <= maxStretch: break
        row.append(items[i]); i += 1

    isLast = (i >= items.length)

    # 2. row height
    scale = (W - (len(row) - 1) * g) / sum(r * H for r in row)
    rowHeight = H * scale
    rowHeight = clamp(rowHeight, minH, isLast ? H : maxH)

    # 3. widths
    ideal = [r * rowHeight for r in row]
    if isLast:
        factor = min(1, (W - gaps) / sum(ideal))
        widths = [min(round(w * factor), maxW) for w in ideal]
    else:
        widths = rightEdges_to_widths(ideal, W, g)   # by cumulative share, no accumulated error
        widths = [min(w, maxW) for w in widths]

    place(row, widths, y, round(rowHeight))
    y += round(rowHeight) + g`, "text"),

      h2("edge", "Edge cases"),
      table(
        ["Case", "Result"],
        [
          ["A very wide panorama", "It takes a row of its own, its width is cut to `maxItemWidth`, and the row may end up short on the right."],
          ["Very few images, only 1 row", "That row is the last row: not stretched, and no taller than `targetRowHeight`."],
          ["Container width is 0 (hidden)", "No layout, the output is empty; recalculated once it becomes visible."],
          ["Items without width and height", "The aspect ratio is `NaN` and that row and everything after it is misplaced; give `mapSize` a fallback."],
          ["A very small upper bound of `sizeRange`", "The row height is clamped while widths still fill the row, so the aspect ratio deviation grows."],
          ["Appending new data", "Rows that are already complete do not change; only the former last row is recalculated."],
        ],
      ),

      h2("complexity", "Complexity and stability"),
      ul([
        "The whole layout is one front-to-back pass in which every item is visited a constant number of times, so the cost is proportional to the number of items. Laying out 10,000 images takes milliseconds, see [performance tuning](@/guides/performance/#layout-cost).",
        "The layout is **deterministic**: the same data, width and options always give the same result, so content does not jump while scrolling.",
        "Rows are built in order and the result of a row depends only on the rows before it and its own data, which is why appending data does not affect rows that are already complete.",
      ]),

      h2("tips", "Tuning tips"),
      ul([
        "Many rows with only 2 images mean `targetRowHeight` is too large for the container width: lower it, or relax `sizeRange`.",
        "A very narrow `sizeRange` gives very even row heights but a larger aspect ratio deviation; relax it if you want more natural proportions.",
        "Lowering `maxStretchRatio` reduces enlargement, raising it makes rows end earlier.",
        "When you doubt the effect of a setting, work one row out by hand with the formulas above and compare it with the page.",
      ]),

      h2("faq", "FAQ"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("Related: [FullWidthEqualHeightMasonry](@/equal-height/), [how the options work together](@/equal-height/#params)."),
    ),
  };
}
