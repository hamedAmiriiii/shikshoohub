"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useParams } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import { useShopStorefront } from "@/app/context/ShopContext";
import { extractShopTableInfo, extractPaymentMethods, DEFAULT_TABLE_PAYMENT_METHODS, extractTableOrders, getTableOrderAmount, getTableOrderProducts, tablePaymentMethodLabel, type ShopTableInfo, type TablePaymentMethod, type TableOrder } from "@/app/lib/shopTables";
import {
  getActiveRootCategories,
  parseCategoriesFromApi,
  resolveCategoryImageUrl,
  type ShopCategory,
} from "@/app/lib/shopCategories";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ACCENT,
  ACCENT_DARK,
  ReservCartBar,
  ReservCategoryTabs,
  ReservDesktopCartPanel,
  ReservEmptyState,
  ReservHeader,
  ReservProductCard,
  ReservProductSkeletonList,
  ReservSearchBar,
  THEMES,
  formatNumber,
  type ReservThemeMode,
} from "./ReservOrderingParts";

type ProductImage = { image_url?: string; image_path?: string };

type Product = {
  id: number;
  name: string;
  sale_price: number;
  original_sale_price?: string | number;
  discount_percent?: number;
  has_discount?: boolean;
  description?: string;
  image?: string;
  images?: ProductImage[];
  category_id?: number;
  category_name?: string;
  categories?: Array<{
    id?: number;
    name?: string;
    image?: string | null;
    image_url?: string | null;
    banner_url?: string | null;
  }>;
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
  total_amount?: number | string;
  amount?: number | string;
  payable_amount?: number | string;
  credit_used?: number | string;
  table_number?: number;
  table_label?: string;
  table?: { number?: number; name?: string };
  created_at?: string;
  products?: GuestOrderItem[];
  items?: GuestOrderItem[];
};

const RESERV_THEME_KEY = "reserv_table_theme";

function toFaDigits(value: string) {
  return value.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}

function formatDateFa(value?: string) {
  if (!value) return "";
  const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2}))?/);
  if (match) {
    const year = Number(match[1]);
    if (year >= 1200 && year <= 1600) {
      const datePart = `${match[1]}/${match[2].padStart(2, "0")}/${match[3].padStart(2, "0")}`;
      const timePart = match[4] ? ` ${match[4].padStart(2, "0")}:${match[5].padStart(2, "0")}` : "";
      return toFaDigits(datePart + timePart);
    }
  }
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return toFaDigits(value.split(" ")[0] || value);
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
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

function clearSavedGuestPhone(shopCode: string) {
  try {
    localStorage.removeItem(guestPhoneStorageKey(shopCode));
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
  return parseMoney(order.total_amount ?? order.total ?? order.amount);
}

function guestOrderItems(order: GuestOrder): GuestOrderItem[] {
  return Array.isArray(order.products) ? order.products : Array.isArray(order.items) ? order.items : [];
}

function guestOrderTable(order: GuestOrder) {
  if (order.table_label) return order.table_label;
  const number = order.table_number ?? order.table?.number;
  if (number) return `میز ${number}`;
  return order.table?.name || "";
}

function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/storage/")) return `https://api.webinoplus.ir${url}`;
  return url;
}

function productImage(product: Product, categoryImageById?: Map<string, string>): string {
  const ownRaw = product.image?.trim() || product.images?.[0]?.image_url || "";
  const ownIsPlaceholder =
    !ownRaw ||
    /noimageshop/i.test(ownRaw) ||
    /\/landing\/2\.png/i.test(ownRaw);
  const own = ownIsPlaceholder ? null : resolveMediaUrl(ownRaw) || ownRaw;
  if (own) return own;
  if (Array.isArray(product.categories)) {
    for (const cat of product.categories) {
      const url = resolveCategoryImageUrl(cat);
      if (url) return url;
    }
  }
  if (product.category_id != null) {
    const fromMap = categoryImageById?.get(String(product.category_id));
    if (fromMap) return fromMap;
  }
  return "/pic/noImageShop.jpg";
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

const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
const RECEIPT_IMAGE_MAX_BYTES = 150 * 1024;

function isAllowedReceiptFile(file: File) {
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "application/pdf" ||
    /\.(jpe?g|png|webp|pdf)$/.test(name)
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("compress failed"))),
      "image/jpeg",
      quality,
    );
  });
}

async function compressReceiptImage(file: File, maxBytes = RECEIPT_IMAGE_MAX_BYTES): Promise<string> {
  if (file.size <= maxBytes && /jpe?g/i.test(file.type || file.name)) {
    return readFileAsDataUrl(file);
  }
  const original = await readFileAsDataUrl(file);
  const img = await loadImageElement(original);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (!width || !height) return original;

  const maxSide = 1280;
  if (Math.max(width, height) > maxSide) {
    const scale = maxSide / Math.max(width, height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;

  let quality = 0.82;
  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    blob = await canvasToJpegBlob(canvas, quality);
    if (blob.size <= maxBytes) break;
    if (quality > 0.45) {
      quality = Math.max(0.45, quality - 0.12);
    } else {
      width = Math.max(360, Math.round(width * 0.82));
      height = Math.max(360, Math.round(height * 0.82));
      quality = 0.7;
    }
  }
  if (!blob) return original;
  return blobToDataUrl(blob);
}

function collectCategoryImages(categories: ShopCategory[], map: Map<string, string>) {
  for (const cat of categories) {
    const url = resolveCategoryImageUrl(cat);
    if (url && cat.id != null) map.set(String(cat.id), url);
    if (cat.children?.length) collectCategoryImages(cat.children, map);
  }
}

export default function TableReservPage() {
  const params = useParams();
  const { shopCode, shopApi, shop } = useShopStorefront();
  const tableNumber = Number(params?.table);
  const [tableInfo, setTableInfo] = useState<ShopTableInfo | null>(null);
  const [tableError, setTableError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
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
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<TablePaymentMethod[]>(DEFAULT_TABLE_PAYMENT_METHODS);
  const [receiptBase64, setReceiptBase64] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [receiptIsPdf, setReceiptIsPdf] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [submittedOrderId, setSubmittedOrderId] = useState<number | null>(null);
  const [submittedHasReceipt, setSubmittedHasReceipt] = useState(false);
  const [submittedCancelled, setSubmittedCancelled] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [currentOpen, setCurrentOpen] = useState(false);
  const [currentLoading, setCurrentLoading] = useState(false);
  const [currentOrders, setCurrentOrders] = useState<TableOrder[]>([]);
  const [currentDetail, setCurrentDetail] = useState<TableOrder | null>(null);
  const [currentDetailLoading, setCurrentDetailLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const [themeMode, setThemeMode] = useState<ReservThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const stored = localStorage.getItem(RESERV_THEME_KEY);
      if (stored === "dark" || stored === "light") return stored;
      return "light";
    } catch {
      return "light";
    }
  });
  const theme = THEMES[themeMode];
  const { BG, SURFACE, SURFACE_ALT, TEXT, MUTED, BORDER } = theme;

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(RESERV_THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const validTable = Number.isInteger(tableNumber) && tableNumber > 0;

  useEffect(() => {
    if (!shopCode || !validTable) return;
    setCart(readCart(shopCode, tableNumber));
    const saved = readSavedGuestPhone(shopCode);
    if (saved) setPhone(saved);
  }, [shopCode, tableNumber, validTable]);

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
          return;
        }
        const payload = (res && typeof res === "object" ? res : {}) as Record<string, unknown>;
        const creditInfo = extractGuestCredit(payload);
        setCredit(creditInfo.credit);
        setHasCredit(creditInfo.hasCredit);
        setGuestOrders(extractGuestOrders(payload));
        setLookupPhone(normalized);
        setPhone(normalized);
        setUseCredit(creditInfo.credit > 0);
        writeSavedGuestPhone(shopCode, normalized);
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
    if (!loginOpen) return;
    if (!shopCode || !isValidGuestPhone(phone) || lookupPhone === phone) return;
    lookupGuest(phone, true);
  }, [loginOpen, lookupGuest, lookupPhone, phone, shopCode]);

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
        const fromShop = extractPaymentMethods(shop);
        if (fromShop.length) setPaymentMethods(fromShop);
        return;
      }
      const info = extractShopTableInfo(res, tableNumber);
      setTableInfo(info);
      const methods = info.paymentMethods?.length
        ? info.paymentMethods
        : extractPaymentMethods(shop);
      setPaymentMethods(methods.length ? methods : DEFAULT_TABLE_PAYMENT_METHODS);
    } catch {
      setTableInfo({
        table: null,
        shopName: undefined,
        shopCode,
        label: `میز ${tableNumber}`,
      });
    }
  }, [shop, shopApi, shopCode, tableNumber, validTable]);

  const loadProducts = useCallback(
    async (pageNum: number, isInitial: boolean) => {
      if (!shopCode) return;
      if (isInitial) {
        setProductsLoading(true);
        setProductsError(false);
      } else setLoadingMore(true);
      try {
        const url = shopApi(`/api/product?page=${pageNum}&per_page=200`);
        const res = await apiRequestError("Get", {}, {}, url, false, true, "");
        if (res?.hasError) {
          if (isInitial) {
            setProducts([]);
            setProductsError(true);
          }
          return;
        }
        const rows = Array.isArray(res?.data) ? (res.data as Product[]) : [];
        setProducts((prev) => (isInitial ? rows : [...prev, ...rows]));
        setProductsError(false);
        if (res?.last_page) setHasMore(pageNum < res.last_page);
        else setHasMore(rows.length >= 200);
        setPage(pageNum);
      } catch {
        if (isInitial) {
          setProducts([]);
          setProductsError(true);
        }
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
    loadProducts(1, true);
  }, [loadProducts]);

  useEffect(() => {
    if (!shopCode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequestError(
          "Get",
          {},
          {},
          shopApi("/api/category?tree=true"),
          false,
          false,
          "",
        );
        if (!cancelled) setShopCategories(parseCategoriesFromApi(res));
      } catch {
        if (!cancelled) setShopCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shopApi, shopCode]);

  const categoryImageById = useMemo(() => {
    const map = new Map<string, string>();
    collectCategoryImages(shopCategories, map);
    return map;
  }, [shopCategories]);

  const categories = useMemo(() => {
    const roots = getActiveRootCategories(shopCategories);
    if (roots.length > 0) {
      return [
        { id: "all", name: "همه", image: null as string | null },
        ...roots.map((cat) => ({
          id: String(cat.id),
          name: cat.name,
          image: resolveCategoryImageUrl(cat),
        })),
      ];
    }
    const map = new Map<string, { name: string; image: string | null }>();
    const upsert = (id: string, name?: string, image?: string | null) => {
      const prev = map.get(id);
      map.set(id, {
        name: (name && name.trim()) || prev?.name || "دسته",
        image: image || prev?.image || null,
      });
    };
    for (const product of products) {
      if (Array.isArray(product.categories)) {
        for (const cat of product.categories) {
          if (cat?.id == null) continue;
          upsert(String(cat.id), cat.name, resolveCategoryImageUrl(cat));
        }
      }
      if (product.category_id != null) {
        upsert(
          String(product.category_id),
          product.category_name,
          categoryImageById.get(String(product.category_id)) || null,
        );
      }
    }
    for (const [id, image] of categoryImageById) {
      const prev = map.get(id);
      if (prev && !prev.image) map.set(id, { ...prev, image });
    }
    return [
      { id: "all", name: "همه", image: null as string | null },
      ...Array.from(map.entries()).map(([id, value]) => ({ id, ...value })),
    ];
  }, [categoryImageById, products, shopCategories]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedCategory !== "all") {
        const inCategory =
          String(product.category_id) === selectedCategory ||
          (product.categories || []).some((cat) => String(cat.id) === selectedCategory);
        if (!inCategory) return false;
      }
      if (!term) return true;
      return (product.name || "").toLowerCase().includes(term);
    });
  }, [products, search, selectedCategory]);

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
                image: productImage(product, categoryImageById),
              },
            ],
    );
  };

  const adjustCartLine = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      persistCart(cart.filter((line) => line.product_id !== productId));
      return;
    }
    persistCart(
      cart.map((line) => (line.product_id === productId ? { ...line, quantity } : line)),
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
  const selectedPayMethod = paymentMethods.find((item) => item.key === paymentMethod);
  const cardToCard = paymentMethods.find((item) => item.key === "card_to_card");

  const loadCurrentOrders = useCallback(async (silent = false) => {
    if (!shopCode || !validTable) return;
    if (!silent) setCurrentLoading(true);
    try {
      const query = new URLSearchParams({ table_number: String(tableNumber) });
      if (phoneReady) query.set("phone", normalizedPhone);
      const res = await apiRequestError(
        "Get",
        {},
        {},
        shopApi(`/api/table-orders?${query.toString()}`),
        false,
        true,
        "",
      );
      if (res?.hasError) {
        if (!silent) toast.error(typeof res.message === "string" ? res.message : "دریافت سفارش جاری ناموفق بود");
        setCurrentOrders([]);
        return;
      }
      setCurrentOrders(extractTableOrders(res));
    } catch {
      if (!silent) toast.error("خطا در ارتباط با سرور");
    } finally {
      if (!silent) setCurrentLoading(false);
    }
  }, [normalizedPhone, phoneReady, shopApi, shopCode, tableNumber, validTable]);

  const openCurrentOrders = () => {
    setCurrentOpen(true);
    setCurrentDetail(null);
    void loadCurrentOrders();
  };

  const openCurrentDetail = async (order: TableOrder) => {
    if (!shopCode) return;
    setCurrentDetail(order);
    setCurrentDetailLoading(true);
    try {
      const query = phoneReady ? `?phone=${encodeURIComponent(normalizedPhone)}` : "";
      const res = await apiRequestError(
        "Get",
        {},
        {},
        shopApi(`/api/table-order/${order.id}${query}`),
        false,
        true,
        "",
      );
      if (res?.statusCode === 410 || res?.status === 410) {
        toast.info(typeof res.message === "string" ? res.message : "این سفارش به فاکتور تبدیل شده");
        setCurrentDetail(null);
        void loadCurrentOrders();
        return;
      }
      if (res?.hasError) {
        toast.error(typeof res.message === "string" ? res.message : "سفارش پیدا نشد");
        return;
      }
      const raw = (res?.table_order || res?.data || res) as unknown;
      const parsed = extractTableOrders({ table_orders: [raw] })[0];
      if (parsed) setCurrentDetail(parsed);
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setCurrentDetailLoading(false);
    }
  };

  const copyCardNumber = async (value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ""));
      toast.success("شماره کارت کپی شد");
    } catch {
      toast.error("کپی نشد");
    }
  };

  const clearReceipt = () => {
    setReceiptBase64("");
    setReceiptName("");
    setReceiptIsPdf(false);
    setReceiptError("");
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  };

  const pickReceiptFile = async (file: File | null, uploadNow = false) => {
    if (!file) return;
    if (!isAllowedReceiptFile(file)) {
      setReceiptError("jpg، png، webp یا pdf");
      return;
    }
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (file.size > RECEIPT_MAX_BYTES) {
      setReceiptError("حجم فایل اصلی نباید بیشتر از ۵ مگابایت باشد");
      return;
    }
    setReceiptError("");
    try {
      const dataUrl = isPdf ? await readFileAsDataUrl(file) : await compressReceiptImage(file);
      setReceiptBase64(dataUrl);
      setReceiptName(isPdf ? file.name : file.name.replace(/\.[^.]+$/, ".jpg"));
      setReceiptIsPdf(isPdf);
      if (uploadNow && submittedOrderId && shopCode) {
        setUploadingReceipt(true);
        const res = await apiRequestError(
          "Post",
          {},
          { receipt_base64: dataUrl },
          shopApi(`/api/table-order/${submittedOrderId}/receipt`),
          false,
          true,
          "",
        );
        if (res?.hasError) {
          setReceiptError(typeof res.message === "string" ? res.message : "ارسال رسید ناموفق بود");
          return;
        }
        setSubmittedHasReceipt(true);
        toast.success(typeof res.message === "string" ? res.message : "رسید ثبت شد");
      }
    } catch {
      setReceiptError("خواندن فایل ناموفق بود");
    } finally {
      setUploadingReceipt(false);
      if (receiptInputRef.current) receiptInputRef.current.value = "";
    }
  };

  const openOrders = () => {
    if (!phoneReady) {
      setLoginOpen(true);
      return;
    }
    setOrdersOpen(true);
    void lookupGuest(normalizedPhone, true);
  };

  const submitOrder = async () => {
    if (!shopCode || cart.length === 0) return;
    if (useCredit && !phoneReady) {
      toast.error("برای استفاده از اعتبار، شماره موبایل را وارد کنید");
      return;
    }
    if (!paymentMethod) {
      toast.error("روش پرداخت را انتخاب کنید");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequestError(
        "Post",
        {},
        {
          table_number: tableNumber,
          payment_method: paymentMethod,
          products: cart.map((line) => ({
            product_id: line.product_id,
            quantity: line.quantity,
          })),
          ...(note.trim() ? { note: note.trim() } : {}),
          ...(phoneReady ? { phone: normalizedPhone } : {}),
          ...(useCredit && phoneReady ? { use_credit: true } : {}),
          ...(paymentMethod === "card_to_card" && receiptBase64 ? { receipt_base64: receiptBase64 } : {}),
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
      const hadReceipt = paymentMethod === "card_to_card" && Boolean(receiptBase64);
      persistCart([]);
      setNote("");
      setCartOpen(false);
      const order = (res?.table_order || res?.data || res) as { id?: number; has_receipt?: boolean } | undefined;
      const orderId = Number(order?.id);
      setSubmittedOrderId(Number.isFinite(orderId) && orderId > 0 ? orderId : null);
      setSubmittedHasReceipt(Boolean(order?.has_receipt || hadReceipt));
      clearReceipt();
      setSubmittedCancelled(false);
      setSubmitted(true);
      void loadCurrentOrders(true);
      if (phoneReady) lookupGuest(normalizedPhone, true);
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelSubmittedOrder = async () => {
    if (!shopCode || !submittedOrderId || submittedCancelled) return;
    setCancellingOrder(true);
    try {
      const res = await apiRequestError(
        "Post",
        {},
        phoneReady ? { phone: normalizedPhone } : {},
        shopApi(`/api/table-order/${submittedOrderId}/cancel`),
        false,
        true,
        "",
      );
      if (res?.hasError) {
        toast.error(typeof res.message === "string" ? res.message : "لغو سفارش ناموفق بود");
        return;
      }
      setSubmittedCancelled(true);
      setCancelConfirmOpen(false);
      toast.success(typeof res.message === "string" ? res.message : "سفارش لغو شد");
      void loadCurrentOrders(true);
      if (phoneReady) lookupGuest(normalizedPhone, true);
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setCancellingOrder(false);
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
            bgcolor: submittedCancelled ? "rgba(198,40,40,0.12)" : "rgba(212,175,55,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {submittedCancelled ? (
            <CancelOutlinedIcon sx={{ fontSize: 52, color: "#e57373" }} />
          ) : (
            <CheckCircleIcon sx={{ fontSize: 52, color: ACCENT }} />
          )}
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: TEXT }}>
          {submittedCancelled ? `سفارش ${tableLabel} لغو شد` : `سفارش ${tableLabel} ثبت شد`}
        </Typography>
        {submittedOrderId ? (
          <Typography sx={{ color: ACCENT, fontWeight: 800, fontSize: 15 }}>
            شماره سفارش: {formatNumber(submittedOrderId)}
          </Typography>
        ) : null}
        <Typography sx={{ color: MUTED, maxWidth: 320, lineHeight: 1.8, fontSize: 14 }}>
          {submittedCancelled
            ? "این سفارش دیگر برای صندوق نمایش داده نمی‌شود."
            : `هنوز فاکتور نشده. روش پرداخت: ${selectedPayMethod?.label || "—"}. بعد از تأیید پرسنل فاکتور ساخته می‌شود.`}
        </Typography>
        {!submittedCancelled && paymentMethod === "card_to_card" && cardToCard?.card_number ? (
          <Box sx={{ mt: 1, p: 1.5, borderRadius: "16px", bgcolor: SURFACE, border: "1px solid rgba(212,175,55,0.2)", maxWidth: 320, width: "100%" }}>
            <Typography sx={{ fontSize: 12, color: MUTED, mb: 0.4 }}>{cardToCard.bank_name || "کارت به کارت"}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 16, letterSpacing: 1, color: TEXT, direction: "ltr" }}>
              {cardToCard.card_number}
            </Typography>
            {cardToCard.card_holder ? (
              <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.4 }}>{cardToCard.card_holder}</Typography>
            ) : null}
          </Box>
        ) : null}
        <Button
          variant="contained"
          onClick={() => {
            setSubmitted(false);
            setSubmittedCancelled(false);
            setSubmittedOrderId(null);
            clearReceipt();
          }}
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
          بازگشت
        </Button>
        {submittedOrderId && !submittedCancelled ? (
          <Button
            onClick={() => setCancelConfirmOpen(true)}
            sx={{ color: "#e57373", fontWeight: 700 }}
          >
            لغو سفارش
          </Button>
        ) : null}
        <Dialog open={cancelConfirmOpen} onClose={() => !cancellingOrder && setCancelConfirmOpen(false)}>
          <DialogContent>
            <Typography sx={{ color: TEXT, fontWeight: 800, mb: 1 }}>لغو سفارش؟</Typography>
            <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.8 }}>
              فقط تا وقتی پرسنل پرداخت را تأیید نکرده باشد می‌توانید لغو کنید.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2 }}>
            <Button onClick={() => setCancelConfirmOpen(false)} disabled={cancellingOrder} sx={{ color: MUTED }}>
              انصراف
            </Button>
            <Button onClick={cancelSubmittedOrder} disabled={cancellingOrder} sx={{ color: "#e57373", fontWeight: 800 }}>
              {cancellingOrder ? "..." : "لغو سفارش"}
            </Button>
          </DialogActions>
        </Dialog>
        <ToastContainer position="bottom-center" autoClose={3000} theme={themeMode} />
      </Box>
    );
  }

  const searchActive = Boolean(search.trim());
  const cartTotalLabel =
    creditToApply > 0
      ? `${formatNumber(payableAmount)} تومان`
      : `${formatNumber(cartTotal)} تومان`;
  const activeCurrentCount = currentOrders.filter((order) => order.status !== "cancelled").length;

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: BG,
        direction: "rtl",
        color: TEXT,
        fontFamily: APP_FONT_FAMILY,
      }}
    >
      <ReservHeader
        shopTitle={shopTitle}
        tableLabel={tableLabel}
        guestLabel={guestIdentified ? normalizedPhone.slice(-4) : "ورود"}
        themeMode={themeMode}
        theme={theme}
        currentOrderCount={activeCurrentCount}
        onLogin={() => setLoginOpen(true)}
        onToggleTheme={toggleTheme}
        onCurrentOrders={openCurrentOrders}
        onHistory={openOrders}
      />

      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 1.5, md: 2 },
          pt: 1.5,
          pb: cartCount > 0 ? { xs: "112px", md: 3 } : 3,
          display: { xs: "block", md: "grid" },
          gridTemplateColumns: { md: "minmax(0,1fr) 340px" },
          gap: { md: 2.5 },
          alignItems: "start",
        }}
      >
        <Box component="main">
          <Box sx={{ mb: 1.25 }}>
            <ReservSearchBar value={search} onChange={setSearch} theme={theme} />
          </Box>
          <Box sx={{ mb: 1.5 }}>
            <ReservCategoryTabs
              categories={categories}
              selectedId={selectedCategory}
              onSelect={setSelectedCategory}
              theme={theme}
              dimmed={searchActive}
            />
          </Box>

          {productsLoading ? (
            <ReservProductSkeletonList theme={theme} />
          ) : productsError ? (
            <ReservEmptyState
              theme={theme}
              title="اتصال به سرور با مشکل مواجه شد."
              action={
                <Button
                  onClick={() => loadProducts(1, true)}
                  sx={{
                    bgcolor: ACCENT,
                    color: "#1a1712",
                    fontWeight: 800,
                    borderRadius: "14px",
                    px: 2.5,
                    py: 1.1,
                    "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1712" },
                  }}
                >
                  تلاش مجدد
                </Button>
              }
            />
          ) : visibleProducts.length === 0 ? (
            <ReservEmptyState
              theme={theme}
              title={
                searchActive
                  ? `نتیجه‌ای برای «${search.trim()}» پیدا نشد.`
                  : selectedCategory === "all"
                    ? "غذایی برای نمایش وجود ندارد."
                    : "غذایی در این دسته پیدا نشد."
              }
            />
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                gap: 1.1,
              }}
            >
              {visibleProducts.map((product, index) => {
                const qty = qtyOf(product.id);
                return (
                  <ReservProductCard
                    key={product.id}
                    name={product.name}
                    description={product.description}
                    price={Number(product.sale_price) || 0}
                    image={productImage(product, categoryImageById)}
                    quantity={qty}
                    priority={index < 4}
                    theme={theme}
                    onAdd={() => setQty(product, qty + 1)}
                    onRemove={() => setQty(product, qty - 1)}
                    onOpen={() => setDetailProduct(product)}
                  />
                );
              })}
            </Box>
          )}

          {!productsLoading && !productsError && hasMore && !searchActive ? (
            <Button
              disabled={loadingMore}
              onClick={() => loadProducts(page + 1, false)}
              fullWidth
              sx={{ color: ACCENT, fontWeight: 700, py: 1.4, mt: 1 }}
            >
              {loadingMore ? "..." : "موارد بیشتر"}
            </Button>
          ) : null}
        </Box>

        <ReservDesktopCartPanel
          theme={theme}
          lines={cart}
          total={payableAmount}
          onInc={(id) => adjustCartLine(id, qtyOf(id) + 1)}
          onDec={(id) => adjustCartLine(id, qtyOf(id) - 1)}
          onRemove={(id) => adjustCartLine(id, 0)}
          onCheckout={() => setCartOpen(true)}
        />
      </Box>

      <ReservCartBar
        count={cartCount}
        totalLabel={cartTotalLabel}
        theme={theme}
        onOpen={() => setCartOpen(true)}
      />

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
        <Box sx={{ width: 42, height: 5, borderRadius: 99, bgcolor: themeMode === "dark" ? "#3a3a3a" : "#d8d2c8", mx: "auto", mb: 1.5 }} />
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
                border: `1px solid ${BORDER}`,
              }}
            >
              {line.image ? (
                <Box
                  component="img"
                  src={line.image}
                  alt=""
                  loading="lazy"
                  sx={{ width: 48, height: 48, borderRadius: "12px", objectFit: "cover" }}
                />
              ) : null}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: TEXT }}>{line.name}</Typography>
                <Typography sx={{ color: MUTED, fontSize: 12 }}>
                  {formatNumber(line.sale_price * line.quantity)} تومان
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.7 }}>
                  <IconButton
                    size="small"
                    aria-label="کاهش تعداد"
                    onClick={() => adjustCartLine(line.product_id, line.quantity - 1)}
                    sx={{ width: 25, height: 25, bgcolor: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }}
                  >
                    <RemoveIcon sx={{ fontSize: 11 }} />
                  </IconButton>
                  <Typography sx={{ minWidth: 18, textAlign: "center", fontWeight: 800, fontSize: 12 }}>
                    {formatNumber(line.quantity)}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="افزایش تعداد"
                    onClick={() => adjustCartLine(line.product_id, line.quantity + 1)}
                    sx={{ width: 25, height: 25, bgcolor: ACCENT, color: "#1a1712" }}
                  >
                    <AddIcon sx={{ fontSize: 11 }} />
                  </IconButton>
                </Box>
              </Box>
              <IconButton
                size="small"
                aria-label="حذف از سبد"
                onClick={() => adjustCartLine(line.product_id, 0)}
                sx={{ color: MUTED }}
              >
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
              <Typography sx={{ color: MUTED, fontWeight: 700 }}>کسر از اعتبار</Typography>
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
        <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 14, mt: 0.5, mb: 0.8 }}>روش پرداخت</Typography>
        <Box
          sx={{
            display: "flex",
            gap: 0.6,
            mb: paymentMethod ? 0.8 : 1.2,
          }}
        >
          {paymentMethods.map((method) => {
            const active = paymentMethod === method.key;
            return (
              <Box
                key={method.key}
                onClick={() => {
                  setPaymentMethod(method.key);
                  if (method.key !== "card_to_card") clearReceipt();
                }}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "center",
                  px: 0.6,
                  py: 0.85,
                  borderRadius: "12px",
                  cursor: "pointer",
                  bgcolor: active ? ACCENT : SURFACE_ALT,
                  color: active ? "#1a1408" : TEXT,
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1.3,
                  border: active ? "none" : "1px solid rgba(212,175,55,0.16)",
                }}
              >
                {method.label}
              </Box>
            );
          })}
        </Box>
        {receiptError ? (
          <Typography sx={{ color: "#e57373", fontSize: 12, mb: 1, mt: -0.4, lineHeight: 1.7 }}>
            {receiptError}
          </Typography>
        ) : null}
        {paymentMethod === "online" ? (
          <Typography sx={{ color: MUTED, fontSize: 12, mb: 1.2, lineHeight: 1.7 }}>
            درگاه آنلاین فعلاً فعال نیست؛ انتخاب شما ثبت می‌شود و پرسنل بعد از تأیید فاکتور می‌سازند.
          </Typography>
        ) : null}
        {paymentMethod === "pos" ? (
          <Typography sx={{ color: MUTED, fontSize: 12, mb: 1.2, lineHeight: 1.7 }}>
            پرداخت را روی کارتخوان فروشگاه انجام دهید تا پرسنل تأیید کنند.
          </Typography>
        ) : null}
        {paymentMethod === "card_to_card" ? (
          <Box sx={{ mb: 1.2 }}>
            {selectedPayMethod?.card_number ? (
              <>
                {selectedPayMethod.bank_name ? (
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>{selectedPayMethod.bank_name}</Typography>
                ) : null}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 14, direction: "ltr" }}>
                    {selectedPayMethod.card_number}
                  </Typography>
                  <IconButton size="small" onClick={() => copyCardNumber(selectedPayMethod.card_number)} sx={{ color: ACCENT }}>
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                {selectedPayMethod.card_holder ? (
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>{selectedPayMethod.card_holder}</Typography>
                ) : null}
              </>
            ) : (
              <Typography sx={{ color: MUTED, fontSize: 12, lineHeight: 1.7 }}>
                شماره کارت فروشگاه هنوز در تنظیمات ثبت نشده است.
              </Typography>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <Button
                fullWidth
                onClick={() => receiptInputRef.current?.click()}
                startIcon={<AttachFileIcon />}
                sx={{
                  py: 1,
                  borderRadius: "14px",
                  color: TEXT,
                  border: "1px dashed rgba(212,175,55,0.45)",
                  fontWeight: 700,
                }}
              >
                {receiptName ? "تغییر رسید" : "ارسال رسید کارت‌به‌کارت"}
              </Button>
              {receiptBase64 || (receiptName && receiptIsPdf) ? (
                <Box sx={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                  {receiptBase64 && !receiptIsPdf ? (
                    <Box
                      component="img"
                      src={receiptBase64}
                      alt="رسید"
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "10px",
                        objectFit: "cover",
                        display: "block",
                        border: "1px solid rgba(212,175,55,0.35)",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "10px",
                        bgcolor: SURFACE_ALT,
                        border: "1px solid rgba(212,175,55,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: ACCENT,
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      PDF
                    </Box>
                  )}
                  <IconButton
                    size="small"
                    aria-label="حذف رسید"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearReceipt();
                    }}
                    sx={{
                      position: "absolute",
                      top: -7,
                      left: -7,
                      width: 18,
                      height: 18,
                      bgcolor: "#1a1408",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.25)",
                      "&:hover": { bgcolor: "#000" },
                    }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ) : null}
            </Box>
          </Box>
        ) : null}
        <Button
          fullWidth
          variant="contained"
          disabled={submitting || cart.length === 0 || !paymentMethod}
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
        {lookupLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={28} sx={{ color: ACCENT }} />
          </Box>
        ) : guestOrders.length === 0 ? (
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
      <Drawer
        anchor="bottom"
        open={currentOpen}
        onClose={() => {
          setCurrentOpen(false);
          setCurrentDetail(null);
        }}
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
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>
            {currentDetail ? "جزئیات سفارش" : "سفارش جاری"}
          </Typography>
          {currentDetail ? (
            <Button onClick={() => setCurrentDetail(null)} sx={{ color: MUTED, minWidth: 0, fontSize: 13 }}>
              بازگشت
            </Button>
          ) : null}
        </Box>
        {currentLoading || currentDetailLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={28} sx={{ color: ACCENT }} />
          </Box>
        ) : currentDetail ? (
          <Box>
            <Typography sx={{ color: ACCENT, fontWeight: 800, fontSize: 16 }}>
              {formatNumber(getTableOrderAmount(currentDetail))} تومان
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.4 }}>
              {tablePaymentMethodLabel(currentDetail) || "—"}
              {currentDetail.status === "cancelled" ? " · لغو شده" : " · منتظر پرداخت"}
            </Typography>
            {getTableOrderProducts(currentDetail).length === 0 ? (
              <Typography sx={{ color: MUTED, fontSize: 13, mt: 2 }}>اقلامی ثبت نشده</Typography>
            ) : (
              <Box sx={{ mt: 1.5 }}>
                {getTableOrderProducts(currentDetail).map((product, index) => (
                  <Box
                    key={`${product.id ?? product.product_id ?? index}`}
                    sx={{ display: "flex", justifyContent: "space-between", py: 0.7, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <Typography sx={{ fontSize: 13, color: TEXT }}>
                      {product.name || product.product_name || "محصول"} × {formatNumber(Number(product.quantity) || 1)}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: MUTED }}>
                      {formatNumber(
                        Number(
                          product.line_total ??
                            (Number(product.sale_price) || Number(product.unit_price) || 0) *
                              (Number(product.quantity) || 1),
                        ),
                      )}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            {currentDetail.status !== "cancelled" ? (
              <Button
                fullWidth
                onClick={async () => {
                  if (!shopCode) return;
                  setCancellingOrder(true);
                  try {
                    const res = await apiRequestError(
                      "Post",
                      {},
                      phoneReady ? { phone: normalizedPhone } : {},
                      shopApi(`/api/table-order/${currentDetail.id}/cancel`),
                      false,
                      true,
                      "",
                    );
                    if (res?.hasError) {
                      toast.error(typeof res.message === "string" ? res.message : "لغو سفارش ناموفق بود");
                      return;
                    }
                    toast.success(typeof res.message === "string" ? res.message : "سفارش لغو شد");
                    setCurrentDetail(null);
                    void loadCurrentOrders(true);
                  } catch {
                    toast.error("خطا در ارتباط با سرور");
                  } finally {
                    setCancellingOrder(false);
                  }
                }}
                disabled={cancellingOrder}
                sx={{ mt: 2, color: "#e57373", fontWeight: 700 }}
              >
                {cancellingOrder ? "..." : "لغو این سفارش"}
              </Button>
            ) : null}
          </Box>
        ) : currentOrders.length === 0 ? (
          <Typography sx={{ textAlign: "center", color: MUTED, py: 4 }}>
            سفارش بازی برای این میز نیست. بعد از تأیید صندوق از اینجا برداشته می‌شود.
          </Typography>
        ) : (
          <Box sx={{ overflowY: "auto" }}>
            {currentOrders.map((order) => (
              <Box
                key={order.id}
                onClick={() => void openCurrentDetail(order)}
                sx={{
                  bgcolor: SURFACE_ALT,
                  borderRadius: "16px",
                  p: 1.25,
                  mb: 1,
                  border: "1px solid rgba(212,175,55,0.1)",
                  cursor: "pointer",
                  opacity: order.status === "cancelled" ? 0.55 : 1,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 13, color: TEXT }}>
                    {order.table_label || tableLabel}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: MUTED }}>
                    {order.status === "cancelled" ? "لغو شده" : "منتظر پرداخت"}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 14, color: ACCENT, fontWeight: 800, mt: 0.4 }}>
                  {formatNumber(getTableOrderAmount(order))} تومان
                </Typography>
                <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.25 }}>
                  {tablePaymentMethodLabel(order) || ""}
                </Typography>
              </Box>
            ))}
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
          <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="09121234567"
              value={phone}
              inputProps={{ inputMode: "numeric", maxLength: 11, readOnly: guestIdentified }}
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
            {lookupLoading ? (
              <Box sx={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CircularProgress size={20} sx={{ color: ACCENT }} />
              </Box>
            ) : guestIdentified ? (
              <IconButton
                aria-label="حذف شماره"
                onClick={() => {
                  setPhone("");
                  setLookupPhone("");
                  setCredit(0);
                  setHasCredit(false);
                  setGuestOrders([]);
                  setUseCredit(false);
                  if (shopCode) clearSavedGuestPhone(shopCode);
                }}
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  color: TEXT,
                  bgcolor: SURFACE_ALT,
                  border: "1px solid rgba(255,255,255,0.12)",
                  "&:hover": { bgcolor: "#2a2a2a", color: "#e57373" },
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            ) : null}
          </Box>
          {guestIdentified ? (
            <>
              <Typography sx={{ mt: 1.2, fontSize: 13, color: hasCredit && credit > 0 ? ACCENT : MUTED, fontWeight: 700 }}>
                {hasCredit && credit > 0 ? `اعتبار شما: ${formatNumber(credit)} تومان` : "اعتباری برای این شماره ثبت نشده"}
              </Typography>
              <Button
                fullWidth
                onClick={() => setLoginOpen(false)}
                sx={{
                  mt: 1.5,
                  py: 1.1,
                  borderRadius: "14px",
                  bgcolor: SURFACE_ALT,
                  color: TEXT,
                  fontWeight: 800,
                  "&:hover": { bgcolor: "#2a2a2a" },
                }}
              >
                بستن
              </Button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <input
        ref={receiptInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
        hidden
        onChange={(e) => pickReceiptFile(e.target.files?.[0] || null, false)}
      />
      <Drawer
        anchor="bottom"
        open={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
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
        <Box sx={{ width: 42, height: 5, borderRadius: 99, bgcolor: themeMode === "dark" ? "#3a3a3a" : "#d8d2c8", mx: "auto", mb: 1.5 }} />
        {detailProduct ? (
          <Box>
            <Box
              component="img"
              src={productImage(detailProduct, categoryImageById)}
              alt={detailProduct.name}
              width={480}
              height={220}
              sx={{
                width: "100%",
                height: 220,
                objectFit: "cover",
                borderRadius: "16px",
                bgcolor: SURFACE_ALT,
                mb: 1.5,
              }}
            />
            <Typography sx={{ fontWeight: 800, fontSize: 20, color: TEXT, mb: 0.6 }}>
              {detailProduct.name}
            </Typography>
            {detailProduct.description ? (
              <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.8, mb: 1.2 }}>
                {detailProduct.description}
              </Typography>
            ) : null}
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: TEXT, mb: 1.5 }}>
              {formatNumber(Number(detailProduct.sale_price) || 0)} تومان
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <IconButton
                  aria-label="کاهش"
                  onClick={() => setQty(detailProduct, Math.max(0, qtyOf(detailProduct.id) - 1))}
                  sx={{ width: 31, height: 31, bgcolor: SURFACE_ALT, border: `1px solid ${BORDER}`, color: TEXT }}
                >
                  <RemoveIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <Typography sx={{ minWidth: 22, textAlign: "center", fontWeight: 800, fontSize: 13 }}>
                  {formatNumber(qtyOf(detailProduct.id))}
                </Typography>
                <IconButton
                  aria-label="افزایش"
                  onClick={() => setQty(detailProduct, qtyOf(detailProduct.id) + 1)}
                  sx={{ width: 31, height: 31, bgcolor: SURFACE_ALT, border: `1px solid ${BORDER}`, color: TEXT }}
                >
                  <AddIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
              <Button
                variant="contained"
                onClick={() => {
                  if (qtyOf(detailProduct.id) === 0) setQty(detailProduct, 1);
                  setDetailProduct(null);
                }}
                sx={{
                  flex: 1,
                  py: 1.35,
                  borderRadius: "14px",
                  bgcolor: ACCENT,
                  color: "#1a1712",
                  fontWeight: 800,
                  "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1712" },
                }}
              >
                {qtyOf(detailProduct.id) > 0 ? "تأیید" : "افزودن به سبد"}
              </Button>
            </Box>
          </Box>
        ) : null}
      </Drawer>
      <ToastContainer position="bottom-center" autoClose={3000} theme={themeMode} />
    </Box>
  );
}
