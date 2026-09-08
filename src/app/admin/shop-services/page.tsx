"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EventIcon from "@mui/icons-material/Event";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  extractShopServices,
  extractTableServiceRequests,
  shopServiceEmoji,
  SHOP_SERVICE_ICONS,
  SUGGESTED_SHOP_SERVICES,
  type ShopService,
  type ShopServiceIconKey,
  type TableServiceRequest,
} from "@/app/lib/shopServices";
import {
  SERVICE_REQUESTS_NEW_EVENT,
  useServiceRequestsPending,
} from "./ServiceRequestsPendingProvider";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

type TabKey = "requests" | "catalog";
type RequestFilter = "open" | "done" | "cancelled";

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value) return "";
  return value.replace("T", " ") + ":00";
}

export default function ShopServicesPage() {
  const [tab, setTab] = useState<TabKey>("requests");
  const [services, setServices] = useState<ShopService[]>([]);
  const [requests, setRequests] = useState<TableServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("open");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleRow, setScheduleRow] = useState<TableServiceRequest | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [editing, setEditing] = useState<ShopService | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconKey, setIconKey] = useState<ShopServiceIconKey>("other");
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const { count: pendingCount, refresh: refreshPending } = useServiceRequestsPending();

  const loadCatalog = useCallback(async () => {
    const token = tokenCode();
    if (!token) return;
    const res = await FetchWithJwtClient("GET", "/api/shop-services", token);
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "خطا در دریافت خدمات"));
      return;
    }
    setServices(extractShopServices(res));
  }, []);

  const loadRequests = useCallback(
    async (opts?: { silent?: boolean }) => {
      const token = tokenCode();
      if (!token) {
        setLoading(false);
        return;
      }
      if (!opts?.silent) setLoading(true);
      try {
        const res = await FetchWithJwtClient(
          "GET",
          `/api/table-service-requests?status=${requestFilter}`,
          token,
        );
        if (res?.hasError) {
          if (!opts?.silent) toast.error(getApiErrorMessage(res, "خطا در دریافت درخواست‌ها"));
          return;
        }
        setRequests(extractTableServiceRequests(res));
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [requestFilter],
  );

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const onNew = () => {
      toast.info("درخواست خدمت جدید رسید");
      if (requestFilter === "pending") void loadRequests({ silent: true });
    };
    window.addEventListener(SERVICE_REQUESTS_NEW_EVENT, onNew);
    return () => window.removeEventListener(SERVICE_REQUESTS_NEW_EVENT, onNew);
  }, [loadRequests, requestFilter]);

  const openCreate = (preset?: (typeof SUGGESTED_SHOP_SERVICES)[number]) => {
    setEditing(null);
    setName(preset?.name || "");
    setDescription(preset?.description || "");
    setIconKey(preset?.icon_key || "other");
    setDialogOpen(true);
  };

  const openEdit = (service: ShopService) => {
    setEditing(service);
    setName(service.name);
    setDescription(service.description || "");
    setIconKey((service.icon_key as ShopServiceIconKey) || "other");
    setDialogOpen(true);
  };

  const saveService = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("نام خدمت را وارد کنید");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      const body = { name: trimmed, description: description.trim(), icon_key: iconKey, is_active: true };
      const res = editing
        ? await FetchWithJwtClient("PUT", `/api/shop-services/${editing.id}`, token, {}, { body: JSON.stringify(body) })
        : await FetchWithJwtClient("POST", "/api/shop-services", token, {}, { body: JSON.stringify(body) });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره خدمت ناموفق بود"));
        return;
      }
      toast.success(editing ? "خدمت ویرایش شد" : "خدمت اضافه شد");
      setDialogOpen(false);
      await loadCatalog();
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (service: ShopService) => {
    if (!window.confirm(`خدمت «${service.name}» حذف شود؟`)) return;
    const token = tokenCode();
    if (!token) return;
    const res = await FetchWithJwtClient("DELETE", `/api/shop-services/${service.id}`, token);
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "حذف ناموفق بود"));
      return;
    }
    toast.success("خدمت حذف شد");
    await loadCatalog();
  };

  const saveSchedule = async () => {
    if (!scheduleRow || !scheduleAt) {
      toast.error("تاریخ و ساعت را وارد کنید");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setActingId(scheduleRow.id);
    try {
      const res = await FetchWithJwtClient(
        "POST",
        `/api/table-service-requests/${scheduleRow.id}/schedule`,
        token,
        {},
        { body: JSON.stringify({ scheduled_at: fromDatetimeLocal(scheduleAt) }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت زمان ناموفق بود"));
        return;
      }
      toast.success("زمان انجام ثبت شد");
      setScheduleRow(null);
      await loadRequests({ silent: true });
      await refreshPending();
    } finally {
      setActingId(null);
    }
  };

  const actOnRequest = async (row: TableServiceRequest, action: "done" | "cancel") => {
    if (action === "done" && !row.scheduled_at) {
      setScheduleRow(row);
      setScheduleAt(toDatetimeLocal(row.scheduled_at));
      toast.info("اول تاریخ و ساعت انجام را ثبت کنید");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setActingId(row.id);
    try {
      const res = await FetchWithJwtClient(
        "POST",
        `/api/table-service-requests/${row.id}/${action}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, action === "done" ? "ثبت انجام ناموفق بود" : "لغو ناموفق بود"));
        return;
      }
      toast.success(action === "done" ? "انجام شد" : "لغو شد");
      await loadRequests({ silent: true });
      await refreshPending();
    } finally {
      setActingId(null);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: 18 }}>خدمات اتاق</Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mb: 2 }}>
        خدمت‌هایی مثل تمیزکردن یا پتوی جدید، جدا از کالا هستند و فعلاً رایگان ثبت می‌شوند.
      </Typography>

      <Box sx={{ display: "flex", gap: 0.8, mb: 2 }}>
        <Chip
          label={pendingCount > 0 ? `درخواست‌ها (${pendingCount})` : "درخواست‌ها"}
          onClick={() => setTab("requests")}
          color={tab === "requests" ? "success" : "default"}
          sx={{ fontWeight: 700 }}
        />
        <Chip
          label="تعریف خدمات"
          onClick={() => setTab("catalog")}
          color={tab === "catalog" ? "success" : "default"}
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {tab === "requests" ? (
        <>
          <Box sx={{ display: "flex", gap: 0.7, mb: 1.5 }}>
            {(["open", "done", "cancelled"] as const).map((key) => (
              <Chip
                key={key}
                size="small"
                label={key === "open" ? "باز" : key === "done" ? "انجام‌شده" : "لغو شده"}
                onClick={() => setRequestFilter(key)}
                variant={requestFilter === key ? "filled" : "outlined"}
                color={requestFilter === key ? "success" : "default"}
              />
            ))}
          </Box>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : requests.length === 0 ? (
            <Typography sx={{ color: "var(--admin-text-muted)", textAlign: "center", py: 5 }}>
              درخواستی در این وضعیت نیست
            </Typography>
          ) : (
            requests.map((row) => (
              <Card
                key={row.id}
                sx={{
                  mb: 1,
                  bgcolor: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "14px",
                }}
              >
                <CardContent sx={{ py: 1.2, px: 1.4, "&:last-child": { pb: 1.2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: 22 }}>{shopServiceEmoji(row.icon_key)}</Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{row.name}</Typography>
                      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>
                        {row.table_label || (row.table_number ? `اتاق ${row.table_number}` : "اتاق")} · {formatDate(row.created_at)}
                      </Typography>
                      {row.scheduled_at ? (
                        <Typography sx={{ color: "var(--admin-accent)", fontSize: 12, mt: 0.2, fontWeight: 700 }}>
                          زمان انجام: {formatDate(row.scheduled_at)}
                        </Typography>
                      ) : (
                        <Typography sx={{ color: "#e6a23c", fontSize: 12, mt: 0.2 }}>
                          هنوز زمان انجام ثبت نشده
                        </Typography>
                      )}
                      {row.note ? (
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.3 }}>
                          {row.note}
                        </Typography>
                      ) : null}
                    </Box>
                    {row.status === "pending" || row.status === "scheduled" ? (
                      <Box sx={{ display: "flex", gap: 0.4 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setScheduleRow(row);
                            setScheduleAt(toDatetimeLocal(row.scheduled_at));
                          }}
                          disabled={actingId === row.id}
                          sx={{ color: "var(--admin-accent)" }}
                          aria-label="ثبت زمان"
                        >
                          <EventIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => actOnRequest(row, "done")}
                          disabled={actingId === row.id || !row.scheduled_at}
                          sx={{ color: "var(--admin-accent)" }}
                          aria-label="انجام شد"
                        >
                          <CheckRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => actOnRequest(row, "cancel")}
                          disabled={actingId === row.id}
                          sx={{ color: "#e57373" }}
                        >
                          <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Chip size="small" label={row.status_label || row.status} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </>
      ) : (
        <>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openCreate()}
            sx={{ ...adminButtonStartIconSx, mb: 1.5, bgcolor: "var(--admin-accent)" }}
          >
            خدمت جدید
          </Button>
          {services.length === 0 ? (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mb: 1 }}>
                هنوز خدمتی نساخته‌اید. می‌توانید از پیشنهادها شروع کنید:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                {SUGGESTED_SHOP_SERVICES.map((item) => (
                  <Chip
                    key={item.name}
                    clickable
                    onClick={() => openCreate(item)}
                    label={`${shopServiceEmoji(item.icon_key)} ${item.name}`}
                  />
                ))}
              </Box>
            </Box>
          ) : null}
          {services.map((service) => (
            <Card
              key={service.id}
              sx={{
                mb: 1,
                bgcolor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                borderRadius: "14px",
                opacity: service.is_active === false ? 0.55 : 1,
              }}
            >
              <CardContent sx={{ py: 1.2, px: 1.4, display: "flex", alignItems: "center", gap: 1, "&:last-child": { pb: 1.2 } }}>
                <Typography sx={{ fontSize: 22 }}>{shopServiceEmoji(service.icon_key)}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{service.name}</Typography>
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>
                    {service.description || "بدون هزینه"}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => openEdit(service)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => deleteService(service)} sx={{ color: "#e57373" }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{editing ? "ویرایش خدمت" : "خدمت جدید"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="نام"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mt: 1, mb: 1.5 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="توضیح (اختیاری)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 1.5 }}
          />
          <Typography sx={{ fontSize: 12, mb: 0.8, color: "var(--admin-text-secondary)" }}>آیکون</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
            {SHOP_SERVICE_ICONS.map((item) => (
              <Chip
                key={item.key}
                clickable
                label={`${item.emoji} ${item.label}`}
                color={iconKey === item.key ? "success" : "default"}
                onClick={() => setIconKey(item.key)}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            انصراف
          </Button>
          <Button onClick={saveService} disabled={saving} startIcon={<RoomServiceIcon />}>
            {saving ? "..." : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(scheduleRow)} onClose={() => setScheduleRow(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>زمان انجام خدمت</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: "var(--admin-text-secondary)", mb: 1.5 }}>
            {scheduleRow?.name} — {scheduleRow?.table_label || "اتاق"}
          </Typography>
          <TextField
            fullWidth
            type="datetime-local"
            label="تاریخ و ساعت"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleRow(null)}>انصراف</Button>
          <Button onClick={saveSchedule} disabled={actingId === scheduleRow?.id} startIcon={<EventIcon />}>
            ثبت زمان
          </Button>
        </DialogActions>
      </Dialog>
      <ToastContainer position="bottom-center" autoClose={2500} />
    </Box>
  );
}
