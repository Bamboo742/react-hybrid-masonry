import React, { ReactNode, RefObject, useState } from "react";
import CodeBlock from "./CodeBlock";
import { CodeIcon } from "./Icons";
import { useI18n } from "./I18nContext";
import type { DataMode } from "./useGalleryStats";

interface DemoPanelProps {
  title: string;
  description: string;
  code: string;
  stats: {
    loaded: number;
    inDom: number;
    mode: DataMode;
    setMode: (mode: DataMode) => void;
  };
  galleryRef: RefObject<HTMLDivElement>;
  // 面板左侧的额外控件（动态布局的切换按钮）
  controls?: ReactNode;
  children: ReactNode;
}

// 三个演示共用的外壳：标题、说明、实时指标、可展开的示例代码，下面是画廊本身。
export default function DemoPanel({
  title,
  description,
  code,
  stats,
  galleryRef,
  controls,
  children,
}: DemoPanelProps) {
  const [showCode, setShowCode] = useState(false);
  const { t } = useI18n();

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          aria-expanded={showCode}
          onClick={() => setShowCode((v) => !v)}
        >
          <CodeIcon />
          {showCode ? t.panel.hideCode : t.panel.showCode}
        </button>
      </div>

      <div className="panel-bar">
        <div className="panel-controls">
          {controls}
          <div className="seg" role="group" aria-label={t.panel.dataset}>
            <button type="button" aria-pressed={stats.mode === "infinite"} onClick={() => stats.setMode("infinite")}>
              {t.panel.infinite}
            </button>
            <button type="button" aria-pressed={stats.mode === "tenk"} onClick={() => stats.setMode("tenk")}>
              {t.panel.tenk}
            </button>
          </div>
        </div>
        <dl className="stats">
          <div>
            <dt>{t.panel.loaded}</dt>
            <dd>{stats.loaded.toLocaleString()}</dd>
          </div>
          <div>
            <dt>{t.panel.inDom}</dt>
            <dd>{stats.inDom.toLocaleString()}</dd>
          </div>
          <div>
            <dt>{t.panel.rendered}</dt>
            <dd>{stats.loaded > 0 ? ((stats.inDom / stats.loaded) * 100).toFixed(stats.loaded >= 1000 ? 1 : 0) + "%" : "–"}</dd>
          </div>
        </dl>
      </div>

      {showCode && <CodeBlock code={code} />}

      <div ref={galleryRef} className="gallery">
        {children}
      </div>
    </section>
  );
}
