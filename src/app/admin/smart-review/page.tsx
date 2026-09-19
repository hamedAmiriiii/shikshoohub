"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import Link from "next/link";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  fetchShopHealth,
  type HealthFinding,
  type ShopHealthReport,
} from "@/app/lib/shopDataHealth";

const panelSx = {
  boxShadow: "none",
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  p: 2,
} as const;

const CATEGORY_LABEL: Record<string, string> = {
  entry: "ورود داده",
  operation: "نحوه کار",
  system: "محاسبه سیستم",
};

const SEVERITY_LABEL: Record<string, string> = {
  error: "باید بررسی شود",
  warning: "هشدار",
  info: "نکته",
};

function faNum(n: number | null | undefined) {
  return new Intl.NumberFormat("fa-IR").format(n ?? 0);
}

function severityColor(severity: string) {
  if (severity === "error") return "var(--admin-error)";
  if (severity === "warning") return "var(--admin-warning)";
  return "var(--admin-text-secondary)";
}

function FindingCard({ finding }: { finding: HealthFinding }) {
  return (
    <Box
      sx={{
        ...panelSx,
        borderColor:
          finding.severity === "error"
            ? "var(--admin-error)"
            : finding.severity === "warning"
              ? "var(--admin-warning)"
              : "var(--admin-border)",
      }}
    >
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Chip
          size="small"
          label={SEVERITY_LABEL[finding.severity] || finding.severity}
          sx={{ bgcolor: severityColor(finding.severity), color: "#fff" }}
        />
        <Chip size="small" label={CATEGORY_LABEL[finding.category] || finding.category} variant="outlined" />
        <Chip size="small" label={`${faNum(finding.count)} مورد`} variant="outlined" />
      </Box>
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{finding.title}</Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 14, lineHeight: 1.8 }}>
        {finding.detail}
      </Typography>
      <Typography sx={{ mt: 1, fontSize: 13, lineHeight: 1.8 }}>
        <strong>چه کار کنید: </strong>
        {finding.how_to_fix}
      </Typography>
      {finding.samples?.length > 0 ? (
        <Box sx={{ mt: 1.5 }}>
          {finding.samples.map((sample, idx) => (
            <Typography
              key={`${sample.id}-${idx}`}
              sx={{ fontSize: 13, color: "var(--admin-text-secondary)", lineHeight: 1.7 }}
            >
              {sample.label}
              {sample.meta ? ` — ${sample.meta}` : ""}
              {sample.amount != null ? ` — ${faNum(sample.amount)} تومان` : ""}
            </Typography>
          ))}
        </Box>
      ) : null}
      {finding.href ? (
        <Button
          component={Link}
          href={finding.href}
          size="small"
          variant="outlined"
          sx={{ mt: 1.5 }}
        >
          {finding.href_label || "رفتن"}
        </Button>
      ) : null}
    </Box>
  );
}

export default function SmartReviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ShopHealthReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchShopHealth();
      setData(res);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در بررسی هوشمند"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const findings = data?.findings ?? [];
    return {
      error: findings.filter((f) => f.severity === "error"),
      warning: findings.filter((f) => f.severity === "warning"),
      info: findings.filter((f) => f.severity === "info"),
    };
  }, [data]);

  return (
    <Box sx={adminPageSx}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 20 }}>بررسی هوشمند</Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mt: 0.5, lineHeight: 1.8 }}>
            داده‌های ثبت‌شده فروشگاه را چک می‌کند: ورود اشتباه، کار ناقص، یا ناسازگاری محاسبه.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => void load()}
          disabled={loading}
          sx={adminButtonStartIconSx}
        >
          بررسی دوباره
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : data ? (
        <>
          <Box sx={{ ...panelSx, mb: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>{data.headline}</Typography>
            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 14 }}>
              {faNum(data.summary.sales_count)} فروش بررسی شد — {faNum(data.summary.error_count)} مورد جدی،{" "}
              {faNum(data.summary.warning_count)} هشدار، {faNum(data.summary.info_count)} نکته
            </Typography>
          </Box>

          {data.findings.length === 0 ? (
            <Box sx={panelSx}>
              <Typography>موردی پیدا نشد. قیمت‌ها، فاکتورها و تسویه‌ها با هم می‌خوانند.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {grouped.error.map((finding) => (
                <FindingCard key={finding.code} finding={finding} />
              ))}
              {grouped.warning.map((finding) => (
                <FindingCard key={finding.code} finding={finding} />
              ))}
              {grouped.info.map((finding) => (
                <FindingCard key={finding.code} finding={finding} />
              ))}
            </Box>
          )}
        </>
      ) : null}

      <ToastContainer autoClose={3000} position="bottom-right" style={{ marginBottom: "76px" }} />
    </Box>
  );
}
