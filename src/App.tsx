import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { Navigate, Route as RouterRoute, Routes, useLocation, useNavigate } from 'react-router-dom'
import { WorkShowcase } from './components/work/WorkShowcase'
import { ROUTE_PATHS, type Route } from './components/pages/routes'
import { HomePage } from './components/pages/HomePage'
import { SelfPage } from './components/pages/SelfPage'
import { ContactPage } from './components/pages/ContactPage'
import { AdminGate } from './components/admin/AdminGate'
import { Cursor } from './components/ui/Cursor'
import { Preloader } from './components/ui/Preloader'
import { useReducedMotion } from './hooks/useReducedMotion'

/** Reverse-lookup of ROUTE_PATHS, used to know when Lenis should be disabled. */
const PATH_TO_ROUTE: Record<string, Route> = Object.fromEntries(
  Object.entries(ROUTE_PATHS).map(([route, path]) => [path, route as Route]),
)

export default function App() {
  const reducedMotion = useReducedMotion()
  const location = useLocation()
  const navigate = useNavigate()
  const [booting, setBooting] = useState(!reducedMotion)

  const route = PATH_TO_ROUTE[location.pathname]
  const handleNavigate = (r: Route) => navigate(ROUTE_PATHS[r])

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
  }, [location.pathname])

  return (
    <main className="bg-black">
      {booting && <Preloader onDone={() => setBooting(false)} />}
      <Cursor />
      <Routes>
        <RouterRoute path={ROUTE_PATHS.home} element={<HomePage onNavigate={handleNavigate} />} />
        <RouterRoute path={ROUTE_PATHS.works} element={<WorkShowcase onNavigate={handleNavigate} />} />
        <RouterRoute path={ROUTE_PATHS.self} element={<SelfPage onNavigate={handleNavigate} />} />
        <RouterRoute path={ROUTE_PATHS.contact} element={<ContactPage onNavigate={handleNavigate} />} />
        <RouterRoute path="/admin" element={<AdminGate onClose={() => navigate('/')} />} />
        <RouterRoute path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}
