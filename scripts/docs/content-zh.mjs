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
    "组件是在自己的容器里滚动吗？",
    "不是。它跟随 window 滚动，并用 getBoundingClientRect 实时读取自身位置，请放在正常滚动的页面里使用。不支持放进带 overflow 的嵌套滚动容器里滚动。",
  ],
  [
    "元素堆在左上角或者互相重叠，是什么原因？",
    "renderItem 返回的根元素必须使用 position: absolute，并带上传入的 left、top、width、height。没有绝对定位时，浏览器会把它们当成普通块级元素排列。",
  ],
  [
    "容器有高度但里面是空的？",
    "元素位置要等测量到容器宽度后才会计算，所以被隐藏（display: none）或宽度为 0 的容器不会渲染任何内容。请确认父元素有真实宽度；隐藏的标签页显示出来时，会通过 visibilitychange 和 ResizeObserver 重新测量。",
  ],
  [
    "瀑布流里出现 key 重复警告，或者卡片闪烁？",
    "VirtualMasonry 的 renderItem 第二个参数是当前已渲染元素中的序号，不是数据下标，滚动时会变化。请始终在返回的元素上设置稳定的 key，例如 key={item.id}。",
  ],
  [
    "加载到一半就不再继续了？",
    "要么 loadData 返回了 hasMore: false，要么某一页请求被 reject。请求失败时会把 hasMore 置为 false，避免无限重试。重新挂载组件（修改它的 key）即可重新开始；如果希望出错后继续翻页，请在 loadData 里自己捕获错误，并返回 hasMore: true 的空页。",
  ],
  [
    "同一页被请求了两次？",
    "同一时间只会有一个请求在途，所以几乎都是开发环境下 React StrictMode 把副作用执行了两次，或者组件被挂载了两次。在 DynamicMasonryView 里，用来判断布局类型的第 1 页响应会被缓存复用，内部布局不会再请求第 1 页。",
  ],
  [
    "接口返回变了，布局却没有切换？",
    "非受控模式下，布局类型只会在第一次 loadData 时读取一次。要在运行时切换请使用 isMasonry 属性；切换会重新挂载当前布局，并从第 1 页重新加载。",
  ],
  [
    "在 Next.js App Router 里报 hooks 相关错误？",
    "这些组件使用了 React hooks，并没有带 use client 指令。请在以 use client 开头的文件里引入它们。",
  ],
  [
    "enableAnimation 有用吗？",
    "目前没有。它是为了让几个组件的 props 保持一致而保留的参数，元素定位时没有过渡动画。",
  ],
  [
    "哪些字段会被当作元素尺寸？",
    "依次读取 width/height、w/h、imgW/imgH；字段名不同时用 mapSize 映射。没有有效尺寸的元素无法布局，请确保每条数据都有。",
  ],
];

export default {
  lang: "zh",
  htmlLang: "zh-CN",
  ogLocale: "zh_CN",
  siteName: "React Hybrid Masonry",
  docsName: "文档",
  ui: {
    demo: "在线演示",
    switchLang: "English",
    siteNav: "站点",
    docsNav: "文档目录",
    pager: "翻页",
    prev: "上一页",
    next: "下一页",
    docs: "文档",
    search: "搜索",
    searchPlaceholder: "搜索文档",
    noResults: "没有找到与以下内容相关的结果：",
    onThisPage: "本页目录",
    theme: "切换深浅色",
    menu: "菜单",
    copy: "复制",
    copied: "已复制",
    footerNote: "基于 MIT 协议开源。",
  },
  groups: [
    { title: "开始使用", pages: [""] },
    { title: "组件", pages: ["virtual-masonry", "equal-height", "dynamic-view"] },
    {
      title: "指南",
      pages: [
        "guides/pagination",
        "guides/nextjs-ssr",
        "guides/responsive",
        "guides/performance",
        "guides/equal-height-algorithm",
      ],
    },
    { title: "参考", pages: ["faq", "changelog"] },
  ],
  pages: {
    "": {
      nav: "简介",
      title: "React Hybrid Masonry 文档 – 虚拟滚动瀑布流与等高布局",
      description:
        "react-hybrid-masonry 使用文档：零依赖的 React 虚拟滚动瀑布流（Masonry）与 Google Photos 风格等高布局组件库，支持无限滚动和接口动态切换布局。",
      h1: "React Hybrid Masonry 使用文档",
      lead: "零依赖的 React 组件库，提供虚拟滚动的**瀑布流（Masonry）**与**等高布局**，支持无限滚动，并可由接口决定使用哪一种布局。",
      body: join(
        h2("features", "特性"),
        ul([
          "**虚拟滚动**：只渲染视口附近的元素，超长列表依然流畅。",
          "**瀑布流布局**：Pinterest 风格，每个元素放进当前最短的一列。",
          "**等高布局**：Google Photos 风格，每行高度一致，保持每张图片的原始比例。",
          "**动态布局**：由第一次接口返回的数据决定使用哪种布局。",
          "**无限滚动**：基于 `IntersectionObserver`，预加载距离可配置，同一时间只会有一个翻页请求在途。",
          "**响应式**：监听容器宽度，宽度变化时重新计算列和行。",
          "TypeScript 编写，只对 React 16.8 及以上有 peer 依赖，没有其他依赖。",
        ]),
        h2("install", "安装"),
        code(`npm install react-hybrid-masonry
# 或
yarn add react-hybrid-masonry
# 或
pnpm add react-hybrid-masonry`),
        h2("quick-start", "快速开始"),
        p("三个组件的约定一致：`loadData(page, pageSize)` 返回 `{ data, hasMore }`，每条数据都有宽和高，`renderItem` 把元素画在库算好的位置上。"),
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
        h2("choose", "该用哪个组件？"),
        table(
          ["组件", "布局", "适用场景"],
          [
            ["[VirtualMasonry](@/virtual-masonry/)", "瀑布流：列宽相同，元素高度各异", "图片墙、商品流、高度不一的卡片"],
            ["[FullWidthEqualHeightMasonry](@/equal-height/)", "每行等高并铺满整行宽度", "相册、时间线、以图片为主的搜索结果"],
            ["[DynamicMasonryView](@/dynamic-view/)", "运行时在两者之间选择", "由后端或内容决定列表展示形式的场景"],
          ],
        ),
        h2("data-contract", "数据约定"),
        p("组件需要在图片加载之前就知道每个元素的尺寸，才能算出它的位置。尺寸依次读取第一组存在的字段：`width`/`height`、`w`/`h`、`imgW`/`imgH`。其他结构请用 `mapSize`："),
        code(`<VirtualMasonry
  mapSize={(raw) => ({ width: raw.cover.w, height: raw.cover.h })}
  /* ... */
/>`),
        p("传给 `renderItem` 的每个 item 是你的原始对象，加上计算出的 `x`、`y`、`width`、`height`（以及 `widthRatio`）。你自己的字段，如 `url`、`title`，都会保留。"),
        h2("render-contract", "渲染约定"),
        ul([
          "`renderItem` 返回的根元素必须使用**绝对定位**，并带上传入的 `left`、`top`、`width`、`height`。",
          "在这个元素上设置稳定的 `key`（如 `item.id`）。瀑布流布局里 `index` 参数只统计当前已渲染的元素，滚动时会变化。",
          "组件跟随 **window** 滚动，不是在内部容器里滚动，详见[常见问题](@/faq/)。",
        ]),
        note("下一步：阅读你所选组件的页面，或者直接看[分页与无限滚动](@/guides/pagination/)。"),
      ),
    },

    "virtual-masonry": {
      nav: "VirtualMasonry",
      title: "VirtualMasonry – React 虚拟滚动瀑布流（Masonry）布局",
      description:
        "VirtualMasonry API 参考：React 瀑布流（Pinterest 风格）布局，支持虚拟滚动、无限加载、固定或按宽度推算列数，以及适合 SSR 的初始数据。",
      h1: "VirtualMasonry",
      lead: "Pinterest 风格的瀑布流布局：列宽相同，元素保持宽高比，放进当前最短的一列。只渲染视口附近的元素。",
      body: join(
        h2("usage", "用法"),
        code(`import { VirtualMasonry } from "react-hybrid-masonry";

<VirtualMasonry
  loadData={loadData}
  pageSize={30}
  minColumnWidth={200}
  maxColumnWidth={350}
  gap={16}
  renderItem={(item) => (
    ${card.replace(/\n/g, "\n    ")}
  )}
/>`),
        h2("props", "属性"),
        table(
          ["属性", "类型", "默认值", "说明"],
          [
            ["`loadData`", "`(page, pageSize) => Promise<{ data: any[]; hasMore: boolean }>`", "–", "加载一页数据，页码从 1 开始。不传则组件保持为空。"],
            ["`renderItem`", "`(item, index) => ReactNode`", "必填", "渲染单个元素。`index` 是它在**当前已渲染**元素中的序号。"],
            ["`pageSize`", "`number`", "`50`", "每页请求的数据量。"],
            ["`minColumnWidth`", "`number`", "`200`", "最小列宽（px）。推算出的列数不会让列宽比它更窄。"],
            ["`maxColumnWidth`", "`number`", "–", "最大列宽（px）。"],
            ["`columns`", "`number`", "–", "直接指定列数，不再按宽度推算。"],
            ["`gap`", "`number`", "`16`", "元素之间的水平和垂直间距（px）。"],
            ["`buffer`", "`number`", "`1500`", "视口上下仍会渲染的缓冲距离（px）。"],
            ["`loadMoreThreshold`", "`number`", "`800`", "距离底部多远（px）时开始请求下一页。"],
            ["`mapSize`", "`(raw) => { width, height }`", "–", "把你的数据映射成宽高，见[数据约定](@/#data-contract)。"],
            ["`initialItems`", "`any[]`", "–", "已经拿到的第一页数据（如 SSR 预取）。传入后不会再请求第 1 页，下一次从第 2 页开始。"],
            ["`initialHasMore`", "`boolean`", "`true`", "配合 `initialItems`，表示首屏之后是否还有更多数据。"],
            ["`enableAnimation`", "`boolean`", "`true`", "预留参数，目前没有效果。"],
          ],
        ),
        h2("columns", "列数如何确定"),
        ol([
          "设置了 `columns` 就直接使用它。",
          "否则使用 `floor(容器宽度 / minColumnWidth)` 列，至少 1 列。",
          "如果设置了 `maxColumnWidth`，而列宽超过了它，就逐列增加（最多 20 列）直到不超过；但如果再加一列会让列宽小于 `minColumnWidth`，就**不再增加**。两个限制无法同时满足时，以最小列宽为准。",
        ]),
        p("列宽为 `(容器宽度 - gap * (列数 - 1)) / 列数`，并以 `maxColumnWidth` 为上限。上限生效时，网格是**靠左排列**的，右侧留空。"),
        p("元素高度为 `列宽 * (原始高度 / 原始宽度)`，放进当前最矮的那一列。"),
        h2("examples", "示例"),
        h3("固定列数"),
        code(`<VirtualMasonry columns={4} gap={12} loadData={loadData} renderItem={renderCard} />`),
        p("按断点选择列数可以用一个小 hook，见[响应式布局](@/guides/responsive/)。"),
        h3("从已有数据开始"),
        code(`<VirtualMasonry
  initialItems={firstPage.items}
  initialHasMore={firstPage.hasMore}
  loadData={loadData} // 第一次调用请求的是第 2 页
  renderItem={renderCard}
/>`),
        h3("尺寸在其他字段里"),
        code(`<VirtualMasonry
  mapSize={(raw) => ({ width: raw.imgW, height: raw.imgH })}
  loadData={loadData}
  renderItem={renderCard}
/>`),
        note("相关：[分页与无限滚动](@/guides/pagination/)、[性能调优](@/guides/performance/)。"),
      ),
    },

    "equal-height": {
      nav: "FullWidthEqualHeightMasonry",
      title: "FullWidthEqualHeightMasonry – React 等高（Justified）图片布局",
      description:
        "FullWidthEqualHeightMasonry API 参考：Google Photos 风格的 React 等高布局，每行高度一致并铺满容器宽度，支持虚拟滚动和无限加载。",
      h1: "FullWidthEqualHeightMasonry",
      lead: "Google Photos 风格布局：图片保持宽高比，每一行高度相同，并按容器宽度精确拉伸或收缩来铺满。",
      body: join(
        h2("usage", "用法"),
        code(`import { FullWidthEqualHeightMasonry } from "react-hybrid-masonry";

<FullWidthEqualHeightMasonry
  loadData={loadData}
  pageSize={30}
  targetRowHeight={245}
  sizeRange={[230, 260]}
  maxItemWidth={975}
  gap={8}
  renderItem={(item) => (
    ${card.replace(/\n/g, "\n    ")}
  )}
/>`),
        h2("props", "属性"),
        table(
          ["属性", "类型", "默认值", "说明"],
          [
            ["`loadData`", "`(page, pageSize) => Promise<{ data: any[]; hasMore: boolean }>`", "–", "加载一页数据，页码从 1 开始。"],
            ["`renderItem`", "`(item, index) => ReactNode`", "必填", "渲染单个已定位的元素。`index` 是它在全部已加载数据中的序号。"],
            ["`pageSize`", "`number`", "`50`", "每页请求的数据量。"],
            ["`targetRowHeight`", "`number`", "`245`", "目标行高，实际行高会在 `sizeRange` 内调整。"],
            ["`sizeRange`", "`[number, number]`", "`[230, 260]`", "允许的行高范围 `[最小, 最大]`。"],
            ["`maxItemWidth`", "`number`", "`975`", "单个元素的最大宽度。"],
            ["`maxStretchRatio`", "`number`", "`1.5`", "一行会不断加入新图片，直到填满整行所需的放大倍数不超过该值；缩小不设上限。"],
            ["`gap`", "`number`", "`8`", "元素之间的水平和垂直间距（px）。"],
            ["`buffer`", "`number`", "`1500`", "视口周围仍会渲染的缓冲距离（px）。"],
            ["`loadMoreThreshold`", "`number`", "`500`", "距离底部多远（px）时开始请求下一页。"],
            ["`mapSize`", "`(raw) => { width, height }`", "–", "把你的数据映射成宽高。"],
            ["`enableAnimation`", "`boolean`", "`true`", "预留参数，目前没有效果。"],
          ],
        ),
        h2("behaviour", "行为说明"),
        ul([
          "行是贪心地拼出来的：只要填满当前这一行所需的放大倍数超过 `maxStretchRatio`，就继续加入图片；需要缩小时则不限制缩小的幅度。",
          "行高随后被限制在 `sizeRange` 内，宽度再按比例分配，使整行刚好结束在容器边缘，不会把舍入误差留给最后一张图。",
          "**最后一行不会被拉伸**，保持自然比例（高度最多为 `targetRowHeight`），图片很少时不会被放大。下一页到来后，这一行会重新计算。",
          "任何元素都不会比 `maxItemWidth` 更宽，所以很宽的全景图不会占满整行。",
        ]),
        p("完整流程见[等高布局算法详解](@/guides/equal-height-algorithm/)。"),
        h2("tuning", "调参建议"),
        table(
          ["目标", "做法"],
          [
            ["图片更大，每行更少", "提高 `targetRowHeight` 和 `sizeRange`，例如 `320` 和 `[300, 360]`。"],
            ["对齐更严格", "缩小 `sizeRange`；此时每行靠选择不同的图片数量来铺满，而不是靠缩放。"],
            ["避免行被明显放大", "把 `maxStretchRatio` 降到 `1.2` 左右；一行会放进更多图片后才结束。"],
            ["避免超大的全景图", "降低 `maxItemWidth`。"],
          ],
        ),
        note("相关：[响应式布局](@/guides/responsive/)、[分页与无限滚动](@/guides/pagination/)。"),
      ),
    },

    "dynamic-view": {
      nav: "DynamicMasonryView",
      title: "DynamicMasonryView – 在 React 中动态切换瀑布流与等高布局",
      description:
        "DynamicMasonryView API 参考：运行时在瀑布流与等高布局之间选择，可由第一次接口返回或受控属性决定，带首页缓存和错误处理。",
      h1: "DynamicMasonryView",
      lead: "一个组件，两种布局。布局由属性、第一次接口返回或默认值决定。",
      body: join(
        h2("modes", "三种确定布局的方式"),
        h3("1. 受控"),
        code(`<DynamicMasonryView
  isMasonry={useWaterfall} // true = 瀑布流，false = 等高布局
  loadData={loadData}
  renderItem={(item, index, isMasonry) => /* ... */ null}
/>`),
        p("该属性优先级最高。它变化时，当前布局会被重新挂载，并从第 1 页重新加载。"),
        h3("2. 由第一次接口返回决定"),
        code(`<DynamicMasonryView
  loadData={async (page, pageSize) => {
    const res = await fetch("/api/content?page=" + page + "&size=" + pageSize);
    const json = await res.json();
    return page === 1
      ? { data: json.items, hasMore: json.hasMore, isMasonry: json.layoutType === "waterfall" }
      : { data: json.items, hasMore: json.hasMore };
  }}
  renderItem={(item, index, isMasonry) => /* ... */ null}
/>`),
        p("组件挂载时调用一次 `loadData(1, pageSize)`，从结果里读取 `isMasonry`，并缓存这第一页数据，所以选好的布局会立刻展示它，第 1 页不会被请求第二次。布局类型**只读取一次**，后续页不需要再返回。"),
        h3("3. 默认值"),
        p("如果 `loadData` 没有返回 `isMasonry`，则使用 `defaultIsMasonry`（默认 `true`）。如果第一次请求失败，会调用 `onError` 并使用默认布局。"),
        h2("props", "属性"),
        table(
          ["属性", "类型", "默认值", "说明"],
          [
            ["`isMasonry`", "`boolean`", "–", "受控模式。`true` 为瀑布流，`false` 为等高布局。"],
            ["`defaultIsMasonry`", "`boolean`", "`true`", "`loadData` 没有返回 `isMasonry` 时使用。"],
            ["`loadData`", "`LoadDataFn`", "–", "`(page, pageSize) => Promise<{ data, hasMore, isMasonry? }>`。"],
            ["`renderItem`", "`(item, index, isMasonry) => ReactNode`", "必填", "渲染函数，最后一个参数表示当前使用的布局。"],
            ["`waterfallConfig`", "`{ minColumnWidth, maxColumnWidth, columns, gap, buffer }`", "`{}`", "传给 [VirtualMasonry](@/virtual-masonry/)。"],
            ["`equalHeightConfig`", "`{ targetRowHeight, sizeRange, maxItemWidth, maxStretchRatio, gap, buffer }`", "`{}`", "传给 [FullWidthEqualHeightMasonry](@/equal-height/)。"],
            ["`pageSize`", "`number`", "`50`", "每页请求的数据量。"],
            ["`mapSize`", "`(raw) => { width, height }`", "–", "把你的数据映射成宽高。"],
            ["`renderInitialLoader`", "`() => ReactNode`", "空白块", "确定布局类型之前显示的内容。"],
            ["`onLayoutTypeLoaded`", "`(isMasonry: boolean) => void`", "–", "布局类型确定后调用。"],
            ["`onError`", "`(error: Error) => void`", "–", "第一次请求失败时调用。"],
            ["`enableAnimation`", "`boolean`", "`true`", "预留参数，目前没有效果。"],
          ],
        ),
        h2("exports", "导出的类型"),
        code(`import {
  DynamicMasonryView,
  ViewType, // 枚举：ViewType.Waterfall = 1，ViewType.EqualHeight = 2
} from "react-hybrid-masonry";
import type { DynamicMasonryViewProps, LoadDataFn } from "react-hybrid-masonry";`),
        note("`loadData` 的类型是 `LoadDataFn<T>`，只有第一次调用可以带上 `isMasonry`。相关：[分页与无限滚动](@/guides/pagination/)。"),
      ),
    },

    "guides/pagination": {
      nav: "分页与无限滚动",
      title: "react-hybrid-masonry 的分页与无限滚动",
      description:
        "react-hybrid-masonry 中 loadData、hasMore、loadMoreThreshold 与请求并发控制的工作方式，失败时如何处理，以及筛选条件变化时如何重置列表。",
      h1: "分页与无限滚动",
      lead: "页是如何被请求的、下一页何时开始、出错时会怎样，以及如何重新开始。",
      body: join(
        h2("contract", "loadData 约定"),
        code(`type LoadData = (
  page: number, // 从 1 开始，每成功请求一次加 1
  pageSize: number,
) => Promise<{ data: any[]; hasMore: boolean }>;`),
        p("组件会保存所有已加载的元素。`loadData` 只需返回新的一页，库会把它追加进去。页码由组件内部维护，不需要你自己计数。"),
        h2("trigger", "下一页何时开始"),
        p("布局底部有一个 1px 的标记元素，一个 `rootMargin` 为 `loadMoreThreshold` 的 `IntersectionObserver` 监听它，所以当底部距离视口还有 `loadMoreThreshold` px 时就会开始请求下一页。每一页完成后，观察器会重新订阅并立刻检查当前状态：如果标记元素仍然在视口附近（快速滚动超过了内容），就马上开始下一页。"),
        ul([
          "用户滚动很快或接口较慢时，调大 `loadMoreThreshold`。",
          "确保 `pageSize` 能填满超过一屏。页太小的话，每次响应后标记元素仍然可见，请求会一个接一个连续发出。",
        ]),
        h2("concurrency", "同一时间只有一个请求"),
        p("已有请求在进行时，不会再开始新的请求。这个判断是同步的，所以同一帧里连续触发多次也只会发出一个请求，响应也不会乱序。"),
        h2("errors", "请求失败时"),
        p("`loadData` 被 reject 时，会用 `console.error` 记录，并**停止自动翻页**（`hasMore` 变为 false），避免标记元素仍可见时，坏掉的接口被无限循环调用。你可以按需选择恢复方式："),
        ul([
          "用新的 `key` 重新挂载组件，从第 1 页重新开始。",
          "在你自己的 `loadData` 里捕获错误，完成自己的重试后，返回 `{ data: [], hasMore: true }`，让翻页继续。",
        ]),
        h2("reset", "筛选条件变化时重新开始"),
        p("组件挂载时加载第 1 页，之后不会自己重新加载。查询条件变化时，请重新挂载它："),
        code(`<VirtualMasonry
  key={JSON.stringify(filters)}
  loadData={(page, size) => fetchImages({ ...filters, page, size })}
  renderItem={renderCard}
/>`),
        h2("dynamic", "配合 DynamicMasonryView"),
        p("`DynamicMasonryView` 会自己调用第 1 页来获取布局类型，并把这份响应交给内部布局，所以第 1 页只请求一次。受控的 `isMasonry` 属性变化会重新挂载内部布局，并再次请求第 1 页。"),
        h2("keys", "去重"),
        p("库不会去除重复数据。如果你的接口可能在两页里返回同一条记录（比如用户滚动期间有新数据插入），请在 `loadData` 里自行去重，并保证 `key` 稳定且唯一。"),
      ),
    },

    "guides/nextjs-ssr": {
      nav: "Next.js 与 SSR",
      title: "在 Next.js 与服务端渲染中使用 react-hybrid-masonry",
      description:
        "如何在 Next.js App Router 与 SSR 中使用 React 瀑布流组件：use client 指令、水合安全、用 initialItems 传入预取的第一页，以及服务端 HTML 里有什么。",
      h1: "Next.js 与服务端渲染",
      lead: "哪些能在服务端运行，哪些要等到浏览器里，以及如何交接预取好的第一页。",
      body: join(
        h2("use-client", "加上 use client 指令"),
        p("这些组件使用了 React hooks，发布时没有带指令。在 Next.js App Router 中，请在客户端文件里引入它们："),
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
        h2("initial", "传入预取的第一页"),
        p("在服务端组件里取好第 1 页，作为 `initialItems` 传入。组件会直接用这份数据开始，**不会**显示加载状态，也**不会**再请求第 1 页；第一次 `loadData` 调用请求的是第 2 页。"),
        code(`// app/gallery/page.tsx（服务端组件）
import Gallery from "./Gallery";

export default async function Page() {
  const res = await fetch("https://api.example.com/images?page=1&size=30");
  const first = await res.json();
  return <Gallery first={{ items: first.items, hasMore: first.hasMore }} />;
}`),
        note("`initialItems` 只在 `VirtualMasonry` 上提供。`DynamicMasonryView` 和 `FullWidthEqualHeightMasonry` 的第一页在客户端加载。"),
        h2("hydration", "水合是安全的"),
        p("布局副作用在浏览器里使用 `useLayoutEffect`，在服务端自动降级为 `useEffect`。服务端渲染时容器宽度未知，所以两端的首次渲染都是一个空容器，不会出现水合不一致。元素位置会在挂载后、测量到宽度时立刻计算。"),
        h2("html", "服务端 HTML 里有什么"),
        p("因为位置取决于测量到的宽度，即使传了 `initialItems`，**服务端 HTML 里也不包含卡片**。如果搜索引擎必须看到这些内容，请在布局旁边额外渲染一份可被抓取的列表（比如页面里的链接，或一个 `<noscript>` 块），或者把这个图库用在不需要被收录的内容上。"),
        h2("lazy", "懒加载"),
        p("布局只在浏览器里有意义，所以可以把它从首屏 bundle 里拆出去："),
        code(`import dynamic from "next/dynamic";

const Gallery = dynamic(() => import("./Gallery"), { ssr: false });`),
        p("只有在你不需要靠 `initialItems` 来避免加载闪烁时才这样用。"),
      ),
    },

    "guides/responsive": {
      nav: "响应式布局",
      title: "React 响应式瀑布流：按断点设置列数",
      description:
        "react-hybrid-masonry 如何响应容器宽度变化，如何按断点选择列数，以及等高布局如何适配不同屏幕。",
      h1: "响应式布局",
      lead: "布局会跟随容器宽度。这里介绍如何控制它在各个尺寸下的表现。",
      body: join(
        h2("measure", "宽度如何测量"),
        p("布局容器（父元素宽度的 `100%`）的宽度会在挂载时读取一次，之后在 `ResizeObserver` 通知、窗口 `resize` 和 `visibilitychange` 时再读取。多出来的监听用于保证窗口在标签页处于后台时被缩放后，布局依然正确。只有宽度真的变化时才会更新状态。"),
        p("所以父元素必须有真实宽度。被隐藏的父元素（`display: none`）在显示出来之前什么也不会渲染。"),
        h2("waterfall", "瀑布流：按宽度限制"),
        p("设置 `minColumnWidth` 和 `maxColumnWidth` 后，列数随宽度变化，规则见[列数如何确定](@/virtual-masonry/#columns)。只需要大小合适的列时，这样就够用了。"),
        h2("breakpoints", "瀑布流：按断点指定列数"),
        p("当设计稿要求在特定宽度下是精确的列数时，请自己计算并传入 `columns`："),
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
        p("`DynamicMasonryView` 里同样可以用 `waterfallConfig={{ columns }}`。"),
        h2("equal-height", "等高布局"),
        p("等高布局没有列数的概念：每次宽度变化，各行都会按同一规则重新拼出，所以每行的图片数量会自动变化。想按断点调整观感，可以传入不同的 `targetRowHeight` 和 `sizeRange`，比如手机上用更小的行高："),
        code(`const small = window.innerWidth < 640;

<FullWidthEqualHeightMasonry
  targetRowHeight={small ? 140 : 245}
  sizeRange={small ? [120, 170] : [230, 260]}
  gap={small ? 4 : 8}
  loadData={loadData}
  renderItem={renderCard}
/>`),
        h2("cost", "缩放的代价"),
        p("每次宽度变化都会重新计算所有已加载元素的布局。几千个元素时开销很小，但不要在每一帧动画里都去修改 `gap`、`columns` 或尺寸参数。"),
      ),
    },

    "guides/performance": {
      nav: "性能调优",
      title: "React 虚拟瀑布流性能调优：buffer、阈值与图片",
      description:
        "让很长的 React 瀑布流图库保持流畅的实用建议：buffer 与 loadMoreThreshold、稳定的元素引用、图片尺寸、懒加载图片和 memo 化的卡片。",
      h1: "性能调优",
      lead: "库已经替你做了什么，以及你自己的卡片需要检查什么。",
      body: join(
        h2("built-in", "已经做了的优化"),
        ul([
          "只有视口内加上 `buffer` 范围内的元素会被挂载，其余部分在 DOM 里没有任何开销。",
          "滚动位置每个动画帧最多更新一次（`requestAnimationFrame`）。",
          "滚动过程中 item 对象保持引用不变，只有元素或容器宽度变化时才会变，所以做了 memo 的子组件不会在每次滚动时重新渲染。",
          "布局用 `useMemo` 缓存，滚动不会重新计算位置。",
        ]),
        h2("buffer", "buffer"),
        p("`buffer`（默认 `1500`）是视口上下一直保持挂载的距离。值越大，快速滚动时空白越少，但挂载的卡片和同时请求的图片也越多；值越小越省，但快速滚动时能看到加载的过程。"),
        note("调 `buffer` 和 `loadMoreThreshold` 时，请同时观察图片请求数量和你的性能评分，不要只凭画面看起来更好就一直调大。"),
        h2("threshold", "loadMoreThreshold"),
        p("`loadMoreThreshold` 越大，下一次请求开始得越早，能掩盖延迟，但会加载用户可能永远滚不到的数据。请根据接口延迟和页大小来选择。"),
        h2("images", "图片"),
        ul([
          "在数据里给每个元素真实的 `width` 和 `height`。布局在图片加载前就按它们算好，所以图片到达时不会有任何跳动。",
          "给图片加上 `loading=\"lazy\"` 和 `decoding=\"async\"`，并使用与显示尺寸接近的缩略图。",
          "使用 `object-fit: cover`，这样取整后尺寸略有差异时也不会让图片变形。",
        ]),
        code(`<img src={item.thumb} alt={item.title} width={item.width} height={item.height}
     loading="lazy" decoding="async"
     style={{ width: "100%", height: "100%", objectFit: "cover" }} />`),
        h2("cards", "卡片"),
        ul([
          "用 `React.memo` 包住卡片。因为 item 的引用是稳定的，只有它自己的数据变化时才会重新渲染。",
          "保持 `renderItem` 轻量。不要在每张卡片里创建 observer 或很重的状态，能共用就共用。",
          "始终在返回的元素上设置 `key={item.id}`。",
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
        p("选一个能填满超过一屏（包括预加载阈值）的页大小。页太小会造成请求连发，页太大会拖慢首屏。可以从 30 到 50 开始尝试。"),
      ),
    },

    "guides/equal-height-algorithm": {
      nav: "等高布局算法详解",
      title: "等高（Justified）布局算法是如何工作的",
      description:
        "逐步讲解 FullWidthEqualHeightMasonry 的行填充算法：贪心拼行、缩放比例计算、行高范围限制、不累积舍入误差的宽度分配，以及最后一行的规则。",
      h1: "等高布局算法详解",
      lead: "行填充算法的逐步说明，调 `maxStretchRatio` 和 `sizeRange` 时很有用。",
      body: join(
        h2("input", "输入"),
        p("每个元素有宽高比 `r = 宽 / 高`。以目标行高 `H` 计算，元素的理想宽度是 `r * H`。`W` 是容器宽度，`g` 是间距。"),
        h2("rows", "1. 贪心拼出一行"),
        p("用下一张图片开始一行。每次加入新图片之前，先计算让当前行铺满容器所需要的缩放比例："),
        code(`scale = (W - (n - 1) * g) / sum(r_i * H)   // 这一行有 n 张图`, "text"),
        ul([
          "如果 `scale <= maxStretchRatio`，说明这一行已经够满，结束这一行。",
          "否则加入下一张图片再判断。加入图片总会让缩放比例更接近 1。",
          "如果这一行已经需要**缩小**（`scale < 1`），同样结束，缩小不设上限。",
        ]),
        p("因为一张图几乎总是需要很大的放大才能填满一行，这条规则不需要特殊处理，就能保证每行至少有两张图。"),
        h2("height", "2. 计算并限制行高"),
        code(`rowHeight = H * scale
rowHeight = clamp(rowHeight, minHeight, maxHeight)   // sizeRange`, "text"),
        p("`sizeRange` 是一条独立的视觉密度限制，所以总是生效。限制导致无法精确铺满时，下一步仍会让整行结束在边缘。"),
        h2("widths", "3. 不累积误差地分配宽度"),
        p("每张图的理想宽度是 `r_i * rowHeight`。为了让这一行刚好结束在容器边缘，第 `i` 张图的右边缘根据理想宽度的累计占比计算，再取整："),
        code(`available = W - (n - 1) * g
rightEdge_i = (sum(ideal_0..i) / sum(ideal_all)) * available + i * g
width_i     = round(rightEdge_i - x_i)`, "text"),
        p("这样舍入误差不会累积，也不会全部压给最后一张图（那样它的比例会明显偏离真实图片）。最后每个宽度都会限制在 `maxItemWidth` 以内。"),
        h2("last", "4. 最后一行"),
        ul([
          "已加载数据末尾的那一行**不会被拉伸**，它的高度被限制在 `sizeRange[0]` 与 `targetRowHeight` 之间。",
          "如果它的自然宽度会超出容器，这一行所有图片按同一个系数等比缩小。",
          "下一页到来后，原来的最后一行变成普通行，并重新计算。",
        ]),
        h2("virtual", "5. 虚拟化"),
        p("每个元素得到 `x`、`y`、`width`、`height` 和 `originalIndex`。只有与「视口加上 `buffer`」相交的元素才会渲染，并以 `originalIndex` 作为 React 的 key。容器的 `minHeight` 是最后一行的底部。"),
        h2("tips", "调参提示"),
        ul([
          "出现很多只有 2 张图的行，说明相对容器宽度来说 `targetRowHeight` 太大：调小它，或者放宽 `sizeRange`。",
          "`sizeRange` 很窄时行会很精确，但可选的组合变少；如果行看起来参差不齐，就放宽它。",
          "降低 `maxStretchRatio` 会减少放大，提高它则会让行更早结束。",
        ]),
      ),
    },

    faq: {
      nav: "常见问题",
      title: "react-hybrid-masonry 常见问题与排查",
      description:
        "react-hybrid-masonry 常见问题的解答：容器空白、元素重叠、key 重复、加载中断、Next.js hooks 报错以及布局切换。",
      h1: "常见问题与排查",
      lead: "常见问题，以及通常的原因。",
      faq: faqs,
      body: join(...faqs.map(([q, a]) => join(h3(q), p(a)))),
    },

    changelog: {
      nav: "更新记录",
      title: "react-hybrid-masonry 更新记录",
      description:
        "react-hybrid-masonry 的版本更新：新增 columns 与 initialItems 参数、请求处理修复、重写的等高布局行算法等。",
      h1: "更新记录",
      lead: "库的重要变更。",
      body: join(
        h2("unreleased", "未发布"),
        h3("新增"),
        ul([
          "`VirtualMasonry`：新增 `columns` 固定列数，以及 `initialItems`、`initialHasMore`，可从预取好的第一页开始。",
          "`DynamicMasonryView`：新增 `waterfallConfig.columns`。",
          "支持服务端渲染：布局副作用在服务端降级为 `useEffect`。",
        ]),
        h3("变更"),
        ul([
          "等高布局：新的拼行规则由 `maxStretchRatio` 驱动；宽度按累计比例分配，舍入误差不再落到最后一张图上；最后一行溢出时统一等比缩小。",
          "瀑布流：推算出的列数不会让列宽小于 `minColumnWidth`。",
        ]),
        h3("修复"),
        ul([
          "快速滚动时可能同时发出两个翻页请求，现在用同步判断保证只有一个请求在途。",
          "请求失败不再无限重试，翻页会停止，直到重新挂载组件。",
          "窗口在后台标签页被缩放后，容器宽度可能一直是旧值；现在 `resize` 与 `visibilitychange` 会重新测量。",
          "等高布局的滚动位置不再使用缓存的 `offsetTop`，改为读取 `getBoundingClientRect`，列表上方内容高度变化也不会出错。",
          "滚动时可见元素保持引用稳定，做了 memo 的卡片不再在每次滚动事件里重新渲染。",
        ]),
        h2("1.0.1", "1.0.1"),
        p("[npm](https://www.npmjs.com/package/react-hybrid-masonry) 上的当前版本：`VirtualMasonry`、`FullWidthEqualHeightMasonry` 和 `DynamicMasonryView`。"),
      ),
    },
  },
};
