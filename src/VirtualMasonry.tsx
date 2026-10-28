import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  useCallback,
} from "react";

// SSR-safe useLayoutEffect that falls back to useEffect on the server
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type VirtualMasonryCoreProps = {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  onLoadMore?: () => void;
  minColumnWidth?: number;
  maxColumnWidth?: number;
  /** 直接指定列数，传入后不再按 min/maxColumnWidth 推算 */
  columns?: number;
  gap?: number;
  buffer?: number;
  hasMore?: boolean;
  loading?: boolean;
  loadMoreThreshold?: number; // 预加载阈值（px），距离底部多远时触发加载
};

// RAF 节流 Hook - 使用 requestAnimationFrame 优化滚动性能
function useRafThrottle<T>(value: T): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const rafRef = useRef<number | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;

    // 如果已经有待执行的 RAF，不再重复请求
    if (rafRef.current !== null) {
      return;
    }

    // 请求下一帧更新
    rafRef.current = requestAnimationFrame(() => {
      setThrottledValue(valueRef.current);
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value]);

  return throttledValue;
}

// ==================== 布局算法 Hook ====================
function useMasonryLayout(
  items: any[],
  containerWidth: number,
  minColumnWidth = 200,
  maxColumnWidth?: number,
  gap = 16,
  columns?: number,
) {
  // 计算列数，考虑最小和最大宽度；调用方直接指定了列数时以它为准
  const columnCount = useMemo(() => {
    if (columns) return columns;

    let cols = Math.max(1, Math.floor(containerWidth / minColumnWidth));

    // 如果设置了最大宽度，确保列宽不超过最大值——但加列不能加过头，实测
    // minColumnWidth/maxColumnWidth 间距较窄时(比如 270/280)，原来的写法
    // 只看新列宽是否已经 <= maxColumnWidth 就停，不检查会不会顺带跌破
    // minColumnWidth，结果列宽被压到比 minColumnWidth 还窄、列数比预期
    // 多出一列。这里加列前先算下一步的列宽，会跌破 minColumnWidth 就不再
    // 加，宁可让列宽略微超出 maxColumnWidth，也不违反 minColumnWidth 这个
    // 更影响观感的下限。
    if (maxColumnWidth) {
      let calculatedWidth = (containerWidth - gap * (cols - 1)) / cols;
      while (calculatedWidth > maxColumnWidth && cols < 20) {
        const nextCols = cols + 1;
        const nextWidth = (containerWidth - gap * (nextCols - 1)) / nextCols;
        if (nextWidth < minColumnWidth) break;
        cols = nextCols;
        calculatedWidth = nextWidth;
      }
    }

    return cols;
  }, [columns, containerWidth, minColumnWidth, maxColumnWidth, gap]);

  const layout = useMemo(() => {
    if (!containerWidth) return [];
    const columnHeights = Array(columnCount).fill(0);
    let columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;

    // 限制最大宽度
    if (maxColumnWidth && columnWidth > maxColumnWidth) {
      columnWidth = maxColumnWidth;
    }

    return items.map((item) => {
      const minCol = columnHeights.indexOf(Math.min(...columnHeights));
      const x = (columnWidth + gap) * minCol;
      const y = columnHeights[minCol];

      // 按比例计算缩放后的高度
      const aspectRatio = item.height / item.width;
      const scaledHeight = columnWidth * aspectRatio;

      columnHeights[minCol] += scaledHeight + gap;

      return {
        ...item,
        x,
        y,
        width: columnWidth,
        height: scaledHeight,
      };
    });
  }, [items, columnCount, containerWidth, maxColumnWidth, gap]);

  const totalHeight = useMemo(() => {
    if (layout.length === 0) return 0;
    const columnHeights = Array(columnCount).fill(0);
    layout.forEach((item) => {
      const colIndex = Math.round(
        item.x /
          ((containerWidth - gap * (columnCount - 1)) / columnCount + gap),
      );
      columnHeights[colIndex] = Math.max(
        columnHeights[colIndex],
        item.y + item.height,
      );
    });
    return Math.max(...columnHeights);
  }, [layout, columnCount, containerWidth, gap]);

  return { layout, totalHeight, columnCount };
}

// ==================== 主组件 ====================
export function VirtualMasonryCore({
  items,
  renderItem,
  onLoadMore,
  minColumnWidth = 200,
  maxColumnWidth,
  columns,
  gap = 16,
  buffer = 300,
  hasMore = true,
  loading = false,
  loadMoreThreshold = 500, // 默认距离底部 500px 时开始加载
}: VirtualMasonryCoreProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // 使用 RAF 优化滚动性能
  const throttledScrollTop = useRafThrottle(scrollTop);

  // ResizeObserver 获取容器宽度。额外叠加 window resize + visibilitychange
  // 两个兜底监听：ResizeObserver 的回调绑定在渲染管线上，标签页处于后台
  // （不可见）状态时浏览器会直接跳过通知，移动端切到 PC 宽度这类"窗口在
  // 切换过程中曾经不可见"的场景下可能永远收不到新宽度，容器会永久卡在
  // 切换前那次测量的列数上。resize 兜底覆盖文档保持可见时的常规缩放，
  // visibilitychange 兜底覆盖标签页重新可见的那一刻，两者都只是重新读一次
  // 真实宽度，不引入新的状态。
  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => setContainerWidth(container.clientWidth);

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    measure();

    window.addEventListener("resize", measure);
    document.addEventListener("visibilitychange", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", measure);
    };
  }, []);

  // 布局计算
  const { layout, totalHeight } = useMasonryLayout(
    items,
    containerWidth,
    minColumnWidth,
    maxColumnWidth,
    gap,
    columns,
  );

  // 滚动监听 - 使用 useCallback 优化
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    // 使用 getBoundingClientRect 获取准确的容器位置
    const rect = containerRef.current.getBoundingClientRect();
    // rect.top 为负数表示容器顶部已滚出视口，取其绝对值即为已滚动距离
    const nextScrollTop = Math.max(0, -rect.top);
    setScrollTop(nextScrollTop);
  }, []);

  useEffect(() => {
    // 初始化时立即计算一次滚动位置
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // IntersectionObserver 实现无限加载（带预加载阈值）。loading 特意留在
  // 依赖里，原因见 FullWidthEqualHeightMasonry.tsx 里同一处的详细说明：
  // 每次翻页 loading 变回 false 时重新订阅一次、借重新订阅的立即回调
  // 再检查一次当前可视状态，是防止"触发元素移动后依然停留在可视区域内、
  // 但因为没有穿越边界而再也收不到新回调"这种死锁的必要机制，不是多余的
  // 副作用。不要再自行改动这个 effect 的依赖。
  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;

    const trigger = loadMoreTriggerRef.current;
    if (!trigger) return;

    // 使用 rootMargin 实现预加载：当触发器距离视口底部还有 loadMoreThreshold px 时就开始加载
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: `${loadMoreThreshold}px` },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loading, loadMoreThreshold]);

  // 可视化优化 - 使用节流后的 scrollTop
  const visibleItems = useMemo(() => {
    return layout.filter((item) => {
      const viewTop = throttledScrollTop - buffer;
      const viewBottom = throttledScrollTop + window.innerHeight + buffer;
      return item.y + item.height >= viewTop && item.y <= viewBottom;
    });
  }, [layout, throttledScrollTop, buffer]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: totalHeight,
      }}
    >
      {visibleItems.map((item, index) => renderItem(item, index))}

      {/* 加载更多触发器 */}
      {onLoadMore && (
        <div
          ref={loadMoreTriggerRef}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

export type VirtualMasonryProps = {
  /**
   * 映射宽高
   * @param raw
   */
  mapSize?: (raw: any) => { width: number; height: number };

  /**
   * 自定义渲染每个项目（必需）
   * @param item - 包含位置信息的项目数据 { x, y, width, height, ...原始数据 }
   * @param index - 项目索引
   */
  renderItem: (item: any, index: number) => React.ReactNode;

  /**
   * 是否启用动画
   * @default true
   * 跟 FullWidthEqualHeightMasonry/DynamicMasonryView 保持同一套 props 形状，
   * 这个瀑布流实现本身目前没有做过渡动画，暂不消费。
   */
  enableAnimation?: boolean;

  /**
   * 自定义数据加载函数
   * 如果提供，会替代默认的 mock 数据生成
   */
  loadData?: (
    page: number,
    pageSize: number,
  ) => Promise<{
    data: any[];
    hasMore: boolean;
  }>;

  /**
   * 每页数据条数
   * @default 50
   */
  pageSize?: number;

  /**
   * 最小列宽
   * @default 200
   */
  minColumnWidth?: number;

  /**
   * 最大列宽（限制每个元素的最大宽度）
   */
  maxColumnWidth?: number;

  /**
   * 直接指定列数。min/maxColumnWidth 的推算只有"容器宽度→列数"一个自由度，
   * 没法在不同视口下各自精确命中设计稿的列数时，由调用方按断点直接给出。
   */
  columns?: number;

  gap?: number;
  buffer?: number;

  /**
   * 预加载阈值（px），距离底部多远时触发加载
   * @default 500
   */
  loadMoreThreshold?: number;

  /**
   * 首屏数据的初始值（如页面 SSR 阶段已经预取过第一页）。传入后组件直接用
   * 这份数据渲染首屏，不会再额外触发一次 loadData(1, pageSize)，避免服务端
   * 已经拿到数据、客户端又重复请求一次。
   */
  initialItems?: any[];

  /**
   * 配合 initialItems 使用，标记预取的首屏之后是否还有更多数据
   * @default true
   */
  initialHasMore?: boolean;
};

export default function VirtualMasonry({
  mapSize,
  renderItem,
  loadData,
  pageSize = 50,
  minColumnWidth = 200,
  maxColumnWidth,
  columns,
  gap = 16,
  buffer = 1500,
  loadMoreThreshold = 800,
  initialItems,
  initialHasMore = true,
}: VirtualMasonryProps) {
  const defaultMapSize = (d: any) => ({
    width: d.width ?? d.w ?? d.imgW,
    height: d.height ?? d.h ?? d.imgH,
  });

  const hasInitialData = initialItems !== undefined;

  // 内部状态管理
  const [items, setItems] = useState<any[]>(() => {
    if (!hasInitialData) return [];
    const effectiveMapSize = mapSize ?? defaultMapSize;
    return initialItems!.map((d) => {
      const { width, height } = effectiveMapSize(d);
      return { ...d, width, height, widthRatio: width / height };
    });
  });
  // 初始设为 true 立即显示 Loader；已有 initialItems 时首屏已经能渲染，不用先转圈
  const [loading, setLoading] = useState(!hasInitialData);
  const [hasMore, setHasMore] = useState(
    hasInitialData ? initialHasMore : true,
  );

  // 防止重复初始加载；已有 initialItems 时视为第一页已经加载过
  const initialLoadRef = useRef(hasInitialData);

  // 使用 ref 存储最新的函数引用，避免依赖变化
  const loadDataRef = useRef(loadData);
  const mapSizeRef = useRef(mapSize);

  useEffect(() => {
    loadDataRef.current = loadData;
    mapSizeRef.current = mapSize;
  }, [loadData, mapSize]);

  // loading state 留着是为了下面 IntersectionObserver 的 effect（依赖里的
  // loading）在每次翻页完成时重新订阅、借立即回调检查是否还要继续加载，
  // 这部分不要改。但 handleLoadMore 自己判断"现在能不能发起新请求"不能只看
  // 这个 state：state 更新到下一次渲染真正生效之间有间隙，快速滑动时如果在
  // 这段间隙里被再次触发，读到的还是没更新的旧值，会把两个请求同时放出去——
  // 两个并发请求的响应谁先回来不一定按页码顺序，页码和数据对不上。
  // loadingRef 在同一次调用里同步读并同步置位，不存在这个间隙；page 也
  // 一起用 ref，同样是为了避免闭包读到旧值。initialItems 已经是第 1 页的
  // 数据，下一次该要第 2 页，不然无限加载触发器一响会把第 1 页重新请求
  // 一遍，跟 initialItems 里的数据产生重复。
  const loadingRef = useRef(!hasInitialData);
  const pageRef = useRef(hasInitialData ? 2 : 1);

  const handleLoadMore = useCallback(
    (force = false) => {
      if (!loadDataRef.current) return;
      if (!force && loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      const requestedPage = pageRef.current;

      loadDataRef.current(requestedPage, pageSize)
        .then(({ data, hasMore: more }) => {
          const effectiveMapSize = mapSizeRef.current ?? defaultMapSize;

          setItems((prev) => [
            ...prev,
            ...data.map((d) => {
              const { width, height } = effectiveMapSize(d);
              return {
                ...d,
                width,
                height,
                widthRatio: width / height,
              };
            }),
          ]);
          setHasMore(more);
          pageRef.current = requestedPage + 1;
        })
        .catch((error) => {
          console.error("Failed to load data:", error);
          // 请求失败后必须停止自动翻页：finally 会把 loading 置回 false，而底部
          // 触发器还在视口里，IntersectionObserver 重新订阅时会立刻回调
          // onLoadMore，失败的请求就会被无限重发(接口挂了/被 CORS 拦截时，
          // network 面板里同一个请求会一直刷)。hasMore 置假后触发器不再
          // 订阅，不会再发请求。
          setHasMore(false);
        })
        .finally(() => {
          loadingRef.current = false;
          setLoading(false);
        });
    },
    [pageSize],
  );

  // 初始加载 - 使用 ref 防止重复调用
  useEffect(() => {
    if (!initialLoadRef.current && items.length === 0) {
      initialLoadRef.current = true;
      handleLoadMore(true); // 传入 force = true，跳过 loading 检查
    }
  }, [handleLoadMore, items.length]);

  return (
    <VirtualMasonryCore
      items={items}
      renderItem={renderItem}
      onLoadMore={handleLoadMore}
      minColumnWidth={minColumnWidth}
      maxColumnWidth={maxColumnWidth}
      columns={columns}
      gap={gap}
      buffer={buffer}
      hasMore={hasMore}
      loading={loading}
      loadMoreThreshold={loadMoreThreshold}
    />
  );
}
