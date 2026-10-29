import React from "react";
import FullWidthEqualHeightMasonry from "../src/FullWidthEqualHeightMasonry";
import DemoPanel from "./DemoPanel";
import PhotoCard from "./PhotoCard";
import { useGalleryStats } from "./useGalleryStats";
import { useI18n } from "./I18nContext";

const codeExample = `import { FullWidthEqualHeightMasonry } from "react-hybrid-masonry";

function PhotoAlbum() {
  const loadData = async (page: number, pageSize: number) => {
    const res = await fetch(\`/api/photos?page=\${page}&size=\${pageSize}\`);
    const json = await res.json();
    return { data: json.items, hasMore: json.hasMore };
  };

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

export default function EqualHeightDemo() {
  const { t } = useI18n();
  const stats = useGalleryStats();

  return (
    <DemoPanel
      title={t.equalHeight.title}
      description={t.equalHeight.description}
      code={codeExample}
      stats={stats}
      galleryRef={stats.containerRef}
    >
      <FullWidthEqualHeightMasonry
        key={stats.mode}
        loadData={stats.load}
        pageSize={stats.pageSize}
        targetRowHeight={245}
        sizeRange={[230, 260]}
        maxItemWidth={975}
        gap={8}
        renderItem={(item) => (
          <PhotoCard key={item.id} item={item} variant="equal" />
        )}
      />
    </DemoPanel>
  );
}
