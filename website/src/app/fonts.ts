import { Inter } from "next/font/google";

// Inter throughout, as on greaterinfraprojects.in: headings at 500–600 with tight tracking, text at 400. The optical
// size axis keeps small text open and large headings tight.
export const sans = Inter({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-sans",
});
