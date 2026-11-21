// Live 3D hero: a row of Pumice two-level hydraulic stackers in a basement. The middle unit runs the
// real sequence on a loop: platform lowers, cars drive out, the next car reverses in, the platform lifts.
// Loaded only on desktop after the page has finished loading; the still render (images/hero3d-*.webp) shows until then.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// mergeGeometries needs all-indexed or all-non-indexed input; boxes and rounded boxes differ.
const merge = (gs) => mergeGeometries(gs.map((g) => (g.index ? g.toNonIndexed() : g)));

const BG = 0x0b0c0e, FRAME = 0xc9451f;
const H = 2.05;   // upper platform height (m)
const L = 16.4;   // loop length (s)
const OUT = 13;   // where cars park off-screen, toward the camera

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (u, a, b) => clamp01((u - a) / (b - a));
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeIn = (x) => x * x * x;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

// Where everything is at loop time t. Roles rotate through 4 cars so the loop never repeats a colour pattern.
export function stateAt(t) {
  const k = Math.floor(t / L), u = t - k * L;
  let py = H;
  if (u >= 4.2 && u < 6.8) py = H * (1 - inOut(seg(u, 4.2, 6.8)));
  else if (u >= 6.8 && u < 11.4) py = 0;
  else if (u >= 11.4 && u < 14) py = H * inOut(seg(u, 11.4, 14));
  const roles = [
    { deck: true, z: u < 6.8 ? 0 : OUT * easeIn(seg(u, 6.8, 9)), vis: u < 9, rev: false },             // leaves from the platform
    { deck: false, z: u < 2 ? 0 : OUT * easeIn(seg(u, 2, 4.2)), vis: u < 4.2, rev: false },             // leaves from the ground
    { deck: true, z: OUT * (1 - easeOut(seg(u, 9, 11.4))), vis: u >= 9, rev: u >= 9 && u < 11.4 },      // reverses onto the platform
    { deck: false, z: OUT * (1 - easeOut(seg(u, 14, 16.4))), vis: u >= 14, rev: u >= 14 },              // reverses into the ground bay
  ];
  return {
    py,
    // A car on the deck rides 7 cm up; it rolls down to the floor as it clears the front edge of the platform.
    cars: roles.map((r, i) => ({ ...r, y: r.deck ? py + 0.07 * (1 - seg(r.z, 2.0, 3.2)) : 0, car: (((2 * k + i) % 4) + 4) % 4 })),
  };
}

// Real cars narrow toward the nose and tail (plan taper) and toward the top (tumblehome).
function taper(geo, ends, top, y0, y1) {
  const pos = geo.attributes.position;
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, pos.getZ(i) * (1 - ends * smooth(1.3, 2.35, Math.abs(x)) - top * smooth(y0, y1, y)));
  }
  geo.computeVertexNormals();
}

function carParts() {
  const body = new THREE.Shape();
  body.moveTo(-2.15, 0.3);
  body.lineTo(-2.22, 0.6);
  body.quadraticCurveTo(-2.25, 0.86, -1.98, 0.92);
  body.lineTo(-1.45, 0.98);
  body.lineTo(1.22, 0.99);
  body.lineTo(1.98, 0.88);
  body.quadraticCurveTo(2.26, 0.82, 2.25, 0.56);
  body.lineTo(2.18, 0.3);
  body.lineTo(1.76, 0.3);
  body.absarc(1.38, 0.3, 0.38, 0, Math.PI, false);
  body.lineTo(-1.0, 0.3);
  body.absarc(-1.38, 0.3, 0.38, 0, Math.PI, false);
  body.lineTo(-2.15, 0.3);
  const bodyG = new THREE.ExtrudeGeometry(body, { depth: 1.56, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.07, bevelSegments: 5, curveSegments: 20 });
  bodyG.translate(0, 0, -0.78);
  taper(bodyG, 0.1, 0.07, 0.62, 1.06);

  const cab = new THREE.Shape();
  cab.moveTo(-1.42, 0.97);
  cab.quadraticCurveTo(-1.18, 1.36, -0.85, 1.4);
  cab.lineTo(0.3, 1.42);
  cab.quadraticCurveTo(0.7, 1.38, 1.2, 0.98);
  cab.lineTo(-1.42, 0.97);
  const cabG = new THREE.ExtrudeGeometry(cab, { depth: 1.24, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 4, curveSegments: 16 });
  cabG.translate(0, 0, -0.62);
  taper(cabG, 0.04, 0.2, 0.98, 1.47);

  const roof = new RoundedBoxGeometry(1.25, 0.05, 1.3, 3, 0.02).translate(-0.27, 1.45, 0);
  const pillar = new THREE.BoxGeometry(0.08, 0.42, 1.46).translate(-0.2, 1.2, 0);
  const trimG = merge([roof, pillar]);

  const wheel = (r, w, seg) => new THREE.CylinderGeometry(r, r, w, seg).rotateX(Math.PI / 2);
  const at = (g, x, z) => g.clone().translate(x, 0.33, z);
  const spots = [[1.38, 0.79], [1.38, -0.79], [-1.38, 0.79], [-1.38, -0.79]];
  const tireG = merge(spots.map(([x, z]) => at(wheel(0.33, 0.24, 32), x, z)));
  const rimG = merge(spots.map(([x, z]) => at(wheel(0.21, 0.25, 24), x, z)));

  // Lamps and grille sit on the bevelled nose and tail (body surface is at about x = ±2.31).
  const lamp = (x, y, z) => new RoundedBoxGeometry(0.06, 0.12, 0.42, 2, 0.025).translate(x, y, z);
  const headG = merge([lamp(2.31, 0.72, 0.52), lamp(2.31, 0.72, -0.52)]);
  const tailG = merge([lamp(-2.3, 0.78, 0.58), lamp(-2.3, 0.78, -0.58)]);
  const grilleG = new RoundedBoxGeometry(0.04, 0.2, 0.84, 2, 0.02).translate(2.33, 0.5, 0);
  return { bodyG, cabG, trimG, tireG, rimG, headG, tailG, grilleG };
}

function concreteTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#403e3b';
  g.fillRect(0, 0, 512, 512);
  const img = g.getImageData(0, 0, 512, 512), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.05})`;
    g.beginPath();
    g.ellipse(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 70, 10 + Math.random() * 40, Math.random() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function blobTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 64, 4, 32, 64, 62);
  r.addColorStop(0, 'rgba(0,0,0,.95)');
  r.addColorStop(0.6, 'rgba(0,0,0,.6)');
  r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r;
  g.save(); g.scale(1, 1); g.fillRect(0, 0, 64, 128); g.restore();
  return new THREE.CanvasTexture(c);
}

function ribTexture() {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 64;
  const g = c.getContext('2d');
  for (let y = 0; y < 64; y++) {
    const v = 128 + 120 * Math.sin((y / 64) * Math.PI * 2);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, 8, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 26);
  return t;
}

export async function start(host, { t = 1, still = false, force = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: still });
  } catch (e) {
    return null; // no WebGL: the still image stays
  }
  if (!still && !force) {
    // Without a GPU every frame is drawn in software on the main thread; keep the still image instead.
    const gl = renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software|basic render/i.test(name)) { renderer.dispose(); return null; }
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, still ? 2 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 15, 31);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1c1c1c, 0.28));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.6);
  key.position.set(5, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 30 });
  key.shadow.bias = -0.0004;
  key.shadow.radius = 4;
  key.shadow.camera.updateProjectionMatrix();
  scene.add(key);
  // Brand-blue rim from low behind: it outlines the cars without tinting the whole floor.
  const rim = new THREE.DirectionalLight(0x36b7fb, 1.6);
  rim.position.set(-6, 1.1, -8);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff8f0, 0.35);
  fill.position.set(-6, 3, 8);
  scene.add(fill);

  // Basement: concrete floor, bay lines, back wall, ceiling light strips.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.68, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xd8b416, roughness: 0.6 });
  for (let i = -3; i <= 3; i++) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 6.2), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(i * 2.75 + 1.375, 0.004, 0.6);
    line.receiveShadow = true;
    scene.add(line);
  }
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b2c30, roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(70, 9), wallMat);
  wall.position.set(0, 4.5, -4.2);
  wall.receiveShadow = true;
  scene.add(wall);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(70, 0.32), new THREE.MeshStandardMaterial({ color: 0x0a5a9e, roughness: 0.7 }));
  stripe.position.set(0, 1.1, -4.19);
  scene.add(stripe);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 1 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5.2;
  scene.add(ceiling);
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.2 });
  const tubeG = new RoundedBoxGeometry(0.16, 0.06, 3.2, 2, 0.03);
  for (let i = -3; i <= 3; i++) for (const z of [-1.5, 5.5]) {
    const tube = new THREE.Mesh(tubeG, tubeMat);
    tube.position.set(i * 2.75, 5.15, z);
    scene.add(tube);
  }

  // Stacker frames.
  const frameMat = new THREE.MeshStandardMaterial({ color: FRAME, roughness: 0.42, metalness: 0.35 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xa9aeb3, roughness: 0.34, metalness: 0.85, bumpMap: ribTexture(), bumpScale: 2.5 });
  const shadowy = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const postG = new RoundedBoxGeometry(0.16, 3.95, 0.16, 2, 0.02);
  const beamG = new RoundedBoxGeometry(0.16, 0.16, 5.06, 2, 0.02);
  const crossG = new RoundedBoxGeometry(2.6, 0.14, 0.14, 2, 0.02);
  const deckG = new THREE.BoxGeometry(2.28, 0.07, 4.9);
  const railG = new RoundedBoxGeometry(0.08, 0.14, 4.9, 2, 0.02);
  function platform() {
    const p = new THREE.Group();
    p.add(shadowy(new THREE.Mesh(deckG, deckMat)));
    for (const x of [-1.16, 1.16]) {
      const rail = shadowy(new THREE.Mesh(railG, frameMat));
      rail.position.set(x, 0.07, 0);
      p.add(rail);
    }
    return p;
  }
  function unit(x) {
    const g = new THREE.Group();
    g.position.x = x;
    for (const px of [-1.22, 1.22]) for (const pz of [-2.45, 2.45]) {
      const post = shadowy(new THREE.Mesh(postG, frameMat));
      post.position.set(px, 1.975, pz);
      g.add(post);
    }
    for (const px of [-1.22, 1.22]) {
      const beam = shadowy(new THREE.Mesh(beamG, frameMat));
      beam.position.set(px, 3.88, 0);
      g.add(beam);
    }
    for (const pz of [-2.45, 2.45]) {
      const cross = shadowy(new THREE.Mesh(crossG, frameMat));
      cross.position.set(0, 3.88, pz);
      g.add(cross);
    }
    const p = platform();
    p.position.y = H + 0.035;
    g.add(p);
    scene.add(g);
    return { g, p };
  }

  // Cars.
  const parts = carParts();
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0d11, roughness: 0.06, metalness: 0.2, clearcoat: 1 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.28, metalness: 1 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e8, emissiveIntensity: 1.6 });
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.5, metalness: 0.4 });
  const blobG = new THREE.PlaneGeometry(2.5, 5.4);
  const blobMat = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.85 });
  function car(color) {
    const paint = new THREE.MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 });
    const tail = new THREE.MeshStandardMaterial({ color: 0x5a0808, emissive: 0xff2222, emissiveIntensity: 0.6 });
    const g = new THREE.Group();
    for (const [geo, mat] of [[parts.bodyG, paint], [parts.cabG, glassMat], [parts.trimG, paint], [parts.tireG, tireMat], [parts.rimG, rimMat], [parts.headG, headMat], [parts.tailG, tail], [parts.grilleG, grilleMat]]) {
      g.add(shadowy(new THREE.Mesh(geo, mat)));
    }
    const holder = new THREE.Group();
    g.rotation.y = -Math.PI / 2; // front faces the camera (+z)
    holder.add(g);
    const blob = new THREE.Mesh(blobG, blobMat); // soft contact shadow, so cars sit on the floor even without shadow maps
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.012;
    holder.add(blob);
    holder.userData.tail = tail;
    scene.add(holder);
    return holder;
  }

  const units = [-5.5, -2.75, 0, 2.75, 5.5].map(unit);
  const parked = [
    [-5.5, H, 0x9ea3a8], [-5.5, 0, 0x16181c],
    [-2.75, H, 0xe9eaec], [-2.75, 0, 0x7a1f24],
    [2.75, H, 0x1d3f73], [2.75, 0, 0xb8bcc1],
    [5.5, H, 0x2f3238],
  ];
  for (const [x, y, c] of parked) {
    const h = car(c);
    h.position.set(x, y > 0 ? y + 0.07 : 0, 0);
  }
  const live = [0xf2f2f0, 0x0f5fa8, 0x3a3d44, 0xc9ccd0].map(car);
  const mid = units[2].p;

  // Longer lens from eye height: the row of stackers recedes into the basement like a photo.
  const camera = new THREE.PerspectiveCamera(29, 1, 0.5, 80);
  const target = new THREE.Vector3(-0.9, 1.5, 0.3);
  const look = { az: 0.92, el: 0.075, r: 16 };
  const aim = { x: 0, y: 0 }, cur = { x: 0, y: 0 };

  function pose(time, dt) {
    const s = stateAt(time);
    mid.position.y = s.py + 0.035;
    for (const c of s.cars) {
      const h = live[c.car];
      h.visible = c.vis;
      h.position.set(0, c.y, c.z);
      h.userData.tail.emissiveIntensity = c.rev ? 2.4 : 0.6;
    }
    // Camera drifts slowly and leans toward the pointer; critically damped follow, no overshoot.
    const k = 1 - Math.exp(-dt * 3);
    cur.x += (aim.x - cur.x) * k;
    cur.y += (aim.y - cur.y) * k;
    const az = look.az + (still ? 0 : 0.06 * Math.sin(time * 2 * Math.PI / 28)) + cur.x * 0.08;
    const el = look.el + cur.y * 0.04;
    camera.position.set(target.x + look.r * Math.sin(az) * Math.cos(el), target.y + look.r * Math.sin(el), target.z + look.r * Math.cos(az) * Math.cos(el));
    camera.lookAt(target);
  }

  const canvas = renderer.domElement;
  host.appendChild(canvas);
  function size() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  size();

  let time = t, last = performance.now(), running = false, visible = true, raf = 0;
  function frame(now) {
    // rAF timestamps can predate the last performance.now() reading; never step time backwards.
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    time += dt;
    pose(time, dt);
    renderer.render(scene, camera);
    raf = running ? requestAnimationFrame(frame) : 0;
  }
  pose(time, 1);
  if (!still) await renderer.compileAsync(scene, camera); // compile shaders off the main thread where the browser allows it
  renderer.render(scene, camera);
  if (still) return { canvas };

  canvas.classList.add('on');
  const setRun = () => {
    const want = visible && !document.hidden;
    if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    if (!want) { running = false; cancelAnimationFrame(raf); }
  };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; setRun(); }).observe(host);
  document.addEventListener('visibilitychange', setRun);
  new ResizeObserver(size).observe(host);
  addEventListener('pointermove', (e) => {
    aim.x = (e.clientX / innerWidth) * 2 - 1;
    aim.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  setRun();
  return { canvas };
}
