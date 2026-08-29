"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { getCachedProductDiscount, type CachedProduct } from "@/app/lib/productsCache";

function normalizeSearchText(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return value
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (c) => String(persianDigits.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(arabicDigits.indexOf(c)));
}

type SaleProductListPanelProps = {
  products: CachedProduct[];
  onAddProduct: (product: CachedProduct) => void;
  formatNumber: (num: number) => string;
  variant?: "embedded" | "floating";
};

export default function SaleProductListPanel({
  products,
  onAddProduct,
  formatNumber,
  variant = "floating",
}: SaleProductListPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const query = normalizeSearchText(search);
    if (!query) return products.slice(0, 80);
    return products
      .filter((product) => {
        const name = normalizeSearchText(product.name || "");
        const barcode = normalizeSearchText(product.barcode || "");
        return name.includes(query) || barcode.includes(query);
      })
      .slice(0, 80);
  }, [products, search]);

  const searchField = (
    <TextField
      size="small"
      fullWidth
      placeholder="جستجو نام یا بارکد..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "var(--admin-text-muted)", fontSize: 20 }} />
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "10px",
          bgcolor: "var(--admin-surface-alt)",
          color: "var(--admin-text)",
          fontSize: "13px",
          "& fieldset": { borderColor: "var(--admin-border)" },
          "&:hover fieldset": { borderColor: "var(--admin-accent)" },
          "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
        },
      }}
    />
  );

  const productList = (
    <List
      dense
      sx={{
        flex: 1,
        overflowY: "auto",
        py: 0,
        maxHeight: variant === "embedded" ? { xs: 280, sm: 320 } : undefined,
        "& .MuiListItem-root": {
          borderBottom: "1px solid var(--admin-divider)",
        },
      }}
    >
      {filteredProducts.length === 0 ? (
        <Box sx={{ py: 3, px: 2, textAlign: "center" }}>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px" }}>
            {products.length === 0 ? "کالایی در حافظه محلی نیست" : "نتیجه‌ای یافت نشد"}
          </Typography>
        </Box>
      ) : (
        filteredProducts.map((product) => {
          const { salePrice, originalPrice, hasDiscount } = getCachedProductDiscount(product);
          return (
          <ListItem
            key={product.id}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => onAddProduct(product)}
                sx={{
                  color: "var(--admin-accent)",
                  bgcolor: "rgba(120, 181, 104, 0.12)",
                  "&:hover": { bgcolor: "rgba(120, 181, 104, 0.22)" },
                }}
                aria-label="افزودن به سبد"
              >
                <AddShoppingCartIcon fontSize="small" />
              </IconButton>
            }
            sx={{ alignItems: "flex-start", py: 1 }}
          >
            <ListItemText
              primary={product.name || "بدون نام"}
              secondary={
                <Box component="span" sx={{ display: "block", mt: 0.25 }}>
                  {hasDiscount ? (
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "baseline", gap: 0.75, flexWrap: "wrap" }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          color: "var(--admin-text-muted)",
                          fontSize: "11px",
                          textDecoration: "line-through",
                        }}
                      >
                        {formatNumber(originalPrice)} تومان
                      </Typography>
                      <Typography
                        component="span"
                        sx={{ color: "var(--admin-accent)", fontSize: "12px", fontWeight: 600 }}
                      >
                        {formatNumber(salePrice)} تومان
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      component="span"
                      sx={{ color: "var(--admin-accent)", fontSize: "12px", fontWeight: 600 }}
                    >
                      {formatNumber(salePrice)} تومان
                    </Typography>
                  )}
                  {product.barcode && (
                    <Typography
                      component="span"
                      sx={{
                        display: "block",
                        color: "var(--admin-text-muted)",
                        fontSize: "10px",
                        mt: 0.25,
                      }}
                    >
                      {product.barcode}
                    </Typography>
                  )}
                </Box>
              }
              primaryTypographyProps={{
                sx: {
                  color: "var(--admin-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: 1.4,
                },
              }}
            />
          </ListItem>
          );
        })
      )}
    </List>
  );

  if (variant === "embedded") {
    return (
      <Card
        sx={{
          height: "100%",
          background: "var(--admin-dashboard-card-bg)",
          borderRadius: { xs: "16px", md: "20px" },
          border: "1px solid var(--admin-accent-border)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ padding: { xs: "16px", md: "20px" }, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: { xs: 1.5, md: 2 } }}>
            <Inventory2Icon sx={{ color: "var(--admin-accent)", fontSize: { xs: 22, md: 26 } }} />
            <Box>
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: "15px", md: "17px" } }}>
                لیست کالا
              </Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "11px", md: "12px" } }}>
                {products.length > 0
                  ? `${products.length} کالا از حافظه محلی · جستجو و افزودن به سبد`
                  : "کالایی در حافظه محلی نیست"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 1.25 }}>{searchField}</Box>
          {productList}
        </CardContent>
      </Card>
    );
  }

  if (!expanded) {
    return (
      <Button
        onClick={() => setExpanded(true)}
        startIcon={<Inventory2Icon />}
        sx={{
          position: "fixed",
          left: 24,
          bottom: 100,
          zIndex: 1100,
          borderRadius: "24px",
          px: 2,
          py: 1,
          bgcolor: "var(--admin-surface)",
          color: "var(--admin-text)",
          border: "1px solid var(--admin-accent-border)",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          "&:hover": {
            bgcolor: "var(--admin-menu-hover)",
          },
        }}
      >
        لیست کالا
      </Button>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        left: 24,
        bottom: 100,
        width: 340,
        maxHeight: "58vh",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--admin-surface)",
        border: "1px solid var(--admin-accent-border)",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          borderBottom: "1px solid var(--admin-border)",
          bgcolor: "var(--admin-surface-alt)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Inventory2Icon sx={{ color: "var(--admin-accent)", fontSize: 20 }} />
          <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", fontWeight: 700 }}>
            لیست کالا
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "11px" }}>
            ({products.length})
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => setExpanded(false)}
          sx={{ color: "var(--admin-text-muted)" }}
          aria-label="بستن لیست کالا"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 1.25, borderBottom: "1px solid var(--admin-border)" }}>{searchField}</Box>
      {productList}
    </Box>
  );
}
