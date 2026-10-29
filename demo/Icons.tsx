import React from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const Logo = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="var(--accent)" />
    <g fill="var(--accent-fg)">
      <rect x="6" y="6" width="5" height="11" rx="1.5" />
      <rect x="6" y="19" width="5" height="7" rx="1.5" />
      <rect x="13.5" y="6" width="5" height="6" rx="1.5" />
      <rect x="13.5" y="14" width="5" height="12" rx="1.5" />
      <rect x="21" y="6" width="5" height="8" rx="1.5" />
      <rect x="21" y="16" width="5" height="10" rx="1.5" />
    </g>
  </svg>
);

export const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

export const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" {...base}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

export const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" {...base}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base}>
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />
  </svg>
);

export const ImageIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" {...base}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m21 16-5-5-8 8" />
  </svg>
);

export const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
