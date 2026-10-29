import { code, h2, h3, join, note, p, table, ul } from "../helpers.mjs";

const faqs = [
  [
    "快速滚动时看到卡片空白、图片一闪一闪地出现？",
    "buffer 偏小，或者图片请求跟不上滚动。把 buffer 调大一点让更远的内容提前挂载，同时给图片加上 loading=\"lazy\"、使用尺寸合适的缩略图。调 buffer 时请观察同时存在的卡片数和图片请求数，不要无限调大。",
  ],
  [
    "滚动时 CPU 占用高、帧率低？",
    "最常见的原因是卡片没有用 React.memo 包住：滚动时组件每一帧都可能重新调用 renderItem。先用 React Profiler 看是哪些组件在滚动时反复渲染，然后检查卡片里有没有昂贵的计算、有没有每次渲染都新建的对象或函数、有没有很重的阴影和滤镜。",
  ],
  [
    "加载了几万条之后变卡？",
    "渲染的节点数由 buffer 决定，和总条数无关。受总条数影响的只有排版计算和内存里保存的数据，参见下面的「排版计算的代价」。如果列表真的会无限增长，请考虑设置一个条数上限，或者用 Core 组件自己管理一个滑动的数据窗口。",
  ],
  [
    "改了 sizeRange 或配置对象之后整个列表闪了一下？",
    "排版是按参数重新计算的：每次传入新的 sizeRange 数组引用，都会让全部行重新计算。把它提到组件外面，或用 useMemo 保持引用稳定。",
  ],
  [
    "Lighthouse 提示图片太大？",
    "给图片使用与显示尺寸接近的缩略图。你在 renderItem 里能直接拿到卡片的显示宽度 item.width，可以据此向图片服务请求对应宽度的图。",
  ],
];

export default function performanceGuide() {
  // 估算同时存在的卡片数：渲染带高度 = 视口高度 + 上下各一个 buffer
  const viewport = 900;
  const band = (buffer) => viewport + 2 * buffer;
  const wfCards = (buffer) => Math.round((band(buffer) / (300 + 16)) * 6); // 6 列、平均高 300、间距 16
  const eqCards = (buffer) => Math.round((band(buffer) / (245 + 8)) * 3); // 行高 245、间距 8、每行约 3 张

  return {
    nav: "性能调优",
    title: "React 虚拟瀑布流性能调优完整指南：buffer、阈值、图片与卡片",
    description:
      "让很长的 React 瀑布流图库保持流畅的实用建议：buffer 与 loadMoreThreshold 的取舍、同时渲染多少卡片、排版计算的代价、memo 化的卡片、图片尺寸与懒加载、LCP 与 CLS，以及如何测量。",
    h1: "性能调优",
    lead: "库已经替你做了什么，以及你自己的卡片需要检查什么。",
    faq: faqs,
    body: join(
      h2("built-in", "已经做了的优化"),
      ul([
        "只有视口内加上 `buffer` 范围内的元素会被挂载，其余部分在 DOM 里没有任何开销。",
        "滚动位置每个动画帧最多更新一次（`requestAnimationFrame`）。",
        "滚动过程中 item 对象保持引用不变，只有元素或容器宽度变化时才会变，所以做了 memo 的子组件不会在每次滚动时重新渲染。",
        "布局用 `useMemo` 缓存，滚动不会重新计算位置。",
        "滚动状态放在组件内部，不会让你的父组件跟着每一帧重新渲染。",
      ]),
      note("滚动时组件内部每一帧都会重新调用 `renderItem`（只针对可见的元素）。所以**卡片必须用 `React.memo` 包住**：库保证了 item 的引用稳定，memo 才能真正生效。"),

      h2("measure", "先测量，再调整"),
      p("调优之前先知道现在是什么状态。最简单的指标是此刻有多少卡片在 DOM 里，给卡片根元素加一个标记，在控制台执行："),
      code(`// 卡片根元素上加 data-card，然后：
document.querySelectorAll("[data-card]").length`),
      table(
        ["想知道", "用什么看"],
        [
          ["同时渲染了多少卡片", "上面的控制台一行代码，或者 Elements 面板"],
          ["滚动时哪些组件在重复渲染", "React DevTools 的 Profiler，勾选「记录为什么渲染」"],
          ["滚动是否掉帧、哪里耗时", "Chrome DevTools 的 Performance 面板，录制一段滚动"],
          ["同时发出了多少图片请求", "Network 面板，筛选 Img"],
          ["整体评分", "Lighthouse，用生产构建测，桌面和移动端各测一次"],
        ],
      ),

      h2("band", "同时会渲染多少卡片"),
      p("渲染范围是视口上下各延伸 `buffer`，所以同时存在的元素数大致等于「(视口高度 + 2 × buffer) ÷ 每个元素占的高度 × 每行元素数」。以 900px 高的视口为例，下面是估算值（只是数量级参考，实际取决于卡片高度和列数）："),
      table(
        ["`buffer`", "渲染带高度", "瀑布流（6 列，平均高 300、间距 16）", "等高布局（行高 245、间距 8、每行约 3 张）"],
        [500, 1000, 1500, 3000].map((b) => [
          `${b}px`,
          `${band(b)}px`,
          `约 ${wfCards(b)} 个`,
          `约 ${eqCards(b)} 张`,
        ]),
      ),
      p("默认的 `buffer` 是 `1500`：同时存在几十个卡片，快速滚动时基本看不到空白。机器较弱或者卡片很重时可以降到 `500` 到 `1000`；图片多而重的页面，减半往往能明显减少同时发出的图片请求。"),
      h3("buffer"),
      p("`buffer`（默认 `1500`）是视口上下一直保持挂载的距离。值越大，快速滚动时空白越少，但挂载的卡片和同时请求的图片也越多；值越小越省，但快速滚动时能看到加载的过程。"),
      note("调 `buffer` 和 `loadMoreThreshold` 时，请同时观察图片请求数量和你的性能评分，不要只凭画面看起来更好就一直调大。"),
      h3("loadMoreThreshold"),
      p("`loadMoreThreshold` 越大，下一次请求开始得越早，能掩盖延迟，但会加载用户可能永远滚不到的数据。请根据接口延迟和页大小来选择，见[分页与无限滚动](@/guides/pagination/#trigger)。"),

      h2("layout-cost", "排版计算的代价"),
      p("每次元素列表或容器宽度变化时，所有已加载元素的位置会重新计算一次，复杂度和元素数成正比。滚动本身**不会**触发重新计算。下面是在开发机的 Node 里对排版算法单独计时的结果（不包含 React 渲染，仅作数量级参考）："),
      table(
        ["已加载元素数", "瀑布流", "等高布局"],
        [
          ["1,000", "不到 1 ms", "约 2 ms"],
          ["10,000", "约 1 ms", "约 7 ms"],
          ["50,000", "约 15 ms", "约 30 ms"],
        ],
      ),
      ul([
        "所以每加载一页、拖动一次窗口，排版本身的开销可以忽略；真正贵的是渲染卡片，这由 `buffer` 和卡片的复杂度决定。",
        "**让参数引用保持稳定**：`sizeRange` 是排版计算的依赖项，在 JSX 里直接写 `sizeRange={[230, 260]}`，只要父组件重新渲染就是一个新数组，全部行会重新计算。提到组件外面，或者用 `useMemo`。",
        "`mapSize` 通过 ref 读取，传入内联函数不会触发重新排版。",
      ]),
      code(`// 好：引用稳定
const SIZE_RANGE: [number, number] = [230, 260];
<FullWidthEqualHeightMasonry sizeRange={SIZE_RANGE} /* ... */ />

// 不够好：父组件每次渲染都是新数组，导致全部行重新计算
<FullWidthEqualHeightMasonry sizeRange={[230, 260]} /* ... */ />`),

      h2("images", "图片"),
      ul([
        "在数据里给每个元素真实的 `width` 和 `height`。布局在图片加载前就按它们算好，所以图片到达时不会有任何跳动。",
        "给图片加上 `loading=\"lazy\"` 和 `decoding=\"async\"`，并使用与显示尺寸接近的缩略图。",
        "使用 `object-fit: cover`，这样取整后尺寸略有差异时也不会让图片变形。",
      ]),
      code(`<img src={item.thumb} alt={item.title} width={item.width} height={item.height}
     loading="lazy" decoding="async"
     style={{ width: "100%", height: "100%", objectFit: "cover" }} />`),
      h3("按显示尺寸请求图片"),
      p("`renderItem` 里能直接拿到卡片的显示宽度，乘以设备像素比就是应该请求的图片宽度。如果你的图片服务支持按宽度缩放，就不用为所有屏幕下载同一张大图："),
      code(`function thumbUrl(url: string, cssWidth: number) {
  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  return url + "?w=" + Math.ceil(cssWidth * dpr); // 换成你的图片服务的参数
}

<img src={thumbUrl(item.url, item.width)} alt={item.title} loading="lazy" decoding="async" />`),

      h2("cards", "卡片"),
      ul([
        "用 `React.memo` 包住卡片。因为 item 的引用是稳定的，只有它自己的数据变化时才会重新渲染。",
        "保持 `renderItem` 轻量。不要在每张卡片里创建 observer 或很重的状态，能共用就共用。",
        "始终在返回的元素上设置 `key={item.id}`。",
        "悬停效果尽量只用 `transform` 和 `opacity`，避免每张卡片都有大面积的 `box-shadow` 变化或 `filter`。",
      ]),
      code(`const Card = React.memo(function Card({ item }: { item: any }) {
  return (
    <div data-card style={{ position: "absolute", left: item.x, top: item.y, width: item.width, height: item.height }}>
      <img src={item.thumb} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
});

<VirtualMasonry renderItem={(item) => <Card key={item.id} item={item} />} /* ... */ />`),

      h2("page-size", "pageSize"),
      p("选一个能填满超过一屏（包括预加载阈值）的页大小。页太小会造成请求连发，页太大会拖慢首屏。可以从 30 到 50 开始尝试。"),

      h2("vitals", "LCP 与 CLS"),
      ul([
        "**LCP**：首屏最靠上的几张图片往往就是 LCP 元素。它们不要加 `loading=\"lazy\"`，并可以加上 `fetchpriority=\"high\"`。`renderItem` 里能直接用位置判断：列表在页面顶部附近时，`item.y < 600` 的就是首屏的。",
        "**CLS**：图片本身不会造成布局偏移，因为尺寸来自数据，位置在图片加载前就定了。需要注意的是**列表下方的内容**：数据到达前容器高度是 0，数据到达后变高，会把下面的内容（例如页脚）推下去。给列表外面套一个 `minHeight`（例如 `100vh`）可以避免这种偏移。",
        "**INP**：保证卡片里的点击处理轻量；很重的操作放到下一帧再做。",
      ]),
      code(`renderItem={(item) => (
  <Card
    key={item.id}
    item={item}
    eager={item.y < 600} // 首屏的图片：不懒加载，并提高优先级
  />
)}

// Card 内部：
<img
  src={item.thumb}
  alt={item.title}
  loading={eager ? "eager" : "lazy"}
  fetchPriority={eager ? "high" : "auto"}
/>`),
      p("`fetchPriority` 属性从 React 19 起被识别；更早的 React 版本请改用小写的 `fetchpriority`。"),
      note("这些页面指标请用生产构建来测，并且桌面和移动端各测一次。开发模式下的结果没有参考价值。"),

      h2("checklist", "检查清单"),
      table(
        ["检查项", "为什么"],
        [
          ["卡片用 `React.memo` 包住，`key` 是 `item.id`", "滚动时每一帧都会调用 `renderItem`"],
          ["数据里每条都有准确的宽和高", "位置在图片加载前算好，没有跳动"],
          ["图片用合适尺寸的缩略图，`loading=\"lazy\"`，首屏除外", "控制同时发出的请求和流量"],
          ["`sizeRange` 等数组参数引用稳定", "避免每次渲染都重新排版"],
          ["`buffer` 和 `loadMoreThreshold` 按实测调整", "在空白和开销之间取舍"],
          ["列表外层有 `minHeight`", "避免内容推挤造成的 CLS"],
          ["生产构建下跑 Lighthouse", "开发模式下的数字不可信"],
        ],
      ),

      h2("faq", "常见问题"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("相关：[分页与无限滚动](@/guides/pagination/)、[响应式布局](@/guides/responsive/)、[VirtualMasonry](@/virtual-masonry/)。"),
    ),
  };
}
