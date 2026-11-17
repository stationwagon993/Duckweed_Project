"""Write farm-sizing-tool.html from tool_template.html, injecting the module catalog and constants
from farm_sizing.py so the browser tool and the Python model use the same numbers.
    python3 farm-system/build_tool.py"""
import json, os
import farm_sizing as f
here = os.path.dirname(os.path.abspath(__file__))
P = {k: getattr(f, k) for k in ("N_DW", "P_DW", "DM_FRESH", "DS_DRAINED", "DS_PRODUCT", "BIO_N_CREDIT", "C_MAX", "HRT_MIN_D",
     "HARVEST_EVERY_D", "PUMP_HEAD_M", "PUMP_EFF", "ENG_FIXED", "ENG_PCT", "CONTINGENCY", "LABOR_RATE", "H_PER_1000M2_HARVEST",
     "H_SITE_DAY", "H_PER_T_FRESH", "POWER", "MAINT_PCT", "LAB", "FIN", "LIFE", "N_PRICE", "P_PRICE", "PRODUCT_PRICES",
     "DRY_WATER_KG_D", "DRY_HOOP_COST", "DRY_H_PER_100KG", "SALT_BLEED",
     "RECLAIM", "RECLAIM_LABOR", "RECLAIM_GROWTH", "RECLAIM_MAINT_PCT")}
cat = json.dumps({"MODULES": f.MODULES, "P": P}, separators=(",", ":"))
src = open(os.path.join(here, "tool_template.html")).read().replace("/*CATALOG*/null", cat)
open(os.path.join(here, "farm-sizing-tool.html"), "w").write(src)
print("wrote farm-sizing-tool.html", len(src), "bytes")
