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
import HandshakeIcon from "@mui/icons-material/Handshake";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import List from "@/app/coponent/grid/Grid";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import {
  fetchAgencyFormOptions,
  fetchCitiesByState,
  formatAgencyDate,
  formatEducation,
  getCityName,
  getRequesterName,
  getStateName,
  isApiFailure,
  parseAgencyMeta,
  type AgencyRequest,
  type AgencyRequestsMeta,
  type GeoItem,
} from "@/app/lib/agencyRequests";
import AgencyRequestActions, {
  AgencyRequestMobileCard,
  AgencyRequestStatusChip,
} from "./AgencyRequestActions";

const BASE_URL = "/api/admin/agency-requests";
const ROWS_PER_PAGE = 20;

const DATE_FILTERS = [
  { value: "", label: "همه زمان‌ها" },
  { value: "today", label: "امروز" },
  { value: "week", label: "هفته جاری" },
  { value: "month", label: "ماه جاری" },
  { value: "year", label: "سال جاری" },
  { value: "range", label: "بازه تاریخ" },
];

const selectSx = {
  minWidth: 180,
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    backgroundColor: "var(--admin-surface)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

export default function AdminAgencyRequestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [allowed, setAllowed] = useState(false);
  const [meta, setMeta] = useState<AgencyRequestsMeta>({
    statuses: [],
    educations: [],
    statusCounts: {},
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dateRange, setDateRange] = useState<any>([]);
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
    setMeta(parseAgencyMeta(res));
  }, []);

  useEffect(() => {
    if (!allowed) return;
    loadMeta();
    fetchAgencyFormOptions().then((res) => {
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

    if (dateFilter === "range") {
      if (dateRange.length === 2) {
        const from_date = {
          year: dateRange[0].year,
          month: dateRange[0].month.number,
          day: dateRange[0].day,
        };
        const to_date = {
          year: dateRange[1].year,
          month: dateRange[1].month.number,
          day: dateRange[1].day,
        };
        params.push(
          `filter=range&from_date=${encodeURIComponent(
            JSON.stringify(from_date),
          )}&to_date=${encodeURIComponent(JSON.stringify(to_date))}`,
        );
      }
    } else if (dateFilter) {
      params.push(`filter=${dateFilter}`);
    }

    return `${BASE_URL}?${params.join("&")}`;
  }, [cityFilter, dateFilter, dateRange, stateFilter, statusFilter]);

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
    loadMeta();
  }, [loadMeta, queryClient]);

  const searchBoxList = useMemo(
    () =>
      ["first_name", "last_name", "phone", "state", "city"].map((fieldName) => ({
        fieldName,
        fieldOperation: "MATCH" as const,
        fieldValue: "",
        nextConditionOperator: "OR" as const,
      })),
    [],
  );

  const desktopColumns = useMemo(
    () => [
      { label: "نام و نام خانوادگی", field: (item: AgencyRequest) => getRequesterName(item) },
      {
        label: "موبایل",
        field: (item: AgencyRequest) => <span dir="ltr">{item.phone || "—"}</span>,
      },
      { label: "استان", field: (item: AgencyRequest) => getStateName(item) },
      { label: "شهر", field: (item: AgencyRequest) => getCityName(item) },
      {
        label: "مدرک تحصیلی",
        field: (item: AgencyRequest) => formatEducation(item.education_label || item.education),
      },
      { label: "تاریخ ثبت", field: (item: AgencyRequest) => formatAgencyDate(item.created_at) },
      {
        label: "وضعیت",
        field: (item: AgencyRequest) => <AgencyRequestStatusChip status={item.status} />,
      },
      { label: "یادداشت", field: (item: AgencyRequest) => item.admin_note || "—" },
    ],
    [],
  );

  const statusChips = useMemo(() => {
    const totalCount = Object.values(meta.statusCounts).reduce((sum, count) => sum + count, 0);
    const chips = [
      { value: "", label: totalCount ? `همه (${totalCount})` : "همه" },
    ];
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
    (props: { data: AgencyRequest }) => (
      <AgencyRequestMobileCard
        data={props.data}
        statuses={meta.statuses}
        onSuccess={refreshGrid}
      />
    ),
    [meta.statuses, refreshGrid],
  );

  if (!allowed) {
    return (
      <Box
        sx={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
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
          <HandshakeIcon sx={{ color: "var(--admin-accent)", fontSize: 32 }} />
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "22px" }}>
            درخواست‌های نمایندگی
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
                sx={{
                  fontWeight: 600,
                  ...(statusFilter === chip.value
                    ? {
                        bgcolor: "var(--admin-accent)",
                        color: "#fff",
                        "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                      }
                    : {
                        bgcolor: "var(--admin-surface)",
                        color: "var(--admin-text)",
                        border: "1px solid var(--admin-border)",
                      }),
                }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 1 }}>
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
            disabled={!stateFilter || cities.length === 0}
            sx={selectSx}
          >
            <MenuItem value="">همه شهرها</MenuItem>
            {cities.map((city) => (
              <MenuItem key={city.id} value={String(city.id)}>
                {city.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="بازه زمانی"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              if (e.target.value !== "range") setDateRange([]);
            }}
            sx={selectSx}
          >
            {DATE_FILTERS.map((option) => (
              <MenuItem key={option.value || "all"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {dateFilter === "range" && (
            <DatePicker
              value={dateRange}
              onChange={setDateRange}
              range
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              placeholder="انتخاب بازه"
              style={{
                height: "40px",
                backgroundColor: "var(--admin-surface)",
                color: "var(--admin-text)",
                border: "1px solid var(--admin-border)",
                borderRadius: "8px",
                padding: "8px",
              }}
            />
          )}
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
          renderRowActions={(item: AgencyRequest) => (
            <AgencyRequestActions item={item} statuses={meta.statuses} onSuccess={refreshGrid} />
          )}
          CartComponent={MobileCard}
        />
      </Box>
      <ToastContainer position="bottom-right" rtl />
    </Box>
  );
}
