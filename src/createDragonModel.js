// src/createDragonModel.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

// store all mixers for all loaded models
const dragonMixers = [];

/**
 * Load a GLB, put it on the floor, optionally play an animation.
 */
export function createDragonOnFloor({
  url = "/models/mechbot_no_sorry_rig_rigged_bone_fbx.glb",
  floorY,
  z = -8,
  x = 0,
  scale = 1,
  yOffset = 0,
  clipName, // e.g. "Walk" if you know it, otherwise it'll use first clip
} = {}) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        console.log("✅ Loaded model:", url, gltf);

        const dragon = gltf.scene || gltf.scenes?.[0];

        dragon.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material && child.material.isMeshStandardMaterial) {
              child.material.metalness = 0.3;
              child.material.roughness = 0.6;
            }
          }
        });

        // basic scale (we can still tweak per model)
        dragon.scale.setScalar(scale);

        // bounds
        const box = new THREE.Box3().setFromObject(dragon);
        const minY = box.min.y;

        // sit on the floor
        dragon.position.set(x, floorY - minY + 0.01 + yOffset, z);
        dragon.rotation.y = Math.PI;

        // 🔥 set up animation mixer if model has clips
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(dragon);

          let clip = null;
          if (clipName) {
            clip = THREE.AnimationClip.findByName(gltf.animations, clipName);
          }
          if (!clip) {
            // fallback: first clip
            clip = gltf.animations[0];
          }

          if (clip) {
            const action = mixer.clipAction(clip);
            action.play();
            dragonMixers.push(mixer);
            console.log(`▶️ Playing clip "${clip.name}" on`, url);
          } else {
            console.warn("No clip found for", url);
          }
        } else {
          console.warn("No animations in model:", url);
        }

        resolve(dragon);
      },
      undefined,
      (err) => {
        console.error("❌ Error loading model:", url, err);
        reject(err);
      }
    );
  });
}

/**
 * Call this every frame to advance animations
 */
export function updateDragonAnimation(delta) {
  dragonMixers.forEach((mixer) => mixer.update(delta));
}
