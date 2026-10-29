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
