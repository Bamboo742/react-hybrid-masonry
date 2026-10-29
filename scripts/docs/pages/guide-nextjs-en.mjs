import { code, h2, h3, join, note, p, table, ul } from "../helpers.mjs";

const faqs = [
  [
    "In the Next.js App Router I get \"You're importing a component that needs useState\" or a similar error.",
    "The components use React hooks and are published without a use client directive. Put the files that use them inside a client component that starts with use client, and do not import them directly in a server component.",
  ],
  [
    "The console warns about a hydration mismatch.",
    "The component itself does not cause it: during server rendering the container width is unknown, so the first render on both sides is an empty container. If you see a warning, check the content around renderItem, for example code that uses window, Date.now() or Math.random(), which differ between server and browser.",
  ],
  [
    "Can search engines index the images and content in the list?",
    "Not directly: the server HTML has no cards. For content that must be indexed, render a crawlable list on the server as well and keep it consistent with what users see, see the SEO section above.",
  ],
  [
    "next/dynamic with ssr: false says it is not allowed in Server Components.",
    "From Next.js 15 on, ssr: false can only be used in client components. Put the dynamic call in a file that starts with use client.",
  ],
  [
    "What do I need to do in a client-only project such as Vite or Create React App?",
    "Nothing, import and use it. The server-side limits above only matter for frameworks that render on the server.",
  ],
];

export default function nextjsGuide() {
  return {
    nav: "Next.js & SSR",
    title: "Using react-hybrid-masonry with Next.js and Server Rendering: Complete Guide",
    description:
      "How to use the React masonry components in the Next.js App Router, the Pages Router and other SSR frameworks: the use client directive, hydration safety, passing a prefetched first page with initialItems, next/image, SEO and crawlable content.",
    h1: "Next.js and server rendering",
    lead: "What can run on the server, what has to wait for the browser, and how to hand over a prefetched first page.",
    faq: faqs,
    body: join(
      h2("overview", "What runs on the server and what in the browser"),
      table(
        ["What", "Server", "Browser"],
        [
          ["Measuring the container width", "Not executed", "Measured right after mounting"],
          ["Computing item positions", "Not executed (width unknown)", "Computed once the width is measured"],
          ["Rendering cards (`renderItem`)", "**Not rendered**, the output is an empty container", "Rendered"],
          ["Requesting the first page", "You fetch it on the server and pass `initialItems`", "Requested after mounting when there is no `initialItems`"],
          ["Scrolling, paging, `IntersectionObserver`", "Not executed", "Executed"],
        ],
      ),
      p("In one sentence: on the server the component outputs only an empty placeholder container and everything starts in the browser. That makes hydration safe by nature, at the price that the server HTML contains no cards."),

      h2("use-client", "Add the use client directive"),
      p("The components use React hooks and are published without the directive. In the Next.js App Router, import them in a client file:"),
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
      p("The Pages Router does not need the directive; import the components in a page or a component as usual."),

      h2("initial", "Passing a prefetched first page"),
      p("Fetch page 1 in a server component and pass it as `initialItems`. The component starts from that data, shows **no** loading state and does **not** request page 1 again; the first `loadData` call requests page 2."),
      code(`// app/gallery/page.tsx (server component)
import Gallery from "./Gallery";

export default async function Page() {
  const res = await fetch("https://api.example.com/images?page=1&size=30", {
    next: { revalidate: 60 }, // cache the first page for 60 seconds
  });
  const first = await res.json();
  return <Gallery first={{ items: first.items, hasMore: first.hasMore }} />;
}`),
      note("`initialItems` is only available on `VirtualMasonry`. The first page of `DynamicMasonryView` and `FullWidthEqualHeightMasonry` is loaded on the client. When you want to prefetch and use the equal-height layout, the equal-height layout can currently only request its first page on the client."),
      p("`initialItems` passed to a client component has to be serializable plain data (objects, arrays, strings, numbers), without functions or class instances. Every item needs a width and a height, see [data and sizes](@/virtual-masonry/#data)."),

      h2("hydration", "Hydration is safe"),
      p("The layout effects use `useLayoutEffect` in the browser and fall back to `useEffect` on the server automatically. During server rendering the container width is unknown, so the first render on both sides is an empty container and there is no hydration mismatch. Positions are computed right after mounting, as soon as the width is measured."),
      p("Because cards are only rendered in the browser, using `window`, `Math.random()` and other values that only make sense on the client inside `renderItem` is safe and does not trigger hydration warnings."),

      h2("image", "Using next/image"),
      p("The root element of a card is absolutely positioned anyway, so you can give `next/image` the `fill` prop: it fills the card, whose size the layout decides. Write `sizes` according to the column width, otherwise Next downloads the largest size:"),
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
      p("The percentages in `sizes` should roughly match your column count: 4 columns is `25vw`. Image hosts have to be configured in `images.remotePatterns` in `next.config`."),

      h2("seo", "SEO: what is in the server HTML"),
      p("Because positions depend on the measured width, **the server HTML contains no cards** even when you pass `initialItems`. If search engines have to see this content, there are a few approaches that can be combined:"),
      ul([
        "**Give the content crawlable paginated URLs**: for example `/gallery?page=2`, render the plain list of that page on the server (links and text) and connect them with ordinary \"next page\" links.",
        "**Give every detail page its own URL** and put it in the sitemap. The list is only the way in; the detail pages are what gets indexed.",
        "**Use a self-referencing canonical on every paginated URL**: do not point page 2 and later at page 1, or the later pages are not indexed on their own.",
      ]),
      code(`// app/gallery/page.tsx: a list for crawlers next to the waterfall for users
import Gallery from "./Gallery";

// In Next.js 15 searchParams is a Promise; in 13 and 14 it is a plain object
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Number((await searchParams).page ?? 1);
  const data = await fetchImages(page, 30);

  return (
    <>
      <Gallery first={{ items: data.items, hasMore: data.hasMore }} />

      {/* Server-rendered and crawlable: a real, visible "browse all" entry that matches the waterfall */}
      <nav aria-label="Browse all images">
        <ul>
          {data.items.map((item: any) => (
            <li key={item.id}>
              <a href={"/gallery/" + item.id}>{item.title}</a>
            </li>
          ))}
        </ul>
        {data.hasMore && <a href={"/gallery?page=" + (page + 1)}>Next page</a>}
      </nav>
    </>
  );
}`),
      note("What crawlers see has to match what users see, and ideally it is visible and useful to users too (for example a \"browse all\" area in the footer). Do not use it to hide text users cannot see, or search engines may treat it as cloaking."),

      h2("filters", "Filters that come from the URL"),
      p("In the App Router, filters usually come from the URL. Pass the current query as the `key` of the client component and the list restarts from page 1 whenever the filters change:"),
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
      note("`useSearchParams` needs a `Suspense` boundary in statically rendered pages. Wrap only the small component that calls it, not the whole page, otherwise none of the page content is in the first response."),

      h2("lazy", "Lazy loading"),
      p("The layout only makes sense in the browser, so it can be split out of the first-screen bundle:"),
      code(`"use client";

import dynamic from "next/dynamic";

const Gallery = dynamic(() => import("./Gallery"), { ssr: false });`),
      p("Only do this when you do not rely on `initialItems` to avoid a loading flash. From Next.js 15 on, `ssr: false` can only be written in a client component."),

      h2("others", "Other frameworks"),
      ul([
        "**Client-only projects such as Vite or Create React App**: use it directly, there are no extra requirements.",
        "**Astro**: mount the React component that contains it with the `client:only=\"react\"` directive.",
        "**Remix and other SSR frameworks**: the component only outputs an empty container on the server, so it can be rendered directly; if your cards use browser-only APIs, wrap the whole block so it renders only after mounting, to be safe.",
      ]),
      code(`function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}`),

      h2("faq", "FAQ"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("Related: [initial data and SSR in VirtualMasonry](@/virtual-masonry/#ssr), [pagination and infinite scroll](@/guides/pagination/)."),
    ),
  };
}
