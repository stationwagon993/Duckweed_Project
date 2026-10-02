"""Generates pfd.svg (process flow diagram + stream table) for the DW-200 pod. Run: python3 model/pfd.py"""
W, H = 1800, 1060
C = dict(bg='#101418', panel='#141a1f', line='#2a333c', fg='#e6ecf0', muted='#93a3b0', dim='#ffc65c',
         s1='#a07a46', s2='#a77df0', s3='#3fd0b0', s4='#4fa8ff', s8='#8a6a46', bio='#7ccf45', prod='#ffc65c', ret='#6fa3a0')
out = []
def o(s): out.append(s)
from html import escape as esc
o(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="Barlow Semi Condensed, Arial Narrow, Arial, sans-serif">')
o(f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>')
o('<defs>' + ''.join(f'<marker id="a-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{v}"/></marker>' for k, v in C.items()) + '</defs>')
o(f'<text x="40" y="52" fill="{C["fg"]}" font-size="30" font-weight="700">DW-200 Duckweed Treatment Pod · Process Flow Diagram · Rev C</text>')
o(f'<text x="40" y="80" fill="{C["muted"]}" font-size="15" font-family="IBM Plex Mono, monospace">Design case: screened dairy parlor wash water, 2 grow trailers in series (lead → polish), design yield 7.0 g DW/m²/d. Numbers from model/mass_balance.py</text>')

def zone(x, y, w, h, title, bottom=False):
    o(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{C["line"]}" stroke-dasharray="6 5" rx="6"/>')
    o(f'<text x="{x+12}" y="{y+h-10 if bottom else y+22}" fill="{C["muted"]}" font-size="13" font-weight="700" letter-spacing="1.5">{esc(title)}</text>')
def unit(x, y, w, h, tagtxt, name, sub='', accent=C['fg']):
    o(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{C["panel"]}" stroke="{accent}" stroke-width="1.6" rx="4"/>')
    o(f'<text x="{x+w/2}" y="{y+22}" text-anchor="middle" fill="{C["dim"]}" font-size="12.5" font-family="IBM Plex Mono, monospace" font-weight="600">{esc(tagtxt)}</text>')
    o(f'<text x="{x+w/2}" y="{y+43}" text-anchor="middle" fill="{C["fg"]}" font-size="16" font-weight="600">{esc(name)}</text>')
    for i, line in enumerate(sub.split('|') if sub else []):
        o(f'<text x="{x+w/2}" y="{y+62+i*16}" text-anchor="middle" fill="{C["muted"]}" font-size="12.5" font-family="IBM Plex Mono, monospace">{esc(line)}</text>')
def arrow(pts, k, label=None, lpos=None, dash=False, w=3):
    d = 'M' + ' L'.join(f'{x},{y}' for x, y in pts)
    da = 'stroke-dasharray="9 6"' if dash else ''
    o(f'<path d="{d}" fill="none" stroke="{C[k]}" stroke-width="{w}" {da} marker-end="url(#a-{k})"/>')
    if label:
        x, y = lpos
        tw = 8.2 * len(label) + 10
        o(f'<rect x="{x-tw/2}" y="{y-11}" width="{tw}" height="20" rx="3" fill="{C[k]}"/>')
        o(f'<text x="{x}" y="{y+4}" text-anchor="middle" fill="#0c0f12" font-size="12.5" font-weight="700" font-family="IBM Plex Mono, monospace">{esc(label)}</text>')

# zones
zone(30, 110, 300, 400, 'SOURCE (HOST SITE)')
zone(350, 110, 640, 400, 'PM-1 · BAY A · PRETREATMENT & DOSING')
zone(1010, 110, 760, 400, 'GROW TRAILERS · LEAD → POLISH IN SERIES')
zone(350, 540, 1420, 215, 'HARVEST, CONCENTRATION & PRODUCT (TRAILER REAR BAY → PM-1 BAY C)', bottom=True)

# source
unit(60, 170, 240, 100, 'SRC', 'Wastewater source', 'lagoon / parlor sump|TN 120 · TP 25 mg/L', C['s1'])
unit(60, 330, 240, 100, 'P-001', 'Intake pump + float', '⅓ hp · heat-traced 1½" line')
# bay A
unit(380, 170, 170, 110, 'SC-101', 'Wedge-wire sieve', '0.5 mm')
unit(580, 170, 170, 110, 'TK-101', 'Settler 550 gal', 'cone bottom|weekly sludge draw')
unit(780, 170, 180, 110, 'TK-102', 'Aerated EQ 550 gal', 'MBBR media · 80 L/min|BOD −70–85%')
unit(780, 340, 180, 110, 'TK-103', 'Feed tank 300 gal', 'NH₄/NO₃ ISE · pH')
unit(560, 340, 190, 110, 'P-201/202', 'Dosing pumps', 'peristaltic 0–2 L/min|on NH₄-N demand')
# trailers
unit(1050, 170, 300, 150, 'GT-1 · LEAD', '16 runs × 8 tiers · 178 m²', 'NH₄-N held 15–25 mg/L|130 µmol/m²/s · 20 h|uptake ≈ 69 g N/d', C['s3'])
unit(1430, 170, 300, 150, 'GT-2 · POLISH', '16 runs × 8 tiers · 178 m²', 'releases at TN < 10 mg/L|uptake ≈ 69 g N/d', C['s4'])
unit(1430, 380, 300, 100, 'TK-301', 'Treated effluent 3,000 gal', 'insulated · heat-traced|→ irrigation / NMP', C['s4'])
unit(1050, 380, 300, 100, 'HVAC', 'Heat pump + HRV + dehum.', 'condensate 223 L/d → return tank')
# harvest / product
unit(380, 580, 170, 130, 'CV-1…16', 'Flush-grid conveyors', 'harvest ⅔ of run|3–4 runs/day/trailer')
unit(590, 580, 170, 130, 'VS-1', 'Vibratory screen', '60 mesh · 5.5% DS|underflow → return')
unit(800, 580, 170, 130, 'BIN', 'Lidded bins + cart', '≈ 46 kg/d|one trip daily')
unit(1010, 580, 170, 130, 'DR-301', 'Heat-pump dryer', '50–55 °C · SMER 2.5|≈ 19 kWh/d (pod)')
unit(1220, 580, 160, 130, 'HM / PM', 'Mill · pellet mill', '3 mm · 6 mm die|weekly batch')
unit(1420, 580, 160, 130, 'BAG', 'Bag & label', '25 lb · lot-coded|QA per lot')
unit(1610, 580, 140, 130, 'PRODUCT', 'Dry 5-2-3 meal', '2.8 kg/d|1.0–1.2 t/yr', C['prod'])

# streams
arrow([(180, 270), (180, 330)], 's1')
arrow([(300, 380), (340, 380), (340, 225), (380, 225)], 's1', 'S1', (340, 300))
arrow([(550, 225), (580, 225)], 's1')
arrow([(750, 225), (780, 225)], 's1')
arrow([(870, 280), (870, 340)], 's2')
arrow([(780, 395), (750, 395)], 's2')
arrow([(655, 340), (655, 310), (1000, 310), (1000, 245), (1050, 245)], 's2', 'S2  1.25 m³/d · TN 120', (765, 310))
arrow([(1350, 245), (1430, 245)], 's3', 'S3 · TN 65', (1390, 222))
arrow([(1520, 320), (1520, 380)], 's4', 'S4 · TN 10', (1578, 352))
arrow([(1580, 480), (1580, 512)], 's4')
o(f'<text x="1592" y="508" text-anchor="start" fill="{C["s4"]}" font-size="12.5" font-family="IBM Plex Mono, monospace">to land application</text>')
arrow([(665, 280), (665, 300), (520, 300), (520, 480), (230, 480), (230, 440)], 's8', 'S8 sludge', (430, 480))
arrow([(1200, 380), (1200, 320)], 'ret', 'S5', (1225, 352))
# biomass
arrow([(1070, 320), (1070, 350), (1010, 350), (1010, 525), (465, 525), (465, 580)], 'bio', None, None, True)
arrow([(1640, 320), (1640, 350), (1745, 350), (1745, 525), (1010, 525)], 'bio', None, None, True)
arrow([(550, 645), (590, 645)], 'bio', dash=True)
arrow([(760, 645), (800, 645)], 'bio', 'S6', (780, 622), dash=True)
arrow([(970, 645), (1010, 645)], 'bio', dash=True)
arrow([(1180, 645), (1220, 645)], 'prod', dash=True)
arrow([(1380, 645), (1420, 645)], 'prod', dash=True)
arrow([(1580, 645), (1610, 645)], 'prod', 'S7', (1595, 622), dash=True)
arrow([(675, 710), (675, 721), (990, 721), (990, 465), (1050, 465)], 'ret', 'screen underflow → return tank', (830, 721))

# stream table
ty = 770
o(f'<rect x="30" y="{ty}" width="1740" height="270" fill="{C["panel"]}" stroke="{C["line"]}" rx="6"/>')
cols = [(50, '#'), (110, 'Description'), (560, 'Flow'), (820, 'TN'), (960, 'TP'), (1100, 'Notes')]
for x, t in cols: o(f'<text x="{x}" y="{ty+30}" fill="{C["muted"]}" font-size="12.5" font-weight="700" letter-spacing="1.2">{t.upper()}</text>')
rows = [
 ('S1', 's1', 'Raw wastewater to sieve', '1.29 m³/d', '120 mg/L', '25 mg/L', 'includes ~3% sludge purge'),
 ('S2', 's2', 'Pretreated feed, dosed to GT-1', '1.25 m³/d · 331 gal/d', '120 mg/L', '25 mg/L', 'BOD cut 70–85% in aerated EQ; partial nitrification'),
 ('S3', 's3', 'GT-1 rear-weir bleed → GT-2', '1.25 m³/d', '65 mg/L', '16 mg/L', 'drawn only while GT-1 doses'),
 ('S4', 's4', 'Treated effluent', '1.25 m³/d', '10 mg/L', '7 mg/L', 'P in excess of uptake: optional iron-media polish'),
 ('S5', 'ret', 'Condensate, each trailer', '223 L/d', '~0', '~0', 'returned to own return tank (internal)'),
 ('S6', 'bio', 'Drained biomass → dryer', '46 kg/d', '5.5% DS', '', 'no press: all captured N/P stays in product'),
 ('S7', 'prod', 'Dry product', '2.8 kg/d · 1.0–1.2 t/yr', '5.0% N', '0.81% P', '≈ 5-2-3 · 90% DS'),
 ('S8', 's8', 'Settled sludge → source', '≈ 40 L/d', '', '', 'weekly draw from TK-101 cone'),
]
for i, (s, k, d, f, n, p, note) in enumerate(rows):
    y = ty + 58 + i * 26
    o(f'<line x1="40" x2="1760" y1="{y-18}" y2="{y-18}" stroke="{C["line"]}"/>')
    o(f'<rect x="50" y="{y-13}" width="40" height="18" rx="3" fill="{C[k]}"/><text x="70" y="{y+1}" text-anchor="middle" fill="#0c0f12" font-size="12" font-weight="700" font-family="IBM Plex Mono, monospace">{s}</text>')
    for x, t, col in ((110, d, C['fg']), (560, f, C['fg']), (820, n, C['fg']), (960, p, C['fg']), (1100, note, C['muted'])):
        ff = 'IBM Plex Mono, monospace' if x in (560, 820, 960) else 'Barlow Semi Condensed, Arial Narrow, Arial, sans-serif'
        o(f'<text x="{x}" y="{y+1}" fill="{col}" font-size="13.5" font-family="{ff}">{esc(t)}</text>')
o('</svg>')
open('pfd.svg', 'w').write('\n'.join(out))
print('wrote pfd.svg')
