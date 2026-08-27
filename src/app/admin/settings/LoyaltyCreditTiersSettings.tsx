"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Collapse,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "react-toastify";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import { parseApiErrorMessage } from "@/app/lib/translateApiMessage";
import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";

export type LoyaltyCreditTier = {
  max_amount: number | null;
  percent: number;
};

export const DEFAULT_LOYALTY_CREDIT_TIERS: LoyaltyCreditTier[] = [
  { max_amount: 3_000_000, percent: 5 },
  { max_amount: 5_000_000, percent: 3 },
  { max_amount: null, percent: 7 },
];

const MAX_TIERS = 5;

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface)",
    color: "var(--admin-text)",
    fontSize: "13px",
    borderRadius: "8px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": {
    py: 0.65,
    px: 1,
    textAlign: "center" as const,
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

function getFromAmount(index: number, tiers: LoyaltyCreditTier[]): number {
  if (index === 0) return 0;
  const prev = tiers[index - 1]?.max_amount;
  return typeof prev === "number" ? prev : 0;
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

      if (last?.max_amount === null) {
        const prevMax = next[next.length - 2]?.max_amount;
        const newCap =
          typeof prevMax === "number" ? prevMax + 1_000_000 : 3_000_000;
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

  const headCellSx = {
    color: "#fff",
    fontWeight: 700,
    fontSize: "12px",
    py: 0.85,
    px: 1,
    borderBottom: "none",
    whiteSpace: "nowrap" as const,
  };

  const bodyCellSx = {
    color: "var(--admin-text)",
    fontSize: "13px",
    py: 0.75,
    px: 1,
    borderBottom: "1px solid var(--admin-divider)",
    verticalAlign: "middle" as const,
  };

  return (
    <Box>
      <Collapse in={!disabled}>
        <Box sx={{ pt: 1 }}>
          <Box
            sx={{
              mb: 1,
              p: 0.85,
              borderRadius: "8px",
              bgcolor: "rgba(255, 193, 7, 0.12)",
              border: "1px solid rgba(255, 193, 7, 0.35)",
              display: "flex",
              alignItems: "flex-start",
              gap: 0.75,
            }}
          >
            <InfoOutlinedIcon sx={{ color: "#f59e0b", fontSize: 16, mt: 0.1, flexShrink: 0 }} />
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px", lineHeight: 1.55 }}>
              بازه‌ها از کم به زیاد بررسی می‌شوند. اولین بازه‌ای که مبلغ خرید در آن قرار گیرد
              اعمال می‌شود. فقط آخرین بازه می‌تواند بدون سقف باشد.
            </Typography>
          </Box>

          {loadingTiers ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {[1, 2, 3].map((item) => (
                <Skeleton
                  key={item}
                  variant="rounded"
                  height={44}
                  sx={{ bgcolor: "var(--admin-surface-alt)", borderRadius: "8px" }}
                />
              ))}
            </Box>
          ) : (
            <>
              <TableContainer
                sx={{
                  borderRadius: "10px",
                  border: "1px solid var(--admin-border)",
                  overflow: "hidden",
                }}
              >
                <Table size="small" sx={{ minWidth: 480 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "var(--admin-accent)" }}>
                      <TableCell align="center" sx={headCellSx}>
                        سطح
                      </TableCell>
                      <TableCell align="center" sx={headCellSx}>
                        از بازه (تومان)
                      </TableCell>
                      <TableCell align="center" sx={headCellSx}>
                        تا بازه (تومان)
                      </TableCell>
                      <TableCell align="center" sx={headCellSx}>
                        درصد اعتبار (%)
                      </TableCell>
                      <TableCell align="center" sx={{ ...headCellSx, width: 56 }}>
                        عملیات
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tiers.map((tier, index) => {
                      const noCap = tier.max_amount === null;
                      const fromAmount = getFromAmount(index, tiers);

                      return (
                        <TableRow
                          key={`tier-${index}`}
                          sx={{
                            bgcolor: index % 2 === 0 ? "var(--admin-surface)" : "var(--admin-surface-alt)",
                            "&:last-child td": { borderBottom: "none" },
                          }}
                        >
                          <TableCell align="center" sx={bodyCellSx}>
                            <Typography sx={{ fontWeight: 700, fontSize: "13px" }}>
                              {index + 1}
                            </Typography>
                          </TableCell>

                          <TableCell align="center" sx={bodyCellSx}>
                            <Typography sx={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
                              {formatNumber(fromAmount)}
                            </Typography>
                          </TableCell>

                          <TableCell align="center" sx={bodyCellSx}>
                            {noCap ? (
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "var(--admin-accent)",
                                }}
                              >
                                بدون سقف
                              </Typography>
                            ) : (
                              <TextField
                                size="small"
                                disabled={disabled}
                                value={tier.max_amount != null ? formatAmountNumber(tier.max_amount) : ""}
                                onChange={(e) => {
                                  const formatted = formatAmountInput(e.target.value);
                                  if (formatted === "") return;
                                  const parsed = parseAmountInput(formatted);
                                  if (parsed > 0) {
                                    updateTier(index, { max_amount: parsed });
                                  }
                                }}
                                sx={{ ...inputSx, minWidth: 110 }}
                                inputMode="numeric"
                              />
                            )}
                          </TableCell>

                          <TableCell align="center" sx={bodyCellSx}>
                            <TextField
                              size="small"
                              disabled={disabled}
                              value={tier.percent}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!Number.isNaN(value) && value >= 0 && value <= 100) {
                                  updateTier(index, { percent: value });
                                } else if (e.target.value === "") {
                                  updateTier(index, { percent: 0 });
                                }
                              }}
                              sx={{ ...inputSx, minWidth: 72, maxWidth: 90 }}
                            />
                          </TableCell>

                          <TableCell align="center" sx={bodyCellSx}>
                            <IconButton
                              size="small"
                              disabled={disabled || tiers.length <= 1}
                              onClick={() => removeTier(index)}
                              sx={{
                                color: "#e53935",
                                bgcolor: "rgba(229, 57, 53, 0.1)",
                                borderRadius: "8px",
                                p: 0.5,
                                "&:hover": { bgcolor: "rgba(229, 57, 53, 0.18)" },
                                "&.Mui-disabled": { opacity: 0.35 },
                              }}
                              aria-label="حذف بازه"
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {tiers.length > 0 && tiers[tiers.length - 1]?.max_amount !== null ? (
                <Box sx={{ mt: 0.75, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    size="small"
                    disabled={disabled}
                    onClick={() =>
                      updateTier(tiers.length - 1, { max_amount: null })
                    }
                    sx={{
                      fontSize: "11px",
                      color: "var(--admin-accent)",
                      py: 0.25,
                    }}
                  >
                    آخرین بازه بدون سقف
                  </Button>
                </Box>
              ) : null}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 1.25,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  disabled={disabled || tiers.length >= MAX_TIERS}
                  onClick={addTier}
                  sx={{
                    ...adminButtonStartIconSx,
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    py: 0.65,
                    px: 1.5,
                    bgcolor: "var(--admin-accent)",
                    color: "#fff",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "var(--admin-accent-hover)", boxShadow: "none" },
                  }}
                >
                  افزودن بازه جدید
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
                  disabled={disabled || isSaving}
                  onClick={handleSave}
                  sx={{
                    ...adminButtonStartIconSx,
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    py: 0.65,
                    px: 1.5,
                    bgcolor: "#2e7d32",
                    color: "#fff",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#1b5e20", boxShadow: "none" },
                    "&.Mui-disabled": {
                      bgcolor: "var(--admin-border)",
                      color: "var(--admin-text-secondary)",
                    },
                  }}
                >
                  {isSaving ? "در حال ذخیره…" : "ذخیره پلکان"}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Collapse>

      <Collapse in={disabled}>
        <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid var(--admin-divider)" }}>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px", textAlign: "center" }}>
            برای تنظیم بازه‌های اعتبار، باشگاه مشتریان را فعال کنید
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
