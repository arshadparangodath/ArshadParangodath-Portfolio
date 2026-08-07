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