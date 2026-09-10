import tokenCode from "@/app/coponent/tokenCode";

const FALLBACK_SRC = "/reserv/1.mp3";
const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir";

export type TableOrderSoundTestResult = {
  tone: boolean;
  mp3: boolean;
  speech: boolean;
  contextState: string;
  speechVoice: string | null;
  speechDurationMs: number;
  errors: string[];
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

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function persianDigitsToAscii(text: string): string {
  return text.replace(/[۰-۹٠-٩]/g, (ch) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(ch);
    if (persianIndex >= 0) return String(persianIndex);
    const arabicIndex = ARABIC_DIGITS.indexOf(ch);
    if (arabicIndex >= 0) return String(arabicIndex);
    return ch;
  });
}

function toSpokenPersian(text: string): string {
  const normalized = persianDigitsToAscii(text);
  return normalized.replace(/\d+/g, (digits) => numberToPersianWords(Number(digits)));
}

function prepareTextForSpeech(text: string): string {
  return toSpokenPersian(text.replace(/\s+/g, " ").trim());
}

function isPersianVoice(voice: SpeechSynthesisVoice): boolean {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  return /^fa/i.test(voice.lang) || name.includes("persian") || name.includes("farsi") || name.includes("فارسی");
}

function voiceScore(voice: SpeechSynthesisVoice): number {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  let score = 0;
  if (isPersianVoice(voice)) score += 50;
  if (/google/i.test(voice.name) && isPersianVoice(voice)) score += 40;
  if (!voice.localService && isPersianVoice(voice)) score += 25;
  if (/dilara|fariba|nazanin|minu|arezoo|elham|laleh/.test(name)) score += 30;
  if (/female|woman|zira|hazel|aria|jenny|samantha|susan/.test(name)) score += 12;
  if (/male|david|mark|george|guy/.test(name)) score -= 20;
  if (voice.localService && isPersianVoice(voice)) score -= 8;
  return score;
}

function listPersianVoiceCandidates(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return [];

  const ranked = [...voices].sort((a, b) => voiceScore(b) - voiceScore(a));
  const persian = ranked.filter(isPersianVoice);
  if (persian.length) return persian;

  const googleFa = ranked.filter((voice) =>
    /google.*(persian|farsi|فارسی|\bfa\b)/i.test(`${voice.name} ${voice.lang}`),
  );
  if (googleFa.length) return googleFa;

  const msFa = ranked.filter((voice) =>
    /microsoft.*(dari|persian|farsi|فارسی)/i.test(`${voice.name} ${voice.lang}`),
  );
  return msFa;
}

async function waitForVoices(maxMs = 2400): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  if (synth.getVoices().length) return;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", finish);
      window.clearInterval(poll);
      resolve();
    };
    synth.addEventListener("voiceschanged", finish);
    const poll = window.setInterval(() => {
      if (synth.getVoices().length) finish();
    }, 120);
    window.setTimeout(finish, maxMs);
  });
}

export function tableLabelToAnnouncement(label: string, kind: "order" | "service" = "order"): string {
  const trimmed = prepareTextForSpeech(label || "میز");
  return kind === "service" ? `درخواست خدمت، ${trimmed}` : `سفارش جدید، ${trimmed}`;
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
  await waitForVoices();
  const ctx = await ensureAudioContextReady();
  return Boolean(ctx);
}

function createAlertAudio(src = FALLBACK_SRC): HTMLAudioElement {
  const cached = ensureFallbackAudio(src);
  if (cached) return cached;
  const fresh = new Audio(src);
  fresh.preload = "auto";
  fresh.volume = 1;
  return fresh;
}

export async function playMp3Alert(src = FALLBACK_SRC): Promise<boolean> {
  const playOne = async (audio: HTMLAudioElement) => {
    audio.muted = false;
    audio.volume = 1;
    audio.currentTime = 0;
    await audio.play();
    return true;
  };

  try {
    return await playOne(createAlertAudio(src));
  } catch {
    try {
      const fresh = new Audio(src);
      fresh.preload = "auto";
      fresh.volume = 1;
      return await playOne(fresh);
    } catch {
      return false;
    }
  }
}

/** mp3 را پخش می‌کند و تا پایان (یا حداکثر timeout) صبر می‌کند */
export async function playMp3AlertAndWait(src = FALLBACK_SRC, timeoutMs = 5000): Promise<boolean> {
  try {
    const audio = createAlertAudio(src);
    audio.muted = false;
    audio.volume = 1;
    audio.currentTime = 0;

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        audio.onended = null;
        audio.onerror = null;
        resolve(ok);
      };
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      const timer = window.setTimeout(() => done(true), timeoutMs);
      void audio.play().catch(() => done(false));
    });
  } catch {
    return false;
  }
}

/** تست کامل صدا — فقط بعد از کلیک کاربر صدا زده شود */
export async function testTableOrderAnnouncement(): Promise<TableOrderSoundTestResult> {
  const errors: string[] = [];
  await primeAnnouncementAudio();
  const ctx = sharedAudioContext;
  const contextState = ctx?.state ?? "unsupported";

  if (contextState === "suspended") {
    errors.push("AudioContext هنوز مسدود است");
  }

  let tone = false;
  try {
    tone = await playOrderAlertTone();
    if (!tone) errors.push("زنگ Web Audio پخش نشد");
  } catch {
    errors.push("خطا در زنگ Web Audio");
  }
  await wait(1200);

  let mp3 = false;
  try {
    mp3 = await playMp3AlertAndWait();
    if (!mp3) errors.push("فایل mp3 پخش نشد");
  } catch {
    errors.push("خطا در پخش mp3");
  }
  await wait(600);

  let speech = false;
  let speechVoice: string | null = null;
  let speechDurationMs = 0;
  try {
    const speechResult = await speakPersianAnnouncement(tableLabelToAnnouncement("میز 5", "order"));
    speech = speechResult.ok;
    speechVoice = speechResult.voiceName;
    speechDurationMs = speechResult.durationMs;
    if (!speech) {
      errors.push(
        speechVoice
          ? `گفتار با صدای «${speechVoice}» شنیده نشد`
          : "گفتار از پروکسی/سرور پخش نشد — اینترنت سرور را چک کنید",
      );
    }
  } catch {
    errors.push("خطا در TTS");
  }

  return {
    tone,
    mp3,
    speech,
    contextState,
    speechVoice,
    speechDurationMs,
    errors,
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
    } catch {
      /* ignore */
    }
    void waitForVoices().catch(() => {});
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

type SpeechAttemptResult = {
  ok: boolean;
  durationMs: number;
  voiceName: string | null;
};

const MIN_SPEECH_DURATION_MS = 350;

function splitAnnouncementParts(text: string): string[] {
  return text
    .split(/[،,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function chromeResumeSpeech(synth: SpeechSynthesis) {
  window.setTimeout(() => {
    try {
      if (synth.paused) synth.resume();
      else if (synth.speaking) {
        synth.pause();
        synth.resume();
      }
    } catch {
      /* ignore */
    }
  }, 120);
}

function speakOnce(
  text: string,
  voice: SpeechSynthesisVoice | null,
  lang: string,
): Promise<SpeechAttemptResult> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve({ ok: false, durationMs: 0, voiceName: voice?.name ?? null });
  }
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang || lang;
  utterance.rate = 0.88;
  utterance.pitch = 1.02;
  utterance.volume = 1;
  if (voice) utterance.voice = voice;

  return new Promise((resolve) => {
    let settled = false;
    let started = false;
    let startAt = 0;
    const voiceName = voice?.name ?? utterance.lang;

    const done = (ok: boolean, durationMs = 0) => {
      if (settled) return;
      settled = true;
      window.clearInterval(keepAlive);
      window.clearTimeout(startWatch);
      resolve({ ok, durationMs, voiceName });
    };

    utterance.onstart = () => {
      started = true;
      startAt = Date.now();
    };
    utterance.onend = () => {
      const durationMs = started ? Date.now() - startAt : 0;
      done(started && durationMs >= MIN_SPEECH_DURATION_MS, durationMs);
    };
    utterance.onerror = () => done(false, 0);

    const keepAlive = window.setInterval(() => {
      if (settled) return;
      try {
        if (synth.paused) synth.resume();
      } catch {
        /* ignore */
      }
    }, 180);

    const startWatch = window.setTimeout(() => {
      if (!started) done(false, 0);
    }, 4500);

    try {
      synth.speak(utterance);
      chromeResumeSpeech(synth);
    } catch {
      done(false, 0);
    }
  });
}

async function resetSpeechSynth(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  try {
    synth.resume();
    if (synth.speaking || synth.pending) synth.cancel();
  } catch {
    /* ignore */
  }
  await wait(synth.speaking || synth.pending ? 200 : 80);
}

async function playAudioBlob(blob: Blob, voiceName: string): Promise<SpeechAttemptResult> {
  if (!blob.size) return { ok: false, durationMs: 0, voiceName: null };

  const startedAt = Date.now();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const audio = new Audio(objectUrl);
    audio.preload = "auto";
    audio.volume = 1;

    const ok = await new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (value: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        audio.onended = null;
        audio.onerror = null;
        resolve(value);
      };
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      const timer = window.setTimeout(() => done(true), 10000);
      void audio.play().catch(() => done(false));
    });

    const durationMs = Date.now() - startedAt;
    return {
      ok: ok && durationMs >= MIN_SPEECH_DURATION_MS,
      durationMs,
      voiceName: ok ? voiceName : null,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function playBackendPersianSpeech(text: string): Promise<SpeechAttemptResult> {
  const encoded = encodeURIComponent(text);
  const sources: Array<{ url: string; name: string; headers?: Record<string, string> }> = [
    { url: `/api/speech/announcement?text=${encoded}`, name: "پروکسی" },
  ];

  const token = tokenCode();
  if (token) {
    sources.push({
      url: `${API_BASE}/api/speech/announcement?text=${encoded}`,
      name: "سرور",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: {
          Accept: "audio/mpeg",
          ...source.headers,
        },
      });
      if (!response.ok) continue;
      const blob = await response.blob();
      const result = await playAudioBlob(blob, source.name);
      if (result.ok) return result;
    } catch {
      continue;
    }
  }

  return { ok: false, durationMs: 0, voiceName: null };
}

async function playNetworkPersianSpeech(text: string): Promise<SpeechAttemptResult> {
  if (typeof window === "undefined" || !text.trim()) {
    return { ok: false, durationMs: 0, voiceName: null };
  }

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=fa&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) return { ok: false, durationMs: 0, voiceName: null };
    const blob = await response.blob();
    return playAudioBlob(blob, "Google TTS");
  } catch {
    return { ok: false, durationMs: 0, voiceName: null };
  }
}

async function speakPartWithBestVoice(text: string): Promise<SpeechAttemptResult> {
  await waitForVoices();
  const candidates = listPersianVoiceCandidates();
  let best: SpeechAttemptResult = { ok: false, durationMs: 0, voiceName: null };

  if (candidates.length > 0) {
    for (const voice of candidates) {
      await resetSpeechSynth();
      const result = await speakOnce(text, voice, voice.lang || "fa-IR");
      if (result.durationMs > best.durationMs) best = result;
      if (result.ok) return result;
      await wait(100);
    }
  }

  const backend = await playBackendPersianSpeech(text);
  if (backend.ok) return backend;
  if (backend.durationMs > best.durationMs) best = backend;

  const network = await playNetworkPersianSpeech(text);
  if (network.ok) return network;
  if (network.durationMs > best.durationMs) best = network;

  return best;
}

/**
 * تبدیل متن فارسی به صدا با موتور خود مرورگر (بدون پکیج و بدون مدل سنگین).
 * موفقیت فقط وقتی است که پخش واقعاً شنیده شود.
 */
export async function speakPersianAnnouncement(text: string): Promise<SpeechAttemptResult> {
  if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) {
    return { ok: false, durationMs: 0, voiceName: null };
  }

  const parts = splitAnnouncementParts(prepareTextForSpeech(text));
  if (!parts.length) return { ok: false, durationMs: 0, voiceName: null };

  let totalDuration = 0;
  let voiceName: string | null = null;

  for (const part of parts) {
    const result = await speakPartWithBestVoice(part);
    if (!result.ok) return { ok: false, durationMs: totalDuration, voiceName: voiceName ?? result.voiceName };
    totalDuration += result.durationMs;
    voiceName = result.voiceName;
    await wait(180);
  }

  return { ok: true, durationMs: totalDuration, voiceName };
}

export async function announceTableEvent(
  label: string,
  kind: "order" | "service" = "order",
): Promise<void> {
  await primeAnnouncementAudio();
  void playOrderAlertTone();
  await playMp3AlertAndWait();
  await wait(200);
  const spoken = tableLabelToAnnouncement(
    String(label || "").trim() || (kind === "service" ? "اتاق" : "میز"),
    kind,
  );
  await speakPersianAnnouncement(spoken).then(() => undefined);
}
