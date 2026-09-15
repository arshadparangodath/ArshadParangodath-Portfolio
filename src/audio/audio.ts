export type Sfx =
  | "hover"
  | "lift"
  | "grab"
  | "release"
  | "open"
  | "close"
  | "click"
  | "nav"

const STORAGE_KEY = "ap:sound"

const MUSIC_VOLUME = 0.25
const SFX_VOLUME = 0.35
const FADE_DURATION = 800

let enabled = false
let unlocked = false

const background = new Audio("./audio/background.ogg")

background.loop = true
background.preload = "auto"
background.volume = 0

// --- drag "duck" effect: slows + reverbs the background music while the
// gallery is being dragged, instead of playing a click sound on every
// grab/release (which felt repetitive/irritating during continuous drags).
// Built on the Web Audio API since plain <audio> elements can't do reverb or
// live-adjustable filtering — this graph sits ALONGSIDE the element's own
// .volume (still used for the on/off fade), only adding the muffle+reverb
// blend on top.
let audioCtx: AudioContext | null = null
let lowpass: BiquadFilterNode | null = null
let dryGain: GainNode | null = null
let wetGain: GainNode | null = null

/** A synthetic reverb impulse (exponentially-decaying noise) — no audio
 *  asset needed. */
function createReverbImpulse(ctx: AudioContext, duration = 2.2, decay = 3.2): AudioBuffer {
  const rate = ctx.sampleRate
  const length = Math.floor(rate * duration)
  const impulse = ctx.createBuffer(2, length, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return impulse
}

function setupDuckGraph() {
  if (audioCtx) return
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return // unsupported browser — duck calls become no-ops below

  try {
    audioCtx = new Ctx()
    const source = audioCtx.createMediaElementSource(background)

    lowpass = audioCtx.createBiquadFilter()
    lowpass.type = "lowpass"
    lowpass.frequency.value = 20000 // fully open = no muffling by default

    const convolver = audioCtx.createConvolver()
    convolver.buffer = createReverbImpulse(audioCtx)

    dryGain = audioCtx.createGain()
    dryGain.gain.value = 1
    wetGain = audioCtx.createGain()
    wetGain.gain.value = 0 // no reverb by default

    source.connect(lowpass)
    lowpass.connect(dryGain)
    lowpass.connect(convolver)
    convolver.connect(wetGain)
    dryGain.connect(audioCtx.destination)
    wetGain.connect(audioCtx.destination)
  } catch {
    audioCtx = null // routing failed — duck calls become no-ops below
  }
}

/** Call while the gallery is being actively dragged/held. */
export function duckMusicForDrag() {
  if (!audioCtx || !lowpass || !dryGain || !wetGain) return
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {})
  background.playbackRate = 0.78
  const t = audioCtx.currentTime
  lowpass.frequency.setTargetAtTime(700, t, 0.15)
  dryGain.gain.setTargetAtTime(0.6, t, 0.15)
  wetGain.gain.setTargetAtTime(0.6, t, 0.15)
}

/** Call the moment the drag/hold ends — eases back to normal. */
export function unduckMusicForDrag() {
  if (!audioCtx || !lowpass || !dryGain || !wetGain) return
  background.playbackRate = 1
  const t = audioCtx.currentTime
  lowpass.frequency.setTargetAtTime(20000, t, 0.25)
  dryGain.gain.setTargetAtTime(1, t, 0.25)
  wetGain.gain.setTargetAtTime(0, t, 0.25)
}

const sounds: Record<Sfx, HTMLAudioElement> = {
  hover: new Audio("./audio/hover.ogg"),
  click: new Audio("./audio/click.ogg"),
  open: new Audio("./audio/open.ogg"),
  close: new Audio("./audio/close.ogg"),
  nav: new Audio("./audio/nav.ogg"),
  lift: new Audio("./audio/lift.ogg"),
  grab: new Audio("./audio/grab.ogg"),
  release: new Audio("./audio/release.ogg"),
}

Object.values(sounds).forEach((audio) => {
  audio.preload = "auto"
  audio.volume = SFX_VOLUME
})

function unlockAudio() {
  if (unlocked) return

  unlocked = true

  setupDuckGraph()

  background.play()
    .then(() => {
      background.pause()
      background.currentTime = 0
    })
    .catch(() => {})
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockAudio, { once: true })
}

function fadeMusic(target: number) {
  const start = background.volume
  const diff = target - start

  const startTime = performance.now()

  function animate(now: number) {
    const progress = Math.min((now - startTime) / FADE_DURATION, 1)

    background.volume = start + diff * progress

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else if (target === 0) {
      background.pause()
      background.currentTime = 0
    }
  }

  requestAnimationFrame(animate)
}

export function isSoundOn() {
  if (typeof localStorage === "undefined") return false

  return localStorage.getItem(STORAGE_KEY) === "on"
}

function persist(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off")
  } catch {}
}

export async function setSound(on: boolean) {
  enabled = on

  persist(on)

  if (!on) {
    fadeMusic(0)
    return
  }

  try {
    await background.play()

    fadeMusic(MUSIC_VOLUME)
  } catch {
    // Browser waiting for user interaction
  }
}

export function playSfx(kind: Sfx) {
  if (!enabled) return

  const original = sounds[kind]

  if (!original) return

  const sound = original.cloneNode(true) as HTMLAudioElement

  sound.volume = SFX_VOLUME

  sound.play().catch(() => {})

  sound.addEventListener("ended", () => {
    sound.remove()
  })
}

function handleVisibility() {
  if (!enabled) return

  if (document.hidden) {
    background.pause()
  } else {
    background.play().catch(() => {})
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", handleVisibility)
}