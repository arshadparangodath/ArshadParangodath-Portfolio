import { useMemo, useRef, useState } from 'react'
import { COLLECTIONS, type Collection, type Project } from '../../data/projects'
import {
  deleteProject,
  emptyProject,
  exportJSON,
  importJSON,
  isSeed,
  resetProjects,
  saveProject,
} from '../../data/projectStore'
import { useProjects } from '../../hooks/useProjects'

const listToText = (v: string[]) => v.join(', ')
const textToList = (v: string) =>
  v.split(',').map((s) => s.trim()).filter(Boolean)

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

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

function Editor({
  initial,
  onDone,
  onCancel,
}: {
  initial: Project
  onDone: () => void
  onCancel: () => void
}) {
  const [p, setP] = useState<Project>(() => structuredClone(initial))
  const locked = initial.id !== ''
  const set = (patch: Partial<Project>) => setP((c) => ({ ...c, ...patch }))
  const setMeta = (patch: Partial<Project['meta']>) =>
    setP((c) => ({ ...c, meta: { ...c.meta, ...patch } }))

  const save = () => {
    const id = p.id || slugify(p.title)
    if (!id || !p.title.trim()) return
    saveProject({ ...p, id, year: Number(p.year) || new Date().getFullYear() })
    onDone()
  }

  return (
    <div className="flex h-full flex-col">
      {/* sticky header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-4 sm:px-8">
        <h3 className="font-display text-lg font-light text-white">
          {locked ? `Edit — ${initial.title}` : 'New project'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={save}
            className="rounded-full bg-white px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-black transition hover:bg-white/85"
          >
            Save
          </button>
          <button
            onClick={onCancel}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Thumbnail URL" value={p.thumb} onChange={(v) => set({ thumb: v })} hint="3D card" />
              <Field label="Hero image URL" value={p.hero} onChange={(v) => set({ hero: v })} hint="Project page — main image" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Gallery image 1 URL"
                value={p.gallery?.[0] ?? ''}
                onChange={(v) => set({ gallery: [v, p.gallery?.[1] ?? ''] })}
                hint="Full-bleed still — falls back to hero image if left blank"
              />
              <Field
                label="Gallery image 2 URL"
                value={p.gallery?.[1] ?? ''}
                onChange={(v) => set({ gallery: [p.gallery?.[0] ?? '', v] })}
                hint="Detail shot — falls back to thumbnail if left blank"
              />
            </div>
            {(p.thumb || p.hero || p.gallery?.[0] || p.gallery?.[1]) && (
              <div className="flex flex-wrap gap-3">
                {[
                  { url: p.thumb, label: 'Thumb' },
                  { url: p.hero, label: 'Hero' },
                  { url: p.gallery?.[0], label: 'Gallery 1' },
                  { url: p.gallery?.[1], label: 'Gallery 2' },
                ]
                  .filter((i) => i.url)
                  .map((i) => (
                    <div key={i.label} className="relative">
                      <img src={i.url} alt="" className="h-20 w-28 rounded-lg border border-white/10 object-cover" />
                      <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/60 py-0.5 text-center font-mono text-[9px] uppercase tracking-wider text-white/70">
                        {i.label}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <Field
              label="Case study URL"
              value={p.caseStudyUrl ?? ''}
              onChange={(v) => set({ caseStudyUrl: v })}
              hint="Optional — external link (PDF, live site, Notion, etc). Adds a 'Complete case study' button that opens in a new tab."
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
  const [editing, setEditing] = useState<Project | null>(null)
  const [query, setQuery] = useState('')
  const [collectionFilter, setCollectionFilter] = useState<string>(ALL_FILTER)
  const file = useRef<HTMLInputElement>(null)

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

  const upload = (f: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importJSON(String(reader.result))
      } catch {
        alert('That file could not be read as project data.')
      }
    }
    reader.readAsText(f)
  }

  const FILTER_TABS = [
    { value: ALL_FILTER, label: 'All' },
    ...COLLECTIONS,
  ]

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#06070c]">
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
          </div>
          <button
            onClick={onClose}
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
          <Editor initial={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />
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
                onClick={() => {
                  if (confirm('Discard all CMS changes and restore the original projects?')) {
                    resetProjects()
                  }
                }}
                className="rounded-full border border-red-400/30 px-4 py-2 text-xs uppercase tracking-[0.18em] text-red-300/80 transition hover:text-red-200"
              >
                Reset
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
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                    <td className="px-6 py-3 sm:px-10">
                      <span
                        className="block h-9 w-12 rounded border border-white/10 bg-cover bg-center"
                        style={{ backgroundImage: `url(${p.thumb})`, backgroundColor: p.accent }}
                      />
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
                        className="text-xs uppercase tracking-[0.15em] text-white/60 transition hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirm(`Delete "${p.title}"?`) && deleteProject(p.id)}
                        className="ml-4 text-xs uppercase tracking-[0.15em] text-red-300/60 transition hover:text-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
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
