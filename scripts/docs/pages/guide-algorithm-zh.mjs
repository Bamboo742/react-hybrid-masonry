import { code, figure, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { SAMPLE_SIZES, layoutSvg, rowSteps } from "../diagram.mjs";

const faqs = [
  [
    "为什么不用全局最优的划分算法？",
    "有些库用线性划分（动态规划）为全部图片求一个整体最优的分行方案。它的缺点是追加新数据会改变前面已经排好的行，滚动时内容会跳动。这里使用的贪心算法按顺序一行一行地拼，追加数据只会影响最后一行，已经看到的内容不会移动，而且计算量和图片数成正比，很适合无限滚动。",
  ],
  [
    "一行里只有一张图是怎么回事？",
    "这张图非常宽（例如全景图），单独放一张时，铺满整行所需的放大倍数就已经不超过 maxStretchRatio，所以这一行到此为止。它的宽度还会被限制在 maxItemWidth 以内，如果这个上限小于容器宽度，这一行右侧就会留白。",
  ],
  [
    "为什么有的行比别的行略高或略矮？",
    "每一行都要铺满容器宽度，所需的行高随这一行里图片的比例而变化。它被限制在 sizeRange 内，所以行高会在这个区间里变化。把 sizeRange 收窄，行高会更一致，但被夹住的行里图片比例的偏差会更大。",
  ],
  [
    "宽度之和为什么总是刚好等于容器宽度？",
    "因为每张图的右边缘是按累计占比直接算出来的，不是把每张图的宽度各自取整后相加。最后一张图的右边缘恰好落在容器边缘，所以舍入误差不会累积。",
  ],
];

export default function algorithmGuide() {
  const opts = { width: 640, targetRowHeight: 90, gap: 6, sizeRange: [80, 100], maxStretchRatio: 1.5 };
  const demo = SAMPLE_SIZES.slice(0, 16);
  const row = rowSteps(SAMPLE_SIZES, opts);
  const whole = layoutSvg(demo, opts, "等高布局排版结果：每行右边缘对齐，最后一行保持自然比例");

  const stepTable = table(
    ["已加入的图片", "行宽之和 `Σ r·H`", "可用宽度 `W - (n-1)·g`", "缩放比例 `scale`", "判断"],
    row.steps.map((s) => [
      s.labels.join("、"),
      s.rowWidth.toFixed(0),
      String(s.available),
      s.scale.toFixed(2),
      s.stop ? `**${s.scale.toFixed(2)} ≤ ${opts.maxStretchRatio}：结束这一行**` : `${s.scale.toFixed(2)} > ${opts.maxStretchRatio}：再加一张`,
    ]),
  );

  const widthTable = table(
    ["图片", "理想宽度 `r·rowHeight`", "右边缘", "最终宽度"],
    row.widths.map((w) => [w.label, w.ideal.toFixed(1), w.rightEdge.toFixed(1), `${w.width}`]),
  );

  return {
    nav: "等高布局算法详解",
    title: "等高（Justified）布局算法是如何工作的：逐步详解与实例",
    description:
      "用真实数字逐步讲解 FullWidthEqualHeightMasonry 的行填充算法：贪心拼行、缩放比例计算、行高范围限制、不累积舍入误差的宽度分配、最后一行的规则、边界情况与伪代码。",
    h1: "等高布局算法详解",
    lead: "行填充算法的逐步说明，附一个用真实数字算出的例子，调 `maxStretchRatio` 和 `sizeRange` 时很有用。",
    faq: faqs,
    body: join(
      h2("input", "输入"),
      p("每个元素有宽高比 `r = 宽 / 高`。以目标行高 `H` 计算，元素的理想宽度是 `r * H`。下面是用到的符号："),
      table(
        ["符号", "含义", "对应的属性"],
        [
          ["`W`", "容器宽度", "自动测量"],
          ["`g`", "元素间距", "`gap`"],
          ["`H`", "目标行高", "`targetRowHeight`"],
          ["`[minH, maxH]`", "允许的行高范围", "`sizeRange`"],
          ["`maxStretch`", "一行最多愿意放大的倍数", "`maxStretchRatio`"],
          ["`maxW`", "单张图的最大宽度", "`maxItemWidth`"],
        ],
      ),

      h2("example", "一个完整的例子"),
      p(`下面的数字都是用组件同样的规则算出来的。设定：容器宽 \`W = ${opts.width}\`，间距 \`g = ${opts.gap}\`，目标行高 \`H = ${opts.targetRowHeight}\`，\`sizeRange = [${opts.sizeRange[0]}, ${opts.sizeRange[1]}]\`，\`maxStretchRatio = ${opts.maxStretchRatio}\`。图片按顺序到来，宽高比分别是 3:2、2:3、4:3、1:1、16:9……`),
      figure(
        whole.svg,
        `整个排版结果（共 ${whole.items.reduce((m, it) => Math.max(m, it.row), 0) + 1} 行）。下面逐步拆解它的第一行。`,
      ),

      h2("rows", "1. 贪心拼出一行"),
      p("用下一张图片开始一行。每次加入新图片之前，先计算让当前行铺满容器所需要的缩放比例："),
      code(`scale = (W - (n - 1) * g) / sum(r_i * H)   // 这一行有 n 张图`, "text"),
      ul([
        "如果 `scale <= maxStretchRatio`，说明这一行已经够满，结束这一行。",
        "否则加入下一张图片再判断。加入图片总会让缩放比例更接近 1。",
        "如果这一行已经需要**缩小**（`scale < 1`），同样结束，缩小不设上限。",
      ]),
      p("第一行的过程是这样的："),
      stepTable,
      p(`第一行一共拼进了 **${row.count} 张图**。因为一张图几乎总是需要很大的放大才能填满一行，这条规则不需要特殊处理，就能保证每行至少有两张图。`),

      h2("height", "2. 计算并限制行高"),
      code(`rowHeight = H * scale
rowHeight = clamp(rowHeight, minHeight, maxHeight)   // sizeRange`, "text"),
      p(`第一行：\`rowHeight = ${opts.targetRowHeight} × ${row.steps[row.steps.length - 1].scale.toFixed(2)} ≈ ${row.rawHeight.toFixed(1)}\`，在 \`[${opts.sizeRange[0]}, ${opts.sizeRange[1]}]\` 之内，所以行高就是 **${Math.round(row.rowHeight)}**。`),
      p("`sizeRange` 是一条独立的视觉密度限制，所以总是生效。限制导致无法精确铺满时，下一步仍会让整行结束在边缘。"),

      h2("widths", "3. 不累积误差地分配宽度"),
      p("每张图的理想宽度是 `r_i * rowHeight`。为了让这一行刚好结束在容器边缘，第 `i` 张图的右边缘根据理想宽度的累计占比计算，再取整："),
      code(`available = W - (n - 1) * g
rightEdge_i = (sum(ideal_0..i) / sum(ideal_all)) * available + i * g
width_i     = round(rightEdge_i - x_i)`, "text"),
      p("第一行的结果："),
      widthTable,
      p(`宽度之和 ${row.widths.map((w) => w.width).join(" + ")} 加上 ${row.count - 1} 个间距，恰好等于容器宽度 ${opts.width}。舍入误差不会累积，也不会全部压给最后一张图（那样它的比例会明显偏离真实图片）。最后每个宽度都会限制在 \`maxItemWidth\` 以内。`),
      note("**宽高比的偏差从哪里来**：行高被限制在 `sizeRange` 内之后，宽度仍然按铺满整行来分配，所以每张图的显示宽度等于 `r * 铺满所需的行高`，而显示高度是被限制后的行高。偏差倍数是「铺满所需的行高 ÷ 限制后的行高」。上面的例子里两者相等，没有偏差；行高被夹住的行才会有。`sizeRange` 越窄，夹住的行越多，偏差越明显，`object-fit: cover` 会把它变成少量裁切。"),

      h2("last", "4. 最后一行"),
      ul([
        "已加载数据末尾的那一行**不会被拉伸**，它的高度被限制在 `sizeRange[0]` 与 `targetRowHeight` 之间。",
        "如果它的自然宽度会超出容器，这一行所有图片按同一个系数等比缩小：`overflowScale = (W - 间距总和) / 理想宽度总和`。",
        "没有超出时，每张图保持自然宽度，右侧留白。",
        "下一页到来后，原来的最后一行变成普通行，并重新计算。",
      ]),

      h2("virtual", "5. 虚拟化"),
      p("每个元素得到 `x`、`y`、`width`、`height` 和 `originalIndex`。只有与「视口加上 `buffer`」相交的元素才会渲染，并以 `originalIndex` 作为 React 的 key。容器的 `minHeight` 是最后一行的底部。"),

      h2("pseudocode", "完整的伪代码"),
      code(`i = 0
y = 0
while i < items.length:
    row = [items[i]]; i += 1

    # 1. 贪心拼行
    while i < items.length:
        scale = (W - (len(row) - 1) * g) / sum(r * H for r in row)
        if scale <= maxStretch: break
        row.append(items[i]); i += 1

    isLast = (i >= items.length)

    # 2. 行高
    scale = (W - (len(row) - 1) * g) / sum(r * H for r in row)
    rowHeight = H * scale
    rowHeight = clamp(rowHeight, minH, isLast ? H : maxH)

    # 3. 宽度
    ideal = [r * rowHeight for r in row]
    if isLast:
        factor = min(1, (W - gaps) / sum(ideal))
        widths = [min(round(w * factor), maxW) for w in ideal]
    else:
        widths = rightEdges_to_widths(ideal, W, g)   # 按累计占比，不累积误差
        widths = [min(w, maxW) for w in widths]

    place(row, widths, y, round(rowHeight))
    y += round(rowHeight) + g`, "text"),

      h2("edge", "边界情况"),
      table(
        ["情况", "结果"],
        [
          ["很宽的全景图", "单独成一行，宽度被 `maxItemWidth` 截断，这一行右侧可能留白。"],
          ["图片很少，只有 1 行", "这一行就是最后一行，不拉伸，高度不超过 `targetRowHeight`。"],
          ["容器宽度为 0（被隐藏）", "不排版，输出为空；变为可见后重新计算。"],
          ["数据缺少宽高", "宽高比是 `NaN`，该行及之后的位置会错乱，请在 `mapSize` 里给兜底值。"],
          ["`sizeRange` 的上限很小", "行高被夹住，宽度仍铺满，图片比例偏差变大。"],
          ["追加新数据", "已经排好的整行不变，只有原来的最后一行重新计算。"],
        ],
      ),

      h2("complexity", "复杂度与稳定性"),
      ul([
        "整个排版是一次从前到后的扫描，每个元素只被访问常数次，复杂度和元素数成正比。1 万张图的排版在毫秒量级，见[性能调优](@/guides/performance/#layout-cost)。",
        "排版是**确定性**的：相同的数据、宽度和参数总是得到相同的结果，所以滚动时内容不会跳动。",
        "行是按顺序拼出来的，一行的结果只取决于它前面的行和自己的数据，这就是追加数据不影响前面整行的原因。",
      ]),

      h2("tips", "调参提示"),
      ul([
        "出现很多只有 2 张图的行，说明相对容器宽度来说 `targetRowHeight` 太大：调小它，或者放宽 `sizeRange`。",
        "`sizeRange` 很窄时行高很整齐，但图片比例的偏差变大；如果想要更自然的比例，就放宽它。",
        "降低 `maxStretchRatio` 会减少放大，提高它则会让行更早结束。",
        "怀疑某个设置的效果时，可以用上面的公式手算一行，再对照页面。",
      ]),

      h2("faq", "常见问题"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("相关：[FullWidthEqualHeightMasonry](@/equal-height/)、[参数如何协同工作](@/equal-height/#params)。"),
    ),
  };
}
