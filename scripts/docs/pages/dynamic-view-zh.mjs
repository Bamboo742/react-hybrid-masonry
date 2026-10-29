import { code, figure, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { decisionSvg } from "../diagram.mjs";

const faqs = [
  [
    "接口返回的布局类型变了，为什么布局没有切换？",
    "非受控模式下，布局类型只在第一次 loadData(1) 时读取一次，之后的页不再看它。要在运行时切换，请使用 isMasonry 属性。",
  ],
  [
    "切换布局后为什么从头开始加载？滚动位置也没了？",
    "瀑布流和等高布局是两个不同的组件，isMasonry 变化时当前的那个会被卸载、另一个被挂载，新的组件从第 1 页开始加载，列表从头重新长出来，之前的滚动位置不会保留。这是预期行为：两种布局的位置计算完全不同，没办法在它们之间复用已排好的结果。如果希望保留浏览位置，请不要在用户滚动到深处时切换布局。",
  ],
  [
    "第 1 页会被请求两次吗？",
    "正常情况下不会。非受控模式下组件挂载时请求一次 loadData(1, pageSize)，结果会被缓存，内部的布局组件直接取用这份缓存。只有第一次请求失败时才会例外：这时没有缓存，内部组件会再请求一次第 1 页。",
  ],
  [
    "受控模式下，loadData 返回的 isMasonry 为什么被忽略？",
    "isMasonry 属性的优先级最高。传了它，组件不会为了确定布局而提前请求第 1 页，loadData 返回里的 isMasonry 也不会再被读取，只有 isMasonry 属性本身决定布局。",
  ],
  [
    "页面刚打开时有一段空白，怎么处理？",
    "非受控模式要先等第 1 页返回才知道用哪种布局，这段时间显示的是 renderInitialLoader（不传就是一块空白）。传一个骨架屏给它；或者在服务端就决定好布局，通过 isMasonry 属性传进来，这样就没有这段等待。",
  ],
  [
    "能同时使用 initialItems 吗？",
    "DynamicMasonryView 目前没有 initialItems 和 initialHasMore。需要用预取的首屏数据时，请直接使用 VirtualMasonry（它支持 initialItems），自己决定用哪种布局。",
  ],
  [
    "两种布局想共用一张卡片组件怎么办？",
    "renderItem 的第三个参数告诉你当前用的是哪种布局，在同一个卡片组件里按它调整圆角、文字大小等即可。注意两种布局里 index 的含义不同，不要用它当 key，请使用 item.id。",
  ],
];

export default function dynamicViewPage() {
  const flow = decisionSvg({
    aria: "布局确定流程：先看 isMasonry 属性，再看第一次接口的返回，最后使用 defaultIsMasonry",
    mount: "挂载",
    askProp: "传了\nisMasonry？",
    yes: "是",
    no: "否",
    useProp: "直接使用该值\n（受控）",
    fetch: "调用\nloadData(1, pageSize)",
    askReturned: "返回了\nisMasonry？",
    useReturned: "使用返回值",
    useDefault: "使用\ndefaultIsMasonry",
    failed: "第 1 页请求失败：调用 onError，使用默认布局",
  });

  return {
    nav: "DynamicMasonryView",
    title: "DynamicMasonryView – 在 React 中动态切换瀑布流与等高布局完整指南",
    description:
      "DynamicMasonryView 完整参考：运行时在瀑布流与等高布局之间选择，包含布局确定流程图、受控与接口驱动两种用法、首页缓存机制、加载与错误处理、两种布局的配置和常见问题。",
    h1: "DynamicMasonryView",
    lead: "一个组件，两种布局。布局由属性、第一次接口返回或默认值决定。",
    faq: faqs,
    body: join(
      h2("overview", "概览"),
      p("`DynamicMasonryView` 是 [VirtualMasonry](@/virtual-masonry/)（瀑布流）和 [FullWidthEqualHeightMasonry](@/equal-height/)（等高布局）外面的一层选择器：**由接口告诉它这个列表该用哪种展示形式**，所以运营或后端可以按内容（图片为主还是带文字的卡片）切换，前端不用写两份页面。"),
      figure(
        flow,
        "布局的确定顺序：先看 `isMasonry` 属性；没传就请求第 1 页，看返回里有没有 `isMasonry`；都没有就用 `defaultIsMasonry`。虚线是第 1 页请求失败的情况。",
      ),
      ul([
        "组件只负责选择，真正的排版、虚拟滚动和翻页都由内部的两个组件完成，行为和它们单独使用时一致。",
        "两种布局共用同一个 `loadData`、`renderItem` 和 `mapSize`，你只需要写一份数据层和一份卡片。",
        "非受控模式下，第 1 页只请求一次：用来读取布局类型的那次请求，结果会直接交给内部组件使用。",
      ]),

      h2("quick-start", "快速上手"),
      p("最常见的用法：接口在第一页里告诉组件用哪种布局。"),
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
      note("每条数据在加载之前就必须带有宽和高，两种布局都靠它们算位置，约定和[VirtualMasonry](@/virtual-masonry/#data)、[FullWidthEqualHeightMasonry](@/equal-height/#data)一致。"),

      h2("modes", "三种确定布局的方式"),
      h3("1. 受控"),
      code(`<DynamicMasonryView
  isMasonry={useWaterfall} // true = 瀑布流，false = 等高布局
  loadData={loadData}
  renderItem={(item, index, isMasonry) => /* ... */ null}
/>`),
      p("该属性优先级最高。传了它，组件**不会**为了确定布局而提前请求第 1 页，`loadData` 返回里的 `isMasonry` 也会被忽略。它变化时，当前的布局组件会被卸载、另一个被挂载，并从第 1 页重新加载。"),
      h3("2. 由第一次接口返回决定"),
      p("没有传 `isMasonry` 时，组件挂载后调用一次 `loadData(1, pageSize)`，从结果里读取 `isMasonry`，并缓存这第一页数据，所以选好的布局会立刻展示它，第 1 页不会被请求第二次。布局类型**只读取一次**，后续页不需要再返回。"),
      h3("3. 默认值"),
      p("如果 `loadData` 没有返回 `isMasonry`，则使用 `defaultIsMasonry`（默认 `true`，即瀑布流）。`loadData` 没有传时也使用它。"),
      note("如果第一次请求失败，会调用 `onError` 并使用默认布局。此时没有缓存的第 1 页，内部组件会再请求一次第 1 页；如果这次仍然失败，内部组件会停止翻页，不会无限重试。"),

      h2("controlled", "受控切换示例"),
      p("让用户自己选择展示形式时，把状态放在你自己这里："),
      code(`function Gallery() {
  const [isMasonry, setIsMasonry] = useState(true);

  return (
    <>
      <div role="group" aria-label="布局">
        <button aria-pressed={isMasonry} onClick={() => setIsMasonry(true)}>瀑布流</button>
        <button aria-pressed={!isMasonry} onClick={() => setIsMasonry(false)}>等高布局</button>
      </div>

      <DynamicMasonryView isMasonry={isMasonry} loadData={loadData} renderItem={renderCard} />
    </>
  );
}`),
      ul([
        "切换会重新挂载布局组件，列表从第 1 页重新加载，滚动位置不会保留，见常见问题。",
        "挂载时和每次 `isMasonry` 变化都会调用 `onLayoutTypeLoaded`。",
        "受控模式下没有「等待布局类型」的阶段，所以不会显示 `renderInitialLoader`。",
      ]),

      h2("render", "renderItem 与卡片"),
      p("`renderItem(item, index, isMasonry)` 比单个组件多一个参数，告诉你这一次渲染用的是哪种布局，可以让同一张卡片适配两种形态。`item` 的字段（`x`、`y`、`width`、`height` 等）与对应的单个组件相同，根元素同样必须是**绝对定位**。"),
      table(
        ["", "瀑布流（`isMasonry` 为 `true`）", "等高布局（`isMasonry` 为 `false`）"],
        [
          ["`index`", "当前**已渲染**元素中的序号，滚动时会变", "全部已加载数据中的序号，滚动时不变"],
          ["`item.width`", "列宽，同一次布局里相同", "每张图各不相同"],
          ["`item.height`", "按比例算出，各不相同", "同一行内相同"],
          ["卡片内容", "高度可以不同，适合带文字说明", "只适合图片为主，文字叠在图片上"],
        ],
      ),
      p("无论哪种布局，都请用 `key={item.id}` 这样稳定的值，不要用 `index` 做 `key`。"),

      h2("config", "两种布局的配置"),
      p("`waterfallConfig` 传给瀑布流，`equalHeightConfig` 传给等高布局。不传的字段使用对应组件的默认值，两个对象不会互相影响，所以可以同时写好，由接口决定用哪一个。"),
      h3("waterfallConfig"),
      table(
        ["字段", "类型", "默认值", "说明"],
        [
          ["`minColumnWidth`", "`number`", "`200`", "最小列宽（px），用来推算列数。"],
          ["`maxColumnWidth`", "`number`", "–", "最大列宽（px）。"],
          ["`columns`", "`number`", "–", "直接指定列数，不再按宽度推算。"],
          ["`gap`", "`number`", "`16`", "元素之间的间距（px）。"],
          ["`buffer`", "`number`", "`1500`", "视口上下仍会渲染的缓冲距离（px）。"],
        ],
      ),
      p("列数的计算规则见 [VirtualMasonry 的列数与列宽](@/virtual-masonry/#columns)。"),
      h3("equalHeightConfig"),
      table(
        ["字段", "类型", "默认值", "说明"],
        [
          ["`targetRowHeight`", "`number`", "`245`", "目标行高，决定一行放几张。"],
          ["`sizeRange`", "`[number, number]`", "`[230, 260]`", "允许的行高范围。"],
          ["`maxItemWidth`", "`number`", "`975`", "单个元素的最大宽度。"],
          ["`maxStretchRatio`", "`number`", "`1.5`", "一行最多愿意把图片放大多少。"],
          ["`gap`", "`number`", "`8`", "元素之间的间距（px）。"],
          ["`buffer`", "`number`", "`1500`", "视口周围仍会渲染的缓冲距离（px）。"],
        ],
      ),
      p("每个字段怎么协同见 [FullWidthEqualHeightMasonry 的参数说明](@/equal-height/#params)。把 `sizeRange` 提到组件外面或用 `useMemo`，避免每次渲染都传新数组导致全部行重新计算。"),
      note("这里只开放了上面这些字段。`loadMoreThreshold`、`initialItems`、`initialHasMore` 没有通过 `DynamicMasonryView` 暴露，内部使用各自组件的默认值（瀑布流 800、等高布局 500）。需要时请直接使用对应的单个组件。"),

      h2("props", "属性"),
      table(
        ["属性", "类型", "默认值", "说明"],
        [
          ["`isMasonry`", "`boolean`", "–", "受控模式。`true` 为瀑布流，`false` 为等高布局。"],
          ["`defaultIsMasonry`", "`boolean`", "`true`", "`loadData` 没有返回 `isMasonry`（或没有传 `loadData`）时使用。"],
          ["`loadData`", "`LoadDataFn`", "–", "`(page, pageSize) => Promise<{ data, hasMore, isMasonry? }>`。"],
          ["`renderItem`", "`(item, index, isMasonry) => ReactNode`", "必填", "渲染函数，最后一个参数表示当前使用的布局。"],
          ["`waterfallConfig`", "`{ minColumnWidth, maxColumnWidth, columns, gap, buffer }`", "`{}`", "传给 [VirtualMasonry](@/virtual-masonry/)。"],
          ["`equalHeightConfig`", "`{ targetRowHeight, sizeRange, maxItemWidth, maxStretchRatio, gap, buffer }`", "`{}`", "传给 [FullWidthEqualHeightMasonry](@/equal-height/)。"],
          ["`pageSize`", "`number`", "`50`", "每页请求的数据量。"],
          ["`mapSize`", "`(raw) => { width, height }`", "–", "把你的数据映射成宽高。"],
          ["`renderInitialLoader`", "`() => ReactNode`", "空白块", "确定布局类型之前显示的内容。"],
          ["`onLayoutTypeLoaded`", "`(isMasonry: boolean) => void`", "–", "布局类型确定后调用。"],
          ["`onError`", "`(error: Error) => void`", "–", "第一次请求（用来确定布局的那次）失败时调用。"],
          ["`enableAnimation`", "`boolean`", "`true`", "预留参数，目前没有效果。"],
        ],
      ),

      h2("states", "加载状态与错误"),
      h3("确定布局之前"),
      p("非受控模式要等第 1 页返回才知道用哪种布局。这段时间渲染的是 `renderInitialLoader()` 的返回值；不传就是一块空白。骨架屏的写法："),
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
      h3("onLayoutTypeLoaded 与 onError"),
      ul([
        "`onLayoutTypeLoaded(isMasonry)`：布局类型确定后调用，无论它来自属性、接口返回还是默认值。可以用来同步你自己界面上的切换按钮。",
        "`onError(error)`：**只**在用来确定布局的第一次请求失败时调用，随后使用默认布局。",
        "后续页面的请求失败由内部组件处理：在控制台输出错误并停止自动翻页，**不会**调用你的 `onError`。需要感知这类失败时，请在你自己的 `loadData` 里 `try/catch`。",
      ]),

      h2("ssr", "服务端渲染"),
      p("这个组件只能在客户端工作，列表本身要等浏览器里测量到容器宽度才会排出来。非受控模式还要再等第 1 页返回，所以服务端渲染的 HTML 里没有卡片。要避免挂载后的空白，可以在服务端先决定好布局，再通过 `isMasonry` 传入，省去等待布局类型的那一步。需要让搜索引擎收录内容时，请另外渲染一份可抓取的列表，见 [Next.js 与 SSR](@/guides/nextjs-ssr/)。"),

      h2("exports", "导出的类型"),
      code(`import { DynamicMasonryView, ViewType } from "react-hybrid-masonry";
import type { DynamicMasonryViewProps, LoadDataFn } from "react-hybrid-masonry";

// ViewType 是一个枚举：ViewType.WATERFALL = 1，ViewType.EQUAL_HEIGHT = 2
// 组件本身不读取它，它只是方便你把接口里的数字映射成 isMasonry：
const isMasonry = json.viewType === ViewType.WATERFALL;`),
      note("`loadData` 的类型是 `LoadDataFn<T>`，只有第一次调用（`page === 1`）可以带上 `isMasonry`。"),

      h2("faq", "常见问题"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("相关：[VirtualMasonry](@/virtual-masonry/)、[FullWidthEqualHeightMasonry](@/equal-height/)、[分页与无限滚动](@/guides/pagination/)、[响应式布局](@/guides/responsive/)。"),
    ),
  };
}
