"use client";

import { useState } from "react";
import { Stack, Tab, Tabs } from "@mui/material";
import { Loader, useRequireRole } from "../ui";
import TechJobsList from "./JobsList";

const TABS = [
  { value: "open", label: "کارهای باز" },
  { value: "completed", label: "انجام‌شده" },
  { value: "", label: "همه" },
];

export default function TechnicianJobsPage() {
  const { allowed } = useRequireRole(["technician"]);
  const [tab, setTab] = useState("open");

  if (!allowed) return <Loader />;

  return (
    <Stack spacing={2}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
        {TABS.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>
      <TechJobsList status={tab || undefined} emptyText="کاری در این بخش نیست." />
    </Stack>
  );
}
