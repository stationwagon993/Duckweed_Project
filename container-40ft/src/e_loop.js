
/* ---------- loop (paused while another dashboard tab is open) ---------- */
const clock = new THREE.Clock();
const qParam = new URLSearchParams(location.search).get('quality');
let simTime = 4, frames = 0, fpsT0 = performance.now(), autoChecked = qParam === 'high' || qParam === 'fast';
const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const renderVisible = () => !document.getElementById('page-render').hidden && !document.hidden;
function frame() {
  requestAnimationFrame(frame);
  if (!renderVisible() || host.clientWidth === 0) { clock.getDelta(); return; }
  const dt = Math.min(clock.getDelta(), 0.05);
  if ($('tAnim').checked) { simTime += dt; R.belt.map.offset.x -= dt * 2.2 / 2; }
  updateParticles(simTime);
  updateFlows(simTime);
  ripple.offset.x = -simTime * 0.02; ripple.offset.y = simTime * 0.006; grade.uniforms.time.value = (performance.now() % 1000) / 1000;
  const mode = $('scrMode').value;
  let target = mode === 'up' ? 1 : 0;
  if (mode === 'auto') { const u = simTime % 16; target = u < 8 ? 0 : 1; }
  screenLift += (target - screenLift) * Math.min(1, dt * 2.2);
  updateScreens();
  const st = screenLift < 0.05 ? 'down · holding mat' : screenLift > 0.95 ? 'up · releasing mat' : 'moving…';
  if ($('scrOut').textContent !== st) $('scrOut').textContent = st;
  if (tween) {
    const k = Math.min((performance.now() - tween.t0) / tween.dur, 1), e = ease(k);
    camera.position.lerpVectors(tween.fromP, tween.to.pos, e);
    controls.target.lerpVectors(tween.fromT, tween.to.tgt, e);
    camera.fov = tween.fromF + (tween.to.fov - tween.fromF) * e; camera.updateProjectionMatrix();
    if (k >= 1) tween = null;
  }
  controls.update();
  for (const c of labels) {
    const hiddenBySection = sectionOn && c.anchor.x > SECTION_X;
    const vis = annot.callouts.visible && !hiddenBySection && c.views.includes(current);
    c.line.visible = false; c.dot.visible = c.lab.visible = vis;
  }
  composer.render();
  labelRenderer.render(scene, camera);
  declutter();
  // after a few seconds, drop to fast quality once if this machine can't keep up
  frames++;
  const el = performance.now() - fpsT0;
  if (!autoChecked && el > 4000) {
    autoChecked = true;
    if (frames / (el / 1000) < 18 && quality === 'high') {
      $('quality').value = 'fast'; $('quality').dispatchEvent(new Event('change'));
      const n = $('toast'); n.textContent = 'Switched to Fast quality for smoother motion. Change it under Display.'; n.hidden = false;
      setTimeout(() => { n.hidden = true; }, 6000);
    }
  }
}
if (qParam === 'fast') { $('quality').value = 'fast'; $('quality').dispatchEvent(new Event('change')); }
window.addEventListener('dw:render-shown', () => { resize(); fpsT0 = performance.now(); frames = 0; });
frame();
