"use client";

import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  Autocomplete,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KitchenIcon from "@mui/icons-material/Kitchen";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  asProducedGood,
  asProductionRecord,
  asRawMaterial,
  categoryIdsFromGood,
  extractList,
  formatKg,
  formatToman,
  isPieceMaterial,
  materialPriceLabel,
  materialUnitLabel,
  isPercentSaleMode,
  isRoundSalePrice,
  layerOrderFromGood,
  parseAmount,
  profitPercentFromSale,
  recipeLinesFromGood,
  applySalePriceRounding,
  salePriceFromProfitPercent,
  storedMarkupPercent,
  type ProducedGood,
  type ProductionRecord,
  type RawMaterial,
  type RecipeLine,
  type SalePriceMode,
} from "@/app/lib/productionCosting";
import { formatAmountInput } from "@/app/lib/amountInput";
import { useShopPermissionGate } from "@/app/lib/shopPermissions";
import InvoiceLinkFields, {
  buildInvoiceLinkPayload,
  emptyInvoiceLinkState,
  validateInvoiceLink,
  type InvoiceLinkState,
} from "@/app/admin/production/InvoiceLinkFields";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: 12,
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": {
    color: "var(--admin-text-muted)",
    fontSize: 12,
    right: 14,
    left: "auto",
    transformOrigin: "top right",
    textAlign: "right",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(-14px, -9px) scale(0.75)",
  },
  "& .MuiInputBase-input": {
    py: "6px",
    fontSize: 12,
    textAlign: "right",
    direction: "rtl",
  },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)", left: 7, right: "auto" },
} as const;

const dialogGridSx = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 1,
  pt: "12px !important",
  direction: "rtl",
} as const;

type ShopCategoryOption = { id: number; name: string; children?: ShopCategoryOption[] };

function flattenCategories(cats: ShopCategoryOption[], prefix = ""): { id: number; name: string }[] {
  const out: { id: number; name: string }[] = [];
  for (const cat of cats) {
    const label = prefix ? `${prefix} / ${cat.name}` : cat.name;
    if (cat.id != null) out.push({ id: Number(cat.id), name: label });
    if (cat.children?.length) out.push(...flattenCategories(cat.children, label));
  }
  return out;
}

function extractCategoryTree(res: unknown): ShopCategoryOption[] {
  if (!res || typeof res !== "object") return [];
  if (Array.isArray(res)) return res as ShopCategoryOption[];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.data)) return r.data as ShopCategoryOption[];
  const nested = r.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const d = nested as Record<string, unknown>;
    if (Array.isArray(d.categories)) return d.categories as ShopCategoryOption[];
    if (Array.isArray(d.tree)) return d.tree as ShopCategoryOption[];
  }
  if (Array.isArray(r.categories)) return r.categories as ShopCategoryOption[];
  if (Array.isArray(r.tree)) return r.tree as ShopCategoryOption[];
  return [];
}

const StyledTableCell = styled(TableCell)({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: 600,
    fontSize: 12,
    padding: "8px 10px",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 12,
    padding: "7px 10px",
    whiteSpace: "nowrap",
    textAlign: "center",
    "& .MuiTypography-root": { fontSize: 12 },
  },
});

const StyledTableRow = styled(TableRow)({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": { backgroundColor: "var(--admin-surface-alt)" },
  "&:hover": { backgroundColor: "var(--admin-menu-hover)" },
  "&:last-child td, &:last-child th": { border: 0 },
});

const tableWrapSx = {
  backgroundColor: "var(--admin-surface)",
  borderRadius: "10px",
  border: "1px solid var(--admin-border)",
  boxShadow: "none",
  overflowX: "auto",
} as const;

const actionBtnSx = {
  color: "var(--admin-text-muted)",
  p: 0.4,
} as const;

type TabKey = "stock" | "materials" | "goods";

const emptyLine = (): RecipeLine => ({ raw_material_id: "", grams_per_kg: 0, is_removable: false });

const LAYER_IMAGE_MAX_BYTES = 3 * 1024 * 1024;

const checkerSx = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg, #d9d9d9 25%, transparent 25%), linear-gradient(-45deg, #d9d9d9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d9d9d9 75%), linear-gradient(-45deg, transparent 75%, #d9d9d9 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
} as const;

function layerImageSrc(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/storage/") ? `https://api.webinoo-plus.ir${url}` : url;
}

export default function ProductionCostingPage() {
  const { can } = useShopPermissionGate();
  const canMaterials = can("raw_materials");
  const canGoods = can("produced_goods");
  const [tab, setTab] = useState<TabKey>(canGoods ? "stock" : "materials");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [goods, setGoods] = useState<ProducedGood[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMaterialId, setExpandedMaterialId] = useState<number | null>(null);

  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [materialName, setMaterialName] = useState("");
  const [materialUnit, setMaterialUnit] = useState<"kg" | "piece">("kg");
  const [lotQty, setLotQty] = useState("");
  const [lotPrice, setLotPrice] = useState("");
  const [invoiceLink, setInvoiceLink] = useState<InvoiceLinkState>(emptyInvoiceLinkState);

  const [lotDialogMaterial, setLotDialogMaterial] = useState<RawMaterial | null>(null);

  const [goodDialogOpen, setGoodDialogOpen] = useState(false);
  const [editingGood, setEditingGood] = useState<ProducedGood | null>(null);
  const [goodName, setGoodName] = useState("");
  const [goodUnit, setGoodUnit] = useState<"kg" | "piece">("kg");
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([emptyLine()]);
  const [layerOrder, setLayerOrder] = useState<number[]>([]);
  // عکس لایهٔ ماده اولیه (منوی سه‌بعدی)
  const [layerDataUrl, setLayerDataUrl] = useState<string | null>(null);
  const [layerRemoved, setLayerRemoved] = useState(false);
  const [goodCategoryIds, setGoodCategoryIds] = useState<number[]>([]);
  const [shopCategories, setShopCategories] = useState<ShopCategoryOption[]>([]);

  const [produceGood, setProduceGood] = useState<ProducedGood | null>(null);
  const [produceKg, setProduceKg] = useState("1");
  const [producePreview, setProducePreview] = useState<ProducedGood | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [lastProduction, setLastProduction] = useState<ProductionRecord | null>(null);
  const [saleGood, setSaleGood] = useState<ProducedGood | null>(null);
  const [salePrice, setSalePrice] = useState("");
  const [salePercent, setSalePercent] = useState("");
  const [salePriceMode, setSalePriceMode] = useState<SalePriceMode>("percent");
  const [roundSalePrice, setRoundSalePrice] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "material"; item: RawMaterial }
    | { kind: "good"; item: ProducedGood }
    | { kind: "lot"; material: RawMaterial; lotId: number }
    | null
  >(null);

  const loadAll = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [materialsRes, goodsRes] = await Promise.all([
        FetchWithJwtClient("GET", "/api/raw-materials?with_all_lots=1", token),
        FetchWithJwtClient("GET", "/api/produced-goods", token),
      ]);
      if (materialsRes?.hasError) {
        toast.error(getApiErrorMessage(materialsRes, "خطا در دریافت مواد اولیه"));
      } else {
        setMaterials(extractList<RawMaterial>(materialsRes));
      }
      if (goodsRes?.hasError) {
        toast.error(getApiErrorMessage(goodsRes, "خطا در دریافت کالاهای تولیدی"));
      } else {
        setGoods(extractList<ProducedGood>(goodsRes));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const token = tokenCode();
    if (!token) return;
    let cancelled = false;
    void FetchWithJwtClient("GET", "/api/category?tree=true", token).then((res) => {
      if (cancelled || res?.hasError) return;
      setShopCategories(extractCategoryTree(res));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tab === "materials" && !canMaterials && canGoods) setTab("stock");
    if ((tab === "stock" || tab === "goods") && !canGoods && canMaterials) setTab("materials");
  }, [tab, canMaterials, canGoods]);

  const searchText = searchQuery.trim().toLowerCase();
  const filteredGoods = useMemo(() => {
    if (!searchText) return goods;
    return goods.filter((item) => String(item.name || "").toLowerCase().includes(searchText));
  }, [goods, searchText]);
  const filteredMaterials = useMemo(() => {
    if (!searchText) return materials;
    return materials.filter((item) => String(item.name || "").toLowerCase().includes(searchText));
  }, [materials, searchText]);
  const searchPlaceholder =
    tab === "materials" ? "جستجوی ماده اولیه" : tab === "goods" ? "جستجوی کالای تولیدی" : "جستجوی کالا";

  useEffect(() => {
    if (!produceGood) {
      setProducePreview(null);
      return;
    }
    const kg = parseAmount(produceKg);
    if (kg <= 0) {
      setProducePreview(null);
      return;
    }
    const token = tokenCode();
    if (!token) return;
    let cancelled = false;
    setPreviewLoading(true);
    const timer = window.setTimeout(async () => {
      const res = await FetchWithJwtClient(
        "GET",
        `/api/produced-goods/${produceGood.id}`,
        token,
        { quantity_kg: kg },
      );
      if (cancelled) return;
      setPreviewLoading(false);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "پیش‌نمایش هزینه ناموفق بود"));
        return;
      }
      setProducePreview(asProducedGood(res));
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [produceGood, produceKg]);

  const openCreateMaterial = () => {
    setEditingMaterial(null);
    setMaterialName("");
    setMaterialUnit("kg");
    setLotQty("");
    setLotPrice("");
    setInvoiceLink(emptyInvoiceLinkState());
    setLayerDataUrl(null);
    setLayerRemoved(false);
    setMaterialDialogOpen(true);
  };

  const openEditMaterial = (material: RawMaterial) => {
    setEditingMaterial(material);
    setMaterialName(material.name);
    setMaterialUnit(isPieceMaterial(material) ? "piece" : "kg");
    setLotQty("");
    setLotPrice("");
    setInvoiceLink(emptyInvoiceLinkState());
    setLayerDataUrl(null);
    setLayerRemoved(false);
    setMaterialDialogOpen(true);
  };

  const pickLayerFile = (file: File | undefined | null) => {
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/webp") {
      toast.error("عکس لایه باید PNG یا WebP با پس‌زمینهٔ شفاف باشد");
      return;
    }
    if (file.size > LAYER_IMAGE_MAX_BYTES) {
      toast.error("حجم عکس لایه نباید بیشتر از ۳ مگابایت باشد");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLayerDataUrl(typeof reader.result === "string" ? reader.result : null);
      setLayerRemoved(false);
    };
    reader.readAsDataURL(file);
  };

  /** بعد از ذخیرهٔ ماده: آپلود یا حذف عکس لایه. false یعنی خطا (پیام داده شده). */
  const syncLayerImage = async (materialId: number, token: string): Promise<boolean> => {
    if (layerDataUrl) {
      const res = await FetchWithJwtClient(
        "POST",
        `/api/raw-materials/${materialId}/layer-image`,
        token,
        {},
        { body: JSON.stringify({ image_base64: layerDataUrl }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ماده ذخیره شد ولی عکس لایه آپلود نشد"));
        return false;
      }
    } else if (layerRemoved && editingMaterial?.layer_image_url) {
      const res = await FetchWithJwtClient("DELETE", `/api/raw-materials/${materialId}/layer-image`, token, {});
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "حذف عکس لایه ناموفق بود"));
        return false;
      }
    }
    return true;
  };

  const saveMaterial = async () => {
    const name = materialName.trim();
    if (!name) {
      toast.error("نام ماده اولیه را وارد کنید");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      if (editingMaterial) {
        const res = await FetchWithJwtClient(
          "PUT",
          `/api/raw-materials/${editingMaterial.id}`,
          token,
          {},
          { body: JSON.stringify({ name }) },
        );
        if (res?.hasError) {
          toast.error(getApiErrorMessage(res, "ویرایش ماده اولیه ناموفق بود"));
          return;
        }
        await syncLayerImage(editingMaterial.id, token);
        toast.success("ماده اولیه به‌روز شد");
      } else {
        const qty = parseAmount(lotQty);
        const price = parseAmount(lotPrice);
        const isPiece = materialUnit === "piece";
        if (invoiceLink.createInvoice && (qty <= 0 || price <= 0)) {
          toast.error(`برای ایجاد فاکتور، مقدار و ${isPiece ? "قیمت هر عدد" : "قیمت هر کیلو"} را وارد کنید`);
          return;
        }
        if (isPiece && qty > 0 && !Number.isInteger(qty)) {
          toast.error("تعداد باید عدد صحیح باشد");
          return;
        }
        const invoiceError = validateInvoiceLink(invoiceLink, qty * price);
        if (invoiceError) {
          toast.error(invoiceError);
          return;
        }

        if (invoiceLink.createInvoice) {
          const res = await FetchWithJwtClient(
            "POST",
            "/api/raw-materials",
            token,
            {},
            {
              body: JSON.stringify({
                name,
                unit_type: materialUnit,
                quantity_kg: qty,
                price_per_kg: price,
                ...buildInvoiceLinkPayload(invoiceLink, qty * price),
              }),
            },
          );
          if (res?.hasError) {
            toast.error(getApiErrorMessage(res, "ثبت ماده اولیه ناموفق بود"));
            return;
          }
          const createdWithInvoice = asRawMaterial(res);
          if (createdWithInvoice) await syncLayerImage(createdWithInvoice.id, token);
        } else {
          const res = await FetchWithJwtClient(
            "POST",
            "/api/raw-materials",
            token,
            {},
            { body: JSON.stringify({ name, unit_type: materialUnit }) },
          );
          if (res?.hasError) {
            toast.error(getApiErrorMessage(res, "ثبت ماده اولیه ناموفق بود"));
            return;
          }
          const created = asRawMaterial(res);
          if (created) await syncLayerImage(created.id, token);
          if (created && qty > 0 && price > 0) {
            const lotRes = await FetchWithJwtClient(
              "POST",
              `/api/raw-materials/${created.id}/lots`,
              token,
              {},
              { body: JSON.stringify({ quantity_kg: qty, price_per_kg: price }) },
            );
            if (lotRes?.hasError) {
              toast.error(getApiErrorMessage(lotRes, "ماده ثبت شد ولی خرید انبار ذخیره نشد"));
              await loadAll();
              setMaterialDialogOpen(false);
              return;
            }
          }
        }
        toast.success("ماده اولیه ثبت شد");
      }
      setMaterialDialogOpen(false);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const saveLot = async () => {
    if (!lotDialogMaterial) return;
    const qty = parseAmount(lotQty);
    const price = parseAmount(lotPrice);
    const lotIsPiece = isPieceMaterial(lotDialogMaterial);
    if (qty <= 0 || price <= 0) {
      toast.error(lotIsPiece ? "تعداد و قیمت هر عدد را وارد کنید" : "مقدار کیلو و قیمت هر کیلو را وارد کنید");
      return;
    }
    if (lotIsPiece && !Number.isInteger(qty)) {
      toast.error("تعداد باید عدد صحیح باشد");
      return;
    }
    const invoiceError = validateInvoiceLink(invoiceLink, qty * price);
    if (invoiceError) {
      toast.error(invoiceError);
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      const res = await FetchWithJwtClient(
        "POST",
        `/api/raw-materials/${lotDialogMaterial.id}/lots`,
        token,
        {},
        {
          body: JSON.stringify({
            quantity_kg: qty,
            price_per_kg: price,
            ...buildInvoiceLinkPayload(invoiceLink, qty * price),
          }),
        },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت خرید انبار ناموفق بود"));
        return;
      }
      toast.success("خرید به انبار اضافه شد");
      setLotDialogMaterial(null);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      let res: any;
      if (deleteTarget.kind === "material") {
        res = await FetchWithJwtClient("DELETE", `/api/raw-materials/${deleteTarget.item.id}`, token);
      } else if (deleteTarget.kind === "good") {
        res = await FetchWithJwtClient("DELETE", `/api/produced-goods/${deleteTarget.item.id}`, token);
      } else {
        res = await FetchWithJwtClient(
          "DELETE",
          `/api/raw-materials/${deleteTarget.material.id}/lots/${deleteTarget.lotId}`,
          token,
        );
      }
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "حذف ناموفق بود"));
        return;
      }
      toast.success("حذف شد");
      setDeleteTarget(null);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const openCreateGood = () => {
    if (!materials.length) {
      toast.error("اول حداقل یک ماده اولیه ثبت کنید");
      setTab("materials");
      return;
    }
    setEditingGood(null);
    setGoodName("");
    setGoodUnit("kg");
    setRecipeLines([emptyLine()]);
    setLayerOrder([]);
    setGoodCategoryIds([]);
    setGoodDialogOpen(true);
  };

  const openEditGood = (good: ProducedGood) => {
    setEditingGood(good);
    setGoodName(good.name);
    setGoodUnit(isPieceMaterial(good) ? "piece" : "kg");
    setRecipeLines(recipeLinesFromGood(good));
    setLayerOrder(layerOrderFromGood(good));
    setGoodCategoryIds(categoryIdsFromGood(good));
    setGoodDialogOpen(true);
  };

  const saveGood = async () => {
    const name = goodName.trim();
    if (!name) {
      toast.error("نام کالا را وارد کنید");
      return;
    }
    const ingredients = recipeLines
      .filter((line) => line.raw_material_id !== "" && line.grams_per_kg > 0)
      .map((line) => ({
        raw_material_id: Number(line.raw_material_id),
        grams_per_kg: line.grams_per_kg,
        is_removable: line.is_removable === true,
      }));
    if (!ingredients.length) {
      toast.error("حداقل یک ماده با مقدار گرم وارد کنید");
      return;
    }
    if (new Set(ingredients.map((line) => line.raw_material_id)).size !== ingredients.length) {
      toast.error("یک ماده را دو بار در فرمول نگذارید");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      const recipeIds = new Set(ingredients.map((line) => line.raw_material_id));
      const payload: Record<string, unknown> = {
        name,
        ingredients,
        category_ids: goodCategoryIds,
        layer_order: layerOrder.filter((id) => recipeIds.has(id)),
      };
      if (!editingGood) payload.unit_type = goodUnit;
      if (editingGood && isPercentSaleMode(editingGood)) {
        const markup = storedMarkupPercent(editingGood);
        if (markup != null) payload.markup_percent = markup;
      }
      if (editingGood) {
        payload.round_sale_price = isRoundSalePrice(editingGood);
      }
      const body = JSON.stringify(payload);
      const res = editingGood
        ? await FetchWithJwtClient("PUT", `/api/produced-goods/${editingGood.id}`, token, {}, { body })
        : await FetchWithJwtClient("POST", "/api/produced-goods", token, {}, { body });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره کالا ناموفق بود"));
        return;
      }
      toast.success(editingGood ? "فرمول کالا به‌روز شد" : "کالای تولیدی ثبت شد");
      setGoodDialogOpen(false);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const previewSaleFromPercent = (cost: number, percent: number, round: boolean) => {
    if (cost <= 0) return "";
    return formatAmountInput(String(applySalePriceRounding(salePriceFromProfitPercent(cost, percent), round)));
  };

  const openSalePrice = (good: ProducedGood) => {
    const cost = Number(good.cost_per_kg) || 0;
    const price = Number(good.sale_price) || 0;
    const mode: SalePriceMode = isPercentSaleMode(good) ? "percent" : "manual";
    const round = isRoundSalePrice(good);
    setSaleGood(good);
    setSalePriceMode(mode);
    setRoundSalePrice(round);
    if (mode === "percent") {
      const percent = storedMarkupPercent(good) ?? profitPercentFromSale(cost, price);
      setSalePercent(good.markup_percent != null || percent ? String(percent) : "");
      const preview = previewSaleFromPercent(cost, percent, round);
      setSalePrice(preview || (price ? formatAmountInput(String(Math.round(price))) : ""));
      return;
    }
    setSalePrice(price ? formatAmountInput(String(Math.round(price))) : "");
    const percent = profitPercentFromSale(cost, price);
    setSalePercent(percent ? String(percent) : "");
  };

  const onSalePriceModeChange = (_: unknown, mode: SalePriceMode | null) => {
    if (!mode) return;
    setSalePriceMode(mode);
    const cost = Number(saleGood?.cost_per_kg) || 0;
    if (mode === "percent") {
      const typed = salePercent.trim() === "" ? null : parseAmount(salePercent);
      const percent = typed != null ? typed : profitPercentFromSale(cost, parseAmount(salePrice));
      if (salePercent.trim() !== "" || percent) setSalePercent(String(percent));
      const preview = previewSaleFromPercent(cost, percent, roundSalePrice);
      if (preview) setSalePrice(preview);
      return;
    }
    const price = parseAmount(salePrice);
    setSalePercent(cost > 0 && price > 0 ? String(profitPercentFromSale(cost, price)) : salePercent);
  };

  const onRoundSalePriceChange = (round: boolean) => {
    setRoundSalePrice(round);
    if (salePriceMode !== "percent") return;
    const cost = Number(saleGood?.cost_per_kg) || 0;
    const preview = previewSaleFromPercent(cost, parseAmount(salePercent), round);
    if (preview) setSalePrice(preview);
  };

  const onSalePriceChange = (raw: string) => {
    setSalePriceMode("manual");
    const formatted = formatAmountInput(raw);
    setSalePrice(formatted);
    const cost = Number(saleGood?.cost_per_kg) || 0;
    const price = parseAmount(formatted);
    setSalePercent(cost > 0 && price > 0 ? String(profitPercentFromSale(cost, price)) : "");
  };

  const onSalePercentChange = (raw: string) => {
    setSalePriceMode("percent");
    setSalePercent(raw);
    const cost = Number(saleGood?.cost_per_kg) || 0;
    const preview = previewSaleFromPercent(cost, parseAmount(raw), roundSalePrice);
    if (preview) setSalePrice(preview);
  };

  const saveSalePrice = async () => {
    if (!saleGood) return;
    const token = tokenCode();
    if (!token) return;
    let body: Record<string, unknown>;
    if (salePriceMode === "percent") {
      const percent = parseAmount(salePercent);
      if (salePercent.trim() === "" || percent < 0) {
        toast.error("درصد سود را وارد کنید");
        return;
      }
      body = { markup_percent: percent, round_sale_price: roundSalePrice };
    } else {
      const price = parseAmount(salePrice);
      if (price < 0) {
        toast.error("قیمت فروش نامعتبر است");
        return;
      }
      body = { sale_price: price, markup_percent: null, round_sale_price: roundSalePrice };
    }
    setSaving(true);
    try {
      const res = await FetchWithJwtClient(
        "PUT",
        `/api/produced-goods/${saleGood.id}`,
        token,
        {},
        { body: JSON.stringify(body) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره قیمت فروش ناموفق بود"));
        return;
      }
      toast.success(salePriceMode === "percent" ? "درصد سود ذخیره شد" : "قیمت فروش به‌روز شد");
      setSaleGood(null);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const saveProduction = async () => {
    if (!produceGood) return;
    const kg = parseAmount(produceKg);
    if (kg <= 0) {
      toast.error(isPieceMaterial(produceGood) ? "تعداد تولید را وارد کنید" : "مقدار تولید را به کیلو وارد کنید");
      return;
    }
    if (isPieceMaterial(produceGood) && !Number.isInteger(kg)) {
      toast.error("تعداد تولید باید عدد صحیح باشد");
      return;
    }
    if (producePreview && producePreview.stock_sufficient === false) {
      toast.error("موجودی کافی نیست؛ تولید ثبت نمی‌شود");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      const res = await FetchWithJwtClient(
        "POST",
        `/api/produced-goods/${produceGood.id}/produce`,
        token,
        {},
        { body: JSON.stringify({ quantity_kg: kg }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "تولید ثبت نشد"));
        return;
      }
      const record = asProductionRecord(res);
      setLastProduction(record);
      toast.success(
        record
          ? `تولید ثبت شد. قیمت واقعی هر ${materialUnitLabel(record)} ${formatToman(record.cost_per_kg)} تومان`
          : "تولید ثبت شد",
      );
      setProduceGood(null);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const saleRawPrice = parseAmount(salePrice);
  const saleFinalPrice = applySalePriceRounding(saleRawPrice, roundSalePrice);
  const saleCost = Number(saleGood?.cost_per_kg) || 0;

  return (
    <Box sx={{ ...adminPageSx, px: { xs: 2, md: 3 }, pt: { xs: 1.5, md: 3 }, pb: { xs: 12, md: 5 } }}>
      <ToastContainer position="top-center" rtl />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap", mb: 1.25 }}>
        {tab !== "stock" && (
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={tab === "materials" ? openCreateMaterial : openCreateGood}
            sx={{
              ...adminButtonStartIconSx,
              backgroundColor: "var(--admin-accent)",
              color: "var(--admin-on-accent)",
              fontSize: 12,
              minHeight: 28,
              py: 0.25,
              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
            }}
          >
            {tab === "materials" ? "ماده اولیه" : "کالای تولیدی"}
          </Button>
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => setTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          mb: 1.25,
          minHeight: 36,
          "& .MuiTab-root": { color: "var(--admin-text-muted)", fontWeight: 600, fontSize: 13, minHeight: 36, py: 0 },
          "& .Mui-selected": { color: "var(--admin-accent) !important" },
          "& .MuiTabs-indicator": { backgroundColor: "var(--admin-accent)" },
        }}
      >
        {canGoods ? <Tab value="stock" icon={<WarehouseIcon />} iconPosition="start" label="موجودی" /> : null}
        {canMaterials ? <Tab value="materials" icon={<Inventory2Icon />} iconPosition="start" label="انبار مواد اولیه" /> : null}
        {canGoods ? <Tab value="goods" icon={<KitchenIcon />} iconPosition="start" label="کالای تولیدی" /> : null}
      </Tabs>

      <TextField
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={searchPlaceholder}
        sx={{ ...fieldSx, mb: 1.25 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "var(--admin-text-muted)" }} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : tab === "stock" ? (
        goods.length === 0 ? (
          <EmptyHint title="موجودی کالای تولیدی خالی است" text="بعد از تعریف کالا و ثبت تولید، موجودی و قیمت فروش اینجا دیده می‌شود." />
        ) : filteredGoods.length === 0 ? (
          <EmptyHint title="نتیجه‌ای پیدا نشد" text="نام دیگری جستجو کنید." />
        ) : (
          <TableContainer component={Paper} sx={tableWrapSx}>
            <Table size="small" aria-label="موجودی کالاهای تولیدی">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center">ردیف</StyledTableCell>
                  <StyledTableCell align="center">کالا</StyledTableCell>
                  <StyledTableCell align="center">موجودی</StyledTableCell>
                  <StyledTableCell align="center">قیمت تمام‌شده</StyledTableCell>
                  <StyledTableCell align="center">قیمت فروش</StyledTableCell>
                  <StyledTableCell align="center">سود</StyledTableCell>
                  <StyledTableCell align="center">درصد سود</StyledTableCell>
                  <StyledTableCell align="center">عملیات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGoods.map((good, index) => {
                  const cost = Number(good.cost_per_kg) || 0;
                  const sale = Number(good.sale_price) || 0;
                  const profit = good.profit_per_kg != null ? Number(good.profit_per_kg) : sale - cost;
                  const percentMode = isPercentSaleMode(good);
                  const percent = percentMode
                    ? storedMarkupPercent(good) ?? profitPercentFromSale(cost, sale)
                    : good.profit_percent != null
                      ? Number(good.profit_percent)
                      : profitPercentFromSale(cost, sale);
                  return (
                    <StyledTableRow key={good.id}>
                      <StyledTableCell align="center">{index + 1}</StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography sx={{ fontWeight: 600 }}>{good.name}</Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">{formatKg(good.stock_kg || 0)} {materialUnitLabel(good)}</StyledTableCell>
                      <StyledTableCell align="center">{formatToman(cost)}</StyledTableCell>
                      <StyledTableCell align="center" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                        {formatToman(sale)}
                      </StyledTableCell>
                      <StyledTableCell align="center" sx={{ color: profit >= 0 ? "var(--admin-accent)" : "#ef5350", fontWeight: 700 }}>
                        {formatToman(profit)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {percentMode || percent
                          ? `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(percent || 0)}٪`
                          : "—"}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Box sx={{ display: "flex", gap: 0.25, justifyContent: "center" }}>
                          <Tooltip title="قیمت فروش">
                            <IconButton size="small" onClick={() => openSalePrice(good)} sx={{ ...actionBtnSx, color: "var(--admin-warning-strong)" }}>
                              <LocalOfferIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ثبت تولید">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setProduceGood(good);
                                setProduceKg("1");
                                setProducePreview(null);
                              }}
                              sx={{ ...actionBtnSx, color: "var(--admin-accent)" }}
                            >
                              <PrecisionManufacturingIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ویرایش فرمول">
                            <IconButton size="small" onClick={() => openEditGood(good)} sx={{ ...actionBtnSx, color: "var(--admin-accent)" }}>
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف">
                            <IconButton size="small" onClick={() => setDeleteTarget({ kind: "good", item: good })} sx={{ ...actionBtnSx, color: "var(--admin-error)" }}>
                              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : tab === "materials" ? (
        materials.length === 0 ? (
          <EmptyHint title="هنوز ماده اولیه‌ای نیست" text="اول نام ماده را بسازید (کیلویی یا تعدادی)، بعد خرید انبار را با مقدار و قیمت هر کیلو یا هر عدد اضافه کنید." />
        ) : filteredMaterials.length === 0 ? (
          <EmptyHint title="نتیجه‌ای پیدا نشد" text="نام دیگری جستجو کنید." />
        ) : (
          <TableContainer component={Paper} sx={tableWrapSx}>
            <Table size="small" aria-label="انبار مواد اولیه">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center">ردیف</StyledTableCell>
                  <StyledTableCell align="center">نام</StyledTableCell>
                  <StyledTableCell align="center">موجودی</StyledTableCell>
                  <StyledTableCell align="center">قیمت لات بعدی</StyledTableCell>
                  <StyledTableCell align="center">عملیات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials.map((material, index) => {
                  const lots = material.lots || [];
                  const open = expandedMaterialId === material.id;
                  return (
                    <Fragment key={material.id}>
                      <StyledTableRow>
                        <StyledTableCell align="center">{index + 1}</StyledTableCell>
                        <StyledTableCell align="center">
                          <Typography sx={{ fontWeight: 600 }}>{material.name}</Typography>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          {formatKg(material.stock_kg || 0)}{" "}
                          <Typography component="span" sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
                            {materialUnitLabel(material)}
                          </Typography>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          {material.next_price_per_kg != null ? formatToman(material.next_price_per_kg) : "—"}
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <Box sx={{ display: "flex", gap: 0.25, justifyContent: "center" }}>
                            <Tooltip title="خرید جدید">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setLotDialogMaterial(material);
                                  setLotQty("");
                                  setLotPrice("");
                                  setInvoiceLink(emptyInvoiceLinkState());
                                }}
                                sx={{ ...actionBtnSx, color: "var(--admin-accent)" }}
                              >
                                <AddIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="ویرایش">
                              <IconButton size="small" onClick={() => openEditMaterial(material)} sx={{ ...actionBtnSx, color: "var(--admin-accent)" }}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="حذف">
                              <IconButton size="small" onClick={() => setDeleteTarget({ kind: "material", item: material })} sx={{ ...actionBtnSx, color: "#ef5350" }}>
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="لات‌ها">
                              <IconButton
                                size="small"
                                onClick={() => setExpandedMaterialId(open ? null : material.id)}
                                sx={{
                                  ...actionBtnSx,
                                  color: "var(--admin-text-muted)",
                                  transform: open ? "rotate(180deg)" : "none",
                                }}
                              >
                                <ExpandMoreIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </StyledTableCell>
                      </StyledTableRow>
                      {open ? (
                        <StyledTableRow>
                          <StyledTableCell align="center" colSpan={5} sx={{ whiteSpace: "normal", py: 1 }}>
                            {lots.length === 0 ? (
                              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>هنوز خریدی ثبت نشده.</Typography>
                            ) : (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <StyledTableCell align="center">ردیف</StyledTableCell>
                                    <StyledTableCell align="center">باقیمانده</StyledTableCell>
                                    <StyledTableCell align="center">مقدار خرید</StyledTableCell>
                                    <StyledTableCell align="center">{materialPriceLabel(material)}</StyledTableCell>
                                    <StyledTableCell align="center">فاکتور</StyledTableCell>
                                    <StyledTableCell align="center">عملیات</StyledTableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {lots.map((lot, lotIndex) => (
                                    <StyledTableRow key={lot.id}>
                                      <StyledTableCell align="center">{lotIndex + 1}</StyledTableCell>
                                      <StyledTableCell align="center">{formatKg(lot.remaining_kg)}</StyledTableCell>
                                      <StyledTableCell align="center">{formatKg(lot.quantity_kg)}</StyledTableCell>
                                      <StyledTableCell align="center">{formatToman(lot.price_per_kg)}</StyledTableCell>
                                      <StyledTableCell align="center">
                                        {lot.invoice_id
                                          ? lot.invoice_link === "item"
                                            ? `#${lot.invoice_id} آیتم`
                                            : `#${lot.invoice_id}`
                                          : "—"}
                                      </StyledTableCell>
                                      <StyledTableCell align="center">
                                        <IconButton
                                          size="small"
                                          onClick={() => setDeleteTarget({ kind: "lot", material, lotId: lot.id })}
                                          sx={{ ...actionBtnSx, color: "#ef5350" }}
                                        >
                                          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                      </StyledTableCell>
                                    </StyledTableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </StyledTableCell>
                        </StyledTableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : goods.length === 0 ? (
        <EmptyHint title="هنوز کالای تولیدی نیست" text="فرمول هر واحد کالا (هر کیلو یا هر عدد) را با گرم یا تعداد مواد بنویسید. هزینه از لات‌های موجود انبار حساب می‌شود." />
      ) : filteredGoods.length === 0 ? (
        <EmptyHint title="نتیجه‌ای پیدا نشد" text="نام دیگری جستجو کنید." />
      ) : (
          <TableContainer component={Paper} sx={tableWrapSx}>
            <Table size="small" aria-label="کالای تولیدی">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center">ردیف</StyledTableCell>
                  <StyledTableCell align="center">نام</StyledTableCell>
                  <StyledTableCell align="center">قیمت تمام‌شده</StyledTableCell>
                  <StyledTableCell align="center">مواد</StyledTableCell>
                  <StyledTableCell align="center">عملیات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGoods.map((good, index) => (
                  <StyledTableRow key={good.id}>
                    <StyledTableCell align="center">{index + 1}</StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography sx={{ fontWeight: 600 }}>{good.name}</Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                      {formatToman(good.cost_per_kg || 0)}
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ color: good.stock_sufficient === false ? "#ef5350" : "var(--admin-text-muted)" }}>
                      {good.stock_sufficient === false
                        ? "کمبود مواد"
                        : (good.ingredient_costs || []).length > 0
                          ? `${(good.ingredient_costs || []).length} ماده`
                          : "—"}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Box sx={{ display: "flex", gap: 0.25, justifyContent: "center" }}>
                        <Tooltip title="ثبت تولید">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setProduceGood(good);
                              setProduceKg("1");
                              setProducePreview(null);
                            }}
                            sx={{ ...actionBtnSx, color: "var(--admin-accent)" }}
                          >
                            <PrecisionManufacturingIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ویرایش">
                          <IconButton size="small" onClick={() => openEditGood(good)} sx={{ ...actionBtnSx, color: "var(--admin-accent)" }}>
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton size="small" onClick={() => setDeleteTarget({ kind: "good", item: good })} sx={{ ...actionBtnSx, color: "#ef5350" }}>
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      )}

      <Dialog open={materialDialogOpen} onClose={() => setMaterialDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700, py: 1, direction: "rtl" }}>
          {editingMaterial ? "ویرایش ماده اولیه" : "ماده اولیه جدید"}
        </DialogTitle>
        <DialogContent sx={dialogGridSx}>
          <TextField
            autoFocus
            size="small"
            label="نام"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            sx={{ ...fieldSx, gridColumn: editingMaterial ? "1 / -1" : undefined }}
          />
          {!editingMaterial && (
            <TextField
              select
              size="small"
              label="واحد"
              value={materialUnit}
              onChange={(e) => {
                const unit = e.target.value === "piece" ? "piece" : "kg";
                setMaterialUnit(unit);
                if (unit === "piece") setLotQty((prev) => String(Math.trunc(parseAmount(prev)) || ""));
              }}
              sx={fieldSx}
            >
              <MenuItem value="kg">کیلویی</MenuItem>
              <MenuItem value="piece">تعدادی (عدد)</MenuItem>
            </TextField>
          )}
          {!editingMaterial && (
            <>
              <TextField
                size="small"
                label={materialUnit === "piece" ? "تعداد (عدد)" : "مقدار (کیلو)"}
                value={lotQty}
                onChange={(e) => setLotQty(e.target.value)}
                inputMode={materialUnit === "piece" ? "numeric" : "decimal"}
                sx={fieldSx}
              />
              <TextField
                size="small"
                label={materialUnit === "piece" ? "قیمت هر عدد" : "قیمت هر کیلو"}
                value={lotPrice}
                onChange={(e) => setLotPrice(formatAmountInput(e.target.value))}
                inputMode="numeric"
                sx={fieldSx}
              />
              <Typography sx={{ gridColumn: "1 / -1", fontSize: 11, color: "var(--admin-text-muted)", textAlign: "right" }}>
                خرید اول انبار اختیاری است.
              </Typography>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <InvoiceLinkFields
                  value={invoiceLink}
                  onChange={setInvoiceLink}
                  lotTotal={parseAmount(lotQty) * parseAmount(lotPrice)}
                />
              </Box>
            </>
          )}
          {(() => {
            const existing = layerRemoved ? null : layerImageSrc(editingMaterial?.layer_image_url);
            const shown = layerDataUrl || existing;
            return (
              <Box
                sx={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1,
                  borderRadius: "12px",
                  border: "1px dashed var(--admin-border)",
                }}
              >
                <Box
                  sx={{
                    width: 84,
                    height: 64,
                    flexShrink: 0,
                    borderRadius: "10px",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    ...checkerSx,
                  }}
                >
                  {shown ? (
                    <Box component="img" src={shown} alt="" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  ) : (
                    <Typography sx={{ fontSize: 10, color: "#888" }}>بدون عکس</Typography>
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>
                    عکس لایه برای منوی سه‌بعدی
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", lineHeight: 1.7 }}>
                    PNG یا WebP با پس‌زمینهٔ شفاف، نمای از کنار (مثلاً یک برش نان یا یک پتی). حداکثر ۳ مگابایت.
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.8, mt: 0.6, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      sx={{ fontSize: 11 }}
                    >
                      {shown ? "تغییر عکس" : "انتخاب عکس"}
                      <input
                        hidden
                        type="file"
                        accept="image/png,image/webp"
                        onChange={(e) => {
                          pickLayerFile(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </Button>
                    {shown ? (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setLayerDataUrl(null);
                          setLayerRemoved(true);
                        }}
                        sx={{ fontSize: 11 }}
                      >
                        حذف عکس
                      </Button>
                    ) : null}
                  </Box>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 1.5, py: 1 }}>
          <Button size="small" onClick={() => setMaterialDialogOpen(false)}>انصراف</Button>
          <Button disabled={saving} onClick={() => void saveMaterial()} variant="contained" size="small" sx={{ backgroundColor: "var(--admin-accent)" }}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!lotDialogMaterial} onClose={() => setLotDialogMaterial(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700, py: 1, direction: "rtl" }}>
          خرید جدید {lotDialogMaterial?.name || ""}
        </DialogTitle>
        <DialogContent sx={dialogGridSx}>
          <TextField
            size="small"
            label={isPieceMaterial(lotDialogMaterial) ? "تعداد (عدد)" : "مقدار (کیلو)"}
            value={lotQty}
            onChange={(e) => setLotQty(e.target.value)}
            inputMode={isPieceMaterial(lotDialogMaterial) ? "numeric" : "decimal"}
            sx={fieldSx}
          />
          <TextField
            size="small"
            label={materialPriceLabel(lotDialogMaterial)}
            value={lotPrice}
            onChange={(e) => setLotPrice(formatAmountInput(e.target.value))}
            inputMode="numeric"
            sx={fieldSx}
          />
          <Box sx={{ gridColumn: "1 / -1" }}>
            <InvoiceLinkFields
              value={invoiceLink}
              onChange={setInvoiceLink}
              lotTotal={parseAmount(lotQty) * parseAmount(lotPrice)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 1.5, py: 1 }}>
          <Button size="small" onClick={() => setLotDialogMaterial(null)}>انصراف</Button>
          <Button disabled={saving} onClick={() => void saveLot()} variant="contained" size="small" sx={{ backgroundColor: "var(--admin-accent)" }}>
            ثبت خرید
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={goodDialogOpen} onClose={() => setGoodDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingGood ? "ویرایش کالای تولیدی" : "کالای تولیدی جدید"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <TextField label="نام کالا (مثلاً کلوچه یا ساندویچ)" value={goodName} onChange={(e) => setGoodName(e.target.value)} sx={fieldSx} />
          <TextField
            select
            label="واحد کالا"
            value={goodUnit}
            onChange={(e) => setGoodUnit(e.target.value === "piece" ? "piece" : "kg")}
            disabled={!!editingGood}
            helperText={
              editingGood
                ? "واحد کالا بعد از ثبت قابل تغییر نیست"
                : goodUnit === "piece"
                  ? "فرمول برای ۱ عدد کالا نوشته می‌شود (مثلاً ۱ ساندویچ = ۱ برگر)"
                  : "فرمول برای ۱ کیلو کالا نوشته می‌شود"
            }
            sx={fieldSx}
          >
            <MenuItem value="kg">کیلویی</MenuItem>
            <MenuItem value="piece">تعدادی (عدد)</MenuItem>
          </TextField>
          <Autocomplete
            multiple
            options={flattenCategories(shopCategories)}
            value={flattenCategories(shopCategories).filter((cat) => goodCategoryIds.includes(cat.id))}
            onChange={(_, value) => setGoodCategoryIds(value.map((cat) => cat.id))}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="دسته‌بندی‌ها" sx={fieldSx} />
            )}
          />
          <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
            {goodUnit === "piece"
              ? "مصرف هر ماده را برای ساخت «یک عدد» کالا وارد کنید: ماده کیلویی به گرم، ماده تعدادی (مثل برگر) به عدد."
              : "مصرف هر ماده را برای ساخت «یک کیلو» کالا وارد کنید: ماده کیلویی به گرم، ماده تعدادی (مثل برگر) به عدد."}
          </Typography>
          {recipeLines.map((line, index) => (
            <Box key={index} sx={{ display: "grid", gridTemplateColumns: "1fr 110px 40px", gap: 1, alignItems: "center" }}>
              <TextField
                select
                label="ماده اولیه"
                value={line.raw_material_id}
                onChange={(e) => {
                  const next = [...recipeLines];
                  next[index] = { ...next[index], raw_material_id: e.target.value === "" ? "" : Number(e.target.value) };
                  setRecipeLines(next);
                }}
                sx={fieldSx}
              >
                {materials.map((material) => (
                  <MenuItem key={material.id} value={material.id}>
                    {material.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={isPieceMaterial(materials.find((m) => m.id === line.raw_material_id)) ? "عدد" : "گرم"}
                value={line.grams_per_kg || ""}
                onChange={(e) => {
                  const next = [...recipeLines];
                  next[index] = { ...next[index], grams_per_kg: parseAmount(e.target.value) };
                  setRecipeLines(next);
                }}
                inputMode="decimal"
                sx={fieldSx}
              />
              <IconButton
                onClick={() => setRecipeLines(recipeLines.filter((_, i) => i !== index))}
                disabled={recipeLines.length === 1}
                sx={{ color: "#ef5350" }}
              >
                <DeleteOutlineIcon />
              </IconButton>
              <FormControlLabel
                sx={{ gridColumn: "1 / -1", m: 0, justifyContent: "flex-start" }}
                control={
                  <Switch
                    size="small"
                    checked={line.is_removable === true}
                    disabled={line.raw_material_id === ""}
                    onChange={(e) => {
                      const next = [...recipeLines];
                      next[index] = { ...next[index], is_removable: e.target.checked };
                      setRecipeLines(next);
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 11.5, color: "var(--admin-text-muted)" }}>
                    مشتری در منوی سه‌بعدی بتواند این ماده را بردارد
                  </Typography>
                }
              />
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={() => setRecipeLines([...recipeLines, emptyLine()])} sx={adminButtonStartIconSx}>
            ماده بعدی
          </Button>

          {(() => {
            const recipeMaterialIds = Array.from(
              new Set(recipeLines.map((line) => Number(line.raw_material_id)).filter((id) => id > 0)),
            );
            const materialById = new Map(materials.map((m) => [m.id, m] as const));
            const rows = layerOrder.filter((id) => recipeMaterialIds.includes(id));
            const move = (from: number, to: number) => {
              if (to < 0 || to >= rows.length) return;
              const next = [...rows];
              const [item] = next.splice(from, 1);
              next.splice(to, 0, item);
              setLayerOrder(next);
            };
            return (
              <Box sx={{ mt: 1, p: 1.25, borderRadius: "14px", border: "1px solid var(--admin-border)" }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--admin-text)" }}>
                  ترتیب لایه‌ها در عکس منوی سه‌بعدی
                </Typography>
                <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", lineHeight: 1.8, mb: 1 }}>
                  از بالا به پایین. هر ماده می‌تواند چند بار بیاید (مثلاً نان برای بالا و پایین ساندویچ). عکس هر ماده را
                  در تب مواد اولیه آپلود کنید.
                </Typography>
                {rows.length === 0 ? (
                  <Typography sx={{ fontSize: 11.5, color: "var(--admin-text-muted)", mb: 1 }}>
                    خالی است؛ ترتیب فرمول استفاده می‌شود.
                  </Typography>
                ) : null}
                {rows.map((id, i) => {
                  const material = materialById.get(id);
                  const src = layerImageSrc(material?.layer_image_url);
                  return (
                    <Box
                      key={`${id}-${i}`}
                      sx={{ display: "flex", alignItems: "center", gap: 0.8, py: 0.5, borderBottom: "1px solid var(--admin-border)" }}
                    >
                      <Typography sx={{ width: 22, fontSize: 12, fontWeight: 800, color: "var(--admin-accent)", textAlign: "center" }}>
                        {i}
                      </Typography>
                      <Box
                        sx={{
                          width: 56,
                          height: 34,
                          borderRadius: "8px",
                          display: "grid",
                          placeItems: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                          ...checkerSx,
                        }}
                      >
                        {src ? (
                          <Box component="img" src={src} alt="" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        ) : (
                          <Typography sx={{ fontSize: 9, color: "#c62828" }}>بدون عکس</Typography>
                        )}
                      </Box>
                      <Typography sx={{ flex: 1, fontSize: 12.5, color: "var(--admin-text)" }}>
                        {material?.name || `#${id}`}
                      </Typography>
                      <IconButton size="small" disabled={i === 0} onClick={() => move(i, i - 1)}>
                        <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" disabled={i === rows.length - 1} onClick={() => move(i, i + 1)}>
                        <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: "#ef5350" }}
                        onClick={() => setLayerOrder(rows.filter((_, idx) => idx !== i))}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  );
                })}
                <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mt: 1 }}>
                  <TextField
                    select
                    size="small"
                    label="افزودن لایه"
                    value=""
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (id > 0) setLayerOrder([...rows, id]);
                    }}
                    disabled={recipeMaterialIds.length === 0}
                    sx={{ ...fieldSx, minWidth: 170 }}
                  >
                    {recipeMaterialIds.map((id) => (
                      <MenuItem key={id} value={id}>
                        {materialById.get(id)?.name || `#${id}`}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button size="small" onClick={() => setLayerOrder(recipeMaterialIds)} sx={{ fontSize: 11 }}>
                    پر کردن از فرمول
                  </Button>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoodDialogOpen(false)}>انصراف</Button>
          <Button disabled={saving} onClick={() => void saveGood()} variant="contained" sx={{ backgroundColor: "var(--admin-accent)" }}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!produceGood} onClose={() => setProduceGood(null)} fullWidth maxWidth="sm">
        <DialogTitle>ثبت تولید {produceGood?.name || ""}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <TextField
            label={isPieceMaterial(produceGood) ? "چند عدد تولید شود؟" : "چند کیلو تولید شود؟"}
            value={produceKg}
            onChange={(e) => setProduceKg(e.target.value)}
            inputMode="decimal"
            sx={fieldSx}
          />
          {previewLoading && <CircularProgress size={22} />}
          {producePreview && (() => {
            const hasShortage = producePreview.stock_sufficient === false;
            const goodUnitLabel = materialUnitLabel(produceGood);
            const accent = hasShortage ? "#ef5350" : "var(--admin-accent)";
            const ingredients = producePreview.ingredient_costs || [];
            const shortageCount = ingredients.filter((l) => (l.shortage_kg || 0) > 0).length;
            return (
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {hasShortage && (
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: "12px",
                      border: "1px solid rgba(239,83,80,0.45)",
                      backgroundColor: "rgba(239,83,80,0.1)",
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#ef5350" }}>
                      موجودی انبار برای {shortageCount > 0 ? `${shortageCount} ماده` : "این تولید"} کافی نیست
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mt: 0.25 }}>
                      ابتدا موجودی مواد کم‌شده را در انبار افزایش دهید یا مقدار تولید را کمتر کنید؛ تا آن موقع ثبت تولید ممکن نیست.
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  {[
                    { label: `هزینه هر ${goodUnitLabel}`, value: producePreview.cost_per_kg || 0, strong: true },
                    { label: "جمع هزینه این تولید", value: producePreview.total_cost || 0, strong: false },
                  ].map((stat) => (
                    <Box
                      key={stat.label}
                      sx={{
                        p: 1.25,
                        borderRadius: "12px",
                        backgroundColor: "var(--admin-surface-alt)",
                        border: "1px solid var(--admin-border)",
                      }}
                    >
                      <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{stat.label}</Typography>
                      <Typography sx={{ fontSize: stat.strong ? 18 : 16, fontWeight: 800, color: stat.strong ? accent : "var(--admin-text)" }}>
                        {formatToman(stat.value)}{" "}
                        <Typography component="span" sx={{ fontSize: 12, fontWeight: 400, color: "var(--admin-text-muted)" }}>
                          تومان
                        </Typography>
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {ingredients.length > 0 && (
                  <Box sx={{ display: "grid", gap: 0.75 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)" }}>
                      مواد مصرفی
                    </Typography>
                    {ingredients.map((line) => {
                      const unit = materialUnitLabel(
                        line.unit_type ? line : materials.find((m) => m.id === line.raw_material_id)
                      );
                      const short = (line.shortage_kg || 0) > 0;
                      const lots = line.lots || [];
                      const lineCost =
                        line.cost != null ? line.cost : lots.reduce((sum, lot) => sum + (Number(lot.cost) || 0), 0);
                      return (
                        <Box
                          key={line.raw_material_id}
                          sx={{
                            p: 1.25,
                            borderRadius: "12px",
                            backgroundColor: "var(--admin-surface-alt)",
                            border: `1px solid ${short ? "rgba(239,83,80,0.5)" : "var(--admin-border)"}`,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "var(--admin-text)" }}>
                              {line.name || `ماده ${line.raw_material_id}`}
                            </Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)" }}>
                              {formatToman(lineCost)} <span style={{ fontWeight: 400, color: "var(--admin-text-muted)", fontSize: 11 }}>تومان</span>
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.75 }}>
                            <Chip size="small" label={`مصرف: ${formatKg(line.needed_kg || 0)} ${unit}`} />
                            {short && (
                              <Chip
                                size="small"
                                label={`کمبود: ${formatKg(line.shortage_kg || 0)} ${unit}`}
                                sx={{ backgroundColor: "rgba(239,83,80,0.15)", color: "#ef5350", fontWeight: 700 }}
                              />
                            )}
                          </Box>
                          {lots.length > 0 && (
                            <Box sx={{ mt: 1, pt: 0.75, borderTop: "1px dashed var(--admin-border)", display: "grid", gap: 0.5 }}>
                              {lots.map((lot, i) => {
                                const virtual = !lot.lot_id;
                                return (
                                  <Box
                                    key={`${lot.lot_id ?? "short"}-${i}`}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      gap: 1,
                                      fontSize: 12,
                                      color: virtual ? "#ef5350" : "var(--admin-text-muted)",
                                    }}
                                  >
                                    <span>
                                      {virtual ? "بدون موجودی (قیمت تخمینی)" : `لات ${lot.lot_id}`}
                                      {" · "}
                                      {formatKg(lot.quantity_kg)} {unit} × {formatToman(lot.price_per_kg)}
                                    </span>
                                    <span style={{ fontWeight: 700 }}>{formatToman(lot.cost)}</span>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}

                <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                  این فقط پیش‌نمایش است؛ موجودی انبار تا زمانی که تولید را ثبت نکنید کم نمی‌شود.
                </Typography>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProduceGood(null)}>انصراف</Button>
          <Button
            disabled={saving || producePreview?.stock_sufficient === false}
            onClick={() => void saveProduction()}
            variant="contained"
            sx={{ backgroundColor: "var(--admin-accent)" }}
          >
            ثبت تولید
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!lastProduction} onClose={() => setLastProduction(null)} fullWidth maxWidth="sm">
        <DialogTitle>مصرف واقعی از انبار</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1, pt: "16px !important" }}>
          {lastProduction && (
            <>
              <Typography sx={{ fontWeight: 800, color: "var(--admin-accent)" }}>
                {formatKg(lastProduction.quantity_kg)} {materialUnitLabel(lastProduction)} {lastProduction.produced_good_name} · هر {materialUnitLabel(lastProduction)} {formatToman(lastProduction.cost_per_kg)} تومان
              </Typography>
              {(lastProduction.consumptions || []).map((row) => (
                <Typography key={row.id} sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                  {row.raw_material_name}: {formatKg(row.quantity_kg)}{" "}
                  {materialUnitLabel(materials.find((m) => m.id === row.raw_material_id))} از لات {row.raw_material_lot_id} با قیمت {formatToman(row.price_per_kg)} → {formatToman(row.cost)} تومان
                </Typography>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLastProduction(null)}>باشه</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!saleGood} onClose={() => setSaleGood(null)} fullWidth maxWidth="xs">
        <DialogTitle>قیمت فروش {saleGood?.name || ""}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
            قیمت تمام‌شده هر واحد: {formatToman(Number(saleGood?.cost_per_kg) || 0)} تومان
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={salePriceMode}
            onChange={onSalePriceModeChange}
            sx={{
              "& .MuiToggleButton-root": {
                color: "var(--admin-text)",
                borderColor: "var(--admin-border)",
                "&.Mui-selected": {
                  bgcolor: "var(--admin-accent)",
                  color: "var(--admin-on-accent)",
                  "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                },
              },
            }}
          >
            <ToggleButton value="percent">درصد</ToggleButton>
            <ToggleButton value="manual">دستی</ToggleButton>
          </ToggleButtonGroup>
          {/* <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
            {salePriceMode === "percent"
              ? "۵۰ یعنی فروش ۵۰٪ بالاتر از قیمت تمام‌شده. همین درصد ذخیره می‌شود و بعد از تولید بعدی، اگر هزینه مواد عوض شود، فروش به‌روز می‌شود."
              : "عدد فروش را خودتان می‌گذارید و با تغییر قیمت تمام‌شده عوض نمی‌شود."}
          </Typography> */}
          <TextField
            label="درصد سود"
            value={salePercent}
            onChange={(e) => onSalePercentChange(e.target.value)}
            inputMode="decimal"
            sx={fieldSx}
            helperText={salePriceMode === "percent" ? "با ذخیره این درصد، فروش خودکار محاسبه می‌شود" : "با زدن درصد، حالت خودکار فعال می‌شود"}
          />
          <TextField
            label={`قیمت فروش هر ${materialUnitLabel(saleGood)} (تومان)`}
            value={salePrice}
            onChange={(e) => onSalePriceChange(e.target.value)}
            inputMode="numeric"
            sx={fieldSx}
            helperText={salePriceMode === "manual" ? "با ذخیره این مبلغ، قیمت ثابت می‌ماند" : "با تغییر مبلغ، حالت دستی فعال می‌شود"}
          />
          <FormControlLabel
            sx={{ m: 0, color: "var(--admin-text)" }}
            control={
              <Switch
                checked={roundSalePrice}
                onChange={(e) => onRoundSalePriceChange(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--admin-accent)" },
                }}
              />
            }
            label="رند به نزدیک‌ترین هزار تومان"
          />
          {/* <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mt: -1 }}>
            {roundSalePrice
              ? salePriceMode === "percent"
                ? "بعد از هر تولید، اول درصد حساب می‌شود، بعد قیمت به نزدیک‌ترین هزار گرد می‌شود (۳۲۵۶۰ → ۳۳۰۰۰)."
                : "همین حالا رند می‌شود و با تولید بعدی عوض نمی‌شود."
              : "قیمت دقیق همان عدد محاسبه‌شده می‌ماند."}
          </Typography> */}
          {saleRawPrice > 0 && (
            <>
              {roundSalePrice && saleFinalPrice !== saleRawPrice && (
                <Typography sx={{ fontSize: 13, color: "var(--admin-text)", fontWeight: 700 }}>
                  بعد از رند: {formatToman(saleFinalPrice)} تومان
                </Typography>
              )}
              <Typography sx={{ fontSize: 13, color: "var(--admin-accent)", fontWeight: 700 }}>
                سود هر {materialUnitLabel(saleGood)}: {formatToman(saleFinalPrice - saleCost)} تومان
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaleGood(null)}>انصراف</Button>
          <Button disabled={saving} onClick={() => void saveSalePrice()} variant="contained" sx={{ backgroundColor: "var(--admin-accent)" }}>
            ذخیره قیمت
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>حذف شود؟</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteTarget?.kind === "material"
              ? `ماده اولیه «${deleteTarget.item.name}» حذف شود؟`
              : deleteTarget?.kind === "good"
                ? `کالای «${deleteTarget.item.name}» حذف شود؟`
                : "این خرید انبار حذف شود؟"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>انصراف</Button>
          <Button disabled={saving} onClick={() => void confirmDelete()} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function EmptyHint({ title, text }: { title: string; text: string }) {
  return (
    <Card sx={{ backgroundColor: "var(--admin-surface)", border: "1px dashed var(--admin-border)", borderRadius: "16px" }}>
      <CardContent>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 14 }}>{text}</Typography>
      </CardContent>
    </Card>
  );
}
