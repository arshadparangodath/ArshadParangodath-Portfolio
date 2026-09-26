import { useMemo } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import { OrthographicCamera, Scene, ShaderMaterial } from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Full-screen quad — skip the normal camera/model transforms entirely,
    // this mesh's own position is already in clip space.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float strength;   // barrel warp amount
  varying vec2 vUv;

  void main() {
    vec2 cc = vUv - 0.5;
    float dist2 = dot(cc, cc);

    // Concave warp: pixels further from centre sample CLOSER to centre than
    // their own position (pincushion, not barrel) — this reads as the inside
    // of a curved tunnel/barrel receding away from the viewer, rather than a
    // convex fisheye bulge toward the viewer.
    vec2 warped = vUv - cc * dist2 * strength;

    // No blur — distortion only. A single sample at the warped coordinate,
    // full sharpness everywhere including the corners.
    gl_FragColor = texture2D(tDiffuse, warped);
  }
`

interface BarrelDistortionProps {
  children: React.ReactNode
  /** 0 = flat rectangle, higher = more pronounced barrel curve. */
  strength?: number
}

/**
 * Wrap the card grid in this component to get the barrel/fisheye look. The
 * grid itself (your `children`) renders completely normally and stays
 * perfectly flat — this only affects what's finally drawn to the screen, so
 * drag math elsewhere never needs to know about the curve.
 */
export function BarrelDistortion({ children, strength = 0.32 }: BarrelDistortionProps) {
  const { gl, size, scene, camera } = useThree()
  const dpr = gl.getPixelRatio()
  const fbo = useFBO(Math.round(size.width * dpr), Math.round(size.height * dpr))
  const quadScene = useMemo(() => new Scene(), [])
  const quadCamera = useMemo(() => new OrthographicCamera(-1, 1, 1, -1, 0, 1), [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          tDiffuse: { value: fbo.texture },
          strength: { value: strength },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [fbo.texture],
  )
  material.uniforms.strength.value = strength

  // A non-zero priority hands full control of rendering to this callback —
  // pass 1 renders the real (flat) card scene into the FBO texture, pass 2
  // draws the distortion quad (sampling that texture) to the actual screen.
  useFrame(() => {
    gl.setRenderTarget(fbo)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    gl.render(quadScene, quadCamera)
  }, 1)

  return (
    <>
      {children}
      {createPortal(
        <mesh material={material}>
          <planeGeometry args={[2, 2]} />
        </mesh>,
        quadScene,
      )}
    </>
  )
}
