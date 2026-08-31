"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import {
  createAccountingAccount,
  fetchAccountingAccounts,
  updateAccountingAccount,
  type AccountingAccount,
} from "@/app/lib/accounting";
import {
  AccountingPageShell,
  accountingButtonSx,
  accountingFieldSx,
} from "@/app/admin/accounting/ui";

const KIND_LABEL: Record<string, string> = {
  asset: "دارایی",
  liability: "بدهی",
  equity: "سرمایه",
  revenue: "درآمد",
  cogs: "بهای تمام‌شده",
  expense: "هزینه",
};

function linkedLabel(account: AccountingAccount): string | null {
  if (account.linked_type === "shop_account") return "حساب نقد فروشگاه";
  if (account.linked_type === "till") return "صندوق فروش";
  return null;
}

function AccountNode({
  account,
  depth,
  onCreate,
  onEdit,
}: {
  account: AccountingAccount;
  depth: number;
  onCreate: (parent: AccountingAccount, level: "moein" | "tafsili") => void;
  onEdit: (account: AccountingAccount) => void;
}) {
  const hasChildren = account.children.length > 0;
  const [open, setOpen] = useState(depth < 2);
  const linked = linkedLabel(account);
  const canCreateMoein = account.level === "kol";
  const canCreateTafsili = account.level === "moein";

  return (
    <Box sx={{ opacity: account.is_active ? 1 : 0.55 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          py: 0.75,
          px: 1,
          mr: depth * 1.5,
          borderRadius: "8px",
          bgcolor: depth === 0 ? "var(--admin-surface)" : "transparent",
          border: "1px solid var(--admin-border)",
          mb: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={() => hasChildren && setOpen((v) => !v)}
          disabled={!hasChildren}
          sx={{ color: "var(--admin-text-muted)", visibility: hasChildren ? "visible" : "hidden" }}
        >
          {open ? <ExpandMoreIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>
              {account.code}
            </Typography>
            <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, fontSize: 13 }}>
              {account.name}
            </Typography>
            {account.is_system ? (
              <LockOutlinedIcon sx={{ fontSize: 14, color: "var(--admin-text-muted)" }} />
            ) : null}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.4, flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={account.level_label || account.level}
              sx={{ height: 20, fontSize: 10, bgcolor: "var(--admin-icon-bg)", color: "var(--admin-text-muted)" }}
            />
            <Chip
              size="small"
              label={account.nature_label || account.nature}
              sx={{ height: 20, fontSize: 10, bgcolor: "var(--admin-icon-bg)", color: "var(--admin-text-muted)" }}
            />
            {KIND_LABEL[account.kind] ? (
              <Chip
                size="small"
                label={KIND_LABEL[account.kind]}
                sx={{ height: 20, fontSize: 10, bgcolor: "var(--admin-icon-bg)", color: "var(--admin-text-muted)" }}
              />
            ) : null}
            {linked ? (
              <Chip
                size="small"
                label={linked}
                sx={{
                  height: 20,
                  fontSize: 10,
                  bgcolor: "var(--admin-info-bg)",
                  color: "var(--admin-info-icon)",
                  border: "1px solid var(--admin-info-border)",
                }}
              />
            ) : null}
            {!account.is_active ? (
              <Chip size="small" label="غیرفعال" sx={{ height: 20, fontSize: 10 }} />
            ) : null}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          {canCreateMoein ? (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onCreate(account, "moein")}
              sx={{ fontSize: 11, color: "var(--admin-accent)" }}
            >
              معین
            </Button>
          ) : null}
          {canCreateTafsili ? (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onCreate(account, "tafsili")}
              sx={{ fontSize: 11, color: "var(--admin-accent)" }}
            >
              تفصیلی
            </Button>
          ) : null}
          {!account.is_system ? (
            <IconButton size="small" onClick={() => onEdit(account)} sx={{ color: "var(--admin-text-muted)" }}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
      </Box>
      {hasChildren ? (
        <Collapse in={open} unmountOnExit>
          {account.children.map((child) => (
            <AccountNode
              key={child.id}
              account={child}
              depth={depth + 1}
              onCreate={onCreate}
              onEdit={onEdit}
            />
          ))}
        </Collapse>
      ) : null}
    </Box>
  );
}

export default function AccountingAccountsPage() {
  const [tree, setTree] = useState<AccountingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [createParent, setCreateParent] = useState<AccountingAccount | null>(null);
  const [createLevel, setCreateLevel] = useState<"moein" | "tafsili">("moein");
  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AccountingAccount | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAccountingAccounts({ includeInactive });
      setTree(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت درخت حساب");
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = (parent: AccountingAccount, level: "moein" | "tafsili") => {
    setCreateParent(parent);
    setCreateLevel(level);
    setCreateCode("");
    setCreateName("");
  };

  const openEdit = (account: AccountingAccount) => {
    setEditing(account);
    setEditName(account.name);
    setEditActive(account.is_active);
  };

  const handleCreate = async () => {
    if (!createParent) return;
    const code = createCode.trim();
    const name = createName.trim();
    if (!code || !name) {
      toast.error("کد و نام حساب را وارد کنید");
      return;
    }
    setSaving(true);
    try {
      await createAccountingAccount({
        parent_id: createParent.id,
        code,
        name,
        level: createLevel,
      });
      toast.success("حساب ایجاد شد.");
      setCreateParent(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ایجاد حساب");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name) {
      toast.error("نام حساب را وارد کنید");
      return;
    }
    setSaving(true);
    try {
      await updateAccountingAccount(editing.id, { name, is_active: editActive });
      toast.success("حساب به‌روز شد.");
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ویرایش حساب");
    } finally {
      setSaving(false);
    }
  };

  const createLevelLabel = createLevel === "moein" ? "معین" : "تفصیلی";

  const empty = useMemo(() => !loading && tree.length === 0, [loading, tree.length]);

  return (
    <AccountingPageShell
      title="درخت حساب"
      subtitle="حساب‌های سیستمی قفل‌اند. معین زیر کل و تفصیلی زیر معین ساخته می‌شود."
      actions={
        <>
          <FormControlLabel
            control={
              <Switch
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" } }}
              />
            }
            label={<Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>نمایش غیرفعال</Typography>}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={loading}
            sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
          >
            بروزرسانی
          </Button>
        </>
      }
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : empty ? (
        <Alert severity="warning">درختی برنگشت. اگر جدول حسابداری روی دیتابیس نیست، پیام سرور را در اعلان ببینید.</Alert>
      ) : (
        <Box>
          {tree.map((node) => (
            <AccountNode
              key={node.id}
              account={node}
              depth={0}
              onCreate={openCreate}
              onEdit={openEdit}
            />
          ))}
        </Box>
      )}

      <Dialog open={!!createParent} onClose={() => setCreateParent(null)} fullWidth maxWidth="xs">
        <DialogTitle>حساب {createLevelLabel} جدید</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 2 }}>
            والد: {createParent?.code} — {createParent?.name}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="کد"
            value={createCode}
            onChange={(e) => setCreateCode(e.target.value)}
            sx={{ ...accountingFieldSx, mb: 1.5, mt: 0.5 }}
          />
          <TextField
            fullWidth
            label="نام"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            sx={accountingFieldSx}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateParent(null)}>انصراف</Button>
          <Button onClick={handleCreate} disabled={saving} sx={accountingButtonSx}>
            {saving ? "در حال ذخیره…" : "ایجاد"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>ویرایش حساب</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 2 }}>
            کد {editing?.code} قابل تغییر نیست.
          </Typography>
          <TextField
            fullWidth
            label="نام"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ ...accountingFieldSx, mb: 1, mt: 0.5 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
            }
            label="فعال"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>انصراف</Button>
          <Button onClick={handleEdit} disabled={saving} sx={accountingButtonSx}>
            {saving ? "در حال ذخیره…" : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>
    </AccountingPageShell>
  );
}
