const FALLBACK_SRC = "/reserv/1.mp3";

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

/** زنگ هشدار — Web Audio */
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

function createAlertAudio(src = FALLBACK_SRC): HTMLAudioElement {
  const cached = ensureFallbackAudio(src);
  if (cached) return cached;
  const fresh = new Audio(src);
  fresh.preload = "auto";
  fresh.volume = 1;
  return fresh;
}

/** بعد از کلیک کاربر — AudioContext را آماده می‌کند */
export async function primeAnnouncementAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  audioPrimed = true;
  const ctx = await ensureAudioContextReady();
  return Boolean(ctx);
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

/** مرورگر بدون یک کلیک صدا را مسدود می‌کند؛ بعد از اولین لمس صفحه صدا آزاد می‌شود. */
export function bindAnnouncementAudioUnlock(src = FALLBACK_SRC): () => void {
  if (typeof window === "undefined") return () => {};
  const prime = () => {
    if (audioPrimed) return;
    audioPrimed = true;
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

/** اعلان سفارش جدید — زنگ + فایل mp3 */
export async function announceTableEvent(
  _label: string,
  _kind: "order" | "service" = "order",
): Promise<void> {
  await primeAnnouncementAudio();
  void playOrderAlertTone();
  void playMp3Alert().catch(() => {});
}
