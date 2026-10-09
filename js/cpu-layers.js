// Interaktivni "eksplodirani" 3D prikaz procesora (sve je generirano u kodu, nema vanjskih modela).
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Redoslijed: 0 IHS, 1 TIM, 2 jezgra, 3 podloga, 4 pinovi (isto kao CPU_LAYERS u index.html)
const COLORS = ["#d7dde6", "#cfe0ff", "#9fb0c6", "#2f6b34", "#d8b45a"];
const BASE_Y = [0.146, 0.088, 0.055, 0, -0.08];   // položaj kad je procesor sastavljen
const EXPLODE = [1.0, 0.68, 0.38, 0, -0.55];      // koliko se sloj podiže/spušta kad se rastavi

// Jednostavan deterministički slučajni generator (da tekstura uvijek izgleda isto).
function rng(seed) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); }

function canvasTex(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function ihsTexture() {
  return canvasTex(512, (g, s) => {
    const gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, "#eef1f5"); gr.addColorStop(1, "#a9b2bf");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    const r = rng(7);
    g.lineWidth = 1;
    for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(90,100,115,${0.04 + r() * 0.05})`; const y = r() * s; g.beginPath(); g.moveTo(0, y); g.lineTo(s, y + (r() - 0.5) * 4); g.stroke(); }
    g.strokeStyle = "#8a93a1"; g.lineWidth = 3; g.strokeRect(s * 0.1, s * 0.1, s * 0.8, s * 0.8);
    g.fillStyle = "#5b6472"; g.textAlign = "center"; g.font = "bold 120px 'Space Grotesk',system-ui,Arial"; g.fillText("CPU", s / 2, s * 0.53);
    g.font = "28px 'Space Grotesk',system-ui,Arial"; g.fillText("8 jezgri · 16 dretvi", s / 2, s * 0.66);
    g.fillStyle = "#d8b45a"; g.beginPath(); g.moveTo(s * 0.06, s * 0.94); g.lineTo(s * 0.06, s * 0.82); g.lineTo(s * 0.18, s * 0.94); g.fill();
  });
}

function dieTexture() {
  return canvasTex(512, (g, s) => {
    g.fillStyle = "#26364d"; g.fillRect(0, 0, s, s);
    g.fillStyle = "#3b5a85"; g.strokeStyle = "#7fa6d8"; g.lineWidth = 2;
    for (let row = 0; row < 2; row++) for (let c = 0; c < 4; c++) {
      const x = 40 + c * 112, y = row ? 332 : 40;
      g.fillRect(x, y, 100, 140); g.strokeRect(x, y, 100, 140);
    }
    g.fillStyle = "#2f4a70"; g.fillRect(40, 196, 432, 120); g.strokeRect(40, 196, 432, 120);
    const r = rng(3); g.strokeStyle = "rgba(160,200,255,.25)"; g.lineWidth = 1;
    for (let i = 0; i < 70; i++) { const x = r() * s; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, s); g.stroke(); }
    for (let i = 0; i < 70; i++) { const y = r() * s; g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
  });
}

function substrateTexture() {
  return canvasTex(512, (g, s) => {
    g.fillStyle = "#2f6b34"; g.fillRect(0, 0, s, s);
    g.fillStyle = "#285c2d"; g.fillRect(s * 0.25, s * 0.25, s * 0.5, s * 0.5);
    const r = rng(11);
    g.strokeStyle = "#5aa860"; g.lineWidth = 2;
    for (let i = 0; i < 90; i++) {
      let x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 3; k++) { if (r() > 0.5) x += (r() - 0.5) * 140; else y += (r() - 0.5) * 140; g.lineTo(x, y); }
      g.stroke();
    }
    g.fillStyle = "#d8b45a";
    for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(r() * s, r() * s, 3, 0, 7); g.fill(); }
    g.fillStyle = "#1b1b1b";
    for (let i = 0; i < 10; i++) { const y = 150 + i * 22; g.fillRect(14, y, 16, 9); g.fillRect(s - 30, y, 16, 9); }
    g.strokeStyle = "#6fbf76"; g.setLineDash([8, 6]); g.lineWidth = 2; g.strokeRect(s * 0.25, s * 0.25, s * 0.5, s * 0.5);
  });
}

export function initCpuExplode(holder, { onSelect, onToggle, onReady } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(3, 5, 4);
  scene.add(sun, new THREE.AmbientLight(0xffffff, 0.3));

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const HOME = { pos: new THREE.Vector3(3.3, 2.3, 3.7), target: new THREE.Vector3(0, 0.25, 0) };
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 0.9;
  controls.minDistance = 2.5; controls.maxDistance = 10;

  // ---- Građa slojeva ----
  const layers = []; // {group, mats[]}
  const root = new THREE.Group(); scene.add(root);
  const pickables = [];

  function mkLayer(i, meshes) {
    const group = new THREE.Group(); group.userData.layerIndex = i;
    const mats = [];
    meshes.forEach((m) => {
      group.add(m);
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => { if (!mats.includes(mt)) { mt.userData.base = mt.opacity; mats.push(mt); } });
      pickables.push(m);
    });
    group.position.y = BASE_Y[i];
    root.add(group);
    layers[i] = { group, mats };
  }
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const color = (i) => new THREE.Color(COLORS[i]);

  // 0 – IHS (metalni poklopac)
  const ihsSide = std({ color: "#b9c1cc", metalness: 0.9, roughness: 0.35 });
  const ihsTop = std({ map: ihsTexture(), metalness: 0.85, roughness: 0.38 });
  mkLayer(0, [new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), [ihsSide, ihsSide, ihsTop, ihsSide, ihsSide, ihsSide])]);

  // 1 – TIM (pasta)
  mkLayer(1, [new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.016, 1.0),
    new THREE.MeshPhysicalMaterial({ color: COLORS[1], roughness: 0.25, transparent: true, opacity: 0.85, clearcoat: 1 }))]);

  // 2 – silicijska jezgra
  const dieSide = std({ color: "#5d708c", metalness: 0.6, roughness: 0.4 });
  const dieTop = std({ map: dieTexture(), metalness: 0.5, roughness: 0.3 });
  mkLayer(2, [new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 1.0), [dieSide, dieSide, dieTop, dieSide, dieSide, dieSide])]);

  // 3 – podloga (zelena pločica)
  const subTop = std({ map: substrateTexture(), metalness: 0.1, roughness: 0.6 });
  const subSide = std({ color: "#245a29", metalness: 0.1, roughness: 0.7 });
  mkLayer(3, [new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 2.0), [subSide, subSide, subTop, subSide, subSide, subSide])]);

  // 4 – zlatni pinovi (instancirani cilindri, bez sredine kao na pravom čipu)
  const pinMat = std({ color: COLORS[4], metalness: 1, roughness: 0.28 });
  const spots = [];
  for (let r = 0; r < 20; r++) for (let c = 0; c < 20; c++) {
    if (r > 6 && r < 13 && c > 6 && c < 13) continue;
    spots.push([-0.86 + c * 0.0905, -0.86 + r * 0.0905]);
  }
  const pins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.016, 0.016, 0.1, 10), pinMat, spots.length);
  const m4 = new THREE.Matrix4();
  spots.forEach((p, k) => { m4.setPosition(p[0], 0, p[1]); pins.setMatrixAt(k, m4); });
  mkLayer(4, [pins]);

  // ---- Stanje i animacija ----
  let selected = null, t = 0, target = 0, hovered = false;
  const easeIO = (x) => x * x * (3 - 2 * x);

  function applyHighlight() {
    layers.forEach((L, i) => L.mats.forEach((mt) => {
      const dim = selected !== null && selected !== i;
      mt.transparent = dim || mt.userData.base < 1;
      mt.opacity = dim ? mt.userData.base * 0.25 : mt.userData.base;
      mt.depthWrite = !dim;
      if (mt.emissive) { mt.emissive.copy(selected === i ? color(i) : new THREE.Color(0)); mt.emissiveIntensity = selected === i ? 0.35 : 0; }
      mt.needsUpdate = true;
    }));
  }

  function select(i) {
    selected = i === undefined ? null : i;
    controls.autoRotate = selected === null;
    applyHighlight();
  }
  function setExploded(v) { target = v ? 1 : 0; onToggle && onToggle(!!v); }
  function resetView() { camera.position.copy(HOME.pos); controls.target.copy(HOME.target); controls.update(); }
  resetView();

  // ---- Klik / lebdenje (raycast) ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function layerAt(ev) {
    const rc = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - rc.left) / rc.width) * 2 - 1, -((ev.clientY - rc.top) / rc.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit ? hit.object.parent.userData.layerIndex : null;
  }
  let down = null;
  const el = renderer.domElement;
  el.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
  el.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const i = layerAt(e);
    onSelect && onSelect(i);
  });
  el.addEventListener("pointermove", (e) => {
    if (e.buttons) return;
    const h = layerAt(e) !== null;
    if (h !== hovered) { hovered = h; el.style.cursor = h ? "pointer" : "grab"; }
  });

  // ---- Veličina i petlja renderiranja (samo kad je vidljivo) ----
  function resize() {
    const w = holder.clientWidth || 1, h = holder.clientHeight || 1;
    renderer.setSize(w, h, false);
    el.style.width = "100%"; el.style.height = "100%";
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(holder); resize();

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.1);
    t += (target - t) * Math.min(1, dt * 3.2);
    if (Math.abs(target - t) < 0.0005) t = target;
    const e = easeIO(t);
    layers.forEach((L, i) => (L.group.position.y = BASE_Y[i] + EXPLODE[i] * e));
    controls.update();
    renderer.render(scene, camera);
  }

  let firstView = true;
  new IntersectionObserver((entries) => {
    const vis = entries[0].isIntersecting;
    renderer.setAnimationLoop(vis ? frame : null);
    if (vis) clock.getDelta();
    if (vis && firstView) { firstView = false; setTimeout(() => setExploded(true), 700); }
  }, { threshold: 0.15 }).observe(holder);

  applyHighlight();
  onReady && onReady();

  return {
    select, setExploded, resetView,
    get exploded() { return target === 1; },
  };
}
