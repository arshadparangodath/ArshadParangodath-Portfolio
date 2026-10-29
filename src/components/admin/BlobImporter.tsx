import { useMemo, useState } from 'react'
import { getAdminToken } from '../../lib/adminAuth'
import { groupBlobAssets, matchBlobProject, type BlobAsset, type BlobCandidate } from '../../data/blobImport'
import { importBlobProjects } from '../../data/projectStore'
import type { Project } from '../../data/projects'
import { CoverMedia } from '../work/CoverMedia'

type Choice = { candidate: BlobCandidate; selected: boolean; targetId: string | null }
const inputClass = 'rounded-lg border border-white/20 bg-[#11131c] px-3 py-2 text-sm text-white'

export default function BlobImporter({ projects, onClose, onImported }: {
  projects: Project[]; onClose: () => void; onImported: (count: number) => void
}) {
  const [prefix, setPrefix] = useState('Assets/Projects/')
  const [files, setFiles] = useState<BlobAsset[]>([])
  const [scannedPrefix, setScannedPrefix] = useState('')
  const [split, setSplit] = useState(false)
  const [choices, setChoices] = useState<Choice[]>([])
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const selected = useMemo(() => choices.filter((c) => c.selected), [choices])

  const buildChoices = (assets: BlobAsset[], root: string, nested: boolean) =>
    groupBlobAssets(assets, root, nested).map((candidate) => ({
      candidate, selected: true, targetId: matchBlobProject(candidate, projects)?.id ?? null,
    }))

  const scan = async () => {
    const root = prefix.trim().replace(/\/+$/, '') + '/'
    setScanning(true); setError(''); setChoices([]); setFiles([]); setScannedPrefix(''); setProgress(0)
    try {
      const assets: BlobAsset[] = []
      let cursor: string | null = null
      const seen = new Set<string>()
      do {
        const query = new URLSearchParams({ prefix: root })
        if (cursor) query.set('cursor', cursor)
        const res = await fetch(`/api/blob-assets?${query}`, {
          headers: { 'x-admin-token': getAdminToken() ?? '' }, cache: 'no-store',
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || 'Could not scan folders. Try again.')
        if (!Array.isArray(body.files)) throw new Error('Invalid response from storage. Redeploy and try again.')
        assets.push(...body.files)
        setProgress(assets.length)
        cursor = body.cursor || null
        if (cursor && seen.has(cursor)) throw new Error('Storage pagination stopped progressing. Try a narrower folder.')
        if (cursor) seen.add(cursor)
        if (assets.length > 20000) throw new Error('Too many media files. Enter a single project folder and scan again.')
      } while (cursor)
      setFiles(assets); setScannedPrefix(root); setChoices(buildChoices(assets, root, split))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not scan folders.')
    } finally { setScanning(false) }
  }

  const update = (index: number, patch: Partial<Choice>) =>
    setChoices((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row))
  const publish = async () => {
    setBusy(true); setError('')
    try {
      await importBlobProjects(selected.map(({ candidate, targetId }) => ({ candidate, targetId })))
      onImported(selected.length)
    } catch (e) { setError(e instanceof Error ? e.message : 'Import failed. Try again.') }
    finally { setBusy(false) }
  }
  const locked = busy || scanning

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="blob-import-title" data-lenis-prevent
      className="fixed inset-0 z-[150] flex flex-col bg-[#080a10] text-white">
      <header className="flex items-center justify-between border-b border-white/15 px-6 py-5">
        <div>
          <h2 id="blob-import-title" className="text-xl">Import from Blob folders</h2>
          <p className="mt-1 text-sm text-white/50">Create projects in bulk, or add new assets to existing work.</p>
        </div>
        <button autoFocus disabled={locked} onClick={onClose} className={`${inputClass} disabled:opacity-40`}>Close</button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-56 flex-1 flex-col gap-2 text-sm text-white/70">
              Folder path in your Blob store
              <input value={prefix} disabled={locked} onChange={(e) => setPrefix(e.target.value)} className={inputClass} />
            </label>
            <button disabled={locked || !prefix.trim()} onClick={scan}
              className="rounded-lg bg-white px-5 py-2 text-sm text-black disabled:opacity-40">
              {scanning ? `Scanning… ${progress} media files` : 'Scan folders'}
            </button>
          </div>
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input type="checkbox" checked={split} disabled={locked} onChange={(e) => {
              setSplit(e.target.checked)
              if (scannedPrefix) setChoices(buildChoices(files, scannedPrefix, e.target.checked))
            }} />
            Separate subfolders into individual projects (for example, Healine’s three works)
          </label>
          <p className="text-sm leading-relaxed text-white/45">
            By default, each project folder includes its subfolders. Filenames determine media order;
            files named cover or thumbnail are preferred as covers. You can edit everything in the project editor later.
            Existing projects keep their text, media order and cover; updates only add missing assets.
          </p>
          {error && <p role="alert" className="rounded-lg border border-red-400/40 p-4 text-sm text-red-200">{error}</p>}
          {scannedPrefix && !choices.length && <p role="status" className="rounded-lg border border-white/20 p-5 text-sm text-white/70">
            No supported media found in {scannedPrefix}. Check the exact folder path and connected Blob store.
          </p>}
          {!!choices.length && <>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p>{choices.length} folders · {selected.length} selected</p>
              <button disabled={locked} className={inputClass} onClick={() =>
                setChoices((rows) => rows.map((r) => ({ ...r, selected: selected.length !== choices.length })))}>
                {selected.length === choices.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="space-y-4">
              {choices.map((choice, index) => {
                const { candidate } = choice
                const cover = candidate.gallery.find((m) => m.isCover) ?? candidate.gallery[0]
                return <div key={candidate.folder} className="flex flex-wrap gap-4 rounded-xl border border-white/15 p-4">
                  <label className="self-start pt-2">
                    <input type="checkbox" aria-label={`Import ${candidate.title}`} checked={choice.selected} disabled={locked}
                      onChange={(e) => update(index, { selected: e.target.checked })} />
                  </label>
                  <CoverMedia media={cover} alt={candidate.title} className="h-28 w-36 shrink-0 rounded-lg bg-white/5" />
                  <div className="min-w-56 flex-1 space-y-3">
                    <p className="break-all text-xs text-white/45">{candidate.folder} · {candidate.gallery.length} media</p>
                    <label className="flex flex-col gap-1 text-xs text-white/70">Project title
                      <input className={inputClass} value={candidate.title} disabled={locked || !!choice.targetId}
                        onChange={(e) => update(index, { candidate: { ...candidate, title: e.target.value } })} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-white/70">Import into
                      <select className={inputClass} value={choice.targetId ?? ''} disabled={locked} onChange={(e) => update(index, { targetId: e.target.value || null })}>
                        <option value="">Create a new project</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>Update: {p.title}</option>)}
                      </select>
                    </label>
                    {!choice.targetId && <label className="flex flex-col gap-1 text-xs text-white/70">Cover
                      <select className={inputClass} disabled={locked} value={cover?.url ?? ''} onChange={(e) => update(index, {
                        candidate: { ...candidate, gallery: candidate.gallery.map((m) => ({ ...m, isCover: m.url === e.target.value })) },
                      })}>
                        {candidate.gallery.map((m) => <option key={m.url} value={m.url}>{m.url.split('/').pop()?.split('?')[0] ?? m.url}</option>)}
                      </select>
                    </label>}
                  </div>
                </div>
              })}
            </div>
          </>}
        </div>
      </div>
      <footer className="flex items-center justify-between gap-4 border-t border-white/15 px-6 py-4">
        <p className="text-xs text-white/50">Import publishes selected projects to Works. No assets are moved or deleted.</p>
        <button disabled={locked || !selected.length} onClick={publish}
          className="shrink-0 rounded-full bg-white px-5 py-3 text-sm text-black disabled:opacity-40">
          {busy ? 'Saving…' : `Import ${selected.length} folders`}
        </button>
      </footer>
    </div>
  )
}
