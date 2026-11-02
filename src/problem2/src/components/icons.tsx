import type { SVGProps } from "react";

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

export const ChevronDown = ({ size = 16 }) => (
  <svg {...base(size)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const ArrowsVertical = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M8 4v15m0 0l-4-4m4 4l4-4M16 20V5m0 0l-4 4m4-4l4 4" />
  </svg>
);
export const ArrowDown = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M12 5v14m0 0l-6-6m6 6l6-6" />
  </svg>
);
export const Close = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const Settings = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
);
export const Search = ({ size = 18 }) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
export const Check = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const Alert = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M12 8v5M12 16.5v.5" />
    <path d="M10.3 3.9L2.6 17.3A2 2 0 004.3 20h15.4a2 2 0 001.7-2.7L13.7 3.9a2 2 0 00-3.4 0z" />
  </svg>
);
export const Swap = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
  </svg>
);
