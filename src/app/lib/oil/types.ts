export type OilPlateParts = {
  serial: string;
  letter: string;
  middle: string;
  province: string;
};

export type OilVisit = {
  id: number;
  plate: string;
  plate_display: string;
  plate_parts: OilPlateParts;
  phone: string;
  km: number;
  next_km: number;
  sms_sent: boolean;
  sms_error: string | null;
  created_at: string;
  created_at_jalali: string;
  visit_count?: number;
  notes?: string | null;
};

export type OilUser = {
  id: number;
  name: string;
  phone: string;
  atelier_id: number;
};

export type OilShop = {
  id: number;
  name: string;
  code: string;
  oil_interval_km: number;
  project_type: "oil";
};

export type OilShopAccess = {
  shop_access_active: boolean;
  shop_access_days_remaining: number | null;
};

export type OilSession = {
  token?: string;
  project_type: "oil";
  user: OilUser;
  shop: OilShop;
  shop_access: OilShopAccess;
  sms?: OilSmsQuota;
};

export type OilSmsQuota = {
  atelier_id: number;
  balance: number;
  chars_per_sms: number;
  setting_key: string;
};

export type OilSmsPackage = {
  id: number;
  name: string;
  sms_count: number;
  price_rial: number;
  price_toman: number;
  sort_order?: number;
};

export type OilSmsPackageOrder = {
  id: number;
  package_name: string;
  sms_count: number;
  price_toman: number;
  status: "pending" | "approved" | "rejected" | string;
  status_label: string;
  admin_note?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
};

export type OilCustomerListResponse = {
  data: OilVisit[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type OilApiError = {
  hasError: true;
  statusCode: number;
  message: string;
  retry_after_seconds?: number;
};

export type OilLookupResponse =
  | { found: true; visit: OilVisit }
  | { found: false };

export type OilReminderSms = {
  id: number;
  oil_visit_id: number;
  plate: string;
  plate_display: string;
  phone: string;
  next_km: number;
  estimated_due_on: string;
  estimated_due_on_jalali: string;
  days_until_due: number;
  message: string;
  sms_sent: boolean;
  sms_error: string | null;
  created_at: string;
  created_at_jalali: string;
};

export type OilReminderListResponse = {
  data: OilReminderSms[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type OilReminderRun = {
  km_per_year: number;
  km_per_day: number;
  lookahead_days: number;
  typical_days_between_changes: number;
  scanned: number;
  due: number;
  sent: number;
  skipped_already_sent: number;
  failed: number;
  message: string;
};
