import { Inter } from "next/font/google";

// Inter throughout, as on greaterinfraprojects.in: headings at 500–600 with tight tracking, text at 400. The optical
// size axis keeps small text open and large headings tight.
// Only latin is preloaded: the site's text has no latin-ext glyph (₹ and the like still load on demand through the
// font's unicode-range), so 131 KB stays off every page's critical path.
export const sans = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-sans",
});
