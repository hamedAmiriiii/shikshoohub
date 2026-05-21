"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, CircularProgress } from "@mui/material";
import SmsIcon from "@mui/icons-material/Sms";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import {
  calcSmsUnitsForBroadcast,
  calcSmsUnitsForMessage,
  getSmsFullText,
  SMS_CANCEL_SUFFIX,
  SMS_CHARS_PER_UNIT,
} from "@/app/lib/shopSms";

interface ShopSmsQuotaCardProps {
  /** برای برآورد ارسال گروهی */
  estimateMessage?: string;
  estimateRecipientCount?: number;
  compact?: boolean;
}

function pickQuotaValue(res: Record<string, unknown> | null): number {
  if (!res) return 0;
  const keys = ["shop_sms_quota", "quota", "balance", "remaining", "available"];
  for (const key of keys) {
    const v = res[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v !== "") {
      const n = parseInt(v, 10);
      if (!Number.isNaN(n)) return n;
    }
  }
  if (res.data && typeof res.data === "object") {
    return pickQuotaValue(res.data as Record<string, unknown>);
  }
  return 0;
}

export default function ShopSmsQuotaCard({
  estimateMessage = "",
  estimateRecipientCount = 0,
  compact = false,
}: ShopSmsQuotaCardProps) {
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState(0);
  const [serverEstimate, setServerEstimate] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = tokenCode();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        let value = 0;
        const quotaRes = await FetchWithJwtClient("GET", "/api/shop-sms-quota", token);
        if (quotaRes && !quotaRes.hasError) {
          value = pickQuotaValue(quotaRes);
        }
        if (value === 0) {
          const settingsRes = await FetchWithJwtClient("GET", "/api/settings", token);
          if (settingsRes && !settingsRes.hasError) {
            if (Array.isArray(settingsRes)) {
              const row = settingsRes.find(
                (s: { key?: string }) => s.key === "shop_sms_quota",
              );
              if (row?.value != null) value = parseInt(String(row.value), 10) || 0;
            } else {
              value = pickQuotaValue(settingsRes);
            }
          }
        }
        setQuota(value);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const localUnitsPerSms = useMemo(
    () => calcSmsUnitsForMessage(estimateMessage.trim()),
    [estimateMessage],
  );

  const localTotalUnits = useMemo(
    () => calcSmsUnitsForBroadcast(estimateMessage.trim(), estimateRecipientCount),
    [estimateMessage, estimateRecipientCount],
  );

  useEffect(() => {
    const runEstimate = async () => {
      if (!estimateMessage.trim() || estimateRecipientCount <= 0) {
        setServerEstimate(null);
        return;
      }
      const token = tokenCode();
      if (!token) return;
      const res = await FetchWithJwtClient("POST", "/api/shop-sms-quota/estimate", {
        message: estimateMessage.trim(),
        phones_count: estimateRecipientCount,
      });
      if (res && !res.hasError) {
        const units =
          typeof res.units === "number"
            ? res.units
            : typeof res.total_units === "number"
              ? res.total_units
              : localTotalUnits;
        setServerEstimate(units);
      } else {
        setServerEstimate(localTotalUnits);
      }
    };
    const t = setTimeout(runEstimate, 400);
    return () => clearTimeout(t);
  }, [estimateMessage, estimateRecipientCount, localTotalUnits]);

  const neededUnits = serverEstimate ?? localTotalUnits;
  const enough = quota >= neededUnits || neededUnits === 0;

  const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

  return (
    <Card
      sx={{
        backgroundColor: "#2b3143",
        borderRadius: "16px",
        border: `1px solid ${enough ? "rgba(120, 181, 104, 0.4)" : "rgba(255, 68, 68, 0.5)"}`,
        mb: compact ? 1 : 2,
      }}
    >
      <CardContent sx={{ py: compact ? 1.5 : 2, "&:last-child": { pb: compact ? 1.5 : 2 } }}>
        <Box sx={{ display: "flex",justifyContent:"space-between" , alignItems: "center", gap: 1, mb: 1 }}>
          
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: compact ? "14px" : "16px" }}>
          <SmsIcon sx={{ color: "#78b568" }} />
            اعتبار پیامک فروشگاه
          </Typography>
          <> 
         { loading ?  <CircularProgress size={22} sx={{ color: "#78b568" }} /> :
         <Typography sx={{ color: "#78b568", fontWeight: 700, fontSize: "18px" }}>
        
              {formatNumber(quota)}  پیامک 
            </Typography>
        }
          
          </>
         
        </Box>

        {loading ? (<></>
          // <CircularProgress size={22} sx={{ color: "#78b568" }} />
        ) : (
          <>
            
            

            {estimateMessage.trim() && estimateRecipientCount > 0 && (
              <Box
                sx={{
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
                  برآورد این ارسال:{" "}
                  <Box component="span" sx={{ color: "var(--admin-text)", fontWeight: 600 }}>
                    {formatNumber(neededUnits)} واحد
                  </Box>{" "}
                  ({formatNumber(estimateRecipientCount)} گیرنده × {formatNumber(localUnitsPerSms)}{" "}
                  واحد/نفر)
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", mt: 0.5 }}>
                  طول متن با پسوند: {getSmsFullText(estimateMessage.trim()).length} کاراکتر
                </Typography>
                {!enough && (
                  <Typography sx={{ color: "#ff9800", fontSize: "12px", mt: 1, fontWeight: 600 }}>
                    اعتبار کافی نیست. با ادمین برای شارژ تماس بگیرید.
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
