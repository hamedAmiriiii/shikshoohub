"use client";

import { useEffect, useState } from "react";
import { Box, Button, Paper, Typography, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";
import type { AdminOnboardingStep } from "./adminOnboardingSteps";
import { ADMIN_ONBOARDING_STEPS } from "./adminOnboardingSteps";
import {
  adminSaleCartHasItems,
  ADMIN_SALE_CART_UPDATED_EVENT,
  SALE_ADD_CART_STEP_ID,
} from "./adminSaleCartCheck";
import { adminOnboardingFloatingPanelSx } from "./adminOnboardingPanelPosition";

type Props = {
  step: AdminOnboardingStep;
  stepIndex: number;
  onContinue: () => void;
  onShowGuide: () => void;
  onExit: () => void;
};

export default function AdminOnboardingPracticeBar({
  step,
  stepIndex,
  onContinue,
  onShowGuide,
  onExit,
}: Props) {
  const total = ADMIN_ONBOARDING_STEPS.length;
  const practiceCount = ADMIN_ONBOARDING_STEPS.filter((s) => s.kind === "practice").length;
  const practiceNum = ADMIN_ONBOARDING_STEPS.slice(0, stepIndex + 1).filter(
    (s) => s.kind === "practice"
  ).length;

  const [cartReady, setCartReady] = useState(() => adminSaleCartHasItems());
  const requiresCart = step.id === SALE_ADD_CART_STEP_ID;
  const canContinue = !requiresCart || cartReady;

  useEffect(() => {
    const sync = () => setCartReady(adminSaleCartHasItems());
    sync();
    window.addEventListener(ADMIN_SALE_CART_UPDATED_EVENT, sync);
    return () => window.removeEventListener(ADMIN_SALE_CART_UPDATED_EVENT, sync);
  }, [step.id]);

  return (
    <Paper
      elevation={12}
      sx={{
        ...adminOnboardingFloatingPanelSx,
        zIndex: 10050,
        width: { xs: "calc(100% - 32px)", sm: 420 },
        p: 1.5,
        borderRadius: "16px",
        bgcolor: "var(--admin-surface)",
        border: "2px solid var(--admin-accent)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "11px",
              color: "var(--admin-accent)",
              fontWeight: 700,
              mb: 0.25,
            }}
          >
            آموزش در حال اجرا — عملی {practiceNum} از {practiceCount}
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--admin-text)",
              lineHeight: 1.4,
            }}
          >
            {step.title}
          </Typography>
          <Typography
            sx={{
              fontSize: "12px",
              color: "var(--admin-text-muted)",
              mt: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {requiresCart && !cartReady
              ? "از ایکون + سمت راست  یک کالا به سبد فاکتور اضافه کن، بعد ادامه بده."
              : "کار را انجام بده، بعد ادامه بده."}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onExit}
          aria-label="خروج از آموزش"
          sx={{ color: "var(--admin-text-muted)", mt: -0.5 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 1.25 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={onShowGuide}
          sx={{
            flex: 1,
            fontSize: "12px",
            borderColor: "var(--admin-border)",
            color: "var(--admin-text)",
          }}
        >
          راهنمای این مرحله
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={onContinue}
          disabled={!canContinue}
          sx={{
            flex: 1.2,
            fontSize: "12px",
            fontWeight: 700,
            bgcolor: "var(--admin-accent)",
            color: "#fff",
            "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "#fff" },
            "&.Mui-disabled": {
              bgcolor: "var(--admin-border)",
              color: "var(--admin-text-muted)",
            },
          }}
        >
          انجام دادم — ادامه
        </Button>
      </Box>
      <Typography
        sx={{
          fontSize: "10px",
          color: "var(--admin-text-secondary)",
          textAlign: "center",
          mt: 0.75,
        }}
      >
        گام {stepIndex + 1} از {total}
      </Typography>
    </Paper>
  );
}
