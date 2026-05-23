import {
  ADMIN_ONBOARDING_PRACTICE_KEY,
  ADMIN_ONBOARDING_STEP_KEY,
  ADMIN_ONBOARDING_STORAGE_KEY,
} from "./adminOnboardingSteps";

export function readOnboardingStepIndex(): number {
  if (typeof window === "undefined") return 0;
  const n = parseInt(localStorage.getItem(ADMIN_ONBOARDING_STEP_KEY) || "0", 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function writeOnboardingStepIndex(index: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_ONBOARDING_STEP_KEY, String(index));
}

export function readOnboardingPracticeMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_ONBOARDING_PRACTICE_KEY) === "1";
}

export function writeOnboardingPracticeMode(active: boolean) {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem(ADMIN_ONBOARDING_PRACTICE_KEY, "1");
  } else {
    localStorage.removeItem(ADMIN_ONBOARDING_PRACTICE_KEY);
  }
}

export function isOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_ONBOARDING_STORAGE_KEY) === "1";
}

export function markOnboardingCompleted() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_ONBOARDING_STORAGE_KEY, "1");
  writeOnboardingPracticeMode(false);
}

export function clearOnboardingProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_ONBOARDING_STORAGE_KEY);
  localStorage.removeItem(ADMIN_ONBOARDING_STEP_KEY);
  localStorage.removeItem(ADMIN_ONBOARDING_PRACTICE_KEY);
}
