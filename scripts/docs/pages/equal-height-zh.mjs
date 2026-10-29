import { code, figure, figures, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { SAMPLE_SIZES, layoutSvg } from "../diagram.mjs";

const faqs = [
  [
    "为什么最后一行没有铺满整行？",
    "这是有意为之。排在数组末尾的一行按自然比例显示（高度最多为 targetRowHeight），不会被拉伸去填满容器，否则图片很少时会被放大得很模糊。下一页数据到来后，这一行不再是末尾行，会重新计算并铺满。如果列表已经加载完（hasMore 为 false），最后一行就保持原样。",
  ],
  [
    "为什么某一行右边还有空白？",
    "除了最后一行，只有一种情况：这一行里有图片被 maxItemWidth 截断了，常见于很宽的全景图。组件优先保证单张图不超过 maxItemWidth，所以宁可让这一行右侧留白。把 maxItemWidth 调大（至少不小于容器宽度），或者不再限制，右侧就会铺满。",
  ],
  [
    "图片看起来被轻微裁切或拉伸？",
    "每一行都要精确地铺满容器宽度，同时行高又被限制在 sizeRange 内，所以单张图的宽高比会有很小的偏差。请在 img 上使用 object-fit: cover，偏差会表现为极少量的裁切，而不是变形。sizeRange 区间越窄，行高被限制得越死，这个偏差就越明显。",
  ],
  [
    "为什么实际行高不等于 targetRowHeight？",
    "targetRowHeight 只是排版的起点：它决定每张图的理想宽度，从而决定一行放几张。随后行高会按「铺满整行所需的缩放比例」调整，并被限制在 sizeRange 内，所以每一行的高度可能不同。只要想让所有行高度几乎一致，就把 sizeRange 收窄。",
  ],
  [
    "加载下一页之后，上面的行会跳动吗？",
    "不会。行是按顺序贪心拼出来的，后面追加的数据不会影响前面已经排好的整行。只有原来的最后一行会被重新计算，因为它不再是末尾行，会被补充新图片并铺满。",
  ],
  [
    "能在每张图下面放标题和说明吗？",
    "不适合。行高由布局决定，你拿到的 height 就是这张图占用的全部高度，没办法为图片下方的文字额外留空间。请把文字叠放在图片内部（比如悬停时出现的底部遮罩），或者改用允许卡片高度不一的瀑布流布局。",
  ],
  [
    "窗口宽度变化时会怎样？",
    "组件会监听容器宽度，宽度一变就重新计算所有行：每行放几张、行高和每张图的宽度都会随之调整，不需要你做任何处理。如果需要在小屏上使用不同的行高，可以按断点传入不同的 targetRowHeight 和 sizeRange，见下文「常用配置」。",
  ],
];

export default function equalHeightPage() {
  const demo = SAMPLE_SIZES.slice(0, 16);
  // 并排对比用较少的图片，两张图的高度才不会差太多
  const few = SAMPLE_SIZES.slice(0, 10);

  const basic = layoutSvg(
    demo,
    { width: 640, targetRowHeight: 90, gap: 6, sizeRange: [80, 100], maxStretchRatio: 1.5 },
    "等高布局示意图：每行高度相同、右边缘对齐，最后一行保持自然比例",
  );

  const smallRows = layoutSvg(
    few,
    { width: 300, targetRowHeight: 50, gap: 4, sizeRange: [44, 56] },
    "较小的目标行高：每行放入更多图片",
  );
  const bigRows = layoutSvg(
    few,
    { width: 300, targetRowHeight: 100, gap: 4, sizeRange: [90, 110] },
    "较大的目标行高：每行放入更少的图片",
  );

  const loose = layoutSvg(
    few,
    { width: 300, targetRowHeight: 70, gap: 4, sizeRange: [60, 80], maxStretchRatio: 1.5 },
    "maxStretchRatio 为 1.5 的排法",
  );
  const strict = layoutSvg(
    few,
    { width: 300, targetRowHeight: 70, gap: 4, sizeRange: [60, 80], maxStretchRatio: 1.2 },
    "maxStretchRatio 为 1.2 的排法",
  );

  return {
    nav: "FullWidthEqualHeightMasonry",
    title: "FullWidthEqualHeightMasonry – React 等高（Justified）图片布局完整指南",
    description:
      "FullWidthEqualHeightMasonry 完整参考：Google Photos 风格的 React 等高布局，包含排版示意图、数据与尺寸约定、参数如何协同、常用配置、受控的 Core 组件、与瀑布流的对比和常见问题。",
    h1: "FullWidthEqualHeightMasonry",
    lead: "Google Photos 风格布局：图片保持宽高比，每一行高度相同，并按容器宽度精确拉伸或收缩来铺满。只渲染视口附近的行。",
    faq: faqs,
    body: join(
      h2("overview", "概览"),
      p("`FullWidthEqualHeightMasonry` 把图片一行一行地排：**每行高度一致、右边缘对齐，每张图保持自己的宽高比**。一行放几张由图片的宽高比决定，而不是固定的列数，所以非常适合以图片为主、需要快速浏览大量内容的相册、时间线和搜索结果。"),
      figure(
        basic.svg,
        `容器宽 640px、目标行高 90px、间距 6px 的排版示意（共 ${basic.rows} 行，数字是图片的宽高比）。实线的整行右边缘对齐；虚线的最后一行保持自然比例，不被拉伸。`,
      ),
      ul([
        "每行高度相同，行与行、图与图之间的间距都是 `gap`。",
        "每张图保持自己的宽高比，只会有很小的偏差，见[参数如何协同工作](#params)。",
        "只渲染视口上下 `buffer` 范围内的行，几千张图片也不会拖慢页面。",
        "滚动到底部附近时自动加载下一页，一次只会有一个请求在途。",
      ]),

      h2("quick-start", "快速上手"),
      code(`import { FullWidthEqualHeightMasonry } from "react-hybrid-masonry";

type Photo = { id: number; url: string; title: string; width: number; height: number };

async function loadData(page: number, pageSize: number) {
  const res = await fetch("/api/photos?page=" + page + "&size=" + pageSize);
  const json = await res.json();
  return { data: json.items as Photo[], hasMore: json.hasMore as boolean };
}

export function PhotoAlbum() {
  return (
    <FullWidthEqualHeightMasonry
      loadData={loadData}
      pageSize={30}
      targetRowHeight={245}
      sizeRange={[230, 260]}
      gap={8}
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
      note("每条数据在加载之前就必须带有宽和高，组件靠它们算位置，而不是等图片下载完再测量。详见下面的[数据与尺寸](#data)。"),

      h2("data", "数据与尺寸"),
      h3("尺寸从哪里来"),
      p("每条数据的尺寸依次读取第一组存在的字段：`width`/`height`、`w`/`h`、`imgW`/`imgH`。字段名不同时用 `mapSize` 映射："),
      code(`<FullWidthEqualHeightMasonry
  mapSize={(raw) => ({ width: raw.cover.w, height: raw.cover.h })}
  loadData={loadData}
  renderItem={renderCard}
/>`),
      p("组件在内部用 `width / height` 算出每张图的 `widthRatio`，整个排版只依赖这个比例，所以尺寸用任何单位（像素、或者 `4` 和 `3` 这样的比例值）都可以。"),
      note("没有有效尺寸的数据无法排版：宽或高缺失会得到 `NaN`，该行的位置会全部错乱。接口里可能缺字段时，请在 `mapSize` 里给一个兜底值，例如 `{ width: raw.w || 4, height: raw.h || 3 }`。"),
      h3("renderItem 收到什么"),
      p("`renderItem(item, index)` 收到的 `item` 是你的原始对象，加上下面这些由布局算出的字段，你自己的字段（`url`、`title` 等）都会保留："),
      table(
        ["字段", "含义"],
        [
          ["`x`", "这张图距容器左边缘的距离（px）。"],
          ["`y`", "这张图距容器顶部的距离（px）。"],
          ["`width`", "排版后的宽度（px），**已经覆盖了你数据里的 `width`**。"],
          ["`height`", "排版后的高度（px），同一行所有图片相同，**同样覆盖了你数据里的 `height`**。"],
          ["`widthRatio`", "宽高比 `width / height`。"],
        ],
      ),
      p("`index` 是这条数据在**全部已加载数据**里的序号，滚动时保持不变，可以放心用来做 `key` 或埋点。如果需要保留原始尺寸，请让接口用 `w`/`h` 这类其他字段名，再通过 `mapSize` 读取。"),

      h2("render", "渲染卡片"),
      ul([
        "返回的根元素必须使用 **绝对定位**，并带上传入的 `left`、`top`、`width`、`height`。",
        "在根元素上设置稳定的 `key`，例如 `item.id`。",
        "图片使用 `object-fit: cover`。为了让每行精确地铺满，单张图的比例会有微小偏差，`cover` 把偏差变成极少量的裁切，而不是变形。",
        "文字说明请叠放在图片内部。行高是布局决定的，图片下方没有额外的空间。",
      ]),
      code(`const Card = React.memo(function Card({ item }: { item: Photo & { x: number; y: number; width: number; height: number } }) {
  return (
    <figure
      className="card"
      style={{ position: "absolute", left: item.x, top: item.y, width: item.width, height: item.height, margin: 0 }}
    >
      <img src={item.url} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <figcaption className="card-caption">{item.title}</figcaption>
    </figure>
  );
});

// .card { overflow: hidden; border-radius: 6px; }
// .card-caption { position: absolute; inset: auto 0 0 0; padding: 24px 12px 10px; opacity: 0; transition: opacity .2s;
//   background: linear-gradient(to top, rgba(0,0,0,.6), transparent); color: #fff; }
// .card:hover .card-caption { opacity: 1; }`),
      p("布局结果在宽度不变时是稳定的，可见元素的对象引用在滚动时保持不变，所以用 `React.memo` 包住卡片可以避免滚动时重复渲染，见[性能调优](@/guides/performance/)。"),

      h2("props", "属性"),
      table(
        ["属性", "类型", "默认值", "说明"],
        [
          ["`loadData`", "`(page, pageSize) => Promise<{ data: any[]; hasMore: boolean }>`", "–", "加载一页数据，页码从 1 开始。"],
          ["`renderItem`", "`(item, index) => ReactNode`", "必填", "渲染单个已定位的元素。`index` 是它在全部已加载数据中的序号。"],
          ["`pageSize`", "`number`", "`50`", "每页请求的数据量。"],
          ["`targetRowHeight`", "`number`", "`245`", "目标行高，决定一行放几张；实际行高会在 `sizeRange` 内调整。"],
          ["`sizeRange`", "`[number, number]`", "`[230, 260]`", "允许的行高范围 `[最小, 最大]`。"],
          ["`maxItemWidth`", "`number`", "`975`", "单个元素的最大宽度。"],
          ["`maxStretchRatio`", "`number`", "`1.5`", "一行会不断加入新图片，直到填满整行所需的放大倍数不超过该值；缩小不设上限。"],
          ["`gap`", "`number`", "`8`", "元素之间的水平和垂直间距（px）。"],
          ["`buffer`", "`number`", "`1500`", "视口上下仍会渲染的缓冲距离（px）。"],
          ["`loadMoreThreshold`", "`number`", "`500`", "距离底部多远（px）时开始请求下一页。"],
          ["`mapSize`", "`(raw) => { width, height }`", "–", "把你的数据映射成宽高。"],
          ["`enableAnimation`", "`boolean`", "`true`", "预留参数，目前没有效果。"],
        ],
      ),
      note("这个组件目前**没有** `initialItems`/`initialHasMore`，首屏数据会在挂载后通过 `loadData` 加载。需要完全由你控制数据时，使用下面的 [Core 组件](#core)。"),

      h2("params", "参数如何协同工作"),
      h3("targetRowHeight 与 sizeRange"),
      p("这两个参数分工不同。`targetRowHeight` 决定**一行放几张图**：组件用它算出每张图的理想宽度，一直往行里添加，直到铺满整行所需的放大倍数不超过 `maxStretchRatio`。`sizeRange` 决定**最终的行高上下限**：把行高从「铺满所需的行高」限制进这个区间，随后再把每张图的宽度按比例分配，让整行刚好结束在容器边缘。"),
      figures(
        [smallRows.svg, `目标行高 50px：共 ${smallRows.rows} 行，每行图片更多。`],
        [bigRows.svg, `目标行高 100px：共 ${bigRows.rows} 行，每行图片更少。`],
      ),
      p("所以要让图片整体更大，要同时调高 `targetRowHeight` 和 `sizeRange`。只调高其中一个，行高会被另一个拉回去。"),
      h3("maxStretchRatio"),
      p("它控制「一行最多愿意把图片放大多少」。数值越小，一行就要拼进更多图片才肯结束，行内图片被放大的幅度越小；数值越大，行结束得越早，一行的图片更少，但每张图被放大得更多。**缩小不设上限**。"),
      figures(
        [loose.svg, `\`maxStretchRatio\` 为 1.5：共 ${loose.rows} 行。`],
        [strict.svg, `\`maxStretchRatio\` 为 1.2：共 ${strict.rows} 行，行内普遍更密。`],
      ),
      h3("maxItemWidth"),
      p("单张图的宽度上限。很宽的全景图如果不限制，会占满整行；限制之后，它会被截到 `maxItemWidth`，这一行的右侧可能因此留白。如果你希望整行始终铺满，请把它设成不小于容器宽度。"),
      h3("gap、buffer 与 loadMoreThreshold"),
      ul([
        "`gap` 同时是水平间距和行间距。",
        "`buffer` 是视口上下仍然渲染的距离。快速滚动时调大可以减少空白，代价是同时存在的节点更多。",
        "`loadMoreThreshold` 是触发下一页的提前量。网络慢时调大一点，让数据在用户滚到底之前到达。",
      ]),

      h2("behaviour", "行为说明"),
      ul([
        "行是贪心地拼出来的：只要填满当前这一行所需的放大倍数超过 `maxStretchRatio`，就继续加入图片；需要缩小时则不限制缩小的幅度。",
        "行高随后被限制在 `sizeRange` 内，宽度再按累积比例分配，使整行刚好结束在容器边缘，不会把舍入误差全留给最后一张图。",
        "**最后一行不会被拉伸**，保持自然比例（高度最多为 `targetRowHeight`），图片很少时不会被放大。下一页到来后，这一行会重新计算。",
        "任何元素都不会比 `maxItemWidth` 更宽，所以很宽的全景图不会占满整行。",
        "容器宽度变化（窗口缩放、标签页切换回来）时会重新计算全部行。",
      ]),
      p("完整的流程和公式见[等高布局算法详解](@/guides/equal-height-algorithm/)。"),

      h2("recipes", "常用配置"),
      table(
        ["场景", "参数", "效果"],
        [
          ["相册、摄影作品（大图）", "`targetRowHeight={320}` `sizeRange={[300, 360]}` `gap={8}`", "桌面宽度下每行 2 到 3 张，画面舒展。"],
          ["素材站、搜索结果（默认）", "`targetRowHeight={245}` `sizeRange={[230, 260]}` `gap={8}`", "桌面宽度下每行约 3 张，信息密度和观感比较均衡。"],
          ["缩略图墙", "`targetRowHeight={160}` `sizeRange={[140, 180]}` `gap={4}`", "桌面宽度下每行约 5 张，一屏能看到很多张。"],
          ["手机", "`targetRowHeight={120}` `sizeRange={[100, 140]}` `gap={4}`", "手机竖屏宽度下每行 2 张。"],
        ],
      ),
      h3("按断点切换配置"),
      p("这些参数都是普通的 prop，可以按屏幕宽度传入不同的值。注意把 `sizeRange` 提到组件外面或用 `useMemo`：它是布局计算的依赖项，每次渲染都传一个新数组会让全部行重新计算。"),
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

  return useMemo(
    () =>
      narrow
        ? { targetRowHeight: 120, sizeRange: [100, 140] as [number, number], gap: 4 }
        : { targetRowHeight: 245, sizeRange: [230, 260] as [number, number], gap: 8 },
    [narrow],
  );
}

<FullWidthEqualHeightMasonry {...useRowConfig()} loadData={loadData} renderItem={renderCard} />`),
      p("服务端渲染时没有 `window`，上面的 hook 在首次渲染使用桌面配置，挂载后再切换。更多响应式写法见[响应式布局](@/guides/responsive/)。"),

      h2("core", "受控用法：Core 组件"),
      p("如果数据已经由 React Query、SWR、Redux 之类自己管理，可以直接使用 `FullWidthEqualHeightMasonryCore`。它只负责排版、虚拟滚动和触底回调，不发请求，也不去重。"),
      code(`import { FullWidthEqualHeightMasonryCore } from "react-hybrid-masonry";

function Album() {
  const { photos, hasNextPage, isFetching, fetchNextPage } = usePhotos(); // 你自己的数据层

  // Core 需要每条数据自带 widthRatio，并且 items 的引用要稳定
  const items = useMemo(
    () => photos.map((p) => ({ ...p, widthRatio: p.width / p.height })),
    [photos],
  );

  return (
    <FullWidthEqualHeightMasonryCore
      items={items}
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
          ["`items`", "`any[]`", "必填", "全部已加载的数据，每条需要带 `widthRatio`（宽 / 高）。"],
          ["`renderItem`", "`(item, index) => ReactNode`", "必填", "同上。"],
          ["`onLoadMore`", "`() => void`", "–", "接近底部时调用。只有 `hasMore` 为真且 `loading` 为假时才会触发。"],
          ["`hasMore`", "`boolean`", "`true`", "是否还有更多数据。"],
          ["`loading`", "`boolean`", "`false`", "是否正在请求。请求期间设为 `true`，结束后改回 `false`，组件借此重新检查是否还要继续加载。"],
          ["`targetRowHeight`", "`number`", "`245`", "同上。"],
          ["`sizeRange`", "`[number, number]`", "`[230, 260]`", "同上。"],
          ["`maxItemWidth`", "`number`", "`975`", "同上。"],
          ["`maxStretchRatio`", "`number`", "`1.5`", "同上。"],
          ["`gap`", "`number`", "`8`", "同上。"],
          ["`buffer`", "`number`", "`1000`", "注意：和上面的组件默认值不同。"],
          ["`loadMoreThreshold`", "`number`", "`800`", "注意：和上面的组件默认值不同。"],
        ],
      ),
      note("`FullWidthEqualHeightMasonry` 内部就是在 Core 外面加了数据加载、翻页和 `widthRatio` 计算，所以排版行为完全一致。"),

      h2("compare", "和瀑布流怎么选"),
      table(
        ["", "FullWidthEqualHeightMasonry", "VirtualMasonry"],
        [
          ["排列方式", "按行，每行等高并铺满宽度", "按列，每个元素放进最短的一列"],
          ["图片比例", "每张图保持自己的比例，宽度各不相同", "列宽相同，高度按比例变化"],
          ["列数", "没有固定列数，随图片比例变化", "由 `minColumnWidth` 或 `columns` 决定"],
          ["卡片内容", "只适合图片为主，文字叠在图片上", "卡片高度可以不同，适合带说明文字的卡片"],
          ["末尾", "最后一行保持自然比例", "各列自然长短不一"],
          ["适用场景", "相册、素材库、搜索结果", "图片墙、商品流、内容卡片"],
        ],
      ),
      p("由接口或内容决定展示哪一种时，使用 [DynamicMasonryView](@/dynamic-view/)。"),

      h2("faq", "常见问题"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("相关：[等高布局算法详解](@/guides/equal-height-algorithm/)、[响应式布局](@/guides/responsive/)、[分页与无限滚动](@/guides/pagination/)、[性能调优](@/guides/performance/)。"),
    ),
  };
}
