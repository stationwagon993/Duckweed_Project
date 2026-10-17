/* ---------- lighting ---------- */
scene.add(new THREE.HemisphereLight('#d5dee8', '#2a2724', 0.55));
const sun = new THREE.DirectionalLight('#fff3e6', 1.85);
sun.position.set(L / 2 - 470, 1100, -820); sun.target.position.set(L / 2, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -420, right: 420, top: 420, bottom: -420, near: 100, far: 2600 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.4;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight('#cfe0ff', 0.45); fill.position.set(L + 900, 400, 900); scene.add(fill);

/* ---------- photoreal: sky, area light under every LED plane ---------- */
const sky = new Sky(); sky.scale.setScalar(10000);
sky.material.uniforms.turbidity.value = 5; sky.material.uniforms.rayleigh.value = 1.2;
sky.material.uniforms.mieCoefficient.value = 0.004; sky.material.uniforms.mieDirectionalG.value = 0.8;
const sunDir = sun.position.clone().sub(sun.target.position).normalize();
sky.material.uniforms.sunPosition.value.copy(sunDir);
const skyScene = new THREE.Scene();
{
  const dome = new THREE.SphereGeometry(100, 48, 24), cols = [], pos = dome.attributes.position;
  const zen = new THREE.Color('#4f82c0'), hor = new THREE.Color('#d6e1ea'), gnd = new THREE.Color('#5d5a55'), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 100;
    if (y >= 0) tmp.copy(hor).lerp(zen, Math.pow(y, 0.6)); else tmp.copy(hor).lerp(gnd, Math.min(1, -y * 6));
    cols.push(tmp.r, tmp.g, tmp.b);
  }
  dome.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  skyScene.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2dc').multiplyScalar(40) }));
  sunDisc.position.copy(sunDir).multiplyScalar(90); skyScene.add(sunDisc);
}
const envSky = pmrem.fromScene(skyScene, 0.02).texture;
sky.visible = false; scene.add(sky);
RectAreaLightUniformsLib.init();
const ledLights = [];
for (let c = 0; c < 2; c++) for (let t = 0; t < TIERS; t++) {
  const l = new THREE.RectAreaLight('#ffe3f2', 0.55, RUN_L - 4, 30);
  l.position.set(RUN_L / 2, TB(t) + LED - 0.1, Z(c, 18)); l.rotation.x = -Math.PI / 2; l.userData.tier = t;
  scene.add(l); ledLights.push(l);
}
let photoreal = true;

/* ---------- annotations ---------- */
const annot = { overall: new THREE.Group(), width: new THREE.Group(), plan: new THREE.Group(), section: new THREE.Group(), callouts: new THREE.Group() };
Object.values(annot).forEach(g => scene.add(g));
const dimMat = new THREE.LineBasicMaterial({ color: '#ffc65c', depthTest: false, transparent: true, opacity: 0.95 });
const leadMat = new THREE.LineBasicMaterial({ color: '#7fd4c1', depthTest: false, transparent: true, opacity: 0.85 });
const labels = [];
function cssObj(cls, html, pos) {
  const el = document.createElement('div'); el.className = cls; el.innerHTML = html;
  const o = new CSS2DObject(el); o.position.copy(pos); return o;
}
function dim(set, a, b, off, text, o = {}) {
  const A = V(...a), B2_ = V(...b), O = V(...off), A2 = A.clone().add(O), B2 = B2_.clone().add(O);
  const on = O.clone().normalize(), tick = o.tick ?? 4;
  const pts = [A2, B2,
    A.clone().addScaledVector(on, 1.5), A2.clone().addScaledVector(on, 3),
    B2_.clone().addScaledVector(on, 1.5), B2.clone().addScaledVector(on, 3)];
  const td = B2.clone().sub(A2).normalize().add(on).normalize().multiplyScalar(tick);
  for (const p of [A2, B2]) pts.push(p.clone().sub(td), p.clone().add(td));
  const ls = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), dimMat);
  ls.renderOrder = 20; set.add(ls);
  if (text) set.add(cssObj('dim' + (o.sm ? ' sm' : ''), text, A2.clone().add(B2).multiplyScalar(0.5).add(V(...(o.lo || [0, 0, 0])))));
}
function callout(p, off, title, sub, o = {}) {
  const geo = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 0, 0)]);
  const line = new THREE.Line(geo, leadMat); line.renderOrder = 21;
  const dot = cssObj('dot', '', V());
  const lab = cssObj('co', title + (sub ? `<small>${sub}</small>` : ''), V());
  annot.callouts.add(line, dot, lab);
  const c = { p, off, line, dot, lab, views: (o.v || '').split(' '), rel: !!o.rel, anchor: V() };
  labels.push(c); placeCallout(c); return c;
}
function placeCallout(c) {
  const base = typeof c.p === 'function' ? c.p(TB(tierN - 1)) : c.p;
  const A = V(...base), Bp = A.clone().add(V(...c.off));
  c.anchor.copy(A);
  c.line.geometry.setFromPoints([A, Bp]); c.line.geometry.computeBoundingSphere();
  c.dot.position.copy(A); c.lab.position.copy(Bp);
}

// overall dimensions
const ov = annot.overall, TOPY = YT + 2;
dim(ov, [0, TOPY, -ZO], [L, TOPY, -ZO], [0, 34, 0], `${FTIN(L)} INTERIOR LENGTH`, { tick: 6 });
dim(ov, [0, TOPY, -ZO], [RUN_L, TOPY, -ZO], [0, 16, 0], `${FTIN(RUN_L)} CULTIVATION · 16 RUNS`, { tick: 6 });
dim(ov, [RUN_L, TOPY, -ZO], [L, TOPY, -ZO], [0, 16, 0], `${FTIN(L - RUN_L)} PROCESSING`, { tick: 6 });
dim(ov, [0, 0, -ZO], [BAY, 0, -ZO], [0, 0, -22], `${FTIN(BAY)} TYP · ${NB + 1} FRAMES`, { tick: 4 });
for (let k = 1; k < NB; k++) dim(ov, [k * BAY, 0, -ZO], [(k + 1) * BAY, 0, -ZO], [0, 0, -22], '', { tick: 4 });
dim(ov, [XD + 4, 0, -ZO], [XD + 4, H, -ZO], [0, 0, -26], `${FTIN(H)} INT. HT`, { tick: 5 });
dim(annot.width, [XD + 2, TOPY, -HW], [XD + 2, TOPY, HW], [0, 16, 0], `${FTIN(2 * HW)} INT. WIDTH`, { tick: 5 });

// plan dimensions
const pl = annot.plan;
dim(pl, [0, 0, -ZO], [L, 0, -ZO], [0, 0, -44], `${FTIN(L)} INTERIOR LENGTH`, { tick: 6 });
dim(pl, [0, 0, -ZO], [RUN_L, 0, -ZO], [0, 0, -22], `${FTIN(RUN_L)} CULTIVATION`, { tick: 6 });
dim(pl, [RUN_L, 0, -ZO], [L, 0, -ZO], [0, 0, -22], `${FTIN(L - RUN_L)} PROCESSING`, { tick: 6 });
dim(pl, [-60, 0, -HW], [-60, 0, HW], [-10, 0, 0], FTIN(2 * HW), { tick: 4 });
dim(pl, [0, 0, ZO], [BAY, 0, ZO], [0, 0, 16], `${FTIN(BAY)} TYP`, { tick: 4 });

// section A–A dimensions (cut through the middle of bay 3, looking toward the front)
const se = annot.section, sx = SECTION_X - 0.5, t7 = TB(7), t0 = TB(0);
dim(se, [sx, YT + 1, -HW], [sx, YT + 1, HW], [0, 22, 0], `${FTIN(2 * HW)} INTERIOR WIDTH`, { tick: 3 });
dim(se, [sx, 0, HW], [sx, H, HW], [0, 0, 22], `${FTIN(H)} INT. HEIGHT`, { tick: 3 });
dim(se, [sx, t7 + 9.6, Z(0, 0)], [sx, t7 + 9.6, Z(0, 12)], [0, 7, 0], `1'-0" REPOP ⅓`, { tick: 2, sm: 1, lo: [0, 6, 0] });
dim(se, [sx, t7 + 9.6, Z(0, 12)], [sx, t7 + 9.6, Z(0, 36)], [0, 7, 0], `2'-0" HARVEST ⅔`, { tick: 2, sm: 1 });
dim(se, [sx, t7 + 9.6, Z(1, 36)], [sx, t7 + 9.6, Z(1, 0)], [0, 7, 0], `3'-0" RUN`, { tick: 2, sm: 1 });
dim(se, [sx, t0, Z(0, 36)], [sx, t0, Z(1, 36)], [0, -16, 0], `${AISLE}" AISLE`, { tick: 2, sm: 1 });
dim(se, [sx, t0, Z(0, 0)], [sx, t0, Z(0, 36)], [0, -16, 0], `3'-0"`, { tick: 2, sm: 1 });
dim(se, [sx, TB(5), Z(1, -1.5)], [sx, TB(6), Z(1, -1.5)], [0, 0, 9], `11¾" PITCH`, { tick: 2, sm: 1 });
dim(se, [sx, TB(6), Z(1, -1.5)], [sx, TB(7), Z(1, -1.5)], [0, 0, 9], `11¾"`, { tick: 2, sm: 1 });
dim(se, [sx, TB(2), Z(1, -1.5)], [sx, TB(2) + WALL, Z(1, -1.5)], [0, 0, 9], `5" WALL`, { tick: 1.5, sm: 1, lo: [0, 0, 13] });
const t4 = TB(4), zr = Z(0, -1.5);
dim(se, [sx, t4, zr], [sx, t4 + WATER, zr], [0, 0, -6], `3" WATER`, { tick: 1.5, sm: 1, lo: [0, -0.6, -15] });
dim(se, [sx, t4 + WATER, zr], [sx, t4 + LED, zr], [0, 0, -6], `6" CLEAR`, { tick: 1.5, sm: 1, lo: [0, 0.6, -15] });
dim(se, [sx, t4, zr], [sx, t4 + LED, zr], [0, 0, -34], `9" FLOOR TO LED`, { tick: 1.5, sm: 1, lo: [0, 0, -18] });
se.add(cssObj('sect', `Section A–A · ${FTIN(SECTION_X)} from front wall · looking forward`, V(sx, -34, 0)));

// callouts — each one lists the camera views it belongs to
callout([-26, GROUND + 30, -6], [-40, 60, -60], 'Heat pump', 'outdoor unit · ducted indoor unit', { v: 'iso side front' });
callout([120, TB(7) + 9.1, Z(0, 19)], [-60, 70, -60], 'LED grow lights', '3 bars per bay · 9" above run floor', { v: 'iso side front' });
callout([BAY, 60, Z(0, -1.5)], [-50, -95, -70], 'Support frame', `posts + beams @ ${FTIN(BAY)} o.c.`, { v: 'iso front' });
callout([250, TB(0) + 3.1, Z(0, 30)], [0, -100, -80], 'Duckweed runs', `16 × ${FTIN(RUN_L)} × 3'-0" · 2 across × 8 tiers`, { v: 'iso side front' });
callout([B + 10, 70, Z(0, 24)], [-30, 80, -90], 'Collection chutes', 'clear PC · one per column', { v: 'iso side' });
callout([B + 10, 70, Z(0, 24)], [-10, 50, -40], 'Collection chutes', 'clear PC · one per column', { v: 'process' });
callout([B + 20, 9.6, 0], [10, -60, -90], 'Receiving bin', 'low-profile 9" H · grated step-over', { v: 'iso side' });
callout([B + 20, 9.6, 0], [6, -30, -40], 'Receiving bin', 'low-profile 9" H · grated step-over', { v: 'process' });
callout([B + 40, 37, 24], [-4, 60, -30], 'Transfer auger', 'bin → screen', { v: 'process' });
callout([SX0 + 16, 56, 25], [10, 70, -20], 'Dewatering screen', 'vibratory wedge-wire', { v: 'iso process' });
callout([PRX, 33, 20], [24, 26, -34], 'Screw press', 'final dewatering', { v: 'process' });
callout([B + 88, 15, 6], [34, -8, -34], 'Press-cake tote', 'out through the doors', { v: 'process' });
callout([TK0 + 15, 40, -34], [50, -64, 10], 'Return tank', '≈130 gal', { v: 'iso' });
callout([TK0 + 15, 40, -34], [20, -70, -50], 'Return tank', '≈130 gal', { v: 'process' });
callout([B + 84, 8, -38], [34, -26, -24], 'Pump + cartridge filter', null, { v: 'process' });
callout([B + 20, YM, RZ], [24, 34, -24], 'Supply main', 'runs forward to front risers', { v: 'process' });
callout([PNX, 83, 39.5], [20, 34, -26], 'Control panel', 'PLC · HMI · VFDs', { v: 'process' });
callout([150, H - 3, 0], [30, 60, -70], 'Fabric air chute', 'from ducted heat pump', { v: 'front' });
callout([200, 50, -ZO], [-10, -100, -50], 'Near side wall removed', 'wall and door leaf cut away for clarity', { v: 'iso' });
callout([90, H + 1, -ZO], [0, 34, -40], 'Near side wall removed', 'shown cut for clarity', { v: 'front' });
callout([XD + 23, 70, ZO], [40, 40, 30], 'Cargo doors', 'press-cake tote exits here', { v: 'iso side' });
// callouts — water loop
const WV = { v: 'water' };
callout([RX, 60, RZ], [-40, 80, -70], 'Supply drops at the front', 'risers feed an inlet in each run', WV);
callout([220, YM, RZ], [0, 60, -90], 'Supply main', 'aisle ceiling, runs forward', WV);
callout([200, TB(7) + 3.3, Z(0, 6)], [-20, -150, -80], 'Flow front → back', 'through the water, under the mat', WV);
callout([B + 7.5, 40, Z(0, 6)], [30, -90, -60], 'Overflow weirs', 'drain risers, one per column', WV);
callout([TK0 + 10, 52, -34], [40, 70, -40], 'Organic debris screen', 'wedge-wire; removes coarse matter', WV);
callout([TK0 + 25, 47, -34], [70, -40, -50], 'Debris tray', 'emptied at the doors', WV);
callout([TK0 + 15, 20, -34], [30, -80, -40], 'Return tank', '≈130 gal', WV);
callout([B + 88, 30, -38], [70, 10, -20], 'Pump + cartridge filter', 'back to the supply main', WV);
callout([FLX, 52, -38], [-10, 95, -90], 'EC / nitrate sensor + 3-way valve', 'diverts nutrient-spent water', WV);
callout([XD, 2, -38], [-30, -60, -110], 'Spent-water discharge', 'cam-lock outlet at the door sill', WV);
callout([XD, 4, -28], [40, -40, -70], 'Feed-water inlet', 'waste-water nutrient stream · cam-lock', WV);
callout([FDX, 17, -28], [60, 30, -40], 'Backflow preventer → strainer', 'flow meter · solenoid', WV);
callout([TK1 - 8, 34, -44.5], [20, 60, -90], 'Nutrient monitoring', 'nitrate · EC · pH · DO · temp', WV);
callout([2, TB(7) + 0.75, Z(0, 20)], [-30, -90, -90], 'Front inlet spreaders', 'one per run, under the screen', WV);
// callouts — electrical
const EV = { v: 'elec' };
callout([XF - 6, 46, 36], [-40, 60, -80], 'Shore power + main disconnect', 'front end, exterior', EV);
callout([200, CY, 44.2], [0, 50, 40], 'Main feeder + cable tray', 'far wall, above the racks', EV);
callout([200, CY, -44.2], [0, 40, -60], 'Cable tray (near side)', null, EV);
callout([3, TB(4) + 10.3, Z(0, -0.75)], [-30, -80, -80], 'LED driver drops', '1 per run, front end', EV);
callout([B + 3, 60, -4.75], [20, 80, -80], 'Conveyor motor drops', '16 gearmotors at the harvest end', EV);
callout([PNX, 83, 39.5], [40, 50, -30], 'Control panel', 'VFDs · LED drivers · breakers', EV);
callout([B + 86, 40, -44.2], [60, -60, -40], 'Pump circuit', null, EV);
callout([5, TB(5) + 7.62, Z(0, 6)], [-40, 90, -90], 'Screen actuator circuits', '24 VDC · drop + junction box per run', EV);
callout([240, TB(7) + 7.62, Z(0, 11.4)], [20, 60, -40], 'Actuator harness', 'along each screen rail · whip per actuator', EV);
callout([B + 77, 70, -31], [40, 60, -60], 'Valve + sensor wiring', 'solenoid · divert valve · probes', EV);

// callouts — plan view (labels in two rows outside the container)
const at = (a, l, title, sub) => callout(a, [l[0] - a[0], l[1] - a[1], l[2] - a[2]], title, sub, { v: 'plan' });
at([180, TB(7) + 3.1, Z(0, 30)], [180, 110, -112], 'Duckweed runs', '2 across × 8 tiers · near column');
at([180, TB(7) + 3.1, Z(1, 30)], [180, 110, 96], 'Duckweed runs', 'far column');
at([60, H - 3, 0], [40, 110, 96], 'Air chute', null);
at([B + 10, 99, Z(0, 24)], [B - 40, 110, -112], 'Collection chutes', 'one per column');
at([B + 20, 9.6, 0], [B - 10, 110, 96], 'Receiving bin', 'grated step-over');
at([SX0 + 16, 62, 25], [B + 70, 110, 96], 'Dewatering screen', null);
at([B + 88, 19, 25], [B + 150, 110, 96], 'Press + tote', null);
at([TK0 + 15, 40, -34], [B + 60, 110, -112], 'Return tank', '≈130 gal');
at([B + 84, 8, -38], [B + 150, 110, -112], 'Pump + filter', null);

// callouts — repopulation screen detail (follow the top visible tier, near column)
const SV = { v: 'screen', rel: 1 };
const SCX = 2 * BAY + BAY / 2;
callout(tb => [SCX + 20, tb + 4.6, Z(0, 13.5)], [-4, 14, 10], 'Moving repop. screen', `SS mesh gate · one per ${FTIN(BAY)} bay`, SV);
callout(tb => [2 * BAY + 0.6, tb + 6, Z(0, 13.5)], [8, 12, 4], 'Guide channel', 'at each frame', SV);
callout(tb => [SCX, tb + 8.6, Z(0, 14)], [-6, 12, -6], 'Linear actuator', '24 VDC · 2.4" stroke', SV);
callout(tb => [SCX - 80, tb + 7.62, Z(0, 11.4)], [-10, 10, -14], 'Actuator harness', '24 VDC from the front junction box', SV);
callout(tb => [SCX - 10, tb + 3.1, Z(0, 5)], [4, -9, -10], 'Repopulation zone ⅓', 'mat held while the gate is down', SV);
callout(tb => [SCX + 30, tb + 3.1, Z(0, 26)], [-6, -10, 8], 'Harvest zone ⅔', 'reseeded when the gate lifts', SV);
callout(tb => [SCX + 50, tb + 7.5, Z(0, 12)], [10, 12, 14], 'Screen rail', 'carries screen + actuators', SV);
const HV = { v: 'harvest', rel: 1 };
callout(tb => [RUN_L - 56, tb + 3.1, Z(0, 5)], [-6, 24, -4], 'Repopulation zone', '⅓ width retained', HV);
callout(tb => [RUN_L - 34, tb + 7.5, Z(0, 12)], [-14, 22, 12], 'Screen rail + screen', 'splits width ⅓ : ⅔', HV);
callout(tb => [RUN_L - 44, tb + 3.1, Z(0, 28)], [-16, 12, 34], 'Harvest section ⅔', 'conveyor belt under the mat', HV);
callout(tb => [RUN_L - 12, tb + 4.6, Z(0, 26)], [8, 22, 30], 'Cleated incline', 'lifts the mat clear of the water', HV);
callout(tb => [HEAD_X + 5.3, tb + 5.2, Z(0, 24)], [24, 16, 10], 'Discharge flap', 'drops harvest to the chute', HV);
callout(tb => [HEAD_X, tb + 6, Z(0, 41)], [10, 30, 34], 'Belt drive', 'gearmotor on head shaft', HV);
callout(tb => [RUN_L - 76, tb + 1.4, Z(0, 21)], [-26, -12, -26], 'Submerged SS grid', 'ribs at each frame', HV);
callout(tb => [B + 10, tb - 6, Z(0, 26)], [26, -10, -8], 'Collection chute', 'to receiving bin', HV);
callout(tb => [RUN_L - 40, tb + LED, Z(0, 6)], [-34, 14, -18], 'LED bar', '9" above run floor', HV);

/* ---------- views ---------- */
const VIEWS = {
  iso: { dir: [0.62, 0.34, -0.71], tgt: [L / 2 + 20, 22, 0], fit: [560, 250], fov: 32, dims: 'overall', tiers: 8, cap: 'Overview: one 40\' high-cube container. Cultivation at the front, harvest and dewatering at the door end.' },
  side: { dir: [0, 0.05, -1], tgt: [L / 2 + 20, 30, 0], fit: [580, 200], fov: 28, dims: 'overall', tiers: 8, cap: 'Side elevation with the near wall removed: 8 tiers of runs, processing bay at the doors.' },
  plan: { dir: [0, 1, -0.02], tgt: [L / 2 + 20, 0, -8], fit: [700, 290], fov: 28, dims: 'plan', tiers: 8, cap: 'Plan: two columns of runs with a centre aisle, processing equipment in the last 8\'.' },
  section: { dir: [1, 0.035, 0], tgt: [SECTION_X, 48, -26], fit: [250, 200], fov: 13, dims: 'section', tiers: 8, section: true, cap: 'Section A–A: run width split, tier pitch, water depth and LED height.' },
  screen: { pos: [SCX - 50, 54, -78], tgt: [SCX - 2, 36, -34], fov: 42, dims: 'none', tiers: 3, peek: true, cap: 'Repopulation screen: the gate drops to hold a ⅓ mat, then lifts so it spreads back over the run.' },
  harvest: { pos: [B + 25, 84, -110], tgt: [B - 14, 34, -26], fov: 40, dims: 'none', tiers: 3, cap: 'Harvest end: the submerged belt lifts the mat up a cleated incline and drops it into the chute.' },
  process: { pos: [B + 70, 170, -230], tgt: [B + 50, 30, 4], fov: 40, dims: 'none', tiers: 8, cap: 'Processing bay: bin, auger, vibratory screen and screw press, with the water return line on the near side.' },
  water: { dir: [0.62, 0.34, -0.71], tgt: [L / 2 + 20, 22, 0], fit: [560, 250], fov: 32, dims: 'none', tiers: 8, water: true, cap: 'Water loop: supply (blue) to the front of each run, flow through the run, return (teal) to the tank, feed in (violet), spent water out (amber).' },
  elec: { dir: [0.62, 0.34, -0.71], tgt: [L / 2 + 20, 22, 0], fit: [560, 250], fov: 32, dims: 'none', tiers: 8, elec: true, cap: 'Electrical: shore power to the panel (orange), LED circuits (pink) and 24 VDC actuator and sensor circuits (lime).' },
  front: { dir: [-0.62, 0.3, -0.72], tgt: [70, 34, 0], fit: [400, 260], fov: 34, dims: 'none', tiers: 8, cap: 'Front end: heat pump, supply risers and LED driver drops.' },
};
const TOUR = ['iso', 'side', 'section', 'screen', 'harvest', 'process', 'water', 'elec', 'plan'];
const clipPlane = new THREE.Plane(V(-1, 0, 0), SECTION_X);
let current = 'iso', dimsMode = 'overall', sectionOn = false, tween = null;
function viewPose(v) {
  const tgt = V(...v.tgt);
  if (v.pos) return { pos: V(...v.pos), tgt, fov: v.fov };
  const t = Math.tan(THREE.MathUtils.degToRad(v.fov / 2)), a = camera.aspect || 1.6;
  const dist = Math.max(v.fit[1] / (2 * t), v.fit[0] / (2 * t * a)) * 1.08;
  return { pos: tgt.clone().addScaledVector(V(...v.dir).normalize(), dist), tgt, fov: v.fov };
}
const $ = id => document.getElementById(id);
function setView(name, instant = false) {
  const v = VIEWS[name]; if (!v) return; current = name;
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  dimsMode = v.dims; sectionOn = !!v.section;
  renderer.clippingPlanes = sectionOn ? [clipPlane] : [];
  setTiers(v.tiers);
  $('tWater').checked = !!v.water; $('tElec').checked = !!v.elec;
  $('caption').textContent = v.cap;
  R.mesh.emissive.set(name === 'screen' ? '#2fc4a8' : '#000000'); R.mesh.emissiveIntensity = 0.55;   // highlight the moving gates
  const to = viewPose(v);
  if (instant || reduceMotion) { camera.position.copy(to.pos); controls.target.copy(to.tgt); camera.fov = to.fov; camera.updateProjectionMatrix(); tween = null; }
  else tween = { t0: performance.now(), dur: 1100, fromP: camera.position.clone(), fromT: controls.target.clone(), fromF: camera.fov, to };
  applyVisibility();
  try { history.replaceState(null, '', '#' + name); } catch (e) { /* file:// or sandboxed frame */ }
}
const tiersInput = $('tiers'), tiersOut = $('tiersOut');
function setTiers(n) {
  tierN = n; tiersInput.value = n; tiersOut.textContent = n === 1 ? '1' : `1–${n}`;
  const peek = VIEWS[current]?.peek;
  for (let t = 0; t < TIERS; t++) { G('t' + t).visible = t < n; G('l' + t).visible = t < (peek ? n - 1 : n); }
  labels.forEach(c => c.rel && placeCallout(c));
  if ($('tLed')) ledLights.forEach(l => { l.visible = $('tLed').checked && photoreal && quality === 'high' && l.userData.tier < tierN; });
}
// CSS2D labels ignore parent visibility, so toggle every child
function showSet(g, on) { g.visible = on; g.children.forEach(o => { if (o.isCSS2DObject) o.visible = on; }); }
function applyVisibility() {
  applyMode();
  G('shell').visible = $('tShell').checked;
  G('roof').visible = $('tRoof').checked && !sectionOn;
  const on = $('tLed').checked;
  R.ledL.emissiveIntensity = on ? 6 : 0; R.ledL.color.set(on ? '#ffffff' : '#cfd3d6');
  R.dwR.emissiveIntensity = R.dwH.emissiveIntensity = on ? (photoreal ? 0.12 : 0.35) : 0.03;
  ledLights.forEach(l => { l.visible = on && photoreal && quality === 'high' && l.userData.tier < tierN; });
  showSet(annot.overall, $('tDims').checked && dimsMode === 'overall');
  showSet(annot.width, $('tDims').checked && dimsMode === 'overall' && current !== 'side');   // width reads edge-on from the side
  showSet(annot.section, $('tDims').checked && dimsMode === 'section');
  showSet(annot.plan, $('tDims').checked && dimsMode === 'plan');
  annot.callouts.visible = $('tCallouts').checked && !sectionOn;
  overlay.water.visible = $('tWater').checked;
  overlay.elec.visible = $('tElec').checked;
  document.querySelector('.legend-water').hidden = !$('tWater').checked;
  document.querySelector('.legend-elec').hidden = !$('tElec').checked;
}
['tShell', 'tRoof', 'tLed', 'tDims', 'tCallouts', 'tAnim', 'tWater', 'tElec'].forEach(id => $(id).addEventListener('change', applyVisibility));
tiersInput.addEventListener('input', () => setTiers(+tiersInput.value));
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { stopTour(); setView(b.dataset.view); }));
if (reduceMotion) $('tAnim').checked = false;
if (innerWidth < 720) { $('tCallouts').checked = false; $('tDims').checked = false; }

let quality = 'high';
function applyMode() {
  photoreal = $('mode').value === 'photo';
  scene.background = photoreal ? null : BG;
  sky.visible = photoreal;
  scene.environment = photoreal ? envSky : envStudio;
  scene.fog = photoreal ? new THREE.Fog('#c9d3db', 3000, 9500) : new THREE.Fog(BG, 1500, 3800);
  gridHelper.visible = !photoreal;
  renderer.toneMappingExposure = photoreal ? 0.9 : 1.0;
  sun.intensity = photoreal ? 2.6 : 1.85; fill.intensity = photoreal ? 0.25 : 0.45;
  const hi = quality === 'high';
  if (typeof gtao !== 'undefined') { gtao.enabled = photoreal && hi; grade.enabled = photoreal; bloom.enabled = hi; }
  if (renderer.shadowMap.enabled !== hi) { renderer.shadowMap.enabled = hi; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); }
}
$('mode').addEventListener('change', () => { if ($('mode').value === 'photo') $('tRoof').checked = false; applyVisibility(); });
$('quality').addEventListener('change', () => { quality = $('quality').value; renderer.setPixelRatio(quality === 'high' ? Math.min(devicePixelRatio, 2) : 1); resize(); applyVisibility(); });

/* ---------- guided tour ---------- */
let tourTimer = null, tourIdx = 0;
function stopTour() { if (tourTimer) { clearInterval(tourTimer); tourTimer = null; } $('tour').textContent = 'Play tour'; $('tour').setAttribute('aria-pressed', 'false'); }
$('tour').addEventListener('click', () => {
  if (tourTimer) { stopTour(); return; }
  tourIdx = 0; setView(TOUR[0]);
  $('tour').textContent = 'Stop tour'; $('tour').setAttribute('aria-pressed', 'true');
  tourTimer = setInterval(() => { tourIdx = (tourIdx + 1) % TOUR.length; setView(TOUR[tourIdx]); }, 7000);
});
renderer.domElement.addEventListener('pointerdown', stopTour);
