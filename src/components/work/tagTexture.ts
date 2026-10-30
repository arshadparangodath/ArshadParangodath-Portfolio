import { CanvasTexture, SRGBColorSpace } from 'three'

type TagTexture = { texture: CanvasTexture; aspect: number; rows: number }
const cache = new Map<string, TagTexture>()

/** Wrap tags at their intended readable size instead of squeezing one long row. */
export function tagRowTexture(tags: string[], maxRowAspect = 15): TagTexture {
  const key = JSON.stringify([tags, maxRowAspect])
  const hit = cache.get(key)
  if (hit) return hit

  const S = 3
  const fontSize = 16 * S
  const padX = 10 * S
  const gap = 6 * S
  const h = 30 * S
  const maxWidth = Math.max(h, maxRowAspect * h)
  const font = `600 ${fontSize}px ui-monospace, "SF Mono", Menlo, monospace`
  const scratch = document.createElement('canvas').getContext('2d')!
  scratch.font = font
  let x = 0
  let row = 0
  let width = 1
  const pills = tags.map((tag) => {
    let text = tag.toUpperCase()
    if (scratch.measureText(text).width + padX * 2 > maxWidth) {
      while (text.length && scratch.measureText(text + '…').width + padX * 2 > maxWidth) text = text.slice(0, -1)
      text += '…'
    }
    const w = Math.min(scratch.measureText(text).width + padX * 2, maxWidth)
    if (x > 0 && x + w > maxWidth) { x = 0; row++ }
    const pill = { text, w, x, y: row * (h + gap) }
    width = Math.max(width, x + w)
    x += w + gap
    return pill
  })
  const rows = row + 1
  const c = document.createElement('canvas')
  c.width = Math.ceil(width)
  c.height = rows * h + (rows - 1) * gap
  const ctx = c.getContext('2d')!
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 1.2 * S
  for (const { text, w, x, y } of pills) {
    ctx.beginPath()
    ctx.roundRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth, h / 2)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, x + padX, y + h / 2 + 0.5 * S)
  }

  const texture = new CanvasTexture(c)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  const out = { texture, aspect: c.width / c.height, rows }
  cache.set(key, out)
  return out
}
