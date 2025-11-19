// src/scene.js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { createTiledFloor } from "./createTiledFloor.js";
import {
  createDragonOnFloor,
  updateDragonAnimation,
} from "./createDragonModel.js";
import {
  initFloorModelMotion,
  updateFloorModelMotion,
} from "./moveFloorModels.js";
import {
  initMorphModelsToPoints,
  updateMorphModelsToPoints,
} from "./morphModelsToPoints.js";
import {
  rippleTargets,
  createRippleWallMaterial,
  getRippleMeshes,
  updateRippleWalls,
} from "./rippleWalls.js"; // adjust path if needed

// ===== HTML FACE ELEMENTS =====
const backWallEl = document.getElementById("back-wall");
const rightWallEl = document.getElementById("right-wall");
const leftWallEl = document.getElementById("left-wall");
// const ceilingWallEl = document.getElementById("ceiling-wall");
const floorWallEl = document.getElementById("floor-wall");

// ===== THREE SETUP =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// SETTINGS
const FOV = 45;
const WALL_DISTANCE = 20;
const FILL_FACTOR = 0.6; // ✅ keep it
const ROOM_COLOR = 0x000000;

const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 200);

const vFovRad = THREE.MathUtils.degToRad(FOV);
const fullHeight = 2 * WALL_DISTANCE * Math.tan(vFovRad / 2);
const wallHeight = fullHeight * FILL_FACTOR;
const wallWidth = wallHeight * aspect;
const HEIGHT_MULTIPLIER = 1 / FILL_FACTOR; // with 0.6 → ~1.666

const eyeY = wallHeight * 0.6;
camera.position.set(0, eyeY, 0);

// WEBGL RENDERER (3D room)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// CSS2D RENDERER (HTML faces stuck to meshes)
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.left = "0";
labelRenderer.domElement.style.pointerEvents = "none";
document.body.appendChild(labelRenderer.domElement);

// LIGHTS
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(4, 8, 10);
scene.add(ambient, dir);
// at top-level in scene.js
let modelsOnFloor = [];

// after you have floorY from createTiledFloor
const modelConfigs = [
  {
    url: "/models/mechbot_no_sorry_rig_rigged_bone_fbx.glb",
    x: 0,
    z: -WALL_DISTANCE * 0.6,
    scale: 0.06,
    canMove: false,
    canMorph: true,
    pointSize: 0.007, // small robot → modest dots
  },
  {
    url: "/models/green_ogre__3d_fantasy_monster.glb",
    x: 1,
    z: -WALL_DISTANCE * 0.7,
    scale: 1,
    canMove: false,
    canMorph: true,
    pointSize: 0.005, // 🔥 much smaller
  },
  {
    url: "/models/green_ogre__3d_fantasy_monster.glb",
    x: -2,
    z: -WALL_DISTANCE * 0.7,
    scale: 1,
    canMove: false,
    canMorph: true,
    pointSize: 0.005, // same here
  },
  {
    url: "/models/robotic_t-rex_roaring_animation.glb",
    x: 4,
    z: -WALL_DISTANCE * 0.77,
    scale: 0.4,
    canMove: false,
    canMorph: true,
    pointSize: 0.015, // a bit bigger, big creature
  },
];

console.log("Model configs:", modelConfigs);
// ===== FLOOR =====
const { floor, grid, floorY } = createTiledFloor({
  wallWidth,
  wallDistance: WALL_DISTANCE,
  wallHeight,
  eyeY,
  roomColor: 0x050608, // or ROOM_COLOR if you want
});

scene.add(floor);
scene.add(grid);

Promise.all(
  modelConfigs.map((cfg) =>
    createDragonOnFloor({
      floorY,
      ...cfg,
    })
  )
).then((loaded) => {
  const movingModels = [];
  const morphableModels = [];
  const morphPointSizes = [];

  loaded.forEach((mesh, index) => {
    scene.add(mesh);

    const cfg = modelConfigs[index];

    // 1) everything is selectable
    allModels.push(mesh);

    // 2) some can move around
    if (cfg.canMove) {
      movingModels.push(mesh);
    }

    // 3) some are allowed to morph (default true)
    const canMorph = cfg.canMorph !== false;
    if (canMorph) {
      morphableModels.push(mesh);
      morphPointSizes.push(
        typeof cfg.pointSize === "number" ? cfg.pointSize : 0.02
      );
    }
  });

  modelsOnFloor = movingModels;

  if (modelsOnFloor.length > 0) {
    initFloorModelMotion(modelsOnFloor, {
      baseRadius: 3,
      baseSpeed: 0.25,
      bounds: {
        minX: -wallWidth / 2,
        maxX: wallWidth / 2,
        minZ: -WALL_DISTANCE,
        maxZ: 0,
        margin: 1,
      },
      avoidRadius: 1.5,
    });
  }

  // 👉 only morph some models, but pass allModels so particles remain pickable
  if (morphableModels.length > 0) {
    initMorphModelsToPoints(morphableModels, scene, {
      delaySeconds: 60,
      pointSizes: morphPointSizes,
      selectables: allModels, // 🔥 important
    });
  }
});
// attach floor DOM label
const floorLabel = new CSS2DObject(floorWallEl);
floorLabel.position.set(0, 0.01, 0);
floor.add(floorLabel);

// ===== CEILING =====
// const ceilingGeo = new THREE.PlaneGeometry(wallWidth, WALL_DISTANCE);
// const ceilingMat = new THREE.MeshStandardMaterial({
//   color: ROOM_COLOR,
//   side: THREE.DoubleSide,
// });
// const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
// const ceilingY = eyeY + wallHeight / 2;

// ceiling.rotation.x = Math.PI / 2;
// ceiling.position.set(0, ceilingY, -WALL_DISTANCE / 2);
// scene.add(ceiling);

// const ceilingLabel = new CSS2DObject(ceilingWallEl);
// ceilingLabel.position.set(0, -0.01, 0);
// ceiling.add(ceilingLabel);

// ===== TEXTURE LOADER =====
// ===== TEXTURE LOADER =====
const texLoader = new THREE.TextureLoader();
let backWall;

// side walls geometry
const sideWallGeo = new THREE.PlaneGeometry(WALL_DISTANCE, wallHeight);

// --- LEFT WALL ---
texLoader.load("/background.jpeg", (leftTex) => {
  if ("colorSpace" in leftTex) {
    leftTex.colorSpace = THREE.SRGBColorSpace;
  }

  const leftMat = createRippleWallMaterial(leftTex);
  const leftWall = new THREE.Mesh(sideWallGeo, leftMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.scale.y = HEIGHT_MULTIPLIER;
  leftWall.position.set(-wallWidth / 2, eyeY, -WALL_DISTANCE / 2);
  scene.add(leftWall);

  rippleTargets.push({ mesh: leftWall, material: leftMat });

  const leftLabel = new CSS2DObject(leftWallEl);
  leftLabel.position.set(0, 0, 0.01);
  leftWall.add(leftLabel);
});

// --- RIGHT WALL ---
texLoader.load("/background.jpeg", (rightTex) => {
  if ("colorSpace" in rightTex) {
    rightTex.colorSpace = THREE.SRGBColorSpace;
  }

  const rightMat = createRippleWallMaterial(rightTex);
  const rightWall = new THREE.Mesh(sideWallGeo, rightMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.scale.y = HEIGHT_MULTIPLIER;
  rightWall.position.set(wallWidth / 2, eyeY, -WALL_DISTANCE / 2);
  scene.add(rightWall);

  rippleTargets.push({ mesh: rightWall, material: rightMat });

  const rightLabel = new CSS2DObject(rightWallEl);
  rightLabel.position.set(0, 0, 0.01);
  rightWall.add(rightLabel);
});

// ===== BACK WALL WITH IMAGE =====
texLoader.load("/background.jpeg", (texture) => {
  if ("colorSpace" in texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  const backWallGeo = new THREE.PlaneGeometry(wallWidth, wallHeight);
  const backWallMat = createRippleWallMaterial(texture);
  backWall = new THREE.Mesh(backWallGeo, backWallMat);

  backWall.position.set(0, eyeY, -WALL_DISTANCE);
  backWall.scale.y = HEIGHT_MULTIPLIER;
  scene.add(backWall);

  rippleTargets.push({ mesh: backWall, material: backWallMat });

  const backLabel = new CSS2DObject(backWallEl);
  backLabel.position.set(0, 0, 0.01);
  backWall.add(backLabel);
});

// only ones that canMove
let allModels = []; // ✅ all loaded models (for rotation / raycast)

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let activeModel = null;
let isDragging = false;
let prevX = 0;

function findSelectableRoot(obj) {
  if (!obj) return null;
  while (obj.parent && !allModels.includes(obj)) {
    obj = obj.parent;
  }
  return allModels.includes(obj) ? obj : null;
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  isDragging = true;
  prevX = e.clientX;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(allModels, true);

  if (hits.length > 0) {
    activeModel = findSelectableRoot(hits[0].object);
  } else {
    activeModel = null;
  }
});

renderer.domElement.addEventListener("pointermove", (e) => {
  if (!isDragging || !activeModel) return;

  const deltaX = e.clientX - prevX;
  prevX = e.clientX;

  const rotationSpeed = 0.01;
  activeModel.rotation.y += deltaX * rotationSpeed;
});

window.addEventListener("pointerup", () => {
  isDragging = false;
  activeModel = null;
});

renderer.domElement.addEventListener("pointermove", (e) => {
  // 1) MODEL ROTATION (only when dragging a picked model)
  if (isDragging && activeModel) {
    const deltaX = e.clientX - prevX;
    prevX = e.clientX;

    const rotationSpeed = 0.01;
    activeModel.rotation.y += deltaX * rotationSpeed;
  }

  // 2) RIPPLE ON WALLS (always check hover, even if not dragging)
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const wallHits = raycaster.intersectObjects(getRippleMeshes(), false);

  if (wallHits.length > 0) {
    const hit = wallHits[0];
    const entry = rippleTargets.find((r) => r.mesh === hit.object);
    if (entry && hit.uv) {
      entry.material.uniforms.uRippleCenter.value.copy(hit.uv);
      entry.material.uniforms.uRippleTime.value = 0.0;
      entry.material.uniforms.uRippleActive.value = 1.0;
    }
  }
});

// ===== CONTROLS (we'll drive camera, so disable user input) =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enableRotate = false;
controls.enablePan = false;

// ===== SCROLL-DRIVEN CAMERA STATES =====

// how far from each wall when "full-screen"
const viewDist = WALL_DISTANCE / 2;

// predefine centers for each face
const backCenter = new THREE.Vector3(0, eyeY, -WALL_DISTANCE);
const rightCenter = new THREE.Vector3(wallWidth / 2, eyeY, -WALL_DISTANCE / 2);
const leftCenter = new THREE.Vector3(-wallWidth / 2, eyeY, -WALL_DISTANCE / 2);
const floorCenter = new THREE.Vector3(0, floorY, -WALL_DISTANCE / 2);
// const ceilingCenter = new THREE.Vector3(0, ceilingY, -WALL_DISTANCE / 2);

// camera states: pos + target
const states = [
  // 0: door view → whole room
  {
    pos: new THREE.Vector3(0, eyeY, 0),
    target: backCenter.clone(),
  },
  // 1: zoomed into back wall
  {
    pos: new THREE.Vector3(0, eyeY, backCenter.z + viewDist),
    target: backCenter.clone(),
  },
  // 2: right wall full screen
  {
    pos: new THREE.Vector3(rightCenter.x - viewDist, eyeY, rightCenter.z),
    target: rightCenter.clone(),
  },
  // 3: left wall full screen
  {
    pos: new THREE.Vector3(leftCenter.x + viewDist, eyeY, leftCenter.z),
    target: leftCenter.clone(),
  },
  // 4: floor full screen
  {
    pos: new THREE.Vector3(0, floorCenter.y + viewDist, floorCenter.z),
    target: floorCenter.clone(),
  },
  // 5: ceiling full screen
  // {
  //   pos: new THREE.Vector3(0, ceilingCenter.y - viewDist, ceilingCenter.z),
  //   target: ceilingCenter.clone(),
  // },
];

const maxStateIndex = states.length - 1;
let scrollProgress = 0; // 0 → 5

// set initial camera state
camera.position.copy(states[0].pos);
controls.target.copy(states[0].target);
controls.update();

// wheel -> virtual scroll
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    // tune 0.002 for how fast the scroll moves through sections
    scrollProgress += e.deltaY * 0.002;
    scrollProgress = THREE.MathUtils.clamp(scrollProgress, 0, maxStateIndex);
  },
  { passive: false }
);

// ===== RESIZE =====
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // scroll-driven camera
  const s = THREE.MathUtils.clamp(scrollProgress, 0, maxStateIndex);
  const i = Math.floor(s);
  const t = s - i;
  const a = states[i];
  const b = states[Math.min(i + 1, maxStateIndex)];

  camera.position.lerpVectors(a.pos, b.pos, t);
  controls.target.lerpVectors(a.target, b.target, t);
  controls.update();

  // 🦶 move them around the floor
  updateFloorModelMotion(delta);
  updateMorphModelsToPoints(delta);
  // 🦵 animate their legs / bones using GLTF animations
  updateDragonAnimation?.(delta);
  updateRippleWalls(delta); // 👈 add this
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();
