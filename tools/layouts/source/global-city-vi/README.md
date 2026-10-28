# Global City VI: digitised layout

`masterplan.json` is the plan built for the Global City VI layout demo (`GIP Website/layout_demo`,
`tools/build_masterplan.py` there) from the scanned brochure-cum-layout: 288 plots with their printed numbers and
areas (the 288 areas sum to exactly the brochure's 62,107.89 sq yd), facing and road widths from which plot edges
touch which road, sizes only where the drawn plot agrees with the printed area, and an affine fit on 32 road
intersections and road ends against Google satellite imagery (1.96 m rms). The site pin is the brochure's QR code.

`build_layouts.py` converts it to the v2 format the website and admin read.
