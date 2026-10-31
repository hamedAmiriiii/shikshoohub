const d = await (await fetch("https://api.webinoo-plus.ir/api/billiard/tournaments/bakt")).json();
const matches = d.bracket || [];
const m = matches.find((x) => x.match_no === 21) || matches.find((x) => String(x.round_label || "").includes("21"));
const related = matches.filter((x) => x.group_code === "G" || x.group_code === "7").map((x) => ({
  no: x.match_no,
  label: x.round_label,
  p1: x.player1 && x.player1.full_name,
  p2: x.player2 && x.player2.full_name,
  s1: x.player1_source,
  s2: x.player2_source,
  on: x.scheduled_on,
  at: x.scheduled_at,
}));
console.log(JSON.stringify({ match21: m && { no: m.match_no, p1: m.player1, p2: m.player2, s1: m.player1_source, s2: m.player2_source, on: m.scheduled_on, at: m.scheduled_at, label: m.round_label }, group: related }, null, 2));
