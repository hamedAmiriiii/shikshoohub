"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import {
  type InvoiceItem,
  type InvoiceRecord,
} from "@/app/admin/invoices/InvoiceDetailsDialog";
import BeneficiarySelect from "@/app/admin/BeneficiarySelect";
import DocumentPaymentFields from "@/app/admin/DocumentPaymentFields";
import { dateObjectToPayload, todayJalaliDateObject } from "@/app/lib/cheques";
import { beneficiaryPayload, type Beneficiary } from "@/app/lib/beneficiaries";
import { CHEQUE_DATE_PICKER_Z } from "@/app/admin/cheques/ChequeFormSheet";
import {
  buildDocumentPaymentPayload,
  emptyDocumentPaymentForm,
  type DocumentPaymentFormState,
} from "@/app/lib/documentPayments";

export type InvoiceLinkMode = "new" | "whole" | "item";

export type InvoiceLinkState = {
  createInvoice: boolean;
  mode: InvoiceLinkMode;
  invoiceId: number | "";
  invoiceItemId: number | "";
  invoiceTitle: string;
  invoiceDate: DateObject | null;
  invoiceDescription: string;
  payment: DocumentPaymentFormState;
  beneficiaryId: number | "";
  beneficiaryOption: Beneficiary | null;
};

export function emptyInvoiceLinkState(): InvoiceLinkState {
  return {
    createInvoice: false,
    mode: "new",
    invoiceId: "",
    invoiceItemId: "",
    invoiceTitle: "",
    invoiceDate: todayJalaliDateObject(),
    invoiceDescription: "",
    payment: emptyDocumentPaymentForm(),
    beneficiaryId: "",
    beneficiaryOption: null,
  };
}

function jalaliDateString(d: DateObject | null | undefined): string | null {
  const payload = dateObjectToPayload(d);
  if (!payload) return null;
  const month = String(payload.month).padStart(2, "0");
  const day = String(payload.day).padStart(2, "0");
  return `${payload.year}/${month}/${day}`;
}

export function buildInvoiceLinkPayload(
  state: InvoiceLinkState,
  lotTotal = 0,
): Record<string, unknown> {
  if (!state.createInvoice) return {};
  const payload: Record<string, unknown> = { create_invoice: true };
  if (state.mode === "new") {
    const title = state.invoiceTitle.trim();
    if (title) {
      payload.invoice_title = title;
      payload.title = title;
    }
    const dateObj = state.invoiceDate ?? todayJalaliDateObject();
    const date = dateObjectToPayload(dateObj);
    const dateStr = jalaliDateString(dateObj);
    if (date) {
      payload.invoice_date = date;
      payload.date = dateStr ?? date;
    }
    const description = state.invoiceDescription.trim();
    if (description) {
      payload.invoice_description = description;
      payload.description = description;
    }
    Object.assign(payload, beneficiaryPayload(state.beneficiaryId));
    const payment = buildDocumentPaymentPayload(state.payment, lotTotal);
    if (!payment.error) Object.assign(payload, payment.payload);
  }
  if (state.mode === "whole" && state.invoiceId !== "") {
    payload.invoice_id = state.invoiceId;
    payload.invoice_link = "whole";
  }
  if (state.mode === "item" && state.invoiceId !== "") {
    payload.invoice_id = state.invoiceId;
    payload.invoice_link = "item";
    if (state.invoiceItemId !== "") {
      payload.invoice_item_id = state.invoiceItemId;
    }
  }
  return payload;
}

export function validateInvoiceLink(state: InvoiceLinkState, lotTotal = 0): string | null {
  if (!state.createInvoice) return null;
  if (state.mode === "new") {
    if (!state.invoiceTitle.trim()) return "عنوان فاکتور را وارد کنید";
    if (!state.invoiceDate) return "تاریخ فاکتور را انتخاب کنید";
    const payment = buildDocumentPaymentPayload(state.payment, lotTotal);
    if (payment.error) return payment.error;
  }
  if ((state.mode === "whole" || state.mode === "item") && state.invoiceId === "") {
    return "فاکتور مورد نظر را انتخاب کنید";
  }
  return null;
}

function extractInvoices(res: any): InvoiceRecord[] {
  if (!res || res.hasError) return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
}

function extractInvoice(res: any): InvoiceRecord | null {
  if (!res || res.hasError) return null;
  const candidate = res.data ?? res.invoice ?? res;
  if (candidate && typeof candidate === "object" && !Array.isArray(candidate) && candidate.id != null) {
    return candidate as InvoiceRecord;
  }
  return null;
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: 12,
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": {
    color: "var(--admin-text-muted)",
    fontSize: 12,
    right: 14,
    left: "auto",
    transformOrigin: "top right",
    textAlign: "right",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(-14px, -9px) scale(0.75)",
  },
  "& .MuiInputBase-input": {
    py: "6px",
    fontSize: 12,
    textAlign: "right",
    direction: "rtl",
  },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)", left: 7, right: "auto" },
} as const;

const compactListboxSx = {
  py: 0,
  "& .MuiAutocomplete-option": {
    minHeight: 32,
    py: 0.4,
    fontSize: 12,
  },
} as const;

const compactLabelSx = {
  m: 0,
  color: "var(--admin-text)",
  "& .MuiFormControlLabel-label": { fontSize: 12 },
} as const;

function invoiceOptionLabel(invoice: InvoiceRecord) {
  const title = invoice.title?.trim() || "بدون عنوان";
  return invoice.date ? `#${invoice.id} — ${title} — ${invoice.date}` : `#${invoice.id} — ${title}`;
}

function invoicesUrl(query: string) {
  const params = [`per_page=40`];
  const q = query.trim();
  if (q) {
    params.push(
      `searchFilterModel=${encodeURIComponent(
        JSON.stringify({ title: q, description: q, user_name: q }),
      )}`,
    );
  }
  return `/api/invoices?${params.join("&")}`;
}

type Props = {
  value: InvoiceLinkState;
  onChange: (next: InvoiceLinkState) => void;
  lotTotal?: number;
};

export default function InvoiceLinkFields({ value, onChange, lotTotal = 0 }: Props) {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [pickedInvoice, setPickedInvoice] = useState<InvoiceRecord | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadInvoices = (query = "") => {
    const token = tokenCode();
    if (!token) return;
    setLoadingInvoices(true);
    FetchWithJwtClient("GET", invoicesUrl(query), token)
      .then((res) => setInvoices(extractInvoices(res)))
      .finally(() => setLoadingInvoices(false));
  };

  useEffect(() => {
    if (!value.createInvoice) return;
    loadInvoices("");
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.createInvoice]);

  useEffect(() => {
    if (!value.createInvoice || value.mode !== "item" || value.invoiceId === "") {
      setItems([]);
      return;
    }
    const fromList = invoices.find((row) => row.id === value.invoiceId);
    if (Array.isArray(fromList?.items) && fromList.items.length > 0) {
      setItems(fromList.items);
      return;
    }
    const token = tokenCode();
    if (!token) return;
    let cancelled = false;
    FetchWithJwtClient("GET", `/api/invoices/${value.invoiceId}`, token).then((res) => {
      if (cancelled) return;
      const invoice = extractInvoice(res) ?? fromList;
      setItems(Array.isArray(invoice?.items) ? invoice.items : []);
    });
    return () => {
      cancelled = true;
    };
  }, [value.createInvoice, value.mode, value.invoiceId, invoices]);

  const patch = (partial: Partial<InvoiceLinkState>) => onChange({ ...value, ...partial });

  const invoiceOptions = useMemo(() => {
    const rows = [...invoices];
    if (pickedInvoice && !rows.some((row) => row.id === pickedInvoice.id)) {
      rows.unshift(pickedInvoice);
    }
    return rows;
  }, [invoices, pickedInvoice]);

  const selectedInvoice =
    invoiceOptions.find((row) => row.id === value.invoiceId) ?? pickedInvoice ?? null;

  const searchInvoices = (query: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadInvoices(query), 280);
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 1,
        direction: "rtl",
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={value.createInvoice}
            onChange={(e) =>
              patch({
                createInvoice: e.target.checked,
                mode: "new",
                invoiceId: "",
                invoiceItemId: "",
                invoiceTitle: "",
                invoiceDate: todayJalaliDateObject(),
                invoiceDescription: "",
                payment: emptyDocumentPaymentForm(),
                beneficiaryId: "",
                beneficiaryOption: null,
              })
            }
            sx={{
              py: 0,
              color: "var(--admin-text-muted)",
              "&.Mui-checked": { color: "var(--admin-accent)" },
            }}
          />
        }
        label="ایجاد فاکتور"
        sx={{ ...compactLabelSx, gridColumn: "1 / -1" }}
      />

      {value.createInvoice && (
        <>
          <RadioGroup
            row
            value={value.mode}
            onChange={(e) =>
              patch({
                mode: e.target.value as InvoiceLinkMode,
                invoiceId: "",
                invoiceItemId: "",
              })
            }
            sx={{ gridColumn: "1 / -1", gap: 0.5 }}
          >
            <FormControlLabel
              value="new"
              control={
                <Radio
                  size="small"
                  sx={{ py: 0, color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }}
                />
              }
              label="فاکتور جدید"
              sx={compactLabelSx}
            />
            <FormControlLabel
              value="item"
              control={
                <Radio
                  size="small"
                  sx={{ py: 0, color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }}
                />
              }
              label="وصل به فاکتور"
              sx={compactLabelSx}
            />
          </RadioGroup>

          {value.mode === "new" && (
            <>
              <TextField
                size="small"
                label="عنوان فاکتور"
                value={value.invoiceTitle}
                onChange={(e) => patch({ invoiceTitle: e.target.value })}
                required
                sx={fieldSx}
              />
              <Box sx={{ width: "100%" }}>
                <DatePicker
                  value={value.invoiceDate}
                  onChange={(d) =>
                    patch({ invoiceDate: d && !Array.isArray(d) ? (d as DateObject) : null })
                  }
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  zIndex={CHEQUE_DATE_PICKER_Z}
                  portal
                  containerStyle={{ width: "100%" }}
                  render={(text, openCalendar) => (
                    <TextField
                      size="small"
                      label="تاریخ فاکتور"
                      value={typeof text === "string" ? text : String(text || "")}
                      onClick={openCalendar}
                      onFocus={openCalendar}
                      fullWidth
                      sx={fieldSx}
                      inputProps={{ readOnly: true, style: { cursor: "pointer" } }}
                    />
                  )}
                />
              </Box>
              <TextField
                size="small"
                label="توضیحات"
                value={value.invoiceDescription}
                onChange={(e) => patch({ invoiceDescription: e.target.value })}
                sx={fieldSx}
              />
              <BeneficiarySelect
                value={value.beneficiaryId}
                initialOption={value.beneficiaryOption}
                onChange={(beneficiaryId, option) =>
                  patch({ beneficiaryId, beneficiaryOption: option })
                }
                helperText=""
                compact
              />
              <DocumentPaymentFields
                value={value.payment}
                onChange={(payment) => patch({ payment })}
                totalAmount={lotTotal}
                compact
              />
            </>
          )}

          {(value.mode === "whole" || value.mode === "item") && (
            <Autocomplete
              size="small"
              options={invoiceOptions}
              loading={loadingInvoices}
              value={selectedInvoice}
              onOpen={() => {
                if (invoices.length === 0) loadInvoices("");
              }}
              onInputChange={(_e, query, reason) => {
                if (reason === "input") searchInvoices(query);
              }}
              onChange={(_e, next) => {
                setPickedInvoice(next);
                patch({
                  invoiceId: next?.id ?? "",
                  invoiceItemId: "",
                });
              }}
              isOptionEqualToValue={(option, current) => option.id === current.id}
              getOptionLabel={invoiceOptionLabel}
              noOptionsText={loadingInvoices ? "در حال جستجو..." : "فاکتوری پیدا نشد"}
              loadingText="در حال جستجو..."
              filterOptions={(opts, state) => {
                const q = state.inputValue.trim().replace(/^#/, "");
                if (!q) return opts;
                return opts.filter((row) => {
                  const title = (row.title || "").toLowerCase();
                  const desc = (row.description || "").toLowerCase();
                  const needle = q.toLowerCase();
                  return (
                    String(row.id).includes(q) ||
                    title.includes(needle) ||
                    desc.includes(needle)
                  );
                });
              }}
              slotProps={{
                popper: { sx: { zIndex: 1700, direction: "rtl" } },
                listbox: { sx: compactListboxSx },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label={loadingInvoices ? "جستجوی فاکتور..." : "فاکتور"}
                  sx={fieldSx}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingInvoices ? <CircularProgress color="inherit" size={14} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}

          {value.mode === "item" && value.invoiceId !== "" && (
            <TextField
              select
              size="small"
              label="ردیف فاکتور"
              value={value.invoiceItemId}
              onChange={(e) =>
                patch({ invoiceItemId: e.target.value === "" ? "" : Number(e.target.value) })
              }
              sx={fieldSx}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      "& .MuiMenuItem-root": { minHeight: 32, fontSize: 12, py: 0.4 },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">ردیف جدید</MenuItem>
              {items.map((item, index) => (
                <MenuItem key={item.id ?? index} value={item.id ?? ""} disabled={item.id == null}>
                  {item.title || `ردیف ${index + 1}`}
                </MenuItem>
              ))}
            </TextField>
          )}
        </>
      )}
    </Box>
  );
}
