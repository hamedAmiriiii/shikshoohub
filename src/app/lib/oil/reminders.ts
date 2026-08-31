import { isOilApiError, oilRunReminders } from "./api";
import type { OilApiError, OilReminderRun } from "./types";

const EVENT = "oil-reminders-updated";

function todayStamp() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function reminderKey(shopId: number) {
  return `oil_reminder_ran_${shopId}`;
}

export function markRemindersRanToday(shopId: number) {
  try {
    localStorage.setItem(reminderKey(shopId), todayStamp());
  } catch {
    /* ignore */
  }
}

export function didRunRemindersToday(shopId: number) {
  try {
    return localStorage.getItem(reminderKey(shopId)) === todayStamp();
  } catch {
    return false;
  }
}

export function onOilRemindersUpdated(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

function notifyRemindersUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

let inFlight: Promise<OilReminderRun | OilApiError | null> | null = null;

/** روزی یک‌بار، بی‌صدا. چند جا همزمان صدا بزنند یک درخواست می‌رود. */
export function runOilRemindersForToday(
  shopId: number,
  force = false,
): Promise<OilReminderRun | OilApiError | null> {
  if (!force && didRunRemindersToday(shopId) && !inFlight) {
    return Promise.resolve(null);
  }
  if (!inFlight) {
    inFlight = oilRunReminders()
      .then((res) => {
        if (!isOilApiError(res) || res.statusCode === 429) {
          markRemindersRanToday(shopId);
        }
        notifyRemindersUpdated();
        return res;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
