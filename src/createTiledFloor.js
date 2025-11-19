// src/createTiledFloor.js
import * as THREE from "three";

export function createTiledFloor({
  wallWidth,
  wallDistance,
  wallHeight,
  eyeY,
  roomColor = 0x050608, // very dark floor
}) {
  // main floor plane
  const floorGeo = new THREE.PlaneGeometry(wallWidth, wallDistance);
  const floorMat = new THREE.MeshStandardMaterial({
    color: roomColor,
    metalness: 0.2,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  const floor = new THREE.Mesh(floorGeo, floorMat);
  const floorY = eyeY - wallHeight / 2;

  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, floorY, -wallDistance / 2);

  // tile grid lines
  const gridDivisions = 18; // how many tiles front→back

  const grid = new THREE.GridHelper(
    wallDistance, // size along Z
    gridDivisions, // number of cells
    0x111111, // center line color
    0x222222 // other lines color
  );

  // sit just above the floor to avoid z-fighting
  grid.position.set(0, floorY + 0.001, -wallDistance / 2);

  // stretch grid in X so it matches room width
  grid.scale.x = wallWidth / wallDistance;

  grid.renderOrder = 15;

  return { floor, grid, floorY };
}
