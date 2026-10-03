"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MenuItem, Pagination, Paper, Stack, TextField, Typography } from "@mui/material";
import {
  formatFaDate,
  formatToman,
  isRepairError,
  repairApi,
  type RepairRequest,
  type RepairTechnician,
} from "@/app/lib/repair/api";
import { EmptyState, Loader, StatusChip, useRequireRole } from "../../ui";

const STATUS_OPTIONS = [
  { value: "open", label: "همهٔ باز" },
  { value: "", label: "همه" },
  { value: "pending", label: "در انتظار ارجاع" },
  { value: "assigned", label: "ارجاع به تعمیرکار" },
  { value: "in_progress", label: "در حال انجام" },
  { value: "invoiced", label: "در انتظار پرداخت" },
  { value: "payment_review", label: "بررسی رسید" },
  { value: "completed", label: "انجام شد" },
  { value: "canceled", label: "لغو شد" },
];

function AdminRequestsList() {
  const { allowed } = useRequireRole(["admin"]);
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status") ?? "open";
  const technicianId = params.get("technician_id") ?? "";
  const page = Number(params.get("page") || 1);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [rows, setRows] = useState<RepairRequest[] | null>(null);
  const [lastPage, setLastPage] = useState(1);
  const [technicians, setTechnicians] = useState<RepairTechnician[]>([]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    if (key === "status" && value === "") next.set("status", "");
    router.replace(`/repair/admin/requests?${next.toString()}`);
  };

  useEffect(() => {
    if (!allowed) return;
    void repairApi.adminTechnicians().then((res) => {
      if (!isRepairError(res)) setTechnicians(res.technicians);
    });
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    const t = window.setTimeout(() => {
      const current = params.get("q") ?? "";
      if (q.trim() !== current) setParam("q", q.trim());
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, allowed]);

  useEffect(() => {
    if (!allowed) return;
    setRows(null);
    void repairApi
      .adminRequests({ status, technician_id: technicianId, q: params.get("q") ?? "", page })
      .then((res) => {
        if (isRepairError(res)) {
          setRows([]);
          return;
        }
        setRows(res.requests);
        setLastPage(res.meta.last_page);
      });
  }, [allowed, status, technicianId, page, params]);

  if (!allowed) return <Loader />;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          size="small"
          label="جستجو (شماره، تلفن، آدرس، شرح)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
        />
        <TextField select size="small" label="وضعیت" value={status} onChange={(e) => setParam("status", e.target.value)} sx={{ minWidth: 170 }}>
          {STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value || "all"} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="تعمیرکار"
          value={technicianId}
          onChange={(e) => setParam("technician_id", e.target.value)}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">همه</MenuItem>
          {technicians.map((t) => (
            <MenuItem key={t.id} value={String(t.id)}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {rows === null ? (
        <Loader />
      ) : rows.length === 0 ? (
        <EmptyState text="درخواستی یافت نشد." />
      ) : (
        rows.map((row) => (
          <Paper
            key={row.id}
            component={Link}
            href={`/repair/admin/requests/${row.id}`}
            variant="outlined"
            sx={{ p: 2, borderRadius: 3, textDecoration: "none", color: "inherit", display: "block" }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography fontWeight={700}>
                #{row.id} {row.category ? `· ${row.category}` : ""}
              </Typography>
              <StatusChip status={row.status} label={row.status_label} />
            </Stack>
            <Typography variant="body2" noWrap>
              {row.description}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div" noWrap>
              {row.contact_name || row.customer?.name || "—"} · <span dir="ltr">{row.contact_phone}</span> · {row.address}
            </Typography>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {formatFaDate(row.created_at)} {row.technician ? `· ${row.technician.name}` : "· بدون تعمیرکار"}
              </Typography>
              {row.total_amount > 0 && (
                <Typography variant="caption" fontWeight={700}>
                  {formatToman(row.total_amount)}
                </Typography>
              )}
            </Stack>
          </Paper>
        ))
      )}

      {lastPage > 1 && (
        <Stack alignItems="center">
          <Pagination count={lastPage} page={page} onChange={(_, p) => setParam("page", String(p))} />
        </Stack>
      )}
    </Stack>
  );
}

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AdminRequestsList />
    </Suspense>
  );
}
