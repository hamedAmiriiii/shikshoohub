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
  Slider,
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
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import AssessmentIcon from "@mui/icons-material/Assessment";
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
  clampLayerGap,
  clampLayerScale,
  defaultLayerOrderEntry,
  LAYER_GAP_MAX,
  LAYER_GAP_MIN,
  LAYER_GAP_STEP,
  LAYER_SCALE_MAX,
  LAYER_SCALE_MIN,
  LAYER_SCALE_STEP,
  layerComposeFromGood,
  layerOrderFromGood,
  layerScaleTransform,
  type LayerComposeMode,
  type LayerOrderEntry,
  parseAmount,
  profitPercentFromSale,
  recipeLinesFromGood,
  recipeLineKey,
  isNestedRecipeLine,
  isFinalProducedGood,
  applySalePriceRounding,
  salePriceFromProfitPercent,
  storedMarkupPercent,
  type ProducedGood,
  type ProductionRecord,
  type RawMaterial,
  type RecipeLine,
  type SalePriceMode,
  type InventoryWaste,
  type InventoryWasteKind,
  type InventoryWasteSummary,
  asInventoryWaste,
  extractWasteList,
} from "@/app/lib/productionCosting";
import { formatAmountInput } from "@/app/lib/amountInput";
import { useShopPermissionGate } from "@/app/lib/shopPermissions";
import InvoiceLinkFields, {
  buildInvoiceLinkPayload,
  emptyInvoiceLinkState,
  purchaseInvoiceTitle,
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

type TabKey = "stock" | "materials" | "goods" | "waste";

type WasteTarget =
  | { kind: "raw_material"; item: RawMaterial }
  | { kind: "produced_good"; item: ProducedGood };

const emptyLine = (): RecipeLine => ({
  kind: "raw_material",
  raw_material_id: "",
  ingredient_produced_good_id: "",
  grams_per_kg: 0,
  is_removable: false,
  is_addable: false,
});

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
  const [goodIsFinal, setGoodIsFinal] = useState(true);
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([emptyLine()]);
  const [layerOrder, setLayerOrder] = useState<LayerOrderEntry[]>([]);
  const [layerCompose, setLayerCompose] = useState<LayerComposeMode>("side");
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number | null>(null);
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

  const [wasteTarget, setWasteTarget] = useState<WasteTarget | null>(null);
  const [wasteQty, setWasteQty] = useState("1");
  const [wasteNote, setWasteNote] = useState("");
  const [wastes, setWastes] = useState<InventoryWaste[]>([]);
  const [wasteSummary, setWasteSummary] = useState<InventoryWasteSummary | null>(null);
  const [wasteLoading, setWasteLoading] = useState(false);
  const [wasteKindFilter, setWasteKindFilter] = useState<"all" | InventoryWasteKind>("all");
  const [wasteFromDate, setWasteFromDate] = useState("");
  const [wasteToDate, setWasteToDate] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "material"; item: RawMaterial }
    | { kind: "good"; item: ProducedGood }
    | { kind: "lot"; material: RawMaterial; lotId: number }
    | { kind: "waste"; item: InventoryWaste }
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

  const loadWastes = useCallback(async () => {
    const token = tokenCode();
    if (!token) return;
    setWasteLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("paginate", "1");
      params.set("per_page", "50");
      if (wasteKindFilter !== "all") params.set("kind", wasteKindFilter);
      if (wasteFromDate) params.set("from_date", wasteFromDate);
      if (wasteToDate) params.set("to_date", wasteToDate);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await FetchWithJwtClient("GET", `/api/inventory-wastes?${params.toString()}`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت گزارش ضایعات"));
        return;
      }
      const parsed = extractWasteList(res);
      setWastes(parsed.rows);
      setWasteSummary(parsed.summary);
    } finally {
      setWasteLoading(false);
    }
  }, [wasteKindFilter, wasteFromDate, wasteToDate, searchQuery]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (tab === "waste") void loadWastes();
  }, [tab, loadWastes]);

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
    if (tab === "waste" && !canMaterials && !canGoods) setTab(canGoods ? "stock" : "materials");
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
    tab === "materials"
      ? "جستجوی ماده اولیه"
      : tab === "goods"
        ? "جستجوی کالای تولیدی"
        : tab === "waste"
          ? "جستجوی ضایعات (نام یا توضیح)"
          : "جستجوی کالا";

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
      } else if (deleteTarget.kind === "waste") {
        res = await FetchWithJwtClient("DELETE", `/api/inventory-wastes/${deleteTarget.item.id}`, token);
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
      toast.success(deleteTarget.kind === "waste" ? "ضایعات برگشت خورد" : "حذف شد");
      setDeleteTarget(null);
      await loadAll();
      if (tab === "waste") await loadWastes();
    } finally {
      setSaving(false);
    }
  };

  const openWaste = (target: WasteTarget) => {
    setWasteTarget(target);
    setWasteQty("1");
    setWasteNote("");
  };

  const saveWaste = async () => {
    if (!wasteTarget) return;
    const qty = parseAmount(wasteQty);
    if (qty <= 0) {
      toast.error("مقدار ضایعات را وارد کنید");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      const payload =
        wasteTarget.kind === "raw_material"
          ? {
              kind: "raw_material",
              raw_material_id: wasteTarget.item.id,
              quantity_kg: qty,
              note: wasteNote.trim() || null,
            }
          : {
              kind: "produced_good",
              produced_good_id: wasteTarget.item.id,
              quantity_kg: qty,
              note: wasteNote.trim() || null,
            };
      const res = await FetchWithJwtClient("POST", "/api/inventory-wastes", token, {}, { body: JSON.stringify(payload) });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت ضایعات ناموفق بود"));
        return;
      }
      const created = asInventoryWaste(res);
      toast.success(
        created
          ? `ضایعات ثبت شد · هزینه ${formatToman(created.total_cost)} تومان`
          : "ضایعات ثبت شد",
      );
      setWasteTarget(null);
      await loadAll();
      if (tab === "waste") await loadWastes();
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
    setGoodIsFinal(true);
    setRecipeLines([emptyLine()]);
    setLayerOrder([]);
    setLayerCompose("side");
    setSelectedLayerIndex(null);
    setGoodCategoryIds([]);
    setGoodDialogOpen(true);
  };

  const openEditGood = (good: ProducedGood) => {
    setEditingGood(good);
    setGoodName(good.name);
    setGoodUnit(isPieceMaterial(good) ? "piece" : "kg");
    setGoodIsFinal(isFinalProducedGood(good));
    setRecipeLines(recipeLinesFromGood(good));
    setLayerOrder(layerOrderFromGood(good));
    setLayerCompose(layerComposeFromGood(good));
    setSelectedLayerIndex(null);
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
      .filter((line) => {
        if (!(line.grams_per_kg > 0)) return false;
        if (isNestedRecipeLine(line)) return Number(line.ingredient_produced_good_id) > 0;
        return line.raw_material_id !== "" && Number(line.raw_material_id) > 0;
      })
      .map((line) => {
        if (isNestedRecipeLine(line)) {
          return {
            ingredient_produced_good_id: Number(line.ingredient_produced_good_id),
            grams_per_kg: line.grams_per_kg,
            is_removable: false,
            is_addable: false,
          };
        }
        return {
          raw_material_id: Number(line.raw_material_id),
          grams_per_kg: line.grams_per_kg,
          is_removable: line.is_removable === true,
          is_addable: line.is_addable === true,
        };
      });
    if (!ingredients.length) {
      toast.error("حداقل یک ماده یا کالای تولیدی با مقدار وارد کنید");
      return;
    }
    const keys = recipeLines
      .filter((line) => line.grams_per_kg > 0)
      .map((line) => recipeLineKey(line))
      .filter((k) => !k.endsWith(":0") && !k.endsWith(":"));
    if (new Set(keys).size !== keys.length) {
      toast.error("یک ماده یا کالای تولیدی را دو بار در فرمول نگذارید");
      return;
    }
    if (editingGood) {
      const selfInRecipe = ingredients.some(
        (line) => "ingredient_produced_good_id" in line && Number(line.ingredient_produced_good_id) === editingGood.id,
      );
      if (selfInRecipe) {
        toast.error("کالا نمی‌تواند خودش را در فرمول داشته باشد");
        return;
      }
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      const recipeMaterialIds = new Set(
        ingredients
          .map((line) => ("raw_material_id" in line ? Number(line.raw_material_id) : 0))
          .filter((id) => id > 0),
      );
      const payload: Record<string, unknown> = {
        name,
        is_final: goodIsFinal,
        ingredients,
        category_ids: goodCategoryIds,
        layer_order: layerOrder
          .filter((row) => recipeMaterialIds.has(row.raw_material_id))
          .map((row) => {
            const scale_x = clampLayerScale(row.scale_x);
            const scale_y = clampLayerScale(row.scale_y);
            return {
              raw_material_id: row.raw_material_id,
              scale_x,
              scale_y,
              scale: scale_x === scale_y ? scale_x : Math.round(((scale_x + scale_y) / 2) * 100) / 100,
              gap: clampLayerGap(row.gap),
            };
          }),
        layer_compose: layerCompose,
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
        {tab !== "stock" && tab !== "waste" && (
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
        {canMaterials || canGoods ? (
          <Tab value="waste" icon={<AssessmentIcon />} iconPosition="start" label="ضایعات" />
        ) : null}
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
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.35 }}>
                          <Typography sx={{ fontWeight: 600 }}>{good.name}</Typography>
                          {!isFinalProducedGood(good) ? (
                            <Chip size="small" label="نیمه‌ساخته" sx={{ height: 20, fontSize: 10 }} />
                          ) : null}
                        </Box>
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
                          <Tooltip title="ثبت ضایعات">
                            <IconButton
                              size="small"
                              onClick={() => openWaste({ kind: "produced_good", item: good })}
                              disabled={!((good.stock_kg || 0) > 0)}
                              sx={{ ...actionBtnSx, color: "#ef6c00" }}
                            >
                              <DeleteSweepIcon sx={{ fontSize: 18 }} />
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
                                  setInvoiceLink({
                                    ...emptyInvoiceLinkState(),
                                    invoiceTitle: purchaseInvoiceTitle(material.name),
                                  });
                                }}
                                sx={{ ...actionBtnSx, color: "var(--admin-accent)" }}
                              >
                                <AddIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="ثبت ضایعات">
                              <IconButton
                                size="small"
                                onClick={() => openWaste({ kind: "raw_material", item: material })}
                                disabled={!((material.stock_kg || 0) > 0)}
                                sx={{ ...actionBtnSx, color: "#ef6c00" }}
                              >
                                <DeleteSweepIcon sx={{ fontSize: 18 }} />
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
      ) : tab === "waste" ? (
        <Box sx={{ display: "grid", gap: 1.25 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "160px 1fr 1fr auto" },
              gap: 1,
              alignItems: "center",
            }}
          >
            <TextField
              select
              size="small"
              label="نوع"
              value={wasteKindFilter}
              onChange={(e) => setWasteKindFilter(e.target.value as "all" | InventoryWasteKind)}
              sx={fieldSx}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="raw_material">مواد اولیه</MenuItem>
              <MenuItem value="produced_good">کالای تولیدی</MenuItem>
            </TextField>
            <TextField
              size="small"
              type="date"
              label="از تاریخ"
              value={wasteFromDate}
              onChange={(e) => setWasteFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />
            <TextField
              size="small"
              type="date"
              label="تا تاریخ"
              value={wasteToDate}
              onChange={(e) => setWasteToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() => void loadWastes()}
              sx={{ ...adminButtonStartIconSx, borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
            >
              اعمال فیلتر
            </Button>
          </Box>

          {wasteSummary && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1 }}>
              {[
                { label: "تعداد سند", value: formatKg(wasteSummary.count) },
                { label: "جمع هزینه", value: `${formatToman(wasteSummary.total_cost)} ت` },
                { label: "مواد اولیه", value: `${formatToman(wasteSummary.raw_material_cost)} ت` },
                { label: "کالای تولیدی", value: `${formatToman(wasteSummary.produced_good_cost)} ت` },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    p: 1.25,
                    borderRadius: "12px",
                    border: "1px solid var(--admin-border)",
                    bgcolor: "var(--admin-surface)",
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{stat.label}</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: "var(--admin-text)" }}>{stat.value}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {wasteLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : wastes.length === 0 ? (
            <EmptyHint
              title="ضایعاتی ثبت نشده"
              text="از لیست مواد اولیه یا کالای تولیدی، آیکون ضایعات را بزنید. موجودی با FIFO از لات یا بچ تولید کم می‌شود."
            />
          ) : (
            <TableContainer component={Paper} sx={tableWrapSx}>
              <Table size="small" aria-label="گزارش ضایعات">
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="center">تاریخ</StyledTableCell>
                    <StyledTableCell align="center">نوع</StyledTableCell>
                    <StyledTableCell align="center">قلم</StyledTableCell>
                    <StyledTableCell align="center">مقدار</StyledTableCell>
                    <StyledTableCell align="center">هزینه</StyledTableCell>
                    <StyledTableCell align="center">منبع</StyledTableCell>
                    <StyledTableCell align="center">عملیات</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wastes.map((row) => (
                    <StyledTableRow key={row.id}>
                      <StyledTableCell align="center" sx={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {(row.wasted_at || row.created_at || "—").replace("T", " ").slice(0, 16)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Chip
                          size="small"
                          label={row.kind === "produced_good" ? "تولیدی" : "ماده"}
                          sx={{ fontSize: 11 }}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{row.item_name || "—"}</Typography>
                        {row.note ? (
                          <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{row.note}</Typography>
                        ) : null}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatKg(row.quantity_kg)} {materialUnitLabel(row)}
                      </StyledTableCell>
                      <StyledTableCell align="center" sx={{ fontWeight: 700, color: "#ef6c00" }}>
                        {formatToman(row.total_cost)}
                      </StyledTableCell>
                      <StyledTableCell align="center" sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                        {(row.consumptions || [])
                          .map((c) => c.source_label || "")
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Tooltip title="برگشت ضایعات">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTarget({ kind: "waste", item: row })}
                            sx={{ ...actionBtnSx, color: "var(--admin-error)" }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      ) : goods.length === 0 ? (
        <EmptyHint title="هنوز کالای تولیدی نیست" text="فرمول هر واحد کالا را با مواد اولیه یا کالای تولیدی دیگر (نیمه‌ساخته) بنویسید. هزینه از لات‌ها و موجودی تولید حساب می‌شود." />
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
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.35 }}>
                        <Typography sx={{ fontWeight: 600 }}>{good.name}</Typography>
                        {!isFinalProducedGood(good) ? (
                          <Chip size="small" label="نیمه‌ساخته" sx={{ height: 20, fontSize: 10 }} />
                        ) : null}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                      {formatToman(good.cost_per_kg || 0)}
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ color: good.stock_sufficient === false ? "#ef5350" : "var(--admin-text-muted)" }}>
                      {good.stock_sufficient === false
                        ? "کمبود مواد"
                        : (good.ingredient_costs || []).length > 0
                          ? `${(good.ingredient_costs || []).length} قلم`
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
                        <Tooltip title="ثبت ضایعات">
                          <IconButton
                            size="small"
                            onClick={() => openWaste({ kind: "produced_good", item: good })}
                            disabled={!((good.stock_kg || 0) > 0)}
                            sx={{ ...actionBtnSx, color: "#ef6c00" }}
                          >
                            <DeleteSweepIcon sx={{ fontSize: 18 }} />
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
            onChange={(e) => {
              const name = e.target.value;
              setMaterialName(name);
              if (!editingMaterial) {
                setInvoiceLink((prev) => ({
                  ...prev,
                  invoiceTitle: purchaseInvoiceTitle(name),
                }));
              }
            }}
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
                    PNG یا WebP با پس‌زمینهٔ شفاف. برای ساندویچ نمای کنار؛ برای پیتزا نمای بالا. حداکثر ۳ مگابایت.
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
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700, py: 1.25, direction: "rtl" }}>
          {editingGood ? "ویرایش کالا" : "کالای تولیدی جدید"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.25, pt: "12px !important", direction: "rtl" }}>
          <TextField
            size="small"
            label="نام"
            value={goodName}
            onChange={(e) => setGoodName(e.target.value)}
            sx={fieldSx}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <TextField
              select
              size="small"
              label="واحد"
              value={goodUnit}
              onChange={(e) => setGoodUnit(e.target.value === "piece" ? "piece" : "kg")}
              disabled={!!editingGood}
              sx={fieldSx}
            >
              <MenuItem value="kg">کیلویی</MenuItem>
              <MenuItem value="piece">تعدادی</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="چینش لایه"
              value={layerCompose}
              onChange={(e) => setLayerCompose(e.target.value === "overlay" ? "overlay" : "side")}
              sx={fieldSx}
            >
              <MenuItem value="side">کنار (ساندویچ)</MenuItem>
              <MenuItem value="overlay">بالا (پیتزا)</MenuItem>
            </TextField>
          </Box>
          <FormControlLabel
            sx={{ m: 0, alignItems: "flex-start" }}
            control={
              <Switch
                size="small"
                checked={goodIsFinal}
                onChange={(e) => setGoodIsFinal(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>
                  کالای نهایی (قابل فروش)
                </Typography>
                
              </Box>
            }
          />
          <Autocomplete
            multiple
            size="small"
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
              <TextField {...params} size="small" label="دسته‌بندی" sx={fieldSx} />
            )}
          />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>فرمول</Typography>
            <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)" }}>
              {goodUnit === "piece" ? "برای ۱ عدد · گرم / عدد" : "برای ۱ کیلو · گرم / عدد"}
            </Typography>
          </Box>
         
          {recipeLines.map((line, index) => {
            const nested = isNestedRecipeLine(line);
            const nestedGood = nested
              ? goods.find((g) => g.id === Number(line.ingredient_produced_good_id))
              : undefined;
            const rawMaterial = !nested
              ? materials.find((m) => m.id === line.raw_material_id)
              : undefined;
            const qtyLabel = nested
              ? isPieceMaterial(nestedGood)
                ? "عدد"
                : "گرم"
              : isPieceMaterial(rawMaterial)
                ? "عدد"
                : "گرم";
            const selectedValue = nested
              ? line.ingredient_produced_good_id === ""
                ? ""
                : `pg:${line.ingredient_produced_good_id}`
              : line.raw_material_id === ""
                ? ""
                : `rm:${line.raw_material_id}`;
            return (
            <Box
              key={index}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 88px 36px",
                gap: 0.75,
                alignItems: "center",
                p: 1,
                borderRadius: "12px",
                border: "1px solid var(--admin-border)",
                bgcolor: "var(--admin-surface-alt)",
              }}
            >
              <TextField
                select
                size="small"
                label="ماده / کالای تولیدی"
                value={selectedValue}
                onChange={(e) => {
                  const value = e.target.value;
                  const next = [...recipeLines];
                  if (value.startsWith("pg:")) {
                    const id = Number(value.slice(3));
                    next[index] = {
                      ...next[index],
                      kind: "produced_good",
                      raw_material_id: "",
                      ingredient_produced_good_id: id > 0 ? id : "",
                      is_removable: false,
                      is_addable: false,
                    };
                  } else if (value.startsWith("rm:")) {
                    const id = Number(value.slice(3));
                    next[index] = {
                      ...next[index],
                      kind: "raw_material",
                      raw_material_id: id > 0 ? id : "",
                      ingredient_produced_good_id: "",
                    };
                  } else {
                    next[index] = {
                      ...next[index],
                      kind: "raw_material",
                      raw_material_id: "",
                      ingredient_produced_good_id: "",
                    };
                  }
                  setRecipeLines(next);
                }}
                sx={fieldSx}
              >
                <MenuItem value="">
                  <em>انتخاب کنید</em>
                </MenuItem>
                {materials.length > 0 && (
                  <MenuItem disabled value="__raw_header">
                    — مواد اولیه —
                  </MenuItem>
                )}
                {materials.map((material) => (
                  <MenuItem key={`rm-${material.id}`} value={`rm:${material.id}`}>
                    {material.name}
                  </MenuItem>
                ))}
                {goods.filter((g) => !editingGood || g.id !== editingGood.id).length > 0 && (
                  <MenuItem disabled value="__pg_header">
                    — کالاهای تولیدی —
                  </MenuItem>
                )}
                {goods
                  .filter((g) => !editingGood || g.id !== editingGood.id)
                  .map((good) => (
                    <MenuItem key={`pg-${good.id}`} value={`pg:${good.id}`}>
                      {good.name}
                      {!isFinalProducedGood(good) ? " (نیمه‌ساخته)" : ""}
                      {good.stock_kg != null ? ` · موجودی ${formatKg(good.stock_kg)}` : ""}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                size="small"
                label={qtyLabel}
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
                size="small"
                onClick={() => setRecipeLines(recipeLines.filter((_, i) => i !== index))}
                disabled={recipeLines.length === 1}
                sx={{ color: "#ef5350" }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
              </IconButton>
              {!nested && (
              <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <FormControlLabel
                  sx={{ m: 0 }}
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
                  label={<Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>حذف‌پذیر</Typography>}
                />
                <FormControlLabel
                  sx={{ m: 0 }}
                  control={
                    <Switch
                      size="small"
                      checked={line.is_addable === true}
                      disabled={line.raw_material_id === ""}
                      onChange={(e) => {
                        const next = [...recipeLines];
                        next[index] = { ...next[index], is_addable: e.target.checked };
                        setRecipeLines(next);
                      }}
                    />
                  }
                  label={<Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>اضافه‌پذیر</Typography>}
                />
              </Box>
              )}
              {nested && (
                <Typography sx={{ gridColumn: "1 / -1", fontSize: 10.5, color: "var(--admin-text-muted)" }}>
                  از موجودی تولیدشدهٔ این کالا کم می‌شود (نیمه‌ساخته).
                </Typography>
              )}
            </Box>
            );
          })}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setRecipeLines([...recipeLines, emptyLine()])}
            sx={{ ...adminButtonStartIconSx, justifySelf: "start" }}
          >
            ماده / کالا
          </Button>

          {(() => {
            const recipeMaterialIds = Array.from(
              new Set(
                recipeLines
                  .filter((line) => !isNestedRecipeLine(line))
                  .map((line) => Number(line.raw_material_id))
                  .filter((id) => id > 0),
              ),
            );
            const materialById = new Map(materials.map((m) => [m.id, m] as const));
            const rows = layerOrder.filter((row) => recipeMaterialIds.includes(row.raw_material_id));
            const activeIndex =
              selectedLayerIndex != null && selectedLayerIndex >= 0 && selectedLayerIndex < rows.length
                ? selectedLayerIndex
                : rows.length
                  ? 0
                  : null;
            const activeRow = activeIndex != null ? rows[activeIndex] : null;
            const move = (from: number, to: number) => {
              if (to < 0 || to >= rows.length) return;
              const next = [...rows];
              const [item] = next.splice(from, 1);
              next.splice(to, 0, item);
              setLayerOrder(next);
              setSelectedLayerIndex(to);
            };
            const patchLayerAt = (index: number, patch: Partial<LayerOrderEntry>) => {
              const next = rows.map((row, i) => {
                if (i !== index) return row;
                return {
                  ...row,
                  ...patch,
                  scale_x: patch.scale_x != null ? clampLayerScale(patch.scale_x) : row.scale_x,
                  scale_y: patch.scale_y != null ? clampLayerScale(patch.scale_y) : row.scale_y,
                  gap: patch.gap != null ? clampLayerGap(patch.gap) : row.gap,
                };
              });
              setLayerOrder(next);
            };
            const bumpBoth = (delta: number) => {
              if (activeIndex == null || !activeRow) return;
              patchLayerAt(activeIndex, {
                scale_x: activeRow.scale_x + delta,
                scale_y: activeRow.scale_y + delta,
              });
            };
            return (
              <Box
                sx={{
                  mt: 0.5,
                  p: 1.1,
                  borderRadius: "14px",
                  border: "1px solid var(--admin-border)",
                  bgcolor: "var(--admin-surface)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>لایه‌ها</Typography>
                  <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)" }}>
                    {layerCompose === "overlay" ? "نمای بالا" : "نمای کنار"}
                  </Typography>
                </Box>
                {rows.length === 0 ? (
                  <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mb: 1 }}>
                    خالی — ترتیب فرمول
                  </Typography>
                ) : null}
                {rows.map((row, i) => {
                  const material = materialById.get(row.raw_material_id);
                  const src = layerImageSrc(material?.layer_image_url);
                  const selected = activeIndex === i;
                  return (
                    <Box
                      key={`${row.raw_material_id}-${i}`}
                      onClick={() => setSelectedLayerIndex(i)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                        py: 0.45,
                        px: 0.5,
                        mb: 0.35,
                        borderRadius: "10px",
                        cursor: "pointer",
                        bgcolor: selected ? "rgba(var(--admin-accent-rgb, 99, 102, 241), 0.12)" : "transparent",
                        outline: selected ? "1px solid var(--admin-accent)" : "none",
                      }}
                    >
                      <Typography sx={{ width: 18, fontSize: 11, fontWeight: 800, color: "var(--admin-accent)", textAlign: "center" }}>
                        {i + 1}
                      </Typography>
                      <Box
                        sx={{
                          width: 48,
                          height: 30,
                          borderRadius: "8px",
                          display: "grid",
                          placeItems: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                          ...checkerSx,
                        }}
                      >
                        {src ? (
                          <Box
                            component="img"
                            src={src}
                            alt=""
                            sx={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              transform: layerScaleTransform(row),
                            }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: 9, color: "#c62828" }}>—</Typography>
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 12, color: "var(--admin-text)", lineHeight: 1.3 }}>
                          {material?.name || `#${row.raw_material_id}`}
                        </Typography>
                        <Typography sx={{ fontSize: 10, color: "var(--admin-text-muted)" }}>
                          {Math.round(row.scale_x * 100)}×{Math.round(row.scale_y * 100)}
                          {row.gap ? ` · فاصله ${row.gap > 0 ? "+" : ""}${row.gap}` : ""}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        disabled={i === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          move(i, i - 1);
                        }}
                      >
                        <ArrowUpwardIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={i === rows.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          move(i, i + 1);
                        }}
                      >
                        <ArrowDownwardIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: "#ef5350" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = rows.filter((_, idx) => idx !== i);
                          setLayerOrder(next);
                          setSelectedLayerIndex(null);
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  );
                })}
                {activeRow && activeIndex != null ? (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1,
                      borderRadius: "12px",
                      border: "1px dashed var(--admin-border)",
                      bgcolor: "var(--admin-surface-alt)",
                      display: "grid",
                      gap: 0.85,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "var(--admin-text)" }}>
                        {materialById.get(activeRow.raw_material_id)?.name || `#${activeRow.raw_material_id}`}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => patchLayerAt(activeIndex, { scale_x: 1, scale_y: 1, gap: 0 })}
                        aria-label="reset"
                      >
                        <RestartAltIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography sx={{ width: 42, fontSize: 10.5, color: "var(--admin-text-muted)" }}>عرض</Typography>
                      <IconButton
                        size="small"
                        onClick={() => patchLayerAt(activeIndex, { scale_x: activeRow.scale_x - LAYER_SCALE_STEP })}
                      >
                        <ZoomOutIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Slider
                        size="small"
                        min={LAYER_SCALE_MIN}
                        max={LAYER_SCALE_MAX}
                        step={LAYER_SCALE_STEP}
                        value={activeRow.scale_x}
                        onChange={(_, value) =>
                          patchLayerAt(activeIndex, { scale_x: Array.isArray(value) ? value[0] : value })
                        }
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${Math.round(Number(v) * 100)}٪`}
                        sx={{ flex: 1, color: "var(--admin-accent)" }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => patchLayerAt(activeIndex, { scale_x: activeRow.scale_x + LAYER_SCALE_STEP })}
                      >
                        <ZoomInIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography sx={{ width: 42, fontSize: 10.5, color: "var(--admin-text-muted)" }}>ارتفاع</Typography>
                      <IconButton
                        size="small"
                        onClick={() => patchLayerAt(activeIndex, { scale_y: activeRow.scale_y - LAYER_SCALE_STEP })}
                      >
                        <ZoomOutIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Slider
                        size="small"
                        min={LAYER_SCALE_MIN}
                        max={LAYER_SCALE_MAX}
                        step={LAYER_SCALE_STEP}
                        value={activeRow.scale_y}
                        onChange={(_, value) =>
                          patchLayerAt(activeIndex, { scale_y: Array.isArray(value) ? value[0] : value })
                        }
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${Math.round(Number(v) * 100)}٪`}
                        sx={{ flex: 1, color: "var(--admin-accent)" }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => patchLayerAt(activeIndex, { scale_y: activeRow.scale_y + LAYER_SCALE_STEP })}
                      >
                        <ZoomInIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography sx={{ width: 42, fontSize: 10.5, color: "var(--admin-text-muted)" }}>هر دو</Typography>
                      <IconButton size="small" onClick={() => bumpBoth(-LAYER_SCALE_STEP)}>
                        <ZoomOutIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Slider
                        size="small"
                        min={LAYER_SCALE_MIN}
                        max={LAYER_SCALE_MAX}
                        step={LAYER_SCALE_STEP}
                        value={Math.min(activeRow.scale_x, activeRow.scale_y)}
                        onChange={(_, value) => {
                          const n = Array.isArray(value) ? value[0] : value;
                          patchLayerAt(activeIndex, { scale_x: n, scale_y: n });
                        }}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${Math.round(Number(v) * 100)}٪`}
                        sx={{ flex: 1, color: "var(--admin-accent)" }}
                      />
                      <IconButton size="small" onClick={() => bumpBoth(LAYER_SCALE_STEP)}>
                        <ZoomInIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography sx={{ width: 42, fontSize: 10.5, color: "var(--admin-text-muted)" }}>فاصله</Typography>
                      <Slider
                        size="small"
                        min={LAYER_GAP_MIN}
                        max={LAYER_GAP_MAX}
                        step={LAYER_GAP_STEP}
                        value={activeRow.gap}
                        onChange={(_, value) =>
                          patchLayerAt(activeIndex, { gap: Array.isArray(value) ? value[0] : value })
                        }
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${Number(v) > 0 ? "+" : ""}${v}`}
                        sx={{ flex: 1, color: "var(--admin-accent)" }}
                      />
                    </Box>
                  </Box>
                ) : null}
                <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mt: 1, alignItems: "center" }}>
                  <TextField
                    select
                    size="small"
                    label="لایه"
                    value=""
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (id > 0) {
                        const next = [...rows, defaultLayerOrderEntry(id)];
                        setLayerOrder(next);
                        setSelectedLayerIndex(next.length - 1);
                      }
                    }}
                    disabled={recipeMaterialIds.length === 0}
                    sx={{ ...fieldSx, minWidth: 140, flex: 1 }}
                  >
                    {recipeMaterialIds.map((id) => (
                      <MenuItem key={id} value={id}>
                        {materialById.get(id)?.name || `#${id}`}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    size="small"
                    onClick={() => {
                      setLayerOrder(recipeMaterialIds.map((id) => defaultLayerOrderEntry(id)));
                      setSelectedLayerIndex(null);
                    }}
                    sx={{ fontSize: 11, whiteSpace: "nowrap" }}
                  >
                    از فرمول
                  </Button>
                </Box>
                {rows.some((row) => !!layerImageSrc(materialById.get(row.raw_material_id)?.layer_image_url)) ? (
                  <Box sx={{ mt: 1.25 }}>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: "var(--admin-text-muted)", mb: 0.6 }}>
                      پیش‌نمایش
                    </Typography>
                    <Box
                      sx={{
                        width: layerCompose === "overlay" ? 200 : "100%",
                        maxWidth: 300,
                        mx: "auto",
                        borderRadius: "14px",
                        overflow: "hidden",
                        border: "1px solid var(--admin-border)",
                        p: 1,
                        ...checkerSx,
                        ...(layerCompose === "overlay"
                          ? { aspectRatio: "1 / 1", position: "relative" }
                          : { position: "relative" }),
                      }}
                    >
                      {layerCompose === "overlay"
                        ? rows.map((row, i) => {
                            const src = layerImageSrc(materialById.get(row.raw_material_id)?.layer_image_url);
                            if (!src) return null;
                            const selected = activeIndex === i;
                            return (
                              <Box
                                key={`${row.raw_material_id}-prev-${i}`}
                                onClick={() => setSelectedLayerIndex(i)}
                                sx={{
                                  position: "absolute",
                                  inset: 8,
                                  width: "calc(100% - 16px)",
                                  height: "calc(100% - 16px)",
                                  display: "grid",
                                  placeItems: "center",
                                  zIndex: rows.length - i,
                                  cursor: "pointer",
                                  outline: selected ? "2px solid var(--admin-accent)" : "none",
                                  outlineOffset: -2,
                                  borderRadius: "8px",
                                }}
                              >
                                <Box
                                  component="img"
                                  src={src}
                                  alt=""
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    transform: layerScaleTransform(row),
                                    pointerEvents: "none",
                                  }}
                                />
                              </Box>
                            );
                          })
                        : rows.map((row, i) => {
                            const src = layerImageSrc(materialById.get(row.raw_material_id)?.layer_image_url);
                            if (!src) return null;
                            const selected = activeIndex === i;
                            return (
                              <Box
                                key={`${row.raw_material_id}-prev-${i}`}
                                onClick={() => setSelectedLayerIndex(i)}
                                sx={{
                                  display: "block",
                                  width: "100%",
                                  mt: i === 0 ? 0 : `${-6.5 + (Number(row.gap) || 0)}%`,
                                  position: "relative",
                                  zIndex: rows.length - i,
                                  cursor: "pointer",
                                  outline: selected ? "2px solid var(--admin-accent)" : "none",
                                  borderRadius: "6px",
                                }}
                              >
                                <Box
                                  component="img"
                                  src={src}
                                  alt=""
                                  sx={{
                                    display: "block",
                                    width: "100%",
                                    height: "auto",
                                    transform: layerScaleTransform(row),
                                    transformOrigin: "center center",
                                    pointerEvents: "none",
                                  }}
                                />
                              </Box>
                            );
                          })}
                    </Box>
                  </Box>
                ) : null}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 1.5, py: 1 }}>
          <Button size="small" onClick={() => setGoodDialogOpen(false)}>انصراف</Button>
          <Button
            disabled={saving}
            onClick={() => void saveGood()}
            variant="contained"
            size="small"
            sx={{ backgroundColor: "var(--admin-accent)" }}
          >
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
                    {ingredients.map((line, idx) => {
                      const isNested =
                        line.ingredient_kind === "produced_good" ||
                        Number(line.ingredient_produced_good_id) > 0;
                      const unitSource = line.unit_type
                        ? line
                        : isNested
                          ? goods.find((g) => g.id === Number(line.ingredient_produced_good_id))
                          : materials.find((m) => m.id === Number(line.raw_material_id));
                      const unit = materialUnitLabel(unitSource);
                      const short = (line.shortage_kg || 0) > 0;
                      const lots = line.lots || [];
                      const lineCost =
                        line.cost != null ? line.cost : lots.reduce((sum, lot) => sum + (Number(lot.cost) || 0), 0);
                      const lineKey = isNested
                        ? `pg:${line.ingredient_produced_good_id}-${idx}`
                        : `rm:${line.raw_material_id}-${idx}`;
                      return (
                        <Box
                          key={lineKey}
                          sx={{
                            p: 1.25,
                            borderRadius: "12px",
                            backgroundColor: "var(--admin-surface-alt)",
                            border: `1px solid ${short ? "rgba(239,83,80,0.5)" : "var(--admin-border)"}`,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "var(--admin-text)" }}>
                              {line.name ||
                                (isNested
                                  ? `کالای تولیدی ${line.ingredient_produced_good_id}`
                                  : `ماده ${line.raw_material_id}`)}
                              {isNested ? (
                                <Typography component="span" sx={{ fontSize: 11, fontWeight: 500, color: "var(--admin-text-muted)", ml: 0.75 }}>
                                  (تولیدی)
                                </Typography>
                              ) : null}
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
                                const virtual = !lot.lot_id && !lot.source_production_id;
                                const label = virtual
                                  ? "بدون موجودی (قیمت تخمینی)"
                                  : lot.source_production_id
                                    ? `تولید #${lot.source_production_id}`
                                    : `لات ${lot.lot_id}`;
                                return (
                                  <Box
                                    key={`${lot.lot_id ?? lot.source_production_id ?? "short"}-${i}`}
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
                                      {label}
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
              {(lastProduction.consumptions || []).map((row) => {
                const isNested =
                  row.ingredient_kind === "produced_good" ||
                  Number(row.ingredient_produced_good_id) > 0;
                const unitSource = isNested
                  ? goods.find((g) => g.id === Number(row.ingredient_produced_good_id))
                  : materials.find((m) => m.id === Number(row.raw_material_id));
                const sourceLabel = isNested
                  ? `از تولید #${row.source_production_id}`
                  : `از لات ${row.raw_material_lot_id}`;
                return (
                  <Typography key={row.id} sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                    {row.raw_material_name}
                    {isNested ? " (تولیدی)" : ""}: {formatKg(row.quantity_kg)}{" "}
                    {materialUnitLabel(unitSource)} {sourceLabel} با قیمت {formatToman(row.price_per_kg)} →{" "}
                    {formatToman(row.cost)} تومان
                  </Typography>
                );
              })}
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

      <Dialog open={!!wasteTarget} onClose={() => setWasteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>
          ثبت ضایعات {wasteTarget?.item.name || ""}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: "16px !important" }}>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
            موجودی با FIFO از{" "}
            {wasteTarget?.kind === "raw_material" ? "لات‌های خرید ماده" : "بچ‌های تولید کالا"} کم می‌شود و هزینهٔ واقعی ضایعات ثبت می‌گردد.
          </Typography>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
            موجودی فعلی: {formatKg(Number(wasteTarget?.item.stock_kg) || 0)}{" "}
            {materialUnitLabel(wasteTarget?.item)}
          </Typography>
          <TextField
            size="small"
            label={isPieceMaterial(wasteTarget?.item) ? "تعداد" : "مقدار (کیلو)"}
            value={wasteQty}
            onChange={(e) => setWasteQty(e.target.value)}
            inputMode="decimal"
            sx={fieldSx}
          />
          <TextField
            size="small"
            label="توضیح (اختیاری)"
            value={wasteNote}
            onChange={(e) => setWasteNote(e.target.value)}
            multiline
            minRows={2}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWasteTarget(null)}>انصراف</Button>
          <Button
            disabled={saving}
            onClick={() => void saveWaste()}
            variant="contained"
            sx={{ backgroundColor: "#ef6c00", "&:hover": { backgroundColor: "#e65100" } }}
          >
            ثبت ضایعات
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>{deleteTarget?.kind === "waste" ? "برگشت ضایعات؟" : "حذف شود؟"}</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteTarget?.kind === "material"
              ? `ماده اولیه «${deleteTarget.item.name}» حذف شود؟`
              : deleteTarget?.kind === "good"
                ? `کالای «${deleteTarget.item.name}» حذف شود؟`
                : deleteTarget?.kind === "waste"
                  ? `ضایعات «${deleteTarget.item.item_name || ""}» برگشت بخورد و موجودی بازگردانده شود؟`
                  : "این خرید انبار حذف شود؟"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>انصراف</Button>
          <Button disabled={saving} onClick={() => void confirmDelete()} color="error" variant="contained">
            {deleteTarget?.kind === "waste" ? "برگشت" : "حذف"}
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
