import { useCallback, useEffect, useState } from 'react'
import { isSoundOn, setSound } from '../audio/audio'

/**
 * Sound on/off with a persisted preference. If the user previously enabled
 * sound we still wait for their first gesture before starting the audio
 * context, since browsers block autoplay.
 */
export function useSound() {
  const [on, setOn] = useState(() => isSoundOn())

  // Resume a persisted "on" preference at the first interaction.
  useEffect(() => {
    if (!on) return
    const start = () => setSound(true)
    window.addEventListener('pointerdown', start, { once: true })
    window.addEventListener('keydown', start, { once: true })
    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
  }, [on])

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev
      setSound(next)
      return next
    })
  }, [])

  return { soundOn: on, toggleSound: toggle }
}
