"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminOnboardingTour from "./AdminOnboardingTour";
import AdminOnboardingPracticeBar from "./AdminOnboardingPracticeBar";
import SettingsSetupWizard from "./SettingsSetupWizard";
import {
  ADMIN_ONBOARDING_START_EVENT,
  ADMIN_ONBOARDING_STEPS,
  type AdminOnboardingStep,
} from "./adminOnboardingSteps";
import {
  SETTINGS_SETUP_START_EVENT,
  type SettingsSetupAnswers,
} from "./settingsSetupSteps";
import {
  clearOnboardingProgress,
  isOnboardingCompleted,
  markOnboardingCompleted,
  readOnboardingPracticeMode,
  readOnboardingStepIndex,
  writeOnboardingPracticeMode,
  writeOnboardingStepIndex,
} from "./adminOnboardingStorage";
import {
  clearSettingsSetupProgress,
  isSettingsSetupCompleted,
  markSettingsSetupCompleted,
  readSettingsSetupProgress,
  writeSettingsSetupProgress,
} from "./settingsSetupStorage";
import {
  adminSaleCartHasItems,
  COMPLETE_SALE_STEP_ID,
  getSaleAddCartStepIndex,
  SALE_ADD_CART_STEP_ID,
} from "./adminSaleCartCheck";
import { toast } from "react-toastify";

const PUBLIC_PATHS = ["/admin/login", "/admin/register-shop"];

function isPublicAdminPath(pathname: string | null) {
  if (!pathname) return true;
  return PUBLIC_PATHS.some((p) => pathname.includes(p));
}

export default function AdminOnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [settingsSetupOpen, setSettingsSetupOpen] = useState(false);
  const [settingsStepId, setSettingsStepId] = useState("intro");
  const [settingsAnswers, setSettingsAnswers] = useState<SettingsSetupAnswers>({});

  const step = ADMIN_ONBOARDING_STEPS[stepIndex];

  const beginSettingsSetup = useCallback(
    (reset: boolean) => {
      if (isPublicAdminPath(pathname)) return;
      if (reset) {
        clearSettingsSetupProgress();
        setSettingsStepId("intro");
        setSettingsAnswers({});
      } else {
        const saved = readSettingsSetupProgress();
        setSettingsStepId(saved?.stepId || "intro");
        setSettingsAnswers(saved?.answers || {});
      }
      setActive(false);
      setGuideOpen(false);
      setPracticeMode(false);
      setSettingsSetupOpen(true);
    },
    [pathname],
  );

  const beginTour = useCallback(
    (reset: boolean) => {
      if (isPublicAdminPath(pathname)) return;
      if (reset) {
        clearOnboardingProgress();
        setStepIndex(0);
        writeOnboardingStepIndex(0);
        writeOnboardingPracticeMode(false);
        setPracticeMode(false);
        setGuideOpen(true);
      } else {
        const savedStep = readOnboardingStepIndex();
        const savedPractice = readOnboardingPracticeMode();
        const idx = Math.min(savedStep, ADMIN_ONBOARDING_STEPS.length - 1);
        setStepIndex(idx);
        setPracticeMode(savedPractice);
        setGuideOpen(!savedPractice);
      }
      setActive(true);
    },
    [pathname]
  );

  useEffect(() => {
    const onStart = () => beginTour(true);
    window.addEventListener(ADMIN_ONBOARDING_START_EVENT, onStart);
    return () => window.removeEventListener(ADMIN_ONBOARDING_START_EVENT, onStart);
  }, [beginTour]);

  useEffect(() => {
    const onStart = () => beginSettingsSetup(true);
    window.addEventListener(SETTINGS_SETUP_START_EVENT, onStart);
    return () => window.removeEventListener(SETTINGS_SETUP_START_EVENT, onStart);
  }, [beginSettingsSetup]);

  useEffect(() => {
    if (!settingsSetupOpen) return;
    writeSettingsSetupProgress({ stepId: settingsStepId, answers: settingsAnswers });
  }, [settingsSetupOpen, settingsStepId, settingsAnswers]);

  useEffect(() => {
    if (isPublicAdminPath(pathname)) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    if (settingsSetupOpen) return;

    const settingsDone = isSettingsSetupCompleted();
    const onboardingDone = isOnboardingCompleted();

    if (!settingsDone && !onboardingDone && !readOnboardingPracticeMode()) {
      const timer = setTimeout(() => beginSettingsSetup(false), 800);
      return () => clearTimeout(timer);
    }

    if (!settingsDone || onboardingDone) return;

    if (readOnboardingPracticeMode()) {
      beginTour(false);
      return;
    }

    const timer = setTimeout(() => beginTour(true), 1200);
    return () => clearTimeout(timer);
  }, [pathname, beginTour, beginSettingsSetup, settingsSetupOpen]);

  const exitTour = useCallback(() => {
    setActive(false);
    setGuideOpen(false);
    setPracticeMode(false);
    markOnboardingCompleted();
  }, []);

  const goToStep = useCallback((index: number) => {
    const next = Math.max(0, Math.min(index, ADMIN_ONBOARDING_STEPS.length - 1));
    setStepIndex(next);
    writeOnboardingStepIndex(next);
  }, []);

  const showGuideForCurrentStep = useCallback(() => {
    setGuideOpen(true);
    setPracticeMode(false);
    writeOnboardingPracticeMode(false);
  }, []);

  const redirectToSaleAddCart = useCallback(() => {
    const cartStepIdx = getSaleAddCartStepIndex(ADMIN_ONBOARDING_STEPS);
    if (cartStepIdx < 0) return;
    goToStep(cartStepIdx);
    setPracticeMode(true);
    writeOnboardingPracticeMode(true);
    setGuideOpen(false);
    if (pathname !== "/admin") {
      router.push("/admin");
    }
  }, [goToStep, pathname, router]);

  const advanceAfterPractice = useCallback(() => {
    const current = ADMIN_ONBOARDING_STEPS[stepIndex];
    if (current?.id === SALE_ADD_CART_STEP_ID && !adminSaleCartHasItems()) {
      toast.error("برای ادامه، حداقل یک کالا باید در سبد فاکتور باشد.");
      return;
    }
    const nextIndex = stepIndex + 1;
    if (nextIndex >= ADMIN_ONBOARDING_STEPS.length) {
      exitTour();
      return;
    }
    goToStep(nextIndex);
    setPracticeMode(false);
    writeOnboardingPracticeMode(false);
    setGuideOpen(true);
  }, [stepIndex, exitTour, goToStep]);

  const handleStartPractice = useCallback(
    (practiceStep: AdminOnboardingStep) => {
      if (practiceStep.id === COMPLETE_SALE_STEP_ID && !adminSaleCartHasItems()) {
        toast.error("اول حداقل یک کالا به سبد فاکتور اضافه کنید.");
        redirectToSaleAddCart();
        return;
      }
      if (practiceStep.path && pathname !== practiceStep.path) {
        router.push(practiceStep.path);
      }
      setGuideOpen(false);
      setPracticeMode(true);
      writeOnboardingPracticeMode(true);
      writeOnboardingStepIndex(stepIndex);
    },
    [pathname, router, stepIndex, redirectToSaleAddCart]
  );

  useEffect(() => {
    if (!active || !step) return;
    if (step.id !== COMPLETE_SALE_STEP_ID) return;
    if (adminSaleCartHasItems()) return;
    redirectToSaleAddCart();
  }, [active, step?.id, stepIndex, redirectToSaleAddCart]);

  const handleNextIntro = useCallback(() => {
    goToStep(1);
    setGuideOpen(true);
  }, [goToStep]);

  const handleSkipStep = useCallback(() => {
    const current = ADMIN_ONBOARDING_STEPS[stepIndex];
    if (current?.id === SALE_ADD_CART_STEP_ID && !adminSaleCartHasItems()) {
      toast.error("این مرحله را نمی‌توان رد کرد؛ ابتدا کالا به سبد اضافه کنید.");
      return;
    }
    advanceAfterPractice();
  }, [advanceAfterPractice, stepIndex]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      goToStep(stepIndex - 1);
      setGuideOpen(true);
      setPracticeMode(false);
      writeOnboardingPracticeMode(false);
    }
  }, [stepIndex, goToStep]);

  const handleFinish = useCallback(() => {
    exitTour();
  }, [exitTour]);

  const finishSettingsSetup = useCallback(() => {
    markSettingsSetupCompleted();
    setSettingsSetupOpen(false);
  }, []);

  const showUi = active && !settingsSetupOpen && !isPublicAdminPath(pathname) && step;

  return (
    <>
      {children}
      {settingsSetupOpen && !isPublicAdminPath(pathname) && (
        <SettingsSetupWizard
          open={settingsSetupOpen}
          answers={settingsAnswers}
          stepId={settingsStepId}
          onStepIdChange={setSettingsStepId}
          onAnswersChange={setSettingsAnswers}
          onClose={finishSettingsSetup}
          onFinish={finishSettingsSetup}
        />
      )}
      {showUi && practiceMode && (
        <AdminOnboardingPracticeBar
          step={step}
          stepIndex={stepIndex}
          onContinue={advanceAfterPractice}
          onShowGuide={showGuideForCurrentStep}
          onExit={exitTour}
        />
      )}
      {showUi && guideOpen && !practiceMode && (
        <AdminOnboardingTour
          open={guideOpen}
          stepIndex={stepIndex}
          onClose={exitTour}
          onStartPractice={handleStartPractice}
          onSkipStep={handleSkipStep}
          onPrev={handlePrev}
          onNextIntro={handleNextIntro}
          onFinish={handleFinish}
        />
      )}
    </>
  );
}

export function startAdminOnboarding() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ADMIN_ONBOARDING_START_EVENT));
  }
}

export function startSettingsSetup() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_SETUP_START_EVENT));
  }
}
