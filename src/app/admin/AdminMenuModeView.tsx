"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardActionArea,
  CardContent,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import type { CachedProduct } from "@/app/lib/productsCache";
import {
  MENU_ALL_CATEGORY_ID,
  buildMenuCategories,
  filterProductsByMenuCategory,
  getProductImageUrl,
} from "@/app/lib/menuModeProducts";
import AdminMenuModeCartPanel, {
  type AdminMenuModeCartPanelProps,
} from "@/app/admin/AdminMenuModeCartPanel";
import AdminClassicPosView from "@/app/admin/AdminClassicPosView";
import AdminMenuTableOrdersPopup from "@/app/admin/table-orders/AdminMenuTableOrdersPopup";

function normalizeSearchText(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return value
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (c) => String(persianDigits.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(arabicDigits.indexOf(c)));
}

type AdminMenuModeViewProps = {
  products: CachedProduct[];
  onAddProduct: (product: CachedProduct) => void;
  formatNumber: (num: number) => string;
  cartPanel: AdminMenuModeCartPanelProps;
  classicPosMode?: boolean;
};

export default function AdminMenuModeView({
  products,
  onAddProduct,
  formatNumber,
  cartPanel,
  classicPosMode = false,
}: AdminMenuModeViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(MENU_ALL_CATEGORY_ID);
  const [search, setSearch] = useState("");

  const categories = useMemo(() => buildMenuCategories(products), [products]);

  const filteredProducts = useMemo(() => {
    const byCategory = filterProductsByMenuCategory(products, selectedCategoryId);
    const query = normalizeSearchText(search);
    if (!query) return byCategory;
    return byCategory.filter((product) => {
      const name = normalizeSearchText(product.name || "");
      const barcode = normalizeSearchText(product.barcode || "");
      return name.includes(query) || barcode.includes(query);
    });
  }, [products, selectedCategoryId, search]);

  const productBrowser = (
    <Box
      sx={
        classicPosMode
          ? { height: "100%", minHeight: 0, overflow: "auto", pr: { md: 0.5 } }
          : undefined
      }
    >
      <TextField
        size="small"
        fullWidth
        placeholder="جستجو..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "var(--admin-text-muted)", fontSize: 16 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            bgcolor: "var(--admin-surface)",
            color: "var(--admin-text)",
            fontSize: "11px",
            minHeight: 32,
            "& fieldset": { borderColor: "var(--admin-border)" },
            "&:hover fieldset": { borderColor: "var(--admin-accent)" },
            "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
          },
          "& .MuiInputBase-input": { fontSize: "11px", py: 0.75 },
        }}
      />

      {categories.length > 1 && (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            overflowX: "auto",
            pb: 0.75,
            mb: 1,
            "&::-webkit-scrollbar": { height: 4 },
          }}
        >
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={`${category.name} (${category.count})`}
              size="small"
              clickable
              onClick={() => setSelectedCategoryId(category.id)}
              sx={{
                flexShrink: 0,
                height: 24,
                fontSize: "10px",
                fontWeight: 600,
                bgcolor:
                  selectedCategoryId === category.id
                    ? "var(--admin-accent)"
                    : "var(--admin-surface)",
                color:
                  selectedCategoryId === category.id ? "#fff" : "var(--admin-text)",
                border: "1px solid var(--admin-accent-border)",
              }}
            />
          ))}
        </Box>
      )}

      {filteredProducts.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 6,
            px: 2,
            borderRadius: "10px",
            border: "1px dashed var(--admin-border)",
            bgcolor: "var(--admin-surface)",
          }}
        >
          <Inventory2OutlinedIcon sx={{ fontSize: 32, color: "var(--admin-text-muted)", mb: 0.5 }} />
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "11px" }}>
            {products.length === 0
              ? "کالایی در حافظه محلی نیست"
              : "کالایی یافت نشد"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={0.75}>
          {filteredProducts.map((product) => {
            const imageUrl = getProductImageUrl(product);
            const price = Number(product.sale_price) || 0;

            return (
              <Grid item xs={4} sm={3} md={2} lg={2} key={product.id}>
                <Card
                  sx={{
                    borderRadius: "8px",
                    border: "1px solid var(--admin-accent-border)",
                    bgcolor: "var(--admin-surface)",
                    overflow: "hidden",
                    "&:hover": { borderColor: "var(--admin-accent)" },
                  }}
                >
                  <CardActionArea onClick={() => onAddProduct(product)} sx={{ display: "block" }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: 52,
                        bgcolor: "var(--admin-surface-alt)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {imageUrl ? (
                        <Box
                          component="img"
                          src={imageUrl}
                          alt={product.name || "کالا"}
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Inventory2OutlinedIcon
                          sx={{ fontSize: 22, color: "var(--admin-text-muted)" }}
                        />
                      )}
                    </Box>
                    <CardContent sx={{ p: 0.5, "&:last-child": { pb: 0.5 } }}>
                      <Typography
                        sx={{
                          color: "var(--admin-text)",
                          fontWeight: 600,
                          fontSize: "9px",
                          lineHeight: 1.25,
                          minHeight: "2.5em",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.name || "—"}
                      </Typography>
                      <Typography
                        sx={{
                          color: "var(--admin-accent)",
                          fontWeight: 700,
                          fontSize: "9px",
                          mt: 0.25,
                        }}
                      >
                        {formatNumber(price)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );

  if (classicPosMode) {
    return (
      <Box sx={{ position: "relative" }}>
        <AdminMenuTableOrdersPopup />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 1,
            height: { xs: "auto", md: "calc(100vh - 140px)" },
            minHeight: { xs: "calc(100vh - 180px)", md: "calc(100vh - 140px)" },
            alignItems: "stretch",
          }}
        >
          <Box
            sx={{
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              order: { xs: 1, md: 0 },
            }}
          >
            {productBrowser}
          </Box>
          <Box
            sx={{
              minHeight: { xs: 360, md: 0 },
              height: { xs: "auto", md: "100%" },
              overflow: "hidden",
              order: { xs: 0, md: 0 },
            }}
          >
            <AdminClassicPosView
              cartPanel={cartPanel}
              compact
            />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      <AdminMenuTableOrdersPopup />
      <AdminMenuModeCartPanel {...cartPanel} />
      {productBrowser}
    </Box>
  );
}
