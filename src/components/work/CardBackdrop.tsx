import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, MathUtils, Mesh, MeshBasicMaterial, Vector2, type Texture } from 'three'
import { CARD_H, CARD_W } from './layout'

// Blur the shared cover texture on the GPU. GIFs and videos therefore keep
// animating in the backdrop without extra decoders or canvas snapshots.
const blurMap = /* glsl */ `
  #include <map_pars_fragment>
  #ifdef USE_MAP
    uniform vec2 backdropCrop;
    vec4 blurredCover(vec2 uv) {
      vec2 center = (uv - 0.5) * backdropCrop + 0.5;
      vec4 sum = vec4(0.0);
      float total = 0.0;
      for (int y = -2; y <= 2; y++) {
        for (int x = -2; x <= 2; x++) {
          vec2 offset = vec2(float(x), float(y));
          float weight = exp(-dot(offset, offset) / 3.0);
          vec2 sampleUv = clamp(center + offset * backdropCrop * 0.055, vec2(0.0), vec2(1.0));
          vec4 sampleColor = texture2D(map, sampleUv);
          #ifdef DECODE_VIDEO_TEXTURE
            sampleColor = sRGBTransferEOTF(sampleColor);
          #endif
          sum += sampleColor * weight;
          total += weight;
        }
      }
      return sum / total;
    }
  #endif
`
const applyBlur = /* glsl */ `
  #ifdef USE_MAP
    diffuseColor *= blurredCover(vMapUv);
    // Shade only the backdrop's metadata bands to keep white labels legible.
    float labelBand = smoothstep(0.18, 0.40, abs(vMapUv.y - 0.5));
    diffuseColor.rgb *= mix(0.90, 0.14, labelBand);
  #endif
`

export default function CardBackdrop({ texture, hovered }: { texture: Texture | null; hovered: boolean }) {
  const mesh = useRef<Mesh>(null)
  const material = useMemo(() => {
    const source = texture?.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | undefined
    const aspect = (source?.videoWidth || source?.width || CARD_W) / (source?.videoHeight || source?.height || CARD_H)
    const targetAspect = CARD_W / CARD_H
    const crop = new Vector2(Math.min(1, targetAspect / aspect), Math.min(1, aspect / targetAspect)).divideScalar(1.12)
    const mat = new MeshBasicMaterial({
      map: texture, color: '#ffffff', transparent: true, opacity: 0,
      depthWrite: false, side: DoubleSide, toneMapped: false,
    })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.backdropCrop = { value: crop }
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <map_pars_fragment>', blurMap)
        .replace('#include <map_fragment>', applyBlur)
    }
    mat.customProgramCacheKey = () => 'card-cover-backdrop-v1'
    return mat
  }, [texture])

  useEffect(() => () => material.dispose(), [material])
  useFrame((_, delta) => {
    material.opacity = MathUtils.damp(material.opacity, hovered && texture ? 0.92 : 0, 12, delta)
    // Inactive cards skip the blur draw entirely.
    if (mesh.current) mesh.current.visible = material.opacity > 0.002
  })

  if (!texture) return null
  return (
    <mesh ref={mesh} position={[0, 0, 0.003]} material={material} visible={false} raycast={() => {}}>
      <planeGeometry args={[CARD_W, CARD_H]} />
    </mesh>
  )
}
