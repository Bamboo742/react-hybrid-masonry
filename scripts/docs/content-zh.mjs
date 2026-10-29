import paginationGuide from "./pages/guide-pagination-zh.mjs";
import nextjsGuide from "./pages/guide-nextjs-zh.mjs";
import responsiveGuide from "./pages/guide-responsive-zh.mjs";
import performanceGuide from "./pages/guide-performance-zh.mjs";
import algorithmGuide from "./pages/guide-algorithm-zh.mjs";
import equalHeightPage from "./pages/equal-height-zh.mjs";
import virtualMasonryPage from "./pages/virtual-masonry-zh.mjs";
import dynamicViewPage from "./pages/dynamic-view-zh.mjs";
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
    "要么 loadData 返回了 hasMore: false，要么某一页请求被 reject。请求失败时会把 hasMore 置为 false，避免无限重试。重新挂载组件（修改它的 key）即可重新开始；如果希望出错后继续翻页，请在 loadData 里自己重试，重试成功后正常返回，全部失败再抛出错误。不要返回 hasMore: true 的空页：页码会被推进，失败的那一页会被跳过。",
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
    backToTop: "返回顶部",
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

    "virtual-masonry": virtualMasonryPage(),

    "equal-height": equalHeightPage(),

    "dynamic-view": dynamicViewPage(),

    "guides/pagination": paginationGuide(),

    "guides/nextjs-ssr": nextjsGuide(),

    "guides/responsive": responsiveGuide(),

    "guides/performance": performanceGuide(),

    "guides/equal-height-algorithm": algorithmGuide(),

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
        h2("1.1.0", "1.1.0"),
        h3("新增"),
        ul([
          "`VirtualMasonry`：新增 `columns` 固定列数，以及 `initialItems`、`initialHasMore`，可从预取好的第一页开始。",
          "`DynamicMasonryView`：新增 `waterfallConfig.columns`。",
          "支持服务端渲染：布局副作用在服务端降级为 `useEffect`。",
        ]),
        h3("变更"),
        ul([
          "等高布局：新的拼行规则由 `maxStretchRatio` 驱动；宽度按累计比例分配，舍入误差不再落到最后一张图上；最后一行溢出时统一等比缩小。",
          "瀑布流：设置了 `maxColumnWidth` 时，只在新的列宽仍不小于 `minColumnWidth` 的前提下才会增加列。",
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
        p("首个发布到 [npm](https://www.npmjs.com/package/react-hybrid-masonry) 的版本：`VirtualMasonry`、`FullWidthEqualHeightMasonry` 和 `DynamicMasonryView`。"),
      ),
    },
  },
};
