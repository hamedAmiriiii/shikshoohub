"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminOnboardingTour from "./AdminOnboardingTour";
import AdminOnboardingPracticeBar from "./AdminOnboardingPracticeBar";
import {
  ADMIN_ONBOARDING_START_EVENT,
  ADMIN_ONBOARDING_STEPS,
  type AdminOnboardingStep,
} from "./adminOnboardingSteps";
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

  const step = ADMIN_ONBOARDING_STEPS[stepIndex];

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
    if (isPublicAdminPath(pathname)) return;
    const token = localStorage.getItem("token");
    if (!token || isOnboardingCompleted()) return;

    if (readOnboardingPracticeMode()) {
      beginTour(false);
      return;
    }

    const timer = setTimeout(() => beginTour(true), 1200);
    return () => clearTimeout(timer);
  }, [pathname, beginTour]);

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

  const showUi = active && !isPublicAdminPath(pathname) && step;

  return (
    <>
      {children}
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
