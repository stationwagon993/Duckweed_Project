"""DW-F farm duckweed system: size and cost a standalone, modular, sunlight-first install
from a farm's wastewater flow and strength.

    python3 farm-system/farm_sizing.py                      # sizing table: 1k, 5k, 20k, 100k gal/d
    python3 farm-system/farm_sizing.py --gpd 3500 --tn 120 --tp 25 --module LT --dry   # one site, all line items

Sizing rule (per site):
    N to remove (kg/yr) = inflow x TN_in - effluent x TN_out        (mass basis, effluent shrinks by evaporation)
    water area (m2)     = N to remove / (growth g DW/m2/d x tissue N x growing days)
    water area          >= season flow x minimum HRT / depth         (hydraulic floor for dilute streams)
    modules             = ceil(water area / module water area)
Everything is a planning estimate in 2026 USD (not quotes). Growth, tissue N, season length and
unit prices are the uncertain numbers; edit MODULES / SITE / OPS or pass flags. The interactive
tool farm-sizing-tool.html uses the same numbers and must be kept in step with this file.
"""
import argparse, math

GAL_M3 = 0.0037854
M2_FT2 = 10.7639
M2_ACRE = 4046.86

# ---------------- MODULE CATALOG ----------------
# area_m2 = water (growing) surface; depth_m = operating depth; days = growing days/yr (Wisconsin-type climate);
# g = (design, target) growth in g dry weight per m2 per day averaged over those days;
# et_mm = evapotranspiration in season, rain_mm = rain landing on the water in season (open only), mm/day.
MODULES = {
    "LT": dict(
        name="Low-tunnel lined-lane module, 30' x 96' pad, 4 lanes each under its own 3'-high film tunnel",
        area_m2=212, depth_m=0.20, days=190, g=(6.5, 8.0), et_mm=2.5, rain_mm=0.0, install_pct=0.10,
        footprint_m2=30 * 96 / M2_FT2 * 1.30,
        bom=[
            ("Grade pad to +/-1/2\", 2\" sand bed (farm equipment)", 1, "lot", 1200),
            ("Lane walls: PT 2x12 on edge + stakes (8\" water, 3\" freeboard)", 560, "lf", 2.60),
            ("Geotextile underlay, 8 oz non-woven", 3300, "ft2", 0.15),
            ("Pond liner, 20 mil reinforced PE, one piece 34'x100'", 3400, "ft2", 0.44),
            ("Low-tunnel hoops: 1/2\" EMT bent 10' sticks, 5' o.c., bolted to lane walls", 80, "ea", 7.00),
            ("Tunnel film, 6 mil UV poly 14'x100', one per lane", 4, "ea", 140),
            ("Ridge rope, tie-downs, film clips, end ties", 4, "set", 150),
            ("Shade / insect net 30%, swaps for film Jun-Aug", 4, "ea", 150),
            ("Inlet spreader + outlet weir box with adjustable standpipe (level control)", 1, "set", 450),
            ("4\" PVC interconnect to next module + fittings", 1, "lot", 350),
            ("Floating mat barriers across lanes (sealed 1-1/2\" PVC)", 1, "lot", 250),
            ("Harvest trough at lane ends, rope-drawn floating push boom, hand skimmer", 1, "set", 500),
            ("Fasteners, sealant, labels", 1, "lot", 300),
        ]),
    "H30": dict(
        name="Hoop-house module, 30' x 96' cold frame, 4 serpentine lined lanes",
        area_m2=212, depth_m=0.20, days=210, g=(6.5, 8.0), et_mm=3.5, rain_mm=3.0 * 267 / 212, install_pct=0.15,
        footprint_m2=30 * 96 / M2_FT2 * 1.35,           # + 35% for spacing, roads, snow shed
        bom=[  # (item, qty, unit, unit $)
            ("Cold-frame hoop kit 30'x96', 14-ga galv. bows 4' o.c., purlins, hardware", 1, "kit", 8500),
            ("Greenhouse film, 6 mil 4-yr UV poly, 42'x100'", 1, "sheet", 650),
            ("Lock channel + wiggle wire", 400, "lf", 1.10),
            ("End walls: PT 2x4 framing, poly or twin-wall, 1 man door", 2, "ea", 550),
            ("Roll-up side kits, hand crank", 2, "ea", 350),
            ("Insect / bird mesh on side openings, 4' x 96'", 2, "ea", 175),
            ("Shade cloth 30%, summer only", 1, "ea", 550),
            ("PT 2x6 baseboard + ground posts", 1, "lot", 500),
            ("Grade pad to +/-1/2\", 2\" sand bed (farm equipment)", 1, "lot", 1200),
            ("Lane walls: PT 2x12 on edge + stakes (8\" water, 3\" freeboard)", 560, "lf", 2.60),
            ("Geotextile underlay, 8 oz non-woven", 3300, "ft2", 0.15),
            ("Pond liner, 20 mil reinforced PE, one piece 34'x100'", 3400, "ft2", 0.44),
            ("Inlet spreader + outlet weir box with adjustable standpipe (level control)", 1, "set", 450),
            ("4\" PVC interconnect to next module + fittings", 1, "lot", 350),
            ("Floating mat barriers across lanes (sealed 1-1/2\" PVC)", 1, "lot", 250),
            ("Harvest trough at lane ends, hand skimmer, floating push boom", 1, "set", 500),
            ("Gutters both sides, downspouts into lane inlets (roof rain offsets evaporation)", 192, "lf", 3.00),
            ("Fasteners, sealant, labels", 1, "lot", 300),
        ]),
    "OL": dict(
        name="Open lined-lane module, same 4 lanes with overhead bird net, no cover",
        area_m2=212, depth_m=0.20, days=150, g=(7.0, 9.0), et_mm=4.0, rain_mm=3.0, install_pct=0.10,
        footprint_m2=30 * 96 / M2_FT2 * 1.25,
        bom=[
            ("Grade pad to +/-1/2\", 2\" sand bed (farm equipment)", 1, "lot", 1200),
            ("Lane walls: PT 2x12 on edge + stakes (8\" water, 3\" freeboard)", 560, "lf", 2.60),
            ("Geotextile underlay, 8 oz non-woven", 3300, "ft2", 0.15),
            ("Pond liner, 20 mil reinforced PE, one piece 34'x100'", 3400, "ft2", 0.44),
            ("Inlet spreader + outlet weir box with adjustable standpipe (level control)", 1, "set", 450),
            ("4\" PVC interconnect to next module + fittings", 1, "lot", 350),
            ("Floating wind grid, sealed PVC every 10'", 1, "lot", 400),
            ("Harvest trough at lane ends, hand skimmer, floating push boom", 1, "set", 500),
            ("Overhead bird net on cable + posts (waterfowl spread duckweed)", 1, "lot", 900),
            ("Fasteners, sealant, labels", 1, "lot", 300),
        ]),
    "P1000": dict(
        name="Large open basin, ~1,000 m2 (1/4 acre), earthen berms, 4 lanes, lined",
        area_m2=1000, depth_m=0.30, days=150, g=(6.5, 8.5), et_mm=4.5, rain_mm=3.0, install_pct=0.05,
        footprint_m2=1000 * 1.6,
        bom=[
            ("Excavation, berms and lane baffles (contractor)", 1300, "m2", 2.70),
            ("Pond liner, 30 mil reinforced PE", 14000, "ft2", 0.40),
            ("Geotextile where subgrade is rocky (allowance)", 1, "lot", 1500),
            ("Inlet and outlet structures, adjustable weir", 1, "set", 1200),
            ("Floating wind grid (PVC + rope)", 1, "lot", 1200),
            ("Overhead bird net on cable + posts", 1, "lot", 2500),
            ("Harvest trough and skimmer", 1, "set", 800),
            ("Piping to next basin", 1, "lot", 800),
            ("Misc", 1, "lot", 600),
        ]),
    "C40": dict(  # existing container design for comparison (container-40ft/, PR #3 itemized BOM)
        name="40' container, LED-lit, 16 stacked runs (existing design, comparison)",
        area_m2=138, depth_m=0.076, days=350, g=(7.0, 8.9), et_mm=0.0, rain_mm=0.0, install_pct=0.0,
        footprint_m2=40 * 8 / M2_FT2 * 2.0, power_kwh_d=192,
        bom=[("40' HC container build, itemized BOM incl. install (container-40ft dashboard)", 1, "ea", 296000)]),
}

# ---------------- PLANT / PROCESS ----------------
N_DW, P_DW = 0.055, 0.009        # tissue N and P, fraction of dry weight, wastewater-grown (confirm by lab)
DM_FRESH = 0.06                  # dry matter of fresh duckweed
DS_DRAINED = 0.055               # after gravity screen (no press: press juice carries N back out)
DS_PRODUCT = 0.90                # dried meal
BIO_N_CREDIT = 0.0               # extra N loss by nitrification/denitrification on walls; literature 0.2-0.4, design takes 0
C_MAX = 40.0                     # mg/L TN at module inlet (free ammonia toxicity); stronger feed is blended with effluent
HRT_MIN_D = 5.0                  # hydraulic floor so dilute streams still get contact time
HARVEST_EVERY_D = 3

# ---------------- SITE (shared, scaled by flow / output) ----------------
PUMP_HEAD_M, PUMP_EFF = 4.0, 0.40
def site_bom(q_season_m3d, q_pump_m3d, fresh_kg_d, n_mod, recirc):
    gpd = q_season_m3d / GAL_M3
    settle_gal = max(500, gpd * 0.5)                                 # half-day settling
    settle = settle_gal * 0.90 if settle_gal <= 10000 else 9000 + (settle_gal - 10000) * 0.20  # poly tank -> lined basin
    pump_gpm = q_pump_m3d / GAL_M3 / 1440
    items = [
        ("Intake: submersible effluent pump + float switch + check valve", 1, "set", 700 if gpd < 15000 else 2500 + 25 * pump_gpm),
        ("Screen: inclined wedge-wire / bag screen, 0.5-1 mm", 1, "ea", 1500 if gpd < 15000 else 6000),
        (f"Settling tank / basin, {settle_gal:,.0f} gal (half day)", 1, "lot", settle),
        ("Header + blend box with float valve (gravity feed to modules)", 1, "ea", 800 if gpd < 15000 else 2500),
        ("Main supply line, 2-6\" PVC, buried below frost where year-round", 1, "lot", 1000 + 150 * n_mod),
        ("Dewatering: inclined screen + drain table, per 500 kg fresh/d", max(1, math.ceil(fresh_kg_d / 500)), "ea", 2500),
        ("Harvest cart, lidded bins, platform scale", 1, "set", 800 + 100 * n_mod),
        ("Field meters: pH/EC/DO/temp + NH4/NO3/PO4 photometer + level alarms", 1, "set", 3000),
        ("Winter inoculum bank: 2 IBC half-totes, LED shop lights, aquarium heater", 1, "set", 1500),
        ("Electrical: one 240 V circuit + GFCI to pumps and inoculum bank", 1, "lot", 2500 if gpd < 15000 else 6000),
    ]
    if recirc > 0:
        items.append(("Recirculation pump to blend strong feed (low head)", 1, "set", 900 + 15 * pump_gpm))
    return items

ENG_FIXED, ENG_PCT, CONTINGENCY = 5000, 0.03, 0.20

# ---------------- RECLAIMED / RECYCLED MATERIALS (materials="reclaimed") ----------------
# Each entry swaps a BOM line that STARTS WITH the prefix for a reclaimed alternative.
# factor = reclaimed cost / new cost for that line (collection, cleaning and haul included, labor is extra below).
# Items left out (grading, fasteners, meters, electrical) stay new: no saving, or safety/accuracy matters.
RECLAIM = [  # (prefix, reclaimed alternative, factor, where to get it, risk / limit)
    ("Pond liner, 20 mil", "Retired billboard vinyl, ~6 sheets 14'x48' per module, 2' overlaps + seam tape", 0.15,
     "Billboard and sign companies; often free or $25-75 per sheet", "PVC with printed inks: fine for the fertilizer route, not for feed or food. Check every sheet for holes; 3-5 yr life"),
    ("Pond liner, 30 mil", "Compacted on-site clay (if subsoil is >20% clay), patched with billboard vinyl", 0.25,
     "Own subsoil; soil test and a compaction pass", "Needs a percolation test and may need DNR sign-off; seepage risk on sandy sites"),
    ("Geotextile", "Old carpet, worn hay or silage tarps, or 2\" more sand", 0.20,
     "Carpet installers, the farm's own tarps", "Pick out nails and staples; carpet only under the liner, never in contact with water"),
    ("Lane walls", "Reclaimed 2x12 / barn planks or doubled pallet deck boards (untreated)", 0.40,
     "Barn tear-downs, pallet yards (heat-treated 'HT' stamp only)", "Never old CCA, creosote or methyl-bromide ('MB') pallets; untreated wood lasts 3-6 seasons"),
    ("Low-tunnel hoops", "Used chain-link fence top rail (1-3/8\") bent on a hoop bender", 0.30,
     "Fence contractors' tear-outs", "Check for rust at joints; cut out crushed sections"),
    ("Tunnel film", "Used greenhouse film from greenhouse re-skins", 0.10,
     "Commercial greenhouses replace film every 4 yr", "Aged film passes ~10-15% less light; expect 1-2 seasons; wash before use"),
    ("Greenhouse film", "Used greenhouse film from greenhouse re-skins", 0.10,
     "Commercial greenhouses replace film every 4 yr", "Aged film passes ~10-15% less light; expect 1-2 seasons"),
    ("Ridge rope", "Baler twine, reclaimed rope, scrap rebar stakes", 0.30, "The farm itself", "Polypropylene twine degrades in UV in ~2 seasons; replace yearly"),
    ("Shade / insect net", "Used shade cloth or orchard netting", 0.30, "Nurseries, orchards", "Patch holes so waterfowl and frogs stay out"),
    ("Inlet spreader", "Cut-down IBC tote as weir box + reclaimed PVC standpipe", 0.40,
     "IBC resellers ($50-100), food-grade history only", "Ask what the tote held: food-grade (syrup, juice, oils) only, never chemicals or pesticides"),
    ("4\" PVC interconnect", "Used irrigation pipe or field drain tile", 0.40, "Farm auctions, irrigation dealers' trade-ins", "Pressure-test joints; gravity flow only"),
    ("Floating mat barriers", "Capped reclaimed PVC, or sealed 2-L bottles strung on rope", 0.20, "Scrap bins, recycling", "Bottles go brittle in UV; check each season"),
    ("Harvest trough", "Split 55-gal food-grade drums or half-culvert, PVC + pool-noodle push boom", 0.40,
     "Food plants and car washes sell drums; road-crew culvert offcuts", "Food-grade drums only; deburr culvert edges so the liner is not cut"),
    ("Cold-frame hoop kit", "Used greenhouse frame bought at a dismantle, picked up and re-erected", 0.40,
     "Greenhouse closures, farm auctions, classifieds", "Missing parts and labor to dismantle; check bows for kinks; may not meet local snow load"),
    ("Lock channel", "Reused lock channel and wire from the dismantled frame", 0.50, "Same dismantle", "Replace bent sections"),
    ("End walls", "Reclaimed lumber with old storm doors and windows", 0.40, "Habitat ReStore, demolition", "Seal gaps; glass needs safety film"),
    ("Insect / bird mesh", "Used orchard or fishing net", 0.30, "Orchards, net lofts", "Mesh small enough to stop birds"),
    ("Shade cloth", "Used shade cloth", 0.30, "Nurseries", ""),
    ("PT 2x6 baseboard", "Reclaimed lumber baseboard on salvaged fence posts", 0.40, "Barn tear-downs", "Avoid CCA and creosote"),
    ("Gutters", "Salvaged gutters or PVC pipe split lengthwise", 0.30, "Roofing contractors, scrap", ""),
    ("Floating wind grid", "Reclaimed PVC and rope", 0.30, "Scrap bins", ""),
    ("Overhead bird net", "Used orchard or fishing net on reclaimed fence posts and wire", 0.30, "Orchards, fence tear-outs", "Re-tension each spring"),
    ("Geotextile where subgrade", "Old carpet or worn tarps", 0.20, "Carpet installers", "Under liner only"),
    ("Inlet and outlet structures", "Culvert offcuts and IBC totes", 0.40, "Road crews, IBC resellers", "Food-grade totes only"),
    ("Harvest trough and skimmer", "Split drums / culvert, pool-noodle boom", 0.40, "As above", ""),
    ("Piping to next basin", "Used irrigation pipe or drain tile", 0.40, "Farm auctions", ""),
    ("40' HC container build", "Retired (non-working) reefer container or reefer trailer shell, already insulated; rest as itemized", 0.95,
     "Container depots sell dead reefers for $3-6k", "Saves the $5.5k box and most of the $12k insulation; check floor and door seals"),
    ("Intake: submersible", "Reclaimed or rebuilt effluent pump from a farm dispersal", 0.50, "Farm auctions, pump shops' trade-ins", "Keep a spare: the intake is the single point of failure"),
    ("Screen:", "Food-plant surplus stainless wedge-wire, or stainless window screen on a sloped pallet frame", 0.40,
     "Food-equipment surplus dealers", "Window screen clogs faster; brush daily"),
    ("Settling tank", "Ganged used IBC totes (275 gal each) or a retired bulk milk tank", 0.35,
     "IBC resellers, dairy dispersals", "Food-grade history only; a bulk tank is ideal (stainless, has a drain)"),
    ("Header + blend box", "IBC tote on a pallet stand", 0.30, "IBC resellers", "Food-grade history only"),
    ("Main supply line", "Used irrigation pipe / lay-flat hose", 0.50, "Farm auctions", "Bury or insulate where it must not freeze"),
    ("Dewatering:", "Pallet-frame drain table with stainless window screen, or surplus vibrating screen from a dairy plant", 0.30,
     "Pallet yards, food-equipment surplus", "Food-contact screen if the product may go to feed"),
    ("Harvest cart", "The farm's existing scale, old garden cart, reused feed tubs", 0.40, "The farm itself", "Clean tubs that held medicated feed before use"),
    ("Winter inoculum bank", "IBC half-totes and used LED shop lights", 0.50, "As above", ""),
    ("Recirculation pump", "Reclaimed pump (pool or sump pump class)", 0.50, "Pool companies' trade-ins", "Oversize slightly; low head"),
    ("Solar drying hoop", "Used greenhouse frame with pallet-and-window-screen drying racks", 0.35, "Greenhouse closures", "Food-contact screen if the product may go to feed"),
]
RECLAIM_LABOR = 0.15             # extra install labor (collect, clean, seam, sort) as a fraction of NEW module material cost
RECLAIM_GROWTH = {"LT": 0.95, "H30": 0.95}   # aged film passes 10-15% less light; growth is only partly light-limited
RECLAIM_MAINT_PCT = 0.05         # shorter life of reclaimed liner, film and wood: maintenance as % of equipment per year


def apply_materials(items, materials="new"):
    """Return BOM lines as (item, qty, unit, unit $, reclaimed?, where, risk)."""
    out = []
    for it, qty, unit, u in items:
        alt = next((r for r in RECLAIM if it.startswith(r[0])), None) if materials == "reclaimed" else None
        out.append((alt[1], qty, unit, u * alt[2], True, alt[3], alt[4]) if alt else (it, qty, unit, u, False, "", ""))
    return out

# ---------------- OPERATIONS ----------------
LABOR_RATE = 20.0                # $/h farm labor
H_PER_1000M2_HARVEST = 0.4       # per harvest pass
H_SITE_DAY = 0.5                 # checks, meter readings, screen cleaning, per operating day
H_PER_T_FRESH = 1.0              # dewatering + handling per tonne fresh
POWER = 0.11                     # $/kWh
MAINT_PCT = 0.03                 # of equipment capex per year, incl. film every 4 yr and liner every 10-12 yr
LAB = (1500, 50)                 # $/yr base + per module
FIN, LIFE = 0.08, 15
N_PRICE, P_PRICE = 1.20, 3.00   # $/kg N, $/kg P fertilizer replacement value when drained biomass goes on the farm's fields
PRODUCT_PRICES = {"bulk soil amendment": 0.45, "bagged fertilizer, wholesale": 2.50}   # $/kg dried product
# Optional solar drying (product route 'dry'): one 30'x96' hoop with mesh tables per DRY_WATER_KG_D of water evaporated
DRY_WATER_KG_D, DRY_HOOP_COST, DRY_H_PER_100KG = 300, 15000, 1.5
SALT_BLEED = 0.10                # keep at least this fraction of inflow leaving as effluent, or salts build up


def size(gpd, tn_in=120.0, tp_in=25.0, tn_out=10.0, module="LT", mode="store", growth="design", dry=False, materials="new"):
    """mode 'store': the whole year's flow is held in existing farm storage and treated in the growing season.
       mode 'season': only in-season flow is treated; off-season flow goes where it goes today."""
    m = MODULES[module]
    g = m["g"][0 if growth == "design" else 1] * (RECLAIM_GROWTH.get(module, 1.0) if materials == "reclaimed" else 1.0)
    days = m["days"]
    q = gpd * GAL_M3                                         # m3/d, average
    year_round = days >= 350
    q_season = q * 365 / days if (mode == "store" and not year_round) else q
    treated_frac = 1.0 if (mode == "store" or year_round) else days / 365
    uptake = g * N_DW * (1 + BIO_N_CREDIT)                  # g N / m2 / d
    et_net = (m["et_mm"] - m["rain_mm"]) / 1000             # m/d lost (+) or gained (-) over the water surface

    area = q_season * (tn_in - tn_out) / uptake            # first guess, no evaporation
    for _ in range(50):                                      # effluent shrinks with evaporation -> less N leaves in it
        q_eff = max(0.0, q_season - et_net * area)
        need = q_season * tn_in - q_eff * tn_out             # g N/d removed in season
        new = max(need / uptake, q_season * HRT_MIN_D / m["depth_m"])
        if abs(new - area) < 1e-6: break
        area = new
    q_eff = max(0.0, q_season - et_net * area)
    hydraulic_limited = area <= q_season * HRT_MIN_D / m["depth_m"] + 1e-6
    n_mod = max(1, math.ceil(area / m["area_m2"]))
    area_b = n_mod * m["area_m2"]                            # built area
    vol = area_b * m["depth_m"]
    recirc = max(0.0, (tn_in - C_MAX) / (C_MAX - tn_out)) if tn_in > C_MAX else 0.0
    q_pump = q_season * (1 + recirc)

    dw_d = area_b * g / 1000                                 # kg DW/d at full cover (built area)
    n_cap = dw_d * N_DW * (1 + BIO_N_CREDIT) * 1000          # g N/d capacity of built area
    n_load = q_season * tn_in
    n_removed_yr = min(n_cap, n_load) * days / 1000           # kg N/yr
    dw_yr = min(dw_d, n_load / (N_DW * (1 + BIO_N_CREDIT)) / 1000) * days   # growth capped by N supply
    p_removed_yr = dw_yr * P_DW
    p_load_yr = q_season * tp_in * days / 1000
    fresh_kg_d = dw_yr / days / DM_FRESH
    product_kg_yr = dw_yr / DS_PRODUCT

    mbom = apply_materials(m["bom"], materials)
    module_bom = sum(b[1] * b[3] for b in mbom)
    module_bom_new = sum(qty * u for _, qty, _, u in m["bom"])
    sbom = site_bom(q_season, q_pump, fresh_kg_d, n_mod, recirc)
    water_kg_d = dw_yr / days * (1 / DS_DRAINED - 1 / DS_PRODUCT)
    if dry:
        sbom.append(("Solar drying hoop 30'x96' with mesh tables", math.ceil(water_kg_d / DRY_WATER_KG_D), "ea", DRY_HOOP_COST))
    sbom = apply_materials(sbom, materials)
    site_cost = sum(b[1] * b[3] for b in sbom)
    reclaimed = materials == "reclaimed"
    modules_cost = n_mod * (module_bom + module_bom_new * (m["install_pct"] + (RECLAIM_LABOR if reclaimed else 0)))
    equip = modules_cost + site_cost
    eng = ENG_FIXED + ENG_PCT * equip
    capex = (equip + eng) * (1 + CONTINGENCY)

    pump_kwh_d = q_pump * 1000 * 9.81 * PUMP_HEAD_M / PUMP_EFF / 3.6e6
    kwh_yr = pump_kwh_d * days + 1.0 * 365 + m.get("power_kwh_d", 0) * n_mod * days
    harvests = days / HARVEST_EVERY_D
    labor_h = (H_PER_1000M2_HARVEST * area_b / 1000 * harvests + H_SITE_DAY * days
               + H_PER_T_FRESH * fresh_kg_d * days / 1000
               + (DRY_H_PER_100KG * product_kg_yr / 100 if dry else 0))
    opex = {"labor": labor_h * LABOR_RATE, "electricity": kwh_yr * POWER, "maintenance": equip * (RECLAIM_MAINT_PCT if reclaimed else MAINT_PCT),
            "lab tests": LAB[0] + LAB[1] * n_mod}
    opex_t = sum(opex.values())
    crf = FIN / (1 - (1 + FIN) ** -LIFE)
    annual = opex_t + capex * crf
    treated_m3_yr = q * 365 * treated_frac
    revenue = product_kg_yr * PRODUCT_PRICES["bagged fertilizer, wholesale"] if dry else n_removed_yr * N_PRICE + p_removed_yr * P_PRICE

    return dict(gpd=gpd, module=module, mode=mode, growth=growth, g=g, days=days, q_season_gpd=q_season / GAL_M3,
                area_need_m2=area, n_mod=n_mod, area_m2=area_b, footprint_acre=n_mod * m["footprint_m2"] / M2_ACRE,
                vol_m3=vol, hrt_d=vol / q_season, hydraulic_limited=hydraulic_limited,
                eff_gpd=q_eff / GAL_M3, makeup_gpd=max(0.0, SALT_BLEED * q_season - q_eff) / GAL_M3, dry=dry,
                revenue=revenue, net=revenue - annual, et_gpd=et_net * area_b / GAL_M3,
                storage_gal=(q * (365 - days) / GAL_M3) if (mode == "store" and not year_round) else 0,
                recirc=recirc, pump_gpm=q_pump / GAL_M3 / 1440,
                n_removed_kg=n_removed_yr, p_removed_kg=p_removed_yr, p_removed_pct=100 * min(1, p_removed_yr / max(p_load_yr, 1e-9)),
                fresh_kg_d=fresh_kg_d, product_kg_yr=product_kg_yr,
                module_bom=module_bom, module_bom_new=module_bom_new, mbom=mbom, materials=materials, modules_cost=modules_cost, site_cost=site_cost, site_bom=sbom, eng=eng,
                capex=capex, opex=opex, opex_t=opex_t, kwh_yr=kwh_yr, labor_h=labor_h, capital_charge=capex * crf,
                annual=annual, per_kg_n=annual / max(n_removed_yr, 1e-9),
                per_kgal=annual / (treated_m3_yr / GAL_M3 / 1000), per_kg_product=annual / max(product_kg_yr, 1e-9),
                capex_per_gpd=capex / gpd, n_value=n_removed_yr * N_PRICE)


def money(x): return f"${x:,.0f}"


def table(rows):
    hdr = ("| Farm flow (gal/d) | Modules | Water area | Footprint | HRT | N removed | P removed | Fresh harvest | "
           "Dry product | Capex | Opex/yr | All-in $/kg N | $/1,000 gal |")
    print(hdr); print("|" + "---|" * 13)
    for r in rows:
        print(f"| {r['gpd']:,.0f} | {r['n_mod']} x {r['module']} | {r['area_m2']:,.0f} m² ({r['area_m2']*M2_FT2/43560:.2f} ac) | "
              f"{r['footprint_acre']:.2f} ac | {r['hrt_d']:.0f} d | {r['n_removed_kg']:,.0f} kg/yr | {r['p_removed_kg']:,.0f} kg/yr ({r['p_removed_pct']:.0f}%) | "
              f"{r['fresh_kg_d']:,.0f} kg/d | {r['product_kg_yr']/1000:,.1f} t/yr | {money(r['capex'])} | {money(r['opex_t'])} | "
              f"${r['per_kg_n']:,.0f} | ${r['per_kgal']:.1f} |")


def detail(r):
    m = MODULES[r["module"]]
    print(f"\n### {r['gpd']:,.0f} gal/d, {m['name']}, mode={r['mode']}, growth={r['growth']} ({r['g']} g DW/m²/d x {r['days']} d)")
    print(f"season inflow {r['q_season_gpd']:,.0f} gal/d; storage needed {r['storage_gal']:,.0f} gal; blend ratio {r['recirc']:.1f}:1; pump {r['pump_gpm']:.1f} gpm")
    print(f"area needed {r['area_need_m2']:,.0f} m² -> {r['n_mod']} modules = {r['area_m2']:,.0f} m², HRT {r['hrt_d']:.1f} d"
          f"{' (hydraulic floor governs)' if r['hydraulic_limited'] else ''}; effluent {r['eff_gpd']:,.0f} gal/d, evaporation {r['et_gpd']:,.0f} gal/d")
    print(f"module BOM {money(r['module_bom'])} each; modules incl. install {money(r['modules_cost'])}")
    for it, qty, unit, u, *_ in r["site_bom"]:
        print(f"   site: {it}: {qty:g} {unit} x {money(u)} = {money(qty*u)}")
    print(f"site {money(r['site_cost'])}  eng/permit {money(r['eng'])}  contingency {CONTINGENCY:.0%}  CAPEX {money(r['capex'])} ({money(r['capex_per_gpd'])} per gal/d)")
    print("opex " + ", ".join(f"{k} {money(v)}" for k, v in r["opex"].items()) + f" = {money(r['opex_t'])}  ({r['labor_h']:,.0f} h, {r['kwh_yr']:,.0f} kWh)")
    print(f"capital charge {money(r['capital_charge'])}  annual {money(r['annual'])}  ${r['per_kg_n']:.0f}/kg N  ${r['per_kgal']:.2f}/1,000 gal  ${r['per_kg_product']:.2f}/kg product")
    if r["makeup_gpd"] > 0:
        print(f"WATER: evaporation takes nearly all inflow; add {r['makeup_gpd']:,.0f} gal/d make-up (roof rain, well) to bleed salts")
    print(f"value: {'dried product at wholesale' if r['dry'] else 'drained biomass on farm fields (N+P replacement)'} {money(r['revenue'])}/yr; net {money(r['net'])}/yr")
    print("dried product if sold: " + ", ".join(f"{k} {money(r['product_kg_yr']*p)}" for k, p in PRODUCT_PRICES.items()))


if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("--gpd", type=float); a.add_argument("--tn", type=float, default=120); a.add_argument("--tp", type=float, default=25)
    a.add_argument("--tn-out", type=float, default=10); a.add_argument("--module", default="LT", choices=MODULES)
    a.add_argument("--mode", default="store", choices=["store", "season"]); a.add_argument("--growth", default="design", choices=["design", "target"])
    a.add_argument("--materials", default="new", choices=["new", "reclaimed"])
    a.add_argument("--dry", action="store_true", help="solar-dry and sell product instead of field-applying drained biomass")
    o = a.parse_args()
    kw = dict(tn_in=o.tn, tp_in=o.tp, tn_out=o.tn_out, mode=o.mode, growth=o.growth, dry=o.dry, materials=o.materials)
    if o.gpd:
        r = size(o.gpd, module=o.module, **kw)
        table([r]); detail(r)
    else:
        for mod in ("LT", "H30", "OL", "P1000", "C40"):
            print(f"\n## {MODULES[mod]['name']}  (TN {o.tn} -> {o.tn_out} mg/L, TP {o.tp}, mode {o.mode}, {o.growth} growth)")
            table([size(g, module=mod, **kw) for g in (1000, 5000, 20000, 100000)])
        print("\n## Same farm flows, dilute stream (aquaculture-type, TN 30 -> 5, TP 6), low-tunnel modules")
        table([size(g, tn_in=30, tp_in=6, tn_out=5, module="LT", mode=o.mode) for g in (1000, 5000, 20000, 100000)])
