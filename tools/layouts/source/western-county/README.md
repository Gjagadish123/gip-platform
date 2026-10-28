# Western County – Shankarpalli: digitised layout

Source: page 2 of the client's "Dukes Western County" flyer (Greater Infra Projects; `Western County 15x10 flyr(F).pdf`,
5069 × 3854 px embedded image), the HMDA-approved layout: LAYOUT PERMIT NO. 000144/LO/PLG/HMDA/2022 dated 27 July
2022, TGRERA P02400001472; Survey No 286/P, 287/P & 288/P, Singapur Village, Shankarpalli Municipality & Mandal, Ranga
Reddy Dist.

The flyer's numbers replace the ones the project had on file (HMDA LP 0002364/LO/Plg/HMDA/2019 of 03.08.2019 and RERA
P02400001474, from the old website): the admin's approvals and the layout source now quote the flyer.

Digitised on 28 Oct 2026 by colour segmentation plus two independent reading passes (all 191 cells agreed), then
re-read by a separate checker (0 disagreements). Working files, the full report (`report.md`) and the QA overlays are in
`.shots/digitise/western-county/` (not committed).

- `plots_px.json`: the 176 Phase I plots, numbers 1–176, printed areas (sq yd; sum 39,157 against the printed
  39,159.18, a rounding gap), outlines in source pixels and `mortgage` from the pink fill: "hmda" for 10–25 and 36–46,
  "nala" for 47–51 and 66–67, as the drawing's notes say ("Plots Mortgage to HMDA" and "… for Nala"). Their areas match
  the table's mortgage rows (4,977 vs 4,974.84 sq m; 1,728.3 vs 1,728.00 sq m).
- `phase2_px.json`: the 15 Phase II plots (orange, their own numbers 1–15, 2,806 sq yd). They are not among the
  permit's 176 plots and not in its land-use table, so the build draws them as one outlined "Phase II · 15 villa plots"
  area, not as plots with a status. The four labels on its unbuilt roads carry `"phase": "II"` in `site_px.json`
  and are left out.
- `site_px.json`: boundary (inner edge of the drawn site band), internal roads (40', 33', 30' and the existing villa
  cart road), road labels, Parks 1–9 (areas printed in square metres, kept as sq yd), social infrastructure, the STP and
  OHT utility areas, and the roads just outside the site that are on the ground: the 40' approach road, the 30' road west
  of plots 1–3, the east end of the 40' spine road and the road stubs south of the approach road. The digitiser's
  descriptions are kept in each feature's `note`. Left out on purpose:
  - the ODF road and the 150' Shankarpalli–Mokila road, drawn schematically at the sheet's edge: on the satellite image
    that ground is farmland and a neighbouring plotted layout, so the map shows the real roads (basemap, drive routes)
    instead;
  - an unlabelled grey triangle near plot 58 (probably the 15 sq m of utility the table has but the labels don't) and
    two unlabelled symbols, whose meaning isn't printed;
  - the Phase II social-infrastructure, utilities and cycle-track parcels (inside the Phase II area).

  One correction to the digitiser's output: the second road polygon had a slit cut down the Phase II road west of
  plots 14–15 where its "30' WIDE ROAD" lettering is (x 1671–1696 px); those 26 vertices are removed.
- `sides.json`: the side lengths printed in each plot (273 values, two passes agreed). Phase I writes decimal feet:
  `50'.3"` is 50.3 ft. Only that reading reproduces the printed areas (plots 58/59: 36'.4" × 60' = 242.67 → 243;
  as feet and inches 242.22 → 242), and no `.10` or `.11` occurs; the Phase II cells use feet and inches (`42'.10"`).
  Plot 154 prints its top as two segments. Sizes are published only
  where the printed sides agree with the printed area and the drawn shape (140 of 176 plots): plot 10, for example,
  prints 45' sides but 244 sq yd (it is drawn ~41 ft deep), so it shows area and facing but no size.
- `points.json` → `georef.json`: 14 road-junction control points (the drawing marks junctions with white dots) against
  the Google satellite capture `.shots/sat/wc-z19.png` (centre 17.4742058, 78.1389772, zoom 19, 2200 × 2200 px), fitted
  by `georef_points.py` (rotation and per-axis scale, no shear): rms 1.54 m, worst 3.6 m (the fourth north–south road's
  north end). The fitted scale, 0.107 / 0.106 m per px, matches the drawing's own 2.86 px per foot within 1%.

Land use as printed (sq yd): plotted 39,159.18, roads 21,960.23, parks 5,683.79, parks under the H.T. line 5,855.13,
social infrastructure 1,894.53, utility 599.07, total 75,151.93 (the rows add up exactly). Drawn roads come to about
24,900 sq yd, 2,900 more than printed; the existing villa cart road inside the site band (about 1,300–1,550 sq yd) is
probably part of that, if the table leaves it out.

Built differently from the drawing: the lower 33' diagonal meets the 40' road at the approach road on the ground, about
15 m south of where the drawing joins them, so that junction is not a control point. The Phase II roads and the
southern part of the fourth north–south road are not built yet.

Rebuild: `python -P -E tools/layouts/georef_points.py western-county .shots/sat/wc-z19.png 17.4742058 78.1389772 19
tools/layouts/source/western-county/points.json`, then `build_layouts.py`, `check_layouts.py`, `npm run db:seed` and
`npm run db:reset`.
