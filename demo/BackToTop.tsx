import React from "react";
import { ArrowUpIcon } from "./Icons";
import { useI18n } from "./I18nContext";

// 超过这个距离就直接跳回去：1 万条的列表有几十万像素高，平滑滚动要拖很久
const INSTANT_AFTER = 20000;

// 一直固定在右下角的返回顶部按钮，样式在 /theme.css（与文档站共用）。
export default function BackToTop() {
  const { t } = useI18n();

  const goTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instant = reduce || window.scrollY > INSTANT_AFTER;
    window.scrollTo({ top: 0, behavior: instant ? "instant" : "smooth" });
  };

  return (
    <button
      type="button"
      className="to-top"
      aria-label={t.header.backToTop}
      title={t.header.backToTop}
      onClick={goTop}
    >
      <ArrowUpIcon />
    </button>
  );
}
