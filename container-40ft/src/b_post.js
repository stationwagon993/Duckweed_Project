/* ---------- post-processing ---------- */
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, 512, 512);
gtao.updateGtaoMaterial({ radius: 9, distanceExponent: 1.4, thickness: 8, scale: 1.25, samples: 16 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
gtao.blendIntensity = 0.9;
gtao.overrideVisibility = function () {
  const cache = this._visibilityCache;
  this.scene.traverse(o => {
    cache.set(o, o.visible);
    const m = o.material;
    if (o.isPoints || o.isLine || o === sky || (m && (m.depthTest === false || (m.transparent && !m.alphaTest)))) o.visible = false;
  });
};
composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.28, 0.2, 3.6);
composer.addPass(bloom);
composer.addPass(new OutputPass());
// photographic finish: vignette, faint chromatic fringe, film grain
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, time: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + time) * 43758.5453); }
    void main(){
      vec2 d = vUv - .5; float r2 = dot(d,d);
      vec3 c = vec3(texture2D(tDiffuse, vUv - d*.0025).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + d*.0025).b);
      float l = dot(c, vec3(.2126,.7152,.0722)); c = mix(vec3(l), c, 1.12); c = clamp((c - .5) * 1.07 + .5, 0., 1.);
      c *= mix(1., .72, smoothstep(.12, .62, r2));
      c += (h(vUv*1000.) - .5) * .025;
      gl_FragColor = vec4(c, 1.);
    }`
});
composer.addPass(grade);

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;                                   // render tab hidden: keep the last size
  renderer.setSize(w, h); composer.setSize(w, h); labelRenderer.setSize(w, h); gtao.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
new ResizeObserver(resize).observe(host);
resize();
setView(location.hash.slice(1) in VIEWS ? location.hash.slice(1) : 'iso', true);
document.getElementById('loading').remove();
window.DW_RENDER_READY = true;

/* ---------- label declutter: push overlapping callouts apart, keep them inside the viewport, draw 2D leaders ---------- */
const svg = document.getElementById('leaders'), NS = 'http://www.w3.org/2000/svg', pool = [];
function declutter() {
  const vr = host.getBoundingClientRect(), live = labels.filter(c => c.lab.visible);
  const items = live.map(c => {
    const r = c.lab.element.getBoundingClientRect(), sh = c.shift || [0, 0];
    return { c, x0: r.left - sh[0], x1: r.right - sh[0], y0: r.top - sh[1], y1: r.bottom - sh[1] };
  }).sort((a, b) => a.y0 - b.y0);
  const done = [], pad = 4, cap = document.getElementById('caption');
  // keep callouts above the caption bar so it is never covered
  const cr = cap && !cap.hidden && cap.textContent ? cap.getBoundingClientRect() : null;
  const bottom = cr && cr.height ? Math.min(vr.bottom, cr.top) : vr.bottom;
  // dimension tags stay put; callouts move around them
  document.querySelectorAll('#page-render .dim').forEach(el => {
    if (el.style.display === 'none') return;
    const r = el.getBoundingClientRect();
    if (r.width && r.right > vr.left && r.left < vr.right && r.bottom > vr.top && r.top < vr.bottom) done.push({ x0: r.left, x1: r.right, y0: r.top, y1: r.bottom });
  });
  for (const it of items) {
    let dx = 0, dy = 0;
    const w = it.x1 - it.x0, h = it.y1 - it.y0;
    if (it.x0 < vr.left + pad) dx = vr.left + pad - it.x0;
    if (it.x1 > vr.right - pad) dx = vr.right - pad - it.x1;
    if (it.y0 < vr.top + pad) dy = vr.top + pad - it.y0;
    for (let guard = 0; guard < 30; guard++) {
      const hit = done.find(d => it.x0 + dx < d.x1 + pad && it.x1 + dx > d.x0 - pad && it.y0 + dy < d.y1 + pad && it.y1 + dy > d.y0 - pad);
      if (!hit) break;
      dy = hit.y1 + pad - it.y0;
    }
    if (it.y1 + dy > bottom - pad) {
      // clamped at the bottom edge: climb above anything already placed there
      dy = bottom - pad - it.y1;
      for (let guard = 0; guard < 30; guard++) {
        const hit = done.find(d => it.x0 + dx < d.x1 + pad && it.x1 + dx > d.x0 - pad && it.y0 + dy < d.y1 + pad && it.y1 + dy > d.y0 - pad);
        if (!hit) break;
        dy = hit.y0 - pad - it.y1;
      }
    }
    it.c.shift = [dx, dy];
    it.c.lab.element.style.translate = `${dx}px ${dy}px`;
    done.push({ x0: it.x0 + dx, x1: it.x1 + dx, y0: it.y0 + dy, y1: it.y1 + dy, w, h });
  }
  let i = 0;
  for (const it of items) {
    const d = it.c.dot.element.getBoundingClientRect(), px = (d.left + d.right) / 2 - vr.left, py = (d.top + d.bottom) / 2 - vr.top;
    const [dx, dy] = it.c.shift, l = it.x0 + dx - vr.left, r = it.x1 + dx - vr.left, t = it.y0 + dy - vr.top, b = it.y1 + dy - vr.top;
    const qx = Math.min(Math.max(px, l), r), qy = Math.min(Math.max(py, t), b);
    let ln = pool[i];
    if (!ln) { ln = document.createElementNS(NS, 'line'); svg.appendChild(ln); pool.push(ln); }
    ln.setAttribute('x1', px); ln.setAttribute('y1', py); ln.setAttribute('x2', qx); ln.setAttribute('y2', qy); ln.style.display = '';
    i++;
  }
  for (; i < pool.length; i++) pool[i].style.display = 'none';
}

