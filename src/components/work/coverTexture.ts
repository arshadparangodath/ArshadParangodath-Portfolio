import { decompressFrames, parseGIF } from 'gifuct-js'
import { CanvasTexture, SRGBColorSpace, Texture, TextureLoader, VideoTexture } from 'three'
import type { MediaItem } from '../../data/media'

export interface CoverTexture {
  texture: Texture
  tick: () => void
  dispose: () => void
}

/** Decode GIF frames explicitly: drawImage(img) cannot reliably read the
 * currently displayed frame of an animated HTML image into WebGL. */
export function createGifTexture(data: ArrayBuffer): CoverTexture {
  const gif = parseGIF(data)
  const frames = decompressFrames(gif, true).map(({ dims, delay, disposalType, patch }) => ({
    dims, delay: Math.max(delay || 100, 20), disposalType, patch,
  }))
  if (!frames.length) throw new Error('GIF has no image frames')
  const canvas = document.createElement('canvas')
  canvas.width = gif.lsd.width
  canvas.height = gif.lsd.height
  const ctx = canvas.getContext('2d')!
  const patchCanvas = document.createElement('canvas')
  const patchCtx = patchCanvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  let index = 0
  let saved: ImageData | null = null

  const draw = () => {
    const frame = frames[index]
    saved = frame.disposalType === 3 ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null
    patchCanvas.width = frame.dims.width
    patchCanvas.height = frame.dims.height
    const image = patchCtx.createImageData(frame.dims.width, frame.dims.height)
    image.data.set(frame.patch)
    patchCtx.putImageData(image, 0, 0)
    // Compositing preserves the prior frame under transparent delta patches.
    ctx.drawImage(patchCanvas, frame.dims.left, frame.dims.top)
    texture.needsUpdate = true
  }
  draw()
  let nextAt = performance.now() + frames[0].delay

  return {
    texture,
    tick() {
      const now = performance.now()
      // Bound catch-up after a background tab resumes.
      let steps = 0
      while (now >= nextAt && steps++ < frames.length) {
        const previous = frames[index]
        if (previous.disposalType === 2) {
          const { left, top, width, height } = previous.dims
          ctx.clearRect(left, top, width, height)
        } else if (previous.disposalType === 3 && saved) {
          ctx.putImageData(saved, 0, 0)
        }
        index = (index + 1) % frames.length
        if (index === 0) ctx.clearRect(0, 0, canvas.width, canvas.height)
        draw()
        nextAt += frames[index].delay
      }
      if (now >= nextAt) nextAt = now + frames[index].delay
    },
    dispose() {
      texture.dispose()
      frames.length = 0
      saved = null
      canvas.width = canvas.height = patchCanvas.width = patchCanvas.height = 0
    },
  }
}

async function loadCover(media: MediaItem, signal: AbortSignal): Promise<CoverTexture> {
  if (media.type === 'gif') {
    const response = await fetch(media.url, { signal })
    if (!response.ok) throw new Error(`GIF request failed: ${response.status}`)
    return createGifTexture(await response.arrayBuffer())
  }
  if (media.type === 'video') {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.defaultMuted = true
    video.autoplay = true
    video.loop = true
    video.playsInline = true
    video.preload = 'auto'
    video.setAttribute('playsinline', '')
    // Keep a real media element mounted for mobile browser playback.
    video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none'
    video.setAttribute('aria-hidden', 'true')
    video.tabIndex = -1
    document.body.appendChild(video)
    const play = () => { void video.play().catch(() => { /* Retry on user interaction. */ }) }
    const dispose = () => {
      window.removeEventListener('pointerdown', play)
      window.removeEventListener('keydown', play)
      video.pause()
      video.removeAttribute('src')
      video.load()
      video.remove()
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          video.removeEventListener('loadeddata', ready)
          video.removeEventListener('error', error)
          signal.removeEventListener('abort', abort)
        }
        const ready = () => { cleanup(); resolve() }
        const error = () => { cleanup(); reject(new Error('Cover video could not be loaded')) }
        const abort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')) }
        if (signal.aborted) { abort(); return }
        video.addEventListener('loadeddata', ready)
        video.addEventListener('error', error)
        signal.addEventListener('abort', abort, { once: true })
        video.src = media.url
        play()
      })
      const texture = new VideoTexture(video)
      texture.colorSpace = SRGBColorSpace
      window.addEventListener('pointerdown', play)
      window.addEventListener('keydown', play)
      return { texture, tick() {}, dispose() { dispose(); texture.dispose() } }
    } catch (error) {
      dispose()
      throw error
    }
  }
  const texture = await new TextureLoader().setCrossOrigin('anonymous').loadAsync(media.url)
  texture.colorSpace = SRGBColorSpace
  return { texture, tick() {}, dispose() { texture.dispose() } }
}

// The infinite wall repeats projects; each URL needs only one decoder/video.
const cache = new Map<string, { users: number; controller: AbortController; ready: Promise<CoverTexture> }>()
export function acquireCoverTexture(media: MediaItem) {
  const key = JSON.stringify([media.type, media.url])
  let entry = cache.get(key)
  if (!entry) {
    const controller = new AbortController()
    entry = { users: 0, controller, ready: loadCover(media, controller.signal) }
    cache.set(key, entry)
  }
  entry.users++
  const resource = entry
  return {
    ready: resource.ready,
    release() {
      if (--resource.users > 0) return
      cache.delete(key)
      resource.controller.abort()
      void resource.ready.then((cover) => cover.dispose(), () => {})
    },
  }
}
