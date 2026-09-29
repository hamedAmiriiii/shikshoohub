"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import KeyIcon from "@mui/icons-material/Key";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";
import { accountingButtonSx, accountingFieldSx } from "@/app/admin/accounting/ui";
import {
  fetchMoadianSettings,
  generateMoadianKey,
  saveMoadianSettings,
  testMoadianConnection,
  type MoadianSettings,
} from "@/app/lib/moadian";

type Form = {
  enabled: boolean;
  environment: string;
  connection_mode: string;
  memory_id: string;
  private_key: string;
  certificate: string;
  price_includes_vat: boolean;
  default_invoice_type: number;
  auto_type1_with_buyer: boolean;
  default_vat_rate: string;
  default_sstid: string;
  default_sstt: string;
  unit_code_piece: string;
  unit_code_kg: string;
  unit_code_meter: string;
  late_threshold_days: string;
};

const toLatinDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

function toForm(s: MoadianSettings): Form {
  return {
    enabled: s.enabled,
    environment: s.environment || "sandbox",
    connection_mode: s.connection_mode || "self_tsp",
    memory_id: s.memory_id || "",
    private_key: "",
    certificate: s.certificate || "",
    price_includes_vat: s.price_includes_vat,
    default_invoice_type: s.default_invoice_type || 2,
    auto_type1_with_buyer: s.auto_type1_with_buyer,
    default_vat_rate: String(s.default_vat_rate ?? 10),
    default_sstid: s.default_sstid || "",
    default_sstt: s.default_sstt || "",
    unit_code_piece: s.unit_code_piece || "",
    unit_code_kg: s.unit_code_kg || "",
    unit_code_meter: s.unit_code_meter || "",
    late_threshold_days: s.late_threshold_days ? String(s.late_threshold_days) : "",
  };
}

const switchSx = {
  "& .Mui-checked": { color: "var(--admin-accent) !important" },
  "& .Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--admin-accent) !important" },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ p: 2, borderRadius: "10px", border: "1px solid var(--admin-border)", bgcolor: "var(--admin-surface)" }}>
      <Typography sx={{ fontWeight: 700, color: "var(--admin-text)", mb: 1.5 }}>{title}</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>{children}</Box>
    </Box>
  );
}

function SwitchRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} sx={switchSx} />}
        label={<Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>{label}</Typography>}
      />
      {hint ? <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mt: -0.5, mr: 6 }}>{hint}</Typography> : null}
    </Box>
  );
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("کپی شد.");
  } catch {
    toast.error("کپی ناموفق بود.");
  }
}

export default function MoadianSettingsTab({ onSaved }: { onSaved: () => void }) {
  const [settings, setSettings] = useState<MoadianSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [keyDialog, setKeyDialog] = useState(false);
  const [keyForm, setKeyForm] = useState({ common_name: "", serial_number: "", organization: "Non-Governmental", replace: false });
  const [generated, setGenerated] = useState<{ public_key: string; csr: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await fetchMoadianSettings();
      setSettings(s);
      setForm(toForm(s));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت تنظیمات");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!form || !settings) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "var(--admin-accent)" }} />
      </Box>
    );
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    setSaving(true);
    try {
      const res = await saveMoadianSettings({
        enabled: form.enabled,
        environment: form.environment,
        connection_mode: form.connection_mode,
        memory_id: form.memory_id.trim() || null,
        ...(form.private_key.trim() ? { private_key: form.private_key.trim() } : {}),
        certificate: form.certificate.trim() || null,
        price_includes_vat: form.price_includes_vat,
        default_invoice_type: form.default_invoice_type,
        auto_type1_with_buyer: form.auto_type1_with_buyer,
        default_vat_rate: Number(toLatinDigits(form.default_vat_rate)) || 0,
        default_sstid: toLatinDigits(form.default_sstid.trim()) || null,
        default_sstt: form.default_sstt.trim() || null,
        unit_code_piece: toLatinDigits(form.unit_code_piece.trim()) || null,
        unit_code_kg: toLatinDigits(form.unit_code_kg.trim()) || null,
        unit_code_meter: toLatinDigits(form.unit_code_meter.trim()) || null,
        late_threshold_days: form.late_threshold_days.trim() ? Number(toLatinDigits(form.late_threshold_days)) : null,
      });
      toast.success(res.message);
      setSettings(res.data);
      setForm(toForm(res.data));
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      toast.success(await testMoadianConnection());
      await load();
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "اتصال ناموفق بود");
    } finally {
      setTesting(false);
    }
  };

  const generate = async () => {
    try {
      const res = await generateMoadianKey({
        common_name: keyForm.common_name.trim(),
        serial_number: toLatinDigits(keyForm.serial_number.trim()),
        organization: keyForm.organization.trim() || undefined,
        replace: keyForm.replace,
      });
      toast.success(res.message);
      setGenerated({ public_key: res.public_key, csr: res.csr });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ساخت کلید");
    }
  };

  const seller = settings.seller;
  const sellerOk = Boolean(seller.economic_code || seller.national_id);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {settings.problems.length > 0 ? (
        <Alert severity="warning">
          {settings.problems.map((p) => (
            <div key={p}>{p}</div>
          ))}
        </Alert>
      ) : null}

      <Section title="فعال‌سازی">
        <SwitchRow
          label="ارسال خودکار صورتحساب فروش به سامانه مؤدیان"
          hint="فقط فروش‌هایی که بعد از اولین فعال‌سازی ثبت می‌شوند ارسال می‌شوند. روند فروش، برگشت و حذف هیچ تغییری نمی‌کند؛ ارسال در پس‌زمینه انجام می‌شود."
          checked={form.enabled}
          onChange={(v) => set("enabled", v)}
        />
        {settings.started_at ? (
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
            شروع از: {settings.started_at} (فروش‌های بعد از شمارهٔ {settings.start_purchase_id ?? 0})
          </Typography>
        ) : null}
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 200, ...accountingFieldSx }}>
            <InputLabel>محیط</InputLabel>
            <Select label="محیط" value={form.environment} onChange={(e) => set("environment", e.target.value)}>
              <MenuItem value="sandbox">آزمایشی (Sandbox)</MenuItem>
              <MenuItem value="production">اصلی</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220, ...accountingFieldSx }}>
            <InputLabel>روش اتصال</InputLabel>
            <Select label="روش اتصال" value={form.connection_mode} onChange={(e) => set("connection_mode", e.target.value)}>
              <MenuItem value="self_tsp">اتصال مستقیم (کلید و گواهی خودم)</MenuItem>
              <MenuItem value="tsp">از طریق شرکت معتمد (به‌زودی)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="شناسه یکتای حافظه مالیاتی"
            value={form.memory_id}
            onChange={(e) => set("memory_id", e.target.value.toUpperCase())}
            inputProps={{ dir: "ltr", maxLength: 6 }}
            sx={{ minWidth: 200, ...accountingFieldSx }}
          />
        </Box>
      </Section>

      <Section title="مشخصات فروشنده">
        {sellerOk ? (
          <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>
            {seller.legal_name || "—"} · کد اقتصادی: {seller.economic_code || "—"} · شناسه ملی: {seller.national_id || "—"}
          </Typography>
        ) : (
          <Alert severity="error">کد اقتصادی یا شناسه ملی فروشنده ثبت نشده است. از صفحهٔ «چاپ فاکتور رسمی» مشخصات فروشنده را کامل کنید.</Alert>
        )}
      </Section>

      <Section title="کلید و گواهی امضا">
        <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
          ۱) کلید بسازید ۲) کلید عمومی را در کارپوشهٔ سامانه مؤدیان ثبت کنید ۳) گواهی امضای دریافتی (یا گواهی صادرشده برای CSR) را اینجا وارد کنید.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: 13, color: settings.has_private_key ? "var(--admin-accent)" : "#d32f2f" }}>
            {settings.has_private_key ? "کلید خصوصی ثبت شده است (روی سرور، رمزنگاری‌شده)." : "کلید خصوصی ثبت نشده است."}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<KeyIcon />}
            onClick={() => {
              setGenerated(null);
              setKeyForm((k) => ({ ...k, replace: false }));
              setKeyDialog(true);
            }}
            sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
          >
            ساخت کلید و CSR
          </Button>
          {settings.public_key ? (
            <Button
              variant="text"
              startIcon={<ContentCopyIcon />}
              onClick={() => copy(settings.public_key || "")}
              sx={{ color: "var(--admin-text)" }}
            >
              کپی کلید عمومی
            </Button>
          ) : null}
        </Box>
        <TextField
          label="یا کلید خصوصی موجود را وارد کنید (PEM)"
          value={form.private_key}
          onChange={(e) => set("private_key", e.target.value)}
          multiline
          minRows={2}
          maxRows={6}
          placeholder={settings.has_private_key ? "برای تغییر کلید فعلی پر کنید؛ خالی = بدون تغییر" : "-----BEGIN PRIVATE KEY-----"}
          inputProps={{ dir: "ltr", style: { fontFamily: "monospace", fontSize: 11 } }}
          sx={accountingFieldSx}
        />
        <TextField
          label="گواهی امضا (PEM یا base64)"
          value={form.certificate}
          onChange={(e) => set("certificate", e.target.value)}
          multiline
          minRows={2}
          maxRows={6}
          inputProps={{ dir: "ltr", style: { fontFamily: "monospace", fontSize: 11 } }}
          sx={accountingFieldSx}
        />
        {settings.certificate_info ? (
          <Typography sx={{ fontSize: 12, color: settings.certificate_info.expired ? "#d32f2f" : "var(--admin-text-muted)" }}>
            گواهی: {settings.certificate_info.subject || "—"}
            {settings.certificate_info.valid_to ? ` · اعتبار تا ${settings.certificate_info.valid_to}` : ""}
            {settings.certificate_info.expired ? " (منقضی شده)" : ""}
          </Typography>
        ) : null}
        {settings.last_verified_at ? (
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>آخرین اتصال موفق: {settings.last_verified_at}</Typography>
        ) : null}
      </Section>

      <Section title="مالیات">
        <SwitchRow
          label="قیمت‌های فروش شامل مالیات بر ارزش افزوده است"
          hint="روشن: مبلغ دریافتی از مشتری ثابت می‌ماند و مالیات از داخل آن جدا می‌شود. خاموش: مالیات روی قیمت فروش محاسبه و به مبلغ صورتحساب مؤدیان اضافه می‌شود."
          checked={form.price_includes_vat}
          onChange={(v) => set("price_includes_vat", v)}
        />
        {!form.price_includes_vat ? (
          <Alert severity="info">
            در حالت «بدون مالیات»، جمع فاکتور صندوق و مبلغ دریافتی از مشتری تغییر نمی‌کند؛ مالیات فقط در صورتحساب ارسالی به سامانه اضافه می‌شود.
          </Alert>
        ) : null}
        <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
          اعتبار باشگاه مشتریان روش پرداخت حساب می‌شود و مبلغ مشمول مالیات را کم نمی‌کند؛ تخفیف فاکتور از مبلغ مشمول مالیات کم می‌شود.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            size="small"
            label="نرخ پیش‌فرض مالیات (٪)"
            value={form.default_vat_rate}
            onChange={(e) => set("default_vat_rate", e.target.value)}
            inputProps={{ dir: "ltr", inputMode: "decimal" }}
            helperText="برای کالاهایی که شناسهٔ آن‌ها نرخ جداگانه ندارد"
            sx={{ minWidth: 200, ...accountingFieldSx }}
          />
          <TextField
            size="small"
            label="مهلت ارسال (روز) — ماده ۹"
            value={form.late_threshold_days}
            onChange={(e) => set("late_threshold_days", e.target.value)}
            inputProps={{ dir: "ltr", inputMode: "numeric" }}
            helperText="خالی = بدون علامت ارسال با تأخیر"
            sx={{ minWidth: 200, ...accountingFieldSx }}
          />
        </Box>
      </Section>

      <Section title="نوع صورتحساب و شناسه‌ها">
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 240, ...accountingFieldSx }}>
            <InputLabel>نوع پیش‌فرض</InputLabel>
            <Select label="نوع پیش‌فرض" value={form.default_invoice_type} onChange={(e) => set("default_invoice_type", Number(e.target.value))}>
              <MenuItem value={2}>نوع دوم (بدون مشخصات خریدار)</MenuItem>
              <MenuItem value={1}>نوع اول (در صورت وجود مشخصات خریدار)</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <SwitchRow
          label="اگر مشخصات خریدار (کد اقتصادی/شناسه ملی) ثبت شده بود، نوع اول صادر شود"
          checked={form.auto_type1_with_buyer}
          onChange={(v) => set("auto_type1_with_buyer", v)}
        />
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            size="small"
            label="شناسه کالا/خدمت پیش‌فرض"
            value={form.default_sstid}
            onChange={(e) => set("default_sstid", e.target.value)}
            inputProps={{ dir: "ltr", maxLength: 13, inputMode: "numeric" }}
            helperText="برای کالاهای بدون شناسه، اقلام تولیدی و مواد اولیه"
            sx={{ minWidth: 240, ...accountingFieldSx }}
          />
          <TextField
            size="small"
            label="کد واحد: عدد"
            value={form.unit_code_piece}
            onChange={(e) => set("unit_code_piece", e.target.value)}
            inputProps={{ dir: "ltr" }}
            sx={{ width: 140, ...accountingFieldSx }}
          />
          <TextField
            size="small"
            label="کد واحد: کیلوگرم"
            value={form.unit_code_kg}
            onChange={(e) => set("unit_code_kg", e.target.value)}
            inputProps={{ dir: "ltr" }}
            sx={{ width: 140, ...accountingFieldSx }}
          />
          <TextField
            size="small"
            label="کد واحد: متر"
            value={form.unit_code_meter}
            onChange={(e) => set("unit_code_meter", e.target.value)}
            inputProps={{ dir: "ltr" }}
            sx={{ width: 140, ...accountingFieldSx }}
          />
        </Box>
      </Section>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving} sx={accountingButtonSx}>
          {saving ? "در حال ذخیره…" : "ذخیره تنظیمات"}
        </Button>
        <Button
          variant="outlined"
          startIcon={<WifiTetheringIcon />}
          onClick={test}
          disabled={testing || !settings.exists}
          sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
        >
          {testing ? "در حال آزمایش…" : "آزمایش اتصال"}
        </Button>
      </Box>

      <Dialog open={keyDialog} onClose={() => setKeyDialog(false)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle>ساخت کلید و درخواست گواهی (CSR)</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "12px !important" }}>
          {generated ? (
            <>
              <Alert severity="success">کلید خصوصی روی سرور ذخیره شد. کلید عمومی را در کارپوشهٔ سامانه مؤدیان ثبت کنید.</Alert>
              <TextField
                label="کلید عمومی"
                value={generated.public_key}
                multiline
                minRows={4}
                InputProps={{ readOnly: true }}
                inputProps={{ dir: "ltr", style: { fontFamily: "monospace", fontSize: 11 } }}
                sx={accountingFieldSx}
              />
              <Button startIcon={<ContentCopyIcon />} onClick={() => copy(generated.public_key)} sx={{ alignSelf: "flex-start", color: "var(--admin-text)" }}>
                کپی کلید عمومی
              </Button>
              <TextField
                label="CSR"
                value={generated.csr}
                multiline
                minRows={4}
                InputProps={{ readOnly: true }}
                inputProps={{ dir: "ltr", style: { fontFamily: "monospace", fontSize: 11 } }}
                sx={accountingFieldSx}
              />
              <Button startIcon={<ContentCopyIcon />} onClick={() => copy(generated.csr)} sx={{ alignSelf: "flex-start", color: "var(--admin-text)" }}>
                کپی CSR
              </Button>
            </>
          ) : (
            <>
              <TextField
                size="small"
                label="نام انگلیسی شخص/شرکت (CN)"
                value={keyForm.common_name}
                onChange={(e) => setKeyForm({ ...keyForm, common_name: e.target.value })}
                inputProps={{ dir: "ltr" }}
                sx={accountingFieldSx}
              />
              <TextField
                size="small"
                label="کد ملی / شناسه ملی"
                value={keyForm.serial_number}
                onChange={(e) => setKeyForm({ ...keyForm, serial_number: e.target.value })}
                inputProps={{ dir: "ltr", inputMode: "numeric" }}
                sx={accountingFieldSx}
              />
              <TextField
                size="small"
                label="سازمان (O)"
                value={keyForm.organization}
                onChange={(e) => setKeyForm({ ...keyForm, organization: e.target.value })}
                inputProps={{ dir: "ltr" }}
                sx={accountingFieldSx}
              />
              {settings.has_private_key ? (
                <FormControlLabel
                  control={<Checkbox checked={keyForm.replace} onChange={(e) => setKeyForm({ ...keyForm, replace: e.target.checked })} />}
                  label={
                    <Typography sx={{ fontSize: 13, color: "#d32f2f" }}>
                      جایگزینی کلید فعلی (گواهی فعلی پاک می‌شود و باید کلید عمومی جدید را در سامانه ثبت کنید)
                    </Typography>
                  }
                />
              ) : null}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKeyDialog(false)} sx={{ color: "var(--admin-text)" }}>
            بستن
          </Button>
          {!generated ? (
            <Button
              variant="contained"
              onClick={generate}
              disabled={!keyForm.common_name.trim() || !keyForm.serial_number.trim() || (settings.has_private_key && !keyForm.replace)}
              sx={accountingButtonSx}
            >
              ساخت کلید
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
