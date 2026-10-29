export type Language = "en" | "zh";

interface PanelText {
  title: string;
  description: string;
}

export interface Translations {
  header: {
    docs: string;
    theme: string;
    backToTop: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    docs: string;
    copy: string;
    copied: string;
    features: { title: string; text: string }[];
  };
  tabs: {
    waterfall: string;
    equalHeight: string;
    dynamic: string;
  };
  panel: {
    showCode: string;
    hideCode: string;
    loaded: string;
    inDom: string;
    items: string;
    copy: string;
    copied: string;
    dataset: string;
    infinite: string;
    tenk: string;
    rendered: string;
  };
  waterfall: PanelText;
  equalHeight: PanelText;
  dynamic: PanelText & {
    layout: string;
    waterfallBtn: string;
    equalHeightBtn: string;
  };
  footer: {
    note: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    header: {
      docs: "Docs",
      theme: "Toggle color theme",
      backToTop: "Back to top",
    },
    hero: {
      badge: "Zero dependencies · TypeScript · React 16.8+",
      title: "Virtual-scrolling masonry for React",
      subtitle:
        "Waterfall and equal-height layouts that stay fast with thousands of items. Let your API decide which one to show.",
      docs: "Read the docs",
      copy: "Copy",
      copied: "Copied",
      features: [
        {
          title: "Virtual scrolling",
          text: "Only the items near the viewport are in the DOM, however long the list gets.",
        },
        {
          title: "Two layouts, one switch",
          text: "Pinterest-style waterfall or Google Photos-style rows, switched at runtime.",
        },
        {
          title: "Infinite loading",
          text: "IntersectionObserver based, one request in flight, with SSR-friendly initial data.",
        },
        {
          title: "Responsive",
          text: "Follows the container width and recomputes columns and rows as it changes.",
        },
      ],
    },
    tabs: {
      waterfall: "Waterfall",
      equalHeight: "Equal height",
      dynamic: "Dynamic",
    },
    panel: {
      showCode: "Show code",
      hideCode: "Hide code",
      loaded: "Loaded",
      inDom: "In the DOM",
      items: "items",
      copy: "Copy",
      copied: "Copied",
      dataset: "Data",
      infinite: "Infinite scroll",
      tenk: "Load 10,000 at once",
      rendered: "Rendered",
    },
    waterfall: {
      title: "Waterfall layout",
      description:
        "Equal-width columns, every item placed in the shortest one. Resize the window to see the column count adapt.",
    },
    equalHeight: {
      title: "Equal-height layout",
      description:
        "Every row has the same height and fills the full width; each image keeps its original aspect ratio.",
    },
    dynamic: {
      title: "Dynamic layout",
      description:
        "The first API response, or a prop, decides which layout is used. Switch below to see it re-layout.",
      layout: "Layout",
      waterfallBtn: "Waterfall",
      equalHeightBtn: "Equal height",
    },
    footer: {
      note: "Released under the MIT License.",
    },
  },
  zh: {
    header: {
      docs: "文档",
      theme: "切换深浅色",
      backToTop: "返回顶部",
    },
    hero: {
      badge: "零依赖 · TypeScript · React 16.8+",
      title: "React 虚拟滚动瀑布流",
      subtitle:
        "瀑布流与等高布局，几千条数据依然流畅。由接口决定展示哪一种。",
      docs: "阅读文档",
      copy: "复制",
      copied: "已复制",
      features: [
        {
          title: "虚拟滚动",
          text: "无论列表多长，DOM 里只保留视口附近的元素。",
        },
        {
          title: "两种布局，一键切换",
          text: "Pinterest 风格瀑布流，或 Google Photos 风格等高行，运行时切换。",
        },
        {
          title: "无限加载",
          text: "基于 IntersectionObserver，同一时间只有一个请求，支持服务端预取首屏数据。",
        },
        {
          title: "响应式",
          text: "跟随容器宽度，宽度变化时重新计算列和行。",
        },
      ],
    },
    tabs: {
      waterfall: "瀑布流",
      equalHeight: "等高布局",
      dynamic: "动态布局",
    },
    panel: {
      showCode: "查看代码",
      hideCode: "收起代码",
      loaded: "已加载",
      inDom: "DOM 中",
      items: "项",
      copy: "复制",
      copied: "已复制",
      dataset: "数据",
      infinite: "无限滚动",
      tenk: "一次加载 1 万条",
      rendered: "渲染占比",
    },
    waterfall: {
      title: "瀑布流布局",
      description:
        "列宽相同，每个元素放进当前最短的一列。拖动窗口宽度，可以看到列数随之变化。",
    },
    equalHeight: {
      title: "等高布局",
      description:
        "每一行高度一致并铺满整行宽度，每张图片保持原始比例。",
    },
    dynamic: {
      title: "动态布局",
      description:
        "由第一次接口返回的数据，或一个 prop 决定使用哪种布局。点击下方切换，观察重新布局。",
      layout: "布局",
      waterfallBtn: "瀑布流",
      equalHeightBtn: "等高布局",
    },
    footer: {
      note: "基于 MIT 协议开源。",
    },
  },
};
