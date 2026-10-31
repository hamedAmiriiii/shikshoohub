/** پیشنهاد دوحذفی داخل یک گروه: نفر اول از جدول برندگان، نفر دوم از جدول بازنده‌ها. */

export type DeSlot =
  | { type: "player"; playerId: number }
  | { type: "source"; matchIndex: number; outcome: "winner" | "loser" };

export type DeMatch = {
  slot1: DeSlot;
  slot2: DeSlot;
  side: "winners" | "losers";
  place: "first" | "second" | null;
};

type RawSlot =
  | { kind: "player"; playerId: number }
  | { kind: "winner" | "loser"; matchIndex: number };

type RawMatch = {
  slot1: RawSlot;
  slot2: RawSlot;
  round: number;
  side: "winners" | "losers";
  place: "first" | "second" | null;
};

const MAX_PLAYERS = 32;

export function buildGroupDoubleElimination(playerIds: number[]): DeMatch[] {
  const ids = playerIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length < 2) {
    throw new Error("برای دوحذفی حداقل دو بازیکن لازم است.");
  }
  if (ids.length > MAX_PLAYERS) {
    throw new Error("دوحذفی خودکار تا ۳۲ بازیکن در هر گروه ساخته می‌شود.");
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("یک بازیکن دو بار در گروه آمده است.");
  }

  const built = buildWinners(ids);
  const order = built.map((_, index) => index).sort((a, b) => {
    if (built[a].round !== built[b].round) return built[a].round - built[b].round;
    return a - b;
  });
  const finalIndex = order.indexOf(built.length - 1);
  const matches = remap(built, order);
  matches[finalIndex].place = "first";

  if (ids.length > 2) {
    appendLosers(matches, finalIndex);
  }

  const expected = ids.length === 2 ? 1 : ids.length * 2 - 3;
  if (matches.length !== expected) {
    throw new Error("چیدمان دوحذفی با تعداد بازیکن‌ها جور نشد.");
  }

  return matches.map(toPublic);
}

export function deSlotText(slot: DeSlot, names: Map<number, string>): string {
  if (slot.type === "player") return names.get(slot.playerId) || "بازیکن";
  const row = slot.matchIndex + 1;
  return slot.outcome === "loser" ? `بازنده ${row}` : `برنده ${row}`;
}

function buildWinners(players: number[]): RawMatch[] {
  const matches: RawMatch[] = [];
  placeWinners(players, matches);
  return matches;
}

function placeWinners(players: number[], matches: RawMatch[]): RawSlot {
  const count = players.length;
  if (count === 1) return { kind: "player", playerId: players[0] };
  if (count === 2) {
    return winnerOf(pushMatch(matches, player(players[0]), player(players[1]), 1));
  }
  if (count === 3) {
    const prelim = pushMatch(matches, player(players[0]), player(players[1]), 1);
    return winnerOf(pushMatch(matches, winnerOf(prelim), player(players[2]), 2));
  }
  const leftCount = Math.floor(count / 2);
  const left = placeWinners(players.slice(0, leftCount), matches);
  const right = placeWinners(players.slice(leftCount), matches);
  const round = 1 + Math.max(slotRound(left, matches), slotRound(right, matches));
  return winnerOf(pushMatch(matches, left, right, round));
}

function appendLosers(matches: RawMatch[], finalIndex: number) {
  const byRound = new Map<number, number[]>();
  matches.forEach((match, index) => {
    if (index === finalIndex) return;
    const list = byRound.get(match.round) ?? [];
    list.push(index);
    byRound.set(match.round, list);
  });

  let waiting: RawSlot[] = [];
  for (const round of [...byRound.keys()].sort((a, b) => a - b)) {
    waiting = dropIn(matches, waiting, (byRound.get(round) ?? []).map(loserOf));
  }
  while (waiting.length > 1) {
    const left = waiting.shift();
    const right = waiting.shift();
    if (!left || !right) break;
    waiting.unshift(winnerOf(pushMatch(matches, left, right, 0, "losers")));
  }
  if (waiting.length !== 1) {
    throw new Error("جدول بازنده‌ها ساخته نشد.");
  }
  const last = pushMatch(matches, waiting[0], loserOf(finalIndex), 0, "losers");
  matches[last].place = "second";
}

function dropIn(matches: RawMatch[], waiting: RawSlot[], incoming: RawSlot[]): RawSlot[] {
  if (!incoming.length) return waiting;
  if (!waiting.length) {
    const next: RawSlot[] = [];
    let index = 0;
    while (index + 1 < incoming.length) {
      next.push(winnerOf(pushMatch(matches, incoming[index], incoming[index + 1], 0, "losers")));
      index += 2;
    }
    if (index < incoming.length) next.push(incoming[index]);
    return next;
  }
  if (waiting.length === 1) {
    let current = waiting[0];
    for (const slot of incoming) {
      current = winnerOf(pushMatch(matches, current, slot, 0, "losers"));
    }
    return [current];
  }

  const pooled = waiting.slice();
  const drops = incoming.slice();
  while (pooled.length > drops.length && pooled.length > 1) {
    const left = pooled.shift();
    const right = pooled.shift();
    if (!left || !right) break;
    pooled.unshift(winnerOf(pushMatch(matches, left, right, 0, "losers")));
  }
  if (pooled.length === 1) {
    let current = pooled[0];
    for (const slot of drops) {
      current = winnerOf(pushMatch(matches, current, slot, 0, "losers"));
    }
    return [current];
  }
  while (drops.length > pooled.length) {
    const left = drops.shift();
    const right = drops.shift();
    if (!left || !right) break;
    drops.unshift(winnerOf(pushMatch(matches, left, right, 0, "losers")));
  }
  const next: RawSlot[] = [];
  for (let index = 0; index < pooled.length; index++) {
    next.push(
      winnerOf(pushMatch(matches, pooled[index], drops[drops.length - 1 - index], 0, "losers")),
    );
  }
  return next;
}

function pushMatch(
  matches: RawMatch[],
  slot1: RawSlot,
  slot2: RawSlot,
  round: number,
  side: "winners" | "losers" = "winners",
): number {
  matches.push({ slot1, slot2, round, side, place: null });
  return matches.length - 1;
}

function remap(matches: RawMatch[], order: number[]): RawMatch[] {
  const nextIndex = new Map<number, number>();
  order.forEach((oldIndex, index) => nextIndex.set(oldIndex, index));
  const mapSlot = (slot: RawSlot): RawSlot => {
    if (slot.kind === "player") return slot;
    const matchIndex = nextIndex.get(slot.matchIndex);
    if (matchIndex == null) throw new Error("ارجاع بازی در چیدمان گم شد.");
    return { kind: slot.kind, matchIndex };
  };
  return order.map((oldIndex) => {
    const match = matches[oldIndex];
    return { ...match, slot1: mapSlot(match.slot1), slot2: mapSlot(match.slot2) };
  });
}

function toPublic(match: RawMatch): DeMatch {
  return {
    slot1: toPublicSlot(match.slot1),
    slot2: toPublicSlot(match.slot2),
    side: match.side,
    place: match.place,
  };
}

function toPublicSlot(slot: RawSlot): DeSlot {
  if (slot.kind === "player") return { type: "player", playerId: slot.playerId };
  return { type: "source", matchIndex: slot.matchIndex, outcome: slot.kind };
}

function player(playerId: number): RawSlot {
  return { kind: "player", playerId };
}

function winnerOf(matchIndex: number): RawSlot {
  return { kind: "winner", matchIndex };
}

function loserOf(matchIndex: number): RawSlot {
  return { kind: "loser", matchIndex };
}

function slotRound(slot: RawSlot, matches: RawMatch[]): number {
  if (slot.kind === "player") return 0;
  return matches[slot.matchIndex].round;
}
