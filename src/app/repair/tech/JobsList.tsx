"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Paper, Stack, Typography } from "@mui/material";
import { formatFaDate, formatToman, isRepairError, repairApi, type RepairRequest } from "@/app/lib/repair/api";
import { EmptyState, Loader, StatusChip } from "../ui";

export default function TechJobsList({ status, emptyText }: { status?: string; emptyText: string }) {
  const [rows, setRows] = useState<RepairRequest[] | null>(null);

  useEffect(() => {
    setRows(null);
    void repairApi.techRequests(status).then((res) => setRows(isRepairError(res) ? [] : res.requests));
  }, [status]);

  if (rows === null) return <Loader />;
  if (rows.length === 0) return <EmptyState text={emptyText} />;

  return (
    <>
      {rows.map((row) => (
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
      ))}
    </>
  );
}
