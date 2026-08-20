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
}

export const MEDIA_TYPES: MediaType[] = ['image', 'gif', 'video', 'figma', 'iframe']

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
    return { type, url: r.url ?? '', caption: r.caption }
  }
  return { type: 'image', url: '' }
}

export function normalizeGallery(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeMediaItem).filter((m) => m.url.trim() !== '')
}
