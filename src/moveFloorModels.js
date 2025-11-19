// src/moveFloorModels.js
const walkers = [];

// extra settings we keep between frames
const settings = {
  bounds: null, // { minX, maxX, minZ, maxZ, margin }
  avoidRadius: 1.5, // how far apart models try to stay
};

export function initFloorModelMotion(
  models,
  {
    baseRadius = 3,
    baseSpeed = 0.4,
    bounds = null, // 👈 optional room bounds
    avoidRadius = 1.5, // 👈 optional personal space
  } = {}
) {
  walkers.length = 0;

  settings.bounds = bounds;
  settings.avoidRadius = avoidRadius;

  models.forEach((mesh, index) => {
    const startPos = mesh.position.clone();

    walkers.push({
      mesh,
      centerX: startPos.x,
      centerZ: startPos.z,
      baseY: startPos.y,
      angle: Math.random() * Math.PI * 2,
      radius: baseRadius * (0.7 + Math.random() * 0.8) + index * 0.2,
      speed:
        baseSpeed *
        (0.7 + Math.random() * 0.8) *
        (Math.random() < 0.5 ? 1 : -1),
    });
  });
}

export function updateFloorModelMotion(delta) {
  const { bounds, avoidRadius } = settings;

  walkers.forEach((w, idx) => {
    // orbit angle
    w.angle += w.speed * delta;

    // desired new pos
    let nx = w.centerX + Math.cos(w.angle) * w.radius;
    let nz = w.centerZ + Math.sin(w.angle) * w.radius;

    // 1) keep inside room bounds
    if (bounds) {
      const { minX, maxX, minZ, maxZ, margin = 0.5 } = bounds;

      nx = Math.min(Math.max(nx, minX + margin), maxX - margin);
      nz = Math.min(Math.max(nz, minZ + margin), maxZ - margin);
    }

    // 2) avoid other models (simple radial push)
    if (avoidRadius > 0) {
      walkers.forEach((other, jdx) => {
        if (idx === jdx) return;

        const ox = other.mesh.position.x;
        const oz = other.mesh.position.z;

        const dx = nx - ox;
        const dz = nz - oz;
        const distSq = dx * dx + dz * dz;

        const minDist = avoidRadius;
        const minDistSq = minDist * minDist;

        if (distSq > 0 && distSq < minDistSq) {
          const dist = Math.sqrt(distSq);
          const push = (minDist - dist) / dist; // 0..something

          // push away from the other model
          nx += dx * push;
          nz += dz * push;
        }
      });
    }

    // apply final position
    w.mesh.position.x = nx;
    w.mesh.position.z = nz;
    w.mesh.position.y = w.baseY; // stay glued to floor
  });
}
