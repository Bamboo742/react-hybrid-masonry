import React, { useEffect, useState } from "react";
import { ArrowUpIcon } from "./Icons";
import { useI18n } from "./I18nContext";

const SHOW_AFTER = 400;
// 超过这个距离就直接跳回去：1 万条的列表有几十万像素高，平滑滚动要拖很久
const INSTANT_AFTER = 20000;

// 固定在右下角的返回顶部按钮，样式在 /theme.css（与文档站共用）。
export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > SHOW_AFTER);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const goTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instant = reduce || window.scrollY > INSTANT_AFTER;
    window.scrollTo({ top: 0, behavior: instant ? "instant" : "smooth" });
  };

  return (
    <button
      type="button"
      className="to-top"
      data-visible={visible}
      aria-label={t.header.backToTop}
      title={t.header.backToTop}
      tabIndex={visible ? 0 : -1}
      onClick={goTop}
    >
      <ArrowUpIcon />
    </button>
  );
}
