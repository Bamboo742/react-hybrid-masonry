import React, { ReactNode, RefObject, useState } from "react";
import CodeBlock from "./CodeBlock";
import { CodeIcon } from "./Icons";
import { useI18n } from "./I18nContext";

interface DemoPanelProps {
  title: string;
  description: string;
  code: string;
  stats: { loaded: number; inDom: number };
  galleryRef: RefObject<HTMLDivElement>;
  // 面板右侧的额外控件（动态布局的切换按钮）
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
        {controls ? <div className="panel-controls">{controls}</div> : <span />}
        <dl className="stats">
          <div>
            <dt>{t.panel.loaded}</dt>
            <dd>{stats.loaded.toLocaleString()}</dd>
          </div>
          <div>
            <dt>{t.panel.inDom}</dt>
            <dd>{stats.inDom.toLocaleString()}</dd>
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
