"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { formatFaDate, formatToman, isRepairError, repairApi, type RepairRequest } from "@/app/lib/repair/api";
import { EmptyState, Loader, StatusChip, useRequireRole } from "../ui";

const TABS = [
  { value: "open", label: "کارهای باز" },
  { value: "completed", label: "انجام‌شده" },
  { value: "", label: "همه" },
];

export default function TechnicianJobsPage() {
  const { allowed } = useRequireRole(["technician"]);
  const [tab, setTab] = useState("open");
  const [rows, setRows] = useState<RepairRequest[] | null>(null);

  useEffect(() => {
    if (!allowed) return;
    setRows(null);
    void repairApi.techRequests(tab || undefined).then((res) => setRows(isRepairError(res) ? [] : res.requests));
  }, [allowed, tab]);

  if (!allowed) return <Loader />;

  return (
    <Stack spacing={2}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
        {TABS.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>
      {rows === null ? (
        <Loader />
      ) : rows.length === 0 ? (
        <EmptyState text="کاری در این بخش نیست." />
      ) : (
        rows.map((row) => (
          <Paper
            key={row.id}
            component={Link}
            href={`/repair/tech/requests/${row.id}`}
            variant="outlined"
            sx={{ p: 2, borderRadius: 3, textDecoration: "none", color: "inherit", display: "block" }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography fontWeight={700}>
                #{row.id} {row.category ? `· ${row.category}` : ""}
              </Typography>
              <StatusChip status={row.status} label={row.status_label} />
            </Stack>
            <Typography variant="body2" noWrap>
              {row.description}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {row.address}
            </Typography>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatFaDate(row.assigned_at || row.created_at)}
              </Typography>
              {row.status === "completed" && row.technician_share !== undefined && (
                <Typography variant="caption" fontWeight={700} color="success.main">
                  سهم شما: {formatToman(row.technician_share)}
                </Typography>
              )}
            </Stack>
          </Paper>
        ))
      )}
    </Stack>
  );
}
