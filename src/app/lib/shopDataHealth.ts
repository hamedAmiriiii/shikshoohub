import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";

export type HealthSample = {
  id: number;
  label: string;
  meta?: string | null;
  amount?: number | null;
  at?: string | null;
};

export type HealthFinding = {
  code: string;
  severity: "error" | "warning" | "info" | string;
  category: "entry" | "operation" | "system" | string;
  title: string;
  detail: string;
  how_to_fix: string;
  count: number;
  amount?: number | null;
  href?: string | null;
  href_label?: string | null;
  samples: HealthSample[];
};

export type ShopHealthReport = {
  headline: string;
  summary: {
    sales_count: number;
    finding_count: number;
    error_count: number;
    warning_count: number;
    info_count: number;
  };
  findings: HealthFinding[];
};

export async function fetchShopHealth(): Promise<ShopHealthReport> {
  const token = tokenCode();
  const res = await FetchWithJwtClient("GET", "/api/shop-health", token);
  if (res && typeof res === "object" && (res as { hasError?: boolean }).hasError) {
    throw res;
  }
  return res as ShopHealthReport;
}
