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
  uniform float blurAmount; // edge blur amount
  varying vec2 vUv;

  void main() {
    vec2 cc = vUv - 0.5;
    float dist2 = dot(cc, cc);

    // Concave warp: pixels further from centre sample CLOSER to centre than
    // their own position (pincushion, not barrel) — this reads as the inside
    // of a curved tunnel/barrel receding away from the viewer, rather than a
    // convex fisheye bulge toward the viewer.
    vec2 warped = vUv - cc * dist2 * strength;

    // Edge blur: a cheap 8-tap radial blur whose radius grows with distance
    // from centre, so the corners/edges soften into the curve while the
    // centre stays crisp.
    float blur = blurAmount * dist2;
    vec4 color = vec4(0.0);
    const int TAPS = 8;
    for (int i = 0; i < TAPS; i++) {
      float angle = float(i) * 0.7853981634; // 2*pi / 8
      vec2 offset = vec2(cos(angle), sin(angle)) * blur;
      color += texture2D(tDiffuse, warped + offset);
    }
    gl_FragColor = color / float(TAPS);
  }
`

interface BarrelDistortionProps {
  children: React.ReactNode
  /** 0 = flat rectangle, higher = more pronounced barrel curve. */
  strength?: number
  /** 0 = no extra edge blur, higher = softer corners. */
  blurAmount?: number
}

/**
 * Wrap the card grid in this component to get the barrel/fisheye look. The
 * grid itself (your `children`) renders completely normally and stays
 * perfectly flat — this only affects what's finally drawn to the screen, so
 * drag math elsewhere never needs to know about the curve.
 */
export function BarrelDistortion({ children, strength = 0.32, blurAmount = 0.028 }: BarrelDistortionProps) {
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
          blurAmount: { value: blurAmount },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [fbo.texture],
  )
  material.uniforms.strength.value = strength
  material.uniforms.blurAmount.value = blurAmount

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
