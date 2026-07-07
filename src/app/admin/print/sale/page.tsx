"use client";



import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import {

  Box,

  Button,

  Typography,

  TextField,

  FormControlLabel,

  Switch,

  Select,

  MenuItem,

  Divider,

  Slider,

} from "@mui/material";

import PrintIcon from "@mui/icons-material/Print";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import RestartAltIcon from "@mui/icons-material/RestartAlt";

import {

  type SaleReceiptData,

  type SaleReceiptPrintSettings,

  RECEIPT_PAPER_PRESETS,

  readSaleReceiptPrintData,

  readSaleReceiptPrintSettings,

  writeSaleReceiptPrintSettings,

  resetSaleReceiptPrintSettings,

  resolvePaperWidthMm,

  formatReceiptNumber,

  formatReceiptDate,

  getPaymentTypeLabel,

  DEFAULT_SALE_RECEIPT_PRINT_SETTINGS,

} from "@/app/lib/saleReceiptPrint";



function ReceiptPreview({

  receipt,

  settings,

  paperWidthMm,

}: {

  receipt: SaleReceiptData;

  settings: SaleReceiptPrintSettings;

  paperWidthMm: number;

}) {

  const shopTitle = settings.shopTitle || receipt.shopName || "فاکتور فروش";

  const itemGap = settings.compactItems ? 0.5 : 1;



  return (

    <Box

      id="sale-receipt-print-root"

      sx={{

        width: `${paperWidthMm}mm`,

        maxWidth: "100%",

        mx: "auto",

        bgcolor: "#fff",

        color: "#000",

        fontFamily: "Tahoma, Arial, sans-serif",

        fontSize: `${settings.fontSize}px`,

        lineHeight: settings.lineHeight,

        p: `${settings.paddingMm}mm`,

        boxSizing: "border-box",

      }}

    >

      <Typography

        align="center"

        sx={{ fontWeight: 800, fontSize: `${settings.titleFontSize}px`, mb: 0.5 }}

      >

        {shopTitle}

      </Typography>



      {settings.showDate && (

        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 1 }}>

          {formatReceiptDate(receipt.createdAt)}

        </Typography>

      )}



      {settings.showPurchaseId && receipt.purchaseId != null && (

        <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>

          شماره فاکتور: {receipt.purchaseId}

        </Typography>

      )}

      {settings.showCustomerPhone && receipt.phone && (

        <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>

          مشتری: {receipt.phone}

        </Typography>

      )}



      <Divider sx={{ my: 1, borderColor: "#000" }} />



      {receipt.items.map((item, index) => (

        <Box key={`${item.id ?? index}-${index}`} sx={{ mb: itemGap }}>

          <Typography

            sx={{

              fontWeight: 700,

              fontSize: `${settings.fontSize}px`,

              lineHeight: settings.compactItems ? 1.3 : settings.lineHeight,

            }}

          >

            {item.name}

          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>

            {settings.showItemUnitPrice ? (

              <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>

                {formatReceiptNumber(item.quantity)} × {formatReceiptNumber(item.unitPrice)}

              </Typography>

            ) : (

              <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>

                تعداد: {formatReceiptNumber(item.quantity)}

              </Typography>

            )}

            <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, fontWeight: 700 }}>

              {formatReceiptNumber(item.lineTotal)}

            </Typography>

          </Box>

        </Box>

      ))}



      <Divider sx={{ my: 1, borderColor: "#000" }} />



      <Box sx={{ display: "flex", flexDirection: "column", gap: settings.compactItems ? 0.1 : 0.25 }}>

        <Row label="جمع" value={formatReceiptNumber(receipt.subtotal)} />

        {receipt.discount > 0 && (

          <Row label="تخفیف" value={formatReceiptNumber(receipt.discount)} />

        )}

        {receipt.creditUsed > 0 && (

          <Row label="اعتبار" value={formatReceiptNumber(receipt.creditUsed)} />

        )}

        {receipt.backPrice > 0 && (

          <Row label="برگشتی" value={formatReceiptNumber(receipt.backPrice)} />

        )}

        <Row

          label="مبلغ نهایی"

          value={`${formatReceiptNumber(receipt.finalTotal)} تومان`}

          bold

        />

        {receipt.payableNow > 0 && receipt.payableNow !== receipt.finalTotal && (

          <Row label="قابل پرداخت" value={`${formatReceiptNumber(receipt.payableNow)} تومان`} />

        )}

      </Box>



      {settings.showPaymentMethod && (

        <>

          <Divider sx={{ my: 1, borderColor: "#000" }} />

          <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>

            روش پرداخت: {getPaymentTypeLabel(receipt)}

          </Typography>

          {receipt.settlementMode === "split" && (

            <>

              {!!receipt.cardAmount && (

                <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>

                  کارت: {formatReceiptNumber(receipt.cardAmount)} تومان

                </Typography>

              )}

              {!!receipt.cashAmount && (

                <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>

                  نقد: {formatReceiptNumber(receipt.cashAmount)} تومان

                </Typography>

              )}

            </>

          )}

          {receipt.paymentType === "installment" && receipt.installmentAmount != null && (

            <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>

              مبلغ هر قسط: {formatReceiptNumber(Math.floor(receipt.installmentAmount))} تومان

            </Typography>

          )}

        </>

      )}



      {settings.footerText && (

        <>

          <Divider sx={{ my: 1, borderColor: "#000" }} />

          <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mt: 1 }}>

            {settings.footerText}

          </Typography>

        </>

      )}

    </Box>

  );

}



function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {

  return (

    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>

      <Typography sx={{ fontWeight: bold ? 700 : 400 }}>{label}</Typography>

      <Typography sx={{ fontWeight: bold ? 700 : 400 }}>{value}</Typography>

    </Box>

  );

}



function SettingsSection({

  title,

  children,

}: {

  title: string;

  children: ReactNode;

}) {

  return (

    <Box sx={{ gridColumn: "1 / -1" }}>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1, color: "#333" }}>

        {title}

      </Typography>

      <Box

        sx={{

          display: "grid",

          gap: 1.5,

          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },

        }}

      >

        {children}

      </Box>

    </Box>

  );

}



function SaleReceiptPrintContent() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const [receipt, setReceipt] = useState<SaleReceiptData | null>(null);

  const [settings, setSettings] = useState<SaleReceiptPrintSettings>(

    DEFAULT_SALE_RECEIPT_PRINT_SETTINGS,

  );

  const [showSettings, setShowSettings] = useState(false);
  const directPrintMode = searchParams.get("direct") === "1";



  const paperWidthMm = useMemo(() => resolvePaperWidthMm(settings), [settings]);



  useEffect(() => {

    setSettings(readSaleReceiptPrintSettings());

    setReceipt(readSaleReceiptPrintData());

  }, []);



  useEffect(() => {
    if (!receipt || !settings.autoPrint) return;
    const timer = setTimeout(() => window.print(), 400);
    if (directPrintMode) {
      const closeTimer = setTimeout(() => window.close(), 1400);
      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
    return () => clearTimeout(timer);
  }, [directPrintMode, receipt, settings.autoPrint]);



  const saveSettings = useCallback((partial: Partial<SaleReceiptPrintSettings>) => {

    setSettings((prev) => writeSaleReceiptPrintSettings({ ...prev, ...partial }));

  }, []);



  const handleResetSettings = useCallback(() => {

    setSettings(resetSaleReceiptPrintSettings());

  }, []);



  const printStyles = useMemo(

    () => `

      @page {

        size: ${paperWidthMm}mm auto;

        margin: 0;

      }

      @media print {

        html, body {

          width: ${paperWidthMm}mm;

          margin: 0 !important;

          padding: 0 !important;

          background: #fff !important;

        }

        .no-print {

          display: none !important;

        }

        .print-only {

          display: block !important;

        }

        #sale-receipt-print-root {

          width: ${paperWidthMm}mm !important;

          max-width: ${paperWidthMm}mm !important;

          box-shadow: none !important;

        }

      }

    `,

    [paperWidthMm],

  );



  if (!receipt) {

    return (

      <Box sx={{ p: 3, textAlign: "center", direction: "rtl" }}>

        <Typography sx={{ mb: 2 }}>اطلاعات فاکتور برای چاپ یافت نشد.</Typography>

        <Button variant="contained" onClick={() => router.push("/admin")}>

          بازگشت

        </Button>

      </Box>

    );

  }



  return (

    <>

      <style>{printStyles}</style>



      {!directPrintMode && (
        <Box className="no-print" sx={{ direction: "rtl", bgcolor: "#f3f4f6", minHeight: "100vh", p: 2 }}>

        <Box sx={{ maxWidth: 820, mx: "auto" }}>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>

            <Button

              variant="contained"

              startIcon={<PrintIcon />}

              onClick={() => window.print()}

              sx={{ bgcolor: "#78b568", "&:hover": { bgcolor: "#5a9a4a" } }}

            >

              چاپ فاکتور

            </Button>

            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => window.close()}>

              بستن

            </Button>

            <Button variant="text" onClick={() => setShowSettings((v) => !v)}>

              {showSettings ? "پنهان کردن تنظیمات" : "تنظیمات چاپ"}

            </Button>

          </Box>



          {showSettings && (

            <Box

              sx={{

                bgcolor: "#fff",

                borderRadius: 2,

                p: 2,

                mb: 2,

                border: "1px solid #e0e0e0",

                display: "grid",

                gap: 2,

                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },

              }}

            >

              <Typography sx={{ gridColumn: "1 / -1", fontWeight: 700, fontSize: 16 }}>

                تنظیمات چاپ فاکتور

              </Typography>



              <SettingsSection title="عرض و اندازه کاغذ">

                <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>

                  <Typography sx={{ fontSize: 13, mb: 0.5 }}>نوع / عرض کاغذ</Typography>

                  <Select

                    size="small"

                    fullWidth

                    value={settings.paperPreset}

                    onChange={(e) =>

                      saveSettings({

                        paperPreset: e.target.value as SaleReceiptPrintSettings["paperPreset"],

                      })

                    }

                  >

                    {RECEIPT_PAPER_PRESETS.map((preset) => (

                      <MenuItem key={preset.id} value={preset.id}>

                        {preset.label}

                        {preset.hint ? ` — ${preset.hint}` : ""}

                      </MenuItem>

                    ))}

                  </Select>

                </Box>



                {settings.paperPreset === "custom" && (

                  <Box>

                    <Typography sx={{ fontSize: 13, mb: 0.5 }}>

                      عرض سفارشی (40 تا 220 میلی‌متر)

                    </Typography>

                    <TextField

                      size="small"

                      fullWidth

                      type="number"

                      value={settings.customPaperWidthMm}

                      inputProps={{ min: 40, max: 220 }}

                      onChange={(e) => {

                        const value = parseInt(e.target.value, 10);

                        if (!Number.isNaN(value)) saveSettings({ customPaperWidthMm: value });

                      }}

                    />

                  </Box>

                )}



                <Box>

                  <Typography sx={{ fontSize: 13, mb: 0.5 }}>حاشیه داخلی (mm)</Typography>

                  <Slider

                    size="small"

                    value={settings.paddingMm}

                    min={0}

                    max={12}

                    step={1}

                    valueLabelDisplay="auto"

                    onChange={(_, value) => saveSettings({ paddingMm: value as number })}

                  />

                </Box>



                <Box sx={{ display: "flex", alignItems: "center" }}>

                  <Typography sx={{ fontSize: 13, color: "#666" }}>

                    عرض مؤثر چاپ: <strong>{paperWidthMm}mm</strong>

                  </Typography>

                </Box>

              </SettingsSection>



              <Divider sx={{ gridColumn: "1 / -1" }} />



              <SettingsSection title="ظاهر متن">

                <Box>

                  <Typography sx={{ fontSize: 13, mb: 0.5 }}>

                    اندازه فونت متن ({settings.fontSize}px)

                  </Typography>

                  <Slider

                    size="small"

                    value={settings.fontSize}

                    min={8}

                    max={18}

                    step={1}

                    valueLabelDisplay="auto"

                    onChange={(_, value) => saveSettings({ fontSize: value as number })}

                  />

                </Box>



                <Box>

                  <Typography sx={{ fontSize: 13, mb: 0.5 }}>

                    اندازه عنوان ({settings.titleFontSize}px)

                  </Typography>

                  <Slider

                    size="small"

                    value={settings.titleFontSize}

                    min={10}

                    max={22}

                    step={1}

                    valueLabelDisplay="auto"

                    onChange={(_, value) => saveSettings({ titleFontSize: value as number })}

                  />

                </Box>



                <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>

                  <Typography sx={{ fontSize: 13, mb: 0.5 }}>

                    فاصله خطوط ({settings.lineHeight.toFixed(1)})

                  </Typography>

                  <Slider

                    size="small"

                    value={settings.lineHeight}

                    min={1.1}

                    max={2.2}

                    step={0.1}

                    valueLabelDisplay="auto"

                    onChange={(_, value) => saveSettings({ lineHeight: value as number })}

                  />

                </Box>

              </SettingsSection>



              <Divider sx={{ gridColumn: "1 / -1" }} />



              <SettingsSection title="محتوای فاکتور">

                <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>

                  <Typography sx={{ fontSize: 13, mb: 0.5 }}>عنوان فروشگاه روی فاکتور</Typography>

                  <TextField

                    size="small"

                    fullWidth

                    value={settings.shopTitle}

                    placeholder="نام فروشگاه"

                    onChange={(e) => saveSettings({ shopTitle: e.target.value })}

                  />

                </Box>



                <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>

                  <Typography sx={{ fontSize: 13, mb: 0.5 }}>متن پایین فاکتور</Typography>

                  <TextField

                    size="small"

                    fullWidth

                    value={settings.footerText}

                    onChange={(e) => saveSettings({ footerText: e.target.value })}

                  />

                </Box>



                <FormControlLabel

                  control={

                    <Switch

                      checked={settings.showDate}

                      onChange={(e) => saveSettings({ showDate: e.target.checked })}

                    />

                  }

                  label="نمایش تاریخ و ساعت"

                />

                <FormControlLabel

                  control={

                    <Switch

                      checked={settings.showPurchaseId}

                      onChange={(e) => saveSettings({ showPurchaseId: e.target.checked })}

                    />

                  }

                  label="نمایش شماره فاکتور"

                />

                <FormControlLabel

                  control={

                    <Switch

                      checked={settings.showCustomerPhone}

                      onChange={(e) => saveSettings({ showCustomerPhone: e.target.checked })}

                    />

                  }

                  label="نمایش شماره مشتری"

                />

                <FormControlLabel

                  control={

                    <Switch

                      checked={settings.showPaymentMethod}

                      onChange={(e) => saveSettings({ showPaymentMethod: e.target.checked })}

                    />

                  }

                  label="نمایش روش پرداخت"

                />

                <FormControlLabel

                  control={

                    <Switch

                      checked={settings.showItemUnitPrice}

                      onChange={(e) => saveSettings({ showItemUnitPrice: e.target.checked })}

                    />

                  }

                  label="نمایش قیمت واحد کالا"

                />

                <FormControlLabel

                  control={

                    <Switch

                      checked={settings.compactItems}

                      onChange={(e) => saveSettings({ compactItems: e.target.checked })}

                    />

                  }

                  label="چیدمان فشرده اقلام"

                />

              </SettingsSection>



              <Divider sx={{ gridColumn: "1 / -1" }} />



              <SettingsSection title="رفتار چاپ">

                <FormControlLabel

                  control={

                    <Switch

                      checked={settings.autoPrint}

                      onChange={(e) => saveSettings({ autoPrint: e.target.checked })}

                    />

                  }

                  label="چاپ خودکار هنگام باز شدن"

                />

                <Box sx={{ display: "flex", alignItems: "center" }}>

                  <Button

                    size="small"

                    variant="outlined"

                    startIcon={<RestartAltIcon />}

                    onClick={handleResetSettings}

                  >

                    بازنشانی به پیش‌فرض

                  </Button>

                </Box>

              </SettingsSection>

            </Box>

          )}



          <Box

            sx={{

              bgcolor: "#fff",

              borderRadius: 2,

              p: 2,

              border: "1px dashed #ccc",

              overflowX: "auto",

            }}

          >

            <Typography sx={{ fontSize: 12, color: "#888", mb: 1, textAlign: "center" }}>

              پیش‌نمایش — عرض {paperWidthMm}mm

            </Typography>

            <ReceiptPreview receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />

          </Box>

        </Box>

        </Box>
      )}



      <Box sx={{ display: directPrintMode ? "block" : "none" }} className="print-only">

        <ReceiptPreview receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />

      </Box>

    </>

  );

}



export default function SaleReceiptPrintPage() {

  return (

    <Suspense

      fallback={

        <Box sx={{ p: 3, textAlign: "center" }}>

          <Typography>در حال آماده‌سازی فاکتور...</Typography>

        </Box>

      }

    >

      <SaleReceiptPrintContent />

    </Suspense>

  );

}


