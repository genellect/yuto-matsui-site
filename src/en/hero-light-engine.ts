import * as THREE from "three";

// The light of the EN hero stage: aurora-like ribbons of violet, electric
// blue and cyan flowing through black, with a hot light source at the edge of
// the prism wall whose rays reach across the dark side. Drawn at reduced
// resolution: the field is soft by nature, and the cost stays small.

export type LightController = {
  pointer: (x: number, y: number, inside: boolean) => void;
  scroll: (progress: number) => void;
  paused: (value: boolean) => void;
  source: (x: number, y: number) => void;
  quiet: (rect: [number, number, number, number]) => void;
  dispose: () => void;
};

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPresence;
  uniform vec2 uSource;
  uniform float uIntensity;
  uniform vec4 uQuiet;
  varying vec2 vUv;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return v;
  }
  vec3 spectrum(float t) {
    vec3 c0 = vec3(0.02, 0.012, 0.07);
    vec3 c1 = vec3(0.30, 0.18, 0.92);
    vec3 c2 = vec3(0.17, 0.40, 1.0);
    vec3 c3 = vec3(0.20, 0.82, 1.0);
    vec3 c4 = vec3(0.94, 0.95, 1.0);
    t = clamp(t, 0.0, 1.0);
    if (t < 0.3) return mix(c0, c1, t / 0.3);
    if (t < 0.55) return mix(c1, c2, (t - 0.3) / 0.25);
    if (t < 0.8) return mix(c2, c3, (t - 0.55) / 0.25);
    return mix(c3, c4, (t - 0.8) / 0.2);
  }
  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(vUv.x * aspect, vUv.y);
    float t = uTime * 0.035;

    // Aurora: domain-warped noise folded into long diagonal ribbons.
    vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t)), fbm(p * 1.3 + vec2(5.2, -t)));
    float f = fbm(p * vec2(1.1, 2.2) + q * 1.8 + vec2(t * 0.7, 0.0));
    float ribbon = pow(smoothstep(0.34, 0.84, f), 1.5);

    // Light source at the seam of the prism wall.
    vec2 s = vec2(uSource.x * aspect, uSource.y);
    vec2 d = p - s;
    float r = length(d);
    float core = exp(-r * r * 26.0);
    float halo = exp(-r * 2.4);

    // Rays fan out from the source into the dark side of the stage.
    float ang = atan(d.y, -d.x);
    float rays = noise(vec2(ang * 9.0, t * 3.0)) * 0.65 + noise(vec2(ang * 23.0, -t * 4.0)) * 0.35;
    rays = pow(rays, 2.6) * halo * smoothstep(-0.05, 0.25, -d.x);

    vec2 m = vec2(uPointer.x * aspect, uPointer.y);
    float spot = exp(-dot(p - m, p - m) * 7.0) * uPresence;

    // A second aurora drifts low across the floor of the stage.
    float low = fbm(p * vec2(0.9, 3.2) + q * 1.2 + vec2(-t * 0.8, 0.0));
    float floorRibbon = pow(smoothstep(0.36, 0.78, low), 1.2) * smoothstep(0.7, 0.0, vUv.y);
    float energy = ribbon * (0.3 + 0.6 * halo) + floorRibbon * 0.62 + core * 0.95 + rays * 1.05 + halo * 0.14 + spot * 0.28;
    // The floor of the stage stays deep.
    energy *= mix(0.7, 1.0, smoothstep(0.0, 0.6, vUv.y));
    // Behind the copy the light drops away, so the text always reads.
    vec2 feather = vec2(0.09, 0.12);
    vec2 lo = smoothstep(uQuiet.xy - feather, uQuiet.xy, vUv);
    vec2 hi = 1.0 - smoothstep(uQuiet.zw, uQuiet.zw + feather, vUv);
    energy *= 1.0 - 0.68 * lo.x * lo.y * hi.x * hi.y;
    // sqrt keeps low light visible as deep violet instead of falling to black.
    vec3 color = spectrum(energy) * sqrt(max(energy, 0.0)) * 0.92;
    color += vec3(0.96, 0.96, 1.0) * pow(core, 2.4) * 0.55;
    color *= uIntensity;
    color += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;

export function mountHeroLight(host: HTMLElement, options: { reducedMotion: boolean; finePointer: boolean; onReady: () => void }): LightController | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
  } catch {
    return null;
  }
  const quality = 0.5;
  renderer.setPixelRatio(quality);
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 12 },
    uPointer: { value: new THREE.Vector2(0.6, 0.5) },
    uPresence: { value: 0 },
    uSource: { value: new THREE.Vector2(0.42, 0.84) },
    uQuiet: { value: new THREE.Vector4(-1, -1, -1, -1) },
    uIntensity: { value: options.reducedMotion ? 1 : 0 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader,
    depthWrite: false,
    depthTest: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const state = { pointerX: 0.6, pointerY: 0.5, presence: 0, scroll: 0, paused: false, visible: true, start: performance.now() };
  let frame = 0, last = 0, disposed = false, ready = false;

  function resize() {
    const rect = host.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    uniforms.uRes.value.set(rect.width, rect.height);
    invalidate();
  }

  function invalidate() { if (!frame && !disposed) frame = requestAnimationFrame(render); }

  function render() {
    frame = 0;
    const now = performance.now();
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    const ease = (rate: number) => 1 - Math.exp(-dt * rate);
    const animate = !options.reducedMotion && !state.paused && state.visible && !document.hidden;
    if (animate) uniforms.uTime.value += dt;
    // The light turns on over the first second and a half.
    const intro = options.reducedMotion ? 1 : Math.min(1, (now - state.start) / 1600);
    const target = (1 - Math.pow(1 - intro, 3)) * (1 - state.scroll * 0.75);
    uniforms.uIntensity.value = target;
    const p = uniforms.uPointer.value;
    p.x += (state.pointerX - p.x) * ease(3);
    p.y += (state.pointerY - p.y) * ease(3);
    uniforms.uPresence.value += (state.presence - uniforms.uPresence.value) * ease(3);
    if (state.visible) renderer.render(scene, camera);
    if (!ready) { ready = true; options.onReady(); }
    if (animate || intro < 1 || Math.abs(uniforms.uPresence.value - state.presence) > 0.002) invalidate();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const sight = new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; if (state.visible) invalidate(); });
  sight.observe(host);
  const onVisibility = () => { if (!document.hidden) invalidate(); };
  document.addEventListener("visibilitychange", onVisibility);
  resize();

  return {
    pointer(x, y, inside) {
      if (!options.finePointer || options.reducedMotion) return;
      state.pointerX = x; state.pointerY = y; state.presence = inside ? 1 : 0;
      invalidate();
    },
    scroll(progress) { state.scroll = Math.min(1, Math.max(0, progress)); invalidate(); },
    paused(value) { state.paused = value; invalidate(); },
    source(x, y) { uniforms.uSource.value.set(x, y); invalidate(); },
    quiet(rect) { uniforms.uQuiet.value.set(...rect); invalidate(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      sight.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
}
