"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchAuditorShops, selectAuditorShop, type AuditorShop } from "@/app/lib/auditorSession";
import { getFirstAllowedAdminPath, getStoredUser, isShopAuditor } from "@/app/lib/shopPermissions";

const cardSx = {
  width: "100%",
  maxWidth: { xs: "100%", sm: "460px" },
  backgroundColor: "var(--admin-surface)",
  borderRadius: { xs: "16px", md: "20px" },
  padding: { xs: "16px", sm: "28px" },
  border: "1px solid var(--admin-border)",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
  boxSizing: "border-box",
} as const;

export default function AuditorSelectShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [shops, setShops] = useState<AuditorShop[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/admin/login");
      return;
    }
    if (!isShopAuditor(getStoredUser())) {
      router.replace(getFirstAllowedAdminPath());
      return;
    }
    void fetchAuditorShops().then(({ shops: list, currentAtelierId, error }) => {
      if (error) toast.error(error);
      setShops(list);
      setCurrentId(currentAtelierId);
      setLoading(false);
    });
  }, [router]);

  const choose = async (shop: AuditorShop) => {
    setSelectingId(shop.atelier_id);
    const { user, error } = await selectAuditorShop(shop.atelier_id);
    if (error || !user) {
      toast.error(error || "خطا در انتخاب فروشگاه");
      setSelectingId(null);
      return;
    }
    window.location.href = getFirstAllowedAdminPath(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("shop_access_expired");
    router.push("/admin/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        display: "flex",
        justifyContent: "center",
        alignItems: { xs: "flex-start", sm: "center" },
        p: { xs: "12px", sm: "24px" },
        pt: { xs: "40px", sm: "24px" },
        direction: "rtl",
        boxSizing: "border-box",
      }}
    >
      <Box sx={cardSx}>
        <Typography
          sx={{ fontWeight: 700, color: "var(--admin-text)", textAlign: "center", fontSize: { xs: "18px", md: "22px" } }}
        >
          انتخاب فروشگاه برای حسابرسی
        </Typography>


        {loading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : shops.length === 0 ? (
          <Typography sx={{ color: "var(--admin-text-muted)", textAlign: "center", fontSize: "14px", py: 2 }}>
            هیچ فروشگاهی برای حسابرسی به حساب شما وصل نیست.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {shops.map((shop) => {
              const isCurrent = shop.atelier_id === currentId;
              const busy = selectingId === shop.atelier_id;
              return (
                <Button
                  key={shop.atelier_id}
                  onClick={() => choose(shop)}
                  disabled={selectingId !== null}
                  sx={{
                    justifyContent: "space-between",
                    textTransform: "none",
                    borderRadius: "14px",
                    px: 2,
                    py: 1.5,
                    border: "1px solid",
                    borderColor: isCurrent ? "var(--admin-accent)" : "var(--admin-border)",
                    backgroundColor: "var(--admin-surface-alt)",
                    color: "var(--admin-text)",
                    "&:hover": { borderColor: "var(--admin-accent)", backgroundColor: "var(--admin-menu-hover)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                    <StorefrontIcon sx={{ color: "var(--admin-accent)" }} />
                    <Box sx={{ textAlign: "right", minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "15px", color: "var(--admin-text)" }}>
                        {shop.name || shop.code || `فروشگاه ${shop.atelier_id}`}
                      </Typography>
                      {!shop.shop_access_active ? (
                        <Typography sx={{ fontSize: "11px", color: "var(--admin-warning)" }}>
                          اشتراک این فروشگاه تمام شده است
                        </Typography>
                      ) : shop.code ? (
                        <Typography sx={{ fontSize: "11px", color: "var(--admin-text-muted)", direction: "ltr", textAlign: "right" }}>
                          {shop.code}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                  {busy ? (
                    <CircularProgress size={18} />
                  ) : isCurrent ? (
                    <CheckCircleIcon sx={{ color: "var(--admin-accent)", fontSize: 20 }} />
                  ) : null}
                </Button>
              );
            })}
          </Box>
        )}

        <Button
          onClick={logout}
          startIcon={<LogoutIcon />}
          fullWidth
          sx={{ mt: 3, color: "var(--admin-error)", textTransform: "none" }}
        >
          خروج از حساب
        </Button>
      </Box>

      <ToastContainer autoClose={3000} position="bottom-right" rtl />
    </Box>
  );
}
