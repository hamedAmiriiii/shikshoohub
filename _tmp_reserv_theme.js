const fs = require("fs");
const p =
  "d:/shakhsi/webinoo/shikshoohub/src/app/[shop]/reserv/[table]/page.tsx";
let s = fs.readFileSync(p, "utf8");

const reps = [
  ['color: "#1a1408"', "color: ACCENT_ON"],
  ['color: "#1a1712"', "color: ACCENT_ON"],
  [
    '"&:hover": { bgcolor: ACCENT_DARK, color: "#1a1408" }',
    '"&:hover": { bgcolor: ACCENT_DARK, color: ACCENT_ON }',
  ],
  [
    '"&:hover": { bgcolor: ACCENT_DARK, color: "#1a1712" }',
    '"&:hover": { bgcolor: ACCENT_DARK, color: ACCENT_ON }',
  ],
  [
    'bgcolor: submittedCancelled ? "rgba(198,40,40,0.12)" : "rgba(212,175,55,0.12)"',
    'bgcolor: submittedCancelled ? "rgba(198,40,40,0.12)" : ACCENT_SOFT',
  ],
  [
    'border: "1px solid rgba(212,175,55,0.2)"',
    "border: `1px solid ${ACCENT_BORDER}`",
  ],
  [
    'border: active ? "none" : "1px solid rgba(212,175,55,0.16)"',
    "border: active ? \"none\" : `1px solid ${ACCENT_BORDER_SOFT}`",
  ],
  [
    'border: "1px dashed rgba(212,175,55,0.45)"',
    "border: `1px dashed ${ACCENT_BORDER}`",
  ],
  [
    'border: "1px solid rgba(212,175,55,0.35)"',
    "border: `1px solid ${ACCENT_BORDER}`",
  ],
  [
    'border: "1px solid rgba(212,175,55,0.1)"',
    "border: `1px solid ${ACCENT_BORDER_SOFT}`",
  ],
  [
    'borderColor: "rgba(212,175,55,0.12)"',
    "borderColor: ACCENT_BORDER_SOFT",
  ],
  [
    'borderColor: "rgba(212,175,55,0.35)"',
    "borderColor: ACCENT_BORDER",
  ],
  [
    'bgcolor: themeMode === "dark" ? "#3a3a3a" : "#d8d2c8"',
    'bgcolor: themeMode === "dark" ? "#475569" : "#cbd5e1"',
  ],
];

for (const [a, b] of reps) {
  if (!s.includes(a)) console.log("MISS", a.slice(0, 70));
  else {
    const n = s.split(a).length - 1;
    s = s.split(a).join(b);
    console.log("OK", n, a.slice(0, 50));
  }
}

// drawer handles that still use hardcoded #3a3a3a
s = s.replaceAll('bgcolor: "#3a3a3a"', 'bgcolor: themeMode === "dark" ? "#475569" : "#cbd5e1"');

fs.writeFileSync(p, s);
console.log("done");
