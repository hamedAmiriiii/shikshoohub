import {
  SETTINGS_SETUP_DONE_KEY,
  SETTINGS_SETUP_PROGRESS_KEY,
  type SettingsSetupAnswers,
} from "./settingsSetupSteps";

export type SettingsSetupProgress = {
  stepId: string;
  answers: SettingsSetupAnswers;
};

export function isSettingsSetupCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SETTINGS_SETUP_DONE_KEY) === "1";
}

export function markSettingsSetupCompleted() {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_SETUP_DONE_KEY, "1");
  localStorage.removeItem(SETTINGS_SETUP_PROGRESS_KEY);
}

export function clearSettingsSetupProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SETTINGS_SETUP_DONE_KEY);
  localStorage.removeItem(SETTINGS_SETUP_PROGRESS_KEY);
}

export function readSettingsSetupProgress(): SettingsSetupProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SETTINGS_SETUP_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SettingsSetupProgress;
    if (!parsed || typeof parsed.stepId !== "string") return null;
    return {
      stepId: parsed.stepId,
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
    };
  } catch {
    return null;
  }
}

export function writeSettingsSetupProgress(progress: SettingsSetupProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_SETUP_PROGRESS_KEY, JSON.stringify(progress));
}
