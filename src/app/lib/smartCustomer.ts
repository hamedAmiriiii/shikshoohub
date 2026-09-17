import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";

async function api<T = any>(
  method: "Get" | "Post" | "Put" | "Delete",
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const token = tokenCode();
  return (await FetchWithJwtClient(method, {}, body, path, true, true, token)) as T;
}

export type SmartOverview = {
  ready: boolean;
  message?: string;
  last_computed_at?: string | null;
  segment_labels?: Record<string, string>;
  counts?: Record<string, number>;
  tag_counts?: { near_vip: number; ready_repurchase: number };
  headline?: { tone: string; text: string }[];
  suggestions?: {
    key: string;
    title: string;
    count: number;
    estimated_revenue?: number | null;
    severity: string;
  }[];
  total_customers?: number;
};

export type SmartCustomerRow = {
  phone: string;
  name?: string | null;
  recency_days: number;
  frequency: number;
  monetary: number;
  avg_days_between?: number | null;
  avg_order_value: number;
  last_purchase_at?: string | null;
  primary_segment?: string;
  segment_label?: string;
  tags: string[];
  rfm_scores: Record<string, number>;
};

export type SmartAction = {
  id: number;
  phone: string;
  name?: string | null;
  action_type: string;
  priority: number;
  title: string;
  reason?: string | null;
  payload?: Record<string, unknown>;
  estimated_revenue: number;
  status: string;
  suggested_send_at?: string | null;
};

export type SmartCampaign = {
  id: number;
  name: string;
  status: string;
  trigger: string;
  cooldown_days: number;
  max_recipients_per_run?: number | null;
  description?: string | null;
  conditions: { all: { field: string; op: string; value: unknown }[] };
  actions: { id?: number; sort: number; type: string; config: Record<string, unknown> }[];
};

export type SmartThresholds = Record<string, string | number>;

export function fetchSmartOverview() {
  return api<SmartOverview>("Get", "/api/smart-customer/overview");
}

export function fetchSmartCustomers(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return api<{ data: SmartCustomerRow[]; total: number; segment_labels: Record<string, string> }>(
    "Get",
    `/api/smart-customer/customers${q ? `?${q}` : ""}`,
  );
}

export function fetchSmartThresholds() {
  return api<{ thresholds: SmartThresholds }>("Get", "/api/smart-customer/thresholds");
}

export function updateSmartThresholds(body: Record<string, unknown>) {
  return api("Put", "/api/smart-customer/thresholds", body);
}

export function recomputeSmartCustomer() {
  return api("Post", "/api/smart-customer/recompute");
}

export function fetchSmartActions(status = "suggested") {
  return api<{ data: SmartAction[] }>("Get", `/api/smart-customer/actions?status=${status}`);
}

export function dismissSmartAction(id: number) {
  return api("Post", `/api/smart-customer/actions/${id}/dismiss`);
}

export function executeSmartAction(id: number) {
  return api("Post", `/api/smart-customer/actions/${id}/execute`);
}

export function fetchSmartCampaigns() {
  return api<{ campaigns: SmartCampaign[] }>("Get", "/api/smart-customer/campaigns");
}

export function fetchSmartCampaign(id: number) {
  return api<{ campaign: SmartCampaign }>("Get", `/api/smart-customer/campaigns/${id}`);
}

export function createSmartCampaign(body: Record<string, unknown>) {
  return api("Post", "/api/smart-customer/campaigns", body);
}

export function updateSmartCampaign(id: number, body: Record<string, unknown>) {
  return api("Put", `/api/smart-customer/campaigns/${id}`, body);
}

export function deleteSmartCampaign(id: number) {
  return api("Delete", `/api/smart-customer/campaigns/${id}`);
}

export function previewSmartCampaign(id: number) {
  return api<{ matched: number; estimated_revenue: number; sample_phones: string[] }>(
    "Get",
    `/api/smart-customer/campaigns/${id}/preview`,
  );
}

export function runSmartCampaign(id: number) {
  return api("Post", `/api/smart-customer/campaigns/${id}/run`);
}

export function toFaNum(n: number | string | null | undefined) {
  const raw = Number(n || 0);
  return new Intl.NumberFormat("fa-IR").format(raw);
}
