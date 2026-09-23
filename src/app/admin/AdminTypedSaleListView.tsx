"use client";

import { Box } from "@mui/material";
import SaleProductListPanel from "@/app/admin/SaleProductListPanel";
import AdminMenuModeCartPanel, {
  type AdminMenuModeCartPanelProps,
} from "@/app/admin/AdminMenuModeCartPanel";
import { ADMIN_TYPED_SALE_CART_WIDTH } from "@/app/admin/adminMenuCartLayout";
import type { CachedProduct } from "@/app/lib/productsCache";

type AdminTypedSaleListViewProps = {
  products: CachedProduct[];
  onAddProduct: (product: CachedProduct) => void;
  formatNumber: (num: number) => string;
  cartPanel: AdminMenuModeCartPanelProps;
};

export default function AdminTypedSaleListView({
  products,
  onAddProduct,
  formatNumber,
  cartPanel,
}: AdminTypedSaleListViewProps) {
  return (
    <Box
      sx={{
        position: "relative",
        height: { xs: "auto", md: "calc(100vh - 108px)" },
        minHeight: { xs: "calc(100vh - 170px)", md: "calc(100vh - 108px)" },
      }}
    >
      <AdminMenuModeCartPanel {...cartPanel} cartWidth={ADMIN_TYPED_SALE_CART_WIDTH} largerText />
      <SaleProductListPanel
        variant="typed"
        products={products}
        onAddProduct={onAddProduct}
        formatNumber={formatNumber}
      />
    </Box>
  );
}
