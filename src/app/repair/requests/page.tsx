"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Paper, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { formatFaDate, formatToman, isRepairError, repairApi, type RepairRequest } from "@/app/lib/repair/api";
import { EmptyState, Loader, StatusChip, useRequireRole } from "../ui";

export default function MyRepairRequestsPage() {
  const { allowed } = useRequireRole(["customer"]);
  const [rows, setRows] = useState<RepairRequest[] | null>(null);

  useEffect(() => {
    if (!allowed) return;
    void repairApi.myRequests().then((res) => setRows(isRepairError(res) ? [] : res.requests));
  }, [allowed]);

  if (!allowed || rows === null) return <Loader />;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={800}>
          درخواست‌های من
        </Typography>
        <Button component={Link} href="/repair/requests/new" variant="contained" startIcon={<AddIcon />}>
          درخواست جدید
        </Button>
      </Stack>

      {rows.length === 0 ? (
        <EmptyState text="هنوز درخواستی ثبت نکرده‌اید." />
      ) : (
        rows.map((row) => (
          <Paper
            key={row.id}
            component={Link}
            href={`/repair/requests/${row.id}`}
            variant="outlined"
            sx={{ p: 2, borderRadius: 3, textDecoration: "none", color: "inherit", display: "block" }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography fontWeight={700}>
                #{row.id} {row.category ? `· ${row.category}` : ""}
              </Typography>
              <StatusChip status={row.status} label={row.status_label} />
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              {row.description}
            </Typography>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatFaDate(row.created_at)}
              </Typography>
              {row.total_amount > 0 && (
                <Typography variant="caption" fontWeight={700}>
                  {formatToman(row.total_amount)}
                </Typography>
              )}
            </Stack>
            {row.status === "invoiced" && (
              <Typography variant="caption" color="secondary.main" fontWeight={700}>
                منتظر پرداخت شما
              </Typography>
            )}
          </Paper>
        ))
      )}
    </Stack>
  );
}
