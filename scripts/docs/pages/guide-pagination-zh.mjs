import { code, figure, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { thresholdSvg } from "../diagram.mjs";

const faqs = [
  [
    "一打开页面就连续请求了好几页？",
    "每一页返回后，组件会立刻检查底部的触发元素是否还在视口附近。如果这一页的内容撑不满一屏（再加上 loadMoreThreshold 的提前量），就会马上请求下一页，直到内容超过视口。通常是 pageSize 太小，或者图片很矮。把 pageSize 调大到能填满两屏左右即可。",
  ],
  [
    "返回空数组并且 hasMore 为 true 会怎样？",
    "页码仍然会加一，组件认为这一页成功了，然后马上检查是否还要继续，于是连续请求后面的页，直到你返回 hasMore: false 或者内容填满视口。如果接口一直这样返回，就会形成不停的请求。空页请返回 hasMore: false。",
  ],
  [
    "我想要「加载更多」按钮，而不是自动加载？",
    "VirtualMasonry 和 FullWidthEqualHeightMasonry 只提供自动加载。需要按钮时，使用对应的 Core 组件：不传 onLoadMore，就不会有触底触发，然后在自己的按钮里请求下一页并把数据追加进 items。",
  ],
  [
    "从详情页返回后，怎么恢复到之前滚动到的位置和已加载的数据？",
    "组件本身不保存状态，卸载后数据就没有了。要恢复，请把已加载的所有页缓存在你自己的数据层里，用 Core 组件把它们作为 items 一次性传入，并自行处理滚动位置（例如进入详情前记录 window.scrollY，返回后恢复）。不要用 initialItems 传入多页数据：它被当作第 1 页，下一次请求会是第 2 页，会造成重复。",
  ],
  [
    "后端返回的是总页数或总条数，hasMore 怎么算？",
    "在你的 loadData 里算好再返回即可，例如 hasMore: page * pageSize < total，或者 hasMore: page < totalPages。组件只相信你返回的 hasMore。",
  ],
];

export default function paginationGuide() {
  const threshold = thresholdSvg({
    aria: "视口、buffer 渲染范围和 loadMoreThreshold 触发线的位置关系",
    viewport: "视口",
    buffer: "buffer：视口上下仍在渲染的范围",
    threshold: "loadMoreThreshold",
    trigger: "触发元素：位于容器底部",
  });

  return {
    nav: "分页与无限滚动",
    title: "react-hybrid-masonry 的分页与无限滚动完整指南",
    description:
      "react-hybrid-masonry 中 loadData、hasMore、loadMoreThreshold 与请求并发控制的工作方式，包含触发时机示意图、失败重试、游标分页、去重、与 React Query 配合以及常见问题。",
    h1: "分页与无限滚动",
    lead: "页是如何被请求的、下一页何时开始、出错时会怎样，以及如何重新开始。",
    faq: faqs,
    body: join(
      h2("contract", "loadData 约定"),
      code(`type LoadData = (
  page: number, // 从 1 开始，每成功请求一次加 1
  pageSize: number,
) => Promise<{ data: any[]; hasMore: boolean }>;`),
      p("组件会保存所有已加载的元素。`loadData` 只需返回新的一页，库会把它追加进去。页码由组件内部维护，不需要你自己计数。`hasMore` 为 `false` 之后不会再有任何请求。"),

      h2("lifecycle", "一页的生命周期"),
      table(
        ["阶段", "什么时候发生", "发生了什么"],
        [
          ["首次加载", "组件挂载时", "请求第 1 页（传了 `initialItems` 时不请求，下一次从第 2 页开始）。"],
          ["触发", "底部的触发元素进入「视口 + `loadMoreThreshold`」范围", "调用 `loadData(下一页页码, pageSize)`。"],
          ["进行中", "请求发出到响应返回之间", "不会再发出任何新请求。"],
          ["成功", "`loadData` resolve", "数据追加到列表，页码加一，`hasMore` 更新，然后立刻重新检查是否还要继续。"],
          ["失败", "`loadData` reject", "用 `console.error` 记录，`hasMore` 变为 `false`，停止自动翻页。"],
          ["结束", "`hasMore` 为 `false`", "触发元素不再被监听，不再请求。"],
        ],
      ),

      h2("trigger", "下一页何时开始"),
      p("布局底部有一个 1px 的标记元素，一个 `rootMargin` 为 `loadMoreThreshold` 的 `IntersectionObserver` 监听它，所以当底部距离视口还有 `loadMoreThreshold` px 时就会开始请求下一页。"),
      figure(
        threshold,
        "虚线框是 `buffer` 决定的渲染范围，蓝色实线框是视口。触发元素（容器底部的粗线）进入「视口加上 `loadMoreThreshold`」的范围时，就开始请求下一页。",
      ),
      p("每一页完成后，观察器会重新订阅并立刻检查当前状态：如果标记元素仍然在视口附近（快速滚动超过了内容），就马上开始下一页，不会因为「没有再穿越边界」而卡住。"),
      h3("loadMoreThreshold 与 pageSize 怎么选"),
      ul([
        "用户滚动很快或接口较慢时，调大 `loadMoreThreshold`，让数据在用户滚到底之前到达。代价是会加载用户可能永远滚不到的数据。",
        "`pageSize` 要能填满超过一屏。粗略的算法：一屏能放下的元素数约等于「视口高度 ÷ 平均元素高度 × 列数」，`pageSize` 取它的两倍左右。页太小时，每次响应后触发元素仍然可见，请求会一个接一个连续发出。",
        "页太大会拖慢首屏和单次请求的耗时。可以从 30 到 50 开始，按接口的实际速度调整。",
      ]),

      h2("concurrency", "同一时间只有一个请求"),
      p("已有请求在进行时，不会再开始新的请求。这个判断是同步的，所以同一帧里连续触发多次也只会发出一个请求，响应也不会乱序，页码和数据始终对得上。"),
      note("因为请求严格按页码顺序、一次一个地发出，所以你的 `loadData` 里可以放心使用闭包里的游标（见下面的游标分页），不需要处理并发。"),

      h2("end", "显示「没有更多了」"),
      p("组件不渲染列表末尾的提示。需要时，在你自己的 `loadData` 里记录 `hasMore`，在列表下方显示："),
      code(`function Board() {
  const [done, setDone] = useState(false);

  const loadData = useCallback(async (page: number, pageSize: number) => {
    const res = await fetchImages(page, pageSize);
    if (!res.hasMore) setDone(true);
    return res;
  }, []);

  return (
    <>
      <VirtualMasonry loadData={loadData} renderItem={renderCard} />
      {done && <p style={{ textAlign: "center" }}>没有更多了</p>}
    </>
  );
}`),

      h2("errors", "请求失败时"),
      p("`loadData` 被 reject 时，会用 `console.error` 记录，并**停止自动翻页**（`hasMore` 变为 `false`），避免标记元素仍可见时，坏掉的接口被无限循环调用。你可以按需选择恢复方式："),
      ul([
        "用新的 `key` 重新挂载组件，从第 1 页重新开始。",
        "在你自己的 `loadData` 里重试：重试成功就正常返回；全部重试都失败，就把错误抛出去，让组件停止翻页。",
      ]),
      note("**不要**在失败后返回 `{ data: [], hasMore: true }` 来「让翻页继续」：组件认为这一页成功了，页码会加一，失败的那一页就被跳过了。要继续就在函数里重试同一页。"),
      h3("带退避的重试"),
      code(`async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500)); // 0.5s、1s、2s、4s
    }
  }
  throw lastError; // 仍然失败：交给组件，停止翻页
}

const loadData = (page: number, size: number) => withRetry(() => fetchImages(page, size));`),

      h2("cursor", "游标分页"),
      p("`loadData` 的参数是页码，但接口用游标（`cursor`）时，把游标放在闭包里即可。页码只用来判断是不是重新开始："),
      code(`function useCursorLoader(fetchPage: (args: { cursor: string | null; limit: number }) => Promise<{ items: any[]; nextCursor: string | null }>) {
  const cursorRef = useRef<string | null>(null);

  return useCallback(
    async (page: number, pageSize: number) => {
      if (page === 1) cursorRef.current = null; // 重新开始时清掉游标
      const res = await fetchPage({ cursor: cursorRef.current, limit: pageSize });
      cursorRef.current = res.nextCursor;
      return { data: res.items, hasMore: res.nextCursor !== null };
    },
    [fetchPage],
  );
}`),
      p("数据在用户浏览期间会有新增或删除时，游标分页比页码分页更稳：页码分页会因为前面插入了数据而在两页里返回同一条记录。"),

      h2("reset", "筛选条件变化时重新开始"),
      p("组件挂载时加载第 1 页，之后不会自己重新加载。查询条件变化时，请重新挂载它："),
      code(`<VirtualMasonry
  key={JSON.stringify(filters)}
  loadData={(page, size) => fetchImages({ ...filters, page, size })}
  renderItem={renderCard}
/>`),
      p("`key` 变化会卸载旧组件，状态（已加载的数据、页码、是否还有更多）都会清空。你放在外面的辅助状态（比如上面的 `done`）需要自己一起重置。"),

      h2("dedupe", "去重"),
      p("库不会去除重复数据。如果你的接口可能在两页里返回同一条记录（比如用户滚动期间有新数据插入），请在 `loadData` 里自行去重，并保证 `key` 稳定且唯一："),
      code(`function useDedupedLoader() {
  const seen = useRef(new Set<number>());

  return useCallback(async (page: number, pageSize: number) => {
    if (page === 1) seen.current.clear();
    const res = await fetchImages(page, pageSize);
    const fresh = res.items.filter((item) => !seen.current.has(item.id));
    fresh.forEach((item) => seen.current.add(item.id));
    return { data: fresh, hasMore: res.hasMore }; // 返回的条数少于 pageSize 没有关系
  }, []);
}`),

      h2("query", "配合 React Query、SWR 等数据层"),
      p("数据已经由别的库管理时，使用 Core 组件，把请求状态交给它们：Core 只负责排版和触底回调。"),
      code(`import { useInfiniteQuery } from "@tanstack/react-query";
import { VirtualMasonryCore } from "react-hybrid-masonry";

function Board() {
  const query = useInfiniteQuery({
    queryKey: ["pins"],
    queryFn: ({ pageParam }) => fetchPins(pageParam, 30),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.hasMore ? all.length + 1 : undefined),
  });

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  return (
    <VirtualMasonryCore
      items={items}
      hasMore={query.hasNextPage}
      loading={query.isFetching}
      onLoadMore={() => query.fetchNextPage()}
      renderItem={(item) => <Card key={item.id} item={item} />}
    />
  );
}`),
      note("Core 要求每条数据有 `width` 和 `height`（等高布局的 Core 要求 `widthRatio`），并且 `items` 的引用要稳定，见 [VirtualMasonry](@/virtual-masonry/#core) 和 [FullWidthEqualHeightMasonry](@/equal-height/#core)。上面使用的是 TanStack Query v5 的写法，只作示意。"),

      h2("dynamic", "配合 DynamicMasonryView"),
      p("`DynamicMasonryView` 会自己调用第 1 页来获取布局类型，并把这份响应交给内部布局，所以第 1 页只请求一次。受控的 `isMasonry` 属性变化会重新挂载内部布局，并再次请求第 1 页，详见 [DynamicMasonryView](@/dynamic-view/#modes)。"),

      h2("faq", "常见问题"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("相关：[VirtualMasonry](@/virtual-masonry/)、[FullWidthEqualHeightMasonry](@/equal-height/)、[性能调优](@/guides/performance/)。"),
    ),
  };
}
