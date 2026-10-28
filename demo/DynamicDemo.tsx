import React, { useCallback, useState } from "react";
import DynamicMasonryView from "../src/DynamicMasonryView";
import { loadImageData } from "./imageData";
import DemoPanel from "./DemoPanel";
import PhotoCard from "./PhotoCard";
import { useGalleryStats } from "./useGalleryStats";
import { useI18n } from "./I18nContext";

const codeExample = `import { DynamicMasonryView } from "react-hybrid-masonry";

function Gallery() {
  const [isMasonry, setIsMasonry] = useState(true); // true = waterfall, false = equal-height

  const loadData = async (page: number, pageSize: number) => {
    const res = await fetch(\`/api/gallery?page=\${page}&size=\${pageSize}\`);
    const json = await res.json();
    return { data: json.items, hasMore: json.hasMore };
  };

  return (
    <DynamicMasonryView
      isMasonry={isMasonry}
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
          }}
        >
          <img src={item.url} alt={item.title} />
        </div>
      )}
    />
  );
}`;

export default function DynamicDemo() {
  const { t } = useI18n();
  const [isMasonry, setIsMasonry] = useState(true);
  const stats = useGalleryStats();

  const loadData = useCallback(
    async (page: number, pageSize: number) => {
      const result = await loadImageData(page, pageSize);
      stats.track(page, result.data.length);
      // 第一次请求里带上布局类型，这是接口驱动布局的写法
      return page === 1 ? { ...result, isMasonry } : result;
    },
    [stats.track, isMasonry],
  );

  const choose = (next: boolean) => {
    if (next === isMasonry) return;
    stats.reset();
    setIsMasonry(next);
  };

  const controls = (
    <div className="seg" role="group" aria-label={t.dynamic.layout}>
      <button type="button" aria-pressed={isMasonry} onClick={() => choose(true)}>
        {t.dynamic.waterfallBtn}
      </button>
      <button type="button" aria-pressed={!isMasonry} onClick={() => choose(false)}>
        {t.dynamic.equalHeightBtn}
      </button>
    </div>
  );

  return (
    <DemoPanel
      title={t.dynamic.title}
      description={t.dynamic.description}
      code={codeExample}
      stats={stats}
      galleryRef={stats.containerRef}
      controls={controls}
    >
      <DynamicMasonryView
        key={isMasonry ? "masonry" : "equal"}
        isMasonry={isMasonry}
        loadData={loadData}
        pageSize={30}
        waterfallConfig={{ minColumnWidth: 200, maxColumnWidth: 350, gap: 16 }}
        equalHeightConfig={{
          targetRowHeight: 245,
          sizeRange: [230, 260],
          gap: 8,
        }}
        renderItem={(item, _index, masonry) => (
          <PhotoCard
            key={item.id}
            item={item}
            variant={masonry ? "waterfall" : "equal"}
          />
        )}
      />
    </DemoPanel>
  );
}
