export const REFERRAL_API_BASE =
  process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir";

export type ReferralStats = {
  registered_count?: number;
  paid_count?: number;
  rewarded_count?: number;
  referral_balance?: number;
  reward_per_activation?: number;
};

export type ReferralShop = {
  name?: string;
  subscription_status?: string;
  is_paid?: boolean;
};

export type ReferralItem = {
  status?: string;
  status_label?: string;
  reward_amount?: number;
  shop?: ReferralShop;
  created_at?: string;
};

export type PublicReferralResponse = {
  referrer?: {
    name?: string;
    phone?: string;
    referral_code?: string;
  };
  stats?: ReferralStats;
  referrals?: ReferralItem[];
  hasError?: boolean;
  message?: string;
};

export type ReferrerPanelResponse = {
  referral_code?: string;
  register_link?: string;
  dashboard_link?: string;
  dashboard_api_url?: string;
  stats?: ReferralStats;
  referrals?: ReferralItem[];
  hasError?: boolean;
  message?: string;
};

export function toFaNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function buildRegisterLinkFallback(referralCode: string): string {
  const encoded = encodeURIComponent(referralCode);
  if (typeof window === "undefined") {
    return `/admin/register-shop?ref=${encoded}`;
  }
  return `${window.location.origin}/admin/register-shop?ref=${encoded}`;
}

export async function fetchPublicReferralDashboard(
  identifier: string,
): Promise<PublicReferralResponse> {
  try {
    const res = await fetch(
      `${REFERRAL_API_BASE}/api/referrals/09399166196`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );
    const json = (await res.json().catch(() => null)) as PublicReferralResponse | null;

    if (!res.ok || !json) {
      return {
        hasError: true,
        message:
          typeof json?.message === "string" ? json.message : "اطلاعات معرفی یافت نشد.",
      };
    }

    return json;
  } catch {
    return {
      hasError: true,
      message: "خطا در دریافت اطلاعات. لطفا دوباره تلاش کنید.",
    };
  }
}
