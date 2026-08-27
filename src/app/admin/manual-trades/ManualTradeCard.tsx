"use client";

import { Box, Chip, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  formatNumber,
  formatTradeDate,
  manualTradeTypeLabel,
  parseAmount,
  shopAccountName,
  type ManualTrade,
} from "@/app/lib/manualTrades";

type ManualTradeCardProps = {
  trade: ManualTrade;
  onEdit: (trade: ManualTrade) => void;
  onDelete: (trade: ManualTrade) => void;
};

export default function ManualTradeCard({ trade, onEdit, onDelete }: ManualTradeCardProps) {
  const amount = parseAmount(trade.amount);
  const isPurchase = trade.type !== "sale";
  const account = shopAccountName(trade);

  return (
    <Box
      sx={{
        backgroundColor: "var(--admin-surface)",
        borderRadius: "15px",
        border: "1px solid var(--admin-border)",
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
          <Chip
            label={manualTradeTypeLabel(trade.type)}
            size="small"
            sx={{
              bgcolor: isPurchase ? "rgba(255, 152, 0, 0.22)" : "rgba(120, 181, 104, 0.22)",
              color: "var(--admin-text)",
              fontWeight: 600,
            }}
          />
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
            {formatTradeDate(trade)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={() => onEdit(trade)}
            title="ویرایش"
            sx={{
              color: "var(--admin-text)",
              bgcolor: "var(--admin-icon-bg)",
              "&:hover": { bgcolor: "var(--admin-icon-bg-hover)" },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(trade)}
            title="حذف"
            sx={{
              color: "#ff4444",
              bgcolor: "rgba(255, 68, 68, 0.15)",
              "&:hover": { bgcolor: "rgba(255, 68, 68, 0.3)" },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 16, mb: 0.5 }}>
        {trade.title || "—"}
      </Typography>

      <Typography
        sx={{
          color: isPurchase ? "#ff9800" : "var(--admin-accent)",
          fontWeight: 700,
          fontSize: 18,
          mb: 1,
        }}
      >
        {isPurchase ? "−" : "+"}
        {formatNumber(amount)} تومان
      </Typography>

      {account ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
          <Box component="span" sx={{ color: "var(--admin-text-secondary)", ml: 0.5 }}>
            حساب:
          </Box>{" "}
          {account}
        </Typography>
      ) : null}

      {trade.description ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, mt: 0.4 }}>
          <Box component="span" sx={{ color: "var(--admin-text-secondary)", ml: 0.5 }}>
            توضیحات:
          </Box>{" "}
          {trade.description}
        </Typography>
      ) : null}
    </Box>
  );
}
