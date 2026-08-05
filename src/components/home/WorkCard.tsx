import { useState } from 'react'
import type { Project } from '../../data/projects'

/**
 * Portrait card that expands on hover to reveal project metadata.
 * Matches the accordion-card gallery reference: narrow by default,
 * wider on hover with a bottom overlay showing title + "View case".
 */
export function WorkCard({
  project,
  onClick,
  defaultExpanded = false,
}: {
  project: Project
  onClick: () => void
  defaultExpanded?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const expanded = hovered || defaultExpanded

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative shrink-0 cursor-pointer overflow-hidden rounded-2xl text-left focus:outline-none"
      style={{
        // Narrow collapsed → wider on hover
        width: expanded
          ? 'clamp(240px, 32vw, 420px)'
          : 'clamp(120px, 14vw, 200px)',
        height: 'clamp(340px, 60vh, 680px)',
        transition: 'width 620ms cubic-bezier(.16,1,.3,1)',
        flexShrink: 0,
      }}
      aria-label={`Open ${project.title}`}
    >
      {/* image */}
      <img
        src={project.hero || project.thumb}
        alt={project.title}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform: expanded ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 800ms cubic-bezier(.16,1,.3,1)',
        }}
      />

      {/* dark gradient overlay at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
          opacity: expanded ? 1 : 0.4,
          transition: 'opacity 480ms ease',
        }}
      />

      {/* year badge at top */}
      <div
        className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60"
        style={{
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity 380ms ease, transform 380ms ease',
        }}
      >
        {project.year}
      </div>

      {/* bottom info */}
      <div
        className="absolute inset-x-0 bottom-0 p-5"
        style={{
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 400ms ease 60ms, transform 400ms cubic-bezier(.16,1,.3,1) 60ms',
        }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/50">
          {project.client}
        </p>
        <h3 className="mt-1.5 font-display text-xl font-light leading-tight text-white">
          {project.title}
        </h3>
        <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 transition-colors group-hover:text-white">
          <span className="text-sm">↳</span>
          View case
        </div>
      </div>
    </button>
  )
}
