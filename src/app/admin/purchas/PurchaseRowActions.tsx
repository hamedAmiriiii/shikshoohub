"use client";

import { Box, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import { useRouter } from "next/navigation";
import { canReplacePurchase, navigateToPurchaseEdit } from "@/app/lib/purchaseEdit";
import { purchaseToSaleReceipt } from "@/app/lib/purchaseReceiptPrint";
import { openListReceiptPrintPage, readListReceiptPrintSettings } from "@/app/lib/saleReceiptPrint";

const iconBtnSx = {
  width: 28,
  height: 28,
  p: 0.35,
  border: "1px solid var(--admin-border)",
  borderRadius: "8px",
  bgcolor: "var(--admin-surface)",
  "& .MuiSvgIcon-root": { fontSize: 16 },
} as const;

type PurchaseRowActionsProps = {
  item: any;
  onOpenDetails: (item: any) => void;
};

export function PurchaseRowActions({ item, onOpenDetails }: PurchaseRowActionsProps) {
  const router = useRouter();
  const editGate = canReplacePurchase(item);

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const receipt = purchaseToSaleReceipt(item);
    const direct = readListReceiptPrintSettings().autoPrint;
    openListReceiptPrintPage(
      direct ? "/admin/print/sale?list=1&direct=1" : "/admin/print/sale?list=1",
      receipt,
    );
  };

  return (
    <Box sx={{ display: "flex", gap: 0.35, justifyContent: "center", flexShrink: 0 }}>
      <Tooltip title={editGate.ok ? "ویرایش سفارش در سبد" : editGate.reason || "ویرایش"} arrow placement="top">
        <span>
          <IconButton
            size="small"
            disabled={!editGate.ok}
            aria-label="ویرایش"
            onClick={(e) => {
              e.stopPropagation();
              if (!editGate.ok) return;
              navigateToPurchaseEdit(router, item);
            }}
            sx={{
              ...iconBtnSx,
              color: editGate.ok ? "#ef6c00" : "var(--admin-text-muted)",
            }}
          >
            <EditIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="جزئیات" arrow placement="top">
        <IconButton
          size="small"
          aria-label="جزئیات"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(item);
          }}
          sx={{
            ...iconBtnSx,
            color: "var(--admin-accent)",
          }}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="چاپ فیش" arrow placement="top">
        <IconButton
          size="small"
          aria-label="چاپ فیش"
          onClick={handlePrint}
          sx={{
            ...iconBtnSx,
            color: "var(--admin-text)",
          }}
        >
          <PrintIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
