import * as THREE from "three";
import vert from "./fullscreen.vert?raw";
import frag from "./fractal.frag?raw";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const geo = new THREE.PlaneGeometry(2, 2);
const mat = new THREE.ShaderMaterial({
  vertexShader: vert,
  fragmentShader: frag,
  uniforms: {
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uTime: { value: 0 },
  },
  depthWrite: false,
});

scene.add(new THREE.Mesh(geo, mat));

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  mat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

const clock = new THREE.Clock();
(function animate() {
  mat.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
})();
