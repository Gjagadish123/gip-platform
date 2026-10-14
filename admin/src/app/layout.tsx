import type { Metadata } from "next"
import { Archivo } from "next/font/google"
import { ThemeProvider } from "next-themes"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DemoStoreProvider } from "@/lib/store"
import "./globals.css"

// One family. wdth axis = condensed numerals (font-condensed); latin-ext carries the ₹ sign (U+20B9).
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "GIP Admin", template: "%s · GIP Admin" },
  description: "Greater Infra Projects admin portal",
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${archivo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {/* Store at the root so /login can call setSession on the same instance the app reads. */}
          <DemoStoreProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </DemoStoreProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
