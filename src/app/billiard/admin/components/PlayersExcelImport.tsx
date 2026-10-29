"use client";

import { useMemo, useRef, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";
import {
  PLAYER_IMPORT_FIELDS,
  autoMapPlayerColumns,
  buildPlayerImportPayload,
  downloadPlayerImportTemplate,
  emptyPlayerColumnMapping,
  findDuplicatePhones,
  findIncompleteRequiredPlayerRows,
  isPlayerMappedCellEmpty,
  parseExcelFile,
  playerMappingIsComplete,
  type ParsedSheet,
  type PlayerColumnMapping,
} from "@/app/lib/billiardPlayerExcelImport";

const STEPS = ["انتخاب فایل", "اتصال ستون‌ها", "آماده‌سازی ارسال"];
const PREVIEW_LIMIT = 20;

type Props = {
  onImported?: () => void;
};

export function PlayersExcelImport({ onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<PlayerColumnMapping>(emptyPlayerColumnMapping());
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [templateBusy, setTemplateBusy] = useState(false);

  const payload = useMemo(() => {
    if (!sheet || !playerMappingIsComplete(mapping)) return null;
    return buildPlayerImportPayload(sheet.rows, mapping);
  }, [sheet, mapping]);

  const duplicatePhones = useMemo(
    () => (payload ? findDuplicatePhones(payload.players) : []),
    [payload],
  );

  const incompleteRows = useMemo(
    () =>
      sheet && playerMappingIsComplete(mapping)
        ? findIncompleteRequiredPlayerRows(sheet.rows, mapping)
        : [],
    [sheet, mapping],
  );

  const previewRows = sheet?.rows.slice(0, PREVIEW_LIMIT) ?? [];

  const resetImport = () => {
    setActiveStep(0);
    setFileName("");
    setSheet(null);
    setMapping(emptyPlayerColumnMapping());
    setMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const validExt = /\.(xlsx|xls|csv)$/i.test(file.name);
    if (!validExt && !validTypes.includes(file.type)) {
      setMsg("فقط فایل اکسل یا CSV مجاز است");
      event.target.value = "";
      return;
    }

    try {
      setParsing(true);
      setMsg("");
      const parsed = await parseExcelFile(file);
      setSheet(parsed);
      setFileName(file.name);
      setMapping(autoMapPlayerColumns(parsed.headers));
      setActiveStep(1);
      setMsg(`${parsed.rows.length} ردیف از فایل خوانده شد`);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "خطا در خواندن فایل");
    } finally {
      setParsing(false);
      event.target.value = "";
    }
  };

  const handleNext = () => {
    if (activeStep === 1 && !playerMappingIsComplete(mapping)) {
      setMsg("ستون‌های اجباری را وصل کنید: نام، نام خانوادگی، موبایل");
      return;
    }
    if (activeStep === 1 && incompleteRows.length > 0) {
      setMsg(`${incompleteRows.length} ردیف فیلد اجباری خالی دارد`);
      return;
    }
    setMsg("");
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleSend = async () => {
    if (!payload?.players.length) {
      setMsg("بازیکنی برای ارسال وجود ندارد");
      return;
    }
    if (duplicatePhones.length > 0) {
      setMsg(`موبایل تکراری در فایل: ${duplicatePhones.slice(0, 5).join("، ")}`);
      return;
    }
    if (incompleteRows.length > 0) {
      setMsg(`${incompleteRows.length} ردیف فیلد اجباری خالی دارد`);
      return;
    }

    setSending(true);
    setMsg("");
    try {
      const res = await apiFetch<{
        message?: string;
        created_count?: number;
        updated_count?: number;
        errors?: string[];
      }>("/admin/players/bulk", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMsg(
        res.message ||
          `پردازش شد: ${res.created_count ?? 0} ثبت جدید، ${res.updated_count ?? 0} به‌روزرسانی`,
      );
      if (res.errors?.length) {
        setMsg((prev) => `${prev}\n${res.errors!.slice(0, 5).join("\n")}`);
      }
      onImported?.();
      setTimeout(resetImport, 1500);
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در ارسال به سرور");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card-soft space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-slate-100">ورود بازیکن از اکسل</h2>
          <p className="mt-1 text-sm text-slate-400">
            مثل ورود کالا: انتخاب فایل، اتصال ستون‌ها، سپس ارسال. اگر موبایل تکراری باشد همان بازیکن به‌روز می‌شود.
          </p>
        </div>
        <BilliardButton
          type="button"
          variant="secondary"
          loading={templateBusy}
          onClick={async () => {
            setTemplateBusy(true);
            try {
              await downloadPlayerImportTemplate();
            } finally {
              setTemplateBusy(false);
            }
          }}
        >
          دانلود نمونه اکسل
        </BilliardButton>
      </div>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 1,
          "& .MuiStepLabel-label": { color: "#94a3b8", fontSize: "12px" },
          "& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
            color: "#e2e8f0",
          },
          "& .MuiStepIcon-root": { color: "rgba(255,255,255,0.2)" },
          "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": {
            color: "#c026d3",
          },
        }}
      >
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            textAlign: "center",
            border: "1px dashed rgba(255,255,255,0.15)",
            borderRadius: "16px",
            bgcolor: "rgba(255,255,255,0.03)",
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: "#22d3ee", mb: 1 }} />
          <Typography sx={{ color: "#e2e8f0", mb: 1, fontWeight: 600 }}>
            فایل اکسل بازیکنان را انتخاب کنید
          </Typography>
          <Typography sx={{ color: "#94a3b8", mb: 3, fontSize: "13px" }}>
            فرمت‌های مجاز: xlsx، xls، csv — ستون‌های پیشنهادی: نام، نام خانوادگی، موبایل، شهر، باشگاه، کد ملی
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={handleFileChange}
          />
          <BilliardButton type="button" loading={parsing} onClick={() => fileInputRef.current?.click()}>
            انتخاب فایل
          </BilliardButton>
        </Box>
      )}

      {activeStep === 1 && sheet && (
        <div className="space-y-3">
          <Typography sx={{ color: "#e2e8f0", fontWeight: 600 }}>
            هر ستون مورد نیاز را به ستون فایل وصل کنید
          </Typography>
          <Typography sx={{ color: "#94a3b8", fontSize: "13px" }}>
            فایل: {fileName} — {sheet.rows.length} ردیف
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            {PLAYER_IMPORT_FIELDS.map((field) => (
              <FormControl key={field.key} fullWidth size="small" required={field.required}>
                <InputLabel sx={{ color: "#94a3b8" }}>
                  {field.label}
                  {field.required ? " *" : ""}
                </InputLabel>
                <Select
                  value={mapping[field.key]}
                  label={`${field.label}${field.required ? " *" : ""}`}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  sx={{
                    color: "#e2e8f0",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                    "& .MuiSvgIcon-root": { color: "#94a3b8" },
                    bgcolor: "rgba(255,255,255,0.04)",
                  }}
                >
                  <MenuItem value="">انتخاب ستون</MenuItem>
                  {sheet.headers.map((header) => (
                    <MenuItem key={header} value={header}>
                      {header}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
          </Box>

          <Typography sx={{ color: "#e2e8f0", fontWeight: 600, mt: 1 }}>پیش‌نمایش داده</Typography>
          {incompleteRows.length > 0 && (
            <Typography sx={{ color: "#f87171", fontSize: "13px" }}>
              {incompleteRows.length} ردیف فیلد اجباری خالی دارد
              {incompleteRows.length <= 10 ? ` (ردیف ${incompleteRows.join("، ")})` : ""}
            </Typography>
          )}
          <TableContainer sx={{ maxHeight: 360, overflow: "auto", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {PLAYER_IMPORT_FIELDS.map((field) => (
                    <TableCell
                      key={field.key}
                      sx={{ backgroundColor: "#121826", color: "#e2e8f0", whiteSpace: "nowrap" }}
                    >
                      {field.label}
                      {field.required ? " *" : ""}
                      {mapping[field.key] ? (
                        <Typography component="span" sx={{ color: "#64748b", fontSize: "11px", display: "block" }}>
                          {mapping[field.key]}
                        </Typography>
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
                    {PLAYER_IMPORT_FIELDS.map((field) => {
                      const emptyRequired = isPlayerMappedCellEmpty(row, mapping, field.key);
                      return (
                        <TableCell
                          key={field.key}
                          sx={{
                            color: emptyRequired ? "#f87171" : "#cbd5e1",
                            whiteSpace: "nowrap",
                            bgcolor: emptyRequired ? "rgba(248,113,113,0.12)" : "transparent",
                          }}
                        >
                          {mapping[field.key] ? row[mapping[field.key]] || "—" : "—"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {activeStep === 2 && payload && (
        <div className="space-y-2">
          <Typography sx={{ color: "#e2e8f0", fontWeight: 600 }}>ثبت / به‌روزرسانی بر اساس موبایل</Typography>
          <Typography sx={{ color: "#94a3b8", fontSize: "13px" }}>
            اگر شماره در سامانه باشد همان بازیکن آپدیت می‌شود؛ در غیر این صورت بازیکن جدید ثبت می‌شود.
          </Typography>
          {duplicatePhones.length > 0 && (
            <Typography sx={{ color: "#f87171", fontSize: "13px" }}>
              موبایل تکراری در این فایل مجاز نیست: {duplicatePhones.slice(0, 8).join("، ")}
            </Typography>
          )}
          <Typography sx={{ color: "#22d3ee" }}>آماده ارسال: {payload.players.length} بازیکن</Typography>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {activeStep > 0 && (
          <BilliardButton type="button" variant="ghost" onClick={() => setActiveStep((p) => p - 1)}>
            مرحله قبل
          </BilliardButton>
        )}
        {activeStep > 0 && (
          <BilliardButton type="button" variant="secondary" onClick={resetImport}>
            فایل جدید
          </BilliardButton>
        )}
        {activeStep > 0 && activeStep < 2 && (
          <BilliardButton type="button" onClick={handleNext}>
            ادامه
          </BilliardButton>
        )}
        {activeStep === 2 && (
          <BilliardButton
            type="button"
            loading={sending}
            disabled={duplicatePhones.length > 0 || incompleteRows.length > 0}
            onClick={handleSend}
          >
            ارسال به سرور
          </BilliardButton>
        )}
      </div>

      {msg && (
        <p className="whitespace-pre-wrap text-sm text-cyan-300">{msg}</p>
      )}
    </div>
  );
}
