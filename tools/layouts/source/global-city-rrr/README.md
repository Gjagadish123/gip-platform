# Global City RRR: digitised layout

Source: page 2 of the client's brochure "Global City - RRR _ Dtcp & Rera approved final brochure.pdf" (2550 × 1650 px
embedded image), the DTCP layout TLP No 236/2022/H dated 08.07.2022 (Nagasanpally GP; Sy. Nos 516, 517, 518, 519 &
524 parts; Peddapur, Sadasivapet mandal, Sangareddy district).

- `plots_px.json`: 113 plots, numbers 1–113, printed areas, plot outlines in source pixels, `mortgage` from the pink
  hatching (exactly plots 97–113, as the drawing's own "MORTGAGE Plots: 97 to 113" says).
- `site_px.json`: boundary, internal roads (one network), road labels with widths, the two existing access roads
  (40 ft, 33 ft), the park ("SITE RESERVED FOR PUBLIC PURPOSE (PARK) Ac 00.864 Cts"; its `areaSqYd` 4,182 is that
  0.864 acres, the land-use table's open spaces) and two decorative tree strips (unlabelled greens, outside the
  boundary; not drawn on the website).
- `georef.json`: control points (source px → Google satellite capture px at zoom 19) and the fitted affine.

Checks (by the digitising pass, 27 Oct 2026): two independent readings agree on all 113 numbers and areas; every column
runs in sequence; all 73 standard cells match width × depth / 9 from their printed sides.

Open question for the client: the printed plot areas add up to **24,421 sq yd**, 25 sq yd (0.10%) less than the
24,446.00 in the drawing's land-use table, whose percentages also don't match its own figures (24,446 is 58.49% of
41,798, not the printed 59.95%). The website shows the per-plot areas as printed and the land-use table as printed.
