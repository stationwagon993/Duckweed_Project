/* ---------- container-specific materials ---------- */
const texWood = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#8a6a48'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(40,26,14,.55)'; g.fillRect(x, 0, 2, h); }
  for (let i = 0; i < 900; i++) { const v = 90 + rnd() * 70; g.fillStyle = `rgba(${v},${v * 0.75},${v * 0.5},.18)`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 10 + rnd() * 60); }
});
M('wood', { color: '#ffffff', map: texWood, roughness: 0.8 }, { cast: false });
M('paint', { color: '#2f5e4e', roughness: 0.55, metalness: 0.35, normalMap: nOrangePeel, normalScale: new THREE.Vector2(0.15, 0.15) });
M('paintIn', { color: '#dfe3e0', roughness: 0.6, metalness: 0.1, normalMap: nOrangePeel, normalScale: new THREE.Vector2(0.1, 0.1) });
M('casting', { color: '#3a3f42', roughness: 0.7, metalness: 0.5 });
M('concrete', { color: '#a7a49d', roughness: 0.95, normalMap: nGround, normalScale: new THREE.Vector2(0.5, 0.5) });
M('hpUnit', { color: '#eceeee', roughness: 0.45, metalness: 0.2 });
M('lineset', { color: '#2b2b2b', roughness: 0.7 });
M('ledStrip', { color: '#e8e8e8', roughness: 0.4 });

/* ---------- RACK + RUNS ---------- */
for (let c = 0; c < 2; c++) {
  // posts at every frame, wall side and aisle side
  for (const x of FRAMES) for (const d of [-1.5, 36]) {
    box('rack', 'frame', fx(x), fx(x) + 1.5, 0.4, TB(TIERS) - 0.25, Z(c, d), Z(c, d + 1.5));
    box('rack', 'frame', fx(x) - 1, fx(x) + 2.5, 0, 0.4, Z(c, d - 0.5), Z(c, d + 2));
  }
  for (const x of FRAMES) box('rack', 'frame', fx(x), fx(x) + 1.5, TB(TIERS) - 1.75, TB(TIERS) - 0.25, Z(c, -1.5), Z(c, 37.5));
  for (const d of [-1.5, 36]) box('rack', 'frame', 0, RUN_L, TB(TIERS) - 1.75, TB(TIERS) - 0.25, Z(c, d), Z(c, d + 1.5));
  // X-bracing on the wall side
  for (const k of BRACED) {
    const x0 = k * BAY + 1.5, x1 = (k + 1) * BAY - 1.5, zz = Z(c, -0.75);
    cyl('rack', 'frame', [x0, 3, zz], [x1, TB(TIERS) - 3, zz], 0.3, 'cyl8');
    cyl('rack', 'frame', [x0, TB(TIERS) - 3, zz], [x1, 3, zz], 0.3, 'cyl8');
  }
  for (let t = 0; t < TIERS; t++) {
    const tb = TB(t), g = 't' + t, gl = 'l' + t, z = d => Z(c, d);
    for (const x of FRAMES) box(g, 'frame', fx(x), fx(x) + 1.5, tb - 1.75, tb - 0.25, z(-1.5), z(37.5));
    box(g, 'frame', 0, RUN_L, tb - 1.75, tb - 0.25, z(0), z(1.5));
    box(g, 'frame', 0, RUN_L, tb - 1.75, tb - 0.25, z(34.5), z(36));
    // tray: floor, 5" walls, end walls, stainless caps
    box(g, 'hdpe', 0, RUN_L, tb - 0.25, tb, z(0), z(36));
    box(g, 'hdpe', 0, RUN_L, tb, tb + WALL, z(0), z(0.25));
    box(g, 'hdpe', 0, RUN_L, tb, tb + WALL, z(35.75), z(36));
    box(g, 'hdpe', 0, 0.25, tb, tb + WALL, z(0.25), z(35.75));
    box(g, 'hdpe', RUN_L - 0.25, RUN_L, tb, tb + WALL, z(0.25), z(35.75));
    box(g, 'ss', 0, RUN_L, tb + WALL, tb + WALL + 0.15, z(-0.1), z(0.4));
    box(g, 'ss', 0, RUN_L, tb + WALL, tb + WALL + 0.15, z(35.6), z(36.1));
    // submerged stainless grid: ribs at each frame, longitudinal bars, cross rods
    for (const x of FRAMES.slice(1, -1)) box(g, 'grid', x - 0.4, x + 0.4, tb, tb + 1.5, z(0.25), z(35.75));
    for (const d of [3, 6, 9, 15, 19, 23, 27, 31, 34]) box(g, 'grid', 0.5, CONV_END - 2, tb + 1.2, tb + 1.5, z(d - 0.15), z(d + 0.15));
    for (let x = 12; x < CONV_END - 2; x += 12) if (FRAMES.every(f => Math.abs(f - x) > 3)) cyl(g, 'grid', [x, tb + 1.0, z(0.3)], [x, tb + 1.0, z(35.7)], 0.15, 'cyl8');
    // water + duckweed mats (repop 1/3 at wall side, harvest 2/3 at aisle side)
    quad(g, 'water', 0.25, RUN_L - 0.25, tb + WATER, z(0.25), z(35.75));
    quad(g, 'dwR', 0.25, RUN_L - 0.25, tb + WATER + 0.06, z(0.25), z(11.9));
    quad(g, 'dwH', 0.25, CONV_END, tb + WATER + 0.06, z(12.1), z(35.75));
    // harvest conveyor under the 2/3 section: belt, tail pulley, cleated incline, head pulley, discharge flap, drive
    quad(g, 'belt', 6, CONV_END, tb + 1.75, z(13), z(35));
    cyl(g, 'ss', [4.5, tb + 0.95, z(13)], [4.5, tb + 0.95, z(35)], 0.8);
    plate(g, 'beltS', CONV_END, tb + 1.62, HEAD_X, tb + 6.88, z(24), 22, 0.25);
    for (const d of [12.6, 35.4]) plate(g, 'ss', CONV_END - 4, tb + 2.6, HEAD_X + 0.4, tb + 8.6, z(d), 0.14, 3.2);
    {
      const ang = Math.atan2(5.26, HEAD_X - CONV_END), ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
      for (let s = 2; s < HEAD_X - CONV_END - 0.5; s += 3.2) {
        const cx = CONV_END + ux * s + nx * 0.55, cy = tb + 1.62 + uy * s + ny * 0.55;
        plate(g, 'cleat', cx - ux * 0.12, cy - uy * 0.12, cx + ux * 0.12, cy + uy * 0.12, z(24), 21.6, 0.85);
      }
    }
    cyl(g, 'ss', [HEAD_X, tb + 6.05, z(12.8)], [HEAD_X, tb + 6.05, z(35.2)], 0.9);
    box(g, 'ss', HEAD_X - 1.4, HEAD_X + 1.2, tb + 4.6, tb + 7.2, z(12.3), z(12.7));
    box(g, 'ss', HEAD_X - 1.4, HEAD_X + 1.2, tb + 4.6, tb + 7.2, z(35.3), z(35.7));
    cyl(g, 'ss', [HEAD_X + 1.2, tb + 6.9, z(13)], [HEAD_X + 1.2, tb + 6.9, z(35)], 0.3, 'cyl8');
    plate(g, 'ss', HEAD_X + 1.2, tb + 6.85, HEAD_X + 7.4, tb + 4.1, z(24), 22, 0.14);            // lowered discharge flap
    cyl(g, 'ss', [HEAD_X, tb + 6.05, z(35)], [HEAD_X, tb + 6.05, z(37.8)], 0.35, 'cyl8');
    box(g, 'motor', HEAD_X - 1.6, HEAD_X + 1.6, tb + 4.4, tb + 7.7, z(37.8), z(39.4));
    cyl(g, 'motor', [HEAD_X, tb + 6.05, z(39.4)], [HEAD_X, tb + 6.05, z(42.6)], 1.45);
    // longitudinal screen rail at the 1/3 line (carries the repop. screen and actuators)
    box(g, 'ss', 0.5, RUN_L, tb + 5.5, tb + 7.5, z(11), z(13));
    // guide channels at each frame, one actuator per section, 24 VDC harness
    for (const x of FRAMES) { const gx = Math.min(Math.max(x, 0.8), RUN_L - 0.8); box(g, 'ss', gx - 0.6, gx + 0.6, tb + 0.25, tb + 7.5, z(13.05), z(14.0)); }
    for (let k = 0; k < NB; k++) {
      const ax = k * BAY + BAY / 2;
      box(g, 'ss', ax - 1.2, ax + 1.2, tb + 7.5, tb + 7.75, z(11), z(14.6));
      cyl(g, 'motor', [ax, tb + 7.75, z(14.0)], [ax, tb + 8.9, z(14.0)], 0.5, 'cyl8');
    }
    cyl(g, 'wire', [3, tb + 7.62, z(11.4)], [RUN_L - 6, tb + 7.62, z(11.4)], 0.12, 'cyl8');
    for (const x of FRAMES) box(g, 'ss', fx(x) + 0.25, fx(x) + 1.25, tb + 5.15, tb + 5.5, z(0), z(13));
    // LED fixtures: 3 bars per bay, lens 9" above the run floor
    for (let k = 0; k < NB; k++) {
      const x0 = k * BAY + 2, x1 = (k + 1) * BAY - 2;
      for (const d of [6, 19, 30]) {
        box(gl, 'ledH', x0, x1, tb + LED + 0.25, tb + 10, z(d - 1.4), z(d + 1.4));
        box(gl, 'ledL', x0 + 0.6, x1 - 0.6, tb + LED, tb + LED + 0.25, z(d - 1.05), z(d + 1.05));
      }
    }
    for (const d of [6, 19, 30]) box(gl, 'frame', 0.5, RUN_L - 0.5, tb + 10, tb + 10.6, z(d - 0.5), z(d + 0.5));
    box(gl, 'ledH', 1, 6, tb + 10, tb + 10.6, z(4), z(32));   // driver box at the front end
  }
}
setRepeat('dwR', RUN_L - 0.5, 11.65, 10);
setRepeat('dwH', CONV_END - 0.25, 23.65, 10);
dwDense.normal.repeat.copy(R.dwR.map.repeat); dwSparse.normal.repeat.copy(R.dwH.map.repeat);
R.belt.map.repeat.set((CONV_END - 6) / 2, 22 / 2);

/* ---------- moving repopulation screen (dynamic) ---------- */
const texMesh = canvasTex(64, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = '#e6eaee';
  for (let i = 0; i < w; i += 8) { g.fillRect(i, 0, 3, h); g.fillRect(0, i, w, 3); }
});
texMesh.repeat.set(PANEL / 0.5, 3 / 0.5);
M('mesh', { color: '#ffffff', map: texMesh, metalness: 0.85, roughness: 0.35, alphaTest: 0.4, side: THREE.DoubleSide }, { cast: false });
const SCR_H = 3, SCR_DOWN = 1.6, SCR_UP = 4.0;      // panel 3" tall; bottom 1.4" below water when down, 1" above when up
const vplane = new THREE.PlaneGeometry(1, 1);
const NSCR = 2 * TIERS * NB;
const scrPanels = new THREE.InstancedMesh(vplane, R.mesh, NSCR);
const scrRails = new THREE.InstancedMesh(GEO.box, R.ss, 2 * NSCR);
const scrRods = new THREE.InstancedMesh(GEO.cyl8, R.ss, NSCR);
[scrPanels, scrRails, scrRods].forEach(m => { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = true; scene.add(m); });
let screenLift = 0, lastLift = -1;                   // 0 = down (holding), 1 = up (releasing)
function updateScreens() {
  if (Math.abs(screenLift - lastLift) < 1e-4 && lastTierN === tierN) return;
  lastLift = screenLift; lastTierN = tierN;
  const off = SCR_DOWN + (SCR_UP - SCR_DOWN) * screenLift, m = new THREE.Matrix4();
  let i = 0;
  for (let c = 0; c < 2; c++) for (let t = 0; t < TIERS; t++) for (let k = 0; k < NB; k++, i++) {
    const tb = TB(t), on = t < tierN, x = k * BAY + BAY / 2, zc = Z(c, 13.5), y0 = tb + off;
    m.compose(V(x, y0 + SCR_H / 2, zc), Q0, on ? V(PANEL, SCR_H, 1) : V(0, 0, 0)); scrPanels.setMatrixAt(i, m);
    m.compose(V(x, y0 + SCR_H, zc), Q0, on ? V(PANEL + 0.4, 0.45, 0.35) : V(0, 0, 0)); scrRails.setMatrixAt(2 * i, m);
    m.compose(V(x, y0, zc), Q0, on ? V(PANEL + 0.4, 0.3, 0.3) : V(0, 0, 0)); scrRails.setMatrixAt(2 * i + 1, m);
    const top = tb + 7.75, len = top - (y0 + SCR_H);
    m.compose(V(x, (top + y0 + SCR_H) / 2, Z(c, 14.0)), Q0, on ? V(0.18, len, 0.18) : V(0, 0, 0)); scrRods.setMatrixAt(i, m);
  }
  [scrPanels, scrRails, scrRods].forEach(mm => { mm.instanceMatrix.needsUpdate = true; });
}
let lastTierN = -1;

/* ---------- PROCESSING BAY (x = B → L, door end) ---------- */
const P = 'proc';
// collection chutes behind each run column (clear polycarbonate, stainless frame)
for (let c = 0; c < 2; c++) {
  const za = Math.min(Z(c, 13.25), Z(c, 34.75)), zb = Math.max(Z(c, 13.25), Z(c, 34.75)), y0 = 5, y1 = TB(TIERS) - 0.25;
  box(P, 'poly', B + 4, B + 4.15, y0, y1, za, zb); box(P, 'poly', B + 15.85, B + 16, y0, y1, za, zb);
  box(P, 'poly', B + 4, B + 16, y0, y1, za, za + 0.15); box(P, 'poly', B + 4, B + 16, y0, y1, zb - 0.15, zb);
  for (const [x, zz] of [[B + 4, za], [B + 15.25, za], [B + 4, zb - 0.75], [B + 15.25, zb - 0.75]]) box(P, 'ss', x, x + 0.75, y0, y1, zz, zz + 0.75);
  for (let t = 0; t <= TIERS; t++) {
    const y = TB(t) - 1;
    box(P, 'ss', B + 4, B + 16, y, y + 0.5, za - 0.1, za + 0.4); box(P, 'ss', B + 4, B + 16, y, y + 0.5, zb - 0.4, zb + 0.1);
    box(P, 'ss', B + 15.6, B + 16.1, y, y + 0.5, za, zb);
  }
}
// low-profile central receiving bin with grated step-over for aisle access
const BIN1 = B + 38;
box(P, 'ss', B + 2, BIN1, 0, 0.5, -36, 36);
box(P, 'ss', B + 2, B + 2.3, 0.5, 9, -36, 36); box(P, 'ss', BIN1 - 0.3, BIN1, 0.5, 9, -36, 36);
box(P, 'ss', B + 2, BIN1, 0.5, 9, -36, -35.7); box(P, 'ss', B + 2, BIN1, 0.5, 9, 35.7, 36);
box(P, 'ss', B + 2, BIN1, 0.5, 9, -11.6, -11.3); box(P, 'ss', B + 2, BIN1, 0.5, 9, 11.3, 11.6);
box(P, 'ss', B + 2.5, BIN1 - 0.5, 9, 9.3, -36.2, -35.5); box(P, 'ss', B + 2.5, BIN1 - 0.5, 9, 9.3, 35.5, 36.2);
quad(P, 'water', B + 2.3, BIN1 - 0.3, 5.5, -35.7, 35.7);
quad(P, 'grate', B + 2.3, BIN1 - 0.3, 9.6, -11.3, 11.3);
for (let x = B + 6; x < BIN1; x += 10) box(P, 'ss', x, x + 0.4, 8.2, 9.5, -11.3, 11.3);
box(P, 'yellow', B + 2, B + 3.4, 8.8, 9.9, -11.6, 11.6); box(P, 'yellow', BIN1 - 1.4, BIN1, 8.8, 9.9, -11.6, 11.6);
sph(P, 'biomass', [B + 11, 5.4, -24], [8, 2.6, 10]); sph(P, 'biomass', [B + 11, 5.4, 24], [8, 2.6, 10]);
sph(P, 'biomass', [B + 23, 5.2, 24], [6, 1.8, 7]);
// transfer auger: bin → dewatering screen
const AUG0 = [B + 28, 3, 24], AUG1 = [B + 50, 66, 24];
cyl(P, 'ss', AUG0, AUG1, 3.4);
{ const d = V(AUG1[0] - AUG0[0], AUG1[1] - AUG0[1], 0).normalize(); cyl(P, 'motor', AUG1, [AUG1[0] + d.x * 8, AUG1[1] + d.y * 8, 24], 2.7); }
box(P, 'ss', B + 47, B + 54, 59, 65, 21, 27);
cyl(P, 'frame', [B + 44.5, 56, 24], [B + 44.5, 0, 24], 0.8);
box(P, 'frame', B + 42.5, B + 46.5, 0, 0.4, 22, 26);
// vibratory dewatering screen on spring mounts
const SX0 = B + 50, SX1 = B + 80;
for (const [x, zz] of [[SX0, 9], [SX0, 41], [SX1, 9], [SX1, 41]]) box(P, 'frame', x - 1, x + 1, 0, 46, zz - 1, zz + 1);
box(P, 'frame', SX0 - 1, SX1 + 1, 44, 46, 8, 10); box(P, 'frame', SX0 - 1, SX1 + 1, 44, 46, 40, 42);
box(P, 'frame', SX0 - 1, SX0 + 1, 44, 46, 8, 42); box(P, 'frame', SX1 - 1, SX1 + 1, 44, 46, 8, 42);
for (const [x, zz] of [[SX0 + 3, 11], [SX0 + 3, 39], [SX1 - 3, 11], [SX1 - 3, 39]]) cyl(P, 'yellow', [x, 46, zz], [x, 49.5, zz], 1.2);
plate(P, 'wedge', SX0 + 3, 60, SX1, 50, 25, 30, 0.3);
plate(P, 'ss', SX0 + 2, 62, SX1 + 1, 52, 10, 0.25, 4.4); plate(P, 'ss', SX0 + 2, 62, SX1 + 1, 52, 40, 0.25, 4.4);
plate(P, 'ss', SX0, 51, SX1, 49.5, 25, 30.5, 0.35);
box(P, 'ss', SX0 - 1, SX0 + 7, 59, 67, 12, 38);
plate(P, 'biomass', SX0 + 7, 59.3, SX1 - 3, 51.4, 25, 26, 0.7);
cyl(P, 'motor', [SX0 + 16, 56, 40.3], [SX0 + 16, 56, 44.5], 2.2); cyl(P, 'motor', [SX0 + 16, 56, 9.7], [SX0 + 16, 56, 5.5], 2.2);
plate(P, 'ss', SX0 + 3, 47.5, SX1 - 4, 42, 25, 32, 0.25);
plate(P, 'ss', SX1, 50.4, SX1 + 6, 44.5, 25, 22, 0.2);                  // discharge lip to the press hopper
// screw press (axis across the bay) on a gantry over the tote
const PRX = B + 88;
box(P, 'ss', PRX - 5, PRX + 5, 38, 45, 18, 30);                            // feed hopper
cyl(P, 'ss', [PRX, 33, 32], [PRX, 33, 28], 4.8); cyl(P, 'wedge', [PRX, 33, 28], [PRX, 33, 12], 4.2); cyl(P, 'ss', [PRX, 33, 12], [PRX, 33, 8], 4.8);
box(P, 'motor', PRX - 5, PRX + 5, 28, 38, 33, 41); cyl(P, 'motor', [PRX, 33, 41], [PRX, 33, 44.5], 3.4);
box(P, 'ss', PRX - 4, PRX + 4, 24, 29, 4, 9);                             // cake discharge cone
for (const x of [B + 79, B + 97]) for (const zz of [1.5, 45]) box(P, 'frame', x - 1, x + 1, 0, 29, zz - 1, zz + 1);
for (const x of [B + 79, B + 97]) box(P, 'frame', x - 1, x + 1, 27.5, 29, 0.5, 46);
box(P, 'frame', B + 79, B + 97, 27.5, 28.5, 33, 41);
// dewatered press cake tote on pallet (exits through the doors)
box(P, 'pallet', B + 80, B + 96, 0, 4.5, 3.5, 43);
box(P, 'tote', B + 80, B + 96, 4.5, 23, 3.5, 4); box(P, 'tote', B + 80, B + 96, 4.5, 23, 42.5, 43);
box(P, 'tote', B + 80, B + 80.5, 4.5, 23, 3.5, 43); box(P, 'tote', B + 95.5, B + 96, 4.5, 23, 3.5, 43);
box(P, 'cake', B + 80.5, B + 95.5, 4.5, 17, 4, 42.5);
// filtrate / make-up return tank, pump, cartridge filter
const TK0 = B + 42, TK1 = B + 72;
box(P, 'tankPoly', TK0, TK1, 0, 44, -45.5, -22);
box(P, 'tankWater', TK0 + 0.6, TK1 - 0.6, 0.6, 30, -44.9, -22.6);
box(P, 'frame', TK0 - 0.5, TK1 + 0.5, 43.5, 44.5, -46, -21.5);
pipeRun(P, 'pvc', [[SX1 - 3, 42, 14], [SX1 - 3, 3, 14], [SX1 - 3, 3, -18], [TK1 - 2, 3, -18], [TK1 - 2, 3, -22]], 0.9);   // screen filtrate → tank
box(P, 'frame', B + 74, B + 93, 0, 1.5, -44, -32);
cyl(P, 'pump', [B + 76, 7.5, -38], [B + 82, 7.5, -38], 5); cyl(P, 'pump', [B + 82, 7.5, -38], [B + 91, 7.5, -38], 3.8);
pipeRun(P, 'pvc', [[TK1, 7.5, -38], [B + 76, 7.5, -38]], 1.1);
const FLX = B + 96;
pipeRun(P, 'pvc', [[B + 79, 12, -38], [B + 79, 22, -38], [FLX, 22, -38], [FLX, 26, -38]], 1.1);
cyl(P, 'filter', [FLX, 26, -38], [FLX, 46, -38], 3.6);
cyl(P, 'pump', [FLX, 46, -38], [FLX, 48.5, -38], 3.9);
// control panel on far wall
const PNX = B + 31;
box(P, 'panel', PNX - 13, PNX + 13, 70, 96, 39.5, 46);
box(P, 'frame', PNX - 0.1, PNX + 0.1, 70.5, 95.5, 39.4, 39.5);
cyl(P, 'lampG', [PNX - 8, 91, 39.5], [PNX - 8, 91, 38.9], 0.7, 'cyl8');
cyl(P, 'lampA', [PNX - 4.5, 91, 39.5], [PNX - 4.5, 91, 38.9], 0.7, 'cyl8');
cyl(P, 'red', [PNX + 8, 90, 39.5], [PNX + 8, 90, 38.4], 1.4);
box(P, 'probe', PNX + 2, PNX + 10, 76, 82, 39.3, 39.5);                    // HMI screen

/* ---------- CONTAINER BODY (40' high cube, near side wall cut away) ---------- */
const S = 'shell';
const XF = -2, XD = L + 4.5, ZO = HW + 1.75, YT = H + 2;            // outside faces: front, door end, side, roof top
quad(S, 'wood', 0, L, 0.01, -HW, HW);
R.wood.map.repeat.set(L / 96, 2 * HW / 48);
box(S, 'casting', XF, XD, -6, 0, -ZO, ZO);                          // floor structure + bottom side rails
// front end wall (corrugated), inside lining
box(S, 'paint', XF, 0, 0, H, -HW, HW);
for (let z = -HW + 6; z < HW - 6; z += 13) box(S, 'paint', XF - 1.4, XF, 2, H - 2, z, z + 6.5);
box(S, 'paintIn', 0, 0.2, 0, H, -HW, HW);
// far side wall: corrugated skin with trapezoidal ribs
box(S, 'paint', XF, XD, 0, H, HW, HW + 0.6);
for (let x = 4; x < L - 4; x += 11) box(S, 'paint', x, x + 6.5, 1, H - 1, HW + 0.6, ZO);
box(S, 'paintIn', 0, L, 0, H, HW - 0.2, HW);
// near side wall removed: bottom rail, top rail and cut strip remain
box(S, 'paint', XF, XD, -6, 1.5, -ZO, -HW);
box(S, 'paint', XF, XD, H - 3, YT, -ZO, -HW);
// roof rails (roof itself is a separate transparent layer)
box(S, 'paint', XF, XD, H, YT, HW, ZO);
// corner posts + ISO corner castings (all four corners)
for (const x of [XF - 0.5, XD - 5]) for (const s of [-1, 1]) {
  box(S, 'paint', x, x + 5.5, -6, YT, s * (HW - 0.2), s * (ZO + 0.3));
  for (const y of [-6.5, YT - 4.5]) box(S, 'casting', x - 0.5, x + 6.5, y, y + 4.5, s * (ZO - 6), s * (ZO + 0.5));
}
// door end: frame + both leaf doors swung open 90 degrees
box(S, 'paint', L, XD, H - 4, YT, -ZO, ZO);                          // header
box(S, 'paint', L, XD, -6, 0, -ZO, ZO);                              // sill
for (const s of [1]) {                                              // near-side leaf omitted with the cut-away wall
  box(S, 'paint', XD, XD + 46, 0.5, H - 4.5, s * (ZO - 1.8), s * ZO);
  for (let x = XD + 3; x < XD + 42; x += 10) box(S, 'paint', x, x + 5, 3, H - 7, s * ZO, s * (ZO + 0.8));
  for (const x of [XD + 9, XD + 31]) {                               // locking bars + cam keepers on the inner face
    cyl(S, 'ss', [x, -2, s * (ZO - 2.4)], [x, H - 1, s * (ZO - 2.4)], 0.55, 'cyl8');
    box(S, 'ss', x - 1.4, x + 1.4, 42, 50, s * (ZO - 3.4), s * (ZO - 1.8));
  }
}
// ventilation grilles near the roof line on the far wall
for (const x of [60, L - 70]) box(S, 'grille', x, x + 10, H - 12, H - 6, ZO, ZO + 0.4);
// container sits on four concrete blocks under the corner castings
for (const x of [XF - 4, XD - 10]) for (const s of [-1, 1]) box(S, 'concrete', x, x + 14, GROUND, -6.5, s * (ZO - 10), s * (ZO + 3));
// heat pump: outdoor unit on a pad at the front, line set through the front wall, ducted air handler + fabric chute inside
box(S, 'concrete', -44, -8, GROUND, GROUND + 4, -30, 18);
box(S, 'hpUnit', -40, -12, GROUND + 4, GROUND + 40, -26, 14);
box(S, 'grille', -40.2, -40, GROUND + 9, GROUND + 37, -24, 12);
for (const zc of [-15, 3]) cyl(S, 'chassis', [-40.1, GROUND + 23, zc], [-40.6, GROUND + 23, zc], 8.5, 'cylHi');
pipeRun(S, 'lineset', [[-12, GROUND + 30, 10], [-6, GROUND + 30, 10], [-6, 100, 10], [0, 100, 10]], 0.9);
box(S, 'hpUnit', 1, 28, 98.5, H - 0.5, -9, 9);                       // ducted indoor unit at the ceiling
push(S, 'fabric', 'halfCyl', new THREE.Matrix4().compose(V(28 + (B - 40) / 2, H - 0.4, 0), new THREE.Quaternion().setFromUnitVectors(Y, V(1, 0, 0)), V(5, B - 40, 5)));
// roof (transparent) + roof bows
box('roof', 'roof', XF, XD, H, YT, -ZO, ZO);
for (let x = 12; x < L; x += 24) box('roof', 'aluNS', x, x + 1.5, H - 1, H, -HW, HW);

/* ---------- ground ---------- */
let gridHelper;
{
  const gm = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000).rotateX(-Math.PI / 2), R.ground);
  R.ground.map.repeat.set(20000 / 240, 20000 / 240); nGround.repeat.set(20000 / 60, 20000 / 60);
  gm.position.set(L / 2, GROUND, 0); gm.receiveShadow = true; scene.add(gm);
  const grid = new THREE.GridHelper(4800, 400, 0x2c343b, 0x262c32); gridHelper = grid;
  grid.position.set(L / 2, GROUND + 0.05, 0); grid.material.transparent = true; grid.material.opacity = 0.3; scene.add(grid);
}

/* ---------- WATER LOOP: front-fed supply → runs → overflow at harvest end → debris screen → tank → pump/filter ---------- */
const W = 'plumb', RZ = 2.5, RX = 34, YM = 98;   // supply main runs down the aisle ceiling to risers at the front
const SUPPLY = [[TK1, 7.5, -38], [B + 79, 7.5, -38], [B + 79, 22, -38], [FLX, 22, -38], [FLX, 26, -38]];
box(W, 'panel', FLX + 1.2, FLX + 4, 50, 53.5, -39.5, -36.5);                       // EC / nitrate sensor
box(W, 'motor', FLX - 2.5, FLX + 2.5, 55, 59, -40.5, -35.5);                       // motorised 3-way divert valve
const DIS = [[FLX, 57, -38], [L - 2, 57, -38], [L - 2, 2, -38], [XD + 2, 2, -38]];
pipeRun(W, 'pvc', DIS, 1.0);
cyl(W, 'yellow', [XD - 1, 2, -38], [XD + 2, 2, -38], 1.6);                        // cam-lock discharge coupling at the door sill
pipeRun(W, 'supply', [[FLX, 48.5, -38], [FLX, YM, -38], [FLX, YM, RZ], [RX, YM, RZ], [RX, TB(0) + 6.5, RZ]], 1.1);
pipeRun(W, 'supply', [[RX, 84, RZ], [RX, 84, -RZ]], 1.0);
cyl(W, 'supply', [RX, TB(7) + 6.5, -RZ], [RX, TB(0) + 6.5, -RZ], 1.1);
for (let c = 0; c < 2; c++) {
  const zs = c ? RZ : -RZ;
  for (let t = 0; t < TIERS; t++) {
    const y = TB(t) + 6.5;
    // lateral over the aisle-side wall → drop at the front end → perforated inlet spreader across the run floor (passes under the screen)
    pipeRun(W, 'supply', [[RX, y, zs], [RX, y, Z(c, 35)], [2, y, Z(c, 35)], [2, TB(t) + 0.75, Z(c, 35)]], 0.6);
    cyl(W, 'supply', [2, TB(t) + 0.75, Z(c, 35)], [2, TB(t) + 0.75, Z(c, 1)], 0.4, 'cyl8');
    box(W, 'yellow', RX - 0.3, RX + 0.3, y + 0.8, y + 1.3, zs + (c ? 1 : -1), zs + (c ? 4 : -4));   // isolation valve
    // overflow weir in the repop zone at the harvest end → drain riser
    cyl(W, 'pvc', [RUN_L - 0.5, TB(t) + 3, Z(c, 6)], [B + 7.5, TB(t) + 3, Z(c, 6)], 0.8);
  }
  cyl(W, 'pvc', [B + 7.5, TB(7) + 4, Z(c, 6)], [B + 7.5, 3, Z(c, 6)], 1.3);
}
const DRN0 = [[B + 7.5, 3, Z(0, 6)], [B + 39.4, 3, Z(0, 6)], [B + 39.4, 54, Z(0, 6)], [TK0 + 2, 54, Z(0, 6)]];
const DRN1 = [[B + 7.5, 3, Z(1, 6)], [B + 40.6, 3, Z(1, 6)], [B + 40.6, 3, -24], [B + 40.6, 54, -24], [TK0 + 2, 54, -24]];
pipeRun(W, 'pvc', DRN0, 1.3);
pipeRun(W, 'pvc', DRN1, 1.3);
pipeRun(W, 'pvc', [[BIN1, 2.5, -30], [TK0 + 1, 2.5, -30]], 1);                    // receiving-bin drain
// organic debris screen on top of the return tank (inclined wedge-wire, debris tray)
box(W, 'ss', TK0, TK0 + 20, 44.5, 47, -45, -23);
box(W, 'ss', TK0, TK0 + 4, 50, 58, -45, -23);
plate(W, 'wedge', TK0 + 4, 55, TK0 + 19, 46, -34, 20, 0.3);
plate(W, 'ss', TK0 + 4, 57, TK0 + 19, 48, -44.5, 0.25, 4); plate(W, 'ss', TK0 + 4, 57, TK0 + 19, 48, -23.5, 0.25, 4);
for (const zz of [-44, -24]) box(W, 'ss', TK0 + 18, TK0 + 20, 44.5, 50, zz - 1, zz + 1);
box(W, 'ss', TK0 + 20, TK1 - 1, 44.5, 50, -44, -24);
box(W, 'debris', TK0 + 20.5, TK1 - 1.5, 45, 48, -43.5, -24.5);
plate(W, 'debris', TK0 + 6, 54.5, TK0 + 18, 47.6, -34, 16, 0.5);

// feed-water (waste-water nutrient stream) inlet → backflow preventer → Y-strainer → flow meter → solenoid → tank
const FDX = L - 4;
const FEED = [[XD + 2, 4, -28], [FDX, 4, -28], [FDX, 52, -28], [TK1 - 3, 52, -28], [TK1 - 3, 52, -22.9], [TK1 - 3, 38, -22.9]];
pipeRun(W, 'feed', FEED, 0.9);
cyl(W, 'yellow', [XD - 1, 4, -28], [XD + 2, 4, -28], 1.6);                         // cam-lock inlet at the door sill
box(W, 'bronze', FDX - 2, FDX + 2, 12, 22, -30.5, -25.5);                         // backflow preventer (double check)
cyl(W, 'bronze', [FDX, 17, -25.5], [FDX, 17, -24], 0.5, 'cyl8');
cyl(W, 'feed', [B + 92, 52, -28], [B + 88, 52, -28], 1.4);                        // Y-strainer body
cyl(W, 'feed', [B + 90, 52, -28], [B + 88, 49.5, -28], 0.9);
box(W, 'white', B + 82, B + 86, 50.5, 56.5, -29.5, -26.5);                        // paddlewheel flow meter + display
box(W, 'motor', B + 75.5, B + 79, 52, 56.5, -30, -26);                            // solenoid valve coil
for (const y of [36, 22, 10]) cyl(W, 'white', [TK1 - 0.5, y, -24], [TK1 - 0.5, y + 3, -24], 0.6, 'cyl8');   // float switches
for (let i = 0; i < 4; i++) cyl(W, 'probe', [TK1 - 4 - i * 3, 44, -44.5], [TK1 - 4 - i * 3, 24, -44.5], 0.35, 'cyl8');   // nitrate / EC / pH / DO probes
// pump-side hardware: check valve, gauges, suction strainer
cyl(W, 'pvc', [B + 79, 14, -38], [B + 79, 18, -38], 1.7);
for (const [x, y] of [[B + 79, 20], [FLX, 51]]) { cyl(W, 'ss', [x, y, -38], [x, y, -40.5], 0.25, 'cyl8'); cyl(W, 'white', [x, y, -40.5], [x, y, -41.3], 1.3); }
cyl(W, 'pvc', [TK1 + 1, 7.5, -38], [TK1 + 3.5, 7.5, -38], 1.6);
// supply-main clevis hangers every 4'
for (let x = RX + 24; x < FLX - 6; x += 48) { cyl(W, 'ss', [x, YM, RZ], [x, H, RZ], 0.2, 'cyl8'); cyl(W, 'ss', [x - 0.3, YM, RZ], [x + 0.3, YM, RZ], 1.45); }
for (let c = 0; c < 2; c++) for (let t = 0; t < TIERS; t++) cyl(W, 'pvc', [RUN_L - 0.6, TB(t) + 3, Z(c, 6)], [RUN_L + 0.6, TB(t) + 3, Z(c, 6)], 1.3);

/* ---------- ELECTRICAL: shore power → main disconnect → panel → cable trays → loads ---------- */
const E = 'elec', CY = 102.6, TRAY_END = B + 50, HOME = B + 20;
box(E, 'panel', XF - 6, XF, 30, 52, 30, 42);                                       // shore-power inlet + main disconnect (front end, exterior)
cyl(E, 'red', [XF - 6, 46, 36], [XF - 7.2, 46, 36], 1.6);
const conduit = (pts, mt = 'wire', r = 0.45) => pipeRun(E, mt, pts, r);
conduit([[XF, 40, 40], [2, 40, 40], [2, CY, 40], [2, CY, 44.2]], 'wire', 0.6);
for (const s2 of [-1, 1]) {
  box(E, 'trayG', 0, TRAY_END, CY - 0.45, CY - 0.3, s2 * 42.2, s2 * 46);           // wire-mesh cable tray, wall side
  for (let x = 0; x < TRAY_END; x += 12) box(E, 'trayG', x, x + 0.6, CY - 0.45, CY + 0.3, s2 * 42.2, s2 * 46);
  box(E, 'trayG', 0, TRAY_END, CY - 0.45, CY + 0.5, s2 * 45.8, s2 * 46);
  box(E, 'trayG', 0, TRAY_END, CY - 0.45, CY + 0.5, s2 * 42.2, s2 * 42.4);
}
const FEEDER = [[2, CY, 44.2], [PNX, CY, 44.2], [PNX, 96, 44.2]];
conduit(FEEDER, 'wire', 0.6);                                                       // main feeder to panel
conduit([[HOME, 96, 44.2], [HOME, CY, 44.2], [HOME, CY, -44.2]], 'wire', 0.55);   // panel → near-side tray
const zLED = c => (c ? 1 : -1) * 43.2, zDC = c => (c ? 1 : -1) * 44.9, zM = c => (c ? 1 : -1) * 4.75;
for (let c = 0; c < 2; c++) {
  const zw = Z(c, -0.75);
  conduit([[HOME, CY, zLED(c)], [3, CY, zLED(c)], [3, CY, zw], [3, TB(0) + 10.3, zw]], 'wireLed', 0.5);   // LED home run + drop
  conduit([[HOME, CY, zM(c)], [B + 3, CY, zM(c)], [B + 3, TB(0) + 6, zM(c)]], 'wire', 0.45);             // conveyor motor drop
  for (let t = 0; t < TIERS; t++) {
    conduit([[3, TB(t) + 10.3, zw], [3, TB(t) + 10.3, Z(c, 4)]], 'wireLed', 0.3);
    conduit([[B + 3, TB(t) + 6, zM(c)], [HEAD_X, TB(t) + 6, Z(c, 42.6)]], 'wire', 0.28);
  }
}
const PUMPC = [[HOME, CY, -44.2], [B + 86, CY, -44.2], [B + 86, 12, -44.2], [B + 86, 12, -42]];
conduit(PUMPC, 'wire', 0.45);                                                       // pump circuit
// 24 VDC screen-actuator circuits: tray → drop at the front → one branch per run onto the screen-rail harness → whip to each actuator
for (let c = 0; c < 2; c++) {
  const zw = Z(c, -0.75);
  conduit([[HOME, CY, zDC(c)], [5, CY, zDC(c)], [5, CY, zw], [5, TB(0) + 7.62, zw]], 'wireDc', 0.4);
  for (let t = 0; t < TIERS; t++) {
    const y = TB(t) + 7.62;
    conduit([[5, y, zw], [5, y, Z(c, 11.4)]], 'wireDc', 0.25);
    box(E, 'panel', 4, 7, y - 0.9, y + 0.9, zw - 0.6, zw + 0.6);                 // junction box per run
    for (let k = 0; k < NB; k++) cyl(E, 'wireDc', [k * BAY + BAY / 2, y, Z(c, 11.4)], [k * BAY + BAY / 2, TB(t) + 8.3, Z(c, 14)], 0.12, 'cyl8');
  }
}
const DC_SOL = [[HOME, CY, -31], [B + 77, CY, -31], [B + 77, 56.5, -31]];
const DC_PRB = [[HOME, CY, -40], [TK1 - 8, CY, -40], [TK1 - 8, 44, -40]];
const DC_VLV = [[HOME, CY, -36], [FLX - 2, CY, -36], [FLX - 2, 59, -36]];
conduit(DC_SOL, 'wireDc', 0.35);                                                    // feed solenoid + flow meter
conduit(DC_PRB, 'wireDc', 0.35);                                                    // sensor bus to probes
conduit(DC_VLV, 'wireDc', 0.35);                                                    // divert valve actuator + EC sensor
for (const [x, z] of [[2, -9], [B - 2, 9], [L - 3, 44.5]]) { box(E, 'yellow', x - 1.5, x + 1.5, 46, 52, z - 0.8, z + 0.8); cyl(E, 'red', [x, 50, z], [x, 50, z + (z < 0 ? 1.5 : -1.5)], 0.9); }   // e-stops
const AUGC = [[B + 46, CY, 44.2], [B + 46, CY, 24], [B + 46, 74, 24], [AUG1[0] + 3, 72, 24]];
const VIBC = [[PNX + 11, 70, 44.2], [SX0 + 16, 62, 44.2], [SX0 + 16, 58.2, 44.2]];
const PRSC = [[PNX + 5, 70, 44.2], [PNX + 5, 40, 44.2], [PRX, 40, 44.2], [PRX, 38, 41]];
conduit(AUGC, 'wire', 0.4);                                                         // auger motor
conduit(VIBC, 'wire', 0.4);                                                         // screen vibrators
conduit(PRSC, 'wire', 0.4);                                                         // screw press

/* ---------- build instanced meshes ---------- */
const ORDER = { water: 1, tankWater: 1, dwR: 2, dwH: 2, poly: 4, tankPoly: 4, roof: 5 };
for (const b of batches.values()) {
  const mt = R[b.mt], im = new THREE.InstancedMesh(GEO[b.geo], mt, b.list.length);
  b.list.forEach((m, i) => im.setMatrixAt(i, m));
  im.instanceMatrix.needsUpdate = true;
  im.computeBoundingSphere();
  im.castShadow = mt.userData.cast !== false;
  im.receiveShadow = true;
  im.renderOrder = ORDER[b.mt] || 0;
  G(b.g).add(im);
}

/* ---------- harvest flow particles ---------- */
const NP = 10, particles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6), R.particle, 2 * TIERS * NP);
particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
particles.frustumCulled = false;
scene.add(particles);
const pdata = [];
for (let c = 0; c < 2; c++) for (let t = 0; t < TIERS; t++) for (let i = 0; i < NP; i++)
  pdata.push({ c, t, ph: (i + rnd() * 0.6) / NP, d: 15 + rnd() * 18, s: 0.9 + rnd() * 0.6 });
const PERIOD = 11;
const _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _ps = V(1, 1, 1), _pp = V(0, 0, 0);
function particlePos(p, time) {
  const tb = TB(p.t), u = ((time / PERIOD + p.ph) % 1) * PERIOD;
  const lerp = (a, b, k) => a + (b - a) * k;
  if (u < 3.0) { const k = u / 3.0; return [lerp(CONV_END - 22, CONV_END, k), tb + WATER + 0.2]; }
  if (u < 7.0) { const k = (u - 3) / 4; return [lerp(CONV_END, HEAD_X - 0.2, k), lerp(tb + 2.2, tb + 7.6, k)]; }
  if (u < 7.8) { const k = (u - 7) / 0.8; return [lerp(HEAD_X + 1.4, HEAD_X + 7.4, k), lerp(tb + 7.3, tb + 4.6, k)]; }
  const f = u - 7.8, y = tb + 4.6 - 0.5 * 180 * f * f;
  if (y > 6.2) return [HEAD_X + 8.8 + f * 3, y];
  return null;
}
let tierN = TIERS;
function updateParticles(time) {
  pdata.forEach((p, i) => {
    const pos = p.t < tierN ? particlePos(p, time) : null;
    if (!pos) _ps.set(0, 0, 0); else _ps.set(0.9 * p.s, 0.35 * p.s, 0.9 * p.s);
    _pp.set(pos ? pos[0] : 0, pos ? pos[1] : -999, Z(p.c, p.d));
    particles.setMatrixAt(i, _pm.compose(_pp, _pq, _ps));
  });
  particles.instanceMatrix.needsUpdate = true;
}

/* ---------- flow overlays (drawn through geometry) ---------- */
const flows = [];
function flow(kind, pts, o = {}) {
  const P3 = pts.map(p => V(...p)), cum = [0];
  for (let i = 1; i < P3.length; i++) cum.push(cum[i - 1] + P3[i].distanceTo(P3[i - 1]));
  const len = cum[cum.length - 1];
  flows.push({ kind, P3, cum, len, tier: o.tier ?? -1, speed: o.speed ?? 14, n: Math.max(2, Math.round(len / (o.gap ?? 18))) });
}
const WC = { supply: '#4fc3ff', ret: '#8fe3d0', drain: '#d9a441', feed: '#a77df0', dc24: '#c4e45a', elec: '#ff9a3c', led: '#ff6fa0' };
// water
flow('supply', [[TK0 + 15, 14, -36], ...SUPPLY, [FLX, 48.5, -38], [FLX, YM, -38], [FLX, YM, RZ], [RX, YM, RZ], [RX, TB(0) + 6.5, RZ]], { speed: 24 });
flow('supply', [[RX, 84, RZ], [RX, 84, -RZ], [RX, TB(0) + 6.5, -RZ]], { speed: 24 });
flow('supply', [[RX, 84, -RZ], [RX, TB(7) + 6.5, -RZ]], { speed: 24 });
for (let c = 0; c < 2; c++) for (let t = 0; t < TIERS; t++) {
  const tb = TB(t), zs = c ? RZ : -RZ;
  flow('supply', [[RX, tb + 6.5, zs], [RX, tb + 6.5, Z(c, 35)], [2, tb + 6.5, Z(c, 35)], [2, tb + 0.75, Z(c, 35)], [2, tb + 0.75, Z(c, 1)]], { tier: t, speed: 24, gap: 8 });
  // water moves through the run itself (below the floating mat, under the screen), to the overflow weir
  flow('ret', [[4, tb + 2.2, Z(c, 6)], [RUN_L - 1, tb + 2.2, Z(c, 6)], [B + 7.5, tb + 3, Z(c, 6)], [B + 7.5, 3, Z(c, 6)]], { tier: t, speed: 9, gap: 40 });
  flow('ret', [[4, tb + 2.2, Z(c, 26)], [CONV_END - 7, tb + 2.2, Z(c, 26)], [CONV_END + 16, tb + 1.0, Z(c, 26)], [RUN_L - 6, tb + 1.0, Z(c, 6)], [RUN_L - 1, tb + 2.6, Z(c, 6)]], { tier: t, speed: 9, gap: 40 });
}
flow('ret', [...DRN0, [TK0 + 8, 54, -34], [TK0 + 10, 20, -34]], { speed: 16 });
flow('ret', [...DRN1, [TK0 + 8, 54, -34], [TK0 + 10, 20, -34]], { speed: 16 });
flow('feed', FEED, { speed: 14, gap: 8 });
for (let c = 0; c < 2; c++) {
  const zw = Z(c, -0.75);
  flow('dc24', [[HOME, CY, zDC(c)], [5, CY, zDC(c)], [5, CY, zw], [5, TB(0) + 7.62, zw]], { speed: 50, gap: 34 });
  for (let t = 0; t < TIERS; t++) flow('dc24', [[5, TB(t) + 7.62, zw], [5, TB(t) + 7.62, Z(c, 11.4)], [RUN_L - 6, TB(t) + 7.62, Z(c, 11.4)]], { tier: t, speed: 40, gap: 40 });
}
flow('dc24', DC_SOL, { speed: 30, gap: 14 });
flow('dc24', DC_PRB, { speed: 30, gap: 14 });
flow('dc24', DC_VLV, { speed: 30, gap: 14 });
flow('drain', DIS, { speed: 14, gap: 8 });
flow('ret', [[SX1 - 3, 42, 14], [SX1 - 3, 3, 14], [SX1 - 3, 3, -18], [TK1 - 2, 3, -18], [TK1 - 2, 3, -22], [TK1 - 6, 12, -30]], { speed: 12 });
// electrical
flow('elec', [[XF - 4, 40, 40], [2, 40, 40], [2, CY, 40], ...FEEDER], { speed: 60, gap: 30 });
flow('elec', [[HOME, 96, 44.2], [HOME, CY, 44.2], ...PUMPC], { speed: 40, gap: 24 });
flow('elec', AUGC, { speed: 30 });
flow('elec', VIBC, { speed: 20, gap: 10 });
flow('elec', PRSC, { speed: 20, gap: 12 });
for (let c = 0; c < 2; c++) {
  const zw = Z(c, -0.75);
  flow('led', [[HOME, CY, zLED(c)], [3, CY, zLED(c)], [3, CY, zw], [3, TB(0) + 10.3, zw]], { speed: 60, gap: 34 });
  flow('elec', [[HOME, CY, zM(c)], [B + 3, CY, zM(c)], [B + 3, TB(0) + 6, zM(c)]], { speed: 30 });
  for (let t = 0; t < TIERS; t++) flow('led', [[3, TB(t) + 10.3, zw], [3, TB(t) + 10.3, Z(c, 4)]], { tier: t, speed: 8, gap: 6 });
}
const overlay = { water: new THREE.Group(), elec: new THREE.Group() };
scene.add(overlay.water, overlay.elec);
const kindGroup = k => (k === 'elec' || k === 'led' || k === 'dc24') ? 'elec' : 'water';
const pMats = {}, pMeshes = {};
for (const k of Object.keys(WC)) {
  pMats[k] = new THREE.MeshBasicMaterial({ color: WC[k], depthTest: false, transparent: true, opacity: 0.95 });
  const lm = new THREE.LineBasicMaterial({ color: WC[k], depthTest: false, transparent: true, opacity: 0.55 });
  const list = flows.filter(f => f.kind === k);
  list.forEach(f => { const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(f.P3), lm); ln.renderOrder = 28; ln.userData.tier = f.tier; overlay[kindGroup(k)].add(ln); });
  const n = list.reduce((a, f) => a + f.n, 0);
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), pMats[k], Math.max(n, 1));
  im.renderOrder = 29; im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  overlay[kindGroup(k)].add(im); pMeshes[k] = { im, list };
}
const _fp = V(0, 0, 0), _fs = V(1, 1, 1);
function updateFlows(time) {
  for (const k in pMeshes) {
    const { im, list } = pMeshes[k]; let i = 0;
    if (!im.parent.visible) continue;
    const r = kindGroup(k) === 'elec' ? 0.6 : 0.75;
    for (const f of list) {
      const on = f.tier < 0 || f.tier < tierN;
      for (let j = 0; j < f.n; j++, i++) {
        let d = ((time * f.speed) + j * f.len / f.n) % f.len, s = 1;
        while (s < f.cum.length - 1 && f.cum[s] < d) s++;
        const a = f.P3[s - 1], b = f.P3[s], seg = f.cum[s] - f.cum[s - 1] || 1;
        _fp.lerpVectors(a, b, (d - f.cum[s - 1]) / seg);
        _fs.setScalar(on ? r : 0);
        im.setMatrixAt(i, _pm.compose(_fp, _pq, _fs));
      }
    }
    im.instanceMatrix.needsUpdate = true;
  }
  for (const g of [overlay.water, overlay.elec]) if (g.visible) g.children.forEach(o => { if (o.isLine) o.visible = o.userData.tier < 0 || o.userData.tier < tierN; });
}
