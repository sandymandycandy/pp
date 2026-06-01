import type { ReactElement, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const svg = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icons: Record<string, (p: IconProps) => ReactElement> = {
  frontend: (p) => (
    <svg {...svg} {...p}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 8h18" />
      <path d="M6 6.2h.01M8.2 6.2h.01" />
      <path d="M7 12h5M7 15.5h8" />
    </svg>
  ),
  backend: (p) => (
    <svg {...svg} {...p}>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <path d="M6.5 7h.01M6.5 17h.01" />
      <path d="M15 7h3M15 17h3" />
    </svg>
  ),
  data: (p) => (
    <svg {...svg} {...p}>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.8" />
      <path d="M5 5.5v13c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-13" />
      <path d="M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8" />
    </svg>
  ),
  devops: (p) => (
    <svg {...svg} {...p}>
      <path d="M12 2.5c3 2 4.6 5.2 4.6 8.8L12 16l-4.6-4.7C7.4 7.7 9 4.5 12 2.5z" />
      <circle cx="12" cy="9" r="1.7" />
      <path d="M9.2 16.5 7 21M14.8 16.5 17 21" />
    </svg>
  ),
  helmet: (p) => (
    <svg {...svg} {...p}>
      <path d="M12 3a7.5 7.5 0 0 0-7.5 7.5V13a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-2.5A7.5 7.5 0 0 0 12 3z" />
      <rect x="8" y="8.5" width="8" height="5" rx="2.5" />
      <path d="M9 16v3.2h6V16" />
    </svg>
  ),
};
