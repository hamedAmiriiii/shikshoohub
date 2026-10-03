"use client";

import { Stack, Typography } from "@mui/material";
import { Loader, useRequireRole } from "../../ui";
import TechJobsList from "../JobsList";

export default function TechnicianNewJobsPage() {
  const { allowed } = useRequireRole(["technician"]);
  if (!allowed) return <Loader />;

  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h6" fontWeight={800}>
          درخواست‌های جدید
        </Typography>
        <Typography variant="body2" color="text.secondary">
          کارهایی که به شما ارجاع شده و هنوز شروع نکرده‌اید.
        </Typography>
      </div>
      <TechJobsList status="assigned" emptyText="درخواست جدیدی برای شما ثبت نشده است." />
    </Stack>
  );
}
