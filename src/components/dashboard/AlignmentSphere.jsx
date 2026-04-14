import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function scoreConfig(score) {
  const s = Math.max(1, Math.min(10, Number(score) || 5))
  if (s >= 8)
    return {
      speed: 0.2,
      noiseAmp: 0.06,
      glowIntensity: 1.35,
      coreColor: [0.06, 0.16, 0.58],
      edgeColor: [0.1, 0.28, 0.75],
      haloColor: [0.1, 0.3, 0.72],
      atmosphereScale: 1.45,
      atmosphereOpacity: 0.08,
    }
  if (s >= 5)
    return {
      speed: 0.28,
      noiseAmp: 0.09,
      glowIntensity: 1.0,
      coreColor: [0.05, 0.14, 0.5],
      edgeColor: [0.08, 0.24, 0.65],
      haloColor: [0.08, 0.26, 0.62],
      atmosphereScale: 1.38,
      atmosphereOpacity: 0.06,
    }
  return {
    speed: 0.4,
    noiseAmp: 0.13,
    glowIntensity: 0.65,
    coreColor: [0.03, 0.1, 0.36],
    edgeColor: [0.06, 0.18, 0.5],
    haloColor: [0.07, 0.2, 0.48],
    atmosphereScale: 1.3,
    atmosphereOpacity: 0.04,
  }
}

/* ---- Simplex 3D noise (Ashima) embedded in GLSL ---- */
const noiseGLSL = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 perm(vec4 x){return mod289(((x*34.0)+1.0)*x);}

float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=perm(perm(perm(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=1.79284291400159-0.85373472095314*
    vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),
    dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),
    dot(p2,x2),dot(p3,x3)));
}

float fbm(vec3 p){
  return snoise(p);
}
`

const coreVertex = `
${noiseGLSL}
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisp;

uniform float uTime;
uniform float uAmp;
uniform float uSpeed;

void main(){
  float t = uTime * uSpeed;
  float n1 = fbm(normal * 0.65 + vec3(t * 0.35, t * 0.2, t * 0.12));
  float n2 = fbm(position * 0.5 - vec3(t * 0.15, t * 0.28, t * 0.1));
  float disp = (n1 * 0.75 + n2 * 0.25) * uAmp;
  vec3 displaced = position + normal * disp;

  vDisp = n1;
  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = world.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const coreFragment = `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisp;

uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;
uniform float uGlow;

void main(){
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 n = normalize(vNormal);
  float NdotV = max(dot(n, viewDir), 0.0);

  float rawFresnel = pow(1.0 - NdotV, 1.4);
  float fresnel = max(rawFresnel, 0.2);
  float wideRim = max(pow(1.0 - NdotV, 0.9) * 0.35, 0.12);

  vec3 core = uCoreColor * 0.04 * (1.0 + vDisp * 0.3);
  vec3 edge = uEdgeColor * fresnel * uGlow * 3.5;
  vec3 spread = uEdgeColor * wideRim * uGlow * 2.2;

  vec3 col = core + edge + spread;

  float alpha = 0.01 + fresnel * 0.9 + wideRim * 0.6;

  gl_FragColor = vec4(col, alpha);
}
`

const glowVertex = `
varying vec3 vNormal;
varying vec3 vWorldPos;

void main(){
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const glowFragment = `
varying vec3 vNormal;
varying vec3 vWorldPos;

uniform vec3 uColor;
uniform float uIntensity;
uniform float uPow;

void main(){
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float NdotV = max(dot(normalize(vNormal), viewDir), 0.0);
  float rim = pow(1.0 - NdotV, uPow);
  float softRim = pow(1.0 - NdotV, max(1.2, uPow * 0.6));
  vec3 col = uColor * (rim * uIntensity + softRim * uIntensity * 0.2);
  float alpha = rim * 0.6 + softRim * 0.12;
  gl_FragColor = vec4(col, alpha);
}
`

function OrbScene({ score, reducedMotion }) {
  const coreRef = useRef(null)
  const coreMtlRef = useRef(null)
  const innerGlowMtlRef = useRef(null)
  const outerGlowMtlRef = useRef(null)
  const atmosphereRef = useRef(null)
  const tickAcc = useRef(0)

  const [coreUniforms] = useState(() => {
    const c = scoreConfig(score)
    return {
      uTime: { value: 0 },
      uAmp: { value: c.noiseAmp },
      uSpeed: { value: c.speed },
      uCoreColor: { value: new THREE.Vector3(...c.coreColor) },
      uEdgeColor: { value: new THREE.Vector3(...c.edgeColor) },
      uGlow: { value: c.glowIntensity },
    }
  })

  const [innerGlowUniforms] = useState(() => {
    const c = scoreConfig(score)
    return {
      uColor: { value: new THREE.Vector3(...c.haloColor) },
      uIntensity: { value: c.glowIntensity * 0.8 },
      uPow: { value: 2.0 },
    }
  })

  const [outerGlowUniforms] = useState(() => ({
    uColor: { value: new THREE.Vector3(0.08, 0.26, 0.7) },
    uIntensity: { value: 0.45 },
    uPow: { value: 2.8 },
  }))

  useFrame((state, delta) => {
    tickAcc.current += delta
    if (tickAcc.current < 1 / 30) return
    const dt = tickAcc.current
    tickAcc.current = 0

    const c = scoreConfig(score)

    if (coreMtlRef.current) {
      const u = coreMtlRef.current.uniforms
      if (!reducedMotion) u.uTime.value += dt
      u.uAmp.value = THREE.MathUtils.lerp(u.uAmp.value, reducedMotion ? 0.02 : c.noiseAmp, 0.06)
      u.uSpeed.value = THREE.MathUtils.lerp(u.uSpeed.value, reducedMotion ? 0.05 : c.speed, 0.06)
      u.uGlow.value = THREE.MathUtils.lerp(u.uGlow.value, c.glowIntensity, 0.05)
      lerpVec3(u.uCoreColor.value, c.coreColor, 0.04)
      lerpVec3(u.uEdgeColor.value, c.edgeColor, 0.04)
    }

    if (innerGlowMtlRef.current) {
      const u = innerGlowMtlRef.current.uniforms
      u.uIntensity.value = THREE.MathUtils.lerp(u.uIntensity.value, c.glowIntensity * 0.8, 0.05)
      lerpVec3(u.uColor.value, c.haloColor, 0.04)
    }

    if (outerGlowMtlRef.current) {
      const u = outerGlowMtlRef.current.uniforms
      u.uIntensity.value = THREE.MathUtils.lerp(u.uIntensity.value, c.glowIntensity * 0.45, 0.04)
    }

    if (coreRef.current && !reducedMotion) {
      coreRef.current.rotation.y += dt * 0.06
      coreRef.current.rotation.x += dt * 0.015
    }

    if (atmosphereRef.current) {
      const pulse = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.025
      const s = c.atmosphereScale + pulse
      atmosphereRef.current.scale.setScalar(s)
      atmosphereRef.current.material.opacity = THREE.MathUtils.lerp(
        atmosphereRef.current.material.opacity,
        c.atmosphereOpacity,
        0.04,
      )
    }
  })

  return (
    <group>
      {/* Outer atmosphere */}
      <mesh ref={atmosphereRef}>
        <icosahedronGeometry args={[1, 32]} />
        <meshBasicMaterial
          color="#1d4ed8"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer glow rim */}
      <mesh scale={1.16}>
        <icosahedronGeometry args={[1, 32]} />
        <shaderMaterial
          ref={outerGlowMtlRef}
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
          uniforms={outerGlowUniforms}
        />
      </mesh>

      {/* Inner glow rim */}
      <mesh scale={1.08}>
        <icosahedronGeometry args={[1, 32]} />
        <shaderMaterial
          ref={innerGlowMtlRef}
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
          uniforms={innerGlowUniforms}
        />
      </mesh>

      {/* Core orb with noise displacement */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 64]} />
        <shaderMaterial
          ref={coreMtlRef}
          vertexShader={coreVertex}
          fragmentShader={coreFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
          uniforms={coreUniforms}
        />
      </mesh>
    </group>
  )
}

function lerpVec3(vec, target, t) {
  vec.x = THREE.MathUtils.lerp(vec.x, target[0], t)
  vec.y = THREE.MathUtils.lerp(vec.y, target[1], t)
  vec.z = THREE.MathUtils.lerp(vec.z, target[2], t)
}

export default function AlignmentSphere({ score = 5 }) {
  const reducedMotion = useReducedMotion()
  const animatedScore = useAnimatedNumber(Math.max(0, score), 800, !reducedMotion)
  const shown = score > 0 ? (Math.round(animatedScore * 10) / 10).toFixed(1).replace('.', ',') : '—'

  const handleCreated = (state) => {
    state.gl.setClearColor(0x000000, 0)
  }

  return (
    <div className="relative h-full">
      {/* 3D canvas — fully transparent background */}
      <div className="absolute inset-0">
        <Canvas
          dpr={[1.5, 2]}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.NoToneMapping, premultipliedAlpha: false }}
          camera={{ position: [0, 0, 4.8], fov: 28 }}
          style={{ background: 'transparent' }}
          onCreated={handleCreated}
        >
          <OrbScene score={score || 5} reducedMotion={reducedMotion} />
        </Canvas>
      </div>

      {/* Score overlay — centered on the orb */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
        <div className="flex items-end gap-0.5 leading-none tabular-nums drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
          <span className="text-[56px] font-semibold text-white">{shown}</span>
          {score > 0 ? <span className="mb-2.5 text-lg font-medium text-white/60">/10</span> : null}
        </div>
      </div>
    </div>
  )
}
