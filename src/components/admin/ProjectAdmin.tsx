import { useEffect, useMemo, useRef, useState } from 'react'
import { COLLECTIONS, type Collection, type Project } from '../../data/projects'
import {
  COVER_ELIGIBLE_TYPES,
  MEDIA_TYPES,
  MEDIA_TYPE_HINTS,
  MEDIA_TYPE_LABELS,
  coerceGalleryForEditing,
  getCoverMedia,
  type MediaItem,
  type MediaType,
} from '../../data/media'
import {
  deleteProject,
  emptyProject,
  exportJSON,
  importJSON,
  isSeed,
  resetProjects,
  saveProject,
} from '../../data/projectStore'
import { useProjects, useProjectsLoaded } from '../../hooks/useProjects'

const listToText = (v: string[]) => v.join(', ')
const textToList = (v: string) =>
  v.split(',').map((s) => s.trim()).filter(Boolean)

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** A styled yes/no confirmation, used for unsaved-changes warnings. */
function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Discard changes',
  cancelLabel = 'Keep editing',
  onConfirm,
  onCancel,
}: {
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b0d13] p-7">
        <h3 className="font-display text-lg font-light text-white">{title}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-white/60">{body}</p>
        <div className="mt-7 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.15em] text-white/70 transition hover:text-white"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-red-400/90 px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-black transition hover:bg-red-300"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  hint?: string
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/45"
      />
      {hint && <span className="mt-1 block text-[10px] text-white/30">{hint}</span>}
    </label>
  )
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full resize-y rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/45"
      />
    </label>
  )
}

/**
 * Manages the project's full media list: any number of items, each its own
 * type (image, GIF, video, Figma prototype, or other embed), with captions,
 * reordering, and one item flagged as the cover — which doubles as the 3D
 * card thumbnail, Home page preview, and project page hero, so there's only
 * ever one thumbnail/hero image to manage instead of three separate fields.
 */
function GalleryEditor({
  items,
  onChange,
}: {
  items: MediaItem[]
  onChange: (items: MediaItem[]) => void
}) {
  const update = (i: number, patch: Partial<MediaItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => onChange([...items, { type: 'image', url: '', caption: '' }])
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const setCover = (i: number) =>
    onChange(items.map((it, idx) => ({ ...it, isCover: idx === i })))

  const hasExplicitCover = items.some((it) => it.isCover)

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          Media — images, GIFs, video, Figma prototypes, embeds
        </span>
        <button
          type="button"
          onClick={add}
          className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-white/70 transition hover:border-white/45 hover:text-white"
        >
          + Add media
        </button>
      </div>

      {items.length === 0 && (
        <p className="mt-2 text-[11px] text-white/35">
          None yet — add at least one to use as the thumbnail/cover/hero.
        </p>
      )}
      {items.length > 0 && !hasExplicitCover && (
        <p className="mt-2 text-[11px] text-amber-300/60">
          No cover chosen yet — the first image/GIF/video below is being used by default.
        </p>
      )}

      <div className="mt-3 space-y-3">
        {items.map((item, i) => {
          const eligible = COVER_ELIGIBLE_TYPES.includes(item.type)
          return (
            <div
              key={i}
              className={`rounded-lg border p-3 transition ${
                item.isCover ? 'border-emerald-400/50 bg-emerald-400/[0.05]' : 'border-white/12 bg-white/[0.03]'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={item.type}
                  onChange={(e) => update(i, { type: e.target.value as MediaType, isCover: eligible ? item.isCover : false })}
                  className="rounded-md border border-white/15 bg-[#0b0d13] px-2 py-1.5 text-xs text-white outline-none focus:border-white/45"
                >
                  {MEDIA_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {MEDIA_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>

                {eligible && (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    disabled={!!item.isCover}
                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.12em] transition ${
                      item.isCover
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'border border-white/20 text-white/60 hover:border-white/45 hover:text-white'
                    }`}
                  >
                    {item.isCover ? '★ Cover' : 'Set as cover'}
                  </button>
                )}

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="rounded px-2 py-1 text-xs text-white/50 transition hover:text-white disabled:opacity-25"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                    className="rounded px-2 py-1 text-xs text-white/50 transition hover:text-white disabled:opacity-25"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="ml-1 rounded px-2 py-1 text-xs uppercase tracking-wide text-red-300/70 transition hover:text-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <input
                value={item.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="https://…"
                className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/45"
              />
              <span className="mt-1 block text-[10px] text-white/30">{MEDIA_TYPE_HINTS[item.type]}</span>

              <input
                value={item.caption ?? ''}
                onChange={(e) => update(i, { caption: e.target.value })}
                placeholder="Caption (optional)"
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/80 outline-none transition focus:border-white/35"
              />

              {item.url && (item.type === 'image' || item.type === 'gif') && (
                <img src={item.url} alt="" className="mt-2 h-16 w-24 rounded-md border border-white/10 object-cover" />
              )}
              {item.url && item.type === 'video' && (
                <video src={item.url} muted className="mt-2 h-16 w-24 rounded-md border border-white/10 object-cover" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Editor({
  initial,
  onDone,
  onCancel,
  onDirtyChange,
}: {
  initial: Project
  onDone: () => void
  onCancel: () => void
  onDirtyChange?: (dirty: boolean) => void
}) {
  const [p, setP] = useState<Project>(() => structuredClone(initial))
  const [saving, setSaving] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const locked = initial.id !== ''
  const dirty = useMemo(() => JSON.stringify(p) !== JSON.stringify(initial), [p, initial])

  useEffect(() => {
    onDirtyChange?.(dirty)
    return () => onDirtyChange?.(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty])

  const set = (patch: Partial<Project>) => setP((c) => ({ ...c, ...patch }))
  const setMeta = (patch: Partial<Project['meta']>) =>
    setP((c) => ({ ...c, meta: { ...c.meta, ...patch } }))

  const save = async () => {
    const id = p.id || slugify(p.title)
    if (!id || !p.title.trim()) return
    setSaving(true)
    try {
      const gallery = (p.gallery ?? []).filter((m) => m.url.trim() !== '')
      await saveProject({ ...p, id, gallery, year: Number(p.year) || new Date().getFullYear() })
      onDone()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save — check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const requestCancel = () => {
    if (dirty) setConfirmingClose(true)
    else onCancel()
  }

  return (
    <div className="flex h-full flex-col">
      {confirmingClose && (
        <ConfirmDialog
          title="Discard unsaved changes?"
          body="You've made edits to this project that haven't been saved yet. Closing now will lose them."
          onConfirm={onCancel}
          onCancel={() => setConfirmingClose(false)}
        />
      )}

      {/* sticky header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-4 sm:px-8">
        <h3 className="font-display text-lg font-light text-white">
          {locked ? `Edit — ${initial.title}` : 'New project'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-white px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-black transition hover:bg-white/85 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={requestCancel}
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* scrollable body */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6 sm:px-8"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
      >
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" value={p.title} onChange={(v) => set({ title: v })} />
            <Field
              label="ID / slug"
              value={p.id}
              onChange={(v) => set({ id: slugify(v) })}
              hint={locked ? 'Locked while editing' : 'Auto-generated from title if left blank'}
            />
            <Field label="Client" value={p.client} onChange={(v) => set({ client: v })} />
            <Field label="Year" type="number" value={p.year} onChange={(v) => set({ year: Number(v) })} />
            <Field
              label="Categories"
              value={listToText(p.category)}
              onChange={(v) => set({ category: textToList(v) })}
              hint="Comma separated"
            />
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Placement
              </span>
              <select
                value={p.collection}
                onChange={(e) => set({ collection: e.target.value as Collection })}
                className="mt-2 w-full appearance-none rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/60"
              >
                {COLLECTIONS.map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#0b0d14]">
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-[11px] text-white/35">
                Everything appears in Works; this picks the home-page slot.
              </span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Accent" type="color" value={p.accent} onChange={(v) => set({ accent: v })} />
              <Field label="Accent alt" type="color" value={p.accentAlt} onChange={(v) => set({ accentAlt: v })} />
            </div>
          </section>

          <section className="space-y-4">
            <Area label="Summary" value={p.summary} onChange={(v) => set({ summary: v })} />
            <Field
              label="Case study URL"
              value={p.caseStudyUrl ?? ''}
              onChange={(v) => set({ caseStudyUrl: v })}
              hint="Optional — external link (PDF, live site, Notion, etc). Adds a 'Complete case study' button that opens in a new tab."
            />
            <GalleryEditor
              items={coerceGalleryForEditing(p.gallery)}
              onChange={(gallery) => set({ gallery })}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry" value={p.meta.industry} onChange={(v) => setMeta({ industry: v })} />
            <Field label="Region" value={p.meta.region} onChange={(v) => setMeta({ region: v })} />
            <Field label="Collaboration" value={p.meta.partner} onChange={(v) => setMeta({ partner: v })} />
            <Field label="Duration" value={p.meta.duration} onChange={(v) => setMeta({ duration: v })} />
            <Field label="Role" value={p.meta.role} onChange={(v) => setMeta({ role: v })} />
            <Field label="Scope" value={p.meta.scope} onChange={(v) => setMeta({ scope: v })} />
            <Field label="Services" value={listToText(p.meta.services)} onChange={(v) => setMeta({ services: textToList(v) })} />
            <Field label="Deliverables" value={listToText(p.meta.deliverables)} onChange={(v) => setMeta({ deliverables: textToList(v) })} />
            <Field label="Technologies" value={listToText(p.meta.technologies)} onChange={(v) => setMeta({ technologies: textToList(v) })} />
            <Field label="Awards" value={listToText(p.meta.awards)} onChange={(v) => setMeta({ awards: textToList(v) })} />
          </section>
        </div>
      </div>
    </div>
  )
}

const ALL_FILTER = 'all'

export function ProjectAdmin({ onClose }: { onClose: () => void }) {
  const projects = useProjects()
  const synced = useProjectsLoaded()
  const [editing, setEditing] = useState<Project | null>(null)
  const [editorDirty, setEditorDirty] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [query, setQuery] = useState('')
  const [collectionFilter, setCollectionFilter] = useState<string>(ALL_FILTER)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const requestClose = () => {
    if (editing && editorDirty) setConfirmingClose(true)
    else onClose()
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      if (collectionFilter !== ALL_FILTER && p.collection !== collectionFilter) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.category.join(' ').toLowerCase().includes(q)
      )
    })
  }, [projects, query, collectionFilter])

  const download = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'projects.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const remove = async (p: Project) => {
    if (!confirm(`Delete "${p.title}"?`)) return
    setBusyId(p.id)
    try {
      await deleteProject(p.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete — check your connection and try again.')
    } finally {
      setBusyId(null)
    }
  }

  const reset = async () => {
    if (!confirm('Discard all CMS changes and restore the original projects?')) return
    setResetting(true)
    try {
      await resetProjects()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not reset — check your connection and try again.')
    } finally {
      setResetting(false)
    }
  }

  const upload = (f: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await importJSON(String(reader.result))
      } catch (err) {
        alert(
          err instanceof Error
            ? err.message
            : 'That file could not be read as project data — expecting a JSON array of projects.',
        )
      }
    }
    reader.readAsText(f)
  }

  const FILTER_TABS = [
    { value: ALL_FILTER, label: 'All' },
    ...COLLECTIONS,
  ]

  return (
    <div data-lenis-prevent className="fixed inset-0 z-[90] flex flex-col bg-[#06070c]">
      {confirmingClose && (
        <ConfirmDialog
          title="Discard unsaved changes?"
          body="You have an unsaved project open. Closing the content manager now will lose those edits."
          onConfirm={() => {
            setConfirmingClose(false)
            onClose()
          }}
          onCancel={() => setConfirmingClose(false)}
        />
      )}

      {/* Grid atmosphere matching home page */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '84px 84px',
        }}
      />

      {/* ---------- top bar ---------- */}
      <header className="relative z-10 shrink-0 border-b border-white/10 bg-[#06070c]/90 px-6 py-4 backdrop-blur-sm sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">CMS</p>
            <h2 className="font-display text-xl font-light tracking-tight text-white">Project database</h2>
            <span className="rounded bg-white/8 px-2 py-0.5 font-mono text-[10px] text-white/40">
              {projects.length} projects
            </span>
            <span
              className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                synced ? 'bg-emerald-400/10 text-emerald-300/70' : 'bg-amber-400/10 text-amber-300/70'
              }`}
            >
              {synced ? 'Synced' : 'Loading…'}
            </span>
          </div>
          <button
            onClick={requestClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:text-white"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
      </header>

      {editing ? (
        /* ---------- editor panel ---------- */
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <Editor
            key={editing.id || 'new'}
            initial={editing}
            onDone={() => {
              setEditorDirty(false)
              setEditing(null)
            }}
            onCancel={() => {
              setEditorDirty(false)
              setEditing(null)
            }}
            onDirtyChange={setEditorDirty}
          />
        </div>
      ) : (
        /* ---------- list panel ---------- */
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          {/* toolbar */}
          <div className="shrink-0 border-b border-white/8 px-6 py-3 sm:px-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setEditing(emptyProject())}
                className="rounded-full bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-black transition hover:bg-white/85"
              >
                + Add
              </button>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
              />
              <button
                onClick={download}
                className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
              >
                Export
              </button>
              <button
                onClick={() => file.current?.click()}
                className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
              >
                Import
              </button>
              <input
                ref={file}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
              <button
                onClick={reset}
                disabled={resetting}
                className="rounded-full border border-red-400/30 px-4 py-2 text-xs uppercase tracking-[0.18em] text-red-300/80 transition hover:text-red-200 disabled:opacity-50"
              >
                {resetting ? 'Resetting…' : 'Reset'}
              </button>
            </div>

            {/* collection filter tabs */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setCollectionFilter(tab.value)}
                  className={`rounded-full px-3.5 py-1 text-[11px] font-mono uppercase tracking-[0.15em] transition ${
                    collectionFilter === tab.value
                      ? 'bg-white text-black'
                      : 'border border-white/20 text-white/55 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {rows.length !== projects.length && (
                <span className="self-center font-mono text-[10px] text-white/35">
                  {rows.length} shown
                </span>
              )}
            </div>
          </div>

          {/* scrollable table */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
          >
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#06070c]/95 backdrop-blur-sm">
                <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  <th className="px-6 py-3 font-normal sm:px-10">Cover</th>
                  <th className="px-4 py-3 font-normal">Title</th>
                  <th className="hidden px-4 py-3 font-normal sm:table-cell">Client</th>
                  <th className="hidden px-4 py-3 font-normal md:table-cell">Categories</th>
                  <th className="hidden px-4 py-3 font-normal sm:table-cell">Placement</th>
                  <th className="px-4 py-3 font-normal">Year</th>
                  <th className="px-4 py-3 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const cover = getCoverMedia(p)
                  return (
                  <tr key={p.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                    <td className="px-6 py-3 sm:px-10">
                      {cover?.type === 'video' ? (
                        <video
                          src={cover.url}
                          muted
                          className="block h-9 w-12 rounded border border-white/10 object-cover"
                          style={{ backgroundColor: p.accent }}
                        />
                      ) : (
                        <span
                          className="block h-9 w-12 rounded border border-white/10 bg-cover bg-center"
                          style={{ backgroundImage: cover ? `url(${cover.url})` : undefined, backgroundColor: p.accent }}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/90">
                      {p.title}
                      {!isSeed(p.id) && (
                        <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/50">
                          new
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-white/55 sm:table-cell">{p.client}</td>
                    <td className="hidden px-4 py-3 text-white/45 md:table-cell">{p.category.join(', ')}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          p.collection === 'featured'
                            ? 'bg-white/85 text-black'
                            : p.collection === 'home'
                              ? 'bg-white/15 text-white/80'
                              : 'text-white/35'
                        }`}
                      >
                        {p.collection}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/55">{p.year}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        disabled={busyId === p.id}
                        className="text-xs uppercase tracking-[0.15em] text-white/60 transition hover:text-white disabled:opacity-40"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(p)}
                        disabled={busyId === p.id}
                        className="ml-4 text-xs uppercase tracking-[0.15em] text-red-300/60 transition hover:text-red-200 disabled:opacity-40"
                      >
                        {busyId === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="py-16 text-center font-mono text-sm text-white/30">No projects match.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
