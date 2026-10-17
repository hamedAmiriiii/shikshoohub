"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Paper,
  Chip,
  Breadcrumbs,
  Link,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Divider,
} from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError";
import Image from "next/image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HomeIcon from "@mui/icons-material/Home";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  addToCart,
  isProductInCart,
  getCartItemQuantity,
  updateCartItemQuantity,
  removeFromCart,
  type CartProductInput,
} from "../../liberari/cart";
import { findColorByName, isLightColor } from "../../liberari/colors";
import { resolveCategoryImageUrl } from "../../lib/shopCategories";
import { resolveMediaUrl } from "@/app/lib/onlineStorefront";
import { useShopContext, useShopStorefront } from "../../context/ShopContext";

interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  image_url: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  image?: string | null;
  image_url?: string | null;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  sale_price: string;
  original_sale_price?: string;
  purchase_price?: string;
  discount_percent?: number;
  discount_amount?: number;
  has_discount?: boolean;
  image?: string;
  images?: ProductImage[];
  categories?: Category[];
  stock?: number;
  sku?: string;
  brand?: string;
  sizes?: string[];
  colors?: string[];
  item_type?: string;
  produced_good_id?: number | null;
}

const PRIMARY = "var(--shop-primary, #ef4056)";
const PAGE_BG = "#f0f0f1";

function formatPrice(price: string | number): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("fa-IR").format(numPrice);
}

function resolveProductImageUrl(url: string | undefined | null): string {
  if (!url) return "/pic/nooImage.jfif";
  return resolveMediaUrl(url) || "/pic/nooImage.jfif";
}

function getProductImages(product: Product): string[] {
  if (product.images && product.images.length > 0) {
    return product.images.map((img) => resolveProductImageUrl(img.image_url));
  }
  if (product.image) {
    return [resolveProductImageUrl(product.image)];
  }
  return ["/pic/nooImage.jfif"];
}

function buildCartInput(
  product: Product,
  itemType: string | null,
  selectedSize: string | null,
  selectedColor: string | null,
): CartProductInput {
  return {
    id: product.id,
    name: product.name,
    sale_price: product.sale_price,
    original_sale_price: product.original_sale_price,
    discount_percent: product.discount_percent,
    image: product.image,
    images: product.images,
    size: selectedSize || null,
    color: selectedColor || null,
    item_type: itemType === "produced_good" ? "produced_good" : product.item_type,
    produced_good_id:
      product.produced_good_id ??
      (itemType === "produced_good" ? Number(product.id) : null),
  };
}

function computeDiscount(product: Product) {
  const hasDiscount =
    product.has_discount ||
    (product.original_sale_price &&
      parseFloat(product.original_sale_price) > parseFloat(product.sale_price));
  const discountPercent =
    product.discount_percent ||
    (product.original_sale_price
      ? Math.round(
          ((parseFloat(product.original_sale_price) - parseFloat(product.sale_price)) /
            parseFloat(product.original_sale_price)) *
            100,
        )
      : 0);
  return { hasDiscount, discountPercent };
}

function ProductDetailSkeleton() {
  return (
    <Box sx={{ bgcolor: PAGE_BG, minHeight: "100vh", py: { xs: 0, md: 3 } }}>
      <Container maxWidth="lg">
        <Skeleton
          variant="rounded"
          height={48}
          sx={{ display: { xs: "none", md: "block" }, mb: 2, borderRadius: 2 }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <Skeleton variant="rounded" sx={{ pt: "100%", borderRadius: { xs: 0, md: 2 } }} />
          <Box>
            <Skeleton height={32} width="90%" sx={{ mb: 2 }} />
            <Skeleton height={24} width="40%" sx={{ mb: 3 }} />
            <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={180} />
          </Box>
        </Box>
        <Skeleton variant="rounded" height={200} sx={{ mt: 3, display: { xs: "none", md: "block" } }} />
      </Container>
    </Box>
  );
}

function CartQuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  compact,
}: {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  compact?: boolean;
}) {
  const btn = compact ? 36 : 44;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        border: `1px solid ${PRIMARY}`,
        borderRadius: 2,
        p: 0.5,
        bgcolor: "#fff",
      }}
    >
      <IconButton
        onClick={onDecrease}
        size="small"
        sx={{
          width: btn,
          height: btn,
          border: "1px solid #e0e0e6",
          borderRadius: 1.5,
        }}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography
        sx={{
          minWidth: 32,
          textAlign: "center",
          fontWeight: 700,
          fontSize: compact ? 16 : 18,
          color: PRIMARY,
        }}
      >
        {quantity}
      </Typography>
      <IconButton
        onClick={onIncrease}
        size="small"
        sx={{
          width: btn,
          height: btn,
          bgcolor: PRIMARY,
          color: "#fff",
          borderRadius: 1.5,
          "&:hover": { bgcolor: PRIMARY, opacity: 0.9 },
        }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

function PriceBlock({
  product,
  hasDiscount,
  discountPercent,
  size = "large",
}: {
  product: Product;
  hasDiscount: boolean;
  discountPercent: number;
  size?: "large" | "compact";
}) {
  const mainSize = size === "large" ? 28 : 20;
  return (
    <Box>
      {hasDiscount && discountPercent > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Chip
            label={`${discountPercent}%`}
            size="small"
            sx={{
              height: 22,
              fontWeight: 700,
              bgcolor: PRIMARY,
              color: "#fff",
              fontSize: 11,
            }}
          />
          {product.original_sale_price && (
            <Typography
              sx={{
                fontSize: 12,
                color: "#81858b",
                textDecoration: "line-through",
              }}
            >
              {formatPrice(product.original_sale_price)}
            </Typography>
          )}
        </Box>
      )}
      <Typography sx={{ fontSize: mainSize, fontWeight: 700, color: "#232933" }}>
        {formatPrice(product.sale_price)}
        <Typography component="span" sx={{ fontSize: 13, fontWeight: 400, color: "#81858b", mr: 0.5 }}>
          تومان
        </Typography>
      </Typography>
    </Box>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { primaryColor, shopDisplayName } = useShopContext();
  const { shopPath, shopApi } = useShopStorefront();
  const productId = params?.id as string;
  const itemType = searchParams.get("item_type");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(true);
  const [showReturnGuide, setShowReturnGuide] = useState(false);
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const qs = itemType === "produced_good" ? "?item_type=produced_good" : "";
      const res = await apiRequestError(
        "Get",
        {},
        {},
        shopApi(`/api/product/${productId}${qs}`),
        false,
        false,
        "",
      );
      if (!res.hasError && res) {
        setProduct(res);
        if (res.sizes?.length) setSelectedSize(res.sizes[0]);
        if (res.colors?.length) setSelectedColor(res.colors[0]);
        setCurrentImageIndex(0);
      } else {
        setProduct(null);
      }
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, itemType, shopApi]);

  useEffect(() => {
    if (productId) void fetchProduct();
  }, [productId, fetchProduct]);

  const images = useMemo(
    () => (product ? getProductImages(product) : ["/pic/nooImage.jfif"]),
    [product],
  );

  const cartInput = useMemo(
    () =>
      product
        ? buildCartInput(product, itemType, selectedSize, selectedColor)
        : null,
    [product, itemType, selectedSize, selectedColor],
  );

  const inCart = cartInput ? isProductInCart(cartInput) : false;
  const cartQuantity = cartInput ? getCartItemQuantity(cartInput) : 0;
  void cartUpdateTrigger;

  const bumpCart = () => {
    window.dispatchEvent(new Event("cartUpdated"));
    setCartUpdateTrigger((n) => n + 1);
  };

  const handleAddToCart = () => {
    if (!cartInput) return;
    addToCart(cartInput);
    bumpCart();
  };

  const handleIncreaseQuantity = () => {
    if (!cartInput) return;
    addToCart(cartInput);
    bumpCart();
  };

  const handleDecreaseQuantity = () => {
    if (!cartInput) return;
    const qty = getCartItemQuantity(cartInput);
    if (qty > 1) updateCartItemQuantity(cartInput, qty - 1);
    else removeFromCart(cartInput);
    bumpCart();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentImageIndex < images.length - 1) {
        setCurrentImageIndex((i) => i + 1);
      } else if (diff < 0 && currentImageIndex > 0) {
        setCurrentImageIndex((i) => i - 1);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({ title: product.name, url: window.location.href });
      } catch {
        /* cancelled */
      }
    }
  };

  const outOfStock =
    product?.stock !== undefined && product.stock !== null && product.stock <= 0;

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h6" sx={{ color: "#81858b", mb: 2 }}>
          محصول یافت نشد
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push(shopPath(""))}
          sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: PRIMARY, opacity: 0.92 } }}
        >
          بازگشت به {shopDisplayName}
        </Button>
      </Container>
    );
  }

  const { hasDiscount, discountPercent } = computeDiscount(product);
  const primaryCategory = product.categories?.[0];

  return (
    <Box
      sx={{
        bgcolor: PAGE_BG,
        minHeight: "100vh",
        pb: { xs: 12, md: 4 },
        "--shop-primary": primaryColor,
      }}
    >
      {/* Mobile top bar */}
      <Paper
        elevation={0}
        square
        sx={{
          display: { xs: "flex", md: "none" },
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 0.5,
          position: "sticky",
          top: 0,
          zIndex: 110,
          borderBottom: "1px solid #e0e0e6",
        }}
      >
        <IconButton onClick={() => router.back()} aria-label="بازگشت">
          <ArrowBackIcon sx={{ transform: "rotate(180deg)" }} />
        </IconButton>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>جزئیات محصول</Typography>
        <Box>
          <IconButton onClick={() => setIsFavorite(!isFavorite)} size="small">
            {isFavorite ? (
              <FavoriteIcon sx={{ color: PRIMARY }} />
            ) : (
              <FavoriteBorderIcon />
            )}
          </IconButton>
          <IconButton onClick={handleShare} size="small">
            <ShareIcon />
          </IconButton>
        </Box>
      </Paper>

      <Container maxWidth="lg" sx={{ px: { xs: 0, md: 2 }, py: { md: 2 } }}>
        {/* Breadcrumbs — desktop */}
        <Paper
          elevation={0}
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            px: 2,
            py: 1.5,
            mb: 2,
            borderRadius: 2,
            border: "1px solid #e0e0e6",
          }}
        >
          <Breadcrumbs
            separator={<NavigateBeforeIcon sx={{ fontSize: 16, color: "#a1a3a8" }} />}
          >
            <Link
              component="button"
              type="button"
              onClick={() => router.push(shopPath(""))}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "#62666d",
                fontSize: 13,
                textDecoration: "none",
                "&:hover": { color: PRIMARY },
              }}
            >
              <HomeIcon sx={{ fontSize: 18 }} />
              {shopDisplayName}
            </Link>
            {primaryCategory && (
              <Link
                component="button"
                type="button"
                onClick={() => router.push(shopPath(`category/${primaryCategory.id}`))}
                sx={{
                  color: "#62666d",
                  fontSize: 13,
                  textDecoration: "none",
                  "&:hover": { color: PRIMARY },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {resolveCategoryImageUrl(primaryCategory) && (
                    <Box
                      component="img"
                      src={resolveCategoryImageUrl(primaryCategory) || ""}
                      alt=""
                      sx={{ width: 18, height: 18, borderRadius: 0.5, objectFit: "cover" }}
                    />
                  )}
                  {primaryCategory.name}
                </Box>
              </Link>
            )}
            <Typography sx={{ fontSize: 13, color: "#232933", fontWeight: 500 }}>
              {product.name.length > 50 ? `${product.name.slice(0, 50)}…` : product.name}
            </Typography>
          </Breadcrumbs>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
            gap: { xs: 0, md: 2 },
            alignItems: "start",
          }}
        >
          {/* Gallery — first in DOM → visually right in RTL */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: { xs: 0, md: 2 },
              overflow: "hidden",
              border: { md: "1px solid #e0e0e6" },
              bgcolor: "#fff",
              p: { xs: 0, md: 2 },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
              {/* Vertical thumbnails (desktop, RTL: on the right) */}
              {images.length > 1 && (
                <Box
                  sx={{
                    display: { xs: "none", md: "flex" },
                    flexDirection: "column",
                    gap: 1,
                    width: 72,
                    flexShrink: 0,
                    maxHeight: 480,
                    overflowY: "auto",
                  }}
                >
                  {images.map((img, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      sx={{
                        position: "relative",
                        width: 68,
                        height: 68,
                        flexShrink: 0,
                        borderRadius: 1,
                        overflow: "hidden",
                        cursor: "pointer",
                        border:
                          index === currentImageIndex
                            ? `2px solid ${PRIMARY}`
                            : "1px solid #e0e0e6",
                      }}
                    >
                      <Image
                        src={img}
                        alt=""
                        fill
                        sizes="68px"
                        style={{ objectFit: "contain" }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  sx={{
                    position: "relative",
                    width: "100%",
                    pt: { xs: "100%", md: "85%" },
                    bgcolor: "#fff",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      transition: "transform 0.3s ease",
                      transform: `translateX(${-currentImageIndex * 100}%)`,
                    }}
                  >
                    {images.map((img, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          minWidth: "100%",
                          height: "100%",
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} - ${index + 1}`}
                          fill
                          sizes="(max-width: 900px) 100vw, 45vw"
                          style={{ objectFit: "contain", padding: 12 }}
                          priority={index === 0}
                        />
                      </Box>
                    ))}
                  </Box>

                  {hasDiscount && discountPercent > 0 && (
                    <Chip
                      label={`${discountPercent}%`}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        bgcolor: PRIMARY,
                        color: "#fff",
                        fontWeight: 700,
                        zIndex: 2,
                      }}
                    />
                  )}

                  {images.length > 1 && (
                    <>
                      <IconButton
                        onClick={() =>
                          setCurrentImageIndex((i) => Math.min(i + 1, images.length - 1))
                        }
                        disabled={currentImageIndex >= images.length - 1}
                        sx={{
                          position: "absolute",
                          left: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(255,255,255,0.95)",
                          boxShadow: 1,
                          zIndex: 3,
                          "&:disabled": { opacity: 0.35 },
                        }}
                        size="small"
                      >
                        <ChevronLeftIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => setCurrentImageIndex((i) => Math.max(i - 1, 0))}
                        disabled={currentImageIndex <= 0}
                        sx={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(255,255,255,0.95)",
                          boxShadow: 1,
                          zIndex: 3,
                          "&:disabled": { opacity: 0.35 },
                        }}
                        size="small"
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </>
                  )}
                </Box>

                {images.length > 1 && (
                  <Box
                    sx={{
                      display: { xs: "flex", md: "none" },
                      gap: 1,
                      px: 2,
                      py: 1.5,
                      overflowX: "auto",
                    }}
                  >
                    {images.map((img, index) => (
                      <Box
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        sx={{
                          position: "relative",
                          width: 56,
                          height: 56,
                          flexShrink: 0,
                          borderRadius: 1,
                          overflow: "hidden",
                          border:
                            index === currentImageIndex
                              ? `2px solid ${PRIMARY}`
                              : "1px solid #e0e0e6",
                        }}
                      >
                        <Image src={img} alt="" fill sizes="56px" style={{ objectFit: "cover" }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Buy box — second column, sticky on desktop */}
          <Box sx={{ position: { md: "sticky" }, top: { md: 16 } }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: { xs: "16px 16px 0 0", md: 2 },
                mt: { xs: -2, md: 0 },
                p: { xs: 2, md: 2.5 },
                border: { md: "1px solid #e0e0e6" },
                bgcolor: "#fff",
                position: "relative",
                zIndex: 5,
              }}
            >
              {primaryCategory && (
                <Typography
                  sx={{
                    display: { xs: "block", md: "none" },
                    fontSize: 11,
                    color: PRIMARY,
                    mb: 1,
                  }}
                >
                  {product.categories!.map((c) => c.name).join(" / ")}
                </Typography>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: 16, md: 20 },
                    fontWeight: 700,
                    color: "#232933",
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  {product.name}
                </Typography>
                <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, flexShrink: 0 }}>
                  <IconButton size="small" onClick={() => setIsFavorite(!isFavorite)}>
                    {isFavorite ? (
                      <FavoriteIcon sx={{ color: PRIMARY, fontSize: 22 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                    )}
                  </IconButton>
                  <IconButton size="small" onClick={handleShare}>
                    <ShareIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                </Box>
              </Box>

              {(product.brand || product.sku || product.stock !== undefined) && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {product.brand && (
                    <Typography sx={{ fontSize: 12, color: "#62666d" }}>
                      برند: <strong>{product.brand}</strong>
                    </Typography>
                  )}
                  {product.sku && (
                    <Typography sx={{ fontSize: 12, color: "#81858b" }}>
                      کد: {product.sku}
                    </Typography>
                  )}
                  {product.stock !== undefined && product.stock !== null && (
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: outOfStock ? "#d32f2f" : "#2e7b32",
                        fontWeight: 600,
                      }}
                    >
                      {outOfStock ? "ناموجود" : `موجود در انبار (${product.stock})`}
                    </Typography>
                  )}
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              {product.sizes && product.sizes.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: "#232933" }}>
                    سایز
                    {selectedSize && (
                      <Typography component="span" sx={{ fontWeight: 400, color: "#81858b", mr: 1 }}>
                        : {selectedSize}
                      </Typography>
                    )}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {product.sizes.map((size) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "contained" : "outlined"}
                        onClick={() => setSelectedSize(size)}
                        sx={{
                          minWidth: 48,
                          height: 40,
                          borderRadius: 1,
                          fontWeight: 600,
                          boxShadow: "none",
                          bgcolor: selectedSize === size ? "#232933" : "transparent",
                          color: selectedSize === size ? "#fff" : "#424750",
                          borderColor: selectedSize === size ? "#232933" : "#e0e0e6",
                          "&:hover": {
                            bgcolor: selectedSize === size ? "#424750" : "#f5f5f5",
                            boxShadow: "none",
                          },
                        }}
                      >
                        {size}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}

              {product.colors && product.colors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: "#232933" }}>
                    رنگ
                    {selectedColor && (
                      <Typography component="span" sx={{ fontWeight: 400, color: "#81858b", mr: 1 }}>
                        : {selectedColor}
                      </Typography>
                    )}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {product.colors.map((color) => {
                      const colorInfo = findColorByName(color);
                      const isSelected = selectedColor === color;
                      const bg = colorInfo?.hex;
                      let textColor = "#424750";
                      if (isSelected && bg) {
                        textColor = isLightColor(bg) ? "#000" : "#fff";
                      } else if (bg) {
                        textColor = isLightColor(bg) ? "#000" : "#fff";
                      }

                      return (
                        <Button
                          key={color}
                          variant="outlined"
                          onClick={() => setSelectedColor(color)}
                          sx={{
                            minWidth: 72,
                            height: 40,
                            borderRadius: 1,
                            fontWeight: 600,
                            fontSize: 13,
                            bgcolor: bg ? (isSelected ? bg : `${bg}99`) : isSelected ? PRIMARY : "transparent",
                            color: bg ? textColor : isSelected ? "#fff" : "#424750",
                            borderColor: isSelected ? PRIMARY : "#e0e0e6",
                            boxShadow: "none",
                            "&:hover": {
                              bgcolor: bg || PRIMARY,
                              opacity: 0.95,
                              boxShadow: "none",
                            },
                          }}
                        >
                          {color}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
              )}

              <Box
                sx={{
                  display: { xs: "none", md: "block" },
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #e0e0e6",
                  bgcolor: "#fafafa",
                  mb: 2,
                }}
              >
                <PriceBlock
                  product={product}
                  hasDiscount={!!hasDiscount}
                  discountPercent={discountPercent}
                />
                <Box sx={{ mt: 2 }}>
                  {outOfStock ? (
                    <Button fullWidth disabled variant="outlined" sx={{ height: 48, borderRadius: 2 }}>
                      ناموجود
                    </Button>
                  ) : inCart ? (
                    <CartQuantityControl
                      quantity={cartQuantity}
                      onIncrease={handleIncreaseQuantity}
                      onDecrease={handleDecreaseQuantity}
                    />
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCartOutlinedIcon />}
                      onClick={handleAddToCart}
                      sx={{
                        height: 48,
                        borderRadius: 2,
                        fontWeight: 700,
                        bgcolor: PRIMARY,
                        boxShadow: "none",
                        "&:hover": { bgcolor: PRIMARY, opacity: 0.92, boxShadow: "none" },
                      }}
                    >
                      افزودن به سبد خرید
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <LocalShippingOutlinedIcon sx={{ color: "#81858b", mt: 0.25 }} />
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>ارسال فروشگاه</Typography>
                    <Typography sx={{ fontSize: 12, color: "#81858b" }}>
                      ارسال عادی ۳ تا ۵ روز کاری · به‌صرفه ۵ تا ۷ روز
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <VerifiedUserOutlinedIcon sx={{ color: "#2e7b32" }} />
                  <Typography sx={{ fontSize: 13, color: "#424750" }}>
                    گارانتی سلامت فیزیکی کالا
                  </Typography>
                </Box>
                <Box
                  component="button"
                  type="button"
                  onClick={() => setShowReturnGuide(true)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    border: "none",
                    bgcolor: "transparent",
                    cursor: "pointer",
                    p: 0,
                    textAlign: "right",
                    "&:hover": { opacity: 0.85 },
                  }}
                >
                  <AssignmentReturnOutlinedIcon sx={{ color: "#81858b" }} />
                  <Typography sx={{ fontSize: 13, color: PRIMARY }}>
                    راهنمای مرجوع کردن کالا
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Description — full width below */}
        {product.description && (
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              mx: { xs: 0, md: 0 },
              borderRadius: { xs: 0, md: 2 },
              border: { md: "1px solid #e0e0e6" },
              overflow: "hidden",
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                border: "none",
                bgcolor: "#fff",
                cursor: "pointer",
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#232933" }}>
                توضیحات
              </Typography>
              {showDescription ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            <Collapse in={showDescription}>
              <Typography
                sx={{
                  px: 2,
                  pb: 2,
                  fontSize: 14,
                  color: "#62666d",
                  lineHeight: 1.9,
                  whiteSpace: "pre-wrap",
                }}
              >
                {product.description}
              </Typography>
            </Collapse>
          </Paper>
        )}
      </Container>

      {/* Mobile sticky buy bar */}
      <Paper
        elevation={8}
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          px: 2,
          py: 1.5,
          borderTop: "1px solid #e0e0e6",
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <PriceBlock
            product={product}
            hasDiscount={!!hasDiscount}
            discountPercent={discountPercent}
            size="compact"
          />
          {outOfStock ? (
            <Button disabled variant="outlined" sx={{ minWidth: 140, height: 44, borderRadius: 2 }}>
              ناموجود
            </Button>
          ) : inCart ? (
            <CartQuantityControl
              quantity={cartQuantity}
              onIncrease={handleIncreaseQuantity}
              onDecrease={handleDecreaseQuantity}
              compact
            />
          ) : (
            <Button
              variant="contained"
              onClick={handleAddToCart}
              sx={{
                minWidth: 140,
                height: 44,
                borderRadius: 2,
                fontWeight: 700,
                bgcolor: PRIMARY,
                boxShadow: "none",
                "&:hover": { bgcolor: PRIMARY, opacity: 0.92 },
              }}
            >
              افزودن به سبد
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog
        open={showReturnGuide}
        onClose={() => setShowReturnGuide(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: "16px 16px 0 0", md: 2 } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e0e0e6",
          }}
        >
          <Typography fontWeight={700}>راهنمای مرجوع کردن کالا</Typography>
          <IconButton onClick={() => setShowReturnGuide(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ direction: "rtl", pt: 2 }}>
          <Typography sx={{ fontSize: 14, lineHeight: 1.9, color: "#424750", mb: 2 }}>
            <strong>۱. تعویض کالا:</strong> در صورت درخواست تعویض، هزینه ارسال با مشتری است.
          </Typography>
          <Typography sx={{ fontSize: 14, lineHeight: 1.9, color: "#424750", mb: 2 }}>
            <strong>۲. مشکل فیزیکی:</strong> در صورت نقص یا خرابی، هزینه ارسال بر عهده فروشگاه است.
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#81858b" }}>
            برای درخواست مرجوعی با پشتیبانی تماس بگیرید.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e6" }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setShowReturnGuide(false)}
            sx={{
              bgcolor: PRIMARY,
              borderRadius: 2,
              "&:hover": { bgcolor: PRIMARY, opacity: 0.92 },
            }}
          >
            متوجه شدم
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
