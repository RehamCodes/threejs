// src/rippleWalls.js
import * as THREE from "three";

// list of all walls that use the ripple shader
export const rippleTargets = []; // { mesh, material }

/**
 * Create a ShaderMaterial that shows uMap and adds a ripple distortion.
 */
export function createRippleWallMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uRippleCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uRippleTime: { value: 0 },
      uRippleActive: { value: 0 }, // 0 = no ripple, 1 = active
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uMap;
      uniform vec2 uRippleCenter;
      uniform float uRippleTime;
      uniform float uRippleActive;

      void main() {
        vec2 uv = vUv;
        
        if (uRippleActive > 0.5) {
          float dist = distance(uv, uRippleCenter);

          // ripple wave
          float wave = 0.03 * sin(20.0 * dist - 8.0 * uRippleTime) * exp(-6.0 * dist);

          // displace UVs outwards from center
          vec2 dir = normalize(uv - uRippleCenter + 0.0001);
          uv += dir * wave;
        }

        vec4 tex = texture2D(uMap, uv);
        gl_FragColor = tex;
      }
    `,
    side: THREE.DoubleSide,
  });
}

/**
 * Helper: just the wall meshes for raycasting.
 */
export function getRippleMeshes() {
  return rippleTargets.map((r) => r.mesh);
}

/**
 * Helper: advance ripple time each frame.
 * Call from animate(delta).
 */
export function updateRippleWalls(delta) {
  rippleTargets.forEach((r) => {
    const u = r.material.uniforms;
    if (u.uRippleActive.value > 0.5) {
      u.uRippleTime.value += delta;

      const duration = 1.2; // ripple lifetime in seconds
      if (u.uRippleTime.value > duration) {
        u.uRippleActive.value = 0.0;
      }
    }
  });
}
