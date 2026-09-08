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

function voiceScore(voice: SpeechSynthesisVoice): number {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  let score = 0;
  if (/^fa/i.test(voice.lang) || name.includes("persian") || name.includes("farsi") || name.includes("فارسی")) {
    score += 50;
  }
  if (/dilara|fariba|nazanin|minu|arezoo|elham|laleh/.test(name)) score += 30;
  if (/female|woman|zira|hazel|aria|jenny|samantha|susan/.test(name)) score += 12;
  if (/male|david|mark|george|guy/.test(name)) score -= 20;
  if (voice.localService) score += 4;
  return score;
}

function pickFemaleFaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const ranked = [...voices].sort((a, b) => voiceScore(b) - voiceScore(a));
  return ranked[0] ?? null;
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

/**
 * تبدیل متن فارسی به صدا با موتور خود مرورگر (بدون پکیج و بدون مدل سنگین).
 * اگر صدا مسدود شود یا صدا موجود نباشد، false برمی‌گرداند تا صدای قبلی پخش شود.
 */
export async function speakPersianAnnouncement(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) return false;
  await waitForVoices();
  const voice = pickFemaleFaVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fa-IR";
  utterance.rate = 0.92;
  utterance.pitch = 1.08;
  utterance.volume = 1;
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    utterance.onend = () => done(true);
    utterance.onerror = () => done(false);
    try {
      window.speechSynthesis.speak(utterance);
      window.setTimeout(() => {
        if (!settled && window.speechSynthesis.speaking) done(true);
      }, 250);
    } catch {
      done(false);
    }
  });
}
