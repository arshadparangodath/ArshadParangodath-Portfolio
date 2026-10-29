import { getCoverMedia, normalizeGallery, normalizeMediaItem, type MediaItem } from './media'
import type { Project } from './projects'

export interface BlobAsset { pathname: string; url: string }
export interface BlobCandidate { folder: string; title: string; gallery: MediaItem[] }

export function groupBlobAssets(files: BlobAsset[], prefix: string, splitNested: boolean): BlobCandidate[] {
  const root = prefix.replace(/\/+$/, '') + '/'
  const groups = new Map<string, BlobAsset[]>()
  for (const file of files) {
    if (!file.pathname.startsWith(root) || !file.url ||
        file.pathname.split('/').some((part) => part.startsWith('.') || part === '__MACOSX') ||
        !/\.(jpe?g|png|webp|avif|gif|mp4|webm|mov|m4v)$/i.test(file.pathname)) continue
    const relative = file.pathname.slice(root.length)
    const parts = relative.split('/')
    // Files directly in the selected root belong to that folder itself.
    const folder = parts.length === 1 ? root : splitNested
      ? root + parts.slice(0, -1).join('/') + '/' : root + parts[0] + '/'
    const group = groups.get(folder) ?? []
    group.push(file)
    groups.set(folder, group)
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([folder, assets]) => {
    assets.sort((a, b) => a.pathname.localeCompare(b.pathname, undefined, { numeric: true }))
    const unique = assets.filter((f, i) => assets.findIndex((a) => a.url === f.url) === i)
    const coverIndex = unique.findIndex((f) => /(?:^|[\s_\-/])(cover|thumbnail|thumb)(?:[\s_.\-/]|$)/i.test(f.pathname.slice(folder.length)))
    const relative = folder.slice(root.length).replace(/\/$/, '') || root.replace(/\/$/, '').split('/').pop() || 'Project'
    const title = relative.split('/').map((part) => part.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')).join(' — ')
    return {
      folder, title,
      gallery: unique.map((f, i) => ({ ...normalizeMediaItem(f.pathname), url: f.url, isCover: i === Math.max(coverIndex, 0) })),
    }
  })
}

/** Link by saved folder or existing media, so manually entered work is not duplicated. */
export function matchBlobProject(candidate: BlobCandidate, projects: Project[]): Project | undefined {
  const linked = projects.find((p) => p.blobFolder === candidate.folder)
  if (linked) return linked
  const urls = new Set(candidate.gallery.map((m) => m.url))
  const matches = projects.filter((p) => normalizeGallery(p.gallery).some((m) => urls.has(m.url)) ||
    (p.thumb && urls.has(p.thumb)) || (p.hero && urls.has(p.hero)))
  return matches.length === 1 ? matches[0] : undefined
}

/** Append new assets only. Preserve edited text, cover, order and existing media. */
export function mergeBlobProject(project: Project, candidate: BlobCandidate): Project {
  const legacyCover = getCoverMedia(project)
  const existing = normalizeGallery(project.gallery)
  const gallery = existing.length ? existing : legacyCover ? [{ ...legacyCover, isCover: true }] : []
  const urls = new Set(gallery.map((m) => m.url))
  const additions = candidate.gallery.filter((m) => !urls.has(m.url)).map((m) => ({ ...m, isCover: false }))
  return { ...project, blobFolder: candidate.folder, gallery: [...gallery, ...additions] }
}
