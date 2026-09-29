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
  InputAdornment,
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
import SearchIcon from "@mui/icons-material/Search";
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

const KIND_COLOR: Record<string, string> = {
  asset: "#1e88e5",
  liability: "#fb8c00",
  equity: "#8e24aa",
  revenue: "#43a047",
  cogs: "#6d4c41",
  expense: "#e53935",
};

const DEFAULT_TREE_COLOR = "#607d8b";

const LEVEL_ROW: Record<string, { stripe: number; alpha: string; bg: "tint" | "surface" | "alt"; fontSize: number; weight: number }> = {
  group: { stripe: 5, alpha: "", bg: "tint", fontSize: 14, weight: 800 },
  kol: { stripe: 4, alpha: "", bg: "surface", fontSize: 13.5, weight: 700 },
  moein: { stripe: 3, alpha: "b3", bg: "surface", fontSize: 13, weight: 600 },
  tafsili: { stripe: 2, alpha: "80", bg: "alt", fontSize: 12.5, weight: 500 },
};

function linkedLabel(account: AccountingAccount): string | null {
  if (account.linked_type === "shop_account") return "حساب نقد فروشگاه";
  if (account.linked_type === "till") return "صندوق فروش";
  return null;
}

function normalizeAccountSearch(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .trim()
    .toLowerCase();
}

function accountMatches(account: AccountingAccount, query: string): boolean {
  return account.code.toLowerCase().includes(query) || account.name.toLowerCase().includes(query);
}

function filterAccountTree(nodes: AccountingAccount[], query: string): AccountingAccount[] {
  if (!query) return nodes;
  return nodes.flatMap((node) => {
    const matched = accountMatches(node, query);
    const children = filterAccountTree(node.children, query);
    if (!matched && children.length === 0) return [];
    return [{ ...node, children: matched ? node.children : children }];
  });
}

function AccountNode({
  account,
  depth,
  parentColor,
  forceOpen,
  onCreate,
  onEdit,
}: {
  account: AccountingAccount;
  depth: number;
  parentColor?: string;
  forceOpen: boolean;
  onCreate: (parent: AccountingAccount, level: "moein" | "tafsili") => void;
  onEdit: (account: AccountingAccount) => void;
}) {
  const hasChildren = account.children.length > 0;
  const [open, setOpen] = useState(forceOpen);

  useEffect(() => {
    setOpen(forceOpen && hasChildren);
  }, [forceOpen, hasChildren]);
  const linked = linkedLabel(account);
  const canCreateMoein = account.level === "kol";
  const canCreateTafsili = account.level === "moein";
  const color = KIND_COLOR[account.kind] ?? parentColor ?? DEFAULT_TREE_COLOR;
  const style = LEVEL_ROW[account.level] ?? LEVEL_ROW.tafsili;
  const rowBg =
    style.bg === "tint" ? `${color}1f` : style.bg === "surface" ? "var(--admin-surface)" : "var(--admin-surface-alt)";

  return (
    <Box sx={{ opacity: account.is_active ? 1 : 0.55 }}>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          py: account.level === "group" ? 1 : 0.6,
          px: 1,
          borderRadius: "8px",
          bgcolor: rowBg,
          border: `1px solid ${account.level === "group" ? `${color}66` : "var(--admin-border)"}`,
          borderInlineStart: `${style.stripe}px solid ${color}${style.alpha}`,
          mb: 0.5,
          transition: "background-color .15s",
          "&:hover": { bgcolor: `${color}14` },
          ...(depth > 0
            ? {
                "&::before": {
                  content: '""',
                  position: "absolute",
                  insetInlineStart: -14,
                  top: "50%",
                  width: 14,
                  borderTop: `2px solid ${color}59`,
                },
              }
            : {}),
        }}
      >
        <IconButton
          size="small"
          onClick={() => hasChildren && setOpen((v) => !v)}
          disabled={!hasChildren}
          sx={{ color, visibility: hasChildren ? "visible" : "hidden", p: 0.25 }}
        >
          {open ? <ExpandMoreIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography
              sx={{
                color,
                fontWeight: 700,
                fontSize: style.fontSize - 0.5,
                fontFamily: "monospace",
                bgcolor: `${color}14`,
                px: 0.75,
                borderRadius: "6px",
                direction: "ltr",
              }}
            >
              {account.code}
            </Typography>
            <Typography sx={{ color: "var(--admin-text)", fontWeight: style.weight, fontSize: style.fontSize }}>
              {account.name}
            </Typography>
            {hasChildren ? (
              <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                ({new Intl.NumberFormat("fa-IR").format(account.children.length)})
              </Typography>
            ) : null}
            {account.is_system ? (
              <LockOutlinedIcon sx={{ fontSize: 14, color: "var(--admin-text-muted)" }} />
            ) : null}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.4, flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={account.level_label || account.level}
              sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: `${color}24`, color }}
            />
            <Chip
              size="small"
              label={account.nature_label || account.nature}
              sx={{ height: 20, fontSize: 10, bgcolor: "var(--admin-icon-bg)", color: "var(--admin-text-muted)" }}
            />
            {depth === 0 && KIND_LABEL[account.kind] ? (
              <Chip
                size="small"
                label={KIND_LABEL[account.kind]}
                sx={{ height: 20, fontSize: 10, bgcolor: color, color: "#fff" }}
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
          <Box
            sx={{
              marginInlineStart: "20px",
              paddingInlineStart: "14px",
              borderInlineStart: `2px solid ${color}59`,
              mb: 0.75,
            }}
          >
            {account.children.map((child) => (
              <AccountNode
                key={child.id}
                account={child}
                depth={depth + 1}
                parentColor={color}
                forceOpen={forceOpen}
                onCreate={onCreate}
                onEdit={onEdit}
              />
            ))}
          </Box>
        </Collapse>
      ) : null}
    </Box>
  );
}

export default function AccountingAccountsPage() {
  const [tree, setTree] = useState<AccountingAccount[]>([]);
  const [search, setSearch] = useState("");
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

  const query = normalizeAccountSearch(search);
  const visibleTree = useMemo(() => filterAccountTree(tree, query), [tree, query]);
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
      <TextField
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="جستجوی کد یا نام حساب"
        sx={{ ...accountingFieldSx, mb: 1.5 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "var(--admin-text-muted)", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : empty ? (
        <Alert severity="warning">درختی برنگشت. اگر جدول حسابداری روی دیتابیس نیست، پیام سرور را در اعلان ببینید.</Alert>
      ) : (
        visibleTree.length === 0 ? (
          <Alert severity="info">حسابی با این کد یا نام پیدا نشد.</Alert>
        ) : (
        <Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
            {Object.entries(KIND_LABEL).map(([kind, label]) => (
              <Box key={kind} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: KIND_COLOR[kind] }} />
                <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{label}</Typography>
              </Box>
            ))}
          </Box>
          {visibleTree.map((node) => (
            <AccountNode
              key={node.id}
              account={node}
              depth={0}
              forceOpen={query.length > 0}
              onCreate={openCreate}
              onEdit={openEdit}
            />
          ))}
        </Box>
        )
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
