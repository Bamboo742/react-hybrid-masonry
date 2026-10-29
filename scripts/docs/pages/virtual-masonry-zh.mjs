import { code, figure, h2, h3, join, note, ol, p, table, ul } from "../helpers.mjs";
import { SAMPLE_SIZES, columnCount, columnWidth, masonrySvg } from "../diagram.mjs";

const faqs = [
  [
    "列数和我预期的不一样？",
    "不指定 columns 时，列数由容器宽度推算：先取 floor(容器宽度 / minColumnWidth)，设置了 maxColumnWidth 时再逐列增加。第一步没有把 gap 算进去，所以实际列宽可能比 minColumnWidth 略窄（窄不到一个 gap）。需要在某个宽度精确命中设计稿的列数时，直接传 columns，按断点切换即可。",
  ],
  [
    "设置了 maxColumnWidth 之后右边有一块空白？",
    "是的。列宽被限制在 maxColumnWidth 以内时，整个网格靠左排列，右侧留空。想让它居中，就给 VirtualMasonry 外面套一层 max-width 与 margin: 0 auto 的容器，让容器宽度刚好等于网格宽度；或者改用 columns 让列宽随容器自适应。",
  ],
  [
    "为什么元素的顺序不是一行一行从左到右？",
    "瀑布流的规则是每个新元素放进当前最矮的一列，所以相邻两个元素不一定在同一行，视觉上的阅读顺序是「这一列往下，再看下一列」。如果内容必须严格按行从左到右阅读，请使用等高布局，或者普通的 CSS 网格。",
  ],
  [
    "滚动时卡片闪烁，或者控制台提示 key 重复？",
    "renderItem 的第二个参数是元素在当前已渲染元素里的序号，滚动时会变化，不能当作 key。请在返回的根元素上设置稳定的 key，例如 key={item.id}。",
  ],
  [
    "图片还没加载出来时，卡片的高度会跳动吗？",
    "不会。高度是用数据里的宽高按比例算出来的，不依赖图片下载，所以占位大小从一开始就是对的。前提是每条数据都带有准确的宽高。",
  ],
  [
    "筛选条件变化后，列表怎么重新开始？",
    "给组件换一个 key，例如 key={JSON.stringify(filters)}。组件会被重新挂载，从第 1 页重新加载。详见分页与无限滚动一页。",
  ],
  [
    "能在列表里插入广告位或占位卡片吗？",
    "可以。loadData 返回的数据里混入任何带有 width 和 height 的对象即可，它们会和其他元素一样被排进最矮的一列。在 renderItem 里按你自己的字段（例如 item.type）渲染不同的内容。",
  ],
];

export default function virtualMasonryPage() {
  const demoSizes = SAMPLE_SIZES.slice(0, 12);
  const basic = masonrySvg(
    demoSizes,
    { width: 640, columns: 4, gap: 12 },
    "瀑布流示意图：4 列，数字是元素被放入的顺序",
  );

  // 容器宽度 → 列数与列宽。用和组件相同的规则现算，不是手写的数字。
  const widths = [320, 480, 768, 1024, 1280, 1440, 1920];
  const cfgA = { minColumnWidth: 200, gap: 16 };
  const cfgB = { minColumnWidth: 200, maxColumnWidth: 210, gap: 16 };
  const cell = (cfg, width) => {
    const o = { ...cfg, width };
    const cols = columnCount(o);
    const cw = columnWidth(o, cols);
    const blank = Math.round(width - (cols * cw + (cols - 1) * o.gap));
    return `${cols} 列 · ${Math.round(cw)}px` + (blank > 1 ? `（右侧空 ${blank}px）` : "");
  };
  const widthTable = table(
    ["容器宽度", "`minColumnWidth={200}`", "`minColumnWidth={200}` `maxColumnWidth={210}`"],
    widths.map((w) => [`${w}px`, cell(cfgA, w), cell(cfgB, w)]),
  );

  return {
    nav: "VirtualMasonry",
    title: "VirtualMasonry – React 虚拟滚动瀑布流（Masonry）布局完整指南",
    description:
      "VirtualMasonry 完整参考：React 瀑布流（Pinterest 风格）布局，包含排版示意图、列数与列宽的计算规则、数据与尺寸约定、虚拟滚动与无限加载、SSR 初始数据、受控的 Core 组件和常见问题。",
    h1: "VirtualMasonry",
    lead: "Pinterest 风格的瀑布流布局：列宽相同，元素保持宽高比，放进当前最短的一列。只渲染视口附近的元素。",
    faq: faqs,
    body: join(
      h2("overview", "概览"),
      p("`VirtualMasonry` 把元素排成等宽的几列：**每个新元素放进当前最矮的一列，高度按元素自己的宽高比算出来**。列数由容器宽度决定（或者你直接指定），所以同一份数据在手机上是 2 列，在宽屏上可以是 6 列。适合图片墙、商品流和高度不一的内容卡片。"),
      figure(
        basic.svg,
        "4 列、间距 12px 的排法，数字是元素被放入的先后顺序。每个新元素都进入当时最矮的一列，所以相邻编号不一定在同一行。",
      ),
      ul([
        "列宽相同，元素高度由数据里的宽高比决定，不依赖图片下载完成。",
        "只渲染视口上下 `buffer` 范围内的元素，几千个卡片也不会拖慢页面。",
        "滚动到底部附近时自动请求下一页，同一时间只有一个请求在途。",
        "容器宽度变化时重新计算列数和位置。",
      ]),

      h2("quick-start", "快速上手"),
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
      note("每条数据在加载之前就必须带有宽和高，组件靠它们算位置。详见下面的[数据与尺寸](#data)。"),

      h2("data", "数据与尺寸"),
      h3("尺寸从哪里来"),
      p("每条数据的尺寸依次读取第一组存在的字段：`width`/`height`、`w`/`h`、`imgW`/`imgH`。字段名不同时用 `mapSize` 映射："),
      code(`<VirtualMasonry
  mapSize={(raw) => ({ width: raw.cover.w, height: raw.cover.h })}
  loadData={loadData}
  renderItem={renderCard}
/>`),
      p("布局只使用 `高度 / 宽度` 这个比例，所以单位随意：像素，或者 `4` 和 `3` 这样的比例值都可以。"),
      note("没有有效尺寸的数据无法排版：宽或高缺失会得到 `NaN`，这个元素之后所有元素的位置都会错乱。接口里可能缺字段时，请在 `mapSize` 里给一个兜底值，例如 `{ width: raw.w || 4, height: raw.h || 3 }`。"),
      h3("renderItem 收到什么"),
      p("`renderItem(item, index)` 收到的 `item` 是你的原始对象，加上下面由布局算出的字段，你自己的字段（`url`、`title` 等）都会保留："),
      table(
        ["字段", "含义"],
        [
          ["`x`", "这个元素距容器左边缘的距离（px），可能是小数。"],
          ["`y`", "这个元素距容器顶部的距离（px），可能是小数。"],
          ["`width`", "列宽（px），同一次布局里所有元素相同。**会覆盖你数据里的 `width`**。"],
          ["`height`", "按比例算出的高度（px）。**会覆盖你数据里的 `height`**。"],
          ["`widthRatio`", "原始宽高比 `width / height`。"],
        ],
      ),
      p("`index` 是这个元素在**当前已渲染元素**中的序号，滚动时会变，**不要拿它当 `key`**。需要原始尺寸时，让接口使用 `w`/`h` 这类其他字段名，再通过 `mapSize` 读取。位置和尺寸可能带小数，对像素对齐有要求时在 `renderItem` 里自己 `Math.round`。"),

      h2("render", "渲染卡片"),
      ul([
        "返回的根元素必须使用 **绝对定位**，并带上传入的 `left`、`top`、`width`、`height`。",
        "在根元素上设置稳定的 `key`，例如 `item.id`。",
        "卡片内部可以随意布局：图片、标题、按钮都行，高度由 `item.height` 决定，里面的内容要适应它。",
        "卡片里有图片时，`img` 用 `width: 100%; height: 100%; object-fit: cover`，比例和数据不一致时也不会变形。",
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
      p("布局结果在宽度不变时是稳定的，可见元素的对象引用在滚动时保持不变，所以用 `React.memo` 包住卡片可以避免滚动时重复渲染，见[性能调优](@/guides/performance/)。"),

      h2("props", "属性"),
      table(
        ["属性", "类型", "默认值", "说明"],
        [
          ["`loadData`", "`(page, pageSize) => Promise<{ data: any[]; hasMore: boolean }>`", "–", "加载一页数据，页码从 1 开始。不传则组件保持为空。"],
          ["`renderItem`", "`(item, index) => ReactNode`", "必填", "渲染单个元素。`index` 是它在**当前已渲染**元素中的序号。"],
          ["`pageSize`", "`number`", "`50`", "每页请求的数据量。"],
          ["`minColumnWidth`", "`number`", "`200`", "最小列宽（px），用来推算列数。"],
          ["`maxColumnWidth`", "`number`", "–", "最大列宽（px）。"],
          ["`columns`", "`number`", "–", "直接指定列数，不再按宽度推算。"],
          ["`gap`", "`number`", "`16`", "元素之间的水平和垂直间距（px）。"],
          ["`buffer`", "`number`", "`1500`", "视口上下仍会渲染的缓冲距离（px）。"],
          ["`loadMoreThreshold`", "`number`", "`800`", "距离底部多远（px）时开始请求下一页。"],
          ["`mapSize`", "`(raw) => { width, height }`", "–", "把你的数据映射成宽高。"],
          ["`initialItems`", "`any[]`", "–", "已经拿到的第一页数据（如 SSR 预取）。传入后不会再请求第 1 页，下一次从第 2 页开始。"],
          ["`initialHasMore`", "`boolean`", "`true`", "配合 `initialItems`，表示首屏之后是否还有更多数据。"],
          ["`enableAnimation`", "`boolean`", "`true`", "预留参数，目前没有效果。"],
        ],
      ),

      h2("columns", "列数与列宽"),
      p("列数按下面的顺序确定："),
      ol([
        "设置了 `columns` 就直接使用它，其他列宽参数不再参与计算。",
        "否则先取 `floor(容器宽度 / minColumnWidth)` 列，至少 1 列。",
        "如果设置了 `maxColumnWidth`，而列宽超过了它，就逐列增加（最多 20 列）直到不超过；但如果再加一列会让列宽小于 `minColumnWidth`，就**不再增加**。两个限制无法同时满足时，以最小列宽为准。",
      ]),
      p("列宽为 `(容器宽度 - gap * (列数 - 1)) / 列数`，并以 `maxColumnWidth` 为上限。下面是用同样的规则算出的结果（间距 16px）："),
      widthTable,
      ul([
        "**最小列宽不含间距**：第 2 步直接用容器宽度除以 `minColumnWidth`，没有把 `gap` 算进去，所以实际列宽可能略小于 `minColumnWidth`（窄不到一个 `gap`）。例如表中 1024px 是 5 列，每列 192px，而 `minColumnWidth` 是 200。",
        "**`maxColumnWidth` 生效时网格靠左排列**，右侧留空，见下面的常见问题。",
        "需要在每个宽度下精确命中设计稿的列数时，直接使用 `columns`，按断点传入。",
      ]),

      h2("rules", "排列规则"),
      ul([
        "每个元素放进**当前最矮的一列**；几列一样高时选最靠左的那一列。",
        "元素高度 = `列宽 * (原始高度 / 原始宽度)`，元素之间（水平和垂直）的间距都是 `gap`。",
        "元素一旦放好就不会再移动：新数据只会追加到各列下方，已经看到的内容不会跳动。",
        "容器的最小高度等于最高那一列的高度，所以滚动条长度始终和内容一致。",
      ]),
      note("瀑布流的阅读顺序是「沿着列往下」，不是一行一行从左到右。需要严格按行阅读时，请使用[等高布局](@/equal-height/)。"),

      h2("loading", "滚动、虚拟化与加载"),
      ul([
        "组件跟随 **window** 滚动，并用 `getBoundingClientRect` 实时读取自己的位置，所以放在页面里正常滚动即可；不支持放在带 `overflow` 的内部滚动容器里。",
        "视口上下 `buffer` 范围内的元素会被渲染，滚动位置的更新按帧节流（`requestAnimationFrame`），快速滚动也不会卡。",
        "容器底部有一个不可见的触发元素，距离视口底部 `loadMoreThreshold` 时开始请求下一页。同一时间只有一个请求在途。",
        "请求失败（`loadData` 被 reject）会停止自动翻页，避免无限重试；重新挂载组件即可重新开始，见[分页与无限滚动](@/guides/pagination/)。",
      ]),
      h3("显示加载状态"),
      p("组件本身不渲染加载指示。需要的话，在你的 `loadData` 里自己维护状态，把指示器放在列表下面即可（容器有最小高度，所以它总是在内容下方）："),
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
      {loading && <p style={{ textAlign: "center" }}>加载中…</p>}
    </>
  );
}`),

      h2("ssr", "首屏数据与 SSR"),
      p("已经在服务端（或其他地方）拿到第一页时，通过 `initialItems` 传入。组件直接用它渲染首屏，不会再请求第 1 页，下一次从第 2 页开始："),
      code(`// app/pins/page.tsx（服务端组件）
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
      loadData={(page, size) => fetchPinsFromApi(page, size)} // 第一次调用请求的是第 2 页
      renderItem={renderCard}
    />
  );
}`),
      note("元素的位置要等浏览器里测量到容器宽度才能算出来，所以服务端渲染的 HTML 里**不包含卡片**。`initialItems` 省下的是首屏的那次请求，不是首屏 HTML。需要让搜索引擎收录内容时，请另外渲染一份可抓取的列表，见 [Next.js 与 SSR](@/guides/nextjs-ssr/)。"),

      h2("recipes", "常用配置"),
      table(
        ["场景", "参数", "效果"],
        [
          ["图片墙", "`minColumnWidth={240}` `maxColumnWidth={360}` `gap={16}`", "随宽度自动增减列数，每列宽度保持在一个舒适的范围内。"],
          ["商品流", "`columns={2}`（手机）/ `columns={4}`（桌面）`gap={12}`", "列数固定，每个断点精确命中设计稿。"],
          ["紧凑信息流", "`minColumnWidth={160}` `gap={8}`", "列更窄、间距更小，一屏看到更多。"],
        ],
      ),
      h3("按断点指定列数"),
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
      p("服务端渲染时没有 `window`，这个 hook 首次渲染使用桌面的列数，挂载后再切换。更多写法见[响应式布局](@/guides/responsive/)。"),

      h2("core", "受控用法：Core 组件"),
      p("如果数据已经由 React Query、SWR、Redux 之类自己管理，可以直接使用 `VirtualMasonryCore`。它只负责排版、虚拟滚动和触底回调，不发请求，也不去重。"),
      code(`import { VirtualMasonryCore } from "react-hybrid-masonry";

function Board() {
  const { pins, hasNextPage, isFetching, fetchNextPage } = usePins(); // 你自己的数据层

  return (
    <VirtualMasonryCore
      items={pins} // 每条数据需要有 width 和 height
      hasMore={hasNextPage}
      loading={isFetching}
      onLoadMore={fetchNextPage}
      renderItem={(item) => <Card key={item.id} item={item} />}
    />
  );
}`),
      table(
        ["属性", "类型", "默认值", "说明"],
        [
          ["`items`", "`any[]`", "必填", "全部已加载的数据，每条需要有数字类型的 `width` 和 `height`。"],
          ["`renderItem`", "`(item, index) => ReactNode`", "必填", "同上。"],
          ["`onLoadMore`", "`() => void`", "–", "接近底部时调用。只有 `hasMore` 为真且 `loading` 为假时才会触发。"],
          ["`hasMore`", "`boolean`", "`true`", "是否还有更多数据。"],
          ["`loading`", "`boolean`", "`false`", "是否正在请求。请求期间设为 `true`，结束后改回 `false`，组件借此重新检查是否还要继续加载。"],
          ["`minColumnWidth`", "`number`", "`200`", "同上。"],
          ["`maxColumnWidth`", "`number`", "–", "同上。"],
          ["`columns`", "`number`", "–", "同上。"],
          ["`gap`", "`number`", "`16`", "同上。"],
          ["`buffer`", "`number`", "`300`", "注意：和上面的组件默认值（1500）不同。"],
          ["`loadMoreThreshold`", "`number`", "`500`", "注意：和上面的组件默认值（800）不同。"],
        ],
      ),
      note("`VirtualMasonry` 就是 Core 外面加了数据加载、翻页和 `mapSize` 处理，所以排版行为完全一致。Core 直接读取 `item.width` 和 `item.height`，不会调用 `mapSize`，需要时请自己先映射好。"),

      h2("faq", "常见问题"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("相关：[分页与无限滚动](@/guides/pagination/)、[响应式布局](@/guides/responsive/)、[性能调优](@/guides/performance/)、[Next.js 与 SSR](@/guides/nextjs-ssr/)。"),
    ),
  };
}
