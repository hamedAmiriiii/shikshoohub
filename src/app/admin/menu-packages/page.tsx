"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import { formatToman } from "@/app/lib/atelierZarinpal";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

type MenuPackage = {
  id: number;
  slug: string;
  name: string;
  tag?: string | null;
  description?: string | null;
  price_toman: number;
  duration_days: number;
  popular?: boolean;
  price_overridden?: boolean;
};

function parsePackages(res: unknown): MenuPackage[] {
  const obj = res && typeof res === "object" ? (res as Record<string, unknown>) : null;
  const list = Array.isArray(obj?.data)
    ? obj.data
    : Array.isArray(obj?.shop_packages)
      ? obj.shop_packages
      : [];
  return list
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const slug = String(r.slug ?? "");
      if (!slug) return null;
      return {
        id: Number(r.id) || 0,
        slug,
        name: String(r.name ?? slug),
        tag: typeof r.tag === "string" ? r.tag : null,
        description: typeof r.description === "string" ? r.description : null,
        price_toman: Number(r.price_toman) || 0,
        duration_days: Number(r.duration_days) || 365,
        popular: Boolean(r.popular),
        price_overridden: Boolean(r.price_overridden),
      } satisfies MenuPackage;
    })
    .filter((x): x is MenuPackage => x != null);
}

export default function MenuPackagesManagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [rows, setRows] = useState<MenuPackage[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!isSuperAdminUser()) {
      toast.error("فقط ادمین پلتفرم به این صفحه دسترسی دارد.");
      router.replace("/admin");
      return;
    }
    setLoading(true);
    try {
      const token = await tokenCode();
      const res = await FetchWithJwtClient("Get", {}, {}, "/api/admin/shop-packages", true, false, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "بارگذاری پکیج‌ها ناموفق بود"));
        return;
      }
      const parsed = parsePackages(res);
      setRows(parsed);
      const next: Record<string, string> = {};
      for (const p of parsed) next[p.slug] = String(p.price_toman || "");
      setDrafts(next);
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (slug: string) => {
    const raw = (drafts[slug] ?? "").replace(/[^\d]/g, "");
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("قیمت معتبر وارد کنید (تومان)");
      return;
    }
    setSavingSlug(slug);
    try {
      const token = await tokenCode();
      const res = await FetchWithJwtClient(
        "Put",
        {},
        { price_toman: price },
        `/api/admin/shop-packages/${encodeURIComponent(slug)}`,
        true,
        false,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره قیمت ناموفق بود"));
        return;
      }
      toast.success("قیمت ذخیره شد");
      await load();
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <Box sx={adminPageSx}>
      <ToastContainer position="top-center" rtl autoClose={2800} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <RestaurantMenuIcon sx={{ color: "var(--admin-accent)" }} />
        <Box>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 800, fontSize: "20px" }}>
            پکیج‌های منوی دیجیتال
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px" }}>
            فقط قیمت را ویرایش کنید — امکانات هر پکیج ثابت است
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {rows.map((pkg) => {
            const draft = drafts[pkg.slug] ?? "";
            const dirty = String(pkg.price_toman) !== draft.replace(/[^\d]/g, "");
            return (
              <Card
                key={pkg.slug}
                sx={{
                  backgroundColor: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "16px",
                }}
              >
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 800 }}>
                      {pkg.name}
                      {pkg.popular ? (
                        <Typography component="span" sx={{ color: "var(--admin-accent)", fontSize: 12, mr: 1 }}>
                          {" "}
                          · پیشنهادی
                        </Typography>
                      ) : null}
                    </Typography>
                    {pkg.tag ? (
                      <Typography sx={{ color: "var(--admin-accent)", fontSize: 12, mt: 0.5 }}>
                        {pkg.tag}
                      </Typography>
                    ) : null}
                    {pkg.description ? (
                      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mt: 0.75, lineHeight: 1.7 }}>
                        {pkg.description}
                      </Typography>
                    ) : null}
                  </Box>

                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                    اعتبار: {pkg.duration_days} روز · قیمت فعلی: {formatToman(pkg.price_toman)}
                    {pkg.price_overridden ? " (ویرایش‌شده)" : ""}
                  </Typography>

                  <TextField
                    label="قیمت (تومان)"
                    value={draft}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [pkg.slug]: e.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    inputProps={{ inputMode: "numeric", dir: "ltr" }}
                    sx={fieldSx}
                    size="small"
                    fullWidth
                  />

                  <Button
                    variant="contained"
                    disabled={!dirty || savingSlug === pkg.slug}
                    onClick={() => void save(pkg.slug)}
                    sx={{
                      ...adminButtonStartIconSx,
                      bgcolor: "var(--admin-accent)",
                      "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                      fontWeight: 700,
                      alignSelf: "flex-start",
                    }}
                  >
                    {savingSlug === pkg.slug ? "…" : "ذخیره قیمت"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
