# Global City V: digitised layout

Source: the HMDA-approved layout drawing of Global City-V (7501 × 5399 px image), L.P.No. 000299/LO/Plg/HMDA/2021
dated 21.08.2021 (Sy. Nos 357, 358, 369 & 370, Indrakaran village, Kandi mandal, Sangareddy district).

- `plots_px.json`: 332 plots, numbers 1–332, printed areas (summing to the land-use table's 68,558 sq yd), plot
  outlines in source pixels.
- `site_px.json`: boundary, internal roads with their printed widths (30, 33, 40 ft), the roads outside the site the
  drawing names (existing 100 ft and two 30 ft roads, the proposed 100 ft master plan road, two 33 ft continuations),
  parks, and the social-infrastructure and utility sites: the transformer is drawn inside the OHT utility plot
  (`partOf`), so that plot is named "Utility (OHT)" and its label is placed clear of the transformer's.
- `sides.json`: the side lengths printed inside each plot (571 values, all 332 plots), read twice; both readings agree
  on all 574 labels. Plots 101 and 122 print R "34'-61" (likely 34'-6"); the build rejects it and shows no size for them.
- `anchors.json`: 32 road points measured by hand on the Google satellite capture (zoom 19), [drawing px, capture px].
- `georef.json`: written by `georef_tps.py`: a thin-plate spline through the measured anchors plus automatically
  matched road junctions (the measured anchors are passed through exactly, the automatic matches smoothed); 90% of
  the drawing's road centre-lines land within 2.0 m of the built roads.

The drawing is not quite to scale against the ground (a single affine leaves the roads up to 6 m off), but its plots
are drawn at one scale: drawn area per printed sq yd is the same for every plot within 5%. `georef_tps.py` therefore
rejects any spline that squeezes or stretches plots (an early fit followed skeleton junctions in the entrance plaza and
shrank the west block to a quarter of its printed area), and `check_layouts.py` fails on one.

Rebuild: `python -P -E tools/layouts/georef_tps.py global-city-v <gc5-z19.png> 17.529781355946017 78.13743308598328 19
"2340,3329:850,1395" "8,36" tools/layouts/source/global-city-v/anchors.json`, then `build_layouts.py` and
`check_layouts.py`.

Plot statuses in the seed are sample data until the client's sales register is loaded.
