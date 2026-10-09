// 3D preglednik: učitava GLB modele i omogućuje rotaciju, zumiranje i pomicanje.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function initViewer(holder, { onProgress, onError, onReady } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));

  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotateSpeed = 1.2;
  controls.autoRotate = true;

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  let current = null;
  let token = 0;
  let home = { pos: new THREE.Vector3(1.6, 1.0, 2.6), target: new THREE.Vector3() };

  function resize() {
    const w = holder.clientWidth || 1;
    const h = holder.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(holder);
  resize();

  function disposeModel(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          Object.values(m).forEach((v) => v && v.isTexture && v.dispose());
          m.dispose();
        });
      }
    });
  }

  function fit(model) {
    // Centriraj model u ishodište i normaliziraj veličinu.
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = 2 / Math.max(size.x, size.y, size.z || 1);
    model.scale.multiplyScalar(scale);
    box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const dist = (radius / Math.sin((camera.fov * Math.PI) / 360)) * 0.95;
    const dir = new THREE.Vector3(0.65, 0.4, 1).normalize();
    home.pos.copy(dir.multiplyScalar(dist));
    home.target.set(0, 0, 0);
    controls.minDistance = dist * 0.25;
    controls.maxDistance = dist * 3;
    camera.near = dist / 100;
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    resetView();
  }

  function resetView() {
    camera.position.copy(home.pos);
    controls.target.copy(home.target);
    controls.update();
  }

  function show(url) {
    const my = ++token;
    if (current) {
      scene.remove(current);
      disposeModel(current);
      current = null;
    }
    onProgress && onProgress(0);
    loader.load(
      url,
      (gltf) => {
        if (my !== token) return disposeModel(gltf.scene);
        current = gltf.scene;
        scene.add(current);
        fit(current);
        onReady && onReady();
      },
      (e) => {
        if (my === token && e.total) onProgress && onProgress(e.loaded / e.total);
      },
      (err) => {
        if (my === token) onError && onError(err);
      }
    );
  }

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    show,
    resetView,
    setAutoRotate: (v) => (controls.autoRotate = !!v),
    get autoRotate() { return controls.autoRotate; },
  };
}
