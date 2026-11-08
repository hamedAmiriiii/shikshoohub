"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import {
  formatNumber,
  formatPayrollHours,
  salaryTypeLabel,
  type PayrollPayslip,
} from "@/app/lib/payroll";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";

type Props = {
  slip: PayrollPayslip | null;
  onClose: () => void;
};

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 2,
        py: 0.45,
        fontSize: 13,
        color: muted ? "var(--admin-text-muted)" : "var(--admin-text)",
      }}
    >
      <Typography sx={{ fontSize: 13 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{value}</Typography>
    </Box>
  );
}

function baseRows(slip: PayrollPayslip): Array<[string, string]> {
  const money = (n: number) => `${formatNumber(n)} تومان`;
  const hours = (n: number) => `${formatPayrollHours(n)} ساعت`;
  const days = (n: number) => `${formatPayrollHours(n)} روز`;
  const typeLabel = salaryTypeLabel(slip.salaryType);

  if (slip.salaryType === "daily") {
    return [
      ["نوع حقوق", typeLabel],
      ["دستمزد روزانه", money(slip.dailyWage)],
      ["روز کارکرد", slip.hasHours ? days(slip.daysWorked) : "ثبت نشده"],
      [
        "اضافه‌کار",
        slip.overtimeHours > 0
          ? `${hours(slip.overtimeHours)} — ${money(slip.overtimePay)}`
          : "۰",
      ],
      ["حقوق روزها", money(slip.regularPay)],
    ];
  }

  if (slip.salaryType === "hourly") {
    return [
      ["نوع حقوق", typeLabel],
      ["نرخ ساعتی", money(slip.overtimeHourly)],
      ["ساعت کارکرد", slip.hasHours ? hours(slip.hoursWorked) : "ثبت نشده"],
      ["حقوق ساعتی", money(slip.regularPay)],
    ];
  }

  if (slip.salaryType === "fixed") {
    return [
      ["نوع حقوق", typeLabel],
      ["مبلغ توافقی ماه", money(slip.baseEarned || slip.regularPay)],
    ];
  }

  if (slip.salaryType === "commission" || slip.salaryType === "mixed") {
    const rows: Array<[string, string]> = [
      ["نوع حقوق", typeLabel],
    ];
    if (slip.salaryType === "mixed") {
      rows.push(
        ["ساعت موظف", hours(slip.baseHours)],
        ["ساعت کارکرد", slip.hasHours ? hours(slip.hoursWorked) : "ثبت نشده"],
        ["حقوق کارکرد", money(slip.regularPay)],
      );
    }
    rows.push(
      ["فروش ماه", money(slip.commissionSales)],
      ["پورسانت", money(slip.commissionAmount)],
    );
    return rows;
  }

  return [
    ["نوع حقوق", typeLabel],
    ["ساعت موظف", hours(slip.baseHours)],
    ["ساعت کارکرد", slip.hasHours ? hours(slip.hoursWorked) : "ثبت نشده"],
    [
      "اضافه‌کار",
      slip.overtimeHours > 0
        ? `${hours(slip.overtimeHours)} — ${money(slip.overtimePay)}`
        : "۰",
    ],
    [
      "کسر کار / مرخصی",
      slip.shortageHours > 0
        ? `${hours(slip.shortageHours)} — ${money(slip.shortageAmount)}`
        : "۰",
    ],
    ["حقوق کارکرد", money(slip.regularPay)],
  ];
}

function buildPrintHtml(slip: PayrollPayslip): string {
  const money = (n: number) => `${formatNumber(n)} تومان`;
  const rows = [
    ...baseRows(slip),
    ["پایه محاسبه", money(slip.baseEarned || slip.regularPay + slip.overtimePay)],
    ...slip.items.map(
      (item) =>
        [`${item.typeLabel}: ${item.title}`, money(item.signedAmount)] as [string, string],
    ),
    ["جمع پاداش/مزایا", money(slip.itemsAddition)],
    ["جمع کسورات/مالیات/بیمه", money(slip.itemsDeduction)],
    ["خالص قابل پرداخت", money(slip.salary)],
    ["مساعده", money(slip.advances)],
    ["پرداخت حقوق", money(slip.salaryPayments)],
    ["سایر پرداخت", money(slip.otherPayments)],
    ["جمع پرداخت‌شده", money(slip.totalPaid)],
    ["مانده", money(slip.remaining)],
  ];
  const paymentRows = slip.payments
    .map(
      (p) =>
        `<tr><td>${p.typeLabel}${p.title ? ` — ${p.title}` : ""}</td><td>${money(p.amount)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>فیش حقوقی ${slip.employeeName}</title>
  <style>
    body { font-family: Tahoma, "IRANSans", sans-serif; direction: rtl; padding: 24px; color: #111; }
    h1 { font-size: 18px; text-align: center; margin: 0 0 4px; }
    .shop { text-align: center; font-size: 13px; margin-bottom: 16px; color: #444; }
    .meta { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { border-bottom: 1px solid #ddd; padding: 7px 4px; }
    td:last-child { text-align: left; white-space: nowrap; font-weight: 700; }
    .foot { margin-top: 28px; display: flex; justify-content: space-between; font-size: 12px; color: #555; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>فیش حقوقی</h1>
  ${slip.shopName ? `<div class="shop">${slip.shopName}</div>` : ""}
  <div class="meta">
    <span>کارمند: ${slip.employeeName}</span>
    <span>${slip.periodLabel}</span>
  </div>
  <div class="meta">
    <span>تلفن: ${slip.employeePhone}</span>
    <span>وضعیت: ${slip.statusLabel}</span>
  </div>
  <table>
    ${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
  </table>
  ${
    paymentRows
      ? `<h3 style="font-size:14px;margin:18px 0 8px">پرداخت‌ها</h3><table>${paymentRows}</table>`
      : ""
  }
  <div class="foot">
    <span>امضا کارمند</span>
    <span>امضا فروشگاه</span>
  </div>
</body>
</html>`;
}

export function printPayrollPayslip(slip: PayrollPayslip) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=780,height=900");
  if (!popup) return false;
  popup.document.write(buildPrintHtml(slip));
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 250);
  return true;
}

export default function PayrollPayslipDialog({ slip, onClose }: Props) {
  if (!slip) return null;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>فیش حقوقی — {slip.employeeName}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", pt: 0.5 }}>
          {slip.shopName ? (
            <Typography sx={{ textAlign: "center", color: "var(--admin-text-muted)", fontSize: 13, mb: 1 }}>
              {slip.shopName}
            </Typography>
          ) : null}
          <Row label="دوره" value={slip.periodLabel} />
          <Row label="تلفن" value={slip.employeePhone} />
          <Row label="وضعیت" value={slip.statusLabel} />
          <Divider sx={{ my: 1, borderColor: "var(--admin-border)" }} />
          {baseRows(slip).map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
          <Divider sx={{ my: 1, borderColor: "var(--admin-border)" }} />
          <Row
            label="پایه محاسبه"
            value={`${formatNumber(slip.baseEarned || slip.regularPay + slip.overtimePay)} تومان`}
          />
          {slip.items.map((item, idx) => (
            <Row
              key={`${item.title}-${idx}`}
              label={`${item.typeLabel}: ${item.title}`}
              value={`${formatNumber(item.signedAmount)} تومان`}
              muted
            />
          ))}
          {slip.itemsAddition > 0 ? (
            <Row label="جمع پاداش/مزایا" value={`${formatNumber(slip.itemsAddition)} تومان`} />
          ) : null}
          {slip.itemsDeduction > 0 ? (
            <Row label="جمع کسورات/مالیات/بیمه" value={`${formatNumber(slip.itemsDeduction)} تومان`} />
          ) : null}
          <Row label="خالص قابل پرداخت" value={`${formatNumber(slip.salary)} تومان`} />
          <Row label="مساعده" value={`${formatNumber(slip.advances)} تومان`} muted />
          <Row label="پرداخت حقوق" value={`${formatNumber(slip.salaryPayments)} تومان`} muted />
          <Row label="سایر پرداخت" value={`${formatNumber(slip.otherPayments)} تومان`} muted />
          <Row label="جمع پرداخت‌شده" value={`${formatNumber(slip.totalPaid)} تومان`} />
          <Row label="مانده" value={`${formatNumber(slip.remaining)} تومان`} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: "var(--admin-text-muted)" }}>
          بستن
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => printPayrollPayslip(slip)}
          sx={{
            ...adminButtonStartIconSx,
            backgroundColor: "var(--admin-accent)",
            "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
          }}
        >
          چاپ
        </Button>
      </DialogActions>
    </Dialog>
  );
}
