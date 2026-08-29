export type MediaType = 'image' | 'gif' | 'video' | 'figma' | 'iframe'

export interface MediaItem {
  type: MediaType
  /**
   * For 'image'/'gif'/'video': a direct file URL.
   * For 'figma': the normal Figma share/prototype link (Share → Copy link) —
   * NOT a special embed URL, this gets converted automatically.
   * For 'iframe': any embeddable URL (Framer, ProtoPie, YouTube, Vimeo, etc).
   */
  url: string
  /** Optional caption shown under the media. */
  caption?: string
  /**
   * Marks this item as the project's thumbnail/cover/hero — the single image
   * shown in the 3D card, the Home page previews, and the project page's
   * main banner. Only one item in a gallery should have this set; helpers
   * below enforce that. Only image/gif/video items are eligible — an
   * embedded prototype can't sensibly serve as a thumbnail.
   */
  isCover?: boolean
  /**
   * How this item sits in the gallery grid — 'full' takes the entire row,
   * 'half' sits side by side with an adjacent 'half' item. Defaults to
   * 'full' when unset, matching the original always-full-width behaviour.
   */
  layout?: 'full' | 'half'
}

export const MEDIA_TYPES: MediaType[] = ['image', 'gif', 'video', 'figma', 'iframe']

/** Types that can be picked as the project's cover/thumbnail/hero. */
export const COVER_ELIGIBLE_TYPES: MediaType[] = ['image', 'gif', 'video']

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  image: 'Image',
  gif: 'GIF',
  video: 'Video (MP4/MOV)',
  figma: 'Figma prototype',
  iframe: 'Other embed (iframe)',
}

export const MEDIA_TYPE_HINTS: Record<MediaType, string> = {
  image: 'Direct link to a .jpg/.png/.webp file',
  gif: 'Direct link to a .gif file — plays automatically',
  video: 'Direct link to a .mp4 or .mov file — plays muted & looped like a GIF, with controls',
  figma: 'Paste the normal Figma Share link (prototype or file) — converted to an embed automatically',
  iframe: 'Any other embeddable URL (Framer, ProtoPie, YouTube, Vimeo, Notion, etc.)',
}

/** Turns a normal Figma share link into its embeddable iframe URL. */
export function figmaEmbedSrc(url: string): string {
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
}

/**
 * Coerces one raw gallery entry into a MediaItem. Handles the pre-media-types
 * format (a plain image URL string) transparently, so older projects that
 * were saved before this feature existed keep rendering correctly.
 */
export function normalizeMediaItem(raw: unknown): MediaItem {
  if (typeof raw === 'string') return { type: 'image', url: raw }
  if (raw && typeof raw === 'object' && 'url' in raw) {
    const r = raw as Partial<MediaItem>
    const type = MEDIA_TYPES.includes(r.type as MediaType) ? (r.type as MediaType) : 'image'
    return { type, url: r.url ?? '', caption: r.caption, isCover: r.isCover, layout: r.layout === 'half' ? 'half' : 'full' }
  }
  return { type: 'image', url: '' }
}

export function normalizeGallery(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeMediaItem).filter((m) => m.url.trim() !== '')
}

/**
 * Same shape-coercion as normalizeGallery, but keeps blank/in-progress
 * entries instead of filtering them out — used by the admin editor, where a
 * freshly-added row has no URL yet and needs to stay visible so you can type
 * one in. normalizeGallery's filtering is correct for display purposes
 * (nothing should render with an empty URL) but wrong for editing (a row you
 * just added would vanish before you could fill it in).
 */
export function coerceGalleryForEditing(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeMediaItem)
}

/**
 * Resolves the single item that should represent this project as its
 * thumbnail/cover/hero — whichever gallery item has `isCover: true`, falling
 * back to the first eligible gallery item, then to the legacy `thumb`/`hero`
 * fields (for projects saved before this feature existed), so nothing goes
 * blank while a project hasn't been touched yet.
 */
export function getCoverMedia(project: {
  gallery?: unknown
  thumb?: string
  hero?: string
}): MediaItem | null {
  const gallery = normalizeGallery(project.gallery)
  const explicit = gallery.find((m) => m.isCover && COVER_ELIGIBLE_TYPES.includes(m.type))
  if (explicit) return explicit
  const firstEligible = gallery.find((m) => COVER_ELIGIBLE_TYPES.includes(m.type))
  if (firstEligible) return firstEligible
  if (project.hero) return { type: 'image', url: project.hero }
  if (project.thumb) return { type: 'image', url: project.thumb }
  return null
}

/** The gallery items to show in the scrollable media section — everything
 *  except whichever item is currently serving as the cover, so it isn't
 *  shown twice on the same page. */
export function getSecondaryMedia(project: { gallery?: unknown; thumb?: string; hero?: string }): MediaItem[] {
  const gallery = normalizeGallery(project.gallery)
  const cover = getCoverMedia(project)
  if (!cover) return gallery
  let skipped = false
  return gallery.filter((m) => {
    if (!skipped && m === cover) {
      skipped = true
      return false
    }
    return true
  })
}
