// 文档站用到的内联 SVG 图标（线性，1.75 描边，使用 currentColor）。
const svg = (inner, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export const logo = `<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="var(--accent)"/><g fill="var(--accent-fg)"><rect x="6" y="6" width="5" height="11" rx="1.5"/><rect x="6" y="19" width="5" height="7" rx="1.5"/><rect x="13.5" y="6" width="5" height="6" rx="1.5"/><rect x="13.5" y="14" width="5" height="12" rx="1.5"/><rect x="21" y="6" width="5" height="8" rx="1.5"/><rect x="21" y="16" width="5" height="10" rx="1.5"/></g></svg>`;

export const search = svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 16);
export const menu = svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 20);
export const sun = svg(
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  18,
);
export const moon = svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>', 18);
export const github = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/></svg>`;
export const copy = svg(
  '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  14,
);

export const arrowUp = svg('<path d="M12 19V5M5 12l7-7 7 7"/>', 20);
