const FALLBACK_SRC = "/reserv/1.mp3";

export type TableOrderSoundTestResult = {
  tone: boolean;
  mp3: boolean;
  speech: boolean;
  contextState: string;
};

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
let sharedAudioContext: AudioContext | null = null;

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;
}

async function ensureAudioContextReady(): Promise<AudioContext | null> {
  const Ctx = getAudioContextClass();
  if (!Ctx) return null;
  if (!sharedAudioContext) sharedAudioContext = new Ctx();
  if (sharedAudioContext.state === "suspended") {
    try {
      await sharedAudioContext.resume();
    } catch {
      return null;
    }
  }
  return sharedAudioContext;
}

function playToneBurst(
  ctx: AudioContext,
  startAt: number,
  notes: Array<{ freq: number; delay: number; duration: number; gain: number }>,
) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(1, startAt);
  master.connect(ctx.destination);

  for (const note of notes) {
    const t0 = startAt + note.delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(note.freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.05, note.gain), t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + note.duration + 0.04);
  }
}

/** زنگ هشدار بلند — بدون فایل mp3، با Web Audio */
export async function playOrderAlertTone(): Promise<boolean> {
  try {
    const ctx = await ensureAudioContextReady();
    if (!ctx) return false;

    const bell = [
      { freq: 880, delay: 0, duration: 0.28, gain: 1 },
      { freq: 1174.66, delay: 0.22, duration: 0.28, gain: 1 },
      { freq: 1567.98, delay: 0.44, duration: 0.42, gain: 1.15 },
    ];
    const now = ctx.currentTime;
    playToneBurst(ctx, now, bell);
    playToneBurst(ctx, now + 0.95, bell);

    return true;
  } catch {
    return false;
  }
}

function ensureFallbackAudio(src = FALLBACK_SRC): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!fallbackAudio) {
    fallbackAudio = new Audio(src);
    fallbackAudio.preload = "auto";
    fallbackAudio.volume = 1;
  }
  return fallbackAudio;
}

/** بعد از کلیک کاربر — AudioContext و TTS را آماده می‌کند */
export async function primeAnnouncementAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  audioPrimed = true;
  try {
    window.speechSynthesis?.resume();
  } catch {
    /* ignore */
  }
  const ctx = await ensureAudioContextReady();
  return Boolean(ctx);
}

export async function playMp3Alert(src = FALLBACK_SRC): Promise<boolean> {
  try {
    const audio = ensureFallbackAudio(src);
    if (!audio) return false;
    audio.muted = false;
    audio.volume = 1;
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/** تست کامل صدا — فقط بعد از کلیک کاربر صدا زده شود */
export async function testTableOrderAnnouncement(): Promise<TableOrderSoundTestResult> {
  await primeAnnouncementAudio();
  const ctx = sharedAudioContext;
  const tone = await playOrderAlertTone();
  const mp3 = await playMp3Alert();
  const speech = await speakPersianAnnouncement("تست صدای سفارش حضوری، میز ۵");
  return {
    tone,
    mp3,
    speech,
    contextState: ctx?.state ?? "unsupported",
  };
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
    void ensureAudioContextReady().catch(() => {});
    try {
      const audio = ensureFallbackAudio(src);
      if (!audio) return;
      audio.muted = true;
      audio.volume = 1;
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

export async function playAnnouncementFallback(src = FALLBACK_SRC): Promise<boolean> {
  const toneOk = await playOrderAlertTone();
  const mp3Ok = await playMp3Alert(src);
  return toneOk || mp3Ok;
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
  await primeAnnouncementAudio();
  await playOrderAlertTone();
  void playMp3Alert().catch(() => {});
  const spoken = tableLabelToAnnouncement(String(label || "").trim() || (kind === "service" ? "اتاق" : "میز"), kind);
  await speakPersianAnnouncement(spoken);
}
