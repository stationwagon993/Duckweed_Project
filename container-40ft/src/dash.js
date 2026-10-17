/* Dashboard shell: page tabs, design data, bill of materials and calculations. Plain script, so these work even if the 3D model cannot load. */
(function () {
  'use strict';
  const D = window.DW_DESIGN = {
    intLengthIn: 473.5, intWidthIn: 92.5, intHeightIn: 106,     // 40' high cube, steel to steel
    runLengthIn: 372, runWidthIn: 36, bays: 6, runs: 16, tiers: 8, waterIn: 3,
  };
  const FTIN = window.DW_FTIN = x => {
    const q = Math.round(x * 4) / 4, f = Math.floor(q / 12), i = q - f * 12, w = Math.floor(i), fr = i - w;
    return `${f}'-${w}${fr === 0.25 ? '¼' : fr === 0.5 ? '½' : fr === 0.75 ? '¾' : ''}"`;
  };
  const $ = id => document.getElementById(id);
  const fmt0 = v => Math.round(v).toLocaleString('en-US');
  const usd = v => (v < 0 ? '−$' : '$') + fmt0(Math.abs(v));
  const usd2 = v => (v < 0 ? '−$' : '$') + Math.abs(v).toFixed(2);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const procIn = D.intLengthIn - D.runLengthIn;
  const runFt2 = D.runLengthIn * D.runWidthIn / 144;
  const areaFt2 = runFt2 * D.runs, areaM2 = areaFt2 * 0.092903;
  const waterFt3 = areaFt2 * D.waterIn / 12;
  $('subtitle').textContent = `40' high cube · ${FTIN(D.intLengthIn)} × ${FTIN(D.intWidthIn)} × ${FTIN(D.intHeightIn)} interior · ${D.runs} runs, 2 across × ${D.tiers} tiers · ${FTIN(procIn)} processing bay`;

  /* ---------- page tabs ---------- */
  const PAGES = ['render', 'bom', 'calc'];
  function showPage(p) {
    PAGES.forEach(k => { $('tab-' + k).setAttribute('aria-selected', String(k === p)); $('page-' + k).hidden = k !== p; });
    if (p === 'render') window.dispatchEvent(new Event('dw:render-shown'));
  }
  PAGES.forEach(k => $('tab-' + k).addEventListener('click', () => showPage(k)));
  $('tab-render').parentElement.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = PAGES.findIndex(k => $('tab-' + k).getAttribute('aria-selected') === 'true');
    const n = PAGES[(i + (e.key === 'ArrowRight' ? 1 : PAGES.length - 1)) % PAGES.length];
    showPage(n); $('tab-' + n).focus();
  });
  $('fs').addEventListener('click', () => {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* not allowed here */ }
  });
  document.addEventListener('fullscreenchange', () => { $('fs').textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; });
  if (!document.fullscreenEnabled) $('fs').hidden = true;
  $('panels').addEventListener('click', () => {
    const w = $('page-render').classList.toggle('wide');
    $('panels').textContent = w ? 'Show panels' : 'Hide panels'; $('panels').setAttribute('aria-pressed', String(w));
    window.dispatchEvent(new Event('dw:render-shown'));
  });
  window.DW_RENDER_FAIL = msg => { const l = $('loading'); if (l) l.innerHTML = esc(msg); };
  setTimeout(() => { if (!window.DW_RENDER_READY) window.DW_RENDER_FAIL('The 3D model could not load. It needs an internet connection to fetch the 3D library. The bill of materials and calculations tabs still work.'); }, 30000);

  /* ---------- design data (render page) ---------- */
  const aisle = D.intWidthIn - 3.5 - 2 * D.runWidthIn;
  const DATA = [
    ['Container', `40' high cube, ${FTIN(D.intLengthIn)} interior`],
    ['Runs', `${D.runs} = 2 across × ${D.tiers} tiers`],
    ['Run size', `${FTIN(D.runLengthIn)} L × 3'-0" W`],
    ['Wall / water', '5" wall · 3" depth'],
    ['Tier pitch', '11¾" floor to floor'],
    ['LED plane', '9" above run floor · 6" over water'],
    ['Width split', `1'-0" repop. | 2'-0" harvest`],
    ['Repop. screen', `${D.bays} SS mesh gates per run · 2.4" travel`],
    ['Supports', `${D.bays + 1} frames per run @ ${FTIN(D.runLengthIn / D.bays)}`],
    ['Aisle', `${aisle}" between trays · ${aisle - 3}" between posts`],
    ['Growing area', `${fmt0(areaFt2)} ft² (${areaM2.toFixed(0)} m²)`],
    ['Harvest / repop.', `${fmt0(areaFt2 * 2 / 3)} ft² / ${fmt0(areaFt2 / 3)} ft²`],
    ['LED fixtures', `${D.bays * 3 * D.runs} × ${FTIN(D.runLengthIn / D.bays - 4)} bars`],
    ['Water in runs', `${fmt0(waterFt3)} ft³ ≈ ${fmt0(waterFt3 * 7.48)} gal`],
    ['Water weight', `≈ ${fmt0(waterFt3 * 62.4)} lb`],
    ['Processing bay', `${FTIN(procIn)} × ${FTIN(D.intWidthIn)}`],
  ];
  $('data').innerHTML = DATA.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  $('dataNote').innerHTML = `<b>Water loop.</b> Feed water (the waste-water stream that carries the nutrients) enters by cam-lock at the door sill, through a backflow preventer, strainer, flow meter and solenoid into the return tank. The pump sends water through a filter to the supply main, forward to the front risers, and into an inlet spreader in each run. Water flows front to back under the mat, spills over the weirs, passes the debris screen and returns to the tank. When nutrients run low, the 3-way valve sends spent water out at the door sill.<br><br><b>Aisle.</b> Two 3'-0" runs leave a ${aisle}" aisle (${aisle - 3}" between posts), which is tight for daily access. Narrower runs or a single side aisle would widen it.`;

  /* ---------- bill of materials ---------- */
  const NBAR = D.bays * 3 * D.runs, NSCR = D.bays * D.runs, NFR = (D.bays + 1) * 2 * 2;
  const BOM = [
    ['Container and climate', [
      ['40\' high-cube shipping container, one trip', 'Any ISO 40\' HC (CW grade or better) · Check floor and door seals', 1, '', 5500],
      ['Insulation and wall liner', 'Closed-cell spray foam on roof and ends, FRP-faced panels on side walls · Wet-room finish', 1, 'lot', 9000],
      ['Floor sealing and trench drain', 'Epoxy over marine ply, trench drain at the door end to the return tank', 1, 'lot', 2500],
      ['Ducted cold-climate heat pump, 2 ton', 'Mitsubishi Hyper-Heat or equivalent · Heats and cools; LED heat covers most of winter', 1, '', 5500],
      ['Dehumidifier ~200 pt/day', 'Quest 225 or equivalent · Condensate returns to the tank', 1, '', 2400],
      ['Heat-recovery ventilator ~300 cfm', 'Sensible core with economizer bypass', 1, '', 1800],
      ['Fabric air chute Ø10"', 'FabricAir, custom length · Spreads air down the aisle', 1, '', 600],
    ]],
    ['Rack and screen mechanics', [
      ['Rack frame extrusion', '80/20 1515 series 1.5" T-slot + gussets · Verify deflection with full trays', 1800, 'ft', 6],
      ['Leveling feet', '80/20 15-series leveling mount · One per post', NFR, '', 18],
      [`Run trays, ${FTIN(D.runLengthIn)} × 3'-0" × 5"`, 'Fabricated HDPE trays, welded corners', D.runs, '', 450],
      ['Submerged support grid', '316 SS flat bar + rod, laser-cut · Ribs at each frame', D.runs, 'sets', 180],
      ['Screen rail (2×2 tube)', '304 SS rectangular tube · Carries screens, actuators, harness', Math.ceil(D.runs * D.runLengthIn / 12), 'ft', 14],
      ['Screen guide channels', '304 SS U-channel, 1" × ½" · At each frame', (D.bays + 1) * D.runs, '', 12],
      ['Repop. screen mesh panels', '316 SS woven wire cloth, 1/16" opening · 58" × 3" framed', NSCR, '', 35],
      ['Screen actuators', 'Progressive Automations PA-14, 24 VDC, 3" stroke · Or gang one per run to cut the count to 16', NSCR, '', 110],
    ]],
    ['Conveyors', [
      ['Modular belt, 22" wide', 'Intralox Series 900 Flush Grid or open-mesh PP · ≈64 ft loop per run', D.runs * 64, 'ft', 20],
      ['Sprockets and shafts', 'Head + tail per run, 1" 316 SS shaft', D.runs * 2, '', 140],
      ['Wet-duty bearings', 'Thermoplastic flange bearings, SS insert', D.runs * 4, '', 28],
      ['Gearmotors', 'Oriental Motor BLE2 brushless, 60 W, with driver · Speed set by PLC', D.runs, '', 420],
      ['Cleats and side guides', 'Flights + 304 SS formed skirts · Cleated incline at the harvest end', D.runs, 'sets', 150],
      ['Discharge flaps', '304 SS sheet + SS piano hinge', D.runs, '', 60],
    ]],
    ['Lighting', [
      ['LED top-lights, ~58"', 'Linear horticultural bar, ~23 W, 3.0 µmol/J class · 9" above run floor', NBAR, '', 38],
      ['LED drivers', 'Mean Well XLG-240 series, dimmable · Two per run, front end', D.runs * 2, '', 65],
    ]],
    ['Water loop', [
      ['Feed-water inlet coupling', '1½" cam-lock, type A · Waste-water stream in', 1, '', 35],
      ['Backflow preventer', 'Watts 007 double check', 1, '', 320],
      ['Feed Y-strainer', 'PVC Y-strainer, 1"', 1, '', 60],
      ['Flow meters', 'GF Signet 2536 paddlewheel + 9900 transmitter · Feed line + supply main', 2, '', 900],
      ['Feed solenoid valve', 'ASCO 8210, 1", NC, 24 VDC', 1, '', 280],
      ['Tank level floats', 'Low / refill / high', 3, '', 45],
      ['Return tank ≈130 gal', 'Rectangular poly tank', 1, '', 650],
      ['Organic debris screen', 'Wedge-wire panel in a fabricated box, debris tray', 1, '', 1800],
      ['Supply pump', 'Grundfos CM5 horizontal multistage, 1 hp, 10–20 gpm (+1 spare)', 2, '', 1400],
      ['Suction strainer, check valve, gauges', '1½" strainer, swing check, two 0–60 psi gauges', 1, 'set', 250],
      ['Cartridge filter', 'Pentek Big Blue 20", 50 µm', 1, '', 220],
      ['Nutrient monitoring', 'Hach Nitratax sc + SC200; EC, pH, DO and temperature probes · Monitor only', 1, 'set', 6500],
      ['Spent-water divert valve', 'Belimo 3-way ball valve + 24 V actuator', 1, '', 650],
      ['Discharge coupling', '1½" cam-lock, type C · Door sill', 1, '', 35],
      ['Pipe and fittings', 'Sch 80 PVC, 1½" main, ¾" laterals', 1, 'lot', 1800],
      ['Isolation valves', 'True-union ball valves: 16 × ¾", 6 × 1½"', 1, 'set', 780],
      ['Inlet spreaders + overflow bulkheads', 'Drilled ¾" PVC spreader + ¾" bulkhead per run', D.runs, 'sets', 45],
      ['Pipe hangers', 'Clevis hangers + ⅜" all-thread', 24, '', 15],
    ]],
    ['Harvest and dewatering', [
      ['Collection chutes', '¼" polycarbonate + 304 SS angle · One per column', 2, '', 650],
      ['Receiving bin + step grating', 'Fabricated 304 SS, molded FRP grating', 1, '', 1800],
      ['Transfer auger', 'Flexible screw conveyor, 2.5"', 1, '', 4500],
      ['Vibratory dewatering screen', '24" vibratory separator, wedge-wire deck', 1, '', 6500],
      ['Screw press', 'Small dewatering screw press (Vincent CP-4 class) · Used units cost less', 1, '', 18000],
      ['Press-cake totes', '48 × 40 plastic bulk container on pallet', 2, '', 250],
    ]],
    ['Electrical and controls', [
      ['Shore-power inlet', '60 A switch-rated inlet · Front end', 1, '', 450],
      ['Main disconnect', 'Fusible safety switch, 60 A, NEMA 4X', 1, '', 380],
      ['Breaker panel + GFCI breakers', 'Wet-location circuits on GFCI', 1, 'lot', 1600],
      ['Control enclosure', 'NEMA 4X, 36 × 24 × 12', 1, '', 900],
      ['PLC + I/O', 'AutomationDirect Productivity1000 · Screens, valves, sensors, conveyors', 1, '', 1800],
      ['HMI', 'AutomationDirect C-more 7"', 1, '', 900],
      ['VFDs', 'AutomationDirect GS20 · Pump, auger, screen, press', 4, '', 280],
      ['24 VDC supplies', 'Mean Well SDR-960-24', 2, '', 250],
      ['Actuator relays', 'Reversing relay per run', D.runs, '', 35],
      ['Cable tray', 'Wire-mesh tray, 2" × 4" · Both walls above the racks', 85, 'ft', 12],
      ['Conduit and cable', 'Liquid-tight flex, SOOW, 18/2 actuator cable · Wet-location rated', 1, 'lot', 2200],
      ['E-stops', '40 mm mushroom · Front, harvest end, doors', 3, '', 70],
    ]],
  ];
  const OPTIONS = [['Compact heat-pump dryer (optional)', 'Dries press cake to a shelf-stable ~90% solids product · Needed to sell bagged fertilizer', 1, '', 12000]];
  let n = 0, total = 0;
  const groupTotals = [];
  const rows = ['<thead><tr><th>#</th><th>Item / product</th><th class="n">Qty</th><th class="n">Unit</th><th class="n">Extended</th></tr></thead><tbody>'];
  const csv = [['Group', 'Item', 'Product / note', 'Qty', 'Unit', 'Unit cost USD', 'Extended USD']];
  for (const [g, items] of BOM) {
    rows.push(`<tr class="grp"><td colspan="5">${esc(g)}</td></tr>`);
    let gt = 0;
    for (const [item, prod, q, u, c] of items) {
      const ext = q * c; gt += ext; n++;
      rows.push(`<tr><td class="n">${n}</td><td>${esc(item)}<small>${esc(prod)}</small></td><td class="n">${fmt0(q)}${u ? ' ' + u : ''}</td><td class="n">${usd(c)}</td><td class="n">${usd(ext)}</td></tr>`);
      csv.push([g, item, prod, q, u, c, ext]);
    }
    rows.push(`<tr class="sub"><td></td><td>Subtotal, ${esc(g.toLowerCase())}</td><td></td><td></td><td class="n">${usd(gt)}</td></tr>`);
    groupTotals.push([g, gt]); total += gt;
  }
  rows.push(`<tr class="tot"><td></td><td>Equipment total</td><td></td><td></td><td class="n">${usd(total)}</td></tr>`);
  rows.push(`<tr class="grp"><td colspan="5">Not included in the total</td></tr>`);
  for (const [item, prod, q, u, c] of OPTIONS) {
    rows.push(`<tr><td class="n">–</td><td>${esc(item)}<small>${esc(prod)}</small></td><td class="n">${q}</td><td class="n">${usd(c)}</td><td class="n">${usd(q * c)}</td></tr>`);
    csv.push(['Option', item, prod, q, u, c, q * c]);
  }
  rows.push('</tbody>');
  $('bom').innerHTML = rows.join('');
  const EQUIP = total, DRYER = OPTIONS[0][4];
  $('csv').addEventListener('click', () => {
    const body = csv.map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' })); a.download = 'duckweed-container-bom.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  // tab-separated text pastes straight into Excel or Google Sheets
  $('copy').addEventListener('click', () => {
    const tsv = csv.map(r => r.map(v => String(v).replace(/[\t\n]/g, ' ')).join('\t')).join('\n'), out = $('copyOut');
    const fallback = () => {
      let box = $('copyBox');
      if (!box) { box = document.createElement('textarea'); box.id = 'copyBox'; box.readOnly = true; $('bom').before(box); }
      box.value = tsv; box.select(); out.textContent = 'Copy blocked here. The table is selected below: press Ctrl+C or ⌘C.';
    };
    try { navigator.clipboard.writeText(tsv).then(() => { out.textContent = `Copied ${csv.length - 1} rows. Paste into a spreadsheet.`; }, fallback); } catch (e) { fallback(); }
  });
  if (window.DW_ARTIFACT) $('csv').hidden = true;   // the hosted viewer blocks file downloads

  /* ---------- calculations ---------- */
  const PRICES = [['0.45', 'Bulk soil amendment ($0.45/kg)'], ['2.50', 'Bagged fertilizer, wholesale ($2.50/kg)'], ['6.00', 'Small retail packs ($6.00/kg)'], ['custom', 'Custom price']];
  const F = [
    ['Energy', [
      ['power', 'Electricity price', '$/kWh', 0.11, 0.01, 0, 1],
      ['ppfd', 'Light at the mat', 'µmol/m²/s', 130, 5, 50, 400],
      ['photo', 'Photoperiod', 'h/day', 20, 0.5, 8, 24],
      ['eff', 'LED efficacy', 'µmol/J', 3.0, 0.1, 1.5, 4.5],
      ['other', 'Pumps, HVAC, conveyors, controls', 'kWh/day', 59, 1, 0, 500],
    ]],
    ['Growth', [
      ['lue', 'Growth per unit light', 'g dry/mol', 0.75, 0.05, 0.2, 1.5, 'Design 0.75 · good operation 0.95'],
      ['days', 'Operating days', 'per year', 350, 5, 100, 365],
      ['tnIn', 'Feed-water nitrogen', 'mg/L', 120, 5, 5, 2000],
      ['tnOut', 'Treated-water nitrogen', 'mg/L', 10, 1, 0, 500],
    ]],
    ['Revenue', [
      ['priceSel', 'Product market', '', '0.45', null],
      ['price', 'Product value', '$/kg dry', 0.45, 0.05, 0, 100],
      ['treat', 'Treatment value', '$/gal treated', 0.03, 0.005, 0, 2, 'Avoided hauling or land application'],
    ]],
    ['Running costs', [
      ['laborH', 'Labor', 'h/year', 450, 10, 0, 5000],
      ['rate', 'Labor rate', '$/h', 25, 1, 0, 200],
      ['maint', 'Maintenance', '% of equipment/yr', 3, 0.5, 0, 20],
      ['cons', 'Consumables and lab tests', '$/yr', 3000, 100, 0, 100000],
      ['ins', 'Insurance', '$/yr', 1500, 100, 0, 100000],
    ]],
    ['Build cost', [
      ['dryer', 'Add heat-pump dryer', 'bool', false],
      ['inst', 'Fabrication and installation', '% of equipment', 20, 1, 0, 100],
      ['site', 'Site pad, power hookup, water lines', '$', 11000, 500, 0, 500000],
      ['eng', 'Engineering and permits', '$', 15000, 500, 0, 500000],
      ['cont', 'Contingency', '%', 20, 1, 0, 100],
      ['rate8', 'Finance rate', '%/yr', 8, 0.5, 0, 30],
      ['life', 'Equipment life', 'years', 15, 1, 1, 40],
    ]],
  ];
  const form = $('calcForm'), html = [];
  for (const [legend, fields] of F) {
    html.push(`<fieldset><legend>${legend}</legend>`);
    for (const [id, label, unit, def, step, min, max, help] of fields) {
      if (unit === 'bool') { html.push(`<label class="chk"><input type="checkbox" id="c-${id}"${def ? ' checked' : ''}> ${label}</label>`); continue; }
      if (id === 'priceSel') { html.push(`<div class="fld"><label for="c-${id}">${label}</label><select id="c-${id}">${PRICES.map(([v, t]) => `<option value="${v}"${v === def ? ' selected' : ''}>${t}</option>`).join('')}</select></div>`); continue; }
      html.push(`<div class="fld"><label for="c-${id}">${label}<small>${unit}${help ? ' · ' + help : ''}</small></label><input type="number" id="c-${id}" value="${def}" step="${step}" min="${min}" max="${max}" inputmode="decimal"></div>`);
    }
    html.push('</fieldset>');
  }
  html.push('<div class="bar" style="margin-top:12px"><button type="button" class="btn" id="calcReset">Reset to design values</button></div>');
  form.innerHTML = html.join('');
  form.addEventListener('submit', e => e.preventDefault());
  const num = id => { const el = $('c-' + id), v = parseFloat(el.value); const mn = parseFloat(el.min), mx = parseFloat(el.max); return isFinite(v) ? Math.min(Math.max(v, isFinite(mn) ? mn : v), isFinite(mx) ? mx : v) : parseFloat(el.defaultValue); };
  $('c-priceSel').addEventListener('change', () => { const v = $('c-priceSel').value; if (v !== 'custom') $('c-price').value = v; calc(); });
  $('c-price').addEventListener('input', () => { const v = num('price').toFixed(2); $('c-priceSel').value = PRICES.some(p => p[0] === v) ? v : 'custom'; });
  $('calcReset').addEventListener('click', () => { form.querySelectorAll('input[type=number]').forEach(i => { i.value = i.defaultValue; }); $('c-dryer').checked = false; $('c-priceSel').value = '0.45'; calc(); });
  form.addEventListener('input', calc);
  form.addEventListener('change', calc);

  function tbl(rowsIn, head) {
    return `<table class="grid">${head ? `<thead><tr>${head.map((h, i) => `<th${i ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead>` : ''}<tbody>${rowsIn.map(r => `<tr${r[2] ? ` class="${r[2]}"` : ''}><td>${r[0]}</td><td class="n">${r[1]}</td></tr>`).join('')}</tbody></table>`;
  }
  function calc() {
    const v = {}; F.forEach(([, fs]) => fs.forEach(f => { if (f[2] !== 'bool' && f[0] !== 'priceSel') v[f[0]] = num(f[0]); }));
    const dryer = $('c-dryer').checked;
    const dli = v.ppfd * v.photo * 3600 / 1e6;
    const ledKw = areaM2 * v.ppfd / 0.9 / v.eff / 1000;
    const gm2 = v.lue * dli, dwDay = gm2 * areaM2 / 1000, dwYr = dwDay * v.days;
    const nDay = dwDay * 0.055 * 1000, pYr = dwYr * 0.009, nYr = dwYr * 0.055;
    const dTN = Math.max(v.tnIn - v.tnOut, 0.1), m3Day = nDay / dTN, galDay = m3Day * 264.17;
    const dryKwh = dryer ? (dwDay / 0.20 - dwDay / 0.90) / 2.5 : 0;           // press cake ~20% solids → 90%, SMER 2.5 kg/kWh
    const ledKwh = ledKw * v.photo, kwhDay = ledKwh + v.other + dryKwh;
    const equip = EQUIP + (dryer ? DRYER : 0), inst = equip * v.inst / 100, sub = equip + inst + v.site + v.eng, cont = sub * v.cont / 100, capex = sub + cont;
    const i = v.rate8 / 100, crf = i > 0 ? i / (1 - Math.pow(1 + i, -v.life)) : 1 / v.life, capChg = capex * crf;
    const opex = { 'Electricity': kwhDay * 365 * v.power, 'Labor': v.laborH * v.rate, 'Maintenance': equip * v.maint / 100, 'Consumables and lab tests': v.cons, 'Insurance': v.ins };
    const opexT = Object.values(opex).reduce((a, b) => a + b, 0);
    const rev = dwYr * v.price, treat = galDay * v.days * v.treat, inc = rev + treat, net = inc - opexT;
    const perKgRun = dwYr > 0 ? opexT / dwYr : 0, perKgAll = dwYr > 0 ? (opexT + capChg) / dwYr : 0;
    const be = dwYr > 0 ? (opexT + capChg - treat) / dwYr : 0;
    const pay = net > 0 ? capex / net : null;
    const kpi = (k, val, s, cls = '') => `<div class="kpi ${cls}"><div class="k">${k}</div><div class="v">${val}</div><div class="s">${s}</div></div>`;
    const out = [];
    out.push('<div class="kpis">' +
      kpi('Build cost', usd(capex), `${usd(equip)} equipment`) +
      kpi('Running cost', usd(opexT) + '/yr', `${fmt0(kwhDay)} kWh/day`) +
      kpi('Dry product', fmt0(dwYr) + ' kg/yr', `${(dwDay * 1000).toFixed(0)} g/day · ${gm2.toFixed(1)} g/m²/day`) +
      kpi('Income', usd(inc) + '/yr', `${usd(rev)} product · ${usd(treat)} treatment`) +
      kpi('Net per year', usd(net), pay ? `pays back in ${pay.toFixed(1)} years` : 'does not cover running costs', net > 0 ? 'good' : 'bad') +
      kpi('Break-even price', usd2(be) + '/kg', `vs ${usd2(v.price)}/kg assumed`, be <= v.price ? 'good' : 'bad') +
      '</div>');
    const mx = Math.max(perKgAll, perKgRun, v.price, be, 0.01);
    const bar = (label, val, acc) => `<div class="row"><span>${label}</span><div class="track"><div class="fillb${acc ? ' acc' : ''}" style="width:${Math.max(0.5, val / mx * 100).toFixed(1)}%"></div></div><span class="val">${usd2(val)}/kg</span></div>`;
    out.push('<h3>Cost per kg of dry product</h3><div class="cmp">' + bar('Product value', v.price, true) + bar('Running cost only', perKgRun) + bar('All-in, with capital', perKgAll) + bar('Break-even price', Math.max(be, 0)) +
      `<div class="cap">Capital is spread at ${v.rate8}% over ${v.life} years (${usd(capChg)}/yr). Treatment value is credited in the break-even price.</div></div>`);
    if (!dryer && v.price > 0.45) out.push(`<p class="note" style="padding:10px 0 0"><b>Note:</b> without the dryer the line ends at wet press cake, which spoils within days. Bagged or retail prices assume a dried product, so tick "Add heat-pump dryer" for those markets.</p>`);
    out.push('<div class="two"><div><h3>Production and treatment</h3>' + tbl([
      ['Growing area', `${fmt0(areaFt2)} ft² (${areaM2.toFixed(0)} m²)`],
      ['Daily light integral', `${dli.toFixed(1)} mol/m²/day`],
      ['Growth rate', `${gm2.toFixed(1)} g dry/m²/day`],
      ['Dry biomass', `${dwDay.toFixed(2)} kg/day · ${fmt0(dwYr)} kg/yr`],
      ['Fresh biomass harvested', `${fmt0(dwDay / 0.06)} kg/day`],
      ['Nitrogen captured', `${fmt0(nDay)} g/day · ${nYr.toFixed(0)} kg/yr`],
      ['Phosphorus captured', `${pYr.toFixed(1)} kg/yr`],
      ['Water treated', `${fmt0(galDay)} gal/day (${m3Day.toFixed(2)} m³/day) at ${v.tnIn} → ${v.tnOut} mg/L N`],
    ]) + '</div><div><h3>Energy</h3>' + tbl([
      ['LED lighting', `${ledKw.toFixed(1)} kW × ${v.photo} h = ${fmt0(ledKwh)} kWh/day`],
      ['Pumps, HVAC, conveyors, controls', `${fmt0(v.other)} kWh/day`],
      ['Dryer', dryer ? `${dryKwh.toFixed(1)} kWh/day` : 'not included'],
      ['Total', `${fmt0(kwhDay)} kWh/day · ${fmt0(kwhDay * 365 / 1000)} MWh/yr`, 'tot'],
      ['Electricity per kg dry product', dwYr > 0 ? `${fmt0(kwhDay * 365 / dwYr)} kWh/kg` : '–'],
    ]) + '</div></div>');
    out.push('<div class="two"><div><h3>Build cost</h3>' + tbl([
      ['Equipment (bill of materials)', usd(EQUIP)],
      ...(dryer ? [['Heat-pump dryer', usd(DRYER)]] : []),
      [`Fabrication and installation (${v.inst}%)`, usd(inst)],
      ['Site pad, power hookup, water lines', usd(v.site)],
      ['Engineering and permits', usd(v.eng)],
      [`Contingency (${v.cont}%)`, usd(cont)],
      ['Total build cost', usd(capex), 'tot'],
    ]) + '</div><div><h3>Running cost and income per year</h3>' + tbl([
      ...Object.entries(opex).map(([k, val]) => [k, usd(val)]),
      ['Total running cost', usd(opexT), 'tot'],
      [`Product (${fmt0(dwYr)} kg × ${usd2(v.price)})`, usd(rev)],
      [`Treatment (${fmt0(galDay * v.days)} gal × $${v.treat})`, usd(treat)],
      ['Net before capital', usd(net), 'tot'],
    ]) + '</div></div>');
    out.push(`<p class="note" style="padding:14px 0 0">Assumptions: tissue nitrogen 5.5% and phosphorus 0.9% of dry weight, 90% of LED light lands on the runs, living duckweed is about 6% dry matter. These are planning figures, not measured results; a growth trial on the actual water is the way to confirm them.</p>`);
    $('calcRes').innerHTML = out.join('');
  }
  calc();
})();
