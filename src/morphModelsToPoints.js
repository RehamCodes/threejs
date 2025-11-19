import * as THREE from "three";

const morphers = [];
let globalTime = 0;

// ref to your allModels array from scene.js
let selectablesRef = null;

/**
 * Prepare models so that after `delaySeconds` they turn into point clouds.
 * @param {THREE.Object3D[]} models
 * @param {THREE.Scene} scene
 * @param {object} options
 * @param {number} [options.delaySeconds=60]
 * @param {number[]} [options.pointSizes=[]] - per-model point size
 * @param {THREE.Object3D[]} [options.selectables=null] - your allModels array
 */
export function initMorphModelsToPoints(
  models,
  scene,
  {
    delaySeconds = 60,
    pointSizes = [],
    selectables = null, // 👈 pass allModels
  } = {}
) {
  morphers.length = 0;
  globalTime = 0;
  selectablesRef = selectables;

  models.forEach((root, idx) => {
    morphers.push({
      root,
      scene,
      delaySeconds,
      pointSize: typeof pointSizes[idx] === "number" ? pointSizes[idx] : 0.02,
      done: false,
      pointsGroup: null,
    });
  });
}

/**
 * Call every frame from animate(delta).
 */
export function updateMorphModelsToPoints(delta) {
  globalTime += delta;

  morphers.forEach((m) => {
    if (m.done) return;
    if (globalTime < m.delaySeconds) return;

    const pointsGroup = new THREE.Group();

    // make sure transforms are current
    m.root.updateWorldMatrix(true, true);

    m.root.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;

      // clone geometry into world space so orientation/scale stay correct
      const worldGeo = child.geometry.clone();
      worldGeo.applyMatrix4(child.matrixWorld);

      const color =
        (child.material && child.material.color) || new THREE.Color(0xffffff);

      const pointsMat = new THREE.PointsMaterial({
        size: m.pointSize,
        color,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });

      const points = new THREE.Points(worldGeo, pointsMat);
      pointsGroup.add(points);
    });

    // geometry is already in world space
    pointsGroup.position.set(0, 0, 0);
    pointsGroup.rotation.set(0, 0, 0);
    pointsGroup.scale.set(1, 1, 1);

    // hide original mesh tree
    m.root.visible = false;

    // add particle version
    m.scene.add(pointsGroup);
    m.pointsGroup = pointsGroup;
    m.done = true;

    // 🔥 make the points group *selectable* for raycasting + rotation
    if (selectablesRef && !selectablesRef.includes(pointsGroup)) {
      selectablesRef.push(pointsGroup);
    }
  });
}
