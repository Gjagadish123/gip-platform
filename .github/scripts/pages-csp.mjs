// Content-Security-Policy for the GitHub Pages build. Pages cannot send custom response headers, so every HTML page
// gets the policy as a <meta http-equiv> tag, listing the hashes of that page's own inline scripts (Next.js inlines
// its page data and the theme script) instead of allowing any inline script.
// frame-ancestors, X-Frame-Options and X-Content-Type-Options only work as real response headers: set them on the
// host when the site moves off Pages. Until then the admin guards itself against framing (admin/src/app/layout.tsx).
//
// Usage: node .github/scripts/pages-csp.mjs <built site dir>   (NEXT_PUBLIC_SUPABASE_URL names the Supabase origin)
import { createHash } from "node:crypto"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const dir = process.argv[2]
if (!dir || !process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("usage: NEXT_PUBLIC_SUPABASE_URL=... node pages-csp.mjs <dir>")
const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
const google = "https://*.googleapis.com https://*.gstatic.com https://*.google.com" // Maps JS API, embeds, fonts

const policy = (hashes) =>
  [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(" ")} 'wasm-unsafe-eval' ${google}`, // the vector map compiles WebAssembly
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // React style attributes and the Maps API's own styles
    "img-src 'self' data: blob: https:", // project images may be hosted anywhere the admin links to
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${supabase} ${supabase.replace(/^https:/, "wss:")} ${google} data: blob:`,
    `media-src 'self' blob: ${supabase}`,
    "frame-src blob: https://www.google.com https://maps.google.com", // map embeds; the admin's PDF previews
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ")

const sha256 = (text) => `'sha256-${createHash("sha256").update(text.replace(/\r\n?/g, "\n"), "utf8").digest("base64")}'`

let pages = 0
for (const file of readdirSync(dir, { recursive: true })) {
  if (!file.endsWith(".html")) continue
  const path = join(dir, file)
  let html = readFileSync(path, "utf8")
  if (html.includes('http-equiv="Content-Security-Policy"')) throw new Error(`${file}: already has a CSP meta tag`)

  const hashes = new Set()
  for (const [, attrs = "", body] of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    if (/\ssrc=/i.test(attrs) || /\stype=["']?application\/(ld\+)?json/i.test(attrs) || !body.trim()) continue
    hashes.add(sha256(body))
  }
  // A hash covers <script> bodies only: an inline event handler attribute would silently stop working.
  const markup = html.replace(/<script[\s\S]*?<\/script>/gi, "")
  if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(markup)) throw new Error(`${file}: inline event handler, the CSP would block it`)

  // Straight after <meta charset> (which must stay in the first 1024 bytes) and before any script.
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy([...hashes])}">`
  const anchor = html.match(/<meta charset[^>]*>/i) ?? html.match(/<head[^>]*>/i)
  if (!anchor) throw new Error(`${file}: no <head> to put the CSP in`)
  const at = anchor.index + anchor[0].length
  if (/<script/i.test(html.slice(0, at))) throw new Error(`${file}: a script comes before the CSP`)
  writeFileSync(path, html.slice(0, at) + meta + html.slice(at))
  pages++
}
console.log(`CSP added to ${pages} pages`)
