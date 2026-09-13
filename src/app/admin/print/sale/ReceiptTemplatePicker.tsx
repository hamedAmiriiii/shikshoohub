"use client";

import { Box, Typography } from "@mui/material";
import { HallReceiptTicket } from "@/app/admin/print/sale/SaleReceiptTickets";
import {
  RECEIPT_TEMPLATES,
  SAMPLE_RECEIPT_FOR_PREVIEW,
  normalizeReceiptTemplateId,
  previewSettingsForTemplate,
  type ReceiptTemplateId,
} from "@/app/lib/receiptTemplates";
import type { SaleReceiptPrintSettings } from "@/app/lib/saleReceiptPrint";

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
          پیش‌نمایش را ببینید و مدل را انتخاب کنید — پیش‌فرض همان مدل فعلی است
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
                  maxHeight: compact ? 140 : 180,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
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
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
