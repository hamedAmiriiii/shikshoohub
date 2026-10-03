"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { toast } from "react-toastify";
import {
  DEFAULT_GOOGLE_SHEET_TABLES,
  fetchShopGoogleSheetStatus,
  saveShopGoogleSheetTables,
  type ShopGoogleSheetTable,
} from "@/app/lib/shopGoogleSheet";

export default function ShopGoogleSheetTablesButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tables, setTables] = useState<ShopGoogleSheetTable[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, ShopGoogleSheetTable[]>();
    tables.forEach((table) => {
      const list = map.get(table.group) ?? [];
      list.push(table);
      map.set(table.group, list);
    });
    return Array.from(map.entries());
  }, [tables]);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    const res = await fetchShopGoogleSheetStatus();
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      setOpen(false);
      return;
    }
    setTables(res.status.tables);
    setSelected(new Set(res.status.selectedTables));
  };

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleGroup = (list: ShopGoogleSheetTable[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      list.forEach((table) => (checked ? next.add(table.name) : next.delete(table.name)));
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      toast.error("حداقل یک جدول را انتخاب کنید");
      return;
    }
    setSaving(true);
    const res = await saveShopGoogleSheetTables(Array.from(selected));
    setSaving(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="انتخاب جداول ارسالی">
        <IconButton size="small" onClick={() => void handleOpen()} sx={{ color: "var(--admin-text-muted)" }}>
          <SettingsIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, fontSize: 15 }}>جداول ارسالی به گوگل شیت</DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={24} sx={{ color: "var(--admin-accent)" }} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
                هر جدول انتخاب‌شده یک تب در شیت می‌شود. تب جداولی که برداشته شوند در ارسال بعدی حذف می‌شوند.
              </Typography>
              {groups.map(([group, list]) => {
                const checkedCount = list.filter((table) => selected.has(table.name)).length;
                return (
                  <Box key={group}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={checkedCount === list.length}
                          indeterminate={checkedCount > 0 && checkedCount < list.length}
                          onChange={(e) => toggleGroup(list, e.target.checked)}
                        />
                      }
                      label={<Typography sx={{ fontSize: 13, fontWeight: 700 }}>{group}</Typography>}
                    />
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        pr: 3,
                      }}
                    >
                      {list.map((table) => (
                        <FormControlLabel
                          key={table.name}
                          control={
                            <Checkbox
                              size="small"
                              checked={selected.has(table.name)}
                              onChange={() => toggle(table.name)}
                            />
                          }
                          label={<Typography sx={{ fontSize: 12 }}>{table.label}</Typography>}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Button
            size="small"
            disabled={loading || saving}
            onClick={() =>
              setSelected(new Set(DEFAULT_GOOGLE_SHEET_TABLES.filter((name) => tables.some((t) => t.name === name))))
            }
          >
            پیش‌فرض
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" onClick={() => setOpen(false)} disabled={saving}>
              انصراف
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => void handleSave()}
              disabled={loading || saving}
              sx={{ bgcolor: "var(--admin-accent)", color: "var(--admin-on-accent)" }}
            >
              {saving ? <CircularProgress size={16} color="inherit" /> : `ذخیره (${selected.size})`}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}
