import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");
const hits = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(name)) {
      const lines = fs.readFileSync(p, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (line.includes("\uFFFD")) {
          hits.push(`${p}:${i + 1} contains U+FFFD (replacement char)`);
        }
        [...line].forEach((ch, col) => {
          const cp = ch.codePointAt(0);
          if (cp >= 0x80 && cp <= 0x9f) {
            hits.push(`${p}:${i + 1}:${col + 1} C1 control U+${cp.toString(16)}`);
          }
        });
      });
    }
  }
}

walk(root);
console.log(hits.length ? hits.join("\n") : "OK: no U+FFFD found");
