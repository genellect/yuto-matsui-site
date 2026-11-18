import * as THREE from "three";

// The EN hero portrait is carried by a wall of glass prisms. At rest the
// front faces line up into one flat photograph, drawn without any shading or
// overlay. When the portrait changes, each prism turns 120° to bring the next
// photograph forward; light behind the wall passes through the gaps that open
// while they turn. Nothing reacts to the pointer, so the photograph is never
// cut while someone is looking at it.

export type PrismSlide = { src: string; position: string; mobilePosition: string };
export type PrismController = {
  show: (index: number, animate: boolean) => void;
  dispose: () => void;
};
type Options = {
  reducedMotion: boolean;
  onReady: () => void;
  onFail: () => void;
};

const COUNT = 12;
const TURN = (-2 * Math.PI) / 3;
const APOTHEM = 1 / (2 * Math.sqrt(3));
const SLAT_DELAY = 21;
const SLAT_DURATION = 780;
const INTRO_DELAY = 46;
const INTRO_DURATION = 1180;

function prismGeometry() {
  const corners: [number, number][] = [[-0.5, APOTHEM], [0.5, APOTHEM], [0, -2 * APOTHEM]];
  const position: number[] = [], normal: number[] = [], local: number[] = [], face: number[] = [];
  for (let k = 0; k < 3; k++) {
    const [px, pz] = corners[k];
    const [qx, qz] = corners[(k + 1) % 3];
    const nx = qz - pz, nz = -(qx - px);
    const length = Math.hypot(nx, nz);
    const quad: [number, number, number, number, number][] = [
      [px, -0.5, pz, 0, 0], [qx, -0.5, qz, 1, 0], [qx, 0.5, qz, 1, 1],
      [px, -0.5, pz, 0, 0], [qx, 0.5, qz, 1, 1], [px, 0.5, pz, 0, 1]
    ];
    for (const [x, y, z, u, v] of quad) {
      position.push(x, y, z);
      normal.push(nx / length, 0, nz / length);
      local.push(u, v);
      face.push(k);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  geometry.setAttribute("aLocal", new THREE.Float32BufferAttribute(local, 2));
  geometry.setAttribute("aFace", new THREE.Float32BufferAttribute(face, 1));
  return geometry;
}

const prismVertex = /* glsl */ `
  attribute vec2 aLocal;
  attribute float aFace;
  varying vec2 vLocal;
  varying float vFace;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vLocal = aLocal;
    vFace = aFace;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const prismFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform vec4 uCoverA;
  uniform vec4 uCoverB;
  uniform float uIndex;
  uniform float uCount;
  uniform float uActivity;
  uniform float uGlow;
  uniform float uFacePx;
  uniform vec3 uLight;
  varying vec2 vLocal;
  varying float vFace;
  varying vec3 vNormal;
  varying vec3 vWorld;
  vec3 photo(sampler2D map, vec4 cover, vec2 canvasUv) {
    return texture2D(map, canvasUv * cover.xy + cover.zw).rgb;
  }
  void main() {
    vec2 canvasUv = vec2((uIndex + vLocal.x) / uCount, vLocal.y);
    float face = floor(vFace + 0.5);
    vec3 color;
    if (face < 0.5) color = photo(uTexA, uCoverA, canvasUv);
    else if (face < 1.5) color = photo(uTexB, uCoverB, canvasUv);
    else color = mix(vec3(0.006, 0.006, 0.012), vec3(0.05, 0.045, 0.085), smoothstep(0.0, 1.0, vLocal.y));
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    // Shading exists only while a prism is turned. At rest the factor is 1.0,
    // so the photograph is shown exactly as delivered.
    float lambert = 0.18 + 0.82 * max(dot(n, normalize(uLight)), 0.0);
    color *= mix(1.0, lambert, uActivity);
    float spec = pow(max(dot(reflect(-normalize(uLight), n), view), 0.0), 36.0);
    color += vec3(0.9, 0.88, 1.0) * spec * 0.55 * uActivity;
    // A hairline of light along each vertical edge of the prism.
    float edgePx = min(vLocal.x, 1.0 - vLocal.x) * uFacePx;
    float edge = exp(-edgePx * 1.15);
    color += mix(vec3(0.62, 0.52, 1.0), vec3(0.55, 0.92, 1.0), vLocal.y) * edge * uGlow * 1.25;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const lightFragment = /* glsl */ `
  precision highp float;
  uniform float uLight;
  varying vec2 vUv;
  void main() {
    // The backlight is a tall column of cold white with a violet falloff.
    float column = exp(-pow((vUv.x - 0.5) * 1.6, 2.0)) * smoothstep(0.0, 0.55, vUv.y) * smoothstep(1.05, 0.4, vUv.y);
    vec3 hot = vec3(0.96, 0.97, 1.0);
    vec3 violet = vec3(0.5, 0.38, 0.98);
    vec3 blue = vec3(0.2, 0.45, 1.0);
    vec3 cyan = vec3(0.3, 0.86, 1.0);
    vec3 spectrum = mix(mix(violet, blue, smoothstep(0.1, 0.5, vUv.y)), cyan, smoothstep(0.55, 0.95, vUv.y));
    vec3 color = mix(spectrum, hot, column * column * 0.8) * (0.3 + column) * uLight;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const easeTurn = (t: number) => {
  // Close to cubic-bezier(.2, .76, .2, 1): quick departure, long settle.
  const inv = 1 - t;
  return 1 - inv * inv * inv * (1 - 0.35 * t);
};

function parsePosition(value: string): [number, number] {
  const [x = "50%", y = "50%"] = value.trim().split(/\s+/);
  return [parseFloat(x) / 100, parseFloat(y) / 100];
}

export function mountPrismWall(host: HTMLElement, slides: readonly PrismSlide[], initialIndex: number, options: Options): PrismController {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch {
    options.onFail();
    return { show: () => {}, dispose: () => {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.prismCanvas = "true";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 1, 20000);
  const mobile = window.matchMedia("(max-width: 700px)");
  const loader = new THREE.TextureLoader();
  const textures: (THREE.Texture | null)[] = slides.map(() => null);
  const sizes: [number, number][] = slides.map(() => [1, 1]);
  const pending = new Map<number, Promise<THREE.Texture>>();
  const geometry = prismGeometry();
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  blank.needsUpdate = true;

  const lightMaterial = new THREE.ShaderMaterial({
    uniforms: { uLight: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: lightFragment,
    depthWrite: false
  });
  const backlight = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), lightMaterial);
  scene.add(backlight);

  const slats = Array.from({ length: COUNT }, (_, index) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexA: { value: blank }, uTexB: { value: blank },
        uCoverA: { value: new THREE.Vector4(1, 1, 0, 0) }, uCoverB: { value: new THREE.Vector4(1, 1, 0, 0) },
        uIndex: { value: index }, uCount: { value: COUNT },
        uActivity: { value: 0 }, uGlow: { value: 0 }, uFacePx: { value: 40 },
        uLight: { value: new THREE.Vector3(-0.45, 0.35, 1) }
      },
      vertexShader: prismVertex,
      fragmentShader: prismFragment
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return { mesh, material };
  });

  let width = 1, height = 1;
  let current = initialIndex;
  let target: number | null = null;
  let start = 0;
  let delay = SLAT_DELAY, duration = SLAT_DURATION;
  let frame = 0;
  let disposed = false;
  let visible = true;
  let face = 1;

  function cover(index: number) {
    const [iw, ih] = sizes[index];
    const [px, py] = parsePosition(mobile.matches ? slides[index].mobilePosition : slides[index].position);
    const canvasAspect = width / height, imageAspect = iw / ih;
    const fx = Math.min(1, canvasAspect / imageAspect), fy = Math.min(1, imageAspect / canvasAspect);
    return new THREE.Vector4(fx, fy, (1 - fx) * px, (1 - fy) * (1 - py));
  }

  function load(index: number) {
    if (textures[index]) return Promise.resolve(textures[index]!);
    if (pending.has(index)) return pending.get(index)!;
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(slides[index].src, texture => {
        texture.colorSpace = THREE.NoColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        const image = texture.image as HTMLImageElement;
        sizes[index] = [image.naturalWidth || image.width, image.naturalHeight || image.height];
        textures[index] = texture;
        resolve(texture);
      }, undefined, reject);
    });
    pending.set(index, promise);
    return promise;
  }

  function assign(slot: "A" | "B", index: number | null) {
    for (const slat of slats) {
      const u = slat.material.uniforms;
      if (slot === "A") { u.uTexA.value = index === null ? blank : textures[index] ?? blank; if (index !== null) u.uCoverA.value.copy(cover(index)); }
      else { u.uTexB.value = index === null ? blank : textures[index] ?? blank; if (index !== null) u.uCoverB.value.copy(cover(index)); }
    }
  }

  function layout() {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    canvas.style.width = "100%"; canvas.style.height = "100%";
    camera.aspect = width / height;
    // A wide lens gives the turning prisms real perspective; the resting
    // plane at z = 0 still maps one-to-one onto the canvas.
    camera.fov = 36;
    camera.position.set(0, 0, height / 2 / Math.tan((camera.fov / 2) * Math.PI / 180));
    camera.near = 1; camera.far = camera.position.z * 4;
    camera.updateProjectionMatrix();
    face = width / COUNT;
    slats.forEach((slat, index) => {
      slat.mesh.scale.set(face, height, face);
      slat.mesh.position.x = -width / 2 + face * (index + 0.5);
      slat.mesh.position.z = -APOTHEM * face;
      slat.material.uniforms.uFacePx.value = face;
    });
    backlight.scale.set(width * 1.3, height * 1.1, 1);
    backlight.position.z = -face * 2.6;
    assign("A", current);
    if (target !== null) assign("B", target);
    invalidate();
  }

  function invalidate() { if (!frame && !disposed) frame = requestAnimationFrame(() => render()); }

  function render() {
    frame = 0;
    const now = performance.now();
    let active = false;

    if (target !== null && now - start >= (COUNT - 1) * delay + duration) {
      current = target;
      target = null;
      assign("A", current);
    }
    let turning = 0;
    slats.forEach((slat, index) => {
      let progress = 0;
      if (target !== null) {
        progress = Math.min(1, Math.max(0, (now - start - index * delay) / duration));
        active = true;
      }
      const turn = target === null ? 0 : easeTurn(progress);
      const wave = Math.sin(Math.PI * Math.min(1, progress));
      slat.mesh.rotation.y = TURN * turn;
      // Mid-turn each prism narrows and steps towards the viewer, opening
      // gaps for the backlight.
      slat.mesh.scale.x = face * (1 - 0.16 * wave);
      slat.mesh.scale.z = face * (1 - 0.16 * wave);
      slat.mesh.position.z = -APOTHEM * face + wave * face * 0.7;
      slat.material.uniforms.uActivity.value = wave;
      slat.material.uniforms.uGlow.value = wave;
      turning = Math.max(turning, wave);
    });
    lightMaterial.uniforms.uLight.value = Math.min(1, turning * 1.6) * 1.8;

    if (visible) renderer.render(scene, camera);
    if (active) invalidate();
  }

  function turnTo(index: number, intro: boolean) {
    load(index).then(() => {
      if (disposed) return;
      target = index;
      assign("B", index);
      delay = intro ? INTRO_DELAY : SLAT_DELAY;
      duration = intro ? INTRO_DURATION : SLAT_DURATION;
      start = performance.now();
      invalidate();
    }, () => {});
  }

  const resize = new ResizeObserver(layout);
  const sight = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) invalidate(); });
  const onLost = () => options.onFail();
  const onMedia = () => layout();
  canvas.addEventListener("webglcontextlost", onLost);
  mobile.addEventListener("change", onMedia);

  load(initialIndex).then(() => {
    if (disposed) return;
    layout();
    resize.observe(host);
    sight.observe(host);
    renderer.render(scene, camera);
    options.onReady();
    // Opening: the wall turns once from left to right and settles on the same
    // portrait, showing that the photograph is built from prisms.
    if (!options.reducedMotion) turnTo(initialIndex, true);
    slides.forEach((_, index) => { if (index !== initialIndex) load(index).catch(() => {}); });
  }, () => { if (!disposed) options.onFail(); });

  return {
    show(index, animate) {
      if (index === target || (index === current && target === null)) return;
      if (!animate || options.reducedMotion) {
        load(index).then(() => {
          if (disposed) return;
          target = null;
          current = index;
          assign("A", index);
          slats.forEach(slat => { slat.mesh.rotation.y = 0; slat.mesh.scale.set(face, height, face); slat.mesh.position.z = -APOTHEM * face; slat.material.uniforms.uActivity.value = 0; slat.material.uniforms.uGlow.value = 0; });
          invalidate();
        }, () => {});
        return;
      }
      if (target !== null) { current = target; assign("A", current); }
      turnTo(index, false);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      sight.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      mobile.removeEventListener("change", onMedia);
      slats.forEach(slat => slat.material.dispose());
      geometry.dispose();
      lightMaterial.dispose();
      backlight.geometry.dispose();
      textures.forEach(texture => texture?.dispose());
      blank.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
}
