// next/link and the router add basePath themselves; plain src/url strings (img, next/image, CSS mask) do not.
// ponytail: only the GitHub Pages preview sets NEXT_PUBLIC_BASE_PATH ('/gip-platform'); everywhere else this is a no-op.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export const withBase = (path: string) => (path.startsWith("/") && !path.startsWith("//") ? BASE + path : path)
