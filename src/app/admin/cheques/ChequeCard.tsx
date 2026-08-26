"use client";

import {
  Box,
  Button,
  Chip,
  IconButton,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import UndoIcon from "@mui/icons-material/Undo";
import {
  chequeStatusLabel,
  chequeTypeLabel,
  formatNumber,
  isChequeCleared,
  isChequePending,
  parseAmount,
  type Cheque,
} from "@/app/lib/cheques";

type ChequeCardProps = {
  cheque: Cheque;
  onEdit: (cheque: Cheque) => void;
  onDelete: (cheque: Cheque) => void;
  onClear: (cheque: Cheque) => void;
  onUnclear: (cheque: Cheque) => void;
};

export default function ChequeCard({
  cheque,
  onEdit,
  onDelete,
  onClear,
  onUnclear,
}: ChequeCardProps) {
  const pending = isChequePending(cheque);
  const cleared = isChequeCleared(cheque);
  const amount = parseAmount(cheque.amount);
  const isIssued = cheque.type === "issued";

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
            label={chequeTypeLabel(cheque.type)}
            size="small"
            sx={{
              bgcolor: isIssued ? "rgba(33, 150, 243, 0.2)" : "rgba(120, 181, 104, 0.2)",
              color: "var(--admin-text)",
              fontWeight: 600,
            }}
          />
          <Chip
            label={chequeStatusLabel(cheque.status)}
            size="small"
            sx={{
              bgcolor: cleared ? "rgba(5, 150, 105, 0.25)" : "rgba(255, 152, 0, 0.25)",
              color: "var(--admin-text)",
              fontWeight: 600,
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          {pending ? (
            <>
              <IconButton
                size="small"
                onClick={() => onClear(cheque)}
                title="وصول"
                sx={{
                  color: "var(--admin-accent)",
                  bgcolor: "rgba(120, 181, 104, 0.15)",
                  "&:hover": { bgcolor: "rgba(120, 181, 104, 0.3)" },
                }}
              >
                <DoneAllIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onEdit(cheque)}
                title="ویرایش"
                sx={{
                  color: "var(--admin-text)",
                  bgcolor: "var(--admin-icon-bg)",
                  "&:hover": { bgcolor: "var(--admin-icon-bg-hover)" },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </>
          ) : null}
          {cleared ? (
            <IconButton
              size="small"
              onClick={() => onUnclear(cheque)}
              title="برگشت وصول"
              sx={{
                color: "#ff9800",
                bgcolor: "rgba(255, 152, 0, 0.15)",
                "&:hover": { bgcolor: "rgba(255, 152, 0, 0.3)" },
              }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          ) : null}
          {!cleared ? (
            <IconButton
              size="small"
              onClick={() => onDelete(cheque)}
              title="حذف"
              sx={{
                color: "#ff4444",
                bgcolor: "rgba(255, 68, 68, 0.15)",
                "&:hover": { bgcolor: "rgba(255, 68, 68, 0.3)" },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
      </Box>

      <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 16, mb: 0.5 }}>
        چک {cheque.cheque_number || "—"}
        {cheque.title ? ` — ${cheque.title}` : ""}
      </Typography>

      <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 18, mb: 1 }}>
        {formatNumber(amount)} تومان
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4, flex: 1 }}>
        <Row label="بانک" value={cheque.bank_name} />
        <Row label={isIssued ? "در وجه" : "پرداخت‌کننده"} value={cheque.payee} />
        <Row label="تاریخ صدور" value={cheque.issue_date_jalali || cheque.issue_date} />
        <Row label="سررسید" value={cheque.due_date_jalali || cheque.due_date} />
        {cleared ? (
          <Row label="تاریخ وصول" value={cheque.clear_date_jalali || cheque.clear_date} />
        ) : null}
        {cheque.note ? <Row label="یادداشت" value={cheque.note} /> : null}
      </Box>

      {pending ? (
        <Button
          fullWidth
          variant="contained"
          startIcon={<DoneAllIcon />}
          onClick={() => onClear(cheque)}
          sx={{
            mt: 1.5,
            borderRadius: "10px",
            bgcolor: "var(--admin-accent)",
            color: "#fff",
            gap: "8px",
            "& .MuiButton-startIcon": { m: 0 },
            "&:hover": { bgcolor: "var(--admin-accent-hover)" },
          }}
        >
          وصول چک
        </Button>
      ) : null}

      {cleared ? (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<UndoIcon />}
          onClick={() => onUnclear(cheque)}
          sx={{
            mt: 1.5,
            borderRadius: "10px",
            borderColor: "#ff9800",
            color: "#ff9800",
            gap: "8px",
            "& .MuiButton-startIcon": { m: 0 },
            "&:hover": {
              borderColor: "#f57c00",
              bgcolor: "rgba(255, 152, 0, 0.08)",
            },
          }}
        >
          برگشت وصول
        </Button>
      ) : null}
    </Box>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
      <Box component="span" sx={{ color: "var(--admin-text-secondary)", ml: 0.5 }}>
        {label}:
      </Box>{" "}
      {value}
    </Typography>
  );
}
