const FALLBACK_SRC = "/reserv/1.mp3";

const FA_ONES = [
  "صفر",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
];
const FA_TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const FA_HUNDREDS = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
];

function numberToPersianWords(n: number): string {
  const value = Math.floor(Math.abs(n));
  if (value < 20) return FA_ONES[value];
  if (value < 100) {
    const ones = value % 10;
    const tens = Math.floor(value / 10);
    return ones ? `${FA_TENS[tens]} و ${FA_ONES[ones]}` : FA_TENS[tens];
  }
  if (value < 1000) {
    const rest = value % 100;
    const hundreds = Math.floor(value / 100);
    return rest ? `${FA_HUNDREDS[hundreds]} و ${numberToPersianWords(rest)}` : FA_HUNDREDS[hundreds];
  }
  return String(value);
}

function toSpokenPersian(text: string): string {
  return text.replace(/\d+/g, (digits) => numberToPersianWords(Number(digits)));
}

function isPersianVoice(voice: SpeechSynthesisVoice): boolean {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  return /^fa/i.test(voice.lang) || name.includes("persian") || name.includes("farsi") || name.includes("فارسی");
}

function voiceScore(voice: SpeechSynthesisVoice): number {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  let score = 0;
  if (isPersianVoice(voice)) score += 50;
  if (/dilara|fariba|nazanin|minu|arezoo|elham|laleh/.test(name)) score += 30;
  if (/female|woman|zira|hazel|aria|jenny|samantha|susan/.test(name)) score += 12;
  if (/male|david|mark|george|guy/.test(name)) score -= 20;
  if (voice.localService) score += 4;
  return score;
}

function pickFemaleFaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const persian = voices.filter(isPersianVoice);
  if (!persian.length) return null;
  return [...persian].sort((a, b) => voiceScore(b) - voiceScore(a))[0] ?? null;
}

function waitForVoices(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
  if (window.speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", finish);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", finish);
    window.setTimeout(finish, 800);
  });
}

export function tableLabelToAnnouncement(label: string, kind: "order" | "service" = "order"): string {
  const trimmed = label.replace(/\s+/g, " ").trim();
  const spoken = toSpokenPersian(trimmed || "میز");
  return kind === "service" ? `درخواست خدمت، ${spoken}` : `سفارش جدید، ${spoken}`;
}

let audioPrimed = false;
let fallbackAudio: HTMLAudioElement | null = null;

function ensureFallbackAudio(src = FALLBACK_SRC): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!fallbackAudio) fallbackAudio = new Audio(src);
  return fallbackAudio;
}

/** مرورگر بدون یک کلیک صدا را مسدود می‌کند؛ بعد از اولین لمس صفحه صدا آزاد می‌شود. */
export function bindAnnouncementAudioUnlock(src = FALLBACK_SRC): () => void {
  if (typeof window === "undefined") return () => {};
  const prime = () => {
    if (audioPrimed) return;
    audioPrimed = true;
    try {
      window.speechSynthesis?.resume();
      const warm = new SpeechSynthesisUtterance("\u200c");
      warm.volume = 0;
      warm.rate = 2;
      warm.lang = "fa-IR";
      window.speechSynthesis?.speak(warm);
    } catch {
      /* ignore */
    }
    try {
      const audio = ensureFallbackAudio(src);
      if (!audio) return;
      audio.muted = true;
      void audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {
          audio.muted = false;
        });
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("pointerdown", prime);
  window.addEventListener("keydown", prime);
  return () => {
    window.removeEventListener("pointerdown", prime);
    window.removeEventListener("keydown", prime);
  };
}

export function playAnnouncementFallback(src = FALLBACK_SRC): Promise<boolean> {
  try {
    const audio = ensureFallbackAudio(src);
    if (!audio) return Promise.resolve(false);
    audio.muted = false;
    audio.currentTime = 0;
    return audio
      .play()
      .then(() => true)
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * تبدیل متن فارسی به صدا با موتور خود مرورگر (بدون پکیج و بدون مدل سنگین).
 * موفقیت فقط وقتی است که پخش واقعاً شروع شود.
 */
export async function speakPersianAnnouncement(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) return false;
  await waitForVoices();
  const synth = window.speechSynthesis;
  const voice = pickFemaleFaVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang || "fa-IR";
  utterance.rate = 0.92;
  utterance.pitch = 1.08;
  utterance.volume = 1;
  if (voice) utterance.voice = voice;

  try {
    synth.resume();
    synth.cancel();
  } catch {
    /* ignore */
  }
  // کروم اگر بلافاصله بعد از cancel صدا بدهد، اغلب ساکت می‌ماند.
  await wait(80);
  synth.resume();

  return new Promise((resolve) => {
    let settled = false;
    let started = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearInterval(keepAlive);
      window.clearTimeout(startWatch);
      resolve(ok);
    };
    utterance.onstart = () => {
      started = true;
    };
    utterance.onend = () => done(started);
    utterance.onerror = () => done(false);
    const keepAlive = window.setInterval(() => {
      if (settled) return;
      try {
        if (synth.paused) synth.resume();
      } catch {
        /* ignore */
      }
    }, 250);
    const startWatch = window.setTimeout(() => {
      if (!started) done(false);
    }, 1800);
    try {
      synth.speak(utterance);
    } catch {
      done(false);
    }
  });
}

export async function announceTableEvent(
  label: string,
  kind: "order" | "service" = "order",
): Promise<void> {
  const spoken = tableLabelToAnnouncement(String(label || "").trim() || (kind === "service" ? "اتاق" : "میز"), kind);
  const ok = await speakPersianAnnouncement(spoken);
  if (!ok) await playAnnouncementFallback();
}
