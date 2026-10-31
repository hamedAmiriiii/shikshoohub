export type MatchPerson = { full_name?: string | null } | null;

export type MatchSource = {
  match_id?: number;
  match_no?: number;
  outcome?: string | null;
  label?: string | null;
} | null;

export type MatchLike = {
  id?: number;
  match_no?: number;
  player1?: MatchPerson;
  player2?: MatchPerson;
  player1_source?: MatchSource;
  player2_source?: MatchSource;
  scheduled_on?: string | null;
  scheduled_at?: string | null;
  table?: { name?: string | null } | null;
};

export function indexMatches<T extends MatchLike>(rows: T[]): Map<number, T> {
  const map = new Map<number, T>();
  for (const row of rows) {
    if (row.id) map.set(row.id, row);
  }
  return map;
}

/** تاریخ میلادی ذخیره‌شده را به شمسی نشان می‌دهد، بدون جابه‌جایی روز به‌خاطر ساعت. */
export function formatMatchDate(ymd?: string | null): string {
  if (!ymd) return "";
  const day = String(ymd).slice(0, 10);
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return day;
  }
}

export function formatMatchWhen(m: MatchLike): string {
  const time = (m.scheduled_at || "").slice(0, 5);
  return [formatMatchDate(m.scheduled_on), time, m.table?.name].filter(Boolean).join(" · ");
}

function slotRef(m: MatchLike | undefined): { left: string; right: string; people: boolean } | null {
  if (!m) return null;
  const leftName = m.player1?.full_name || "";
  const rightName = m.player2?.full_name || "";
  const left = leftName || (m.player1_source?.match_no ? `بازی ${m.player1_source.match_no}` : "");
  const right = rightName || (m.player2_source?.match_no ? `بازی ${m.player2_source.match_no}` : "");
  if (!left || !right) return null;
  return { left, right, people: Boolean(leftName && rightName) };
}

/**
 * اگر بازیکن مشخص است نامش، وگرنه طرفِ وابسته:
 * دو نفر → «برنده علی و رضا»
 * دو بازی → «برنده بازی ۳ - ۷»
 * ترکیبی → «برنده علی و بازی ۷»
 */
export function matchSideText(m: MatchLike, side: 1 | 2, catalog?: Map<number, MatchLike>): string {
  const player = side === 1 ? m.player1 : m.player2;
  if (player?.full_name) return player.full_name;
  const source = side === 1 ? m.player1_source : m.player2_source;
  if (!source) return "—";
  const feeder = source.match_id ? catalog?.get(source.match_id) : undefined;
  const sides = slotRef(feeder);
  const word = source.outcome === "loser" ? "بازنده" : "برنده";
  if (sides?.people) return `${word} ${sides.left} و ${sides.right}`;
  if (sides && !sides.people) {
    const leftIsMatch = sides.left.startsWith("بازی ");
    const rightIsMatch = sides.right.startsWith("بازی ");
    if (leftIsMatch && rightIsMatch) {
      return `${word} بازی ${sides.left.slice(5)} - ${sides.right.slice(5)}`;
    }
    return `${word} ${sides.left} و ${sides.right}`;
  }
  return source.label || (source.match_no ? `${word} بازی ${source.match_no}` : "—");
}
