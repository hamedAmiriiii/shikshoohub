"use client";

import { Box, Typography } from "@mui/material";
import { HallReceiptTicket } from "@/app/admin/print/sale/SaleReceiptTickets";
import {
  RECEIPT_TEMPLATES,
  SAMPLE_RECEIPT_FOR_PREVIEW,
  isFormalReceiptTemplate,
  normalizeReceiptTemplateId,
  previewSettingsForTemplate,
  type ReceiptTemplateId,
} from "@/app/lib/receiptTemplates";
import type { SaleReceiptPrintSettings } from "@/app/lib/saleReceiptPrint";
import { tomanToRial } from "@/app/lib/formalInvoice";

function FormalReceiptPreview({ landscape }: { landscape: boolean }) {
  const sample = SAMPLE_RECEIPT_FOR_PREVIEW;
  const lines = sample.items.slice(0, 3);
  return (
    <Box
      sx={{
        width: landscape ? 176 : 124,
        height: landscape ? 118 : 168,
        bgcolor: "#fff",
        color: "#111",
        border: "1px solid #111",
        direction: "rtl",
        overflow: "hidden",
        p: 0.4,
        fontSize: 5.5,
        lineHeight: 1.35,
        fontFamily: "Tahoma, Arial, sans-serif",
      }}
    >
      <Box sx={{ textAlign: "center", fontWeight: 900, fontSize: 8, mb: 0.25 }}>فاکتور فروش</Box>
      <Box sx={{ display: "flex", gap: 0.25, mb: 0.25 }}>
        <Box sx={{ flex: 1, border: "1px solid #111", p: 0.25 }}>
          <Box sx={{ fontWeight: 800, bgcolor: "#d9d9d9", textAlign: "center" }}>فروشنده</Box>
          <div>{sample.shopName}</div>
        </Box>
        <Box sx={{ flex: 1, border: "1px solid #111", p: 0.25 }}>
          <Box sx={{ fontWeight: 800, bgcolor: "#d9d9d9", textAlign: "center" }}>خریدار</Box>
          <div>{sample.customerName || "—"}</div>
        </Box>
      </Box>
      <Box sx={{ bgcolor: "#d9d9d9", border: "1px solid #111", textAlign: "center", fontWeight: 800 }}>
        کالا و خدمات (ریال)
      </Box>
      {lines.map((item) => (
        <Box
          key={item.name}
          sx={{ display: "flex", justifyContent: "space-between", border: "1px solid #111", borderTop: 0, px: 0.25 }}
        >
          <span>{item.name}</span>
          <span>{new Intl.NumberFormat("fa-IR").format(tomanToRial(item.lineTotal))}</span>
        </Box>
      ))}
      <Box sx={{ display: "flex", border: "1px solid #111", borderTop: 0, mt: 0.25, minHeight: 18 }}>
        <Box sx={{ flex: 1, borderLeft: "1px solid #111", textAlign: "center", p: 0.25 }}>مهر فروشنده</Box>
        <Box sx={{ flex: 1, textAlign: "center", p: 0.25 }}>مهر خریدار</Box>
      </Box>
    </Box>
  );
}

export function ReceiptTemplatePicker({
  settings,
  onSelect,
  compact = false,
}: {
  settings: SaleReceiptPrintSettings;
  onSelect: (templateId: ReceiptTemplateId) => void;
  compact?: boolean;
}) {
  const selected = normalizeReceiptTemplateId(settings.templateId);
  const previewWidth = compact ? 58 : 72;

  return (
    <Box sx={{ gridColumn: "1 / -1", display: "grid", gap: 1 }}>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>مدل فاکتور</Typography>
        <Typography sx={{ fontSize: 11, color: "var(--admin-text-secondary)" }}>
          انتخاب شما ذخیره می‌شود و تا وقتی عوضش نکنید روی همه چاپ‌ها اعمال می‌شود
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: compact
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 1,
        }}
      >
        {RECEIPT_TEMPLATES.map((template) => {
          const active = selected === template.id;
          const previewSettings = previewSettingsForTemplate(template.id, {
            shopTitle: settings.shopTitle,
            shopAddress: settings.shopAddress,
            shopPhone: settings.shopPhone,
            footerText: settings.footerText,
            cashierLabel: settings.cashierLabel,
          });
          return (
            <Box
              key={template.id}
              component="button"
              type="button"
              onClick={() => onSelect(template.id)}
              sx={{
                all: "unset",
                cursor: "pointer",
                display: "block",
                borderRadius: 1.5,
                border: active ? "2px solid var(--admin-accent)" : "1px solid var(--admin-border)",
                bgcolor: "var(--admin-surface-alt, var(--admin-surface))",
                overflow: "hidden",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                boxShadow: active ? "0 0 0 1px var(--admin-accent)" : "none",
                "&:hover": { borderColor: "var(--admin-accent)" },
              }}
            >
              <Box sx={{ px: 1, pt: 1, pb: 0.5 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: "var(--admin-text)" }}>
                  {template.title}
                  {template.id === "classic" ? " (فعلی)" : ""}
                </Typography>
                <Typography sx={{ fontSize: 10, color: "var(--admin-text-secondary)", mb: 0.75 }}>
                  {template.hint}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: "#e8e8e8",
                  px: 1,
                  py: 1,
                  display: "flex",
                  justifyContent: "center",
                  maxHeight: compact ? 140 : 200,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                {isFormalReceiptTemplate(template.id) ? (
                  <Box sx={{ transform: compact ? "scale(0.72)" : "scale(0.92)", transformOrigin: "top center" }}>
                    <FormalReceiptPreview landscape={template.id === "formal-a5-land"} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      transform: compact ? "scale(0.55)" : "scale(0.62)",
                      transformOrigin: "top center",
                      width: `${previewWidth}mm`,
                    }}
                  >
                    <HallReceiptTicket
                      receipt={SAMPLE_RECEIPT_FOR_PREVIEW}
                      settings={previewSettings}
                      paperWidthMm={previewWidth}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
