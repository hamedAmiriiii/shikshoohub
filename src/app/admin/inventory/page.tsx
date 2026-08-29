"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Box, Typography, Paper, Grid, CircularProgress } from "@mui/material";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import KitchenIcon from "@mui/icons-material/Kitchen";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";

type InventoryTotals = {
  total_purchase_value: number;
  total_sale_value: number;
  stock_kg?: number;
};

function asMoney(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asInventory(raw: unknown): InventoryTotals | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  return {
    total_purchase_value: asMoney(row.total_purchase_value),
    total_sale_value: asMoney(row.total_sale_value),
    stock_kg: row.stock_kg == null ? undefined : asMoney(row.stock_kg),
  };
}

function hasRawMaterialsBlock(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const row = raw as Record<string, unknown>;
  if (Array.isArray(row.raw_materials) && row.raw_materials.length > 0) return true;
  return asMoney(row.total_purchase_value) > 0 || asMoney(row.stock_kg) > 0;
}

const formatNumber = (num: number) => new Intl.NumberFormat("fa-IR").format(num);

function profitOf(inv: InventoryTotals) {
  return inv.total_sale_value - inv.total_purchase_value;
}

function profitPercent(inv: InventoryTotals) {
  if (!inv.total_purchase_value) return "0";
  return ((profitOf(inv) / inv.total_purchase_value) * 100).toFixed(1);
}

function StatCard({
  title,
  value,
  hint,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  gradient: string;
}) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Paper
        elevation={0}
        sx={{
          padding: "18px",
          background: gradient,
          borderRadius: "14px",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25 }}>
            <Typography sx={{ color: "var(--admin-text)", fontSize: 14, fontWeight: 700 }}>
              {title}
            </Typography>
            <Box
              sx={{
                backgroundColor: "var(--admin-icon-bg)",
                borderRadius: "8px",
                p: 0.75,
                display: "flex",
                alignItems: "center",
              }}
            >
              {icon}
            </Box>
          </Box>
          <Typography sx={{ color: "var(--admin-text)", fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>
            {value}
          </Typography>
          <Typography sx={{ color: "var(--admin-text)", fontSize: 12, mt: 0.25 }}>تومان</Typography>
          {hint ? (
            <Typography sx={{ color: "var(--admin-text)", fontSize: 12, mt: 0.75, opacity: 0.9 }}>
              {hint}
            </Typography>
          ) : null}
        </Box>
      </Paper>
    </Grid>
  );
}

function InventorySection({
  title,
  subtitle,
  inventory,
  icon,
}: {
  title: string;
  subtitle: string;
  inventory: InventoryTotals;
  icon: ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        {icon}
        <Box>
          <Typography sx={{ color: "var(--admin-text)", fontSize: 16, fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>{subtitle}</Typography>
        </Box>
      </Box>
      <Grid container spacing={2}>
        <StatCard
          title="قیمت خرید کل"
          value={formatNumber(inventory.total_purchase_value)}
          icon={<AttachMoneyIcon sx={{ color: "var(--admin-text)", fontSize: 20 }} />}
          gradient="linear-gradient(135deg, var(--admin-accent) 0%, var(--admin-accent-hover) 100%)"
        />
        <StatCard
          title="قیمت فروش کل"
          value={formatNumber(inventory.total_sale_value)}
          icon={<TrendingUpIcon sx={{ color: "var(--admin-text)", fontSize: 20 }} />}
          gradient="linear-gradient(135deg, #ff9100 0%, #ff6f00 100%)"
        />
        <StatCard
          title="سود احتمالی"
          value={formatNumber(profitOf(inventory))}
          hint={`${profitPercent(inventory)}٪`}
          icon={<InventoryIcon sx={{ color: "var(--admin-text)", fontSize: 20 }} />}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
      </Grid>
    </Box>
  );
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [goods, setGoods] = useState<InventoryTotals | null>(null);
  const [materials, setMaterials] = useState<InventoryTotals | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      const token = tokenCode();
      try {
        const res = await apiRequestError("Get", {}, {}, "/api/reports", true, true, token);
        if (res.hasError) {
          let message = "خطا در دریافت موجودی انبار";
          try {
            message = JSON.parse(res.errorText).message || message;
          } catch {
            /* keep default */
          }
          toast.error(message);
          return;
        }

        const productsInventory = asInventory(res.products_inventory ?? res.inventory);
        setGoods(productsInventory);

        const rawBlock = res.raw_materials_inventory;
        setMaterials(hasRawMaterialsBlock(rawBlock) ? asInventory(rawBlock) : null);
      } catch {
        toast.error("خطا در دریافت موجودی انبار");
      } finally {
        setLoading(false);
      }
    };

    void fetchInventory();
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        direction: "rtl",
        padding: "16px",
        paddingBottom: "100px",
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
      }}
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : goods || materials ? (
        <>
          {goods ? (
            <InventorySection
              title="موجودی انبار کالا"
              subtitle="کالاهای کاتالوگ با موجودی مثبت و باقی‌مانده کالای تولیدی"
              inventory={goods}
              icon={<PrecisionManufacturingIcon sx={{ color: "var(--admin-accent)" }} />}
            />
          ) : null}
          {materials ? (
            <InventorySection
              title="موجودی مواد اولیه"
              subtitle={
                materials.stock_kg != null
                  ? `لات‌های باز · ${formatNumber(materials.stock_kg)} کیلو`
                  : "لات‌های باز مواد اولیه — جدا از موجودی کالا"
              }
              inventory={materials}
              icon={<KitchenIcon sx={{ color: "var(--admin-accent)" }} />}
            />
          ) : null}
        </>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Typography sx={{ color: "var(--admin-text)", fontSize: 16 }}>
            داده‌ای برای نمایش وجود ندارد
          </Typography>
        </Box>
      )}

      <ToastContainer autoClose={3000} style={{ marginBottom: "76px", borderRadius: "15px" }} position="bottom-right" />
    </Box>
  );
}
