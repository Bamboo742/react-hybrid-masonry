// 演示页上的实时指标：已加载的条数，以及此刻真正在 DOM 里的卡片数。
// 两个数字的差距就是虚拟滚动省下来的渲染量。
import { useCallback, useEffect, useRef, useState } from "react";

export function useGalleryStats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pages = useRef(new Map<number, number>());
  const [loaded, setLoaded] = useState(0);
  const [inDom, setInDom] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const count = () => setInDom(el.querySelectorAll("[data-card]").length);
    count();
    const observer = new MutationObserver(count);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // 按页码记录条数而不是累加，开发环境的 StrictMode 重复调用也不会算重
  const track = useCallback((page: number, count: number) => {
    pages.current.set(page, count);
    let total = 0;
    pages.current.forEach((n) => (total += n));
    setLoaded(total);
  }, []);

  const reset = useCallback(() => {
    pages.current.clear();
    setLoaded(0);
  }, []);

  return { containerRef, loaded, inDom, track, reset };
}
