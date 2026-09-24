"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import { printProformaReceipt, proformaToSaleReceipt, writeProformaCartLoad } from "@/app/lib/proformaCart";

type ProformaItem = {
  name?: string;
  quantity?: number | string;
  sale_price?: number | string;
};

type Proforma = {
  id: number;
  phone?: string | null;
  discount_amount?: number | string;
  total_amount?: number | string;
  items?: ProformaItem[];
  created_at?: string;
};

function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "۰";
  return new Intl.NumberFormat("fa-IR").format(Math.round(n));
}

function shopNameFromUser(): string | undefined {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.atelier_name || user.name || user.shop_name || undefined;
  } catch {
    return undefined;
  }
}

export default function ProformasPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await FetchWithJwtClient("GET", "/api/proforma-invoices");
    setLoading(false);
    if (!res || res.hasError) {
      toast.error(getApiErrorMessage(res, "خطا در دریافت پیش‌فاکتورها"));
      return;
    }
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    setRows(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (row: Proforma) => {
    setBusyId(row.id);
    const res = await FetchWithJwtClient("DELETE", `/api/proforma-invoices/${row.id}`);
    setBusyId(null);
    if (!res || res.hasError) {
      toast.error(getApiErrorMessage(res, "حذف پیش‌فاکتور انجام نشد"));
      return;
    }
    toast.success("پیش‌فاکتور حذف شد");
    setRows((prev) => prev.filter((item) => item.id !== row.id));
  };

  const openInCart = (row: Proforma) => {
    writeProformaCartLoad({
      id: row.id,
      phone: row.phone,
      discount_amount: row.discount_amount,
      total_amount: row.total_amount,
      created_at: row.created_at,
      items: row.items || [],
    });
    router.push("/admin");
  };

  const printRow = async (row: Proforma) => {
    const receipt = proformaToSaleReceipt(
      {
        id: row.id,
        phone: row.phone,
        discount_amount: row.discount_amount,
        created_at: row.created_at,
        items: row.items || [],
      },
      shopNameFromUser(),
    );
    const result = printProformaReceipt(receipt);
    if (!result.ok) toast.warn(result.message);
  };

  return (
    <Box sx={{ ...adminPageSx, direction: "rtl" }}>
      <ToastContainer position="top-center" rtl />
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 0.5, color: "var(--admin-text)" }}>
          لیست پیش فاکتور
        </Typography>
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, mb: 2 }}>
          این‌ها خرید نیستند و موجودی را کم نمی‌کنند. ثبت فروش همین اقلام را داخل سبد می‌گذارد تا پرداخت و ثبت از همان‌جا انجام شود.
        </Typography>
        <Paper sx={{ overflow: "auto", bgcolor: "var(--admin-surface)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>شماره</TableCell>
                <TableCell>مشتری</TableCell>
                <TableCell>اقلام</TableCell>
                <TableCell>مبلغ</TableCell>
                <TableCell align="left">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>در حال دریافت...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>پیش‌فاکتوری ثبت نشده است</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.phone || "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>
                      {(row.items || [])
                        .map((item) => `${item.name || "کالا"} × ${item.quantity}`)
                        .join("، ")}
                    </TableCell>
                    <TableCell>{formatNumber(row.total_amount)} تومان</TableCell>
                    <TableCell align="left">
                      <Box sx={{ display: "flex", gap: 0.75, justifyContent: "flex-end" }}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={busyId === row.id}
                          onClick={() => openInCart(row)}
                        >
                          ثبت فروش
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={busyId === row.id}
                          onClick={() => void printRow(row)}
                        >
                          چاپ
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={busyId === row.id}
                          onClick={() => void remove(row)}
                        >
                          حذف
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Container>
    </Box>
  );
}
