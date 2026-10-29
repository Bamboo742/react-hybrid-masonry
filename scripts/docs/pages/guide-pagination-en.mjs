import { code, figure, h2, h3, join, note, p, table, ul } from "../helpers.mjs";
import { thresholdSvg } from "../diagram.mjs";

const faqs = [
  [
    "Several pages are requested in a row as soon as the page opens.",
    "After every page the component immediately checks whether the trigger at the bottom is still near the viewport. If a page does not fill the screen (plus the loadMoreThreshold look-ahead), the next page is requested right away, until the content is taller than the viewport. It is usually a pageSize that is too small, or very short images. Raise pageSize so it fills about two screens.",
  ],
  [
    "What happens if I return an empty array with hasMore set to true?",
    "The page number still goes up and the component treats the page as successful, then checks again at once whether it should continue, so it keeps requesting the following pages until you return hasMore: false or the content fills the viewport. If the API keeps answering like that, requests never stop. For an empty page return hasMore: false.",
  ],
  [
    "I want a Load more button instead of automatic loading.",
    "VirtualMasonry and FullWidthEqualHeightMasonry only load automatically. For a button, use the matching Core component: without onLoadMore there is no bottom trigger, and your own button requests the next page and appends the data to items.",
  ],
  [
    "How do I restore the scroll position and the loaded data after coming back from a detail page?",
    "The component does not keep state, so the data is gone once it is unmounted. To restore, cache all loaded pages in your own data layer, pass them to a Core component as items in one go, and restore the scroll position yourself (for example store window.scrollY before navigating and restore it on return). Do not pass several pages as initialItems: it is treated as page 1, so the next request is page 2 and you get duplicates.",
  ],
  [
    "My backend returns a total page or item count. How do I compute hasMore?",
    "Compute it in your loadData and return it, for example hasMore: page * pageSize < total, or hasMore: page < totalPages. The component only trusts the hasMore you return.",
  ],
];

export default function paginationGuide() {
  const threshold = thresholdSvg({
    aria: "How the viewport, the buffer render range and the loadMoreThreshold trigger line relate",
    viewport: "Viewport",
    buffer: "buffer: range still rendered around the viewport",
    threshold: "loadMoreThreshold",
    trigger: "Trigger element at the container bottom",
  });

  return {
    nav: "Pagination & infinite scroll",
    title: "Pagination and Infinite Scroll in react-hybrid-masonry: Complete Guide",
    description:
      "How loadData, hasMore, loadMoreThreshold and request concurrency control work in react-hybrid-masonry, with a trigger diagram, retries, cursor pagination, de-duplication, using React Query and a FAQ.",
    h1: "Pagination and infinite scroll",
    lead: "How pages are requested, when the next page starts, what happens on errors and how to start over.",
    faq: faqs,
    body: join(
      h2("contract", "The loadData contract"),
      code(`type LoadData = (
  page: number, // starts at 1 and increases by 1 for every successful request
  pageSize: number,
) => Promise<{ data: any[]; hasMore: boolean }>;`),
      p("The component keeps all loaded items. `loadData` only returns the new page and the library appends it. The page number is kept internally, you do not have to count. Once `hasMore` is `false` no request is made any more."),

      h2("lifecycle", "The life cycle of a page"),
      table(
        ["Stage", "When", "What happens"],
        [
          ["First load", "When the component mounts", "Requests page 1 (not when `initialItems` is passed; the next request is then page 2)."],
          ["Trigger", "The trigger element at the bottom enters \"viewport + `loadMoreThreshold`\"", "Calls `loadData(next page, pageSize)`."],
          ["In flight", "Between sending the request and its response", "No new request is started."],
          ["Success", "`loadData` resolves", "The data is appended, the page number goes up, `hasMore` is updated, and the component immediately checks whether it should continue."],
          ["Failure", "`loadData` rejects", "Logged with `console.error`, `hasMore` becomes `false` and automatic paging stops."],
          ["Done", "`hasMore` is `false`", "The trigger is no longer observed and nothing is requested."],
        ],
      ),

      h2("trigger", "When the next page starts"),
      p("A 1px marker sits at the bottom of the layout and an `IntersectionObserver` with a `rootMargin` of `loadMoreThreshold` watches it, so the next page is requested while the bottom is still `loadMoreThreshold` px away from the viewport."),
      figure(
        threshold,
        "The dashed frame is the render range set by `buffer`, the blue solid frame is the viewport. When the trigger element (the thick line at the container bottom) enters \"viewport plus `loadMoreThreshold`\", the next page is requested.",
      ),
      p("After every page the observer subscribes again and immediately checks the current state: if the marker is still near the viewport (fast scrolling outran the content), the next page starts at once, so it never gets stuck because \"no boundary was crossed\"."),
      h3("Choosing loadMoreThreshold and pageSize"),
      ul([
        "When users scroll fast or the API is slow, raise `loadMoreThreshold` so data arrives before the user reaches the bottom. The price is loading data the user may never scroll to.",
        "`pageSize` has to fill more than one screen. A rough way to estimate: the number of items that fit one screen is about \"viewport height ÷ average item height × columns\", and `pageSize` should be about twice that. With a page that is too small the trigger is still visible after every response, and requests are sent one after another.",
        "A page that is too large slows the first screen and every single request. Start at 30 to 50 and adjust to the real speed of your API.",
      ]),

      h2("concurrency", "One request at a time"),
      p("While a request is in flight no new one is started. The check is synchronous, so several triggers within the same frame still send a single request, responses cannot arrive out of order, and page numbers always match the data."),
      note("Because requests are sent strictly in page order, one at a time, you can safely use a cursor kept in a closure inside your `loadData` (see cursor pagination below) without handling concurrency."),

      h2("end", "Showing an end-of-list message"),
      p("The component does not render anything at the end of the list. If you want a message, record `hasMore` in your own `loadData` and show it under the list:"),
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
      {done && <p style={{ textAlign: "center" }}>That is everything</p>}
    </>
  );
}`),

      h2("errors", "When a request fails"),
      p("When `loadData` rejects, the error is logged with `console.error` and **automatic paging stops** (`hasMore` becomes `false`), so a broken API is not called in an endless loop while the marker is still visible. You can recover in the way that suits you:"),
      ul([
        "Remount the component with a new `key` to start again from page 1.",
        "Retry inside your own `loadData`: return normally once a retry succeeds; if every retry fails, throw the error so the component stops paging.",
      ]),
      note("Do **not** return `{ data: [], hasMore: true }` after a failure to \"keep paging\": the component treats the page as successful and the page number goes up, so the failed page is skipped. To continue, retry the same page inside the function."),
      h3("Retrying with backoff"),
      code(`async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500)); // 0.5s, 1s, 2s, 4s
    }
  }
  throw lastError; // still failing: hand it to the component, which stops paging
}

const loadData = (page: number, size: number) => withRetry(() => fetchImages(page, size));`),

      h2("cursor", "Cursor pagination"),
      p("The argument of `loadData` is a page number, but when your API uses a `cursor`, keep the cursor in a closure. The page number only tells you whether it is a restart:"),
      code(`function useCursorLoader(fetchPage: (args: { cursor: string | null; limit: number }) => Promise<{ items: any[]; nextCursor: string | null }>) {
  const cursorRef = useRef<string | null>(null);

  return useCallback(
    async (page: number, pageSize: number) => {
      if (page === 1) cursorRef.current = null; // clear the cursor on a restart
      const res = await fetchPage({ cursor: cursorRef.current, limit: pageSize });
      cursorRef.current = res.nextCursor;
      return { data: res.items, hasMore: res.nextCursor !== null };
    },
    [fetchPage],
  );
}`),
      p("When data is added or removed while the user browses, cursor pagination is steadier than page numbers: with page numbers an insertion in front makes the same record appear on two pages."),

      h2("reset", "Starting over when filters change"),
      p("The component loads page 1 when it mounts and never reloads by itself. When the query changes, remount it:"),
      code(`<VirtualMasonry
  key={JSON.stringify(filters)}
  loadData={(page, size) => fetchImages({ ...filters, page, size })}
  renderItem={renderCard}
/>`),
      p("A changed `key` unmounts the old component, and its state (loaded data, page number, whether more exists) is cleared. Helper state you keep outside (such as `done` above) has to be reset by you."),

      h2("dedupe", "De-duplication"),
      p("The library does not remove duplicates. If your API may return the same record on two pages (for example because new data was inserted while the user scrolled), de-duplicate inside `loadData` and keep the `key` stable and unique:"),
      code(`function useDedupedLoader() {
  const seen = useRef(new Set<number>());

  return useCallback(async (page: number, pageSize: number) => {
    if (page === 1) seen.current.clear();
    const res = await fetchImages(page, pageSize);
    const fresh = res.items.filter((item) => !seen.current.has(item.id));
    fresh.forEach((item) => seen.current.add(item.id));
    return { data: fresh, hasMore: res.hasMore }; // returning fewer than pageSize items is fine
  }, []);
}`),

      h2("query", "Using React Query, SWR and similar"),
      p("When another library manages the data, use the Core component and let that library own the request state: Core only does layout and the near-the-bottom callback."),
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
      note("Core needs a `width` and a `height` on every item (the equal-height Core needs `widthRatio`) and a stable `items` reference, see [VirtualMasonry](@/virtual-masonry/#core) and [FullWidthEqualHeightMasonry](@/equal-height/#core). The code uses the TanStack Query v5 API and is only a sketch."),

      h2("dynamic", "With DynamicMasonryView"),
      p("`DynamicMasonryView` requests page 1 itself to learn the layout type and hands that response to the inner layout, so page 1 is requested only once. A change of the controlled `isMasonry` prop remounts the inner layout and requests page 1 again, see [DynamicMasonryView](@/dynamic-view/#modes)."),

      h2("faq", "FAQ"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("Related: [VirtualMasonry](@/virtual-masonry/), [FullWidthEqualHeightMasonry](@/equal-height/), [performance tuning](@/guides/performance/)."),
    ),
  };
}
