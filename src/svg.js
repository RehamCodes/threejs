import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
// ---- scene / camera / renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  45,
  innerWidth / innerHeight,
  0.1,
  100
);
camera.position.z = 0.7;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// bloom pipeline
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.1, // strength (0.6–1.6)
  0.4, // radius
  0.0 // threshold
);
composer.addPass(bloom);

document.body.appendChild(renderer.domElement);

// ---- controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let circleTex;
function makeCircleTexture(size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const r = size * 0.5;

  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  // 👇 these help quality & color
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  tex.premultiplyAlpha = true; // avoids dark fringes when glowing
  return tex;
}

function getCircleTexture() {
  if (!circleTex) circleTex = makeCircleTexture(64);
  return circleTex;
}

// ---- helpers
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

function averageCornerColor(data, w, h) {
  const pts = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w * 0.5), 0],
    [Math.floor(w * 0.5), h - 1],
    [0, Math.floor(h * 0.5)],
    [w - 1, Math.floor(h * 0.5)],
  ];
  let R = 0,
    G = 0,
    B = 0;
  pts.forEach(([x, y]) => {
    const i = (y * w + x) * 4;
    R += data[i];
    G += data[i + 1];
    B += data[i + 2];
  });
  const n = pts.length,
    inv = 1 / (255 * n);
  return [R * inv, G * inv, B * inv];
}

function sampleImageToPoints(
  img,
  {
    step = 3, // ↑ bigger = fewer points, less “scanline”
    bgDist = 0.22, // ↑ stricter: drop more bg-like pixels
    whiteLuma = 0.94, // drop near-white background
    blackLuma = 0.02, // (optional) drop near-black specks
    jitterFrac = 0.35, // fraction of step for XY jitter
    zJitter = 0.01, // tiny Z depth jitter
    useCornerBg = true, // compare to avg corner color
  } = {}
) {
  const w = img.width,
    h = img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const bg = useCornerBg ? averageCornerColor(data, w, h) : [0, 0, 0];

  const positions = [],
    colors = [];
  let kept = 0,
    total = 0;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      total++;
      const i = (y * w + x) * 4;
      const r = data[i] / 255,
        g = data[i + 1] / 255,
        b = data[i + 2] / 255,
        a = data[i + 3] / 255;
      if (a < 0.5) continue;

      // luminance gates (kill near-white bg; optional near-black noise)
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum > whiteLuma) continue;
      if (lum < blackLuma) continue;

      // background-color distance (to corners average)
      if (useCornerBg) {
        const dr = r - bg[0],
          dg = g - bg[1],
          db = b - bg[2];
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < bgDist) continue;
      }

      // break the grid + tiny depth
      const j = jitterFrac * step;
      const jx = (Math.random() - 0.5) * j;
      const jy = (Math.random() - 0.5) * j;
      const jz = (Math.random() - 0.5) * zJitter;

      positions.push((x + jx) / w - 0.5, -(y + jy) / h + 0.5, jz);
      colors.push(r, g, b);
      kept++;
    }
  }

  console.log(
    `kept ${kept} / ${total} (${((kept / total) * 100).toFixed(1)}%)`
  );
  return { positions, colors };
}

// --- 2) use it inside createPointCloud
async function createPointCloud(imagePath) {
  const img = await loadImage(imagePath);
  const { positions, colors } = sampleImageToPoints(img, 3, {
    step: 3,
    bgDist: 0.22,
    whiteLuma: 0.94,
    jitterFrac: 0.35,
    zJitter: 0.01,
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();

  const material = new THREE.PointsMaterial({
    size: 0.03, // tune
    map: getCircleTexture(), // ← round sprite
    alphaTest: 0.05, // trim sprite edges
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,

    // blending: THREE.NormalBlending,   // keep while tuning mask
  });
  material.size = 0.03; // tune 0.025–0.05
  material.vertexColors = true;
  material.transparent = true;
  material.depthWrite = false;
  material.sizeAttenuation = true;

  // once your masking looks good:
  material.blending = THREE.AdditiveBlending;

  // if you used the round sprite:
  material.map = getCircleTexture();
  material.alphaTest = 0.05;

  return new THREE.Points(geometry, material);
}

// ---- main (single IIFE)
(async () => {
  const points = await createPointCloud("/space.jpeg");
  points.scale.set(2, 2, 2);
  scene.add(points);

  console.log(points.geometry.attributes.position.count, "verts");

  function animate() {
    controls.update();
    composer.render();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();

// ---- resize
// keep composer sized correctly
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
