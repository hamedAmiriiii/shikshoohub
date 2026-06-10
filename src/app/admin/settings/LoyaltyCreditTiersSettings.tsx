"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Collapse,
  Skeleton,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import { toast } from "react-toastify";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import { parseApiErrorMessage } from "@/app/lib/translateApiMessage";

export type LoyaltyCreditTier = {
  max_amount: number | null;
  percent: number;
};

export const DEFAULT_LOYALTY_CREDIT_TIERS: LoyaltyCreditTier[] = [
  { max_amount: 1_000_000, percent: 3 },
  { max_amount: 2_000_000, percent: 4 },
  { max_amount: null, percent: 5 },
];

const MAX_TIERS = 5;

const TIER_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #4facfe 0%, #0d4c50 100%)",
  "linear-gradient(135deg, rgb(52, 185, 97) 0%, rgb(45, 128, 84) 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
];

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface)",
    color: "var(--admin-text)",
    fontSize: "13px",
    borderRadius: "10px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": {
    color: "var(--admin-text-muted)",
    fontSize: "12px",
  },
  "& .MuiInputBase-input": { py: 0.85 },
};

const saveBtnSx = {
  ...adminButtonStartIconSx,
  minWidth: 100,
  py: 0.85,
  px: 2,
  fontSize: "13px",
  borderRadius: "10px",
  bgcolor: "var(--admin-accent)",
  color: "#fff",
  "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "#fff" },
  "&.Mui-disabled": {
    bgcolor: "var(--admin-border)",
    color: "var(--admin-text-secondary)",
  },
};

function formatNumber(num: number): string {
  return new Intl.NumberFormat("fa-IR").format(num);
}

function parseTiersFromResponse(res: unknown): LoyaltyCreditTier[] {
  const data = res as {
    tiers?: unknown[];
    data?: { tiers?: unknown[] };
  };
  const raw = data?.tiers ?? data?.data?.tiers;
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_LOYALTY_CREDIT_TIERS.map((tier) => ({ ...tier }));
  }
  return raw.map((item) => {
    const tier = item as {
      max_amount?: number | null;
      percent?: number;
      value?: number;
    };
    const maxAmount = tier.max_amount;
    return {
      max_amount:
        maxAmount === null || maxAmount === undefined || maxAmount === ""
          ? null
          : Number(maxAmount),
      percent: Number(tier.percent ?? tier.value) || 0,
    };
  });
}

function validateTiers(tiers: LoyaltyCreditTier[]): string | null {
  if (tiers.length < 1 || tiers.length > MAX_TIERS) {
    return `بین ۱ تا ${MAX_TIERS} بازه مجاز است`;
  }

  let previousMax: number | null = null;

  for (let index = 0; index < tiers.length; index += 1) {
    const tier = tiers[index];
    const isLast = index === tiers.length - 1;

    if (tier.percent < 0 || tier.percent > 100) {
      return `درصد بازه ${index + 1} باید بین ۰ تا ۱۰۰ باشد`;
    }

    if (tier.max_amount === null) {
      if (!isLast) {
        return "فقط آخرین بازه می‌تواند بدون سقف باشد";
      }
      continue;
    }

    if (!Number.isFinite(tier.max_amount) || tier.max_amount <= 0) {
      return `سقف بازه ${index + 1} باید بیشتر از صفر باشد`;
    }

    if (previousMax !== null && tier.max_amount <= previousMax) {
      return "سقف بازه‌ها باید از کوچک به بزرگ باشد";
    }

    previousMax = tier.max_amount;
  }

  return null;
}

function getTierRangeLabel(
  tier: LoyaltyCreditTier,
  index: number,
  tiers: LoyaltyCreditTier[],
): string {
  const previous = index > 0 ? tiers[index - 1]?.max_amount : null;

  if (tier.max_amount === null) {
    if (typeof previous === "number") {
      return `بیش از ${formatNumber(previous)} تومان`;
    }
    return "همه مبالغ خرید";
  }

  if (typeof previous === "number") {
    return `از ${formatNumber(previous + 1)} تا ${formatNumber(tier.max_amount)} تومان`;
  }

  return `تا ${formatNumber(tier.max_amount)} تومان`;
}

function resolvePercentForAmount(
  amount: number,
  tiers: LoyaltyCreditTier[],
): number {
  for (const tier of tiers) {
    if (tier.max_amount === null || amount <= tier.max_amount) {
      return tier.percent;
    }
  }
  return tiers[tiers.length - 1]?.percent ?? 0;
}

type LoyaltyCreditTiersSettingsProps = {
  disabled?: boolean;
};

export default function LoyaltyCreditTiersSettings({
  disabled = false,
}: LoyaltyCreditTiersSettingsProps) {
  const [tiers, setTiers] = useState<LoyaltyCreditTier[]>(
    DEFAULT_LOYALTY_CREDIT_TIERS.map((tier) => ({ ...tier })),
  );
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        setLoadingTiers(true);
        const token = tokenCode();
        const res = await apiRequestError(
          "Get",
          {},
          {},
          "/api/settings/loyalty-credit-tiers",
          true,
          true,
          token,
        );
        if (!res.hasError) {
          setTiers(parseTiersFromResponse(res));
        }
      } catch (error) {
        console.error("Error fetching loyalty credit tiers:", error);
      } finally {
        setLoadingTiers(false);
      }
    };
    fetchTiers();
  }, []);

  const previewExamples = useMemo(() => {
    const samples = [500_000, 1_500_000, 3_000_000];
    return samples.map((amount) => {
      const percent = resolvePercentForAmount(amount, tiers);
      const credit = Math.floor((amount * percent) / 100);
      return { amount, percent, credit };
    });
  }, [tiers]);

  const updateTier = (index: number, patch: Partial<LoyaltyCreditTier>) => {
    setTiers((prev) =>
      prev.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, ...patch } : tier,
      ),
    );
  };

  const addTier = () => {
    if (tiers.length >= MAX_TIERS) return;
    setTiers((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      const previous = next[next.length - 2];

      if (last?.max_amount === null) {
        const newCap =
          typeof previous?.max_amount === "number"
            ? previous.max_amount + 1_000_000
            : 3_000_000;
        next[next.length - 1] = { ...last, max_amount: newCap };
      }

      const cappedLast = next[next.length - 1];
      next.push({
        max_amount: null,
        percent: Math.min(100, (cappedLast?.percent ?? 0) + 1),
      });
      return next;
    });
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers((prev) => {
      const next = prev.filter((_, tierIndex) => tierIndex !== index);
      if (next[next.length - 1]?.max_amount !== null) {
        next[next.length - 1] = { ...next[next.length - 1], max_amount: null };
      }
      return next;
    });
  };

  const handleSave = async () => {
    const validationError = validateTiers(tiers);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    const token = tokenCode();
    try {
      const payload = {
        tiers: tiers.map((tier) => ({
          max_amount: tier.max_amount,
          percent: tier.percent,
          value: tier.percent,
        })),
      };
      const res = await apiRequestError(
        "Put",
        {},
        payload,
        "/api/settings/loyalty-credit-tiers",
        true,
        true,
        token,
      );
      if (res.hasError) {
        toast.error(
          parseApiErrorMessage(res.errorText, "خطا در ذخیرهٔ پلکان اعتبار"),
        );
        return;
      }
      setTiers(parseTiersFromResponse(res));
      toast.success(
        res.message
          ? parseApiErrorMessage(res.message, "پلکان اعتبار ذخیره شد")
          : "پلکان اعتبار با موفقیت ذخیره شد",
      );
    } catch {
      toast.error("خطا در ذخیره بازه‌های اعتبار");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Collapse in={!disabled}>
        <Box sx={{ pt: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 1,
            }}
          >
            <Box>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "13px", fontWeight: 700 }}>
                پلکان اعتبار خرید
              </Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "11px", mt: 0.25 }}>
                به ازای هر خرید، درصدی از مبلغ به اعتبار مشتری اضافه می‌شود
              </Typography>
            </Box>
            <Chip
              size="small"
              label={`${formatNumber(tiers.length)} از ${formatNumber(MAX_TIERS)}`}
              sx={{
                height: 24,
                fontSize: "11px",
                fontWeight: 700,
                bgcolor: "var(--admin-menu-hover)",
                color: "var(--admin-accent)",
                border: "1px solid var(--admin-accent-border)",
              }}
            />
          </Box>

          <Box
            sx={{
              mb: 1.25,
              p: 1,
              borderRadius: "10px",
              bgcolor: "var(--admin-info-bg)",
              border: "1px solid var(--admin-info-border)",
              display: "flex",
              alignItems: "flex-start",
              gap: 0.75,
            }}
          >
            <InfoOutlinedIcon sx={{ color: "var(--admin-info-icon)", fontSize: 18, mt: 0.1 }} />
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px", lineHeight: 1.6 }}>
              بازه‌ها از کم به زیاد بررسی می‌شوند. اولین بازه‌ای که مبلغ خرید در آن قرار گیرد
              اعمال می‌شود. فقط آخرین بازه می‌تواند بدون سقف باشد.
            </Typography>
          </Box>

          {loadingTiers ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[1, 2, 3].map((item) => (
                <Skeleton
                  key={item}
                  variant="rounded"
                  height={72}
                  sx={{ bgcolor: "var(--admin-surface-alt)", borderRadius: "12px" }}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {tiers.map((tier, index) => {
                const isLast = index === tiers.length - 1;
                const noCap = tier.max_amount === null;
                const gradient = TIER_GRADIENTS[index % TIER_GRADIENTS.length];

                return (
                  <Box key={`tier-${index}`} sx={{ position: "relative" }}>
                    {index > 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -9,
                          right: 22,
                          width: 2,
                          height: 9,
                          bgcolor: "var(--admin-border)",
                          borderRadius: 1,
                        }}
                      />
                    )}

                    <Box
                      sx={{
                        borderRadius: "12px",
                        border: "1px solid var(--admin-border)",
                        bgcolor: "var(--admin-surface)",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          px: 1.25,
                          py: 0.85,
                          background: gradient,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              bgcolor: "rgba(255,255,255,0.22)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: 800,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography
                            sx={{
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {getTierRangeLabel(tier, index, tiers)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Chip
                            size="small"
                            label={`${tier.percent}٪`}
                            sx={{
                              height: 24,
                              fontWeight: 800,
                              fontSize: "12px",
                              bgcolor: "rgba(255,255,255,0.2)",
                              color: "#fff",
                            }}
                          />
                          <Tooltip title="حذف بازه">
                            <span>
                              <IconButton
                                size="small"
                                disabled={disabled || tiers.length <= 1}
                                onClick={() => removeTier(index)}
                                sx={{
                                  color: "#fff",
                                  bgcolor: "rgba(0,0,0,0.15)",
                                  "&:hover": { bgcolor: "rgba(0,0,0,0.28)" },
                                  "&.Mui-disabled": { color: "rgba(255,255,255,0.35)" },
                                }}
                                aria-label="حذف بازه"
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 100px" },
                          gap: 1,
                          p: 1.25,
                        }}
                      >
                        {noCap ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                              px: 1,
                              py: 0.85,
                              borderRadius: "10px",
                              bgcolor: "var(--admin-surface-alt)",
                              border: "1px dashed var(--admin-accent-border)",
                            }}
                          >
                            <AllInclusiveIcon sx={{ color: "var(--admin-accent)", fontSize: 18 }} />
                            <Typography sx={{ color: "var(--admin-text)", fontSize: "12px", fontWeight: 600 }}>
                              بدون سقف (خریدهای بالاتر از بازهٔ قبلی)
                            </Typography>
                          </Box>
                        ) : (
                          <TextField
                            size="small"
                            label="حداکثر مبلغ خرید"
                            value={tier.max_amount ?? ""}
                            disabled={disabled}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") return;
                              const parsed = parseInt(value, 10);
                              if (!Number.isNaN(parsed) && parsed > 0) {
                                updateTier(index, { max_amount: parsed });
                              }
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px" }}>
                                    تومان
                                  </Typography>
                                </InputAdornment>
                              ),
                            }}
                            sx={fieldSx}
                          />
                        )}

                        <TextField
                          size="small"
                          label="درصد اعتبار"
                          value={tier.percent}
                          disabled={disabled}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!Number.isNaN(value) && value >= 0 && value <= 100) {
                              updateTier(index, { percent: value });
                            } else if (e.target.value === "") {
                              updateTier(index, { percent: 0 });
                            }
                          }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>
                                  ٪
                                </Typography>
                              </InputAdornment>
                            ),
                          }}
                          sx={fieldSx}
                        />

                        {isLast && (
                          <Box sx={{ marginBottom: 1, gridColumn: { xs: "1", sm: "1 / -1" } }}>
                            <Button
                              size="small"
                              fullWidth
                              variant={noCap ? "contained" : "outlined"}
                              disabled={disabled}
                              onClick={() => {
                                updateTier(index, {
                                  max_amount: noCap ? 3_000_000 : null,
                                });
                              }}
                              sx={{
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: 600,
                                py: 0.75,
                                ...(noCap
                                  ? {
                                      bgcolor: "var(--admin-accent)",
                                      color: "#fff",
                                      "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                                    }
                                  : {
                                      color: "var(--admin-accent)",
                                      borderColor: "var(--admin-accent-border)",
                                    }),
                              }}
                            >
                              {noCap ? "تعیین سقف مبلغ" : "بدون سقف برای خریدهای بالاتر"}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
<Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  pt: 0.25,
                }}
              >
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  disabled={disabled || tiers.length >= MAX_TIERS}
                  onClick={addTier}
                  sx={{
                    color: "var(--admin-accent)",
                    fontSize: "12px",
                    fontWeight: 700,
                    borderRadius: "10px",
                    px: 1.5,
                  }}
                >
                  افزودن بازهٔ جدید
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={disabled || isSaving}
                  onClick={handleSave}
                  sx={saveBtnSx}
                >
                  {isSaving ? "در حال ذخیره…" : "ذخیرهٔ پلکان"}
                </Button>
              </Box>
              <Box
                sx={{
                  mt: 0.5,
                  p: 1.25,
                  borderRadius: "12px",
                  bgcolor: "var(--admin-surface-alt)",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <Typography
                  sx={{ color: "var(--admin-text)", fontSize: "12px", fontWeight: 700, mb: 1 }}
                >
                  نمونهٔ محاسبه
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {previewExamples.map((example) => (
                    <Box
                      key={example.amount}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        px: 1,
                        py: 0.75,
                        borderRadius: "8px",
                        bgcolor: "var(--admin-surface)",
                      }}
                    >
                      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px" }}>
                        خرید {formatNumber(example.amount)} تومان
                      </Typography>
                      <Typography sx={{ color: "var(--admin-accent)", fontSize: "12px", fontWeight: 700 }}>
                        اعتبار {formatNumber(example.credit)} تومان ({example.percent}٪)
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              
            </Box>
          )}
        </Box>
      </Collapse>

      <Collapse in={disabled}>
        <Box
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: "1px solid var(--admin-divider)",
          }}
        >
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px", textAlign: "center" }}>
            برای تنظیم بازه‌های اعتبار، باشگاه مشتریان را فعال کنید
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
