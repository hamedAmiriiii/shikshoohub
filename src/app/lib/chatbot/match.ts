import {
  ABUSE_REPLIES,
  CHATBOT_DIDNT_UNDERSTAND,
  CHATBOT_FALLBACK,
  KNOWLEDGE,
  REPEAT_SUPPORT,
  SMALLTALK_LEXICON,
  SMALLTALK_PROMPTS,
  SUPPORT_PHONE,
  type ChatAudience,
  type KnowledgeEntry,
  type SmalltalkKind,
} from "./knowledge";

export function normalize(text: string): string {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/أ|إ|آ/g, "ا")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function tokens(text: string): string[] {
  return normalize(text).split(" ").filter((w) => w.length > 1);
}

const ABUSE_TOKENS = new Set([
  "کیر",
  "کیری",
  "کیرم",
  "کیرت",
  "کیرش",
  "کص",
  "کس",
  "کصم",
  "کصت",
  "کونی",
  "کون",
  "کونت",
  "جنده",
  "جندگی",
  "کسکش",
  "کصکش",
  "مادرجنده",
  "حرومزاده",
  "حرامزاده",
  "دیوث",
  "لاشی",
  "بیشرف",
  "بیشعور",
  "عوضی",
  "گوه",
  "گهی",
  "کثافت",
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "dick",
  "pussy",
  "cunt",
  "kir",
  "kos",
  "koni",
  "jende",
]);

const ABUSE_PHRASES = [
  "مادر جنده",
  "ننتو",
  "مادرتو",
  "بی شرف",
  "بی شعور",
  "حروم زاده",
  "حرام زاده",
];

export function isAbusive(query: string): boolean {
  const q = normalize(query);
  if (!q) return false;
  if (ABUSE_PHRASES.some((p) => q.includes(normalize(p)))) return true;
  return tokens(query).some((t) => ABUSE_TOKENS.has(t));
}

function conceptOf(entry: KnowledgeEntry): string {
  return entry.concept || entry.id;
}

function pickVariant(variants: string[], prevCount: number): string {
  if (!variants.length) return "";
  return variants[prevCount % variants.length];
}

function smalltalkPrompt(kind: SmalltalkKind) {
  return SMALLTALK_PROMPTS.find((item) => item.kind === kind)!;
}

function isPureSmalltalk(query: string): boolean {
  const toks = tokens(query);
  if (!toks.length) {
    const n = normalize(query);
    return n.length > 0 && SMALLTALK_LEXICON.has(n);
  }
  return toks.every((t) => SMALLTALK_LEXICON.has(t));
}

function classifySmalltalk(query: string): SmalltalkKind {
  const n = normalize(query);
  const order: SmalltalkKind[] = ["thanks", "bye", "howareyou", "hello"];
  for (const kind of order) {
    const patterns = smalltalkPrompt(kind)
      .patterns.map((p) => normalize(p))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    for (const p of patterns) {
      if (n === p || n.startsWith(`${p} `) || n.endsWith(` ${p}`) || n.includes(` ${p} `)) {
        return kind;
      }
    }
  }
  return "hello";
}

function stripLeadingHello(query: string): string {
  let n = normalize(query);
  const patterns = smalltalkPrompt("hello")
    .patterns.map((p) => normalize(p))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  for (const p of patterns) {
    if (n === p) return "";
    if (n.startsWith(`${p} `)) {
      n = n.slice(p.length).trim();
      break;
    }
  }
  return n;
}

function replySmalltalk(kind: SmalltalkKind, askedConcepts: string[]): ChatReply {
  const prev = askedConcepts.filter((id) => id === kind).length;
  return {
    text: formatChatAnswer(pickVariant(smalltalkPrompt(kind).answers, prev)),
    conceptId: kind,
  };
}

function scoreEntry(query: string, entry: KnowledgeEntry, audience: ChatAudience): number {
  const q = normalize(query);
  if (!q) return 0;

  const allowed =
    entry.audience === "both" ||
    entry.audience === audience ||
    (audience === "admin" && entry.audience === "landing");
  if (!allowed) return 0;

  let score = 0;
  if (entry.audience === audience) score += 2;
  if (entry.audience === "both") score += 1;
  if (audience === "admin" && entry.audience === "admin") score += 3;

  for (const question of entry.questions) {
    const nq = normalize(question);
    if (!nq) continue;
    if (q === nq) score += 40;
    else if (q.includes(nq)) score += 18;
    else if (nq.length >= 4 && nq.includes(q)) score += 14;
  }

  for (const kw of entry.keywords) {
    const k = normalize(kw);
    if (k.length < 2) continue;
    if (q.includes(k)) score += k.length > 3 ? 8 : 5;
  }

  const hay = normalize([entry.title, ...entry.questions, ...entry.keywords].join(" "));
  for (const t of tokens(query)) {
    if (hay.includes(t)) score += 2;
  }

  return score;
}

export function formatChatAnswer(text: string): string {
  let t = String(text || "").replace(/\r\n/g, "\n").trim();
  t = t.replace(/[ \t]*•[ \t]*/g, "\n• ");
  t = t.replace(/[ \t]+([۰-۹0-9]{1,2})\)[ \t]+/g, "\n$1) ");
  t = t.replace(/([^\n\d۰-۹])([۰-۹0-9]{1,2}\)) /g, "$1\n$2 ");
  t = t.replace(/\nمسیر:/g, "\n\nمسیر:");
  t = t.replace(/\nاگر /g, "\n\nاگر ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.replace(/^\n+/, "").trim();
}

export type ChatReply = {
  text: string;
  path?: string;
  conceptId: string;
};

const REPEAT_LIMIT = 3;
const UNKNOWN_CLARIFY_LIMIT = 2;

export function answerChat(
  query: string,
  audience: ChatAudience,
  askedConcepts: string[] = [],
): ChatReply {
  if (isAbusive(query)) {
    const prev = askedConcepts.filter((id) => id === "abuse").length;
    if (prev >= REPEAT_LIMIT) {
      return {
        text: formatChatAnswer(pickVariant(REPEAT_SUPPORT[audience], prev)),
        conceptId: "abuse",
      };
    }
    return {
      text: formatChatAnswer(pickVariant(ABUSE_REPLIES, prev)),
      conceptId: "abuse",
    };
  }

  if (isPureSmalltalk(query)) {
    return replySmalltalk(classifySmalltalk(query), askedConcepts);
  }

  const rest = stripLeadingHello(query);
  const queryForMatch = rest || query;

  const ranked = KNOWLEDGE.map((entry) => ({
    entry,
    score: scoreEntry(queryForMatch, entry, audience),
  }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 8) {
    const prev = askedConcepts.filter((id) => id === "unknown").length;
    if (prev < UNKNOWN_CLARIFY_LIMIT) {
      return {
        text: formatChatAnswer(CHATBOT_DIDNT_UNDERSTAND),
        conceptId: "unknown",
      };
    }
    return {
      text: formatChatAnswer(CHATBOT_FALLBACK[audience]),
      conceptId: "unknown",
    };
  }

  const conceptId = conceptOf(best.entry);
  const prev = askedConcepts.filter((id) => id === conceptId).length;
  if (prev >= REPEAT_LIMIT) {
    return {
      text: formatChatAnswer(pickVariant(REPEAT_SUPPORT[audience], prev)),
      conceptId,
    };
  }

  let text = pickVariant(best.entry.answers, prev);
  if (audience === "admin" && best.entry.path) {
    text += `\n\nمسیر: ${best.entry.path}`;
  }
  if (prev === REPEAT_LIMIT - 1) {
    text += `\n\nاگر همین‌جا ماندی، با پشتیبانی ${SUPPORT_PHONE} تماس بگیر تا نفر به نفر راهنمایی کنند.`;
  }
  return { text: formatChatAnswer(text), path: best.entry.path, conceptId };
}
