// 文档里的等高布局示意图：按组件同样的规则排版，再渲染成内联 SVG。
// computeLayout 是 src/FullWidthEqualHeightMasonry.tsx 里 useFullWidthFillMasonry 的移植
// （去掉了 React 与 memo），示意图和真实组件的排法保持一致；改算法时记得同步这里。

const sum = (list) => list.reduce((s, n) => s + n, 0);

export function computeLayout(sizes, opts) {
  const {
    width,
    targetRowHeight = 245,
    gap = 8,
    sizeRange = [230, 260],
    maxItemWidth = 975,
    maxStretchRatio = 1.5,
  } = opts;
  const items = sizes.map(([w, h]) => ({ label: `${w}:${h}`, widthRatio: w / h }));
  const [minHeight, maxHeight] = sizeRange;
  const positioned = [];
  let y = 0;
  let row = 0;
  let i = 0;

  while (i < items.length) {
    const current = [items[i]];
    i += 1;

    while (i < items.length) {
      const rowWidth = sum(current.map((it) => it.widthRatio * targetRowHeight));
      const available = width - (current.length - 1) * gap;
      if (available / rowWidth <= maxStretchRatio) break;
      current.push(items[i]);
      i += 1;
    }

    const isLastRow = i >= items.length;
    const gaps = (current.length - 1) * gap;
    const availableWidth = width - gaps;
    const idealForScale = sum(current.map((it) => it.widthRatio * targetRowHeight));
    let rowHeight = targetRowHeight * (availableWidth / idealForScale);
    rowHeight = isLastRow
      ? Math.min(Math.max(rowHeight, minHeight), targetRowHeight)
      : Math.min(Math.max(rowHeight, minHeight), maxHeight);

    const ideal = current.map((it) => it.widthRatio * rowHeight);
    const idealTotal = sum(ideal);
    let x = 0;

    if (isLastRow) {
      const overflow = idealTotal + gaps > width ? (width - gaps) / idealTotal : 1;
      current.forEach((it, k) => {
        const w = Math.min(Math.round(ideal[k] * overflow), maxItemWidth);
        positioned.push({ ...it, x, y, width: w, height: Math.round(rowHeight), row, last: true });
        x += w + gap;
      });
    } else {
      let acc = 0;
      current.forEach((it, k) => {
        acc += ideal[k];
        const rightEdge = (acc / idealTotal) * availableWidth + k * gap;
        const w = Math.min(Math.round(rightEdge - x), maxItemWidth);
        positioned.push({ ...it, x, y, width: w, height: Math.round(rowHeight), row, last: false });
        x += w + gap;
      });
    }

    y += Math.round(rowHeight) + gap;
    row += 1;
  }

  const height = positioned.reduce((m, it) => Math.max(m, it.y + it.height), 0);
  return { items: positioned, rows: row, height };
}

// 渲染成 SVG。整行用实线，最后一行（不拉伸）用虚线；颜色全部走主题变量，深浅色都能用。
export function layoutSvg(sizes, opts, label) {
  const { items, rows, height } = computeLayout(sizes, opts);
  const w = opts.width;
  const rects = items
    .map((it) => {
      const style = it.last
        ? 'fill="none" stroke="var(--faint)" stroke-dasharray="4 3"'
        : 'fill="var(--accent-soft)" stroke="var(--accent)"';
      const text =
        it.width >= 30
          ? `<text x="${it.x + it.width / 2}" y="${it.y + it.height / 2}" text-anchor="middle" dominant-baseline="central" font-size="11" fill="${it.last ? "var(--muted)" : "var(--accent)"}">${it.label}</text>`
          : "";
      return `<rect x="${it.x}" y="${it.y}" width="${it.width}" height="${it.height}" rx="4" stroke-width="1" ${style}/>${text}`;
    })
    .join("");
  const edge = `<line x1="${w}" y1="-4" x2="${w}" y2="${height + 4}" stroke="var(--border-strong)" stroke-dasharray="2 3"/>`;
  const svg = `<svg viewBox="-2 -6 ${w + 4} ${height + 12}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${rects}${edge}</svg>`;
  return { svg, rows, items };
}

// 示意图里用的一组常见图片比例（宽:高）
export const SAMPLE_SIZES = [
  [3, 2], [2, 3], [4, 3], [1, 1], [16, 9], [3, 4], [3, 2], [2, 3], [5, 4], [16, 9],
  [1, 1], [3, 2], [4, 3], [2, 3], [3, 2], [1, 1], [4, 3], [16, 9], [3, 4], [3, 2],
];

// ---------------------------------------------------------------------------
// 瀑布流：移植自 src/VirtualMasonry.tsx 的 useMasonryLayout（列数推算 + 放进最矮的一列）
// ---------------------------------------------------------------------------

export function columnCount({ width, minColumnWidth = 200, maxColumnWidth, gap = 16, columns }) {
  if (columns) return columns;
  let cols = Math.max(1, Math.floor(width / minColumnWidth));
  if (maxColumnWidth) {
    let calculated = (width - gap * (cols - 1)) / cols;
    while (calculated > maxColumnWidth && cols < 20) {
      const nextCols = cols + 1;
      const nextWidth = (width - gap * (nextCols - 1)) / nextCols;
      if (nextWidth < minColumnWidth) break;
      cols = nextCols;
      calculated = nextWidth;
    }
  }
  return cols;
}

export function columnWidth({ width, gap = 16, maxColumnWidth }, cols) {
  const w = (width - gap * (cols - 1)) / cols;
  return maxColumnWidth && w > maxColumnWidth ? maxColumnWidth : w;
}

export function masonryLayout(sizes, opts) {
  const gap = opts.gap ?? 16;
  const cols = columnCount(opts);
  const cw = columnWidth(opts, cols);
  const heights = Array(cols).fill(0);
  const items = sizes.map(([w, h], index) => {
    const col = heights.indexOf(Math.min(...heights));
    const x = (cw + gap) * col;
    const y = heights[col];
    const height = cw * (h / w);
    heights[col] += height + gap;
    return { index, col, x, y, width: cw, height };
  });
  const height = items.reduce((m, it) => Math.max(m, it.y + it.height), 0);
  return { items, cols, columnWidth: cw, height };
}

// 每个元素标上它被放进来的顺序，直观展示「总是进入当前最矮的一列」
export function masonrySvg(sizes, opts, label) {
  const { items, cols, height } = masonryLayout(sizes, opts);
  const w = opts.width;
  const rects = items
    .map(
      (it) =>
        `<rect x="${it.x}" y="${it.y}" width="${it.width}" height="${it.height}" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1"/>` +
        `<text x="${it.x + it.width / 2}" y="${it.y + it.height / 2}" text-anchor="middle" dominant-baseline="central" font-size="12" fill="var(--accent)">${it.index + 1}</text>`,
    )
    .join("");
  const frame = `<rect x="0" y="-4" width="${w}" height="${height + 8}" rx="6" fill="none" stroke="var(--border-strong)" stroke-dasharray="2 3"/>`;
  const svg = `<svg viewBox="-2 -8 ${w + 4} ${height + 16}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${frame}${rects}</svg>`;
  return { svg, cols, items };
}

// ---------------------------------------------------------------------------
// DynamicMasonryView 如何确定布局：决策流程图。文字由调用方按语言传入。
// ---------------------------------------------------------------------------

export function decisionSvg(t) {
  const box = (x, y, w, h, text, dashed = false) => {
    const lines = text.split("\n");
    const tspans = lines
      .map((line, i) => `<tspan x="${x + w / 2}" dy="${i === 0 ? -((lines.length - 1) * 8) : 16}">${line}</tspan>`)
      .join("");
    return (
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="var(--bg-elevated)" stroke="${dashed ? "var(--faint)" : "var(--border-strong)"}"${dashed ? ' stroke-dasharray="4 3"' : ""}/>` +
      `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="var(--fg)">${tspans}</text>`
    );
  };
  const diamond = (cx, cy, w, h, text) => {
    const pts = `${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`;
    const lines = text.split("\n");
    const tspans = lines
      .map((line, i) => `<tspan x="${cx}" dy="${i === 0 ? -((lines.length - 1) * 8) : 16}">${line}</tspan>`)
      .join("");
    return (
      `<polygon points="${pts}" fill="var(--accent-soft)" stroke="var(--accent)"/>` +
      `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="var(--accent)">${tspans}</text>`
    );
  };
  const arrow = (d, dashed = false) =>
    `<path d="${d}" fill="none" stroke="${dashed ? "var(--faint)" : "var(--muted)"}" stroke-width="1.5"${dashed ? ' stroke-dasharray="4 3"' : ""} marker-end="url(#a)"/>`;
  const tag = (x, y, text) =>
    `<text x="${x}" y="${y}" font-size="12" fill="var(--muted)" text-anchor="middle">${text}</text>`;

  return (
    `<svg viewBox="0 0 820 270" role="img" aria-label="${t.aria}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>` +
    box(8, 118, 84, 44, t.mount) +
    arrow("M92 140 H130") +
    diamond(206, 140, 152, 84, t.askProp) +
    arrow("M206 98 V62 H300", false) +
    tag(222, 84, t.yes) +
    box(300, 40, 168, 44, t.useProp) +
    arrow("M282 140 H300") +
    tag(291, 132, t.no) +
    box(300, 118, 168, 44, t.fetch) +
    arrow("M468 140 H514") +
    diamond(590, 140, 152, 84, t.askReturned) +
    arrow("M590 98 V62 H652", false) +
    tag(606, 84, t.yes) +
    box(652, 40, 160, 44, t.useReturned) +
    arrow("M666 140 H690") +
    tag(678, 132, t.no) +
    box(690, 118, 122, 44, t.useDefault) +
    arrow("M384 162 V226 H751 V162", true) +
    tag(570, 218, t.failed) +
    `</svg>`
  );
}

// ---------------------------------------------------------------------------
// 等高布局：逐步展示「第一行是怎么拼出来的」，数字由和组件相同的规则现算。
// ---------------------------------------------------------------------------

export function rowSteps(sizes, opts) {
  const {
    width,
    targetRowHeight = 245,
    gap = 8,
    sizeRange = [230, 260],
    maxItemWidth = 975,
    maxStretchRatio = 1.5,
  } = opts;
  const ratios = sizes.map(([w, h]) => w / h);
  const labels = sizes.map(([w, h]) => `${w}:${h}`);
  const steps = [];
  const row = [0];
  let i = 1;
  const measure = () => {
    const rowWidth = sum(row.map((k) => ratios[k] * targetRowHeight));
    const available = width - (row.length - 1) * gap;
    return { rowWidth, available, scale: available / rowWidth };
  };
  while (i < ratios.length) {
    const m = measure();
    const stop = m.scale <= maxStretchRatio;
    steps.push({ n: row.length, labels: row.map((k) => labels[k]), ...m, stop });
    if (stop) break;
    row.push(i);
    i += 1;
  }
  const m = measure();
  const [minHeight, maxHeight] = sizeRange;
  const rawHeight = targetRowHeight * m.scale;
  const rowHeight = Math.min(Math.max(rawHeight, minHeight), maxHeight);
  const ideal = row.map((k) => ratios[k] * rowHeight);
  const idealTotal = sum(ideal);
  const availableForItems = width - (row.length - 1) * gap;
  let acc = 0;
  let x = 0;
  const widths = row.map((k, idx) => {
    acc += ideal[idx];
    const rightEdge = (acc / idealTotal) * availableForItems + idx * gap;
    const w = Math.min(Math.round(rightEdge - x), maxItemWidth);
    const out = { label: labels[k], ideal: ideal[idx], rightEdge, width: w };
    x += w + gap;
    return out;
  });
  return { steps, rawHeight, rowHeight, widths, count: row.length, endIndex: i };
}

// ---------------------------------------------------------------------------
// 分页指南：视口、buffer 渲染范围与 loadMoreThreshold 触发线的关系图。
// ---------------------------------------------------------------------------

export function thresholdSvg(t) {
  const cards = [
    [60, 22, 90, 50], [160, 22, 90, 80], [60, 82, 90, 70], [160, 112, 90, 56],
    [60, 162, 90, 64], [160, 178, 90, 74], [60, 236, 90, 50], [160, 262, 90, 30],
  ]
    .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>`)
    .join("");
  const label = (x, y, text, fill = "var(--muted)", anchor = "start") =>
    `<text x="${x}" y="${y}" font-size="13" fill="${fill}" text-anchor="${anchor}">${text}</text>`;
  return (
    `<svg viewBox="0 0 560 330" role="img" aria-label="${t.aria}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="40" y="10" width="230" height="290" rx="6" fill="var(--bg-subtle)" stroke="var(--border-strong)" stroke-dasharray="2 3"/>` +
    cards +
    `<rect x="10" y="44" width="290" height="236" rx="6" fill="none" stroke="var(--faint)" stroke-dasharray="5 4"/>` +
    `<rect x="26" y="74" width="258" height="176" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/>` +
    `<rect x="26" y="250" width="258" height="50" fill="var(--accent-soft)" opacity="0.5"/>` +
    `<line x1="26" y1="300" x2="284" y2="300" stroke="var(--accent)" stroke-width="2"/>` +
    `<path d="M300 250 V300" stroke="var(--muted)" stroke-width="1.5" marker-end="url(#b)" marker-start="url(#b)"/>` +
    `<defs><marker id="b" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>` +
    label(320, 156, t.viewport, "var(--accent)") +
    label(320, 62, t.buffer) +
    label(320, 280, t.threshold) +
    label(320, 318, t.trigger, "var(--accent)") +
    `<path d="M300 62 H310" stroke="var(--faint)"/>` +
    `<path d="M290 156 H310" stroke="var(--accent)"/>` +
    `</svg>`
  );
}
