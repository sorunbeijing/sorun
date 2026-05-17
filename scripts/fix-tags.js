const fs = require("fs");
const path = require("path");

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(name)) {
      const s = fs.readFileSync(p, "utf8");
      const out = s.replace(/<\/?motion\b/g, (m) => m.replace("motion", "div"));
      if (out !== s) {
        fs.writeFileSync(p, out);
        console.log("fixed", p);
      }
    }
  }
}

walk(path.join(__dirname, "..", "src"));
