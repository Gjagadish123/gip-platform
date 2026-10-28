// Copied from new_tourism_website_next. Next 16.3+ on Windows writes a page's prefetch segments as out/<route>/__next.places/$d$slug/__PAGE__.txt
// (path.join backslashes survive its '/' -> '.' conversion); the client asks for
// __next.places.$d$slug.__PAGE__.txt. Flatten them to the names the router requests.
import { readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
const root = process.argv[2];
let n = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith("__next.")) {
      const files = [];
      const collect = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? collect(join(d, f)) : files.push(join(d, f))));
      collect(p);
      for (const f of files) { renameSync(f, join(dir, name + "." + relative(p, f).split(sep).join("."))); n++; }
      rmSync(p, { recursive: true });
    } else walk(p);
  }
};
walk(root);
console.log("flattened", n);
