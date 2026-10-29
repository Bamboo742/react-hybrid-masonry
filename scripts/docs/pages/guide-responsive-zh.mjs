import { code, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { SAMPLE_SIZES, columnCount, columnWidth, computeLayout } from "../diagram.mjs";

const faqs = [
  [
    "组件放进弹窗或标签页里，打开后是空的？",
    "被隐藏的父元素（display: none）宽度为 0，组件不会渲染任何内容。元素位置要等测量到真实宽度后才计算。容器变为可见时，ResizeObserver 和 visibilitychange 会触发重新测量，所以通常显示出来就会自动排好；如果你的弹窗动画期间宽度是 0，等动画开始后再挂载组件也可以。",
  ],
  [
    "列数是按窗口宽度还是按容器宽度计算的？",
    "按容器宽度。组件测量的是它自己外层容器的宽度，所以放在侧边栏旁边、分栏布局里时，列数会依据它真正拿到的宽度来算，而不是整个窗口。只有你自己用 window.innerWidth 决定 columns 时才是按窗口宽度。",
  ],
  [
    "手机上图片太大或太小？",
    "瀑布流调 minColumnWidth（或直接用 columns），等高布局调 targetRowHeight 和 sizeRange。手机上常用的是瀑布流 2 列，等高布局 120 左右的行高。",
  ],
  [
    "触屏设备上没有 hover，悬停才出现的文字怎么办？",
    "用媒体查询 @media (hover: none) 让说明文字在触屏设备上始终显示，或者改成常驻的底部渐变条。",
  ],
  [
    "改变窗口大小时卡片会闪烁吗？",
    "不会。宽度变化时位置会被重新计算，卡片是同一批元素，只是 left、top、width、height 变了。想要平滑过渡，可以给卡片加 transition，但要注意每一帧都会重新计算全部已加载元素的位置，数据很多时建议不加。",
  ],
];

export default function responsiveGuide() {
  const widths = [320, 375, 768, 1024, 1280, 1600, 1920];
  const wf = { minColumnWidth: 160, gap: 12 };
  const wfCell = (w) => {
    const o = { ...wf, width: w };
    const cols = columnCount(o);
    return `${cols} 列 · ${Math.round(columnWidth(o, cols))}px`;
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
    nav: "响应式布局",
    title: "React 响应式瀑布流与等高布局：按断点和容器宽度设置完整指南",
    description:
      "react-hybrid-masonry 如何响应容器宽度变化，如何按窗口断点或容器宽度选择列数，等高布局在手机与桌面上的表现，以及弹窗、标签页和触屏设备的注意事项。",
    h1: "响应式布局",
    lead: "布局会跟随容器宽度。这里介绍如何控制它在各个尺寸下的表现。",
    faq: faqs,
    body: join(
      h2("measure", "宽度如何测量"),
      p("布局容器（父元素宽度的 `100%`）的宽度会在下面几个时机读取，并且只有宽度真的变化时才会更新状态："),
      table(
        ["时机", "作用"],
        [
          ["挂载时", "第一次得到宽度，之后才能排版。"],
          ["`ResizeObserver` 通知", "容器宽度变化（窗口缩放、分栏拖动、侧边栏展开）。"],
          ["窗口 `resize`", "兜底：文档保持可见时的常规缩放。"],
          ["`visibilitychange`", "兜底：标签页在后台时被缩放，重新可见的那一刻再读一次。"],
        ],
      ),
      p("所以父元素必须有真实宽度。被隐藏的父元素（`display: none`）在显示出来之前什么也不会渲染。后面两个兜底是为了在标签页处于后台时被缩放后，布局依然正确。"),

      h2("waterfall", "瀑布流：按宽度限制"),
      p("设置 `minColumnWidth` 和 `maxColumnWidth` 后，列数随宽度变化，规则见[列数与列宽](@/virtual-masonry/#columns)。只需要大小合适的列时，这样就够用了。下面是 `minColumnWidth={160}`、`gap={12}` 在各个宽度下的结果："),
      table(["容器宽度", "列数与列宽"], widths.map((w) => [`${w}px`, wfCell(w)])),

      h2("breakpoints", "瀑布流：按断点指定列数"),
      p("当设计稿要求在特定宽度下是精确的列数时，请自己计算并传入 `columns`。用 `matchMedia` 比监听 `resize` 更省，只在跨过断点时才更新："),
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
  const [columns, setColumns] = useState(2); // 服务端和首次渲染使用最小的列数
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
      p("`DynamicMasonryView` 里同样可以用 `waterfallConfig={{ columns }}`。"),

      h2("container", "按容器宽度而不是窗口宽度"),
      p("列数由窗口宽度决定，在分栏、带侧边栏的布局里会不准：窗口很宽，但图库只拿到了其中一小块。这时请测量图库自己的容器："),
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
      note("只用 `minColumnWidth` 和 `maxColumnWidth` 时不需要这个 hook：组件本来就是按它自己容器的宽度计算的。这个 hook 只在你要用 `columns` 精确指定列数时才有用。"),

      h2("equal-height", "等高布局"),
      p("等高布局没有列数的概念：每次宽度变化，各行都会按同一规则重新拼出，所以每行的图片数量会自动变化。想按断点调整观感，可以传入不同的 `targetRowHeight` 和 `sizeRange`，比如手机上用更小的行高。下面是同一组 20 张图片在不同宽度下，每行放几张（前 5 行；只有 20 张图，所以宽屏下最后一行可能很少）："),
      table(
        ["容器宽度", "默认（行高 245，间距 8）", "手机（行高 120，间距 4）"],
        [375, 768, 1280, 1920].map((w) => [
          `${w}px`,
          perRow({ width: w, ...desktopCfg }),
          perRow({ width: w, ...mobileCfg }),
        ]),
      ),
      p("同样的行高设置，窄屏上一行只能放 1 到 2 张，所以手机上通常要把行高降下来，让每行保持 2 张左右。按断点切换配置的写法："),
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

  // sizeRange 必须保持引用稳定，否则每次渲染都会重新计算全部行
  return useMemo(
    () =>
      narrow
        ? { targetRowHeight: 120, sizeRange: [100, 140] as [number, number], gap: 4 }
        : { targetRowHeight: 245, sizeRange: [230, 260] as [number, number], gap: 8 },
    [narrow],
  );
}

<FullWidthEqualHeightMasonry {...useRowConfig()} loadData={loadData} renderItem={renderCard} />`),

      h2("hidden", "弹窗、标签页与折叠面板"),
      ul([
        "容器 `display: none` 时宽度是 0，什么都不会渲染。变为可见后会重新测量并排版。",
        "标签页切换时，更稳妥的做法是只挂载当前页的列表。一直保持挂载的隐藏列表不会触发加载（不可见的元素不会进入视口），但它已加载的数据和排好的位置仍然占用内存。",
        "放进弹窗时，窗口滚动不会驱动弹窗内部的列表：组件跟随 **window** 滚动，不支持在弹窗自己的滚动容器里滚动。需要在弹窗里展示长列表时，请使用不带内部滚动的整页布局。",
      ]),

      h2("touch", "触屏设备"),
      p("触屏没有 hover。如果卡片上的标题和操作只在悬停时出现，在触屏设备上它们永远看不到。用媒体查询让它们常驻："),
      code(`.card-caption { opacity: 0; transition: opacity 0.2s; }
.card:hover .card-caption { opacity: 1; }

@media (hover: none) {
  .card-caption { opacity: 1; }
}`),

      h2("cost", "缩放的代价"),
      p("每次宽度变化都会重新计算所有已加载元素的布局。几千个元素时开销很小（见[性能调优](@/guides/performance/)里的数字），但不要在每一帧动画里都去修改 `gap`、`columns` 或尺寸参数。拖动窗口时，浏览器会很快连续触发 `ResizeObserver`，组件会按帧更新。"),

      h2("faq", "常见问题"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("相关：[VirtualMasonry 的列数与列宽](@/virtual-masonry/#columns)、[FullWidthEqualHeightMasonry 的常用配置](@/equal-height/#recipes)。"),
    ),
  };
}
