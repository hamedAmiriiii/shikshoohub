"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import {
  fetchAccountingAccounts,
  fetchAccountingPostingMaps,
  updateAccountingPostingMap,
  type AccountingAccount,
  type AccountingPostingMapRow,
} from "@/app/lib/accounting";
import {
  AccountingPageShell,
  accountingButtonSx,
  accountingFieldSx,
} from "@/app/admin/accounting/ui";

type FlatAccount = {
  id: number;
  code: string;
  name: string;
  level: string;
  label: string;
};

function flattenAccounts(nodes: AccountingAccount[], out: FlatAccount[] = []): FlatAccount[] {
  for (const node of nodes) {
    if (node.level === "moein" || node.level === "tafsili") {
      out.push({
        id: node.id,
        code: node.code,
        name: node.name,
        level: node.level,
        label: `${node.code} — ${node.name}`,
      });
    }
    if (node.children?.length) flattenAccounts(node.children, out);
  }
  return out;
}

export default function AccountingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [tableReady, setTableReady] = useState(true);
  const [rows, setRows] = useState<AccountingPostingMapRow[]>([]);
  const [accounts, setAccounts] = useState<FlatAccount[]>([]);
  const [search, setSearch] = useState("");
  const [groupTab, setGroupTab] = useState("all");
  const [editRow, setEditRow] = useState<AccountingPostingMapRow | null>(null);
  const [picked, setPicked] = useState<FlatAccount | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [maps, tree] = await Promise.all([
        fetchAccountingPostingMaps(),
        fetchAccountingAccounts({ includeInactive: false }),
      ]);
      setTableReady(maps.table_ready);
      setRows(maps.data);
      setAccounts(flattenAccounts(tree));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در بارگذاری تنظیمات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (!map.has(row.group)) map.set(row.group, row.group_label || row.group);
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (groupTab !== "all" && row.group !== groupTab) return false;
      if (!q) return true;
      const hay = [
        row.label,
        row.description,
        row.default_code,
        row.event_key,
        row.account?.code,
        row.account?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, groupTab]);

  const openEdit = (row: AccountingPostingMapRow) => {
    setEditRow(row);
    setPicked(accounts.find((a) => a.id === row.account_id) ?? null);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    if (!picked) {
      toast.error("حساب را انتخاب کنید");
      return;
    }
    setSavingKey(editRow.event_key);
    try {
      const updated = await updateAccountingPostingMap(editRow.event_key, picked.id);
      setRows((prev) => prev.map((r) => (r.event_key === updated.event_key ? updated : r)));
      toast.success("ذخیره شد");
      setEditRow(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ذخیره");
    } finally {
      setSavingKey(null);
    }
  };

  const resetDefault = async (row: AccountingPostingMapRow) => {
    setSavingKey(row.event_key);
    try {
      const updated = await updateAccountingPostingMap(row.event_key, null);
      setRows((prev) => prev.map((r) => (r.event_key === updated.event_key ? updated : r)));
      toast.success("به پیش‌فرض برگشت");
      if (editRow?.event_key === row.event_key) setEditRow(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در بازگشت به پیش‌فرض");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <AccountingPageShell
      title="تنظیمات حسابداری"
      subtitle="هر تراکنش نرم‌افزار به کدام حساب درخت وصل است. حسابدار می‌تواند اتصال را عوض کند."
      actions={
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={load}
          disabled={loading}
          sx={{ ...accountingButtonSx, bgcolor: "transparent", color: "var(--admin-accent)", borderColor: "var(--admin-accent)" }}
        >
          بروزرسانی
        </Button>
      }
    >
      {!tableReady && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          جدول نگاشت هنوز ساخته نشده. فایل{" "}
          <code>atelier/database/sql/create_accounting_posting_maps_manual.sql</code> را یک‌بار اجرا کنید.
        </Alert>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="جستجو در نقش‌ها یا کد حساب…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...accountingFieldSx, minWidth: 260, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "var(--admin-text-muted)", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Tabs
        value={groupTab}
        onChange={(_, v) => setGroupTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          minHeight: 36,
          "& .MuiTab-root": { minHeight: 36, fontSize: 12, color: "var(--admin-text-muted)" },
          "& .Mui-selected": { color: "var(--admin-accent) !important" },
          "& .MuiTabs-indicator": { bgcolor: "var(--admin-accent)" },
        }}
      >
        <Tab value="all" label="همه" />
        {groups.map((g) => (
          <Tab key={g.id} value={g.id} label={g.label} />
        ))}
      </Tabs>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {filtered.map((row) => (
            <Box
              key={row.event_key}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.5,
                py: 1.25,
                borderBottom: "1px solid var(--admin-border)",
                bgcolor: "var(--admin-surface)",
              }}
            >
              <Box sx={{ minWidth: 200, flex: 1 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 650, color: "var(--admin-text)" }}>
                  {row.label}
                </Typography>
                {row.description ? (
                  <Typography sx={{ fontSize: 11.5, color: "var(--admin-text-muted)", mt: 0.25 }}>
                    {row.description}
                  </Typography>
                ) : null}
                <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mt: 0.35, direction: "ltr" }}>
                  {row.event_key} · پیش‌فرض {row.default_code}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                {row.account ? (
                  <Chip
                    size="small"
                    label={`${row.account.code} — ${row.account.name}`}
                    sx={{
                      bgcolor: row.is_custom ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                      color: row.is_custom ? "var(--admin-on-accent)" : "var(--admin-text)",
                      fontSize: 12,
                      maxWidth: 320,
                    }}
                  />
                ) : (
                  <Chip size="small" label="حساب یافت نشد" color="warning" />
                )}
                {row.is_custom ? (
                  <Chip size="small" label="ویرایش‌شده" variant="outlined" sx={{ fontSize: 11 }} />
                ) : null}
                <IconButton
                  size="small"
                  onClick={() => openEdit(row)}
                  disabled={!tableReady || savingKey === row.event_key}
                  title="ویرایش"
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                {row.is_custom ? (
                  <IconButton
                    size="small"
                    onClick={() => resetDefault(row)}
                    disabled={!tableReady || savingKey === row.event_key}
                    title="بازگشت به پیش‌فرض"
                  >
                    {savingKey === row.event_key ? (
                      <CircularProgress size={16} />
                    ) : (
                      <RestartAltIcon fontSize="small" />
                    )}
                  </IconButton>
                ) : null}
              </Box>
            </Box>
          ))}
          {filtered.length === 0 ? (
            <Alert severity="info">موردی با این فیلتر پیدا نشد.</Alert>
          ) : null}
        </Box>
      )}

      <Dialog open={!!editRow} onClose={() => setEditRow(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontSize: 16 }}>تغییر حساب — {editRow?.label}</DialogTitle>
        <DialogContent>
          {editRow?.description ? (
            <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>{editRow.description}</Typography>
          ) : null}
          <Autocomplete
            options={accounts}
            value={picked}
            onChange={(_, v) => setPicked(v)}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} label="حساب معین / تفصیلی" sx={accountingFieldSx} />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {editRow?.is_custom ? (
            <Button
              onClick={() => editRow && resetDefault(editRow)}
              disabled={savingKey === editRow.event_key}
              startIcon={<RestartAltIcon />}
            >
              پیش‌فرض
            </Button>
          ) : null}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setEditRow(null)}>انصراف</Button>
          <Button
            variant="contained"
            onClick={saveEdit}
            disabled={!picked || savingKey === editRow?.event_key}
            sx={accountingButtonSx}
          >
            {savingKey === editRow?.event_key ? <CircularProgress size={18} color="inherit" /> : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>
    </AccountingPageShell>
  );
}
