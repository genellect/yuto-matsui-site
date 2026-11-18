import * as THREE from "three";

// The light of the EN stage below the hero: one fixed WebGL field behind every
// section. Aurora ribbons drift through the black, lean towards the mouse and
// gather into a light source under it; each section gives the light its own
// colour, which blends in as the page scrolls. Rendered at low resolution.

export type PageLight = {
  pointer: (x: number, y: number, inside: boolean) => void;
  tint: (primary: string, secondary: string, strength: number) => void;
  running: (value: boolean) => void;
  paused: (value: boolean) => void;
  dispose: () => void;
};

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPresence;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform float uStrength;
  varying vec2 vUv;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(3.1, 7.7); a *= 0.5; }
    return v;
  }
  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(vUv.x * aspect, vUv.y);
    vec2 m = vec2(uPointer.x * aspect, uPointer.y);
    float t = uTime * 0.03;

    // Ribbons lean towards the pointer: the field is pulled around it.
    vec2 toPointer = m - p;
    float pull = exp(-dot(toPointer, toPointer) * 2.2) * uPresence;
    vec2 warped = p + toPointer * pull * 0.35;
    vec2 q = vec2(fbm(warped * 1.2 + vec2(0.0, t)), fbm(warped * 1.2 + vec2(4.3, -t)));
    float f = fbm(warped * vec2(1.0, 2.4) + q * 2.0 + vec2(t * 0.8, 0.0));
    float ribbon = pow(smoothstep(0.38, 0.85, f), 1.4);

    // Light gathers at the edges of the stage and keeps the centre, where the
    // copy sits, deeper.
    float edge = smoothstep(0.18, 0.62, abs(vUv.x - 0.5) * 2.0);
    float floorGlow = smoothstep(0.55, 0.0, vUv.y) * 0.5;
    float field = ribbon * (0.4 + 0.6 * edge) + floorGlow * ribbon;

    // The source under the pointer.
    float d = length(toPointer);
    float spot = (exp(-d * d * 9.0) * 0.75 + exp(-d * 3.2) * 0.25) * uPresence;

    vec3 colour = mix(uSecondary, uPrimary, smoothstep(0.2, 0.9, f));
    vec3 light = colour * field * 0.55 + mix(uPrimary, vec3(0.92, 0.94, 1.0), 0.25) * spot * 0.5;
    light *= uStrength;
    light += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
    gl_FragColor = vec4(max(light, 0.0), 1.0);
  }
`;

export function mountPageLight(host: HTMLElement, options: { reducedMotion: boolean; finePointer: boolean; coarse: boolean }): PageLight | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(options.coarse ? 0.35 : 0.45);
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene = new THREE.Scene();
  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 20 },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uPresence: { value: 0 },
    uPrimary: { value: new THREE.Color("#8b78f0") },
    uSecondary: { value: new THREE.Color("#4d7cff") },
    uStrength: { value: 0 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader,
    depthTest: false,
    depthWrite: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const target = { x: 0.5, y: 0.5, presence: 0, primary: new THREE.Color("#8b78f0"), secondary: new THREE.Color("#4d7cff"), strength: 1 };
  let frame = 0, last = 0, disposed = false, active = true, held = false;

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
    invalidate();
  };
  const invalidate = () => { if (!frame && !disposed && active) frame = requestAnimationFrame(render); };
  function render() {
    frame = 0;
    const now = performance.now();
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    const ease = (rate: number) => (options.reducedMotion ? 1 : 1 - Math.exp(-dt * rate));
    // A pause pressed in the section on screen also holds the light still.
    const animate = !options.reducedMotion && !document.hidden && !held;
    if (animate) uniforms.uTime.value += dt;
    if (!options.finePointer && !options.reducedMotion) {
      // Without a mouse the light source wanders slowly across the stage.
      const t = uniforms.uTime.value;
      target.x = 0.5 + 0.34 * Math.sin(t * 0.16);
      target.y = 0.5 + 0.3 * Math.cos(t * 0.11);
      target.presence = 0.6;
    }
    uniforms.uPointer.value.x += (target.x - uniforms.uPointer.value.x) * ease(4);
    uniforms.uPointer.value.y += (target.y - uniforms.uPointer.value.y) * ease(4);
    uniforms.uPresence.value += (target.presence - uniforms.uPresence.value) * ease(3);
    uniforms.uPrimary.value.lerp(target.primary, ease(1.6));
    uniforms.uSecondary.value.lerp(target.secondary, ease(1.6));
    uniforms.uStrength.value += (target.strength - uniforms.uStrength.value) * ease(1.6);
    renderer.render(scene, camera);
    if (animate) invalidate();
  }
  window.addEventListener("resize", resize);
  const onVisibility = () => { if (!document.hidden) invalidate(); };
  document.addEventListener("visibilitychange", onVisibility);
  resize();

  return {
    pointer(x, y, inside) {
      if (!options.finePointer || options.reducedMotion) return;
      target.x = x; target.y = y; target.presence = inside ? 1 : 0;
      invalidate();
    },
    tint(primary, secondary, strength) {
      target.primary.set(primary);
      target.secondary.set(secondary);
      target.strength = strength * (options.coarse ? 1.3 : 1);
      invalidate();
    },
    paused(value) {
      held = value;
      last = 0;
      invalidate();
    },
    running(value) {
      active = value;
      last = 0;
      if (value) invalidate();
      else { cancelAnimationFrame(frame); frame = 0; }
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
}
