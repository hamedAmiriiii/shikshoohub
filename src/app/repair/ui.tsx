"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Chip, CircularProgress, Paper, Stack, TextField, Typography, type TextFieldProps } from "@mui/material";
import { formatFaNumber, parseAmount, repairHomeFor, type RepairRole, type RepairStatus } from "@/app/lib/repair/api";
import { useRepairAuth } from "./RepairAuth";

const STATUS_COLORS: Record<RepairStatus, "default" | "info" | "warning" | "success" | "error" | "primary" | "secondary"> = {
  pending: "warning",
  assigned: "info",
  in_progress: "primary",
  invoiced: "secondary",
  payment_review: "warning",
  completed: "success",
  canceled: "default",
};

export function StatusChip({ status, label }: { status: RepairStatus; label: string }) {
  return <Chip size="small" color={STATUS_COLORS[status] || "default"} label={label} />;
}

export function Loader() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
      {text}
    </Typography>
  );
}

export function Section({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      {(title || action) && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          {title ? (
            <Typography variant="subtitle1" fontWeight={700}>
              {title}
            </Typography>
          ) : (
            <span />
          )}
          {action}
        </Stack>
      )}
      {children}
    </Paper>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ textAlign: "left", wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function MoneyField({
  value,
  onChange,
  ...props
}: Omit<TextFieldProps, "value" | "onChange"> & { value: number; onChange: (value: number) => void }) {
  return (
    <TextField
      {...props}
      value={value ? formatFaNumber(value) : ""}
      onChange={(e) => onChange(parseAmount(e.target.value))}
      inputMode="numeric"
      slotProps={{ input: { endAdornment: <Typography variant="caption" color="text.secondary">تومان</Typography> } }}
    />
  );
}

/** اگر کاربر وارد نشده یا نقشش مجاز نیست، به صفحهٔ مناسب می‌برد. */
export function useRequireRole(roles: RepairRole[]) {
  const { user, ready } = useRepairAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = Boolean(user && roles.includes(user.role));
  const rolesKey = roles.join(",");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/repair/login?next=${encodeURIComponent(pathname || "/repair")}`);
    } else if (!rolesKey.split(",").includes(user.role)) {
      router.replace(repairHomeFor(user.role));
    }
  }, [ready, user, rolesKey, router, pathname]);

  return { user, allowed: ready && allowed };
}
