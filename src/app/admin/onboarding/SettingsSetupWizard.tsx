"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Switch,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ScaleIcon from "@mui/icons-material/Scale";
import PersonIcon from "@mui/icons-material/Person";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  getVisibleSettingsSetupSteps,
  resolveSettingsSetupStepIndex,
  type SettingsSetupAnswers,
  type SettingsSetupStep,
} from "./settingsSetupSteps";
import { readAdminPosSettings, writeAdminPosSettings } from "@/app/lib/adminPosSettings";
import { readShopFeatures, SHOP_FEATURES_CHANGED_EVENT } from "@/app/lib/shopFeatures";

type Props = {
  open: boolean;
  answers: SettingsSetupAnswers;
  stepId: string;
  onStepIdChange: (stepId: string) => void;
  onAnswersChange: (answers: SettingsSetupAnswers) => void;
  onClose: () => void;
  onFinish: () => void;
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  intro: <TuneIcon sx={{ fontSize: 28 }} />,
  menuMode: <RestaurantMenuIcon sx={{ fontSize: 28 }} />,
  menuModeShowProductImages: <ImageOutlinedIcon sx={{ fontSize: 28 }} />,
  menuTableOrdersPopup: <NotificationsActiveIcon sx={{ fontSize: 28 }} />,
  showProductListOnMainPage: <Inventory2Icon sx={{ fontSize: 28 }} />,
  classicPosMode: <PointOfSaleIcon sx={{ fontSize: 28 }} />,
  installmentPaymentEnabled: <PaymentsIcon sx={{ fontSize: 28 }} />,
  debtPaymentEnabled: <AccountBalanceWalletIcon sx={{ fontSize: 28 }} />,
  chequePaymentEnabled: <ReceiptLongIcon sx={{ fontSize: 28 }} />,
  kgSalesEnabled: <ScaleIcon sx={{ fontSize: 28 }} />,
  askCustomerName: <PersonIcon sx={{ fontSize: 28 }} />,
  showDailyTicketNumber: <ConfirmationNumberOutlinedIcon sx={{ fontSize: 28 }} />,
  finish: <CheckCircleOutlineIcon sx={{ fontSize: 28 }} />,
};

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "var(--admin-accent)",
  },
};

function currentToggleValue(
  step: SettingsSetupStep,
  answers: SettingsSetupAnswers,
): boolean {
  if (!step.settingKey) return false;
  const answered = answers[step.settingKey];
  if (answered === true || answered === false) return answered;
  return Boolean(readAdminPosSettings()[step.settingKey]);
}

export default function SettingsSetupWizard({
  open,
  answers,
  stepId,
  onStepIdChange,
  onAnswersChange,
  onClose,
  onFinish,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [restaurantCafeEnabled, setRestaurantCafeEnabled] = useState(false);
  const [toggleValue, setToggleValue] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const sync = () => setRestaurantCafeEnabled(readShopFeatures().restaurant_cafe_enabled);
    sync();
    window.addEventListener(SHOP_FEATURES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SHOP_FEATURES_CHANGED_EVENT, sync);
  }, []);

  const visibleSteps = useMemo(
    () => getVisibleSettingsSetupSteps({ answers, restaurantCafeEnabled }),
    [answers, restaurantCafeEnabled],
  );

  const stepIndex = resolveSettingsSetupStepIndex(visibleSteps, stepId);
  const step = visibleSteps[stepIndex] ?? visibleSteps[0];
  const total = visibleSteps.length;
  const progress = total > 0 ? ((stepIndex + 1) / total) * 100 : 0;

  useEffect(() => {
    if (!step) return;
    if (step.id !== stepId) {
      onStepIdChange(step.id);
    }
  }, [step, stepId, onStepIdChange]);

  useEffect(() => {
    if (!step || step.kind !== "toggle") return;
    setToggleValue(currentToggleValue(step, answers));
  }, [step, answers]);

  if (!open || !mounted || !step) return null;

  const isIntro = step.kind === "intro";
  const isFinish = step.kind === "finish";
  const isToggle = step.kind === "toggle";

  const goRelative = (delta: number) => {
    const next = visibleSteps[stepIndex + delta];
    if (next) onStepIdChange(next.id);
  };

  const applyAnswer = (value: boolean | "skipped") => {
    if (!step.settingKey) {
      goRelative(1);
      return;
    }
    const nextAnswers: SettingsSetupAnswers = { ...answers, [step.settingKey]: value };
    if (value === true || value === false) {
      writeAdminPosSettings({ [step.settingKey]: value });
    }
    onAnswersChange(nextAnswers);
    const nextVisible = getVisibleSettingsSetupSteps({
      answers: nextAnswers,
      restaurantCafeEnabled,
    });
    const currentIdx = nextVisible.findIndex((item) => item.id === step.id);
    const nextStep = nextVisible[currentIdx + 1] ?? nextVisible[nextVisible.length - 1];
    if (nextStep) onStepIdChange(nextStep.id);
  };

  const handleSave = () => applyAnswer(toggleValue);
  const handleSkip = () => applyAnswer("skipped");

  const handlePrev = () => goRelative(-1);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 10060,
        bgcolor: "rgba(15, 23, 42, 0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        direction: "rtl",
      }}
      role="dialog"
      aria-modal
      aria-labelledby="settings-setup-title"
    >
      <Paper
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: 440,
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          p: 2.5,
          borderRadius: "16px",
          bgcolor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, pr: 1 }}>
            <Box sx={{ color: "var(--admin-accent)", display: "flex" }}>{STEP_ICONS[step.id]}</Box>
            <Typography
              id="settings-setup-title"
              sx={{ fontWeight: 700, fontSize: "18px", color: "var(--admin-text)" }}
            >
              {step.title}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="بستن تنظیمات"
            sx={{ color: "var(--admin-text-muted)" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mb: 1.5,
            height: 6,
            borderRadius: 3,
            bgcolor: "var(--admin-surface-alt)",
            "& .MuiLinearProgress-bar": { bgcolor: "var(--admin-accent)" },
          }}
        />

        <Typography
          component="div"
          sx={{
            color: "var(--admin-text-muted)",
            fontSize: "14px",
            lineHeight: 1.85,
            mb: 2,
            whiteSpace: "pre-line",
          }}
        >
          {step.body}
        </Typography>

        {isToggle ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              px: 1.25,
              py: 1,
              mb: 2,
              borderRadius: "12px",
              bgcolor: "var(--admin-surface-alt)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <Typography sx={{ color: "var(--admin-text)", fontSize: "13px", fontWeight: 600 }}>
              {toggleValue ? step.enableLabel : step.disableLabel}
            </Typography>
            <Switch
              checked={toggleValue}
              onChange={(e) => setToggleValue(e.target.checked)}
              sx={switchSx}
            />
          </Box>
        ) : null}

        <Typography
          sx={{
            color: "var(--admin-text-secondary)",
            fontSize: "12px",
            mb: 1.5,
            textAlign: "center",
          }}
        >
          {stepIndex + 1} از {total}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {isIntro ? (
            <Button
              variant="contained"
              fullWidth
              onClick={() => goRelative(1)}
              sx={primaryBtnSx}
            >
              بزن بریم
            </Button>
          ) : null}

          {isToggle ? (
            <Button variant="contained" fullWidth onClick={handleSave} sx={primaryBtnSx}>
              ذخیره و ادامه
            </Button>
          ) : null}

          {isFinish ? (
            <Button variant="contained" fullWidth onClick={onFinish} sx={primaryBtnSx}>
              شروع کار با فروشگاه
            </Button>
          ) : null}

          {!isFinish ? (
            <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
              {stepIndex > 0 ? (
                <Button variant="outlined" fullWidth onClick={handlePrev} sx={secondaryBtnSx}>
                  قبلی
                </Button>
              ) : null}
              {isToggle ? (
                <Button variant="outlined" fullWidth onClick={handleSkip} sx={mutedBtnSx}>
                  رد کردن این مرحله
                </Button>
              ) : null}
            </Box>
          ) : null}

          {!isFinish ? (
            <Button variant="outlined" fullWidth onClick={onClose} sx={skipAllBtnSx}>
              رد کردن همه تنظیمات
            </Button>
          ) : null}
        </Box>
      </Paper>
    </Box>
  );
}

const primaryBtnSx = {
  py: 1.25,
  fontWeight: 700,
  bgcolor: "var(--admin-accent)",
  color: "var(--admin-on-accent)",
  "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "var(--admin-on-accent)" },
};

const secondaryBtnSx = {
  flex: 1,
  minHeight: 42,
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 600,
  borderColor: "var(--admin-border)",
  color: "var(--admin-text)",
  "&:hover": {
    borderColor: "var(--admin-accent)",
    bgcolor: "var(--admin-menu-hover)",
  },
};

const mutedBtnSx = {
  ...secondaryBtnSx,
  color: "var(--admin-text-muted)",
  "&:hover": {
    borderColor: "var(--admin-text-secondary)",
    bgcolor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
  },
};

const skipAllBtnSx = {
  minHeight: 40,
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 500,
  borderColor: "var(--admin-border)",
  color: "var(--admin-text-secondary)",
  bgcolor: "transparent",
  "&:hover": {
    bgcolor: "rgba(244, 67, 54, 0.06)",
    borderColor: "rgba(244, 67, 54, 0.35)",
    color: "#e53935",
  },
};
