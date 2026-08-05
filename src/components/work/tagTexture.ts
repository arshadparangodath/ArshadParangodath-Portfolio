import { CanvasTexture, SRGBColorSpace } from 'three'

const cache = new Map<string, { texture: CanvasTexture; aspect: number }>()

/**
 * Draws a row of outlined pill tags to a canvas texture. Doing this in 2D keeps
 * the pill strokes crisp and costs one draw call instead of three meshes and a
 * text layout per tag.
 */
export function tagRowTexture(tags: string[]): { texture: CanvasTexture; aspect: number } {
  const key = tags.join('|')
  const hit = cache.get(key)
  if (hit) return hit

  const S = 3 // supersample factor for crisp edges
  const fontSize = 15 * S
  const padX = 11 * S
  const gap = 7 * S
  const h = 30 * S

  // Measure first on a scratch context.
  const scratch = document.createElement('canvas').getContext('2d')!
  scratch.font = `500 ${fontSize}px ui-monospace, "SF Mono", Menlo, monospace`
  const widths = tags.map((t) => scratch.measureText(t.toUpperCase()).width + padX * 2)
  const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(tags.length - 1, 0)

  const c = document.createElement('canvas')
  c.width = Math.max(Math.ceil(total), 1)
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.font = `500 ${fontSize}px ui-monospace, "SF Mono", Menlo, monospace`
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 1.15 * S

  let x = 0
  tags.forEach((t, i) => {
    const w = widths[i]
    const r = h / 2
    ctx.beginPath()
    ctx.roundRect(x + ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth, r)
    ctx.strokeStyle = 'rgba(255,255,255,0.34)'
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.78)'
    ctx.fillText(t.toUpperCase(), x + padX, h / 2 + 0.5 * S)
    x += w + gap
  })

  const texture = new CanvasTexture(c)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  const out = { texture, aspect: c.width / c.height }
  cache.set(key, out)
  return out
}
