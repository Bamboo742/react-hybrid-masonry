// 演示页上的实时指标：已加载的条数，以及此刻真正在 DOM 里的卡片数。
// 两个数字的差距就是虚拟滚动省下来的渲染量。
// 同时负责数据模式：无限滚动，或者一次性加载 1 万条。
import { useCallback, useEffect, useRef, useState } from "react";
import { loadImageData } from "./imageData";

export type DataMode = "infinite" | "tenk";

export const TEN_K = 10000;

export function useGalleryStats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pages = useRef(new Map<number, number>());
  const [loaded, setLoaded] = useState(0);
  const [inDom, setInDom] = useState(0);
  const [mode, setModeState] = useState<DataMode>("infinite");

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

  const setMode = useCallback(
    (next: DataMode) => {
      reset();
      setModeState(next);
    },
    [reset],
  );

  // 一次加载 1 万条时，一页就是全部数据
  const pageSize = mode === "tenk" ? TEN_K : 30;

  const load = useCallback(
    async (page: number, size: number) => {
      const result = await loadImageData(page, size, mode === "tenk" ? TEN_K : undefined);
      track(page, result.data.length);
      return result;
    },
    [mode, track],
  );

  return { containerRef, loaded, inDom, mode, setMode, pageSize, load, reset };
}
