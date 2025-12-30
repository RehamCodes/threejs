import * as THREE from "three";

export function addGlowOutline(mesh, color = 0x00ffff) {
  const edgesGeo = new THREE.EdgesGeometry(mesh.geometry);

  // 1) Base crisp outline
  const baseMat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
  });
  const baseOutline = new THREE.LineSegments(edgesGeo, baseMat);
  baseOutline.renderOrder = 10;
  mesh.add(baseOutline);

  // 2) Slightly thicker core stroke (fake thickness)
  const coreMat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
  });
  const core = new THREE.LineSegments(edgesGeo, coreMat);
  const coreScale = 1.015; // very close to the wall
  core.scale.set(coreScale, coreScale, coreScale);
  core.renderOrder = 11;
  mesh.add(core);

  // 3) Soft halo: just 2 small glow layers hugging the edge
  const glowLayers = 2;
  for (let i = 1; i <= glowLayers; i++) {
    const glowMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.35 / i,
      blending: THREE.AdditiveBlending,
      depthTest: false, // so it doesn't disappear behind the wall
      depthWrite: false,
    });

    const glow = new THREE.LineSegments(edgesGeo, glowMat);
    const scale = 1.02 + i * 0.015; // very small expansion
    glow.scale.set(scale, scale, scale);
    glow.renderOrder = 20 + i;
    mesh.add(glow);
  }

  // 4) Tiny shadow right behind the edge for contrast
  const shadowMat = new THREE.LineBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.4,
  });

  const shadow = new THREE.LineSegments(edgesGeo, shadowMat);
  shadow.scale.set(1.01, 1.01, 1.01);
  shadow.position.z = -0.02;
  shadow.renderOrder = 5;
  mesh.add(shadow);
}
