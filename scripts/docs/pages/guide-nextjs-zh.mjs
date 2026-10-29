import { code, h2, h3, join, note, p, table, ul } from "../helpers.mjs";

const faqs = [
  [
    "在 Next.js App Router 里报「You're importing a component that needs useState」之类的错误？",
    "这些组件使用了 React hooks，发布时没有带 use client 指令。请把用到它们的文件放进以 use client 开头的客户端组件里，不要在服务端组件里直接引入。",
  ],
  [
    "控制台出现水合（hydration）不一致的警告？",
    "组件本身不会造成：服务端渲染时容器宽度未知，两端的首次渲染都是一个空容器。如果出现警告，请检查你自己的 renderItem 之外的内容，例如用到了 window、Date.now() 或 Math.random() 的代码，它们在服务端和浏览器里的结果不同。",
  ],
  [
    "搜索引擎能收录列表里的图片和内容吗？",
    "不能直接收录：服务端 HTML 里没有卡片。需要被收录的内容，请另外渲染一份服务端可抓取的列表，并保证它与用户看到的内容一致，见上面的「SEO」一节。",
  ],
  [
    "next/dynamic 的 ssr: false 报错 not allowed in Server Components？",
    "从 Next.js 15 起，ssr: false 只能在客户端组件里使用。把 dynamic 调用放进一个以 use client 开头的文件里即可。",
  ],
  [
    "在 Vite、Create React App 这类纯客户端项目里需要做什么？",
    "什么都不用做，直接引入使用。以上关于服务端的限制只和有服务端渲染的框架有关。",
  ],
];

export default function nextjsGuide() {
  return {
    nav: "Next.js 与 SSR",
    title: "在 Next.js 与服务端渲染中使用 react-hybrid-masonry 完整指南",
    description:
      "如何在 Next.js App Router、Pages Router 与其他 SSR 框架中使用 React 瀑布流组件：use client 指令、水合安全、用 initialItems 传入预取的第一页、next/image、SEO 与可抓取内容的做法。",
    h1: "Next.js 与服务端渲染",
    lead: "哪些能在服务端运行，哪些要等到浏览器里，以及如何交接预取好的第一页。",
    faq: faqs,
    body: join(
      h2("overview", "哪些在服务端，哪些在浏览器"),
      table(
        ["内容", "服务端", "浏览器"],
        [
          ["容器宽度的测量", "不会执行", "挂载时立即测量"],
          ["元素位置的计算", "不会执行（宽度未知）", "测量到宽度后计算"],
          ["卡片（`renderItem`）的渲染", "**不渲染**，输出是空容器", "渲染"],
          ["第一页的请求", "你自己在服务端取，再传 `initialItems`", "没有 `initialItems` 时挂载后请求"],
          ["滚动、翻页、`IntersectionObserver`", "不会执行", "执行"],
        ],
      ),
      p("一句话：组件在服务端只输出一个空的占位容器，一切都从浏览器里开始。这让水合天然安全，代价是服务端 HTML 里没有卡片。"),

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
      p("Pages Router 不需要这个指令，直接在页面或组件里引入即可。"),

      h2("initial", "传入预取的第一页"),
      p("在服务端组件里取好第 1 页，作为 `initialItems` 传入。组件会直接用这份数据开始，**不会**显示加载状态，也**不会**再请求第 1 页；第一次 `loadData` 调用请求的是第 2 页。"),
      code(`// app/gallery/page.tsx（服务端组件）
import Gallery from "./Gallery";

export default async function Page() {
  const res = await fetch("https://api.example.com/images?page=1&size=30", {
    next: { revalidate: 60 }, // 第一页缓存 60 秒
  });
  const first = await res.json();
  return <Gallery first={{ items: first.items, hasMore: first.hasMore }} />;
}`),
      note("`initialItems` 只在 `VirtualMasonry` 上提供。`DynamicMasonryView` 和 `FullWidthEqualHeightMasonry` 的第一页在客户端加载。需要预取并且要用等高布局时，等高布局目前只能在客户端请求第一页。"),
      p("传给客户端组件的 `initialItems` 必须是可序列化的纯数据（对象、数组、字符串、数字），不能带函数或类实例。每条数据都要带有宽和高，见[数据与尺寸](@/virtual-masonry/#data)。"),

      h2("hydration", "水合是安全的"),
      p("布局副作用在浏览器里使用 `useLayoutEffect`，在服务端自动降级为 `useEffect`。服务端渲染时容器宽度未知，所以两端的首次渲染都是一个空容器，不会出现水合不一致。元素位置会在挂载后、测量到宽度时立刻计算。"),
      p("因为卡片只在浏览器里渲染，你在 `renderItem` 里使用 `window`、`Math.random()` 之类只在客户端才有意义的值是安全的，不会触发水合警告。"),

      h2("image", "配合 next/image"),
      p("卡片的根元素本来就是绝对定位，所以可以直接给 `next/image` 使用 `fill`：它会铺满卡片，宽高由布局决定。`sizes` 要按列宽来写，否则 Next 会按最大尺寸下载："),
      code(`import Image from "next/image";

<VirtualMasonry
  columns={4}
  gap={16}
  loadData={loadData}
  renderItem={(item) => (
    <div
      key={item.id}
      style={{ position: "absolute", left: item.x, top: item.y, width: item.width, height: item.height, overflow: "hidden", borderRadius: 12 }}
    >
      <Image
        src={item.url}
        alt={item.title}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        style={{ objectFit: "cover" }}
      />
    </div>
  )}
/>`),
      p("`sizes` 里的百分比要和你的列数大致对应：4 列就是 `25vw`。图片域名需要在 `next.config` 里配置 `images.remotePatterns`。"),

      h2("seo", "SEO：服务端 HTML 里有什么"),
      p("因为位置取决于测量到的宽度，即使传了 `initialItems`，**服务端 HTML 里也不包含卡片**。如果搜索引擎必须看到这些内容，有这几种做法，可以组合使用："),
      ul([
        "**为内容提供可抓取的分页 URL**：例如 `/gallery?page=2`，在服务端渲染这一页的普通列表（链接加文字），再用普通的「下一页」链接把它们串起来。",
        "**详情页各有独立的 URL**，并放进 sitemap。列表只是浏览入口，真正被收录的是详情页。",
        "**每个分页 URL 使用指向自己的 canonical**：不要把第 2 页及之后的 canonical 都指向第一页，否则后面的页不会被单独收录。",
      ]),
      code(`// app/gallery/page.tsx：给爬虫的列表和给用户的瀑布流并存
import Gallery from "./Gallery";

// Next.js 15 中 searchParams 是 Promise；13 和 14 里是普通对象
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Number((await searchParams).page ?? 1);
  const data = await fetchImages(page, 30);

  return (
    <>
      <Gallery first={{ items: data.items, hasMore: data.hasMore }} />

      {/* 服务端渲染的、可被抓取的列表：做成页面上真实可见的「浏览全部」入口，内容与瀑布流一致 */}
      <nav aria-label="浏览全部图片">
        <ul>
          {data.items.map((item: any) => (
            <li key={item.id}>
              <a href={"/gallery/" + item.id}>{item.title}</a>
            </li>
          ))}
        </ul>
        {data.hasMore && <a href={"/gallery?page=" + (page + 1)}>下一页</a>}
      </nav>
    </>
  );
}`),
      note("给爬虫看的内容必须和用户看到的内容一致，并且最好对用户也是可见、可用的（例如页脚的「浏览全部」入口），不要用它隐藏用户看不到的文字，否则可能被搜索引擎视为作弊。"),

      h2("filters", "筛选条件来自 URL"),
      p("在 App Router 里，筛选条件通常来自 URL。把当前查询作为 `key` 传给客户端组件，条件变化时列表会重新开始，从第 1 页重新加载："),
      code(`"use client";

import { useSearchParams } from "next/navigation";

export default function Gallery() {
  const params = useSearchParams();
  const query = params.toString();

  return (
    <VirtualMasonry
      key={query}
      loadData={(page, size) => fetch("/api/images?" + query + "&page=" + page + "&size=" + size).then((r) => r.json())}
      renderItem={renderCard}
    />
  );
}`),
      note("`useSearchParams` 在静态渲染的页面里需要被 `Suspense` 包住。只把调用它的那个小组件包进 `Suspense`，不要把整个页面包进去，否则整页内容都不会出现在首次响应里。"),

      h2("lazy", "懒加载"),
      p("布局只在浏览器里有意义，所以可以把它从首屏 bundle 里拆出去："),
      code(`"use client";

import dynamic from "next/dynamic";

const Gallery = dynamic(() => import("./Gallery"), { ssr: false });`),
      p("只有在你不需要靠 `initialItems` 来避免加载闪烁时才这样用。Next.js 15 起，`ssr: false` 只能写在客户端组件里。"),

      h2("others", "其他框架"),
      ul([
        "**Vite、Create React App 等纯客户端项目**：直接使用，没有任何额外要求。",
        "**Astro**：用 `client:only=\"react\"` 指令挂载包含它的 React 组件。",
        "**Remix 等 SSR 框架**：组件在服务端只输出空容器，可以直接渲染；如果你的卡片里用了只在浏览器存在的 API，保险起见把整块放进「挂载后才渲染」的包装里。",
      ]),
      code(`function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}`),

      h2("faq", "常见问题"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("相关：[VirtualMasonry 的首屏数据与 SSR](@/virtual-masonry/#ssr)、[分页与无限滚动](@/guides/pagination/)。"),
    ),
  };
}
