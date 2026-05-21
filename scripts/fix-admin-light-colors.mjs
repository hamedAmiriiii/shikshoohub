import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adminDir = path.join(root, "src/app/admin");

const replacements = [
  ["rgba(255,255,255,0.9)", "var(--admin-text)"],
  ["rgba(255,255,255,0.8)", "var(--admin-text-muted)"],
  ["rgba(255,255,255,0.6)", "var(--admin-text-muted)"],
  ["rgba(255,255,255,0.3)", "var(--admin-text-secondary)"],
  ["rgba(255,255,255,0.25)", "var(--admin-icon-bg-hover)"],
  ["rgba(255,255,255,0.2)", "var(--admin-icon-bg)"],
  ["rgba(255, 255, 255, 0.2)", "var(--admin-icon-bg)"],
  ["rgba(255,255,255,0.05)", "var(--admin-surface-alt)"],
  ["borderColor: 'rgba(255,255,255,0.2)'", "borderColor: 'var(--admin-border)'"],
  ["borderColor: 'rgba(255,255,255,0.3)'", "borderColor: 'var(--admin-accent)'"],
];

function walk(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "theme") continue;
      count += walk(full);
    } else if (entry.name.endsWith(".tsx")) {
      let content = fs.readFileSync(full, "utf8");
      const original = content;
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      if (content !== original) {
        fs.writeFileSync(full, content);
        count++;
        console.log("updated:", path.relative(adminDir, full));
      }
    }
  }
  return count;
}

const n = walk(adminDir);
console.log(`Updated ${n} file(s).`);
