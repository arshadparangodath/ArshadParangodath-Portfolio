import type { ReactNode } from 'react'

/**
 * Simplified monoline marks for the tools I work in. These are original
 * geometric reductions drawn on a 24-unit grid, not the vendors' trademarked
 * logos — they read as a family and keep the strip visually even.
 */
export interface TechIcon {
  name: string
  glyph: ReactNode
}

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const TECH_ICONS: TechIcon[] = [
  {
    name: 'Figma',
    glyph: (
      <>
        <rect x="8" y="2.5" width="7" height="7" rx="3.5" {...S} />
        <rect x="8" y="9.5" width="7" height="7" rx="3.5" {...S} />
        <rect x="8" y="16.5" width="7" height="5" rx="2.5" {...S} />
        <circle cx="18.5" cy="13" r="3.5" {...S} />
      </>
    ),
  },
  {
    name: 'Framer',
    glyph: <path d="M6 3h12L12 9H6zM6 9h12l-6 6v6l-6-6z" {...S} />,
  },
  {
    name: 'After Effects',
    glyph: (
      <>
        <rect x="2.5" y="3.5" width="19" height="17" rx="3" {...S} />
        <path d="M7 15.5 9.5 8l2.5 7.5M7.8 13.2h3.4M15 15.5v-5h1.8a1.7 1.7 0 0 1 0 3.4H15" {...S} />
      </>
    ),
  },
  {
    name: 'Illustrator',
    glyph: (
      <>
        <rect x="2.5" y="3.5" width="19" height="17" rx="3" {...S} />
        <path d="M7 15.5 9.5 8l2.5 7.5M7.8 13.2h3.4M15.6 10.5v5" {...S} />
        <circle cx="15.6" cy="8.4" r="0.4" fill="currentColor" />
      </>
    ),
  },
  {
    name: 'Photoshop',
    glyph: (
      <>
        <rect x="2.5" y="3.5" width="19" height="17" rx="3" {...S} />
        <path d="M8 15.5V8.5h2.2a2.2 2.2 0 0 1 0 4.4H8M14.5 14.6c.7.6 2.8.8 2.8-.5s-2.6-.9-2.6-2.2 2-1.2 2.7-.6" {...S} />
      </>
    ),
  },
  {
    name: 'Blender',
    glyph: (
      <>
        <circle cx="13" cy="14" r="6" {...S} />
        <circle cx="13" cy="14" r="2" {...S} />
        <path d="M3 9h7l-3.5 3z" {...S} />
      </>
    ),
  },
  {
    name: 'Spline',
    glyph: (
      <>
        <path d="M12 2.6 20.5 7v10L12 21.4 3.5 17V7z" {...S} />
        <path d="M12 2.6V12l8.5 5M12 12 3.5 17" {...S} />
      </>
    ),
  },
  {
    name: 'Webflow',
    glyph: <path d="M2.5 7.5h4l2.2 6 2.3-6h3.6l2.2 6 2.2-6h3.5l-4.6 9h-3.4l-2-5.2-2.1 5.2H6.9z" {...S} />,
  },
  {
    name: 'React',
    glyph: (
      <>
        <circle cx="12" cy="12" r="2.1" {...S} />
        <ellipse cx="12" cy="12" rx="9.5" ry="3.7" {...S} />
        <ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(60 12 12)" {...S} />
        <ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(120 12 12)" {...S} />
      </>
    ),
  },
  {
    name: 'Three.js',
    glyph: (
      <>
        <path d="M12 2.5 21.5 20H2.5z" {...S} />
        <path d="M12 2.5V20M7 11.2h10" {...S} />
      </>
    ),
  },
  {
    name: 'GSAP',
    glyph: (
      <>
        <circle cx="12" cy="12" r="9" {...S} />
        <path d="M16 8.5a5 5 0 1 0 .6 6.4M13 12h3.6" {...S} />
      </>
    ),
  },
  {
    name: 'Tailwind',
    glyph: (
      <path
        d="M4 11c1-3.2 2.9-4.8 5.6-4.8 2.1 0 3.4 1.1 4.2 2.4.6 1 1.3 1.6 2.4 1.6 1 0 1.8-.5 2.4-1.4-.9 3.2-2.8 4.8-5.5 4.8-2.1 0-3.4-1.1-4.2-2.4-.6-1-1.3-1.6-2.4-1.6-1 0-1.8.5-2.5 1.4z"
        {...S}
      />
    ),
  },
  {
    name: 'TypeScript',
    glyph: (
      <>
        <rect x="2.5" y="2.5" width="19" height="19" rx="3" {...S} />
        <path d="M7 10h5M9.5 10v7M14 16.2c1 .8 3.5.9 3.5-.7s-3.2-1.1-3.2-2.8S17 11 18 11.6" {...S} />
      </>
    ),
  },
  {
    name: 'Rive',
    glyph: (
      <>
        <path d="M5 5h8a4.5 4.5 0 0 1 0 9H5z" {...S} />
        <path d="M5 5v14M12.5 14 18 19" {...S} />
      </>
    ),
  },
  {
    name: 'Premiere Pro',
    glyph: (
      <>
        <rect x="2.5" y="3.5" width="19" height="17" rx="3" {...S} />
        <path d="M8 15.5v-7h2.2a2.2 2.2 0 0 1 0 4.4H8M14.6 15.5v-5M14.6 12c0-1 .8-1.6 2.1-1.5" {...S} />
      </>
    ),
  },
  {
    name: 'Lottie',
    glyph: (
      <>
        <circle cx="12" cy="12" r="9" {...S} />
        <path d="M6.5 14.5c2.5 0 3-5 5.5-5s3 5 5.5 5" {...S} />
      </>
    ),
  },
]
