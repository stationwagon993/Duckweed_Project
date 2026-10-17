"""DW-200 treatment pod - sizing, mass, nutrient, energy and cost balance.

Run:  python3 model/mass_balance.py            (prints the tables used in SYSTEM_DESIGN.md)
Edit the ASSUMPTIONS block to re-run for a different site or wastewater stream.
"""

# ---------------- ASSUMPTIONS (one grow trailer unless noted) ----------------
FT2_M2 = 0.092903
GROW_AREA_FT2 = 1920          # 16 runs x 40' x 3' (DW-100 geometry, unchanged)
PPFD = 130                    # umol/m2/s at the mat
PHOTOPERIOD_H = 20            # h/day, 4 h dark scheduled into the utility on-peak window
LED_EFFICACY = 3.0            # umol/J at fixture
PHOTON_CAPTURE = 0.90         # fraction of emitted photons landing on the run
LUE_DESIGN, LUE_TARGET = 0.75, 0.95   # g dry weight per mol PAR intercepted
STANDING_CROP_GFW = 600       # g fresh weight / m2 kept after each harvest
DM_FRESH = 0.06               # dry-matter fraction of fresh duckweed
N_DW, P_DW, K_DW = 0.055, 0.009, 0.030   # tissue fractions when grown on wastewater
DS_DRAINED = 0.055            # dry solids after drained belt + vibratory screen (no press; living fronds are ~94% water)
DS_PRODUCT = 0.90             # dried meal / pellet
SMER = 2.5                    # heat-pump dryer, kg water per kWh
OP_DAYS = 350
EVAP_MM_D = 1.25              # evapotranspiration, mm/day (condensate is recovered)
BASE_LOADS_KWH_D = {          # non-LED loads per trailer, annual-average kWh/day
    "Recirculation pump (0.75 kW, 24 h)": 18,
    "Harvest conveyors, screen, auger": 6,
    "HVAC (mini-split summer / HRV winter, avg)": 32,
    "Controls, sensors, actuators": 5,
}
TRAILERS_PER_POD = 2
PROCESS_MODULE_KWH_D = 35     # pretreatment aeration + pumps, heat-pump dryer, mill, lights, freeze protection (pod)
POWER_PRICE = 0.11            # $/kWh, Wisconsin small-commercial / farm average
STREAMS = {                   # influent total N mg/L, total P mg/L, target effluent TN
    "Aquaculture (RAS) effluent": (30, 6, 5),
    "Dairy parlor wash water, screened": (120, 25, 10),
    "Dairy lagoon supernatant": (600, 90, 10),
}
PRODUCT_PRICES = {            # $/kg dry product
    "Bulk soil amendment": 0.45,
    "Bagged specialty organic fertilizer (wholesale)": 2.50,
    "Protein / extraction feedstock": 6.00,
}

# ---------------- CALCULATIONS ----------------
area = GROW_AREA_FT2 * FT2_M2
dli = PPFD * PHOTOPERIOD_H * 3600 / 1e6
led_kw = area * PPFD / PHOTON_CAPTURE / LED_EFFICACY / 1000
led_kwh = led_kw * PHOTOPERIOD_H

def row(lue):
    g = lue * dli                       # g DW / m2 / d
    dw = g * area / 1000                # kg DW / d / trailer
    return dict(g=g, dw=dw, fw=dw / DM_FRESH, n=dw * N_DW * 1000, p=dw * P_DW * 1000,
                k=dw * K_DW * 1000, rgr=g / (STANDING_CROP_GFW * DM_FRESH))

d, t = row(LUE_DESIGN), row(LUE_TARGET)
drained = lambda dw: dw / DS_DRAINED
water_dried = lambda dw: dw / DS_DRAINED - dw / DS_PRODUCT
dryer_kwh = lambda dw: water_dried(dw) / SMER
other = sum(BASE_LOADS_KWH_D.values())
trailer_kwh = led_kwh + other
pod_kwh = TRAILERS_PER_POD * trailer_kwh + PROCESS_MODULE_KWH_D
evap = area * EVAP_MM_D / 1000

def p(*a): print(*a)
p("## Per grow trailer")
p(f"| Growing area | {GROW_AREA_FT2:,} ft² = {area:.1f} m² |")
p(f"| Light | {PPFD} µmol/m²/s × {PHOTOPERIOD_H} h = DLI {dli:.1f} mol/m²/d |")
p(f"| LED electrical load | {led_kw:.1f} kW → {led_kwh:.0f} kWh/d |")
for lbl, r in (("Design", d), ("Target", t)):
    p(f"| {lbl} yield | {r['g']:.1f} g DW/m²/d → {r['dw']:.2f} kg DW/d ({r['fw']:.0f} kg fresh/d), RGR {r['rgr']:.2f}/d |")
    p(f"| {lbl} uptake | N {r['n']:.0f} g/d · P {r['p']:.1f} g/d · K {r['k']:.0f} g/d |")
p(f"| Drained biomass to dryer | {drained(d['dw']):.0f}–{drained(t['dw']):.0f} kg/d at {DS_DRAINED:.0%} DS |")
p(f"| Water evaporated in dryer | {water_dried(d['dw']):.0f}–{water_dried(t['dw']):.0f} kg/d → {dryer_kwh(d['dw']):.1f}–{dryer_kwh(t['dw']):.1f} kWh/d |")
p(f"| Evapotranspiration (recovered as condensate) | {evap*1000:.0f} L/d |")
p(f"| Energy | LED {led_kwh:.0f} + other {other} = {trailer_kwh:.0f} kWh/d |")
p(f"| kWh per kg DW | {trailer_kwh/d['dw']:.0f} (design) – {trailer_kwh/t['dw']:.0f} (target) |")

p("\n## Hydraulic capacity per trailer (plant uptake only)")
p("| Stream | TN in → out mg/L | Feed m³/d | gal/d | HRT in 13.6 m³ (d) | P removed % |")
for s, (tn, tp, out) in STREAMS.items():
    for lbl, r in (("design", d), ("target", t)):
        q = r['n'] / (tn - out)              # g/d ÷ g/m3
        p(f"| {s} ({lbl}) | {tn} → {out} | {q:.2f} | {q*264.17:.0f} | {13.6/q:.1f} | {min(100, r['p']/(q*tp)*100):.0f} |")

p(f"\n## Pod ({TRAILERS_PER_POD} trailers + process module)")
dwy = TRAILERS_PER_POD * d['dw'] * OP_DAYS / DS_PRODUCT
dwy_t = TRAILERS_PER_POD * t['dw'] * OP_DAYS / DS_PRODUCT
p(f"| Dried product | {dwy:,.0f}–{dwy_t:,.0f} kg/yr at {DS_PRODUCT:.0%} DS |")
p(f"| N removed in biomass | {TRAILERS_PER_POD*d['n']*OP_DAYS/1000:.0f}–{TRAILERS_PER_POD*t['n']*OP_DAYS/1000:.0f} kg/yr |")
p(f"| P removed in biomass | {TRAILERS_PER_POD*d['p']*OP_DAYS/1000:.1f}–{TRAILERS_PER_POD*t['p']*OP_DAYS/1000:.1f} kg/yr |")
p(f"| Electricity | {pod_kwh:.0f} kWh/d = {pod_kwh*365/1000:.0f} MWh/yr = ${pod_kwh*365*POWER_PRICE:,.0f}/yr |")
for k, v in PRODUCT_PRICES.items():
    p(f"| Product revenue @ {k} ${v}/kg | ${dwy*v:,.0f}–${dwy_t*v:,.0f}/yr |")
n_kg = TRAILERS_PER_POD * d['n'] * OP_DAYS / 1000
p(f"| Electricity per kg N removed | {pod_kwh*365/n_kg:,.0f} kWh/kg N (${pod_kwh*365*POWER_PRICE/n_kg:,.0f}/kg N) |")
p(f"| Break-even product price on power alone | ${pod_kwh*365*POWER_PRICE/dwy:.2f}/kg (design), ${pod_kwh*365*POWER_PRICE/dwy_t:.2f}/kg (target) |")

# ---------------- POD STREAM TABLE (lead -> polish in series, design case) ----------------
STREAM = "Dairy parlor wash water, screened"
tn, tp, out = STREAMS[STREAM]
n_lead = n_pol = d['n']
q = (n_lead + n_pol) / (tn - out)                       # m3/d fed to the pod
c_mid = (q * tn - n_lead) / q
p_mid = max(0, (q * tp - d['p']) / q)
p_out = max(0, (q * tp - 2 * d['p']) / q)
p(f"\n## Pod stream table - {STREAM}, design yield, trailers in series")
p("| # | Stream | Flow | TN mg/L | TP mg/L | Notes |")
p(f"| S1 | Raw wastewater to screen | {q*1.03:.2f} m³/d | {tn} | {tp} | +3% sludge purge |")
p(f"| S2 | Pretreated feed, dosed to lead trailer | {q:.2f} m³/d ({q*264.17:.0f} gal/d) | {tn} | {tp} | BOD cut in aerated EQ |")
p(f"| S3 | Lead trailer bleed → polish trailer | {q:.2f} m³/d | {c_mid:.0f} | {p_mid:.1f} | |")
p(f"| S4 | Treated effluent | {q:.2f} m³/d | {out} | {p_out:.1f} | to storage / irrigation |")
p(f"| S5 | Condensate, returned in each trailer | {evap*1000:.0f} L/d each | ~0 | ~0 | internal |")
p(f"| S6 | Drained biomass to process module | {2*drained(d['dw']):.0f} kg/d | {N_DW*DS_DRAINED*1e6:,.0f} mg/kg | | {DS_DRAINED:.1%} DS |")
p(f"| S7 | Dried product | {2*d['dw']/DS_PRODUCT:.1f} kg/d | {N_DW*100*DS_PRODUCT:.1f}% N | {P_DW*100*DS_PRODUCT:.2f}% P | {DS_PRODUCT:.0%} DS |")

p("\n## Power-price sensitivity (break-even product price, design yield)")
for price in (0.11, 0.07, 0.04):
    p(f"| ${price}/kWh | ${pod_kwh*365*price/dwy:.2f}/kg |")
