import { code, h2, h3, join, note, p, table, ul } from "../helpers.mjs";

const faqs = [
  [
    "Cards are blank or images pop in when I scroll fast.",
    "buffer is too small, or image requests cannot keep up with the scrolling. Raise buffer a bit so content further away is mounted earlier, and give images loading=\"lazy\" and thumbnails of a fitting size. While you tune buffer, watch the number of cards and image requests that exist at the same time and do not keep raising it.",
  ],
  [
    "CPU usage is high and the frame rate is low while scrolling.",
    "The most common cause is cards that are not wrapped in React.memo: while scrolling the component may call renderItem every frame. Use the React Profiler to see which components render again and again, then check the cards for expensive calculations, objects or functions recreated on every render, and heavy shadows or filters.",
  ],
  [
    "It gets slow after tens of thousands of items are loaded.",
    "The number of rendered nodes is set by buffer and does not depend on the total. Only the layout calculation and the data kept in memory depend on the total, see \"What the layout calculation costs\" below. If the list can really grow without end, consider capping the number of items, or manage a sliding data window yourself with a Core component.",
  ],
  [
    "The whole list flashes after I changed sizeRange or an options object.",
    "The layout is recalculated whenever its options change: passing a new sizeRange array reference every time recalculates all rows. Move it outside the component or keep the reference stable with useMemo.",
  ],
  [
    "Lighthouse says the images are too large.",
    "Use thumbnails close to the displayed size. Inside renderItem you have the displayed width of the card as item.width, and you can request an image of that width from your image service.",
  ],
];

export default function performanceGuide() {
  // Estimate of how many cards exist at once: render band = viewport height + one buffer above and below
  const viewport = 900;
  const band = (buffer) => viewport + 2 * buffer;
  const wfCards = (buffer) => Math.round((band(buffer) / (300 + 16)) * 6); // 6 columns, average height 300, gap 16
  const eqCards = (buffer) => Math.round((band(buffer) / (245 + 8)) * 3); // row height 245, gap 8, about 3 per row

  return {
    nav: "Performance tuning",
    title: "React Virtual Masonry Performance Tuning: buffer, Threshold, Images and Cards",
    description:
      "Practical advice for keeping a very long React masonry gallery smooth: the buffer and loadMoreThreshold trade-offs, how many cards render at once, what the layout calculation costs, memoized cards, image sizes and lazy loading, LCP and CLS, and how to measure.",
    h1: "Performance tuning",
    lead: "What the library already does for you, and what your own cards should check.",
    faq: faqs,
    body: join(
      h2("built-in", "What is already optimised"),
      ul([
        "Only elements inside the viewport plus `buffer` are mounted; the rest costs nothing in the DOM.",
        "The scroll position is updated at most once per animation frame (`requestAnimationFrame`).",
        "Item objects keep the same reference while scrolling and only change when the items or the container width change, so memoized children do not re-render on every scroll.",
        "The layout is cached with `useMemo`, so scrolling never recalculates positions.",
        "Scroll state lives inside the component, so your parent component does not re-render on every frame.",
      ]),
      note("While scrolling, the component calls `renderItem` again every frame (for the visible items only). So **cards must be wrapped in `React.memo`**: the library keeps the item references stable, and that is what lets memo actually work."),

      h2("measure", "Measure first, then adjust"),
      p("Before tuning, know the current state. The simplest metric is how many cards are in the DOM right now: put a marker on the card root and run this in the console:"),
      code(`// put data-card on the card root, then:
document.querySelectorAll("[data-card]").length`),
      table(
        ["To find out", "Use"],
        [
          ["How many cards are rendered at once", "The one-line console snippet above, or the Elements panel"],
          ["Which components re-render while scrolling", "React DevTools Profiler with \"record why each component rendered\" on"],
          ["Whether scrolling drops frames and where the time goes", "The Performance panel of Chrome DevTools, record a scroll"],
          ["How many image requests are in flight", "The Network panel filtered by Img"],
          ["The overall score", "Lighthouse on a production build, once for desktop and once for mobile"],
        ],
      ),

      h2("band", "How many cards render at once"),
      p("The render range extends `buffer` above and below the viewport, so the number of elements that exist at once is roughly \"(viewport height + 2 × buffer) ÷ height one element takes × elements per row\". For a 900px tall viewport here are estimates (an order of magnitude only, the real figure depends on card height and columns):"),
      table(
        ["`buffer`", "Render band height", "Waterfall (6 columns, average height 300, gap 16)", "Equal height (row height 245, gap 8, about 3 per row)"],
        [500, 1000, 1500, 3000].map((b) => [
          `${b}px`,
          `${band(b)}px`,
          `about ${wfCards(b)} cards`,
          `about ${eqCards(b)} images`,
        ]),
      ),
      p("The default `buffer` is `1500`: a few dozen cards exist at a time and fast scrolling shows almost no blank space. On weak machines or with heavy cards you can lower it to `500` to `1000`; on pages with many heavy images, halving it often reduces the number of simultaneous image requests noticeably."),
      h3("buffer"),
      p("`buffer` (default `1500`) is the distance above and below the viewport that always stays mounted. A larger value leaves less blank space during fast scrolling but mounts more cards and requests more images at once; a smaller value is cheaper, but you can see content load during fast scrolling."),
      note("When tuning `buffer` and `loadMoreThreshold`, watch the number of image requests and your performance score together, and do not keep raising a value just because the screen looks better."),
      h3("loadMoreThreshold"),
      p("A larger `loadMoreThreshold` starts the next request earlier, which hides latency but loads data the user may never scroll to. Choose it by API latency and page size, see [pagination and infinite scroll](@/guides/pagination/#trigger)."),

      h2("layout-cost", "What the layout calculation costs"),
      p("Whenever the list of items or the container width changes, the positions of all loaded items are recalculated once, and the cost grows in proportion to the number of items. Scrolling itself **never** triggers a recalculation. Below are timings of the layout algorithm alone in Node on a development machine (without React rendering, an order of magnitude only):"),
      table(
        ["Loaded items", "Waterfall", "Equal height"],
        [
          ["1,000", "under 1 ms", "about 2 ms"],
          ["10,000", "about 1 ms", "about 7 ms"],
          ["50,000", "about 15 ms", "about 30 ms"],
        ],
      ),
      ul([
        "So the layout itself is negligible for every loaded page and every window drag; what is really expensive is rendering cards, which `buffer` and the complexity of your cards decide.",
        "**Keep option references stable**: `sizeRange` is a dependency of the layout calculation, and writing `sizeRange={[230, 260]}` inline in JSX makes a new array whenever the parent re-renders, so all rows are recalculated. Move it outside the component or use `useMemo`.",
        "`mapSize` is read through a ref, so passing an inline function does not trigger a new layout.",
      ]),
      code(`// Good: stable reference
const SIZE_RANGE: [number, number] = [230, 260];
<FullWidthEqualHeightMasonry sizeRange={SIZE_RANGE} /* ... */ />

// Less good: a new array on every parent render recalculates all rows
<FullWidthEqualHeightMasonry sizeRange={[230, 260]} /* ... */ />`),

      h2("images", "Images"),
      ul([
        "Give every item a real `width` and `height` in your data. The layout is computed from them before the images load, so nothing jumps when an image arrives.",
        "Add `loading=\"lazy\"` and `decoding=\"async\"` to images and use thumbnails close to the displayed size.",
        "Use `object-fit: cover` so images do not distort when rounding makes the sizes differ slightly.",
      ]),
      code(`<img src={item.thumb} alt={item.title} width={item.width} height={item.height}
     loading="lazy" decoding="async"
     style={{ width: "100%", height: "100%", objectFit: "cover" }} />`),
      h3("Request images at the displayed size"),
      p("Inside `renderItem` you have the displayed width of the card, and multiplied by the device pixel ratio it is the image width you should request. If your image service resizes by width, you do not have to download the same large image on every screen:"),
      code(`function thumbUrl(url: string, cssWidth: number) {
  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  return url + "?w=" + Math.ceil(cssWidth * dpr); // replace with your image service's parameter
}

<img src={thumbUrl(item.url, item.width)} alt={item.title} loading="lazy" decoding="async" />`),

      h2("cards", "Cards"),
      ul([
        "Wrap the card in `React.memo`. Because item references are stable, it only re-renders when its own data changes.",
        "Keep `renderItem` light. Do not create observers or heavy state in every card; share them when you can.",
        "Always set `key={item.id}` on the element you return.",
        "Keep hover effects to `transform` and `opacity` where possible, and avoid large `box-shadow` changes or `filter` on every card.",
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
      p("Pick a page size that fills more than one screen (including the preload threshold). A page that is too small causes chained requests and one that is too large slows the first screen. Start with 30 to 50."),

      h2("vitals", "LCP and CLS"),
      ul([
        "**LCP**: the first few images at the top are often the LCP element. Do not give them `loading=\"lazy\"` and consider `fetchpriority=\"high\"`. Inside `renderItem` you can decide by position: when the list is near the top of the page, items with `item.y < 600` are on the first screen.",
        "**CLS**: images themselves cause no layout shift, because sizes come from the data and positions are fixed before an image loads. Mind the **content below the list**: the container is 0 tall before data arrives and grows afterwards, pushing what follows (a footer, for example) down. Wrapping the list in a `minHeight` (for example `100vh`) avoids that shift.",
        "**INP**: keep click handlers in cards light and move heavy work to the next frame.",
      ]),
      code(`renderItem={(item) => (
  <Card
    key={item.id}
    item={item}
    eager={item.y < 600} // first-screen images: no lazy loading and a higher priority
  />
)}

// Inside Card:
<img
  src={item.thumb}
  alt={item.title}
  loading={eager ? "eager" : "lazy"}
  fetchPriority={eager ? "high" : "auto"}
/>`),
      p("The `fetchPriority` prop is recognised from React 19 on; with earlier React versions use the lowercase `fetchpriority`."),
      note("Measure these page metrics on a production build, once for desktop and once for mobile. Results from development mode are not meaningful."),

      h2("checklist", "Checklist"),
      table(
        ["Check", "Why"],
        [
          ["The card is wrapped in `React.memo` and `key` is `item.id`", "`renderItem` is called every frame while scrolling"],
          ["Every item has an accurate width and height", "Positions are computed before images load, nothing jumps"],
          ["Images are right-sized thumbnails with `loading=\"lazy\"`, except on the first screen", "Controls simultaneous requests and traffic"],
          ["Array options such as `sizeRange` have a stable reference", "Avoids a new layout on every render"],
          ["`buffer` and `loadMoreThreshold` are tuned from measurements", "A trade-off between blank space and cost"],
          ["The list has a `minHeight` around it", "Avoids CLS from content being pushed down"],
          ["Lighthouse is run on a production build", "Numbers from development mode cannot be trusted"],
        ],
      ),

      h2("faq", "FAQ"),
      ...faqs.map(([q, a]) => join(h3(q), p(a))),
      note("Related: [pagination and infinite scroll](@/guides/pagination/), [responsive layouts](@/guides/responsive/), [VirtualMasonry](@/virtual-masonry/)."),
    ),
  };
}
