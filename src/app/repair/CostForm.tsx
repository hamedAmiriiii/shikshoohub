"use client";

import { useEffect, useState } from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";
import { formatToman, type RepairRequest } from "@/app/lib/repair/api";
import { MoneyField, Section } from "./ui";

export type CostFormValues = {
  labor_amount: number;
  parts_amount: number;
  cost_description?: string;
  share_percent?: number;
};

function SummaryRow({ label, value, bold, success }: { label: string; value: string; bold?: boolean; success?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={bold ? 800 : 400} color={success ? "success.main" : "text.primary"}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function CostForm({
  request,
  withShare = false,
  busy,
  onSubmit,
}: {
  request: RepairRequest;
  withShare?: boolean;
  busy: boolean;
  onSubmit: (values: CostFormValues) => void;
}) {
  const [labor, setLabor] = useState(request.labor_amount || 0);
  const [parts, setParts] = useState(request.parts_amount || 0);
  const [description, setDescription] = useState(request.cost_description || "");
  const [share, setShare] = useState(String(request.share_percent ?? ""));

  useEffect(() => {
    setLabor(request.labor_amount || 0);
    setParts(request.parts_amount || 0);
    setDescription(request.cost_description || "");
    setShare(String(request.share_percent ?? ""));
  }, [request]);

  const sharePercent = Number(share) || 0;
  const technicianShare = Math.round((labor * sharePercent) / 100) + parts;
  const isEdit = request.total_amount > 0;

  return (
    <Section title={isEdit ? "ویرایش هزینه" : "ثبت هزینه"}>
      <Stack spacing={2}>
        <MoneyField label="اجرت" value={labor} onChange={setLabor} fullWidth />
        <MoneyField label="هزینهٔ قطعات" value={parts} onChange={setParts} fullWidth />
        <TextField
          label="شرح کار و قطعات"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
        {withShare && (
          <TextField
            label="درصد سهم تعمیرکار از اجرت"
            value={share}
            onChange={(e) => setShare(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            fullWidth
          />
        )}
        {withShare ? (
          <>
            <Typography variant="body2">
              جمع قابل پرداخت مشتری: <b>{formatToman(labor + parts)}</b>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              سهم تعمیرکار: {formatToman(technicianShare)} ({sharePercent}٪ اجرت + کل قطعات)
            </Typography>
          </>
        ) : (
          <Stack spacing={0.5} sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
            <SummaryRow label="مبلغ کل" value={formatToman(labor + parts)} bold />
            <SummaryRow label="هزینه (اجرت)" value={formatToman(labor)} />
            <SummaryRow label="هزینهٔ قطعات" value={formatToman(parts)} />
            <SummaryRow label="سهم تعمیرکار" value={formatToman(technicianShare)} bold success />
          </Stack>
        )}
        <Button
          variant="contained"
          disabled={busy || labor + parts <= 0}
          onClick={() =>
            onSubmit({
              labor_amount: labor,
              parts_amount: parts,
              cost_description: description.trim() || undefined,
              share_percent: withShare && share !== "" ? sharePercent : undefined,
            })
          }
        >
          {isEdit ? "ذخیرهٔ هزینه" : "ثبت هزینه و ارسال برای مشتری"}
        </Button>
      </Stack>
    </Section>
  );
}
