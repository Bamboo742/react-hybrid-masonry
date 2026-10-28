import React, { useCallback } from "react";
import VirtualMasonry from "../src/VirtualMasonry";
import { loadImageData } from "./imageData";
import DemoPanel from "./DemoPanel";
import PhotoCard from "./PhotoCard";
import { useGalleryStats } from "./useGalleryStats";
import { useI18n } from "./I18nContext";

const codeExample = `import { VirtualMasonry } from "react-hybrid-masonry";

function ImageGallery() {
  const loadData = async (page: number, pageSize: number) => {
    const res = await fetch(\`/api/images?page=\${page}&size=\${pageSize}\`);
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

export default function VirtualMasonryDemo() {
  const { t } = useI18n();
  const stats = useGalleryStats();

  const loadData = useCallback(
    async (page: number, pageSize: number) => {
      const result = await loadImageData(page, pageSize);
      stats.track(page, result.data.length);
      return result;
    },
    [stats.track],
  );

  return (
    <DemoPanel
      title={t.waterfall.title}
      description={t.waterfall.description}
      code={codeExample}
      stats={stats}
      galleryRef={stats.containerRef}
    >
      <VirtualMasonry
        loadData={loadData}
        pageSize={30}
        minColumnWidth={200}
        maxColumnWidth={350}
        gap={16}
        renderItem={(item) => (
          <PhotoCard key={item.id} item={item} variant="waterfall" />
        )}
      />
    </DemoPanel>
  );
}
