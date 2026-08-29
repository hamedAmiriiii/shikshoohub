"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  fetchBeneficiary,
  formatBeneficiaryAmount,
  formatBeneficiaryLabel,
  type BeneficiaryDetail,
  type BeneficiaryDoc,
} from "@/app/lib/beneficiaries";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";

const cellSx = {
  color: "var(--admin-text)",
  fontSize: 12,
  py: 0.9,
  px: 1.25,
  textAlign: "center",
} as const;

function docAmount(doc: BeneficiaryDoc): number {
  const value = typeof doc.amount === "string" ? parseFloat(doc.amount) : Number(doc.amount);
  return Number.isFinite(value) ? value : 0;
}

function docDate(doc: BeneficiaryDoc): string {
  return doc.date || doc.created_at || "—";
}

function DocsTable({ rows }: { rows: BeneficiaryDoc[] }) {
  if (rows.length === 0) {
    return (
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, py: 1.5, textAlign: "center" }}>
        موردی ثبت نشده است
      </Typography>
    );
  }
  return (
    <TableContainer
      component={Paper}
      sx={{
        backgroundColor: "var(--admin-surface)",
        borderRadius: "10px",
        border: "1px solid var(--admin-border)",
        boxShadow: "none",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>ردیف</TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>عنوان</TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>مبلغ</TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>تاریخ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id ?? index}>
              <TableCell sx={cellSx}>{index + 1}</TableCell>
              <TableCell sx={cellSx}>{row.title || "—"}</TableCell>
              <TableCell sx={cellSx}>{formatBeneficiaryAmount(docAmount(row))} تومان</TableCell>
              <TableCell sx={cellSx}>{docDate(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function BeneficiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [detail, setDetail] = useState<BeneficiaryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchBeneficiary(id)
      .then((row) => {
        if (!cancelled) setDetail(row);
        if (!row) toast.error("ذینفع پیدا نشد");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.25, md: 2 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.25, md: 2 } }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : !detail ? (
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>ذینفع پیدا نشد</Typography>
        ) : (
          <>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "var(--admin-text)", mb: 0.5 }}>
              {formatBeneficiaryLabel(detail)}
            </Typography>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1.5 }}>
              بدهی فقط روی اسناد پرداخت‌نشده حساب می‌شود
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 1,
                mb: 1.5,
              }}
            >
              {[
                { label: "کل خرید", value: detail.purchased_total },
                { label: "پرداخت‌شده", value: detail.paid_total },
                { label: "بدهی", value: detail.unpaid_total },
              ].map((item) => (
                <Card
                  key={item.label}
                  sx={{
                    backgroundColor: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "10px",
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ py: 1, px: 1.5, "&:last-child": { pb: 1 } }}>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>{item.label}</Typography>
                    <Typography sx={{ color: "var(--admin-accent)", fontSize: 14, fontWeight: 700 }}>
                      {formatBeneficiaryAmount(item.value)} تومان
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => router.push(`/admin/invoices?beneficiary_id=${detail.id}`)}
                sx={{
                  ...adminButtonStartIconSx,
                  color: "var(--admin-text)",
                  borderColor: "var(--admin-border)",
                  fontSize: 12,
                }}
              >
                فاکتورهای این ذینفع
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => router.push(`/admin/expenses?beneficiary_id=${detail.id}`)}
                sx={{
                  ...adminButtonStartIconSx,
                  color: "var(--admin-text)",
                  borderColor: "var(--admin-border)",
                  fontSize: 12,
                }}
              >
                هزینه‌های این ذینفع
              </Button>
            </Box>

            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", mb: 1 }}>
              فاکتورها
            </Typography>
            <DocsTable rows={detail.invoices || []} />

            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", mt: 2, mb: 1 }}>
              هزینه‌ها
            </Typography>
            <DocsTable rows={detail.expenses || []} />
          </>
        )}
        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
