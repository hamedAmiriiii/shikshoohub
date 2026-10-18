"use client";

import {
  Badge,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import {
  useFinanceReminders,
  type FinanceReminderItem,
} from "./FinanceRemindersProvider";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(Math.round(Number(value) || 0));
}

function itemHref(item: FinanceReminderItem): string {
  if (item.kind === "cheque" || item.source_type === "cheque") {
    return "/admin/cheques";
  }
  if (item.source_type === "purchase" || item.purchase_id) {
    const phone = (item.party || "").replace(/\D/g, "");
    if (phone.length >= 10) {
      return `/admin/purchas/customer/${phone}`;
    }
    return "/admin/purchase-debts";
  }
  if (item.source_type === "invoice" || item.invoice_id) {
    return "/admin/invoices";
  }
  if (item.source_type === "expense" || item.expense_id) {
    return "/admin/expenses";
  }
  return "/admin/purchase-debts";
}

function Section({
  title,
  count,
  total,
  emptyText,
  items,
  onPick,
}: {
  title: string;
  count: number;
  total: number;
  emptyText: string;
  items: FinanceReminderItem[];
  onPick: (item: FinanceReminderItem) => void;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.75,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "var(--admin-text)" }}>
          {title}
          {count > 0 ? (
            <Typography component="span" sx={{ mr: 0.75, color: "var(--admin-accent)", fontSize: 13 }}>
              ({count.toLocaleString("fa-IR")})
            </Typography>
          ) : null}
        </Typography>
        {count > 0 ? (
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
            {formatMoney(total)} تومان
          </Typography>
        ) : null}
      </Box>
      {items.length === 0 ? (
        <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", px: 0.5 }}>
          {emptyText}
        </Typography>
      ) : (
        <List dense disablePadding sx={{ bgcolor: "var(--admin-icon-bg)", borderRadius: 2 }}>
          {items.map((item) => (
            <ListItemButton
              key={`${item.kind}-${item.source_type}-${item.id}`}
              onClick={() => onPick(item)}
              sx={{
                borderRadius: 1.5,
                alignItems: "flex-start",
                py: 1,
                "&:hover": { backgroundColor: "var(--admin-menu-hover, rgba(255,255,255,0.06))" },
              }}
            >
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text)" }}>
                    {item.title || item.kind_label || "مورد"}
                    {item.reference ? (
                      <Typography component="span" sx={{ mr: 0.75, fontWeight: 400, color: "var(--admin-text-muted)", fontSize: 12 }}>
                        — {item.reference}
                      </Typography>
                    ) : null}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 0.35, display: "flex", flexDirection: "column", gap: 0.2 }}>
                    <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                      {[item.party, item.due_date_jalali ? `سررسید ${item.due_date_jalali}` : null, item.direction_label]
                        .filter(Boolean)
                        .join(" · ")}
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-accent)" }}>
                      {formatMoney(item.amount)} تومان
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}

export default function FinanceRemindersBell() {
  const router = useRouter();
  const { data, totalCount, open, setOpen, loading } = useFinanceReminders();

  if (!data && !loading && totalCount === 0) {
    // هنوز لود نشده یا دسترسی نیست — زنگوله را فقط وقتی داده داریم یا در حال لودیم نشان بده
  }

  const showBell = Boolean(data) || loading || totalCount > 0;
  if (!showBell && !open) return null;

  const handlePick = (item: FinanceReminderItem) => {
    setOpen(false);
    router.push(itemHref(item));
  };

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="یادآوری چک و نسیه"
        sx={{
          color: "var(--admin-accent)",
          backgroundColor: "var(--admin-icon-bg)",
          padding: { xs: "5px", md: "8px" },
          flexShrink: 0,
          "&:hover": {
            backgroundColor: "var(--admin-icon-bg-hover)",
          },
        }}
      >
        <Badge
          badgeContent={totalCount}
          color="error"
          max={99}
          invisible={totalCount <= 0}
          sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", minWidth: 16, height: 16 } }}
        >
          <NotificationsNoneIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
        </Badge>
      </IconButton>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            color: "var(--admin-text)",
            backgroundImage: "none",
            border: "1px solid var(--admin-border)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            py: 1.5,
            px: 2,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 16 }}>یادآوری وصول و پرداخت</Typography>
          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            sx={{ color: "var(--admin-text-muted)" }}
            aria-label="بستن"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: "var(--admin-border)" }} />
        <DialogContent sx={{ px: 2, py: 2 }}>
          {loading && !data ? (
            <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>در حال بارگذاری…</Typography>
          ) : (
            <>
              <Section
                title="چک‌های ۵ روز آینده"
                count={data?.cheques?.count || 0}
                total={data?.cheques?.total || 0}
                emptyText="چکی با سررسید ۵ روز آینده نیست."
                items={data?.cheques?.items || []}
                onPick={handlePick}
              />
              <Section
                title="نسیه دریافتی"
                count={data?.credit_receivable?.count || 0}
                total={data?.credit_receivable?.total || 0}
                emptyText="نسیه دریافتی باز نیست."
                items={data?.credit_receivable?.items || []}
                onPick={handlePick}
              />
              <Section
                title="نسیه پرداختنی"
                count={data?.credit_payable?.count || 0}
                total={data?.credit_payable?.total || 0}
                emptyText="نسیه پرداختنی باز نیست."
                items={data?.credit_payable?.items || []}
                onPick={handlePick}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
