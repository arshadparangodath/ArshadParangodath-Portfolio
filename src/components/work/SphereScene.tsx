import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CardSphere } from './CardSphere'
import { BarrelDistortion } from './BarrelDistortion'
import { CAMERA_Z } from './layout'

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
      // A normal perspective view of a flat wall, sitting back at CAMERA_Z —
      // the barrel/fisheye curve is added afterward by BarrelDistortion, not
      // by this camera or by the cards' own placement.
      camera={{ position: [0, 0, CAMERA_Z], fov: 50, near: 0.1, far: 60 }}
    >
      <color attach="background" args={['#050506']} />
      <ambientLight intensity={1.35} />
      <Suspense fallback={null}>
        <BarrelDistortion strength={0.55} blurAmount={0.028}>
          <CardSphere {...props} />
        </BarrelDistortion>
      </Suspense>
    </Canvas>
  )
}
