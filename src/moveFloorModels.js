// src/moveFloorModels.js
import * as THREE from "three";

const walkers = [];

// extra settings we keep between frames
const settings = {
  bounds: null, // { minX, maxX, minZ, maxZ, margin }
  avoidRadius: 1.5, // how far apart models try to stay
  followSpeed: 2.0, // units per second
  followTarget: null, // THREE.Vector3 | null
};

export function initFloorModelMotion(
  models,
  { bounds = null, avoidRadius = 1.5, followSpeed = 2.0 } = {}
) {
  walkers.length = 0;

  settings.bounds = bounds;
  settings.avoidRadius = avoidRadius;
  settings.followSpeed = followSpeed;

  models.forEach((mesh) => {
    const startPos = mesh.position.clone();

    walkers.push({
      mesh,
      baseY: startPos.y,
    });
  });
}

// 👇 call this from scene.js when you get a mouse hit on the floor
export function setFloorFollowTarget(targetVec3) {
  if (!targetVec3) {
    settings.followTarget = null;
  } else {
    if (!settings.followTarget) {
      settings.followTarget = new THREE.Vector3();
    }
    settings.followTarget.copy(targetVec3);
  }
}

export function updateFloorModelMotion(delta) {
  const { bounds, avoidRadius, followSpeed, followTarget } = settings;
  if (!followTarget) return; // nothing to chase yet

  walkers.forEach((w, idx) => {
    const pos = w.mesh.position;

    // vector from model → target
    let dx = followTarget.x - pos.x;
    let dz = followTarget.z - pos.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < 1e-6) {
      // already basically at target
      return;
    }

    const dist = Math.sqrt(distSq);

    // max movement this frame
    const maxStep = followSpeed * delta;
    const step = Math.min(maxStep, dist);

    dx = (dx / dist) * step;
    dz = (dz / dist) * step;

    let nx = pos.x + dx;
    let nz = pos.z + dz;

    // 1) keep inside room bounds
    if (bounds) {
      const { minX, maxX, minZ, maxZ, margin = 0.5 } = bounds;

      nx = Math.min(Math.max(nx, minX + margin), maxX - margin);
      nz = Math.min(Math.max(nz, minZ + margin), maxZ - margin);
    }

    // 2) avoid other moving models
    if (avoidRadius > 0) {
      walkers.forEach((other, jdx) => {
        if (idx === jdx) return;

        const ox = other.mesh.position.x;
        const oz = other.mesh.position.z;

        const ddx = nx - ox;
        const ddz = nz - oz;
        const d2 = ddx * ddx + ddz * ddz;

        const minDist = avoidRadius;
        const minDistSq = minDist * minDist;

        if (d2 > 0 && d2 < minDistSq) {
          const d = Math.sqrt(d2);
          const push = (minDist - d) / d; // 0..something

          nx += ddx * push;
          nz += ddz * push;
        }
      });
    }

    // apply final position
    w.mesh.position.x = nx;
    w.mesh.position.z = nz;
    w.mesh.position.y = w.baseY; // stay glued to floor

    // rotate to face movement direction
    if (step > 0.0001) {
      w.mesh.rotation.y = Math.atan2(dx, dz);
    }
  });
}
