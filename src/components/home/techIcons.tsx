/**
 * Real tool logos for the marquee. Each entry points at an image under
 * `public/tech-icons/` — drop a single colour version of each logo there
 * (transparent background, square-ish, at least ~256×256 so it stays sharp
 * on retina screens; .webp is preferred for size, .png works too).
 *
 * The marquee itself handles the black-and-white ↔ colour swap purely with a
 * CSS `grayscale` filter on hover, so you only need to supply ONE (colour)
 * image per tool — nothing to prepare on your end besides dropping the files
 * in with the exact names below.
 */
export interface TechIcon {
  name: string
  /** Path under /public, e.g. '/tech-icons/figma.webp'. */
  src: string
}

export const TECH_ICONS: TechIcon[] = [
  { name: 'Figma', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/figma.webp' },
  { name: 'Framer', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Framer.webp' },
  { name: 'After Effects', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/AfterEffects.webp' },
  { name: 'Illustrator', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Illustrator.webp' },
  { name: 'Photoshop', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Photoshop.webp' },
  { name: 'Blender', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Blender.webp' },
  { name: 'Spline', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Spline.webp' },
  { name: 'Notion', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Notion.webp' },
  { name: 'Slack', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Slack.webp' },
  { name: 'Rive', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Rive.webp' },
  { name: 'Premiere Pro', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Premier.webp' },
  { name: 'Lottie', src: 'https://o6m2vvipwxhd7vm3.public.blob.vercel-storage.com/Assets/Home%20Page/TechStack%20Icons/Lottie.webp' },
]
