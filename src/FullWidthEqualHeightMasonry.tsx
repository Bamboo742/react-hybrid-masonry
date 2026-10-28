import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";

// SSR-safe useLayoutEffect that falls back to useEffect on the server
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type FullWidthEqualHeightMasonryCoreProps = {
  items: any[];
  renderItem: (
    item: {
      x: number;
      y: number;
      width: number;
      height: number;
      [key: string]: any;
    },
    index: number,
  ) => React.ReactNode;
  onLoadMore?: () => void;
  targetRowHeight?: number; // 目标行高
  gap?: number;
  buffer?: number;
  hasMore?: boolean;
  loading?: boolean;
  sizeRange?: [number, number]; // 行高范围 [最小高度, 最大高度]
  maxItemWidth?: number; // 单个图片最大宽度
  maxStretchRatio?: number; // 最大拉伸比例
  loadMoreThreshold?: number; // 预加载阈值（px），距离底部多远时触发加载
};

const GAP = 8;

// 使用 requestAnimationFrame 优化滚动更新
// 相比 setTimeout 节流，rAF 能在每一帧更新，更流畅且不会积压
function useRafThrottle<T>(value: T): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setThrottledValue(value);
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value]);

  return throttledValue;
}

// ==================== 布局算法 Hook ====================
// 基于原始比例的动态行布局算法（类似 Google Photos）
// 核心思想：保持图片原始比例，动态调整行高以填满容器宽度
function useFullWidthFillMasonry(
  items: any[],
  containerWidth: number,
  targetRowHeight = 245, // 目标行高（可以是 sizeRange 的中间值）
  gap = GAP,
  sizeRange: [number, number] = [230, 260], // 行高范围 [最小高度, 最大高度]
  maxItemWidth = 975, // 单个图片最大宽度（避免过宽）
  maxStretchRatio = 1.5, // 最大拉伸比例，避免图片过度变形
) {
  const layout = useMemo(() => {
    if (!containerWidth || items.length === 0) return [];

    const positioned: any[] = [];
    const [minHeight, maxHeight] = sizeRange;
    let y = 0; // 当前垂直位置

    let i = 0;

    // 贪心算法：逐行填充，保持图片原始比例
    while (i < items.length) {
      const currentRow: any[] = [];

      // ============ 步骤1：贪心添加图片到当前行 ============
      // 规则是非对称的，直接对应"允许缩小、只卡放大不能超过 maxStretchRatio"
      // 这条明确要求：只要当前这一行想要精确填满容器宽度，需要放大的倍数
      // 超过 maxStretchRatio，就继续拼下一张图片分摊——拼进来一定会让"所需
      // 放大倍数"更接近 1，哪怕这一步还没达标也要接着拼，不能因为"这一步
      // 单独看还不够格"就提前放弃（旧写法在"加入新图片"的判断里额外要求
      // `scaleWithNew <= maxStretchRatio` 才愿意加，遇到需要连续拼好几张
      // 才能达标的情况，第一步改善不够就直接放弃并 break，行内永远停在
      // 强制的最少 2 张、放大倍数远超 1.1 也不再继续拼）。一旦不再需要放大
      // 超过 maxStretchRatio——包括已经需要缩小的情况，缩小多少都可以，
      // 不设上限——就停止拼图，这一行到此为止。这个规则本身已经保证了
      // "至少 2 张"（单张图几乎总是需要放大远超 1.1 倍才能填满整行），不用
      // 再单独写一段强制拼第二张的代码。
      const effectiveTargetRowHeight = targetRowHeight;

      // 第一张图片
      if (i < items.length) {
        currentRow.push(items[i]);
        i += 1;
      }

      while (i < items.length) {
        const currentRowWidth = currentRow.reduce((sum, rowItem) => {
          return sum + rowItem.widthRatio * effectiveTargetRowHeight;
        }, 0);
        // 跟步骤2最终算 adjustedRowHeight 用的是同一个公式（gap 从分子里
        // 减掉，不是加到分母上）——间隙本身不会跟着图片一起被放大/缩小，
        // 两处用不一致的公式会导致这里判断"是否已经够格"和步骤2实际拿到
        // 的缩放比例存在细微偏差。
        const currentAvailableWidth =
          containerWidth - (currentRow.length - 1) * gap;
        const currentScale = currentAvailableWidth / currentRowWidth;

        if (currentScale <= maxStretchRatio) break;

        currentRow.push(items[i]);
        i += 1;
      }

      // ============ 步骤2：计算缩放比例，调整行高以填满容器 ============
      // 排在数组末尾的这一行按原始比例自然显示、不强制拉伸填满容器宽度——
      // 图片数量不够时硬拉伸会明显糊掉，宁可右侧留白也不能拉伸。等下一页
      // 数据加载、这一行不再是末尾行时，尺寸会重新计算变化。
      const isLastRow = i >= items.length;
      const totalGaps = (currentRow.length - 1) * gap;
      const availableWidth = containerWidth - totalGaps;

      // 计算理想总宽度（基于有效目标行高）
      const idealTotalWidthForScale = currentRow.reduce((sum, item) => {
        return sum + item.widthRatio * effectiveTargetRowHeight;
      }, 0);

      // 缩放比例 = 可用宽度 / 理想总宽度
      const scale = availableWidth / idealTotalWidthForScale;

      // ============ 步骤3：计算调整后的行高 ============
      let adjustedRowHeight = effectiveTargetRowHeight * scale;

      // ============ 步骤4：限制行高和拉伸比例 ============
      // 如果是最后一行，不强制填满容器宽度
      if (isLastRow) {
        adjustedRowHeight = Math.min(
          Math.max(adjustedRowHeight, minHeight),
          targetRowHeight,
        );
      } else {
        // 非最后一行：步骤1 的循环已经保证了 scale（这里的放大倍数）不会
        // 超过 maxStretchRatio——除非直接没有更多图片可拼（那种情况会
        // 落进上面 isLastRow 分支，不会走到这里）。所以这里不需要再像
        // 旧写法那样"发现拉伸过度就回退丢掉最后一张重算"，那段逻辑现在
        // 已经不可能触发。sizeRange 是另一条独立的视觉密度约束，仍然要
        // 单独限制。
        adjustedRowHeight = Math.min(
          Math.max(adjustedRowHeight, minHeight),
          maxHeight,
        );
      }

      // ============ 步骤5：定位每张图片 ============
      let x = 0;

      // 先计算所有图片的理想宽度（保持精确的浮点数）
      const idealWidths = currentRow.map(
        (item) => item.widthRatio * adjustedRowHeight,
      );

      // 计算理想总宽度
      const idealTotalWidth = idealWidths.reduce((sum, w) => sum + w, 0);

      // 如果是最后一行，不需要精确填充，但要防止溢出。这里的等比例收缩
      // 用同一个 overflowScale 统一乘给行内每一张图（包括最后一张）——
      // 不能像旧写法那样单独让最后一张吃"剩余宽度"，否则又会退回"这行的
      // 舍入误差全砸给最后一张"的老问题上。
      if (isLastRow) {
        const totalGapsWidth = (currentRow.length - 1) * gap;
        const totalRequiredWidth = idealTotalWidth + totalGapsWidth;

        if (totalRequiredWidth > containerWidth) {
          const overflowScale =
            (containerWidth - totalGapsWidth) / idealTotalWidth;

          currentRow.forEach((item, index) => {
            const finalWidth = Math.min(
              Math.round(idealWidths[index] * overflowScale),
              maxItemWidth,
            );

            positioned.push({
              ...item,
              x,
              y,
              width: finalWidth,
              height: Math.round(adjustedRowHeight),
              originalIndex: positioned.length,
            });

            x += finalWidth + gap;
          });
        } else {
          // 总宽度未超出，保持原始比例
          currentRow.forEach((item, index) => {
            const idealWidth = idealWidths[index];
            const finalWidth = Math.min(Math.round(idealWidth), maxItemWidth);

            positioned.push({
              ...item,
              x,
              y,
              width: finalWidth,
              height: Math.round(adjustedRowHeight),
              originalIndex: positioned.length,
            });

            x += finalWidth + gap;
          });
        }
      } else {
        // 非最后一行：精确分配宽度，确保刚好填满容器。行内每一张图（包括
        // 最后一张）都用同一套按累积比例算目标右边缘的公式，不能让最后
        // 一张单独去吃"剩余宽度"——旧写法就是这么算的，等价于假设行内还有
        // 一个不存在的"第 N 个间隙"，天生比真实可用宽度多算了一个 gap，
        // 这部分误差外加前面每张图 Math.round 累积下来的舍入误差，最终
        // 全部被扔给最后一张图去兜底，导致它的宽高比跟自己真实的图片比例
        // 严重不符（同一行里比例差异越大的图片，兜底吃到的误差越大）。
        // 目标右边缘 = 按 idealWidths 比例分配"图片总宽度"（容器宽度减去
        // 这一行全部间隙）之后，再加回当前图片左边已经占用的间隙数量。
        const totalRowGaps = (currentRow.length - 1) * gap;
        const availableForItems = containerWidth - totalRowGaps;
        let accumulatedIdealWidth = 0;

        currentRow.forEach((item, index) => {
          accumulatedIdealWidth += idealWidths[index];

          const targetRightEdge =
            (accumulatedIdealWidth / idealTotalWidth) * availableForItems +
            index * gap;

          let finalWidth = Math.round(targetRightEdge - x);
          finalWidth = Math.min(finalWidth, maxItemWidth);

          positioned.push({
            ...item,
            x,
            y,
            width: finalWidth,
            height: Math.round(adjustedRowHeight),
            originalIndex: positioned.length,
          });

          x += finalWidth + gap;
        });
      }

      // 移动到下一行
      y += Math.round(adjustedRowHeight) + gap;
    }

    return positioned;
  }, [
    items,
    containerWidth,
    targetRowHeight,
    gap,
    sizeRange,
    maxItemWidth,
    maxStretchRatio,
  ]);

  const totalHeight = useMemo(() => {
    if (layout.length === 0) return 0;
    return layout.reduce((max, item) => Math.max(max, item.y + item.height), 0);
  }, [layout]);

  return { layout, totalHeight };
}

// ==================== 主组件 ====================
export function FullWidthEqualHeightMasonryCore({
  items,
  renderItem,
  onLoadMore,
  targetRowHeight = 245, // 默认目标行高
  gap = GAP,
  buffer = 1000, // 增大缓冲区以应对快速滚动
  hasMore = true,
  loading = false,
  sizeRange = [230, 260], // 默认行高范围
  maxItemWidth = 975, // 默认最大宽度
  maxStretchRatio = 1.5, // 默认最大拉伸比例
  loadMoreThreshold = 800, // 默认距离底部 500px 时开始加载
}: FullWidthEqualHeightMasonryCoreProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // 使用 rAF 节流优化滚动性能
  const throttledScrollTop = useRafThrottle(scrollTop);

  // ResizeObserver 获取容器宽度。只在宽度真的变化时才 setState——宽度决定
  // 布局高度（minHeight），高度变化在某些场景下会影响滚动条有无，滚动条
  // 又会反过来改变容器宽度，不加这个判断会在窄视口下更容易触发
  // ResizeObserver 的这种"测量→setState→影响自身尺寸→再次测量"反馈循环。
  //
  // 额外叠加 window resize + visibilitychange 两个兜底监听：ResizeObserver
  // 的回调绑定在渲染管线上，标签页处于后台（不可见）状态时浏览器会直接
  // 跳过通知，移动端切到 PC 宽度这类"窗口在切换过程中曾经不可见"的场景下
  // 可能永远收不到新宽度，容器会永久卡在切换前那次测量的列数上。resize
  // 兜底覆盖文档保持可见时的常规缩放，visibilitychange 兜底覆盖标签页
  // 重新可见的那一刻，两者复用同一份测量函数，不引入新的状态。
  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      if (!containerRef.current) return;
      const nextWidth = containerRef.current.clientWidth;
      setContainerWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);

    window.addEventListener("resize", measure);
    document.addEventListener("visibilitychange", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", measure);
    };
  }, []);

  // 布局计算（使用新的基于比例的算法）
  const { layout, totalHeight } = useFullWidthFillMasonry(
    items,
    containerWidth,
    targetRowHeight,
    gap,
    sizeRange,
    maxItemWidth,
    maxStretchRatio,
  );

  // 滚动监听——用 getBoundingClientRect 实时量距离视口顶部多远，不缓存
  // offsetTop。offsetTop 只在挂载时量一次，之后只要容器上方任何内容
  // （异步内容、图片 onLoad、字体换装、懒加载挂载）改变高度，缓存值就
  // 跟着失真——量出来的"已滚动距离"和容器真实位置对不上，可视窗口会切到
  // 一段根本不在屏幕上的 y 范围，表现为容器高度（minHeight）正常但内部
  // 空空如也。rect.top 每次都是最新的，不存在这类失真，跟
  // VirtualMasonry.tsx 的 handleScroll 是同一个写法。
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setScrollTop(Math.max(0, -rect.top));
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // IntersectionObserver 实现无限加载（带预加载阈值）。loading 特意留在
  // 依赖里：每次翻页 loading 从 true 变回 false 时会重新订阅一次，重新
  // 订阅会立即用当前可视状态回调一次——这不是多余的副作用，是真正需要的
  // 检查：如果上一页加载完之后触发元素依然停留在可视区域内（内容还没
  // 追上滚动位置，快速滑动时常见），必须借这次重新订阅的立即回调再触发
  // 一次加载。IntersectionObserver 只在"穿越边界"时才回调，如果不重新
  // 订阅，触发元素移动之后只要没有真正离开过可视区域，就再也不会收到
  // 新回调，会卡死在"还有更多但再也不会去请求"的死锁里（快速滑动时新
  // 内容永远追不上滑动速度，必现）。不要再自行改动这个 effect 的依赖。
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

  // 可视区域虚拟滚动。这里只能 filter，不能像早期版本那样先 .map() 拷贝一份
  // 新对象再 filter——item 对象引用如果每次滚动都变，子组件里依赖 item 的
  // useEffect（比如曝光上报用的 IntersectionObserver）会跟着每次滚动
  // 重新执行，同一张卡片被反复重复处理。
  // originalIndex 已经在 layout 计算阶段（只在 items/containerWidth 等真正
  // 变化时才重算）里写进每个 item，这里不需要也不能再重新生成。
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
      {visibleItems.map((item) => (
        <React.Fragment key={item.originalIndex}>
          {renderItem(item, item.originalIndex)}
        </React.Fragment>
      ))}

      {/* 加载更多触发器 */}
      {onLoadMore && (
        <div
          ref={loadMoreTriggerRef}
          style={{
            position: "absolute",
            top: totalHeight,
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

// ==================== Demo 组件（包含数据管理） ====================
type FullWidthEqualHeightMasonryProps = {
  /**
   * 映射宽高
   * @param raw
   */
  mapSize?: (raw: any) => { width: number; height: number };

  /**
   * 自定义渲染每个项目（必需）
   * item 包含位置信息：x, y, width, height
   */
  renderItem: (
    item: {
      x: number;
      y: number;
      width: number;
      height: number;
      [key: string]: any;
    },
    index: number,
  ) => React.ReactNode;

  /**
   * 是否启用动画
   * @default true
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
   * 目标行高（会动态调整以填满容器）
   * @default 245
   */
  targetRowHeight?: number;

  /**
   * 行高范围 [最小高度, 最大高度]
   * @default [230, 260]
   */
  sizeRange?: [number, number];

  /**
   * 单个图片最大宽度（避免过宽）
   * @default 975
   */
  maxItemWidth?: number;

  /**
   * 最大拉伸比例（避免图片过度变形）
   * @default 1.5
   */
  maxStretchRatio?: number;

  gap?: number;
  buffer?: number;

  /**
   * 预加载阈值（px），距离底部多远时触发加载
   * @default 500
   */
  loadMoreThreshold?: number;
};

export default function FullWidthEqualHeightMasonry({
  mapSize,
  renderItem,
  enableAnimation: _enableAnimation = true,
  loadData,
  pageSize = 50,
  targetRowHeight = 245,
  sizeRange = [230, 260],
  maxItemWidth = 975,
  maxStretchRatio = 1.5,
  gap = GAP,
  buffer = 1500, // 增大缓冲区以应对快速滚动
  loadMoreThreshold = 500,
}: FullWidthEqualHeightMasonryProps) {
  // 内部状态管理
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // 初始设为 true，立即显示 Loader
  const [hasMore, setHasMore] = useState(true);

  // 防止重复初始加载
  const initialLoadRef = useRef(false);

  const defaultMapSize = (d: any) => ({
    width: d.width ?? d.w ?? d.imgW,
    height: d.height ?? d.h ?? d.imgH,
  });

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
  // loadingRef 在同一次调用里同步读并同步置位，不存在这个间隙；page 也一起
  // 用 ref，同样是为了避免闭包读到旧值。
  const loadingRef = useRef(true);
  const pageRef = useRef(1);

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
          // 失败后停止自动翻页，理由同 VirtualMasonry：不置假的话 finally 把
          // loading 放回 false，底部触发器重新订阅就会立刻再发一次失败的请求，
          // 形成无限重试。
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
    <FullWidthEqualHeightMasonryCore
      items={items}
      renderItem={renderItem}
      onLoadMore={handleLoadMore}
      targetRowHeight={targetRowHeight}
      sizeRange={sizeRange}
      maxItemWidth={maxItemWidth}
      maxStretchRatio={maxStretchRatio}
      gap={gap}
      buffer={buffer}
      hasMore={hasMore}
      loading={loading}
      loadMoreThreshold={loadMoreThreshold}
    />
  );
}
