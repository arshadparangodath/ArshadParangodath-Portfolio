import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CardSphere } from './CardSphere'

interface SphereSceneProps {
  hoveredKey: string | null
  selectedKey: string | null
  activeFilter: string | null
  reducedMotion: boolean
  onHover: (key: string | null) => void
  onSelect: (id: string, key: string) => void
}

export function SphereScene(props: SphereSceneProps) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      // A moderately wide FOV from the centre keeps a ~3-column framing with
      // panels large and legible, curving toward the edges.
      camera={{ position: [0, 0, 0.01], fov: 84, near: 0.01, far: 50 }}
    >
      <color attach="background" args={['#050506']} />
      <ambientLight intensity={1.35} />
      <Suspense fallback={null}>
        <CardSphere {...props} />
      </Suspense>
    </Canvas>
  )
}
