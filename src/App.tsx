import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { WorkShowcase } from './components/work/WorkShowcase'
import type { Route } from './components/pages/routes'
import { HomePage } from './components/pages/HomePage'
import { SelfPage } from './components/pages/SelfPage'
import { ContactPage } from './components/pages/ContactPage'
import { Cursor } from './components/ui/Cursor'
import { Preloader } from './components/ui/Preloader'
import { useReducedMotion } from './hooks/useReducedMotion'

export default function App() {
  const reducedMotion = useReducedMotion()
  const [route, setRoute] = useState<Route>('home')
  const [booting, setBooting] = useState(!reducedMotion)

  // Lenis smooth scrolling for the standard pages.
  useEffect(() => {
    if (reducedMotion || route === 'works') return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [reducedMotion, route])

  // Every route change starts at the top of the new page.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  return (
    <main className="bg-black">
      {booting && <Preloader onDone={() => setBooting(false)} />}
      <Cursor />
      {route === 'home' && <HomePage onNavigate={setRoute} />}
      {route === 'works' && <WorkShowcase onNavigate={setRoute} />}
      {route === 'self' && <SelfPage onNavigate={setRoute} />}
      {route === 'contact' && <ContactPage onNavigate={setRoute} />}
    </main>
  )
}
