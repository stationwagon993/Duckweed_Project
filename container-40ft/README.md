# 40' Container: render, BOM and calculations

One 40' high-cube container with the reefer-trailer design condensed into it: cultivation runs at the front and the harvest and dewatering equipment in a processing bay at the cargo doors.

Open **`Container Render.html`** in a browser. It needs an internet connection the first time to load the 3D library. The page has three tabs:

- **3D render**: ten preset views (overview, side, plan, cross-section, front end, processing bay, water loop, electrical, moving screen, harvest end), a guided tour, and toggles for water flow, electrical circuits, the shell, roof, lights, dimensions and labels. The repopulation screen can be held down, held up, or cycled. Add `#water`, `#elec`, `#screen` etc. to the URL to open on a view.
- **Bill of materials**: every component with a representative product, quantity and planning price. Download as CSV or copy straight into a spreadsheet.
- **Calculations**: yield, nitrogen removal, energy, running cost, build cost and break-even price. Every input can be changed and the results update live. Capital cost comes from the BOM.

## Layout

| | |
|---|---|
| Container interior | 39'-5½" × 7'-8½" × 8'-10" (40' HC) |
| Cultivation | 16 runs, 2 across × 8 tiers, each 31'-0" × 3'-0" |
| Processing bay | 8'-5½" at the door end |
| Growing area | 1,488 ft² (138 m²) |
| Aisle | 17" between trays, 14" between posts |

32' runs plus an 8' processing bay add up to 40'-0", which is 6½" longer than the inside of a 40' container. The runs are 31'-0" (six 5'-2" bays) so the processing bay keeps a little over 8'.

Prices are 2026 USD planning estimates, not quotes. Yield and energy figures are modelled, not measured.

## Rebuilding

The page is assembled from the files in `src/`: run `bash src/assemble.sh`, which writes `src/index.html` (copy it over `Container Render.html`).
