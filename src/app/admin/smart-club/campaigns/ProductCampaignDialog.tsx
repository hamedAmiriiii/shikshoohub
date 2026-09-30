"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  createSmartCampaign,
  fetchCampaignProducts,
  fetchProductAudience,
  runSmartCampaign,
  SMART_SEGMENT_LABELS,
  toFaNum,
  type CampaignProduct,
  type ProductAudienceCustomer,
  type ProductAudienceMode,
  type SmartCampaign,
} from "@/app/lib/smartCustomer";

type ProductFilter = "discounted" | "top" | "slow" | "all";
type Step = 0 | 1 | 2;

const VISIBLE_CUSTOMERS = 300;

const FILTERS: { key: ProductFilter; label: string }[] = [
  { key: "discounted", label: "تخفیف‌دار" },
  { key: "top", label: "پرفروش" },
  { key: "slow", label: "کم‌فروش" },
  { key: "all", label: "همه" },
];

const MODES: { key: ProductAudienceMode; label: string; hint: string }[] = [
  { key: "bought", label: "خریده‌اند", hint: "قبلاً یکی از این کالاها را خریده‌اند" },
  { key: "not_bought", label: "نخریده‌اند", hint: "مشتری هستند ولی این کالاها را نخریده‌اند" },
  { key: "repurchase_due", label: "وقت خرید دوباره", hint: "فاصله معمول خریدشان از این کالا گذشته" },
];

const WINDOWS = [
  { value: 0, label: "همه زمان‌ها" },
  { value: 30, label: "۳۰ روز اخیر" },
  { value: 90, label: "۹۰ روز اخیر" },
  { value: 180, label: "۶ ماه اخیر" },
  { value: 365, label: "یک سال اخیر" },
];

const STEPS = ["کالاها", "مشتری‌ها", "پیامک"];

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    bgcolor: "var(--admin-surface-alt)",
    borderRadius: "10px",
    fontSize: 12.5,
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "var(--admin-border)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: 12.5 },
  "& .MuiFormHelperText-root": { color: "var(--admin-text-muted)", mx: 0.5, fontSize: 10.5 },
} as const;

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        border: "1px solid",
        borderColor: active ? "var(--admin-accent)" : "var(--admin-border)",
        bgcolor: active ? "rgba(120,181,104,0.14)" : "transparent",
        color: "var(--admin-text)",
        borderRadius: "999px",
        px: 1.25,
        py: 0.4,
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

function productsText(products: CampaignProduct[]) {
  const names = products.map((p) => p.name.trim()).filter(Boolean);
  if (names.length <= 3) return names.join("، ");
  return `${names.slice(0, 3).join("، ")} و ...`;
}

function discountText(products: CampaignProduct[]) {
  const pcts = products.map((p) => p.discount_pct).filter((p) => p > 0);
  if (!pcts.length) return "";
  const max = Math.max(...pcts);
  const min = Math.min(...pcts);
  return min === max ? `٪${toFaNum(max)}` : `تا ٪${toFaNum(max)}`;
}

function defaultSms(mode: ProductAudienceMode, hasDiscount: boolean) {
  if (mode === "repurchase_due") {
    return hasDiscount
      ? "وقت تهیه دوباره {products} رسیده؛ الان با {discount} تخفیف منتظرتان هستیم."
      : "وقت تهیه دوباره {products} رسیده؛ منتظرتان هستیم.";
  }
  if (mode === "not_bought") {
    return hasDiscount
      ? "{products} را امتحان کنید؛ فعلاً با {discount} تخفیف!"
      : "{products} را امتحان کنید؛ منتظرتان هستیم.";
  }
  return hasDiscount
    ? "{products} که قبلاً خریده بودید، الان با {discount} تخفیف!"
    : "{products} که قبلاً خریده بودید، دوباره موجود است.";
}

function smsParts(text: string) {
  const len = text.length;
  if (len <= 70) return 1;
  return Math.ceil(len / 67);
}

function faDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fa-IR");
}

export default function ProductCampaignDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<Step>(0);
  const [busy, setBusy] = useState(false);

  const [filter, setFilter] = useState<ProductFilter>("discounted");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<CampaignProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selected, setSelected] = useState<CampaignProduct[]>([]);

  const [mode, setMode] = useState<ProductAudienceMode>("bought");
  const [days, setDays] = useState(0);
  const [segment, setSegment] = useState("");
  const [exclude, setExclude] = useState<CampaignProduct[]>([]);
  const [excludeOptions, setExcludeOptions] = useState<CampaignProduct[]>([]);
  const [excludeInput, setExcludeInput] = useState("");

  const [audience, setAudience] = useState<ProductAudienceCustomer[] | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());

  const [name, setName] = useState("");
  const [sms, setSms] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSelected([]);
    setSearch("");
    setFilter("discounted");
    setMode("bought");
    setDays(0);
    setSegment("");
    setExclude([]);
    setAudience(null);
    setUnchecked(new Set());
    setName("");
    setSms("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      setProductsLoading(true);
      fetchCampaignProducts(filter, search)
        .then((res) => {
          if (!cancelled) setProducts(res.products || []);
        })
        .catch((e) => {
          if (!cancelled) toast.error(getApiErrorMessage(e, "دریافت کالاها ناموفق"));
        })
        .finally(() => {
          if (!cancelled) setProductsLoading(false);
        });
    }, search ? 300 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, filter, search]);

  useEffect(() => {
    if (!open || mode !== "bought") return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      fetchCampaignProducts("all", excludeInput)
        .then((res) => {
          if (!cancelled) setExcludeOptions(res.products || []);
        })
        .catch(() => undefined);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, mode, excludeInput]);

  useEffect(() => {
    setAudience(null);
    setUnchecked(new Set());
  }, [selected, mode, days, segment, exclude]);

  const selectedIds = useMemo(() => new Set(selected.map((p) => p.id)), [selected]);
  const hasDiscount = selected.some((p) => p.discount_pct > 0);

  const recipients = useMemo(
    () => (audience || []).filter((c) => !unchecked.has(c.phone)),
    [audience, unchecked],
  );

  const finalSms = useMemo(
    () =>
      sms
        .replaceAll("{products}", productsText(selected))
        .replaceAll("{discount}", discountText(selected))
        .trim(),
    [sms, selected],
  );

  const toggleProduct = (p: CampaignProduct) => {
    setSelected((prev) => (prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]));
  };

  const loadAudience = async () => {
    if (!selected.length) return;
    setAudienceLoading(true);
    try {
      const res = await fetchProductAudience({
        product_ids: selected.map((p) => p.id),
        mode,
        days: mode === "repurchase_due" ? null : days || null,
        exclude_product_ids: mode === "bought" ? exclude.map((p) => p.id) : [],
        segment: segment || null,
      });
      setAudience(res.customers || []);
      setUnchecked(new Set());
    } catch (e) {
      toast.error(getApiErrorMessage(e, "دریافت مشتری‌ها ناموفق"));
    } finally {
      setAudienceLoading(false);
    }
  };

  const goToMessage = () => {
    if (!sms) setSms(defaultSms(mode, hasDiscount));
    if (!name) {
      const first = selected[0]?.name || "کالا";
      const modeLabel = MODES.find((m) => m.key === mode)?.label || "";
      setName(`کمپین ${first}${selected.length > 1 ? ` و ${toFaNum(selected.length - 1)} کالا` : ""} · ${modeLabel}`);
    }
    setStep(2);
  };

  const submit = async (runNow: boolean) => {
    if (!recipients.length || !finalSms || !name.trim()) return;
    setBusy(true);
    try {
      const phones = recipients.map((c) => c.phone);
      const created = (await createSmartCampaign({
        name: name.trim().slice(0, 120),
        status: "active",
        cooldown_days: 1000,
        max_recipients_per_run: Math.min(10000, phones.length),
        conditions: { all: [{ field: "phone", op: "in", value: phones }] },
        actions: [
          {
            type: "send_sms",
            config: {
              message: finalSms,
              kind: "product",
              audience_mode: mode,
              product_ids: selected.map((p) => p.id),
              product_names: selected.map((p) => p.name),
            },
          },
        ],
      })) as { campaign?: SmartCampaign };

      const campaignId = created?.campaign?.id;
      if (!runNow || !campaignId) {
        toast.success("کمپین ذخیره شد؛ از لیست کمپین‌ها اجرا کن");
      } else {
        const res = (await runSmartCampaign(campaignId)) as {
          ok?: boolean;
          message?: string;
          sent?: number;
          skipped?: number;
          failed?: number;
        };
        if (res.ok === false) {
          toast.error(`کمپین ذخیره شد ولی ارسال نشد: ${res.message || "خطا"}`);
        } else {
          toast.success(
            `پیامک برای ${toFaNum(res.sent)} مشتری رفت` +
              ((res.failed || 0) > 0 ? `، ${toFaNum(res.failed)} ناموفق` : ""),
          );
        }
      }
      onCreated();
      onClose();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ساخت کمپین ناموفق"));
    } finally {
      setBusy(false);
    }
  };

  const renderProducts = () => (
    <>
      <Box sx={{ display: "flex", gap: 0.75, mb: 1, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <Pill key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Pill>
        ))}
      </Box>
      <TextField
        size="small"
        fullWidth
        placeholder="جستجوی نام یا بارکد"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={fieldSx}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: "var(--admin-text-muted)" }} />
            </InputAdornment>
          ),
        }}
      />
      {selected.length > 0 ? (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
          {selected.map((p) => (
            <Box
              key={p.id}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                pl: 0.25,
                pr: 1,
                borderRadius: "999px",
                bgcolor: "rgba(120,181,104,0.14)",
                fontSize: 11.5,
              }}
            >
              {p.name}
              <IconButton size="small" onClick={() => toggleProduct(p)} sx={{ p: 0.25 }}>
                <CloseIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      ) : null}
      <Box sx={{ mt: 1, maxHeight: 340, overflowY: "auto", mx: -0.5 }}>
        {productsLoading ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <CircularProgress size={22} />
          </Box>
        ) : products.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", py: 2, textAlign: "center" }}>
            {filter === "discounted" ? "کالای تخفیف‌داری پیدا نشد" : "کالایی پیدا نشد"}
          </Typography>
        ) : (
          products.map((p) => {
            const checked = selectedIds.has(p.id);
            return (
              <Box
                key={p.id}
                onClick={() => toggleProduct(p)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 0.5,
                  py: 0.5,
                  borderRadius: "10px",
                  cursor: "pointer",
                  bgcolor: checked ? "rgba(120,181,104,0.08)" : "transparent",
                  "&:hover": { bgcolor: "var(--admin-surface-alt)" },
                }}
              >
                <Checkbox size="small" checked={checked} sx={{ p: 0.5 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} noWrap>
                    {p.name}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)" }}>
                    فروش ۶۰ روز: {toFaNum(p.sold_qty)} · موجودی: {toFaNum(p.quantity)} · {toFaNum(p.buyers)} خریدار
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "left", flexShrink: 0 }}>
                  {p.discount_pct > 0 && p.original_sale_price ? (
                    <Typography
                      sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", textDecoration: "line-through" }}
                    >
                      {toFaNum(p.original_sale_price)}
                    </Typography>
                  ) : null}
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                    {toFaNum(p.sale_price)}
                    {p.discount_pct > 0 ? (
                      <Box component="span" sx={{ color: "#f87171", fontSize: 10.5, mr: 0.5 }}>
                        ٪{toFaNum(p.discount_pct)}
                      </Box>
                    ) : null}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </>
  );

  const renderAudience = () => (
    <>
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
        {MODES.map((m) => (
          <Pill key={m.key} active={mode === m.key} onClick={() => setMode(m.key)}>
            {m.label}
          </Pill>
        ))}
      </Box>
      <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mt: 0.5, mb: 1.25 }}>
        {MODES.find((m) => m.key === mode)?.hint}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        {mode !== "repurchase_due" ? (
          <TextField select size="small" label="بازه خرید" value={days} onChange={(e) => setDays(Number(e.target.value))} sx={fieldSx}>
            {WINDOWS.map((w) => (
              <MenuItem key={w.value} value={w.value} sx={{ fontSize: 12 }}>
                {w.label}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
        <TextField
          select
          size="small"
          label="گروه مشتری"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          sx={{ ...fieldSx, gridColumn: mode === "repurchase_due" ? "1 / -1" : undefined }}
        >
          <MenuItem value="" sx={{ fontSize: 12 }}>
            همه گروه‌ها
          </MenuItem>
          {Object.entries(SMART_SEGMENT_LABELS).map(([key, label]) => (
            <MenuItem key={key} value={key} sx={{ fontSize: 12 }}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {mode === "bought" ? (
        <Autocomplete
          multiple
          size="small"
          sx={{ mt: 1 }}
          options={excludeOptions.filter((o) => !selectedIds.has(o.id))}
          value={exclude}
          onChange={(_, v) => setExclude(v)}
          inputValue={excludeInput}
          onInputChange={(_, v) => setExcludeInput(v)}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={(x) => x}
          noOptionsText="کالایی پیدا نشد"
          ChipProps={{ size: "small" }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="ولی این کالاها را نخریده‌اند (اختیاری)"
              helperText="برای فروش مکمل: مثلاً خریدار شامپو که نرم‌کننده نخریده"
              sx={fieldSx}
            />
          )}
        />
      ) : null}

      <Button
        fullWidth
        variant="outlined"
        onClick={() => void loadAudience()}
        disabled={audienceLoading}
        startIcon={audienceLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
        sx={{ mt: 1.25, borderRadius: "10px", fontSize: 12.5 }}
      >
        {audience ? "به‌روزرسانی لیست" : "نمایش مشتری‌ها"}
      </Button>

      {audience ? (
        audience.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", py: 2, textAlign: "center" }}>
            مشتری‌ای با این شرایط پیدا نشد
          </Typography>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                {toFaNum(recipients.length)} از {toFaNum(audience.length)} نفر انتخاب شده
              </Typography>
              <Button
                size="small"
                onClick={() =>
                  setUnchecked(unchecked.size ? new Set() : new Set(audience.map((c) => c.phone)))
                }
                sx={{ fontSize: 11, minWidth: 0, color: "var(--admin-text-muted)" }}
              >
                {unchecked.size ? "انتخاب همه" : "حذف همه"}
              </Button>
            </Box>
            <Box sx={{ maxHeight: 260, overflowY: "auto", mx: -0.5 }}>
              {audience.slice(0, VISIBLE_CUSTOMERS).map((c) => {
                const checked = !unchecked.has(c.phone);
                const detail =
                  mode === "repurchase_due"
                    ? `${c.due_product || ""} · ${c.overdue_days ? `${toFaNum(c.overdue_days)} روز گذشته` : "همین حالا"}`
                    : mode === "bought"
                      ? `${toFaNum(c.orders)} بار · آخرین ${faDate(c.last_bought_at)}`
                      : `${toFaNum(c.frequency)} خرید کل · ${toFaNum(c.recency_days)} روز پیش`;
                return (
                  <Box
                    key={c.phone}
                    onClick={() =>
                      setUnchecked((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.phone)) next.delete(c.phone);
                        else next.add(c.phone);
                        return next;
                      })
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 0.5,
                      py: 0.25,
                      borderRadius: "8px",
                      cursor: "pointer",
                      opacity: checked ? 1 : 0.5,
                      "&:hover": { bgcolor: "var(--admin-surface-alt)" },
                    }}
                  >
                    <Checkbox size="small" checked={checked} sx={{ p: 0.5 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12 }} noWrap>
                        {c.name || <span style={{ direction: "ltr" }}>{c.phone}</span>}
                        {c.segment_label ? (
                          <Box component="span" sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", mr: 0.75 }}>
                            {c.segment_label}
                          </Box>
                        ) : null}
                      </Typography>
                      <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)" }} noWrap>
                        {detail}
                      </Typography>
                    </Box>
                    {c.name ? (
                      <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", direction: "ltr" }}>
                        {c.phone}
                      </Typography>
                    ) : null}
                  </Box>
                );
              })}
              {audience.length > VISIBLE_CUSTOMERS ? (
                <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", textAlign: "center", py: 1 }}>
                  و {toFaNum(audience.length - VISIBLE_CUSTOMERS)} نفر دیگر
                </Typography>
              ) : null}
            </Box>
          </Box>
        )
      ) : null}
    </>
  );

  const renderMessage = () => (
    <Box sx={{ display: "grid", gap: 1 }}>
      <TextField size="small" label="نام کمپین" value={name} onChange={(e) => setName(e.target.value)} sx={fieldSx} />
      <TextField
        size="small"
        label="متن پیامک"
        value={sms}
        onChange={(e) => setSms(e.target.value)}
        multiline
        minRows={3}
        helperText="{products} = نام کالاها · {discount} = درصد تخفیف"
        sx={fieldSx}
      />
      <Box sx={{ bgcolor: "var(--admin-surface-alt)", borderRadius: "10px", p: 1.25 }}>
        <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", mb: 0.5 }}>پیش‌نمایش</Typography>
        <Typography sx={{ fontSize: 12.5, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{finalSms || "—"}</Typography>
        <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", mt: 0.75 }}>
          {toFaNum(smsParts(finalSms))} پیامک برای هر نفر · حدود {toFaNum(smsParts(finalSms) * recipients.length)} پیامک
          کل
        </Typography>
      </Box>
      {!hasDiscount && sms.includes("{discount}") ? (
        <Typography sx={{ fontSize: 11, color: "#f59e0b" }}>
          کالاهای انتخابی تخفیف ندارند؛ {"{discount}"} خالی می‌ماند.
        </Typography>
      ) : null}
    </Box>
  );

  const canNext =
    step === 0 ? selected.length > 0 : step === 1 ? recipients.length > 0 : finalSms !== "" && name.trim() !== "";

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      PaperProps={{
        sx: {
          width: 460,
          maxWidth: "calc(100% - 24px)",
          m: 1.5,
          p: 2,
          bgcolor: "var(--admin-surface)",
          color: "var(--admin-text)",
          border: "1px solid var(--admin-border)",
          borderRadius: "14px",
          direction: "rtl",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>کمپین کالایی</Typography>
        <IconButton size="small" onClick={onClose} disabled={busy}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, mb: 1.5 }}>
        {STEPS.map((label, i) => (
          <Box key={label} sx={{ flex: 1 }}>
            <Box
              sx={{
                height: 3,
                borderRadius: 2,
                bgcolor: i <= step ? "var(--admin-accent)" : "var(--admin-border)",
              }}
            />
            <Typography
              sx={{
                fontSize: 10.5,
                mt: 0.4,
                color: i === step ? "var(--admin-text)" : "var(--admin-text-muted)",
                fontWeight: i === step ? 700 : 400,
              }}
            >
              {toFaNum(i + 1)}. {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {step === 0 ? renderProducts() : step === 1 ? renderAudience() : renderMessage()}

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        {step < 2 ? (
          <Button
            fullWidth
            variant="contained"
            disableElevation
            disabled={!canNext}
            onClick={() => (step === 0 ? setStep(1) : goToMessage())}
            sx={{ borderRadius: "10px", fontWeight: 700, fontSize: 12.5 }}
          >
            {step === 0
              ? `ادامه${selected.length ? ` با ${toFaNum(selected.length)} کالا` : ""}`
              : `ادامه با ${toFaNum(recipients.length)} نفر`}
          </Button>
        ) : (
          <>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              disabled={!canNext || busy}
              onClick={() => void submit(true)}
              startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ borderRadius: "10px", fontWeight: 700, fontSize: 12.5 }}
            >
              ارسال به {toFaNum(recipients.length)} نفر
            </Button>
            <Button
              disabled={!canNext || busy}
              onClick={() => void submit(false)}
              sx={{ borderRadius: "10px", fontSize: 12, color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}
            >
              فقط ذخیره
            </Button>
          </>
        )}
        {step > 0 ? (
          <Button
            disabled={busy}
            onClick={() => setStep((s) => (s - 1) as Step)}
            sx={{ borderRadius: "10px", fontSize: 12, color: "var(--admin-text-muted)" }}
          >
            قبلی
          </Button>
        ) : null}
      </Box>
    </Dialog>
  );
}
