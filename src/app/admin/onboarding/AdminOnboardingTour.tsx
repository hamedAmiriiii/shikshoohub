"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  LinearProgress,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  ADMIN_ONBOARDING_STEPS,
  type AdminOnboardingStep,
} from "./adminOnboardingSteps";
import { adminOnboardingFloatingPanelSx } from "./adminOnboardingPanelPosition";

type Props = {
  open: boolean;
  stepIndex: number;
  onClose: () => void;
  onStartPractice: (step: AdminOnboardingStep) => void;
  onSkipStep: () => void;
  onPrev: () => void;
  onNextIntro: () => void;
  onFinish: () => void;
};

export default function AdminOnboardingTour({
  open,
  stepIndex,
  onClose,
  onStartPractice,
  onSkipStep,
  onPrev,
  onNextIntro,
  onFinish,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const step = ADMIN_ONBOARDING_STEPS[stepIndex];
  const total = ADMIN_ONBOARDING_STEPS.length;
  const progress = ((stepIndex + 1) / total) * 100;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted || !step) return null;

  const isIntro = step.kind === "intro";
  const isFinish = step.kind === "finish";
  const isPractice = step.kind === "practice";

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 10055,
        bgcolor: "rgba(15, 23, 42, 0.75)",
      }}
      role="dialog"
      aria-modal
      aria-labelledby="admin-onboarding-title"
    >
      <Paper
        elevation={8}
        sx={{
          ...adminOnboardingFloatingPanelSx,
          zIndex: 10056,
          maxHeight: {
            xs: "calc(100vh - 116px)",
            md: "calc(100vh - 48px)",
          },
          overflowY: "auto",
          p: 2.5,
          borderRadius: "16px",
          bgcolor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography
            id="admin-onboarding-title"
            sx={{
              fontWeight: 700,
              fontSize: "18px",
              color: "var(--admin-text)",
              pr: 1,
            }}
          >
            {step.title}
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="بستن آموزش"
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
          {isPractice && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<PlayArrowIcon />}
              onClick={() => onStartPractice(step)}
              sx={{
                py: 1.25,
                fontWeight: 700,
                bgcolor: "var(--admin-accent)",
                color: "#fff",
                "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "#fff" },
              }}
            >
              شروع این مرحله
            </Button>
          )}

          {isIntro && (
            <Button
              variant="contained"
              fullWidth
              onClick={onNextIntro}
              sx={{
                py: 1.25,
                fontWeight: 700,
                bgcolor: "var(--admin-accent)",
                color: "#fff",
                "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "#fff" },
              }}
            >
              بزن بریم
            </Button>
          )}

          {isFinish && (
            <Button
              variant="contained"
              fullWidth
              onClick={onFinish}
              sx={{
                py: 1.25,
                fontWeight: 700,
                bgcolor: "var(--admin-accent)",
                color: "#fff",
                "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "#fff" },
              }}
            >
              پایان آموزش
            </Button>
          )}

          <Divider sx={{ borderColor: "var(--admin-divider)", my: 0.5 }} />

          {(stepIndex > 0 && !isFinish) || isPractice ? (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              {stepIndex > 0 && !isFinish && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={onPrev}
                  sx={{
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
                  }}
                >
                  قبلی
                </Button>
              )}
              {isPractice && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={onSkipStep}
                  sx={{
                    flex: 1,
                    minHeight: 42,
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderColor: "var(--admin-border)",
                    color: "var(--admin-text-muted)",
                    "&:hover": {
                      borderColor: "var(--admin-text-secondary)",
                      bgcolor: "var(--admin-surface-alt)",
                      color: "var(--admin-text)",
                    },
                  }}
                >
                  رد کردن این مرحله
                </Button>
              )}
            </Box>
          ) : null}

          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{
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
            }}
          >
            رد کردن کل آموزش
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
