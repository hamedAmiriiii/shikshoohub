"use client";

import { useEffect, useState } from "react";
import { Box, Typography, IconButton, Button } from "@mui/material";
import Image from "next/image";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { useRouter } from "next/navigation";
import {
  addToCart,
  isProductInCart,
  getCartItemQuantity,
  updateCartItemQuantity,
  removeFromCart,
} from "@/app/liberari/cart";
import { catalogProductHref } from "@/app/lib/catalogItems";
import { resolveMediaUrl } from "@/app/lib/onlineStorefront";

export type ShopProduct = {
  id: number;
  name: string;
  sale_price: number;
  purchase_price?: number;
  original_sale_price?: string | number;
  discount_percent?: number;
  has_discount?: boolean;
  image?: string;
  images?: Array<{ image_url?: string; image_path?: string }>;
  item_type?: string;
  produced_good_id?: number | null;
};

function formatNumber(num: number) {
  return new Intl.NumberFormat("fa-IR").format(num);
}

function getProductImage(product: ShopProduct): string {
  if (product.images?.length) {
    const first = product.images[0];
    const url = first.image_url || first.image_path || "";
    return resolveMediaUrl(url) || "/pic/nooImage.jfif";
  }
  return resolveMediaUrl(product.image) || "/pic/nooImage.jfif";
}

type Props = {
  product: ShopProduct;
  shopPath: (path?: string) => string;
  onNavigate?: (href: string) => void;
  primaryColor?: string;
  onCartChange?: () => void;
  priority?: boolean;
  compact?: boolean;
};

export default function ProductCard({
  product,
  shopPath,
  onNavigate,
  primaryColor = "var(--shop-primary, #ef4056)",
  onCartChange,
  priority = false,
  compact = false,
}: Props) {
  const router = useRouter();
  const [, setCartSync] = useState(0);
  useEffect(() => {
    const onCart = () => setCartSync((n) => n + 1);
    window.addEventListener("cartUpdated", onCart);
    return () => window.removeEventListener("cartUpdated", onCart);
  }, []);

  const salePrice = Number(product.sale_price) || 0;
  const originalRaw =
    product.original_sale_price != null ? Number(product.original_sale_price) : 0;
  const discount =
    product.discount_percent ||
    (originalRaw > salePrice ? Math.round(((originalRaw - salePrice) / originalRaw) * 100) : 0);
  const hasDiscount = discount > 0 && originalRaw > salePrice;
  const productImage = getProductImage(product);
  const inCart = isProductInCart(product);
  const cartQuantity = getCartItemQuantity(product);

  const bump = () => {
    window.dispatchEvent(new Event("cartUpdated"));
    onCartChange?.();
  };

  const goToProduct = () => {
    const href = catalogProductHref(product, shopPath);
    onNavigate?.(href);
    router.push(href);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      sale_price: salePrice,
      original_sale_price: product.original_sale_price as string | undefined,
      discount_percent: product.discount_percent,
      image: product.image,
      images: product.images as never,
      item_type: product.item_type,
      produced_good_id: product.produced_good_id,
    });
    bump();
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartQuantity > 1) updateCartItemQuantity(product, cartQuantity - 1);
    else removeFromCart(product);
    bump();
  };

  return (
    <Box
      onClick={goToProduct}
      sx={{
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
        borderRadius: compact ? "8px" : "10px",
        overflow: "hidden",
        border: "1px solid #f0f0f1",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", aspectRatio: "1", bgcolor: "#f5f5f5" }}>
        <Image
          src={productImage}
          alt={product.name}
          fill
          sizes={compact ? "170px" : "(max-width:600px) 50vw, 220px"}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          style={{ objectFit: "cover" }}
          unoptimized
        />
        {hasDiscount ? (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              bgcolor: primaryColor,
              color: "#fff",
              fontSize: compact ? 10 : 11,
              fontWeight: 800,
              px: 0.75,
              py: 0.25,
              borderRadius: "6px",
            }}
          >
            ٪{formatNumber(discount)}
          </Box>
        ) : null}
      </Box>
      <Box
        sx={{
          p: compact ? 1 : 1.25,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: compact ? 0.5 : 0.75,
        }}
      >
        <Typography
          sx={{
            fontSize: compact ? 12 : 13,
            fontWeight: 500,
            color: "#3f4064",
            lineHeight: 1.45,
            height: "2.9em",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {product.name}
        </Typography>
        <Box sx={{ mt: "auto" }}>
          {hasDiscount ? (
            <Typography sx={{ fontSize: 11, color: "#c0c2c5", textDecoration: "line-through" }}>
              {formatNumber(originalRaw)} تومان
            </Typography>
          ) : null}
          <Typography sx={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: "#3f4064" }}>
            {formatNumber(salePrice)}{" "}
            <Box component="span" sx={{ fontSize: 11, fontWeight: 500 }}>
              تومان
            </Box>
          </Typography>
        </Box>
        {inCart ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `1px solid ${primaryColor}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton size="small" onClick={handleIncrease} sx={{ color: primaryColor }}>
              <AddIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{formatNumber(cartQuantity)}</Typography>
            <IconButton size="small" onClick={handleDecrease} sx={{ color: primaryColor }}>
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Button
            size="small"
            fullWidth
            variant="outlined"
            startIcon={compact ? undefined : <AddShoppingCartIcon />}
            onClick={handleIncrease}
            sx={{
              borderColor: primaryColor,
              color: primaryColor,
              fontWeight: 700,
              fontSize: compact ? 11 : 12,
              minHeight: compact ? 32 : 36,
              borderRadius: "8px",
              "&:hover": { borderColor: primaryColor, bgcolor: "rgba(239, 64, 86, 0.06)" },
            }}
          >
            {compact ? "افزودن" : "افزودن به سبد"}
          </Button>
        )}
      </Box>
    </Box>
  );
}
