"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import {
  PRODUCT_IMPORT_FIELDS,
  autoMapColumns,
  buildImportPayload,
  emptyColumnMapping,
  findDuplicateBarcodes,
  findIncompleteRequiredRows,
  isMappedCellEmpty,
  mappingIsComplete,
  parseExcelFile,
  type ColumnMapping,
  type ParsedSheet,
} from "@/app/lib/productExcelImport";
import { useQueryClient } from "@tanstack/react-query";

const STEPS = ["انتخاب فایل", "اتصال ستون‌ها", "آماده‌سازی ارسال"];
const PREVIEW_LIMIT = 20;

export default function ProductImportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>(emptyColumnMapping());
  const [sending, setSending] = useState(false);

  const payload = useMemo(() => {
    if (!sheet || !mappingIsComplete(mapping)) return null;
    return buildImportPayload(sheet.rows, mapping);
  }, [sheet, mapping]);

  const duplicateBarcodes = useMemo(
    () => (payload ? findDuplicateBarcodes(payload.products) : []),
    [payload],
  );

  const incompleteRows = useMemo(
    () => (sheet && mappingIsComplete(mapping) ? findIncompleteRequiredRows(sheet.rows, mapping) : []),
    [sheet, mapping],
  );

  const previewRows = sheet?.rows.slice(0, PREVIEW_LIMIT) ?? [];

  const handlePickFile = () => fileInputRef.current?.click();

  const resetImport = () => {
    setActiveStep(0);
    setFileName("");
    setSheet(null);
    setMapping(emptyColumnMapping());
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
      toast.error("فقط فایل اکسل یا CSV مجاز است");
      event.target.value = "";
      return;
    }

    try {
      setParsing(true);
      const parsed = await parseExcelFile(file);
      setSheet(parsed);
      setFileName(file.name);
      setMapping(autoMapColumns(parsed.headers));
      setActiveStep(1);
      toast.success(`${parsed.rows.length} ردیف از فایل خوانده شد`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "خطا در خواندن فایل");
    } finally {
      setParsing(false);
      event.target.value = "";
    }
  };

  const handleNext = () => {
    if (activeStep === 1 && !mappingIsComplete(mapping)) {
      toast.error("ستون‌های اجباری را وصل کنید: نام کالا، قیمت خرید، قیمت فروش و موجودی");
      return;
    }
    if (activeStep === 1 && incompleteRows.length > 0) {
      toast.error(
        `${incompleteRows.length} ردیف فیلد اجباری خالی دارد (نام کالا، قیمت خرید، قیمت فروش، موجودی)`,
      );
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleSend = async () => {
    if (!payload) {
      toast.error("خروجی آماده نیست");
      return;
    }
    if (payload.products.length === 0) {
      toast.error("کالایی برای ارسال وجود ندارد");
      return;
    }
    if (duplicateBarcodes.length > 0) {
      toast.error(`بارکد تکراری در فایل: ${duplicateBarcodes.join("، ")}`);
      return;
    }
    if (incompleteRows.length > 0) {
      toast.error(
        `${incompleteRows.length} ردیف فیلد اجباری خالی دارد (نام کالا، قیمت خرید، قیمت فروش، موجودی)`,
      );
      return;
    }

    setSending(true);
    try {
      const token = tokenCode();
      const res = await apiRequestError(
        "Post",
        {},
        payload,
        "/api/products/bulk-store",
        true,
        true,
        token,
      );

      if (res?.hasError) {
        let message = "خطا در ارسال فایل به سرور";
        try {
          const parsed = JSON.parse(res.errorText);
          if (parsed?.message) message = parsed.message;
        } catch {
          if (typeof res.errorText === "string" && res.errorText) message = res.errorText;
        }
        toast.error(message);
        return;
      }

      const createdCount = Number(res?.created_count ?? 0);
      const updatedCount = Number(res?.updated_count ?? 0);
      toast.success(
        res?.message ||
          `پردازش شد: ${createdCount} ثبت جدید، ${updatedCount} به‌روزرسانی`,
      );

      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          if (queryKey[0] === "datas-infinite" || queryKey[0] === "datas-desktop") {
            const url = queryKey[2];
            return typeof url === "string" && url.includes("/api/product");
          }
          return false;
        },
      });
      setTimeout(() => {
        router.push("/admin/product");
      }, 1200);
    } catch (error) {
      console.error(error);
      toast.error("خطا در ارسال به سرور");
    } finally {
      setSending(false);
    }
  };

  const copyJson = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success("JSON کپی شد");
    } catch {
      toast.error("کپی JSON انجام نشد");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
        padding: { xs: "16px", md: "24px" },
        paddingBottom: "100px",
        direction: "rtl",
        background: "var(--admin-bg-gradient)",
      }}
    >
      <Typography variant="h5" sx={{ color: "var(--admin-text)", fontWeight: 700, mb: 2 }}>
        ایمپورت کالا از اکسل
      </Typography>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 3,
          "& .MuiStepLabel-label": { color: "var(--admin-text-muted)", fontSize: "12px" },
          "& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
            color: "var(--admin-text)",
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
        <Card
          sx={{
            p: { xs: 3, md: 5 },
            textAlign: "center",
            backgroundColor: "var(--admin-surface)",
            border: "1px dashed var(--admin-border)",
            borderRadius: "16px",
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 56, color: "var(--admin-accent)", mb: 1 }} />
          <Typography sx={{ color: "var(--admin-text)", mb: 1, fontWeight: 600 }}>
            فایل اکسل کالاها را انتخاب کنید
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", mb: 3, fontSize: "13px" }}>
            فرمت‌های مجاز: xlsx، xls، csv
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={handleFileChange}
          />
          <Button
            variant="contained"
            onClick={handlePickFile}
            disabled={parsing}
            sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
          >
            {parsing ? "در حال خواندن..." : "انتخاب فایل"}
          </Button>
        </Card>
      )}

      {activeStep === 1 && sheet && (
        <Card sx={{ p: 2, backgroundColor: "var(--admin-surface)", borderRadius: "16px" }}>
          <Typography sx={{ color: "var(--admin-text)", mb: 0.5, fontWeight: 600 }}>
            هر ستون مورد نیاز را به ستون فایل وصل کنید
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", mb: 2, fontSize: "13px" }}>
            فایل: {fileName} — {sheet.rows.length} ردیف
          </Typography>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, mb: 3 }}>
            {PRODUCT_IMPORT_FIELDS.map((field) => (
              <FormControl key={field.key} fullWidth size="small" required={field.required}>
                <InputLabel sx={{ color: "var(--admin-text-muted)" }}>
                  {field.label}{field.required ? " *" : ""}
                </InputLabel>
                <Select
                  value={mapping[field.key]}
                  label={`${field.label}${field.required ? " *" : ""}`}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  sx={{
                    color: "var(--admin-text)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--admin-border)" },
                    "& .MuiSvgIcon-root": { color: "var(--admin-text)" },
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

          <Typography sx={{ color: "var(--admin-text)", mb: 1, fontWeight: 600 }}>
            پیش‌نمایش داده
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", mb: 1.5, fontSize: "13px" }}>
            نام کالا، قیمت خرید، قیمت فروش و موجودی اجباری‌اند. با تغییر ستون‌ها همین جدول به‌روز می‌شود — {Math.min(PREVIEW_LIMIT, sheet.rows.length)} ردیف اول
          </Typography>
          {incompleteRows.length > 0 && (
            <Typography sx={{ color: "#ff6b6b", fontSize: "13px", mb: 1.5 }}>
              {incompleteRows.length} ردیف فیلد اجباری خالی دارد
              {incompleteRows.length <= 10 ? ` (ردیف ${incompleteRows.join("، ")})` : ""}
            </Typography>
          )}
          <TableContainer sx={{ maxHeight: 420, overflow: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {PRODUCT_IMPORT_FIELDS.map((field) => (
                    <TableCell
                      key={field.key}
                      sx={{ backgroundColor: "var(--admin-surface-alt)", color: "var(--admin-text)", whiteSpace: "nowrap" }}
                    >
                      {field.label}{field.required ? " *" : ""}
                      {mapping[field.key] ? (
                        <Typography component="span" sx={{ color: "var(--admin-text-muted)", fontSize: "11px", display: "block" }}>
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
                    {PRODUCT_IMPORT_FIELDS.map((field) => {
                      const emptyRequired = isMappedCellEmpty(row, mapping, field.key);
                      return (
                      <TableCell
                        key={field.key}
                        sx={{
                          color: emptyRequired ? "#ff6b6b" : "var(--admin-text)",
                          whiteSpace: "nowrap",
                          bgcolor: emptyRequired ? "rgba(255,107,107,0.12)" : "transparent",
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
        </Card>
      )}

      {activeStep === 2 && payload && (
        <Card sx={{ p: 2, backgroundColor: "var(--admin-surface)", borderRadius: "16px" }}>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, mb: 1 }}>
            ثبت/به‌روزرسانی بر اساس بارکد
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px", mb: 1.5 }}>
            اگر بارکد در فروشگاه باشد همان کالا آپدیت می‌شود؛ در غیر این صورت کالای جدید ثبت می‌شود.
          </Typography>
          {duplicateBarcodes.length > 0 && (
            <Typography sx={{ color: "#ff6b6b", fontSize: "13px", mb: 1.5 }}>
              بارکد تکراری در این فایل مجاز نیست: {duplicateBarcodes.join("، ")}
            </Typography>
          )}
          <Typography sx={{ color: "var(--admin-text)", mb: 1 }}>
            آماده ارسال: {payload.products.length} کالا
          </Typography>
          {/*<Box
            component="pre"
            sx={{
              maxHeight: 280,
              overflow: "auto",
              p: 1.5,
              borderRadius: "12px",
              bgcolor: "var(--admin-surface-nested)",
              color: "var(--admin-text)",
              fontSize: "12px",
              direction: "ltr",
              textAlign: "left",
            }}
          >
            {JSON.stringify(payload, null, 2)}
          </Box>*/}
        </Card>
      )}

      <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
        {activeStep > 0 && (
          <Button
            onClick={() => setActiveStep((prev) => prev - 1)}
            sx={{ color: "var(--admin-text)" }}
          >
            مرحله قبل
          </Button>
        )}
        {activeStep > 0 && (
          <Button onClick={resetImport} sx={{ color: "var(--admin-text-muted)" }}>
            فایل جدید
          </Button>
        )}
        {activeStep > 0 && activeStep < 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
          >
            ادامه
          </Button>
        )}
        {activeStep === 2 && (
          <>
            <Button onClick={copyJson} sx={{ color: "var(--admin-text)" }}>
              کپی JSON
            </Button>
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={sending || duplicateBarcodes.length > 0 || incompleteRows.length > 0}
              sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
            >
              {sending ? "در حال ارسال..." : "ارسال به سرور"}
            </Button>
          </>
        )}
      </Box>

      <ToastContainer position="top-center" autoClose={3000} rtl />
    </Box>
  );
}
