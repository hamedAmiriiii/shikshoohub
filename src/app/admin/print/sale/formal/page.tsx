"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Suspense } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  emptyBuyer,
  emptySeller,
  formatFaDate,
  formatFaNumber,
  mapPurchaseLines,
  numberToPersianWords,
  type FormalParty,
} from "@/app/lib/formalInvoice";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--admin-surface-alt, #f5f5f5)",
    color: "var(--admin-text)",
    fontSize: 13,
  },
  "& .MuiInputLabel-root": { fontSize: 12 },
};

function PartyFields({
  title,
  value,
  onChange,
  isSeller,
}: {
  title: string;
  value: FormalParty;
  onChange: (next: FormalParty) => void;
  isSeller?: boolean;
}) {
  const set = (key: keyof FormalParty, v: string) => onChange({ ...value, [key]: v });
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>{title}</Typography>
      {isSeller ? (
        <>
          <TextField size="small" label="نام / عنوان قانونی" value={value.legal_name || ""} onChange={(e) => set("legal_name", e.target.value)} sx={fieldSx} />
          <TextField size="small" label="نام تجاری" value={value.brand_name || ""} onChange={(e) => set("brand_name", e.target.value)} sx={fieldSx} />
        </>
      ) : (
        <>
          <TextField size="small" label="تلفن" value={value.phone || ""} onChange={(e) => set("phone", e.target.value)} sx={fieldSx} />
          <TextField size="small" label="نام / عنوان" value={value.full_name || ""} onChange={(e) => set("full_name", e.target.value)} sx={fieldSx} />
        </>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        <TextField size="small" label="استان" value={value.province || ""} onChange={(e) => set("province", e.target.value)} sx={fieldSx} />
        <TextField size="small" label="شهر" value={value.city || ""} onChange={(e) => set("city", e.target.value)} sx={fieldSx} />
      </Box>
      <TextField size="small" label="آدرس" value={value.address || ""} onChange={(e) => set("address", e.target.value)} sx={fieldSx} />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        <TextField size="small" label="کد پستی" value={value.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} sx={fieldSx} />
        {isSeller ? (
          <TextField size="small" label="تلفن" value={value.phone || ""} onChange={(e) => set("phone", e.target.value)} sx={fieldSx} />
        ) : (
          <TextField size="small" label="شناسه ملی / کد ملی" value={value.national_id || ""} onChange={(e) => set("national_id", e.target.value)} sx={fieldSx} />
        )}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        <TextField size="small" label="شماره اقتصادی" value={value.economic_code || ""} onChange={(e) => set("economic_code", e.target.value)} sx={fieldSx} />
        <TextField size="small" label="شماره ثبت" value={value.registration_number || ""} onChange={(e) => set("registration_number", e.target.value)} sx={fieldSx} />
      </Box>
      {isSeller ? (
        <>
          <TextField size="small" label="شناسه ملی" value={value.national_id || ""} onChange={(e) => set("national_id", e.target.value)} sx={fieldSx} />
          <TextField size="small" label="توضیحات ثابت فاکتور" value={value.fixed_notes || ""} onChange={(e) => set("fixed_notes", e.target.value)} multiline minRows={2} sx={fieldSx} />
        </>
      ) : null}
    </Box>
  );
}

function PrintPartyBox({
  title,
  party,
  isSeller,
}: {
  title: string;
  party: FormalParty;
  isSeller?: boolean;
}) {
  const name = isSeller ? party.legal_name || party.brand_name : party.full_name;
  return (
    <Box className="fi-box" sx={{ flex: 1, minWidth: 0, border: "1px solid #111", display: "flex", flexDirection: "column" }}>
      <Box sx={{ bgcolor: "#d9d9d9", borderBottom: "1px solid #111", px: 0.75, py: 0.35, textAlign: "center", fontWeight: 800, fontSize: 11 }}>
        {title}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 0, fontSize: 9.5, lineHeight: 1.55, p: 0.6, flex: 1 }}>
        <Box>
          <div>نام شخص حقیقی/حقوقی: {name || "—"}</div>
          <div>استان: {party.province || "—"}</div>
          <div>نشانی: {party.address || "—"}</div>
        </Box>
        <Box>
          <div>شماره اقتصادی: {party.economic_code || "—"}</div>
          <div>شهرستان: {party.city || "—"}</div>
          <div>کد پستی: {party.postal_code || "—"}</div>
        </Box>
        <Box>
          <div>شماره ثبت: {party.registration_number || "—"}</div>
          <div>شناسه ملی: {party.national_id || "—"}</div>
          <div>تلفن/نمابر: {party.phone || "—"}</div>
        </Box>
      </Box>
    </Box>
  );
}

function FormalInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchase, setPurchase] = useState<any>(null);
  const [seller, setSeller] = useState<FormalParty>(emptySeller());
  const [buyer, setBuyer] = useState<FormalParty>(emptyBuyer());
  const [notes, setNotes] = useState("");
  const [saleMode, setSaleMode] = useState<"cash" | "credit">("cash");
  const [buyerLookupBusy, setBuyerLookupBusy] = useState(false);

  const lines = useMemo(() => mapPurchaseLines(purchase), [purchase]);
  const invoiceDiscount = Number(purchase?.discount_amount) || 0;
  const linesSum = lines.reduce((s, l) => s + l.lineTotal, 0);
  const payable = Math.max(0, linesSum - invoiceDiscount);
  const totalWords = `${numberToPersianWords(payable)} ریال`;

  const load = useCallback(async () => {
    const token = tokenCode();
    if (!token || !purchaseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", `/api/formal-invoice/purchase/${purchaseId}`, token);
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت فاکتور"));
        return;
      }
      setPurchase(res.purchase || res.data?.purchase || res);
      const s = res.seller || res.data?.seller;
      const b = res.buyer || res.data?.buyer;
      setSeller({ ...emptySeller(), ...(s || {}) });
      setBuyer({ ...emptyBuyer(), ...(b || {}) });
      if (s?.fixed_notes) setNotes(String(s.fixed_notes));
      const paymentType = (res.purchase || res)?.payment_type;
      setSaleMode(paymentType === "debt" || paymentType === "installment" || paymentType === "cheque" ? "credit" : "cash");
    } finally {
      setLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const lookupBuyer = useCallback(
    async (phone: string) => {
      const token = tokenCode();
      const digits = phone.replace(/\D/g, "");
      if (!token || digits.length < 10) return;
      setBuyerLookupBusy(true);
      try {
        const res = await FetchWithJwtClient("GET", `/api/formal-invoice/buyer/${encodeURIComponent(digits)}`, token);
        if (!res || res.hasError) return;
        const b = res.buyer || res.data?.buyer;
        if (b) {
          setBuyer((prev) => ({
            ...prev,
            ...b,
            phone: b.phone || prev.phone || digits,
          }));
        }
      } finally {
        setBuyerLookupBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    const phone = (buyer.phone || "").replace(/\D/g, "");
    if (phone.length < 10) return;
    const timer = window.setTimeout(() => {
      void lookupBuyer(phone);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [buyer.phone, lookupBuyer]);

  const saveProfiles = async () => {
    const token = tokenCode();
    if (!token) return false;
    setSaving(true);
    try {
      const sellerRes = await FetchWithJwtClient("PUT", "/api/formal-invoice/seller", {
        legal_name: seller.legal_name || null,
        brand_name: seller.brand_name || null,
        province: seller.province || null,
        city: seller.city || null,
        address: seller.address || null,
        postal_code: seller.postal_code || null,
        phone: seller.phone || null,
        economic_code: seller.economic_code || null,
        national_id: seller.national_id || null,
        registration_number: seller.registration_number || null,
        fixed_notes: seller.fixed_notes || notes || null,
      });
      if (sellerRes?.hasError) {
        toast.error(getApiErrorMessage(sellerRes, "خطا در ذخیره فروشنده"));
        return false;
      }

      const phone = (buyer.phone || "").replace(/\D/g, "");
      if (phone.length >= 10) {
        const buyerRes = await FetchWithJwtClient("PUT", "/api/formal-invoice/buyer", {
          phone,
          full_name: buyer.full_name || null,
          province: buyer.province || null,
          city: buyer.city || null,
          address: buyer.address || null,
          postal_code: buyer.postal_code || null,
          economic_code: buyer.economic_code || null,
          national_id: buyer.national_id || null,
          registration_number: buyer.registration_number || null,
        });
        if (buyerRes?.hasError) {
          toast.error(getApiErrorMessage(buyerRes, "خطا در ذخیره خریدار"));
          return false;
        }
      }
      toast.success("اطلاعات ذخیره شد");
      return true;
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    await saveProfiles();
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!purchase) {
    return (
      <Box sx={{ p: 3, textAlign: "center", direction: "rtl" }}>
        <Typography sx={{ mb: 2 }}>فاکتور یافت نشد.</Typography>
        <Button variant="contained" onClick={() => router.push("/admin/purchas")}>
          بازگشت
        </Button>
      </Box>
    );
  }

  return (
    <>
      <style>{`
        @page { size: A5 landscape; margin: 6mm; }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .fi-sheet {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        .fi-sheet {
          direction: rtl;
          color: #111;
          font-family: Tahoma, "Iranian Sans", Arial, sans-serif;
          background: #fff;
        }
        .fi-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .fi-table th, .fi-table td {
          border: 1px solid #111;
          padding: 3px 2px;
          font-size: 9px;
          text-align: center;
          vertical-align: middle;
          word-break: break-word;
        }
        .fi-table th { background: #d9d9d9; font-weight: 800; }
        .fi-table td.name { text-align: right; padding-right: 4px; }
      `}</style>

      <Box sx={{ direction: "rtl", bgcolor: "#e8e8e8", minHeight: "100vh", p: 2 }}>
        <Box className="no-print" sx={{ maxWidth: 980, mx: "auto", mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" startIcon={<PrintIcon />} disabled={saving} onClick={() => void handlePrint()}>
            چاپ فاکتور رسمی
          </Button>
          <Button variant="outlined" startIcon={<SaveIcon />} disabled={saving} onClick={() => void saveProfiles()}>
            ذخیره اطلاعات
          </Button>
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => window.close()}>
            بستن
          </Button>
          {buyerLookupBusy ? (
            <Typography sx={{ fontSize: 12, alignSelf: "center", color: "#666" }}>در حال خواندن مشخصات خریدار…</Typography>
          ) : null}
        </Box>

        <Box
          className="no-print"
          sx={{
            maxWidth: 980,
            mx: "auto",
            mb: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            bgcolor: "#fff",
            p: 2,
            borderRadius: 2,
          }}
        >
          <PartyFields title="مشخصات فروشنده (اختیاری — ذخیره می‌شود)" value={seller} onChange={setSeller} isSeller />
          <PartyFields title="مشخصات خریدار (با تلفن برای دفعات بعد)" value={buyer} onChange={setBuyer} />
          <Box sx={{ gridColumn: "1 / -1" }}>
            <TextField
              fullWidth
              size="small"
              label="توضیحات این فاکتور"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              minRows={2}
              sx={fieldSx}
            />
            <Typography sx={{ fontSize: 12, mt: 1, mb: 0.5 }}>شرایط و نحوه فروش</Typography>
            <RadioGroup row value={saleMode} onChange={(e) => setSaleMode(e.target.value as "cash" | "credit")}>
              <FormControlLabel value="cash" control={<Radio size="small" />} label="نقدی" />
              <FormControlLabel value="credit" control={<Radio size="small" />} label="غیرنقدی" />
            </RadioGroup>
          </Box>
        </Box>

        <Box
          className="fi-sheet print-preview"
          sx={{
            maxWidth: 980,
            mx: "auto",
            border: "1px solid #ccc",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            p: 1.25,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1 }}>
            <Box sx={{ width: 120, fontSize: 11, lineHeight: 1.7 }}>
              <div>شماره فاکتور: {formatFaNumber(Number(purchase.id) || 0)}</div>
              <div>تاریخ: {formatFaDate(purchase.created_at)}</div>
            </Box>
            <Box sx={{ textAlign: "center", flex: 1 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 22, lineHeight: 1.2 }}>فاکتور فروش</Typography>
              <Typography sx={{ fontSize: 11, mt: 0.25 }}>
                {seller.brand_name || seller.legal_name || purchase.shop_name || ""}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 90,
                height: 56,
                border: "1px dashed #888",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "#666",
                textAlign: "center",
                px: 0.5,
              }}
            >
              محل لوگو
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 0.75, mb: 1 }}>
            <PrintPartyBox title="مشخصات فروشنده" party={seller} isSeller />
            <PrintPartyBox title="مشخصات خریدار" party={buyer} />
          </Box>

          <Box sx={{ bgcolor: "#d9d9d9", border: "1px solid #111", borderBottom: 0, textAlign: "center", fontWeight: 800, fontSize: 11, py: 0.35 }}>
            مشخصات کالا یا خدمات مورد معامله
          </Box>
          <table className="fi-table">
            <thead>
              <tr>
                <th style={{ width: "4%" }}>ردیف</th>
                <th style={{ width: "8%" }}>کد کالا</th>
                <th style={{ width: "18%" }}>شرح کالا / خدمات</th>
                <th style={{ width: "6%" }}>تعداد</th>
                <th style={{ width: "6%" }}>واحد</th>
                <th style={{ width: "9%" }}>مبلغ واحد</th>
                <th style={{ width: "9%" }}>مبلغ کل</th>
                <th style={{ width: "8%" }}>تخفیف</th>
                <th style={{ width: "9%" }}>پس از تخفیف</th>
                <th style={{ width: "8%" }}>مالیات</th>
                <th style={{ width: "10%" }}>جمع نهایی</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td>{formatFaNumber(index + 1)}</td>
                  <td>{line.code || "—"}</td>
                  <td className="name">{line.name}</td>
                  <td>{formatFaNumber(line.quantity)}</td>
                  <td>{line.unit}</td>
                  <td>{formatFaNumber(line.unitPrice)}</td>
                  <td>{formatFaNumber(line.lineTotal)}</td>
                  <td>{formatFaNumber(line.discount)}</td>
                  <td>{formatFaNumber(line.afterDiscount)}</td>
                  <td>{formatFaNumber(line.tax)}</td>
                  <td>{formatFaNumber(line.grand)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} style={{ fontWeight: 800 }}>جمع کل</td>
                <td style={{ fontWeight: 800 }}>{formatFaNumber(linesSum)}</td>
                <td style={{ fontWeight: 800 }}>{formatFaNumber(invoiceDiscount)}</td>
                <td style={{ fontWeight: 800 }}>{formatFaNumber(Math.max(0, linesSum - invoiceDiscount))}</td>
                <td style={{ fontWeight: 800 }}>۰</td>
                <td style={{ fontWeight: 800 }}>{formatFaNumber(payable)}</td>
              </tr>
            </tbody>
          </table>

          <Box sx={{ border: "1px solid #111", borderTop: 0, px: 0.75, py: 0.5, fontSize: 11 }}>
            جمع کل (حروف): {totalWords}
          </Box>

          <Box sx={{ display: "flex", border: "1px solid #111", borderTop: 0, fontSize: 11 }}>
            <Box sx={{ flex: 1, borderLeft: "1px solid #111", p: 0.75 }}>
              شرایط و نحوه فروش:{" "}
              <Box component="span" sx={{ mx: 1 }}>
                [{saleMode === "cash" ? "✓" : " "}] نقدی
              </Box>
              <Box component="span" sx={{ mx: 1 }}>
                [{saleMode === "credit" ? "✓" : " "}] غیرنقدی
              </Box>
            </Box>
            <Box sx={{ flex: 1.4, p: 0.75, minHeight: 52 }}>
              توضیحات: {notes || seller.fixed_notes || "—"}
            </Box>
          </Box>

          <Box sx={{ display: "flex", border: "1px solid #111", borderTop: 0, minHeight: 72 }}>
            <Box sx={{ flex: 1, borderLeft: "1px solid #111", p: 0.75, fontSize: 11, textAlign: "center" }}>
              مهر و امضاء فروشنده
            </Box>
            <Box sx={{ flex: 1, p: 0.75, fontSize: 11, textAlign: "center" }}>
              مهر و امضاء خریدار
            </Box>
          </Box>
        </Box>
      </Box>
      <ToastContainer className="no-print" position="bottom-right" rtl autoClose={2500} />
    </>
  );
}

export default function FormalInvoicePrintPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      }
    >
      <FormalInvoiceContent />
    </Suspense>
  );
}
