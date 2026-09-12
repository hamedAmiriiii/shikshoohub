import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src", "app", "lib", "appBuildVersion.ts");

const source = fs.readFileSync(target, "utf8");
const match = source.match(/export const APP_BUILD = (\d+);/);
if (!match) {
  console.error("APP_BUILD not found in appBuildVersion.ts");
  process.exit(1);
}

const nextBuild = Number(match[1]) + 1;
const updated = source.replace(
  /export const APP_BUILD = \d+;/,
  `export const APP_BUILD = ${nextBuild};`,
);
fs.writeFileSync(target, updated, "utf8");
console.log(`[build] APP_BUILD -> ${nextBuild} (v1.0.${nextBuild})`);
