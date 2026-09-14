"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import List from "@/app/coponent/grid/Grid";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import {
  fetchCitiesByState,
  fetchConsultationFormOptions,
  formatConsultationDate,
  formatConsultationSource,
  getConsultationCityName,
  getConsultationStateName,
  isApiFailure,
  parseConsultationMeta,
  type ConsultationRequest,
  type ConsultationRequestsMeta,
  type GeoItem,
} from "@/app/lib/consultationRequests";
import ConsultationRequestActions, {
  ConsultationMobileCard,
  ConsultationStatusChip,
} from "./ConsultationRequestActions";

const BASE_URL = "/api/admin/consultation-requests";
const ROWS_PER_PAGE = 20;

const selectSx = {
  minWidth: 160,
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    backgroundColor: "var(--admin-surface)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

export default function AdminConsultationRequestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [allowed, setAllowed] = useState(false);
  const [meta, setMeta] = useState<ConsultationRequestsMeta>({
    statuses: [],
    sources: [],
    statusCounts: {},
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [states, setStates] = useState<GeoItem[]>([]);
  const [cities, setCities] = useState<GeoItem[]>([]);

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  const loadMeta = useCallback(async () => {
    const res = await FetchWithJwtClient("GET", `${BASE_URL}?per_page=1`, tokenCode());
    if (res?.hasError) return;
    setMeta(parseConsultationMeta(res));
  }, []);

  useEffect(() => {
    if (!allowed) return;
    void loadMeta();
    fetchConsultationFormOptions().then((res) => {
      if (!isApiFailure(res)) setStates(res.states);
    });
  }, [allowed, loadMeta]);

  useEffect(() => {
    if (!stateFilter) {
      setCities([]);
      return;
    }
    let active = true;
    fetchCitiesByState(Number(stateFilter)).then((list) => {
      if (active) setCities(list);
    });
    return () => {
      active = false;
    };
  }, [stateFilter]);

  const listUrl = useMemo(() => {
    const params: string[] = [`per_page=${ROWS_PER_PAGE}`];
    if (statusFilter) params.push(`status=${encodeURIComponent(statusFilter)}`);
    if (stateFilter) params.push(`state_id=${stateFilter}`);
    if (cityFilter) params.push(`city_id=${cityFilter}`);
    return `${BASE_URL}?${params.join("&")}`;
  }, [cityFilter, stateFilter, statusFilter]);

  const refreshGrid = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        if (key[0] === "datas-infinite" || key[0] === "datas-desktop") {
          const url = key[2];
          return typeof url === "string" && url.includes(BASE_URL);
        }
        return false;
      },
    });
    void loadMeta();
  }, [loadMeta, queryClient]);

  const searchBoxList = useMemo(
    () =>
      ["name", "phone", "business_name", "state", "city"].map((fieldName) => ({
        fieldName,
        fieldOperation: "MATCH" as const,
        fieldValue: "",
        nextConditionOperator: "OR" as const,
      })),
    [],
  );

  const desktopColumns = useMemo(
    () => [
      { label: "نام", field: (item: ConsultationRequest) => item.name || "—" },
      { label: "مجموعه", field: (item: ConsultationRequest) => item.business_name || "—" },
      {
        label: "موبایل",
        field: (item: ConsultationRequest) => <span dir="ltr">{item.phone || "—"}</span>,
      },
      { label: "استان", field: (item: ConsultationRequest) => getConsultationStateName(item) },
      { label: "شهر", field: (item: ConsultationRequest) => getConsultationCityName(item) },
      {
        label: "منبع",
        field: (item: ConsultationRequest) =>
          formatConsultationSource(item.source, item.source_label),
      },
      {
        label: "تاریخ ثبت",
        field: (item: ConsultationRequest) => formatConsultationDate(item.created_at),
      },
      {
        label: "وضعیت",
        field: (item: ConsultationRequest) => <ConsultationStatusChip status={item.status} />,
      },
      { label: "یادداشت", field: (item: ConsultationRequest) => item.admin_note || "—" },
    ],
    [],
  );

  const statusChips = useMemo(() => {
    const totalCount = Object.values(meta.statusCounts).reduce((sum, count) => sum + count, 0);
    const chips = [{ value: "", label: totalCount ? `همه (${totalCount})` : "همه" }];
    meta.statuses.forEach((status) => {
      const count = meta.statusCounts[status.value];
      chips.push({
        value: status.value,
        label: count === undefined ? status.label : `${status.label} (${count})`,
      });
    });
    return chips;
  }, [meta]);

  const MobileCard = useCallback(
    (props: { data: ConsultationRequest }) => (
      <ConsultationMobileCard
        data={props.data}
        statuses={meta.statuses}
        onSuccess={refreshGrid}
      />
    ),
    [meta.statuses, refreshGrid],
  );

  if (!allowed) {
    return (
      <Box sx={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "var(--admin-accent)" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        py: 3,
        px: { xs: 2, sm: 3, md: 4 },
        direction: "rtl",
        pb: 12,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <QrCode2Icon sx={{ color: "var(--admin-accent)", fontSize: 32 }} />
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "22px" }}>
            درخواست‌های خرید منوی دیجیتال
          </Typography>
        </Box>

        {statusChips.length > 1 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {statusChips.map((chip) => (
              <Chip
                key={chip.value || "all"}
                label={chip.label}
                clickable
                onClick={() => setStatusFilter(chip.value)}
                color={statusFilter === chip.value ? "primary" : "default"}
                variant={statusFilter === chip.value ? "filled" : "outlined"}
                sx={{
                  color: statusFilter === chip.value ? "var(--admin-on-accent)" : "var(--admin-text)",
                  borderColor: "var(--admin-border)",
                  bgcolor: statusFilter === chip.value ? "var(--admin-accent)" : "transparent",
                }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          <TextField
            select
            size="small"
            label="استان"
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCityFilter("");
            }}
            sx={selectSx}
          >
            <MenuItem value="">همه استان‌ها</MenuItem>
            {states.map((state) => (
              <MenuItem key={state.id} value={String(state.id)}>
                {state.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="شهر"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            disabled={!stateFilter}
            sx={selectSx}
          >
            <MenuItem value="">همه شهرها</MenuItem>
            {cities.map((city) => (
              <MenuItem key={city.id} value={String(city.id)}>
                {city.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <List
          key={listUrl}
          disableFilter
          searchBoxList={searchBoxList}
          filterBoxList={[]}
          filterComponent={<></>}
          url={listUrl}
          showTotal
          textTotal={["درخواست", ""]}
          rows={ROWS_PER_PAGE}
          enablePagination
          desktopColumns={desktopColumns}
          renderRowActions={(item: ConsultationRequest) => (
            <ConsultationRequestActions
              item={item}
              statuses={meta.statuses}
              onSuccess={refreshGrid}
            />
          )}
          CartComponent={MobileCard}
        />
      </Box>
      <ToastContainer position="bottom-right" rtl autoClose={2500} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
