"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BeneficiarySelect from "@/app/admin/BeneficiarySelect";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import { isIranMobile, normalizeIranMobile } from "@/app/lib/purchaseReturns";
import type { Beneficiary } from "@/app/lib/beneficiaries";

export default function CustomerLedgerLookupPage() {
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState<number | "">("");
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);

  const phoneFromInput = useMemo(
    () => normalizeIranMobile(phoneInput),
    [phoneInput],
  );
  const phoneFromBeneficiary = useMemo(
    () => normalizeIranMobile(String(beneficiary?.phone || "")),
    [beneficiary],
  );

  const openHistory = (rawPhone: string) => {
    const phone = normalizeIranMobile(rawPhone);
    if (!isIranMobile(phone)) {
      toast.error("شماره موبایل معتبر وارد کنید (مثل ۰۹۱۳۳۹۹۱۵۱۸)");
      return;
    }
    router.push(`/admin/purchas/customer/${phone}`);
  };

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.5, md: 2.5 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="sm" sx={{ px: { xs: 1.25, md: 2 } }}>
        <ToastContainer autoClose={3000} position="bottom-right" rtl />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <PersonSearchIcon sx={{ color: "var(--admin-accent)", fontSize: 28 }} />
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "var(--admin-text)" }}>
              سابقه مشتری
            </Typography>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
              مشتری را پیدا کنید و گردش فروش، فاکتور و هزینه را ببینید
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text)", mb: 1 }}>
            جستجو با نام یا طرف‌حساب
          </Typography>
          <BeneficiarySelect
            value={beneficiaryId}
            onChange={(id, option) => {
              setBeneficiaryId(id);
              setBeneficiary(option);
              if (option?.phone && isIranMobile(normalizeIranMobile(option.phone))) {
                setPhoneInput(normalizeIranMobile(option.phone));
              }
            }}
            label="مشتری"
            helperText="نام یا شماره را تایپ کنید"
            allowRegister={false}
          />
          <Button
            fullWidth
            variant="contained"
            disabled={!isIranMobile(phoneFromBeneficiary)}
            onClick={() => openHistory(phoneFromBeneficiary)}
            sx={{
              ...adminButtonStartIconSx,
              mt: 1.5,
              bgcolor: "var(--admin-accent)",
              color: "var(--admin-on-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
          >
            مشاهده سابقه
          </Button>

          <Box
            sx={{
              my: 2.5,
              borderTop: "1px solid var(--admin-border)",
              position: "relative",
            }}
          >
            <Typography
              sx={{
                position: "absolute",
                top: -10,
                left: "50%",
                transform: "translateX(-50%)",
                px: 1,
                bgcolor: "var(--admin-surface)",
                fontSize: 11,
                color: "var(--admin-text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              یا با شماره موبایل
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="شماره موبایل"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") openHistory(phoneFromInput);
            }}
            placeholder="09133991518"
            inputProps={{ inputMode: "tel", dir: "ltr", style: { textAlign: "left" } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "var(--admin-surface-alt)",
                color: "var(--admin-text)",
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
              "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
            }}
          />
          <Button
            fullWidth
            variant="outlined"
            onClick={() => openHistory(phoneFromInput)}
            sx={{
              ...adminButtonStartIconSx,
              mt: 1.5,
              color: "var(--admin-text)",
              borderColor: "var(--admin-border)",
            }}
          >
            برو به سابقه مشتری
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
