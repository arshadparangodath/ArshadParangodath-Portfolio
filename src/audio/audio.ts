/**
 * A tiny synthesised audio engine — no asset files. A slow, cinematic pad drone
 * plus a set of soft interface blips. Everything is created lazily on the first
 * user gesture so browser autoplay policies are respected.
 */

export type Sfx =
  | 'hover'
  | 'lift'
  | 'grab'
  | 'release'
  | 'open'
  | 'close'
  | 'click'
  | 'nav'

const STORAGE_KEY = 'ap:sound'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let padGain: GainNode | null = null
let sfxGain: GainNode | null = null
let verbSend: GainNode | null = null
let started = false
let enabled = false
let lastSfx = 0

/** A synthesised impulse response — exponentially decaying stereo noise. */
function makeImpulse(context: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(context.sampleRate * seconds)
  const buf = context.createBuffer(2, len, context.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  return buf
}

/** A looping buffer of white noise, used for the air layer and transients. */
function makeNoise(context: AudioContext, seconds = 2): AudioBuffer {
  const len = Math.floor(context.sampleRate * seconds)
  const buf = context.createBuffer(1, len, context.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

export function isSoundOn(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'on'
}

function persist(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* private mode — preference just won't persist */
  }
}

/** Builds the graph and the ambient pad. Safe to call repeatedly. */
function ensure(): boolean {
  if (started) return true
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return false

  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  padGain = ctx.createGain()
  padGain.gain.value = 0.5
  padGain.connect(master)

  sfxGain = ctx.createGain()
  // The master bus now sits much higher so the ambient bed is audible; the sfx
  // bus is trimmed to compensate, keeping the cues at their original loudness.
  sfxGain.gain.value = 0.36
  sfxGain.connect(master)

  // A long, soft plate. Everything can bleed into it, which is what gives the
  // interface its roomy, unhurried character rather than dry beeps.
  const reverb = ctx.createConvolver()
  reverb.buffer = makeImpulse(ctx, 3.6, 2.4)
  const wet = ctx.createGain()
  wet.gain.value = 0.6
  reverb.connect(wet).connect(master)

  verbSend = ctx.createGain()
  verbSend.gain.value = 1
  verbSend.connect(reverb)

  // Warm, slowly-beating pad: a few detuned voices through a gentle low-pass,
  // with a slow LFO on the cutoff for drift.
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 620
  filter.Q.value = 0.6
  filter.connect(padGain)

  const lfo = ctx.createOscillator()
  const lfoAmt = ctx.createGain()
  lfo.frequency.value = 0.05
  lfoAmt.gain.value = 220
  lfo.connect(lfoAmt).connect(filter.frequency)
  lfo.start()

  // A breath of filtered noise above the pad — the "air" that stops the bed
  // sounding synthetic. Its band sweeps very slowly.
  const air = ctx.createBufferSource()
  air.buffer = makeNoise(ctx)
  air.loop = true
  const airBand = ctx.createBiquadFilter()
  airBand.type = 'bandpass'
  airBand.frequency.value = 1250
  airBand.Q.value = 0.9
  const airGain = ctx.createGain()
  airGain.gain.value = 0.045
  const airLfo = ctx.createOscillator()
  const airLfoAmt = ctx.createGain()
  airLfo.frequency.value = 0.023
  airLfoAmt.gain.value = 600
  airLfo.connect(airLfoAmt).connect(airBand.frequency)
  airLfo.start()
  air.connect(airBand).connect(airGain)
  airGain.connect(padGain)
  airGain.connect(verbSend)
  air.start()

  // A minor-ish stack — quiet, wide, non-melodic.
  let side = -1
  for (const [freq, detune, level] of [
    [55, -6, 0.22],
    [82.5, 4, 0.16],
    [110, -3, 0.14],
    [164.8, 7, 0.07],
    [220, -9, 0.05],
  ] as const) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.detune.value = detune
    const g = ctx.createGain()
    g.gain.value = level

    // Slow tremolo so the bed breathes rather than sitting static.
    const trem = ctx.createOscillator()
    const tremAmt = ctx.createGain()
    trem.frequency.value = 0.03 + Math.random() * 0.05
    tremAmt.gain.value = level * 0.4
    trem.connect(tremAmt).connect(g.gain)
    trem.start()

    // Alternate voices left and right so the bed feels wide, not centred.
    const pan = ctx.createStereoPanner()
    pan.pan.value = side * 0.45
    side *= -1

    osc.connect(g).connect(pan).connect(filter)
    osc.start()
  }

  // Two high, very slow swells drifting in and out of the plate. They are what
  // make the bed feel like ambient music rather than a held chord.
  for (const [freq, rate, level] of [
    [329.6, 0.017, 0.05],
    [493.9, 0.011, 0.038],
  ] as const) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = 0

    // A slow sine on the gain — the swell spends most of its cycle near silent.
    const swell = ctx.createOscillator()
    const swellAmt = ctx.createGain()
    swell.frequency.value = rate
    swellAmt.gain.value = level
    swell.connect(swellAmt).connect(g.gain)
    swell.start()

    const pan = ctx.createStereoPanner()
    pan.pan.value = freq > 400 ? 0.6 : -0.6

    osc.connect(g).connect(pan)
    pan.connect(padGain)
    pan.connect(verbSend)
    osc.start()
  }

  filter.connect(verbSend)

  started = true
  return true
}

/** Fade the master bus toward the target over `time` seconds. */
function fadeTo(target: number, time: number) {
  if (!ctx || !master) return
  const now = ctx.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setValueAtTime(master.gain.value, now)
  master.gain.linearRampToValueAtTime(target, now + time)
}

export function setSound(on: boolean) {
  enabled = on
  persist(on)
  if (on) {
    if (!ensure()) return
    void ctx?.resume()
    fadeTo(0.4, 2.2)
  } else {
    fadeTo(0, 1.2)
  }
}

/** Mute/unmute when the tab is hidden/shown, without changing the persisted preference. */
function handleVisibility() {
  if (!started || !ctx || !master) return
  if (document.hidden) {
    fadeTo(0, 0.6)
  } else if (enabled) {
    void ctx.resume()
    fadeTo(0.4, 1.2)
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', handleVisibility)
}

/** Play a short interface sound. No-ops while sound is off. */
export function playSfx(kind: Sfx) {
  if (!enabled || !ctx || !sfxGain) return

  // Rate-limit so sweeping across many cards doesn't machine-gun.
  const now = ctx.currentTime
  if (kind === 'hover') {
    if (now - lastSfx < 0.06) return
    lastSfx = now
  }

  const spec: Record<Sfx, { f: number; to: number; d: number; g: number; type: OscillatorType }> = {
    hover: { f: 880, to: 1180, d: 0.1, g: 0.035, type: 'sine' },
    lift: { f: 520, to: 720, d: 0.16, g: 0.045, type: 'sine' },
    grab: { f: 240, to: 180, d: 0.14, g: 0.06, type: 'sine' },
    release: { f: 180, to: 260, d: 0.18, g: 0.05, type: 'sine' },
    open: { f: 320, to: 960, d: 0.5, g: 0.07, type: 'triangle' },
    close: { f: 820, to: 260, d: 0.36, g: 0.06, type: 'triangle' },
    click: { f: 660, to: 990, d: 0.12, g: 0.055, type: 'sine' },
    nav: { f: 440, to: 660, d: 0.22, g: 0.05, type: 'sine' },
  }
  const s = spec[kind]

  const osc = ctx.createOscillator()
  osc.type = s.type
  osc.frequency.setValueAtTime(s.f, now)
  osc.frequency.exponentialRampToValueAtTime(s.to, now + s.d)

  // Soften the attack so nothing clicks or sounds game-like.
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(s.g, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, now + s.d)

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2600

  osc.connect(g).connect(lp).connect(sfxGain)
  osc.start(now)
  osc.stop(now + s.d + 0.05)
}
