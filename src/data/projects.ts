import type { MediaItem } from './media'

export interface Project {
  id: string
  title: string
  client: string
  year: number
  category: string[]
  /**
   * Legacy fields from before the unified gallery/cover system — kept only
   * so projects saved before this feature still show something. New
   * projects don't set these at all; use `getCoverMedia()` from
   * `data/media.ts` to resolve the actual thumbnail/hero everywhere.
   */
  thumb?: string
  hero?: string
  /**
   * All of a project's media — images, GIFs, videos, Figma prototypes, or
   * other embeds, in any quantity and order. Whichever item has
   * `isCover: true` doubles as the thumbnail (3D card), Home page preview,
   * and project page hero — see `getCoverMedia()` in `data/media.ts`.
   */
  gallery?: MediaItem[]
  /**
   * Optional external link (e.g. a hosted PDF or a live site) — when set,
   * shows a "Complete case study" button on the project page that opens it
   * in a new tab.
   */
  caseStudyUrl?: string
  summary: string
  accent: string
  /** Editorial case-study metadata shown at the top of the project page. */
  meta: {
    industry: string
    region: string
    services: string[]
    scope: string
    role: string
    duration: string
    deliverables: string[]
    technologies: string[]
    partner: string
    awards: string[]
  }
  /** Secondary colour used to build the project page's layered background. */
  accentAlt: string
  /**
   * Where the project surfaces. `featured` is the hero slot on the home page,
   * `home` fills the home page's horizontal scroller, and everything appears in
   * the Works gallery regardless.
   */
  collection: Collection
}

export type Collection = 'featured' | 'home' | 'works'

export const COLLECTIONS: { value: Collection; label: string }[] = [
  { value: 'featured', label: 'Featured (home hero)' },
  { value: 'home', label: 'Home scroller' },
  { value: 'works', label: 'Works gallery only' },
]

// Thumbnails sized small for the sphere; hero sized large for the detail page.
const img = (base: string, w: number, h: number) =>
  `${base}&w=${w}&h=${h}&fit=crop&auto=format&q=80`

const src = {
  aurora: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?crop=entropy&cs=tinysrgb&fm=jpg',
  orbit: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?crop=entropy&cs=tinysrgb&fm=jpg',
  spheres: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?crop=entropy&cs=tinysrgb&fm=jpg',
  device: 'https://images.unsplash.com/photo-1672080070762-764c74ee1227?crop=entropy&cs=tinysrgb&fm=jpg',
  bloom: 'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?crop=entropy&cs=tinysrgb&fm=jpg',
  heart: 'https://images.unsplash.com/photo-1670189577367-2c6ef31a4b8c?crop=entropy&cs=tinysrgb&fm=jpg',
  paint: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?crop=entropy&cs=tinysrgb&fm=jpg',
  light: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?crop=entropy&cs=tinysrgb&fm=jpg',
  circle: 'https://images.unsplash.com/photo-1657632843433-e6a8b7451ac6?crop=entropy&cs=tinysrgb&fm=jpg',
  monolith: 'https://images.unsplash.com/photo-1522743791393-522312deeebf?crop=entropy&cs=tinysrgb&fm=jpg',
  concrete: 'https://images.unsplash.com/photo-1565371557106-c2abcc6fb36a?crop=entropy&cs=tinysrgb&fm=jpg',
  lines: 'https://images.unsplash.com/photo-1764209343170-75460c0b52bf?crop=entropy&cs=tinysrgb&fm=jpg',
  tower: 'https://images.unsplash.com/photo-1664296389612-572cca5d6ad0?crop=entropy&cs=tinysrgb&fm=jpg',
  arches: 'https://images.unsplash.com/photo-1691230600341-425cb048071c?crop=entropy&cs=tinysrgb&fm=jpg',
  bottle: 'https://images.unsplash.com/photo-1697638087672-3a314baf8c61?crop=entropy&cs=tinysrgb&fm=jpg',
  shampoo: 'https://images.unsplash.com/photo-1697638044627-683663954a37?crop=entropy&cs=tinysrgb&fm=jpg',
  camera: 'https://images.unsplash.com/photo-1561721632-a0d70ac1d15b?crop=entropy&cs=tinysrgb&fm=jpg',
  glasses: 'https://images.unsplash.com/photo-1775543775816-1af434fc6708?crop=entropy&cs=tinysrgb&fm=jpg',
  redcam: 'https://images.unsplash.com/photo-1761701391167-863560b27f5e?crop=entropy&cs=tinysrgb&fm=jpg',
  headphones: 'https://images.unsplash.com/photo-1761005654036-ffe7410d5d2a?crop=entropy&cs=tinysrgb&fm=jpg',
  vertex: 'https://images.unsplash.com/photo-1671869203911-cdaab14b9811?crop=entropy&cs=tinysrgb&fm=jpg',
  skate: 'https://images.unsplash.com/photo-1643036624745-dfb1a6dbedac?crop=entropy&cs=tinysrgb&fm=jpg',
  clockA: 'https://images.unsplash.com/photo-1646006027168-fab973768e43?crop=entropy&cs=tinysrgb&fm=jpg',
  brochures: 'https://images.unsplash.com/photo-1636247498840-693054bb4bcc?crop=entropy&cs=tinysrgb&fm=jpg',
  birds: 'https://images.unsplash.com/photo-1660470686548-b7d9fdab62d1?crop=entropy&cs=tinysrgb&fm=jpg',
  clockB: 'https://images.unsplash.com/photo-1675556003523-d600208f6fee?crop=entropy&cs=tinysrgb&fm=jpg',
  fruits: 'https://images.unsplash.com/photo-1777795530529-57a18bb4e99f?crop=entropy&cs=tinysrgb&fm=jpg',
  plant: 'https://images.unsplash.com/photo-1664882366127-8f47fc5e58c8?crop=entropy&cs=tinysrgb&fm=jpg',
  camera2: 'https://images.unsplash.com/photo-1761701390270-e99630731383?crop=entropy&cs=tinysrgb&fm=jpg',
  camera3: 'https://images.unsplash.com/photo-1761701390353-923bf77e075f?crop=entropy&cs=tinysrgb&fm=jpg',
  purple: 'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?crop=entropy&cs=tinysrgb&fm=jpg',
  waves: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?crop=entropy&cs=tinysrgb&fm=jpg',
}

interface Seed {
  collection?: Collection
  id: string
  title: string
  client: string
  year: number
  category: string[]
  key: keyof typeof src
  summary: string
  accent: string
}

const seeds: Seed[] = [
  { collection: 'featured', id: 'aurora', title: 'Aurora Field', client: 'Nomura Labs', year: 2025, category: ['WebGL', 'Brand'], key: 'aurora', accent: '#8b6ad1', summary: 'A generative identity system where a living gradient field responds to real-time market volatility.' },
  { collection: 'home', id: 'orbit', title: 'Orbit OS', client: 'Kepler', year: 2025, category: ['Product', 'UI'], key: 'orbit', accent: '#4f8fe0', summary: 'The operating layer for a constellation of low-orbit satellites, visualised as a single calm surface.' },
  { id: 'spheres', title: 'Soft Matter', client: 'Muji Future', year: 2024, category: ['Art Direction'], key: 'spheres', accent: '#d3a6c9', summary: 'A tactile campaign exploring the language of soft, weightless form across print and motion.' },
  { id: 'device', title: 'Halo', client: 'Northwave', year: 2024, category: ['Industrial', '3D'], key: 'device', accent: '#c9c4bb', summary: 'Launch film and configurator for a flagship device, rendered entirely in-browser.' },
  { collection: 'home', id: 'bloom', title: 'Bloom Engine', client: 'Sena', year: 2025, category: ['WebGL', 'Motion'], key: 'bloom', accent: '#e07fb0', summary: 'A particle-driven storytelling engine that blooms narrative from a single point of light.' },
  { id: 'heart', title: 'Pulse', client: 'Cardia', year: 2023, category: ['Data', 'Health'], key: 'heart', accent: '#e05a6b', summary: 'Turning millions of anonymised heartbeats into an intimate, reassuring visual companion.' },
  { id: 'paint', title: 'Wet Paint', client: 'Tate X', year: 2024, category: ['Editorial', 'Art'], key: 'paint', accent: '#6fae8f', summary: 'A digital-first exhibition where every scroll smears a fresh layer of pigment.' },
  { id: 'light', title: 'Lumen', client: 'Signify', year: 2023, category: ['Product', '3D'], key: 'light', accent: '#e6a3c4', summary: 'A configurator for architectural lighting that simulates real photometric behaviour live.' },
  { collection: 'home', id: 'circle', title: 'Eclipse', client: 'Rolex Arts', year: 2025, category: ['Brand', 'Motion'], key: 'circle', accent: '#c8493f', summary: 'A minimal timekeeping ritual rendered as two circles slowly finding alignment.' },
  { id: 'monolith', title: 'Monolith', client: 'Herzog Studio', year: 2024, category: ['Architecture'], key: 'monolith', accent: '#9a958c', summary: 'An immersive walkthrough of an unbuilt concrete pavilion, drawn from the original sketches.' },
  { id: 'lines', title: 'Structure', client: 'Foster Digital', year: 2025, category: ['3D', 'WebGL'], key: 'lines', accent: '#5b6b82', summary: 'Parametric facade studies made explorable — drag to bend the building against the sky.' },
  { id: 'tower', title: 'Ascent', client: 'Skanska', year: 2023, category: ['Architecture', 'Film'], key: 'tower', accent: '#b7b1a4', summary: 'A vertical scroll narrative climbing a tower floor by floor, told in a single continuous shot.' },
  { id: 'arches', title: 'Arcade', client: 'Prada Frames', year: 2024, category: ['Editorial'], key: 'arches', accent: '#8f8a80', summary: 'A black-and-white type experiment set beneath an endless colonnade of arches.' },
  { collection: 'home', id: 'bottle', title: 'Amber', client: 'Aesop', year: 2025, category: ['Product', 'Film'], key: 'bottle', accent: '#d08a3c', summary: 'A meditative product film shot in a single amber beam, extended into an interactive shelf.' },
  { id: 'camera', title: 'Aperture', client: 'Leica', year: 2024, category: ['Brand', '3D'], key: 'camera', accent: '#7d7a74', summary: 'A tribute to precision optics — a fully modelled rangefinder you can take apart, ring by ring.' },
  { id: 'glasses', title: 'Focal', client: 'Warby', year: 2023, category: ['Commerce', 'AR'], key: 'glasses', accent: '#c6a15b', summary: 'Try-on commerce reimagined as a warm, lamplit optician rather than a cold grid.' },
  { id: 'redcam', title: 'Redshift', client: 'RED', year: 2025, category: ['Film', 'WebGL'], key: 'redcam', accent: '#c8413a', summary: 'A cinematic microsite bathed in signature red, celebrating a new sensor generation.' },
  { id: 'headphones', title: 'Silence', client: 'Bang & Olufsen', year: 2024, category: ['Product', 'Sound'], key: 'headphones', accent: '#c0504a', summary: 'An audio-reactive landing experience that literally quietens as you lean in.' },
  { id: 'vertex', title: 'Vertex', client: 'Figment', year: 2025, category: ['WebGL', 'Art'], key: 'vertex', accent: '#9b6ad1', summary: 'A sculptural landing sequence where a single form unfolds into an entire brand world.' },
  { id: 'concrete', title: 'Concrete', client: 'Vans', year: 2024, category: ['Film', 'Culture'], key: 'skate', accent: '#8a8f96', summary: 'A gritty film capturing street culture in one unbroken, motion-tracked take.' },
  { id: 'meridian', title: 'Meridian', client: 'Patek', year: 2023, category: ['Brand', 'Heritage'], key: 'clockA', accent: '#b7b1a4', summary: 'A quiet celebration of horology, letting each complication tell its own story.' },
  { id: 'foldout', title: 'Foldout', client: 'Assouline', year: 2024, category: ['Print', 'Editorial'], key: 'brochures', accent: '#c2a35a', summary: 'A print-to-digital system where the fold of a page becomes the logic of a website.' },
  { id: 'perch', title: 'Perch', client: 'RSPB', year: 2025, category: ['Data', 'Nature'], key: 'birds', accent: '#6fae8f', summary: 'Turning decades of migration data into a living, breathing map of the skies.' },
  { id: 'chime', title: 'Chime', client: 'Heritage Trust', year: 2023, category: ['Heritage', 'Web'], key: 'clockB', accent: '#a9a29a', summary: 'An interactive archive that lets you ring history, hour by hour.' },
  { id: 'harvest', title: 'Harvest', client: 'Oatly', year: 2025, category: ['Campaign', 'Food'], key: 'fruits', accent: '#d0693c', summary: 'A cheeky, colour-drenched campaign that made an ingredient list feel like a party.' },
  { id: 'verdant', title: 'Verdant', client: 'Patch', year: 2024, category: ['Commerce', 'Nature'], key: 'plant', accent: '#5f9a6b', summary: 'Plant commerce reimagined as a calm, tactile shelf you can actually browse.' },
  { id: 'exposure', title: 'Exposure', client: 'Fujifilm', year: 2024, category: ['Product', 'Film'], key: 'camera2', accent: '#7d7a74', summary: 'A configurator that renders every lens and film simulation in real time.' },
  { id: 'shutter', title: 'Shutter', client: 'Kodak', year: 2023, category: ['Brand', 'Heritage'], key: 'camera3', accent: '#c8a13a', summary: 'A warm, analogue-inspired relaunch honouring a century of captured moments.' },
  { id: 'nebula', title: 'Nebula', client: 'Arc Studio', year: 2025, category: ['WebGL', 'Motion'], key: 'purple', accent: '#8b6ad1', summary: 'A hypnotic hero animation built from thousands of GPU-driven particles.' },
  { id: 'tide', title: 'Tide', client: 'Oceana', year: 2024, category: ['Brand', 'Data'], key: 'waves', accent: '#5a7fd0', summary: 'A flowing identity that rises and falls with real ocean-current data.' },
]

// --- editorial metadata -----------------------------------------------------
// Derived deterministically from each seed so every project reads as its own
// case study without hand-authoring thirty near-identical blocks.

const INDUSTRY: Record<string, string> = {
  WebGL: 'Technology', Brand: 'Brand & Identity', Product: 'Consumer Product',
  UI: 'Software', 'Art Direction': 'Culture', Industrial: 'Industrial Design',
  '3D': 'Immersive Media', Motion: 'Entertainment', Data: 'Data & Research',
  Health: 'Healthcare', Film: 'Film & Broadcast', Commerce: 'Retail & Commerce',
  AR: 'Emerging Tech', Sound: 'Audio', Art: 'Arts & Culture',
  Culture: 'Youth Culture', Heritage: 'Heritage', Print: 'Publishing',
  Editorial: 'Publishing', Nature: 'Conservation', Web: 'Digital',
  Campaign: 'Advertising', Food: 'Food & Beverage',
}

const REGIONS = ['London, UK', 'New York, US', 'Tokyo, JP', 'Copenhagen, DK', 'Auckland, NZ', 'Berlin, DE']
const DURATIONS = ['8 weeks', '12 weeks', '16 weeks', '5 months', '7 months', '10 months']
const ROLES = [
  'Creative Direction & Development',
  'Design Lead & Creative Technologist',
  'Art Direction & Front-end Engineering',
  'Experience Design & WebGL Development',
]
const PARTNERS = ['In-house team', 'Studio Field', 'Method & Co.', 'Locomotive', 'Independent collaboration']
const AWARDS = [
  ['Awwwards — Site of the Day', 'FWA of the Day'],
  ['Awwwards — Honourable Mention'],
  ['CSS Design Awards — Website of the Day', 'Awwwards — Developer Award'],
  [],
]
const TECHS = ['React', 'TypeScript', 'Three.js', 'GLSL', 'GSAP', 'WebGL', 'Next.js', 'Framer Motion', 'Lenis']

/** Stable small hash so each project always gets the same derived values. */
const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** Rotate a hex colour's hue to derive a complementary background tone. */
function shiftHue(hex: string, deg: number): string {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) / 255
  let g = ((n >> 8) & 255) / 255
  let b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  h = (h * 60 + deg + 360) % 360

  const c = (1 - Math.abs(2 * l - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const seg = Math.floor(h / 60) % 6
  const rgb: [number, number, number] =
    [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][seg] as [number, number, number]
  ;[r, g, b] = rgb
  const to = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export const projects: Project[] = seeds.map((s) => {
  const h = hash(s.id)
  const services = [...new Set([...s.category, 'Strategy', 'Design', 'Development'])].slice(0, 5)
  const techStart = h % TECHS.length
  return {
    id: s.id,
    title: s.title,
    client: s.client,
    year: s.year,
    category: s.category,
    summary: s.summary,
    accent: s.accent,
    accentAlt: shiftHue(s.accent, 55),
    collection: s.collection ?? 'works',
    thumb: img(src[s.key], 640, 400),
    hero: img(src[s.key], 1600, 1000),
    meta: {
      industry: INDUSTRY[s.category[0]] ?? 'Creative',
      region: REGIONS[h % REGIONS.length],
      services,
      scope: `${s.category.join(' · ')} — concept through launch`,
      role: ROLES[h % ROLES.length],
      duration: DURATIONS[h % DURATIONS.length],
      deliverables: ['Design system', 'Interactive prototype', 'Production build', 'Motion guidelines'].slice(
        0,
        3 + (h % 2),
      ),
      technologies: Array.from({ length: 4 }, (_, i) => TECHS[(techStart + i) % TECHS.length]),
      partner: PARTNERS[h % PARTNERS.length],
      awards: AWARDS[h % AWARDS.length],
    },
  }
})
