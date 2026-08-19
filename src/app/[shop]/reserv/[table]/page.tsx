"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  Drawer,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import HistoryIcon from "@mui/icons-material/History";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import { useParams } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { useShopStorefront } from "@/app/context/ShopContext";
import { extractShopTableInfo, type ShopTableInfo } from "@/app/lib/shopTables";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ProductImage = { image_url?: string; image_path?: string };

type Product = {
  id: number;
  name: string;
  sale_price: number;
  original_sale_price?: string | number;
  discount_percent?: number;
  has_discount?: boolean;
  image?: string;
  images?: ProductImage[];
  category_id?: number;
  category_name?: string;
  categories?: Array<{ id?: number; name?: string }>;
};

type CartLine = {
  product_id: number;
  name: string;
  sale_price: number;
  quantity: number;
  image?: string;
};

type GuestOrderItem = {
  name?: string;
  product_name?: string;
  quantity?: number;
  sale_price?: number;
  price?: number;
};

type GuestOrder = {
  id?: number;
  total?: number | string;
  amount?: number | string;
  payable_amount?: number | string;
  credit_used?: number | string;
  table_number?: number;
  table?: { number?: number; name?: string };
  created_at?: string;
  products?: GuestOrderItem[];
  items?: GuestOrderItem[];
};

const ACCENT = "#d4af37";
const ACCENT_DARK = "#b8942a";
const BG = "#0c0c0c";
const SURFACE = "#161616";
const SURFACE_ALT = "#1f1f1f";
const TEXT = "#f4efe4";
const MUTED = "#9a9488";
const COVER_HEIGHT = 200;
const HEADER_IMAGE = "/reserv/reserv2.png";

function formatNumber(num: number) {
  return new Intl.NumberFormat("fa-IR").format(num);
}

function formatDateFa(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fa-IR");
}

function normalizeGuestPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  return digits.slice(0, 11);
}

function isValidGuestPhone(phone: string) {
  return /^09\d{9}$/.test(phone);
}

function guestPhoneStorageKey(shopCode: string) {
  return `table_guest_phone_${shopCode}`;
}

function readSavedGuestPhone(shopCode: string): string {
  if (typeof window === "undefined") return "";
  try {
    const local = localStorage.getItem(guestPhoneStorageKey(shopCode));
    const session = sessionStorage.getItem(guestPhoneStorageKey(shopCode));
    const saved = normalizeGuestPhone(local || session || "");
    if (isValidGuestPhone(saved)) {
      localStorage.setItem(guestPhoneStorageKey(shopCode), saved);
      return saved;
    }
  } catch {
    /* ignore */
  }
  return "";
}

function writeSavedGuestPhone(shopCode: string, phone: string) {
  try {
    localStorage.setItem(guestPhoneStorageKey(shopCode), phone);
    sessionStorage.removeItem(guestPhoneStorageKey(shopCode));
  } catch {
    /* ignore */
  }
}

function parseMoney(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asOrderList(value: unknown): GuestOrder[] {
  if (Array.isArray(value)) return value as GuestOrder[];
  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: GuestOrder[] }).data;
  }
  return [];
}

function extractGuestOrders(res: Record<string, unknown> | null | undefined): GuestOrder[] {
  if (!res) return [];
  if (res.orders != null) return asOrderList(res.orders);
  const data = res.data;
  if (Array.isArray(data)) return data as GuestOrder[];
  if (data && typeof data === "object") {
    const nested = (data as { orders?: unknown }).orders;
    if (nested != null) return asOrderList(nested);
  }
  return [];
}

function extractGuestCredit(res: Record<string, unknown> | null | undefined): { credit: number; hasCredit: boolean } {
  const nested = res?.data && typeof res.data === "object" && !Array.isArray(res.data)
    ? (res.data as Record<string, unknown>)
    : undefined;
  const root = nested ? { ...res, ...nested } : res;
  const credit = parseMoney(root?.credit);
  const hasCredit = Boolean(root?.has_credit ?? credit > 0);
  return { credit, hasCredit };
}

function guestOrderTotal(order: GuestOrder) {
  return parseMoney(order.total ?? order.amount);
}

function guestOrderItems(order: GuestOrder): GuestOrderItem[] {
  return Array.isArray(order.products) ? order.products : Array.isArray(order.items) ? order.items : [];
}

function guestOrderTable(order: GuestOrder) {
  const number = order.table_number ?? order.table?.number;
  if (number) return `میز ${number}`;
  return order.table?.name || "";
}

function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/storage/")) return `https://api.webinoplus.ir${url}`;
  return url;
}

function productImage(product: Product): string {
  if (product.image) return resolveMediaUrl(product.image) || product.image;
  const first = product.images?.[0];
  return resolveMediaUrl(first?.image_url) || "/landing/2.png";
}

function cartStorageKey(shopCode: string, tableNumber: number) {
  return `table_order_cart_${shopCode}_${tableNumber}`;
}

function readCart(shopCode: string, tableNumber: number): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(cartStorageKey(shopCode, tableNumber));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(shopCode: string, tableNumber: number, cart: CartLine[]) {
  sessionStorage.setItem(cartStorageKey(shopCode, tableNumber), JSON.stringify(cart));
}

export default function TableReservPage() {
  const params = useParams();
  const { shopCode, shopApi, shop } = useShopStorefront();
  const tableNumber = Number(params?.table);
  const [tableInfo, setTableInfo] = useState<ShopTableInfo | null>(null);
  const [tableError, setTableError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phone, setPhone] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [credit, setCredit] = useState(0);
  const [hasCredit, setHasCredit] = useState(false);
  const [guestOrders, setGuestOrders] = useState<GuestOrder[]>([]);
  const [useCredit, setUseCredit] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const validTable = Number.isInteger(tableNumber) && tableNumber > 0;

  useEffect(() => {
    if (!shopCode || !validTable) return;
    setCart(readCart(shopCode, tableNumber));
    const saved = readSavedGuestPhone(shopCode);
    if (saved) setPhone(saved);
  }, [shopCode, tableNumber, validTable]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const persistCart = (next: CartLine[]) => {
    setCart(next);
    if (shopCode && validTable) writeCart(shopCode, tableNumber, next);
  };

  const lookupGuest = useCallback(
    async (rawPhone: string, silent = false) => {
      if (!shopCode) return;
      const normalized = normalizeGuestPhone(rawPhone);
      if (!isValidGuestPhone(normalized)) {
        if (!silent) toast.error("شماره موبایل را به‌صورت ۱۱ رقمی وارد کنید");
        return;
      }
      setLookupLoading(true);
      try {
        const res = await apiRequestError(
          "Post",
          {},
          { phone: normalized },
          shopApi("/api/guest/lookup"),
          false,
          true,
          "",
        );
        if (res?.hasError) {
          if (!silent) toast.error(typeof res.message === "string" ? res.message : "شماره پیدا نشد");
          setCredit(0);
          setHasCredit(false);
          setGuestOrders([]);
          setLookupPhone(normalized);
          setUseCredit(false);
          writeSavedGuestPhone(shopCode, normalized);
          setLoginOpen(false);
          return;
        }
        const payload = (res && typeof res === "object" ? res : {}) as Record<string, unknown>;
        const creditInfo = extractGuestCredit(payload);
        setCredit(creditInfo.credit);
        setHasCredit(creditInfo.hasCredit);
        setGuestOrders(extractGuestOrders(payload));
        setLookupPhone(normalized);
        setPhone(normalized);
        if (creditInfo.credit <= 0) setUseCredit(false);
        writeSavedGuestPhone(shopCode, normalized);
        setLoginOpen(false);
      } catch {
        setLookupPhone(normalized);
        if (!silent) toast.error("خطا در دریافت اطلاعات شماره");
      } finally {
        setLookupLoading(false);
      }
    },
    [shopApi, shopCode],
  );

  useEffect(() => {
    if (!shopCode || !isValidGuestPhone(phone) || lookupPhone === phone) return;
    lookupGuest(phone, true);
  }, [lookupGuest, lookupPhone, phone, shopCode]);

  const loadTable = useCallback(async () => {
    if (!shopCode || !validTable) {
      if (!validTable) setTableError("شماره میز نامعتبر است");
      return;
    }
    setTableError("");
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        shopApi(`/api/tables/${tableNumber}`),
        false,
        true,
        "",
      );
      if (res?.hasError) {
        setTableInfo({
          table: null,
          shopName: undefined,
          shopCode,
          label: `میز ${tableNumber}`,
        });
        return;
      }
      setTableInfo(extractShopTableInfo(res, tableNumber));
    } catch {
      setTableInfo({
        table: null,
        shopName: undefined,
        shopCode,
        label: `میز ${tableNumber}`,
      });
    }
  }, [shopApi, shopCode, tableNumber, validTable]);

  const loadProducts = useCallback(
    async (pageNum: number, isInitial: boolean, searchTerm: string) => {
      if (!shopCode) return;
      if (isInitial) setProductsLoading(true);
      else setLoadingMore(true);
      try {
        let url = shopApi(`/api/product?page=${pageNum}&per_page=50`);
        if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
        const res = await apiRequestError("Get", {}, {}, url, false, true, "");
        const rows = Array.isArray(res?.data) ? (res.data as Product[]) : [];
        setProducts((prev) => (isInitial ? rows : [...prev, ...rows]));
        if (res?.last_page) setHasMore(pageNum < res.last_page);
        else setHasMore(rows.length > 0);
        setPage(pageNum);
      } catch {
        if (isInitial) setProducts([]);
      } finally {
        setProductsLoading(false);
        setLoadingMore(false);
      }
    },
    [shopApi, shopCode],
  );

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  useEffect(() => {
    loadProducts(1, true, debouncedSearch);
  }, [loadProducts, debouncedSearch]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      if (Array.isArray(product.categories)) {
        for (const cat of product.categories) {
          if (cat?.id != null) map.set(String(cat.id), cat.name || "دسته");
        }
      }
      if (product.category_id != null) {
        map.set(String(product.category_id), product.category_name || "دسته");
      }
    }
    return [{ id: "all", name: "همه" }, ...Array.from(map.entries()).map(([id, name]) => ({ id, name }))];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((product) => {
      if (String(product.category_id) === selectedCategory) return true;
      return (product.categories || []).some((cat) => String(cat.id) === selectedCategory);
    });
  }, [products, selectedCategory]);

  const qtyOf = (productId: number) => cart.find((line) => line.product_id === productId)?.quantity || 0;

  const setQty = (product: Product, quantity: number) => {
    persistCart(
      quantity <= 0
        ? cart.filter((line) => line.product_id !== product.id)
        : cart.some((line) => line.product_id === product.id)
          ? cart.map((line) =>
              line.product_id === product.id ? { ...line, quantity } : line,
            )
          : [
              ...cart,
              {
                product_id: product.id,
                name: product.name,
                sale_price: Number(product.sale_price) || 0,
                quantity,
                image: productImage(product),
              },
            ],
    );
  };

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.sale_price * line.quantity, 0);
  const tableLabel = tableInfo?.label || `میز ${tableNumber}`;
  const shopTitle = tableInfo?.shopName || shop?.name || shopCode || "فروشگاه";
  const normalizedPhone = normalizeGuestPhone(phone);
  const phoneReady = isValidGuestPhone(normalizedPhone);
  const canUseCredit = phoneReady && hasCredit && credit > 0;
  const creditToApply = useCredit && canUseCredit ? Math.min(credit, cartTotal) : 0;
  const payableAmount = Math.max(0, cartTotal - creditToApply);
  const guestIdentified = Boolean(lookupPhone && phoneReady && lookupPhone === normalizedPhone);

  const openOrders = () => {
    if (guestIdentified) {
      setOrdersOpen(true);
      return;
    }
    setLoginOpen(true);
  };

  const submitOrder = async () => {
    if (!shopCode || cart.length === 0) return;
    if (useCredit && !phoneReady) {
      toast.error("برای استفاده از اعتبار، شماره موبایل را وارد کنید");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequestError(
        "Post",
        {},
        {
          table_number: tableNumber,
          products: cart.map((line) => ({
            product_id: line.product_id,
            quantity: line.quantity,
          })),
          ...(note.trim() ? { note: note.trim() } : {}),
          ...(phoneReady ? { phone: normalizedPhone } : {}),
          ...(useCredit && phoneReady ? { use_credit: true } : {}),
        },
        shopApi("/api/table-order"),
        false,
        true,
        "",
      );
      if (res?.hasError) {
        toast.error(typeof res.message === "string" ? res.message : "ثبت سفارش ناموفق بود");
        return;
      }
      persistCart([]);
      setNote("");
      setCartOpen(false);
      setSubmitted(true);
      if (phoneReady) lookupGuest(normalizedPhone, true);
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  if (!validTable) {
    return (
      <Box sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", p: 3, direction: "rtl", bgcolor: BG }}>
        <Typography sx={{ color: "#e57373" }}>{tableError || "میز نامعتبر است"}</Typography>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          p: 3,
          direction: "rtl",
          textAlign: "center",
          bgcolor: BG,
        }}
      >
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            bgcolor: "rgba(212,175,55,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 52, color: ACCENT }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: TEXT }}>سفارش {tableLabel} ثبت شد</Typography>
        <Typography sx={{ color: MUTED, maxWidth: 320, lineHeight: 1.8, fontSize: 14 }}>
          سفارشتان برای صندوق ارسال شد و منتظر پرداخت است.
        </Typography>
        <Button
          variant="contained"
          onClick={() => setSubmitted(false)}
          sx={{
            mt: 1.5,
            px: 3,
            py: 1.2,
            borderRadius: "14px",
            bgcolor: ACCENT,
            color: "#1a1408",
            fontWeight: 800,
            "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1408" },
          }}
        >
          سفارش جدید همین میز
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: BG }}>
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: BG,
        direction: "rtl",
        pb: cartCount > 0 ? "108px" : "24px",
        maxWidth: 520,
        mx: "auto",
        color: TEXT,
      }}
    >
      <Box sx={{ position: "relative", width: "100%", height: COVER_HEIGHT, overflow: "hidden", bgcolor: "#000" }}>
        <Box
          component="img"
          src={HEADER_IMAGE}
          alt={shopTitle}
          sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.72) 100%)",
          }}
        />
        <Typography
          sx={{
            position: "absolute",
            top: "max(10px, env(safe-area-inset-top))",
            left: 16,
            right: 16,
            color: TEXT,
            fontWeight: 800,
            fontSize: 20,
            lineHeight: 1.3,
            textAlign: "center",
            textShadow: "0 2px 12px rgba(0,0,0,0.55)",
          }}
        >
          {shopTitle}
        </Typography>
        <Box
          sx={{
            position: "absolute",
            right: 12,
            left: 12,
            bottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.8,
          }}
        >
          <Button
            onClick={() => setLoginOpen(true)}
            sx={{
              minWidth: 0,
              px: 1.2,
              py: 0.35,
              borderRadius: "999px",
              color: TEXT,
              fontWeight: 700,
              fontSize: 12,
              bgcolor: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.16)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
            }}
          >
            {guestIdentified ? normalizedPhone.slice(-4) : "ورود"}
          </Button>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              bgcolor: "rgba(212,175,55,0.18)",
              backdropFilter: "blur(8px)",
              color: ACCENT,
              px: 1.2,
              py: 0.4,
              borderRadius: "999px",
              border: "1px solid rgba(212,175,55,0.35)",
            }}
          >
            <TableRestaurantIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{tableLabel}</Typography>
          </Box>
          <IconButton
            onClick={openOrders}
            aria-label="سفارش‌های قبلی"
            sx={{
              width: 34,
              height: 34,
              color: TEXT,
              bgcolor: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.16)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
            }}
          >
            <HistoryIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: BG,
          pt: 1.5,
          pb: 1,
          px: 1.5,
        }}
      >
        {/* <TextField
          size="small"
          fullWidth
          placeholder="جستجو در منو..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: MUTED, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              bgcolor: SURFACE,
              color: TEXT,
              fontSize: 14,
              "& fieldset": { borderColor: "rgba(212,175,55,0.12)" },
              "&:hover fieldset": { borderColor: "rgba(212,175,55,0.35)" },
              "&.Mui-focused fieldset": { borderColor: ACCENT },
            },
            "& .MuiInputBase-input::placeholder": { color: MUTED, opacity: 1 },
          }}
        /> */}
        <Box
          sx={{
            display: "flex",
            gap: 0.8,
            overflowX: "auto",
            mt: 1.25,
            pb: 0.5,
            mx: -1.5,
            px: 1.5,
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Box
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                sx={{
                  flexShrink: 0,
                  px: 1.6,
                  py: 0.7,
                  borderRadius: "999px",
                  cursor: "pointer",
                  bgcolor: active ? ACCENT : SURFACE,
                  color: active ? "#1a1408" : TEXT,
                  fontSize: 13,
                  fontWeight: 700,
                  border: active ? "none" : "1px solid rgba(212,175,55,0.16)",
                  boxShadow: active ? "0 6px 16px rgba(212,175,55,0.28)" : "none",
                }}
              >
                {cat.name}
              </Box>
            );
          })}
        </Box>
      </Box>

      {productsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: ACCENT }} />
        </Box>
      ) : visibleProducts.length === 0 ? (
        <Typography sx={{ textAlign: "center", color: MUTED, py: 6 }}>محصولی پیدا نشد</Typography>
      ) : (
        <Box sx={{ px: 1.5, display: "flex", flexDirection: "column", gap: 1.1 }}>
          {visibleProducts.map((product) => {
            const qty = qtyOf(product.id);
            return (
              <Box
                key={product.id}
                sx={{
                  display: "flex",
                  gap: 1.25,
                  bgcolor: SURFACE,
                  borderRadius: "20px",
                  p: 1.1,
                  border: "1px solid rgba(212,175,55,0.1)",
                }}
              >
                <Box
                  component="img"
                  src={productImage(product)}
                  alt={product.name}
                  sx={{
                    width: 92,
                    height: 92,
                    borderRadius: "16px",
                    objectFit: "cover",
                    bgcolor: SURFACE_ALT,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", py: 0.3 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT, lineHeight: 1.4 }}>
                    {product.name}
                  </Typography>
                  <Typography sx={{ color: ACCENT, fontWeight: 800, mt: "auto", fontSize: 14 }}>
                    {formatNumber(Number(product.sale_price) || 0)}
                    <Box component="span" sx={{ fontSize: 11, fontWeight: 600, color: MUTED, mr: 0.5 }}>
                      تومان
                    </Box>
                  </Typography>
                </Box>
                {qty === 0 ? (
                  <IconButton
                    onClick={() => setQty(product, 1)}
                    sx={{
                      alignSelf: "flex-end",
                      bgcolor: ACCENT,
                      color: "#1a1408",
                      width: 36,
                      height: 36,
                      "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1408" },
                    }}
                  >
                    <AddIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 0.4 }}>
                    <IconButton
                      size="small"
                      onClick={() => setQty(product, qty + 1)}
                      sx={{ bgcolor: ACCENT, color: "#1a1408", width: 30, height: 30, "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1408" } }}
                    >
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography sx={{ minWidth: 18, textAlign: "center", fontWeight: 800, fontSize: 13, color: TEXT }}>
                      {formatNumber(qty)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setQty(product, qty - 1)}
                      sx={{ bgcolor: SURFACE_ALT, color: TEXT, width: 30, height: 30 }}
                    >
                      <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                )}
              </Box>
            );
          })}
          {hasMore && (
            <Button
              disabled={loadingMore}
              onClick={() => loadProducts(page + 1, false, debouncedSearch)}
              sx={{ color: ACCENT, fontWeight: 700, py: 1.2 }}
            >
              {loadingMore ? "..." : "موارد بیشتر"}
            </Button>
          )}
        </Box>
      )}

      {cartCount > 0 && (
        <Box
          sx={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: "max(12px, env(safe-area-inset-bottom))",
            zIndex: 20,
            maxWidth: 496,
            mx: "auto",
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={() => setCartOpen(true)}
            sx={{
              py: 1.45,
              borderRadius: "18px",
              bgcolor: ACCENT,
              fontWeight: 800,
              fontSize: 15,
              boxShadow: "0 12px 28px rgba(212,175,55,0.28)",
              color: "#1a1408",
              "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1408" },
            }}
          >
            <Box sx={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <ShoppingBagIcon sx={{ fontSize: 20 }} />
                <Box
                  sx={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: "8px",
                    bgcolor: "rgba(255,255,255,0.2)",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {formatNumber(cartCount)}
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 15 }}>مشاهده سفارش</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{formatNumber(cartTotal)} ت</Typography>
            </Box>
          </Button>
        </Box>
      )}

      <Drawer
        anchor="bottom"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            p: 2,
            pb: "max(16px, env(safe-area-inset-bottom))",
            direction: "rtl",
            maxWidth: 520,
            mx: "auto",
            bgcolor: SURFACE,
            color: TEXT,
          },
        }}
      >
        <Box sx={{ width: 42, height: 5, borderRadius: 99, bgcolor: "#3a3a3a", mx: "auto", mb: 1.5 }} />
        <Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: 18, color: TEXT }}>سفارش {tableLabel}</Typography>
        <Box sx={{ maxHeight: "46vh", overflowY: "auto" }}>
          {cart.map((line) => (
            <Box
              key={line.product_id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 1.1,
                px: 1,
                mb: 0.8,
                bgcolor: SURFACE_ALT,
                borderRadius: "16px",
              }}
            >
              {line.image ? (
                <Box component="img" src={line.image} alt="" sx={{ width: 48, height: 48, borderRadius: "12px", objectFit: "cover" }} />
              ) : null}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: TEXT }}>{line.name}</Typography>
                <Typography sx={{ color: MUTED, fontSize: 12 }}>
                  {formatNumber(line.sale_price)} × {formatNumber(line.quantity)}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => persistCart(cart.filter((item) => item.product_id !== line.product_id))} sx={{ color: MUTED }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          placeholder="یادداشت برای آشپزخانه (اختیاری)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{
            mt: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "14px",
              bgcolor: SURFACE_ALT,
              color: TEXT,
              "& fieldset": { borderColor: "rgba(212,175,55,0.12)" },
            },
            "& .MuiInputBase-input::placeholder": { color: MUTED, opacity: 1 },
          }}
        />
        {canUseCredit ? (
          <FormControlLabel
            sx={{ mt: 1, mr: 0, color: TEXT, "& .MuiFormControlLabel-label": { fontSize: 13, fontWeight: 700 } }}
            control={
              <Checkbox
                checked={useCredit}
                onChange={(_, checked) => setUseCredit(checked)}
                sx={{ color: MUTED, "&.Mui-checked": { color: ACCENT } }}
              />
            }
            label={`استفاده از اعتبار (${formatNumber(credit)} تومان)`}
          />
        ) : (
          <Typography sx={{ mt: 1.1, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
            {phoneReady
              ? "با ثبت این سفارش، شماره روی فاکتور می‌ماند و در سفارش‌های بعدی دیده می‌شود."
              : "از دکمه ورود کنار میز شماره را بدهید تا سفارش در تاریخچه بماند و بتوانید از اعتبار استفاده کنید."}
          </Typography>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
          <Typography sx={{ color: MUTED, fontWeight: 700 }}>جمع کل</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: TEXT }}>{formatNumber(cartTotal)} تومان</Typography>
        </Box>
        {creditToApply > 0 ? (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.7 }}>
              <Typography sx={{ color: MUTED, fontWeight: 700 }}>اعتبار</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: ACCENT }}>
                − {formatNumber(creditToApply)} تومان
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.7, mb: 1.5 }}>
              <Typography sx={{ color: MUTED, fontWeight: 700 }}>قابل پرداخت</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: 18, color: ACCENT }}>
                {formatNumber(payableAmount)} تومان
              </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.7, mb: 1.5 }}>
            <Typography sx={{ color: MUTED, fontWeight: 700 }}>قابل پرداخت</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: ACCENT }}>{formatNumber(cartTotal)} تومان</Typography>
          </Box>
        )}
        <Button
          fullWidth
          variant="contained"
          disabled={submitting || cart.length === 0}
          onClick={submitOrder}
          sx={{
            bgcolor: ACCENT,
            py: 1.4,
            borderRadius: "16px",
            fontWeight: 800,
            color: "#1a1408",
            "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1408" },
          }}
        >
          {submitting ? "در حال ثبت..." : "ثبت سفارش حضوری"}
        </Button>
      </Drawer>
      <Drawer
        anchor="bottom"
        open={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            p: 2,
            pb: "max(16px, env(safe-area-inset-bottom))",
            direction: "rtl",
            maxWidth: 520,
            mx: "auto",
            bgcolor: SURFACE,
            color: TEXT,
            maxHeight: "80vh",
          },
        }}
      >
        <Box sx={{ width: 42, height: 5, borderRadius: 99, bgcolor: "#3a3a3a", mx: "auto", mb: 1.5 }} />
        <Typography sx={{ fontWeight: 800, mb: 0.4, fontSize: 18, color: TEXT }}>سفارش‌های قبلی</Typography>
        <Typography sx={{ color: MUTED, fontSize: 12, mb: 1.5 }}>{normalizedPhone}</Typography>
        {guestOrders.length === 0 ? (
          <Typography sx={{ textAlign: "center", color: MUTED, py: 4 }}>سفارشی با این شماره در این فروشگاه نیست</Typography>
        ) : (
          <Box sx={{ overflowY: "auto" }}>
            {guestOrders.map((order, index) => {
              const items = guestOrderItems(order);
              const used = parseMoney(order.credit_used);
              return (
                <Box
                  key={order.id ?? index}
                  sx={{
                    bgcolor: SURFACE_ALT,
                    borderRadius: "16px",
                    p: 1.25,
                    mb: 1,
                    border: "1px solid rgba(212,175,55,0.1)",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.6 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: TEXT }}>
                      {guestOrderTable(order) || "سفارش"}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: MUTED }}>{formatDateFa(order.created_at)}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, color: ACCENT, fontWeight: 800 }}>
                    {formatNumber(guestOrderTotal(order))} تومان
                  </Typography>
                  {used > 0 ? (
                    <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.3 }}>
                      اعتبار مصرف‌شده: {formatNumber(used)} تومان
                    </Typography>
                  ) : null}
                  {parseMoney(order.payable_amount) > 0 ? (
                    <Typography sx={{ fontSize: 12, color: MUTED }}>
                      قابل پرداخت: {formatNumber(parseMoney(order.payable_amount))} تومان
                    </Typography>
                  ) : null}
                  {items.length > 0 ? (
                    <Box sx={{ mt: 0.8 }}>
                      {items.map((item, itemIndex) => (
                        <Typography key={`${order.id}-${itemIndex}`} sx={{ fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
                          {(item.name || item.product_name || "محصول") +
                            (item.quantity ? ` × ${formatNumber(item.quantity)}` : "")}
                        </Typography>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        )}
      </Drawer>
      <Dialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SURFACE,
            color: TEXT,
            borderRadius: "22px",
            mx: 2,
            width: "100%",
            maxWidth: 400,
            direction: "rtl",
          },
        }}
      >
        <DialogContent sx={{ p: 2.2 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: TEXT, mb: 0.5 }}>
            شماره موبایل (بدون ورود)
          </Typography>
          <Typography sx={{ fontSize: 12, color: MUTED, lineHeight: 1.7, mb: 1.4 }}>
            با شماره، اعتبار همین فروشگاه و سفارش‌های قبلی را می‌بینید.
          </Typography>
          <Box sx={{ display: "flex", gap: 0.8 }}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="09121234567"
              value={phone}
              inputProps={{ inputMode: "numeric", maxLength: 11 }}
              onChange={(e) => setPhone(normalizeGuestPhone(e.target.value))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIphoneIcon sx={{ color: MUTED, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                  bgcolor: SURFACE_ALT,
                  color: TEXT,
                  fontSize: 14,
                  "& fieldset": { borderColor: "rgba(212,175,55,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(212,175,55,0.35)" },
                  "&.Mui-focused fieldset": { borderColor: ACCENT },
                },
                "& .MuiInputBase-input::placeholder": { color: MUTED, opacity: 1 },
              }}
            />
            <Button
              onClick={() => lookupGuest(phone)}
              disabled={lookupLoading || !phoneReady}
              sx={{
                minWidth: 88,
                borderRadius: "14px",
                bgcolor: ACCENT,
                color: "#1a1408",
                fontWeight: 800,
                "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1408" },
                "&.Mui-disabled": { bgcolor: SURFACE_ALT, color: MUTED },
              }}
            >
              {lookupLoading ? <CircularProgress size={18} sx={{ color: "#1a1408" }} /> : "ثبت"}
            </Button>
          </Box>
          {guestIdentified ? (
            <Typography sx={{ mt: 1.2, fontSize: 13, color: hasCredit && credit > 0 ? ACCENT : MUTED, fontWeight: 700 }}>
              {hasCredit && credit > 0 ? `اعتبار شما: ${formatNumber(credit)} تومان` : "اعتباری برای این شماره ثبت نشده"}
            </Typography>
          ) : null}
        </DialogContent>
      </Dialog>
      <ToastContainer position="bottom-center" autoClose={3000} theme="dark" />
    </Box>
    </Box>
  );
}
