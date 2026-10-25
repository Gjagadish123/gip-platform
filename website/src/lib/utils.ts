import { createCn } from "cn/config";

// The site's own type steps (globals.css @utility) join Tailwind's font-size group, so `cn("text-body", "text-h3")`
// keeps the last one instead of keeping both.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["hero", "title", "mega", "display", "stat", "h2", "h3", "figure", "lede", "body", "small", "ui", "label"] }],
    },
  },
});
