/* ---------- renderer ---------- */
const host = document.getElementById('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }); }
catch (e) { window.DW_RENDER_FAIL('This browser could not start 3D graphics (WebGL). The bill of materials and calculations tabs still work.'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer({ element: document.getElementById('labels') });

const scene = new THREE.Scene();
const BG = new THREE.Color('#151a1f');
scene.background = BG;
scene.fog = new THREE.Fog(BG, 1500, 3800);
const pmrem = new THREE.PMREMGenerator(renderer);
const envStudio = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envStudio;

const camera = new THREE.PerspectiveCamera(32, 1, 2, 12000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 30;
controls.maxDistance = 4000;

/* ---------- procedural textures ---------- */
function canvasTex(w, h, draw, repeat = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function normalFromHeight(src, strength = 2) {
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const og = out.getContext('2d'), od = og.createImageData(w, h);
  const H = (x, y) => d[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    od.data[i] = (-dx / l * 0.5 + 0.5) * 255; od.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; od.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; od.data[i + 3] = 255;
  }
  og.putImageData(od, 0, 0);
  const t = new THREE.CanvasTexture(out); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function heightCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function linTex(c) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; }
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function drawDuckweedUnused(n) {
  return (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const cx = rnd() * w, cy = rnd() * h, k = 1 + Math.floor(rnd() * 3.4);
      for (let j = 0; j < k; j++) {
        const a = rnd() * Math.PI * 2, rx = 7 + rnd() * 5, ry = 4.5 + rnd() * 3;
        const x = cx + Math.cos(a) * rx * 0.9, y = cy + Math.sin(a) * rx * 0.9;
        const hue = 88 + rnd() * 26, sat = 50 + rnd() * 22, lit = 26 + rnd() * 18;
        for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
          if (Math.abs(x + ox - w / 2) > w / 2 + 16 || Math.abs(y + oy - h / 2) > h / 2 + 16) continue;
          g.save(); g.translate(x + ox, y + oy); g.rotate(a);
          g.fillStyle = `hsl(${hue},${sat}%,${lit}%)`;
          g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = `hsla(${hue + 6},${sat + 10}%,${lit + 16}%,.55)`;
          g.beginPath(); g.ellipse(-rx * 0.2, -ry * 0.25, rx * 0.45, ry * 0.35, 0, 0, Math.PI * 2); g.fill();
          g.restore();
        }
      }
    }
  };
}
function duckweedSet(n) {
  const S = 1024, col = document.createElement('canvas'), hc = document.createElement('canvas');
  col.width = hc.width = col.height = hc.height = S;
  const g = col.getContext('2d'), hg = hc.getContext('2d');
  hg.fillStyle = '#000'; hg.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) {
    const cx = rnd() * S, cy = rnd() * S, k = 1 + Math.floor(rnd() * 3.4);
    for (let j = 0; j < k; j++) {
      const a = rnd() * Math.PI * 2, rx = 13 + rnd() * 9, ry = 8.5 + rnd() * 5.5;
      const x = cx + Math.cos(a) * rx * 0.9, y = cy + Math.sin(a) * rx * 0.9;
      const hue = 86 + rnd() * 28, sat = 48 + rnd() * 24, lit = 24 + rnd() * 18;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        if (Math.abs(x + ox - S / 2) > S / 2 + 30 || Math.abs(y + oy - S / 2) > S / 2 + 30) continue;
        for (const [ctx, isH] of [[g, 0], [hg, 1]]) {
          ctx.save(); ctx.translate(x + ox, y + oy); ctx.rotate(a);
          if (isH) {
            const gr = ctx.createRadialGradient(-rx * 0.15, 0, 1, 0, 0, rx);
            gr.addColorStop(0, '#fff'); gr.addColorStop(0.75, '#999'); gr.addColorStop(1, '#333');
            ctx.fillStyle = gr; ctx.scale(1, ry / rx); ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
          } else {
            ctx.fillStyle = `hsl(${hue},${sat}%,${lit}%)`;
            ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `hsla(${hue - 10},${sat}%,${lit - 10}%,.6)`; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.fillStyle = `hsla(${hue + 8},${sat + 10}%,${lit + 18}%,.45)`;
            ctx.beginPath(); ctx.ellipse(-rx * 0.2, -ry * 0.2, rx * 0.5, ry * 0.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `hsla(${hue - 20},40%,${lit - 8}%,.5)`;               // node / budding pocket
            ctx.beginPath(); ctx.arc(rx * 0.55, 0, 1.6, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
      }
    }
  }
  const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return { map, normal: normalFromHeight(hc, 3) };
}
const dwDense = duckweedSet(5600), dwSparse = duckweedSet(2400);
const texDense = dwDense.map, texSparse = dwSparse.map;
// generic surface detail
const noiseH = (S, amp, blobs) => heightCanvas(S, S, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < blobs; i++) { const v = 128 + (rnd() - 0.5) * amp; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 2.5, 0, 7); g.fill(); }
});
const nOrangePeel = normalFromHeight(noiseH(256, 120, 9000), 1.2);
const brushedRough = linTex(heightCanvas(512, 64, (g, w, h) => {
  g.fillStyle = '#5a5a5a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { const v = 60 + rnd() * 90; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.fillRect(rnd() * w, rnd() * h, 40 + rnd() * 200, 1); }
}));
const ripple = normalFromHeight(heightCanvas(256, 256, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.filter = 'blur(4px)';
  for (let i = 0; i < 260; i++) { const v = 128 + (rnd() - 0.5) * 140; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 6 + rnd() * 16, 3 + rnd() * 8, rnd() * 3, 0, 7); g.fill(); }
}), 1.5);
ripple.repeat.set(30, 3);
const treadN = normalFromHeight(heightCanvas(256, 64, (g, w, h) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000';
  for (const y of [12, 26, 38, 52]) g.fillRect(0, y, w, 3);
  for (let x = 0; x < w; x += 8) { g.fillRect(x, 0, 2, 12); g.fillRect(x + 4, 52, 2, 12); }
}), 4);
treadN.repeat.set(10, 1);
const texBelt = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#7c8996'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#26303a';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g.fillRect(x * 16 + (y % 2) * 8 + 2, y * 16 + 4, 10, 7);
  g.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 0; y < 8; y++) g.fillRect(0, y * 16, w, 2);
});
const texFloor = canvasTex(64, 256, (g, w, h) => {
  g.fillStyle = '#9ba3aa'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) { g.fillStyle = '#4d555c'; g.fillRect(0, y, w, 9); g.fillStyle = '#c4cbd1'; g.fillRect(0, y + 9, w, 3); }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.06})`; g.fillRect(rnd() * w, rnd() * h, rnd() * 30, 1); }
});
const texGround = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#8d8a84'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const v = 110 + rnd() * 60; g.fillStyle = `rgba(${v},${v - 3},${v - 8},.08)`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 20 + rnd() * 120, 0, 7); g.fill(); }
  for (let i = 0; i < 40000; i++) { const v = 90 + rnd() * 90; g.fillStyle = `rgba(${v},${v},${v - 4},.25)`; g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(30,26,22,.10)'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 60, 18 + rnd() * 40, rnd() * 3, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(40,38,36,.85)'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
  g.strokeStyle = 'rgba(50,48,45,.5)'; g.lineWidth = 1;
  for (let k = 0; k < 3; k++) { g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let i = 0; i < 14; i++) { x += (rnd() - 0.5) * 50; y += (rnd() - 0.3) * 40; g.lineTo(x, y); } g.stroke(); }
});
const nGround = normalFromHeight(noiseH(512, 160, 30000), 1.5);
const texGrate = canvasTex(128, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = '#d7dadd';
  for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 5, h);
  for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 3);
});
const texWedge = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#3d4246'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9ced2';
  for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 3);
});
const texGrille = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#1b1e21'; g.fillRect(0, 0, w, h); g.fillStyle = '#3c4247';
  for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 4);
});

/* ---------- materials ---------- */
const R = {};
function M(name, p, o = {}) {
  const m = new THREE.MeshStandardMaterial(p); m.name = name; m.userData = o; m.envMapIntensity = o.env ?? 0.85; R[name] = m; return m;
}
M('hdpe', { color: '#e3e6e2', roughness: 0.48, normalMap: nOrangePeel, normalScale: new THREE.Vector2(0.12, 0.12) });
M('ss', { color: '#c9cdd1', metalness: 1, roughness: 1, roughnessMap: brushedRough });
R.ss.userData.roughBase = 0.38;
M('frame', { color: '#41474d', metalness: 0.35, roughness: 0.5, normalMap: nOrangePeel, normalScale: new THREE.Vector2(0.25, 0.25) });
M('grid', { color: '#b8bec3', metalness: 0.95, roughness: 0.32 });
M('belt', { color: '#ffffff', map: texBelt, roughness: 0.55, side: THREE.DoubleSide });
M('beltS', { color: '#55616d', roughness: 0.55 });
M('cleat', { color: '#27313a', roughness: 0.6 });
R.water = new THREE.MeshPhysicalMaterial({ color: '#1e4a42', roughness: 0.03, ior: 1.33, specularIntensity: 1, normalMap: ripple, normalScale: new THREE.Vector2(0.25, 0.25), transparent: true, opacity: 0.62, depthWrite: false }); R.water.userData = { cast: false }; R.water.envMapIntensity = 1.4;
R.dwR = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: texDense, normalMap: dwDense.normal, normalScale: new THREE.Vector2(0.9, 0.9), emissive: '#3c8a1c', emissiveMap: texDense, emissiveIntensity: 0.35, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.25, sheen: 0.4, sheenColor: new THREE.Color('#b8ff7a'), transparent: true, depthWrite: false, alphaTest: 0.02 }); R.dwR.userData = { cast: false };
R.dwH = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: texSparse, normalMap: dwSparse.normal, normalScale: new THREE.Vector2(0.9, 0.9), emissive: '#3c8a1c', emissiveMap: texSparse, emissiveIntensity: 0.35, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.25, sheen: 0.4, sheenColor: new THREE.Color('#b8ff7a'), transparent: true, depthWrite: false, alphaTest: 0.02 }); R.dwH.userData = { cast: false };
M('ledH', { color: '#1c1f23', metalness: 0.6, roughness: 0.4 });
M('ledL', { color: '#ffffff', emissive: '#ffd8ee', emissiveIntensity: 6, roughness: 0.3 }, { cast: false });
M('nozzle', { color: '#2f6fb0', roughness: 0.5 }, { cast: false });
R.poly = new THREE.MeshPhysicalMaterial({ color: '#d8ebf5', roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }); R.poly.userData = { cast: false }; R.poly.envMapIntensity = 1.5;
M('biomass', { color: '#4f8f2a', roughness: 0.55, emissive: '#1d3d0c', emissiveIntensity: 0.4 });
M('cake', { color: '#355a1d', roughness: 0.9 });
M('tankPoly', { color: '#e8eef0', roughness: 0.4, transparent: true, opacity: 0.5, depthWrite: false }, { cast: false });
M('tankWater', { color: '#4b8088', roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false }, { cast: false });
M('pump', { color: '#2a5ea8', metalness: 0.3, roughness: 0.4 });
M('filter', { color: '#e9ecee', roughness: 0.45 });
M('motor', { color: '#5b636b', metalness: 0.5, roughness: 0.45 });
M('yellow', { color: '#e0b21a', roughness: 0.5 });
M('pvc', { color: '#6b737b', roughness: 0.5 });
M('tire', { color: '#1a1b1c', roughness: 0.88, normalMap: treadN, normalScale: new THREE.Vector2(1, 1) });
M('rim', { color: '#b9bec4', metalness: 1, roughness: 0.28 });
M('chassis', { color: '#25292d', metalness: 0.4, roughness: 0.6 });
M('white', { color: '#edefef', roughness: 0.42, normalMap: nOrangePeel, normalScale: new THREE.Vector2(0.08, 0.08) });
M('foam', { color: '#e3cf7f', roughness: 0.95 });
M('alu', { color: '#b5bcc3', metalness: 0.9, roughness: 0.35 });
M('aluNS', { color: '#b5bcc3', metalness: 0.9, roughness: 0.35 }, { cast: false });
M('floor', { color: '#ffffff', map: texFloor, metalness: 0.6, roughness: 0.45 }, { cast: false });
M('roof', { color: '#dfe9f2', roughness: 0.2, transparent: true, opacity: 0.05, depthWrite: false }, { cast: false, env: 0.25 });
M('reefer', { color: '#30353a', metalness: 0.3, roughness: 0.5 });
M('grille', { color: '#ffffff', map: texGrille, roughness: 0.7 });
M('grate', { color: '#ffffff', map: texGrate, metalness: 0.8, roughness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide });
M('wedge', { color: '#ffffff', map: texWedge, metalness: 0.85, roughness: 0.35 });
M('panel', { color: '#c9cdd0', roughness: 0.45, metalness: 0.2 });
M('lampG', { color: '#0f2', emissive: '#22ff66', emissiveIntensity: 4 }, { cast: false });
M('lampA', { color: '#fa0', emissive: '#ffaa22', emissiveIntensity: 4 }, { cast: false });
M('red', { color: '#c4161c', roughness: 0.4, emissive: '#400', emissiveIntensity: 1 });
M('tote', { color: '#d5dada', roughness: 0.6 });
M('pallet', { color: '#8a6a45', roughness: 0.9 });
M('fabric', { color: '#d4dbe2', roughness: 0.95, side: THREE.DoubleSide });
M('ground', { color: '#ffffff', map: texGround, normalMap: nGround, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.92 }, { cast: false });
M('tail', { color: '#f22', emissive: '#ff1a1a', emissiveIntensity: 2.5 }, { cast: false });
M('particle', { color: '#5aa632', roughness: 0.5, emissive: '#245010', emissiveIntensity: 0.5 }, { cast: false });
M('supply', { color: '#3b78c2', roughness: 0.45 });
M('wire', { color: '#e8742a', roughness: 0.5 });
M('wireLed', { color: '#e0507f', roughness: 0.5 });
M('trayG', { color: '#9aa1a8', metalness: 0.8, roughness: 0.4 });
M('feed', { color: '#7a55c9', roughness: 0.45 });
M('bronze', { color: '#9b7a3c', metalness: 0.8, roughness: 0.4 });
M('probe', { color: '#20262c', roughness: 0.4 });
M('wireDc', { color: '#9cc23a', roughness: 0.5 });
M('tapeR', { color: '#c8141c', roughness: 0.25, metalness: 0.1 });
M('tapeW', { color: '#f2f2ee', roughness: 0.2, metalness: 0.15 });
M('amber', { color: '#ffa31a', emissive: '#ff8a00', emissiveIntensity: 1.5 }, { cast: false });
M('debris', { color: '#5a4a2c', roughness: 0.95 });
const setRepeat = (name, w, h, tile) => { R[name].map.repeat.set(w / tile, h / tile); };

/* ---------- geometry batching (everything becomes InstancedMesh) ---------- */
const plane = new THREE.PlaneGeometry(1, 1); plane.rotateX(-Math.PI / 2);
const halfCyl = new THREE.CylinderGeometry(1, 1, 1, 28, 1, true, 0, Math.PI);
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
  cylHi: new THREE.CylinderGeometry(1, 1, 1, 44),
  cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
  sph: new THREE.SphereGeometry(1, 20, 12),
  plane, halfCyl,
};
const groups = {};
const G = name => {
  if (!groups[name]) { groups[name] = new THREE.Group(); scene.add(groups[name]); }
  return groups[name];
};
const batches = new Map();
function push(g, mt, geo, m) {
  const k = g + '|' + mt + '|' + geo;
  let b = batches.get(k);
  if (!b) batches.set(k, b = { g, mt, geo, list: [] });
  b.list.push(m);
}
const Q0 = new THREE.Quaternion(), Y = V(0, 1, 0);
function box(g, mt, x0, x1, y0, y1, z0, z1) {
  const ax = Math.min(x0, x1), bx = Math.max(x0, x1), ay = Math.min(y0, y1), by = Math.max(y0, y1), az = Math.min(z0, z1), bz = Math.max(z0, z1);
  push(g, mt, 'box', new THREE.Matrix4().compose(V((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), Q0, V(bx - ax || 0.01, by - ay || 0.01, bz - az || 0.01)));
}
function quad(g, mt, x0, x1, y, z0, z1) {
  push(g, mt, 'plane', new THREE.Matrix4().compose(V((x0 + x1) / 2, y, (z0 + z1) / 2), Q0, V(Math.abs(x1 - x0), 1, Math.abs(z1 - z0))));
}
function cyl(g, mt, a, b, r, geo = 'cyl') {
  const A = V(...a), B = V(...b), d = B.clone().sub(A), len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(Y, d.normalize());
  push(g, mt, geo, new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, V(r, len, r)));
}
function sph(g, mt, c, s) { push(g, mt, 'sph', new THREE.Matrix4().compose(V(...c), Q0, V(...s))); }
// sloped plate in the X–Y plane: from (x0,y0) to (x1,y1), centered at z = zc, width along Z, thickness normal to slope
function plate(g, mt, x0, y0, x1, y1, zc, width, thick) {
  const len = Math.hypot(x1 - x0, y1 - y0), q = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.atan2(y1 - y0, x1 - x0));
  push(g, mt, 'box', new THREE.Matrix4().compose(V((x0 + x1) / 2, (y0 + y1) / 2, zc), q, V(len, thick, width)));
}
function pipeRun(g, mt, pts, r) {
  for (let i = 0; i < pts.length - 1; i++) cyl(g, mt, pts[i], pts[i + 1], r);
  for (let i = 1; i < pts.length - 1; i++) sph(g, mt, pts[i], [r * 1.25, r * 1.25, r * 1.25]);
}

