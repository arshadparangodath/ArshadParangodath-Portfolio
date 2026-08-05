import { useEffect, useRef, useState } from 'react'

/**
 * Token can be a word (lights up on scroll) or a colored icon (always visible
 * at full color, scales in once its position is reached).
 */
type Token =
  | { kind: 'word'; word: string; line: number }
  | { kind: 'icon'; emoji: string; color: string; line: number }

const RAW: (string | { icon: string; color: string })[] = [
  'Multidisciplinary',
  'designer',
  { icon: '🎨', color: '#e879f9' },
  'crafting',
  'thoughtful',
  { icon: '✦', color: '#facc15' },
  'digital',
  'products,',
  { icon: '📱', color: '#60a5fa' },
  'brands,',
  'and',
  'experiences',
  { icon: '🌐', color: '#34d399' },
  'through',
  'strategy,',
  'creativity,',
  { icon: '⚡', color: '#fb923c' },
  'and',
  'technology.',
]

// Build the token list with line numbers derived from cumulative word count.
const LINE_BREAKS_AFTER_WORD_COUNT = [5, 11] // approx visual breaks

function buildTokens(): Token[] {
  const tokens: Token[] = []
  let wordCount = 0
  let line = 0
  for (const item of RAW) {
    if (typeof item === 'string') {
      if (LINE_BREAKS_AFTER_WORD_COUNT.includes(wordCount)) line++
      tokens.push({ kind: 'word', word: item, line })
      wordCount++
    } else {
      tokens.push({ kind: 'icon', emoji: item.icon, color: item.color, line })
    }
  }
  return tokens
}

const TOKENS = buildTokens()
// Only words count toward the lit index (icons are always revealed).
const WORD_COUNT = TOKENS.filter((t) => t.kind === 'word').length

export function ScrollLitStatement() {
  const ref = useRef<HTMLDivElement>(null)
  const [lit, setLit] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const measure = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const travel = Math.max(r.height - window.innerHeight, 1)
      const p = Math.min(Math.max(-r.top / travel, 0), 1)
      setLit(Math.round(p * 1.12 * WORD_COUNT))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  let wordIndex = 0

  return (
    <section ref={ref} className="relative h-[300vh]">
      <div className="pointer-events-none sticky top-0 flex h-screen items-center justify-center px-6">
        <p
          className="relative max-w-5xl text-center font-display font-bold leading-[1.22] tracking-[-0.025em]"
          style={{
            fontSize: 'clamp(1.35rem, 3.5vw, 3.1rem)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(48px)',
            transition: 'opacity 1000ms cubic-bezier(.16,1,.3,1), transform 1000ms cubic-bezier(.16,1,.3,1)',
          }}
        >
          {TOKENS.map((token, i) => {
            if (token.kind === 'icon') {
              const prevToken = TOKENS[i - 1]
              const nextIsPrev = prevToken?.kind === 'word'
              const wordsBefore = TOKENS.slice(0, i).filter((t) => t.kind === 'word').length
              const revealed = wordsBefore <= lit
              return (
                <span key={i}>
                  {nextIsPrev ? ' ' : null}
                  <span
                    className="inline-block transition-all duration-500"
                    style={{
                      opacity: revealed ? 1 : 0.15,
                      transform: revealed ? 'scale(1)' : 'scale(0.7)',
                      filter: revealed ? 'none' : 'grayscale(1)',
                    }}
                    aria-hidden
                  >
                    {token.emoji}
                  </span>
                  {' '}
                </span>
              )
            }

            const myIndex = wordIndex++
            const prevToken = TOKENS[i - 1]
            const needsSpace = i > 0 && !(prevToken?.kind === 'icon')
            const lineBreak =
              i > 0 && token.line !== (TOKENS[i - 1]?.line ?? 0) && prevToken?.kind !== 'icon'
                ? <br />
                : null

            return (
              <span key={i}>
                {lineBreak}
                {!lineBreak && needsSpace ? ' ' : null}
                <span
                  className="transition-[color] duration-500 ease-out"
                  style={{ color: myIndex < lit ? '#c8f135' : 'rgba(255,255,255,0.2)' }}
                >
                  {token.word}
                </span>
              </span>
            )
          })}
        </p>
      </div>
    </section>
  )
}
