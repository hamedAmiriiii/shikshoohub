"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
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
  extractList,
  formatKg,
  formatToman,
  parseAmount,
  profitPercentFromSale,
  recipeLinesFromGood,
  salePriceFromProfitPercent,
  type ProducedGood,
  type ProductionRecord,
  type RawMaterial,
  type RecipeLine,
} from "@/app/lib/productionCosting";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)" },
} as const;

const StyledTableCell = styled(TableCell)({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: 600,
    fontSize: 15,
    padding: "12px 16px",
    whiteSpace: "nowrap",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 14,
    padding: "12px 16px",
    whiteSpace: "nowrap",
  },
});

const StyledTableRow = styled(TableRow)({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": { backgroundColor: "var(--admin-surface-alt)" },
  "&:hover": { backgroundColor: "var(--admin-menu-hover)" },
  "&:last-child td, &:last-child th": { border: 0 },
});

const actionBtnSx = {
  color: "#fff",
  width: 36,
  height: 36,
} as const;

type TabKey = "stock" | "materials" | "goods";

const emptyLine = (): RecipeLine => ({ raw_material_id: "", grams_per_kg: 0 });

export default function ProductionCostingPage() {
  const [tab, setTab] = useState<TabKey>("stock");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [goods, setGoods] = useState<ProducedGood[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMaterialId, setExpandedMaterialId] = useState<number | null>(null);

  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [materialName, setMaterialName] = useState("");
  const [lotQty, setLotQty] = useState("");
  const [lotPrice, setLotPrice] = useState("");

  const [lotDialogMaterial, setLotDialogMaterial] = useState<RawMaterial | null>(null);

  const [goodDialogOpen, setGoodDialogOpen] = useState(false);
  const [editingGood, setEditingGood] = useState<ProducedGood | null>(null);
  const [goodName, setGoodName] = useState("");
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([emptyLine()]);

  const [produceGood, setProduceGood] = useState<ProducedGood | null>(null);
  const [produceKg, setProduceKg] = useState("1");
  const [producePreview, setProducePreview] = useState<ProducedGood | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [lastProduction, setLastProduction] = useState<ProductionRecord | null>(null);
  const [saleGood, setSaleGood] = useState<ProducedGood | null>(null);
  const [salePrice, setSalePrice] = useState("");
  const [salePercent, setSalePercent] = useState("");

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
    setLotQty("");
    setLotPrice("");
    setMaterialDialogOpen(true);
  };

  const openEditMaterial = (material: RawMaterial) => {
    setEditingMaterial(material);
    setMaterialName(material.name);
    setLotQty("");
    setLotPrice("");
    setMaterialDialogOpen(true);
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
        toast.success("نام ماده اولیه به‌روز شد");
      } else {
        const res = await FetchWithJwtClient(
          "POST",
          "/api/raw-materials",
          token,
          {},
          { body: JSON.stringify({ name }) },
        );
        if (res?.hasError) {
          toast.error(getApiErrorMessage(res, "ثبت ماده اولیه ناموفق بود"));
          return;
        }
        const created = asRawMaterial(res);
        const qty = parseAmount(lotQty);
        const price = parseAmount(lotPrice);
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
    if (qty <= 0 || price <= 0) {
      toast.error("مقدار کیلو و قیمت هر کیلو را وارد کنید");
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
        { body: JSON.stringify({ quantity_kg: qty, price_per_kg: price }) },
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
    setRecipeLines([emptyLine()]);
    setGoodDialogOpen(true);
  };

  const openEditGood = (good: ProducedGood) => {
    setEditingGood(good);
    setGoodName(good.name);
    setRecipeLines(recipeLinesFromGood(good));
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
      const body = JSON.stringify({ name, ingredients });
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

  const openSalePrice = (good: ProducedGood) => {
    const cost = Number(good.cost_per_kg) || 0;
    const price = Number(good.sale_price) || 0;
    setSaleGood(good);
    setSalePrice(price ? String(Math.round(price)) : "");
    const percent = good.profit_percent != null ? Number(good.profit_percent) : profitPercentFromSale(cost, price);
    setSalePercent(percent ? String(percent) : "");
  };

  const onSalePriceChange = (raw: string) => {
    setSalePrice(raw);
    const cost = Number(saleGood?.cost_per_kg) || 0;
    const price = parseAmount(raw);
    setSalePercent(cost > 0 && price > 0 ? String(profitPercentFromSale(cost, price)) : "");
  };

  const onSalePercentChange = (raw: string) => {
    setSalePercent(raw);
    const cost = Number(saleGood?.cost_per_kg) || 0;
    const percent = parseAmount(raw);
    if (cost > 0) setSalePrice(String(salePriceFromProfitPercent(cost, percent)));
  };

  const saveSalePrice = async () => {
    if (!saleGood) return;
    const price = parseAmount(salePrice);
    if (price < 0) {
      toast.error("قیمت فروش نامعتبر است");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      const res = await FetchWithJwtClient(
        "PUT",
        `/api/produced-goods/${saleGood.id}`,
        token,
        {},
        { body: JSON.stringify({ sale_price: price }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره قیمت فروش ناموفق بود"));
        return;
      }
      toast.success("قیمت فروش به‌روز شد");
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
      toast.error("مقدار تولید را به کیلو وارد کنید");
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
          ? `تولید ثبت شد. قیمت واقعی هر کیلو ${formatToman(record.cost_per_kg)} تومان`
          : "تولید ثبت شد",
      );
      setProduceGood(null);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, px: { xs: 2, md: 3 }, pt: { xs: 1.5, md: 3 }, pb: { xs: 12, md: 5 } }}>
      <ToastContainer position="top-center" rtl />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
       
        {tab !== "stock" && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={tab === "materials" ? openCreateMaterial : openCreateGood}
            sx={{
              ...adminButtonStartIconSx,
              backgroundColor: "var(--admin-accent)",
              color: "#fff",
              borderRadius: "12px",
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
          mb: 2,
          "& .MuiTab-root": { color: "var(--admin-text-muted)", fontWeight: 700 },
          "& .Mui-selected": { color: "var(--admin-accent) !important" },
          "& .MuiTabs-indicator": { backgroundColor: "var(--admin-accent)" },
        }}
      >
        <Tab value="stock" icon={<WarehouseIcon />} iconPosition="start" label="موجودی" />
        <Tab value="materials" icon={<Inventory2Icon />} iconPosition="start" label="انبار مواد اولیه" />
        <Tab value="goods" icon={<KitchenIcon />} iconPosition="start" label="کالای تولیدی" />
      </Tabs>

      <TextField
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={searchPlaceholder}
        sx={{ ...fieldSx, mb: 2 }}
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
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: "var(--admin-surface)",
              borderRadius: "16px",
              border: "1px solid var(--admin-border)",
              overflowX: "auto",
            }}
          >
            <Table aria-label="موجودی کالاهای تولیدی">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="right">کالا</StyledTableCell>
                  <StyledTableCell align="right">موجودی (کیلو)</StyledTableCell>
                  <StyledTableCell align="right">قیمت تمام‌شده</StyledTableCell>
                  <StyledTableCell align="right">قیمت فروش</StyledTableCell>
                  <StyledTableCell align="right">سود هر کیلو</StyledTableCell>
                  <StyledTableCell align="right">درصد سود</StyledTableCell>
                  <StyledTableCell align="right">عملیات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGoods.map((good) => {
                  const cost = Number(good.cost_per_kg) || 0;
                  const sale = Number(good.sale_price) || 0;
                  const profit = good.profit_per_kg != null ? Number(good.profit_per_kg) : sale - cost;
                  const percent = good.profit_percent != null ? Number(good.profit_percent) : profitPercentFromSale(cost, sale);
                  return (
                    <StyledTableRow key={good.id}>
                      <StyledTableCell align="right">
                        <Typography sx={{ fontWeight: 700 }}>
                          {good.name}
                          <Box component="span" sx={{ color: "var(--admin-text-muted)", fontWeight: 600, mr: 0.75 }}>
                            {" "}
                            — {good.id}
                          </Box>
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">{formatKg(good.stock_kg || 0)}</StyledTableCell>
                      <StyledTableCell align="right">{formatToman(cost)}</StyledTableCell>
                      <StyledTableCell align="right" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                        {formatToman(sale)}
                      </StyledTableCell>
                      <StyledTableCell align="right" sx={{ color: profit >= 0 ? "var(--admin-accent)" : "#ef5350", fontWeight: 700 }}>
                        {formatToman(profit)}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {percent
                          ? `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(percent)}٪`
                          : "—"}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Box sx={{ display: "flex", gap: 0.75, justifyContent: "flex-end" }}>
                          <Tooltip title="قیمت فروش">
                            <IconButton
                              onClick={() => openSalePrice(good)}
                              sx={{ ...actionBtnSx, backgroundColor: "#ff9100", "&:hover": { backgroundColor: "#e68100" } }}
                            >
                              <LocalOfferIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ثبت تولید">
                            <IconButton
                              onClick={() => {
                                setProduceGood(good);
                                setProduceKg("1");
                                setProducePreview(null);
                              }}
                              sx={{ ...actionBtnSx, backgroundColor: "var(--admin-accent)", "&:hover": { backgroundColor: "var(--admin-accent-hover)" } }}
                            >
                              <PrecisionManufacturingIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ویرایش فرمول">
                            <IconButton
                              onClick={() => openEditGood(good)}
                              sx={{ ...actionBtnSx, backgroundColor: "#2196f3", "&:hover": { backgroundColor: "#1976d2" } }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف">
                            <IconButton
                              onClick={() => setDeleteTarget({ kind: "good", item: good })}
                              sx={{ ...actionBtnSx, backgroundColor: "#ff4444", "&:hover": { backgroundColor: "#cc3333" } }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
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
          <EmptyHint title="هنوز ماده اولیه‌ای نیست" text="اول نام ماده را بسازید، بعد خرید انبار را با مقدار و قیمت هر کیلو اضافه کنید." />
        ) : filteredMaterials.length === 0 ? (
          <EmptyHint title="نتیجه‌ای پیدا نشد" text="نام دیگری جستجو کنید." />
        ) : (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {filteredMaterials.map((material) => {
              const lots = material.lots || [];
              const open = expandedMaterialId === material.id;
              return (
                <Card key={material.id} sx={{ backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: "16px" }}>
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                          {material.name}
                          <Box component="span" sx={{ color: "var(--admin-text-muted)", fontWeight: 600, fontSize: 15, mr: 0.75 }}>
                            {" "}
                            — {material.id}
                          </Box>
                        </Typography>
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 14 }}>
                          موجودی {formatKg(material.stock_kg || 0)} کیلو
                          {material.next_price_per_kg != null
                            ? ` · قیمت لات بعدی ${formatToman(material.next_price_per_kg)} تومان`
                            : ""}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                          onClick={() => {
                            setLotDialogMaterial(material);
                            setLotQty("");
                            setLotPrice("");
                          }}
                          sx={{ color: "var(--admin-accent)" }}
                          title="خرید جدید"
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton onClick={() => openEditMaterial(material)} sx={{ color: "var(--admin-accent)" }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => setDeleteTarget({ kind: "material", item: material })} sx={{ color: "#ef5350" }}>
                          <DeleteOutlineIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => setExpandedMaterialId(open ? null : material.id)}
                          sx={{ color: "var(--admin-text-muted)", transform: open ? "rotate(180deg)" : "none" }}
                        >
                          <ExpandMoreIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Collapse in={open}>
                      <Box sx={{ mt: 1.25, display: "grid", gap: 0.75 }}>
                        {lots.length === 0 ? (
                          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>هنوز خریدی ثبت نشده.</Typography>
                        ) : (
                          lots.map((lot) => (
                            <Box key={lot.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
                                {formatKg(lot.remaining_kg)} از {formatKg(lot.quantity_kg)} کیلو · {formatToman(lot.price_per_kg)} تومان
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => setDeleteTarget({ kind: "lot", material, lotId: lot.id })}
                                sx={{ color: "#ef5350" }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )
      ) : goods.length === 0 ? (
        <EmptyHint title="هنوز کالای تولیدی نیست" text="فرمول هر کیلو کالا را با گرم مواد بنویسید. هزینه از لات‌های موجود انبار حساب می‌شود." />
      ) : filteredGoods.length === 0 ? (
        <EmptyHint title="نتیجه‌ای پیدا نشد" text="نام دیگری جستجو کنید." />
      ) : (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {filteredGoods.map((good) => (
            <Card key={good.id} sx={{ backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: "16px" }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                      {good.name}
                      <Box component="span" sx={{ color: "var(--admin-text-muted)", fontWeight: 600, fontSize: 15, mr: 0.75 }}>
                        {" "}
                        — {good.id}
                      </Box>
                    </Typography>
                    <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: 16, mt: 0.5 }}>
                      قیمت تمام‌شده هر کیلو: {formatToman(good.cost_per_kg || 0)} تومان
                    </Typography>
                    {good.stock_sufficient === false && (
                      <Typography sx={{ color: "#ef5350", fontSize: 13, mt: 0.5 }}>موجودی مواد برای تولید کافی نیست</Typography>
                    )}
                  </Box>
                  <Box>
                    <IconButton
                      onClick={() => {
                        setProduceGood(good);
                        setProduceKg("1");
                        setProducePreview(null);
                      }}
                      sx={{ color: "var(--admin-accent)" }}
                      title="ثبت تولید"
                    >
                      <PrecisionManufacturingIcon />
                    </IconButton>
                    <IconButton onClick={() => openEditGood(good)} sx={{ color: "var(--admin-accent)" }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => setDeleteTarget({ kind: "good", item: good })} sx={{ color: "#ef5350" }}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ mt: 1.25, display: "grid", gap: 0.75 }}>
                  {(good.ingredient_costs || []).map((line) => (
                    <Typography key={`${good.id}-${line.raw_material_id}`} sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
                      {formatKg(line.grams_per_kg)} گرم {line.name}
                      {line.cost != null ? ` → ${formatToman(line.cost)} تومان` : ""}
                      {line.shortage_kg ? ` · کمبود ${formatKg(line.shortage_kg)} کیلو` : ""}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={materialDialogOpen} onClose={() => setMaterialDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingMaterial ? "ویرایش ماده اولیه" : "ماده اولیه جدید"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <TextField autoFocus label="نام" value={materialName} onChange={(e) => setMaterialName(e.target.value)} sx={fieldSx} />
          {!editingMaterial && (
            <>
              <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>خرید اول انبار اختیاری است.</Typography>
              <TextField label="مقدار (کیلو)" value={lotQty} onChange={(e) => setLotQty(e.target.value)} inputMode="decimal" sx={fieldSx} />
              <TextField label="قیمت هر کیلو (تومان)" value={lotPrice} onChange={(e) => setLotPrice(e.target.value)} inputMode="numeric" sx={fieldSx} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialDialogOpen(false)}>انصراف</Button>
          <Button disabled={saving} onClick={() => void saveMaterial()} variant="contained" sx={{ backgroundColor: "var(--admin-accent)" }}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!lotDialogMaterial} onClose={() => setLotDialogMaterial(null)} fullWidth maxWidth="xs">
        <DialogTitle>خرید جدید {lotDialogMaterial?.name || ""}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <TextField label="مقدار (کیلو)" value={lotQty} onChange={(e) => setLotQty(e.target.value)} inputMode="decimal" sx={fieldSx} />
          <TextField label="قیمت هر کیلو (تومان)" value={lotPrice} onChange={(e) => setLotPrice(e.target.value)} inputMode="numeric" sx={fieldSx} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLotDialogMaterial(null)}>انصراف</Button>
          <Button disabled={saving} onClick={() => void saveLot()} variant="contained" sx={{ backgroundColor: "var(--admin-accent)" }}>
            ثبت خرید
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={goodDialogOpen} onClose={() => setGoodDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingGood ? "ویرایش کالای تولیدی" : "کالای تولیدی جدید"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <TextField label="نام کالا (مثلاً کلوچه)" value={goodName} onChange={(e) => setGoodName(e.target.value)} sx={fieldSx} />
          <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
            مصرف هر ماده را به گرم در هر کیلو کالای آماده وارد کنید.
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
                label="گرم"
                value={line.grams_per_kg || ""}
                onChange={(e) => {
                  const next = [...recipeLines];
                  next[index] = { ...next[index], grams_per_kg: parseAmount(e.target.value) };
                  setRecipeLines(next);
                }}
                inputMode="numeric"
                sx={fieldSx}
              />
              <IconButton
                onClick={() => setRecipeLines(recipeLines.filter((_, i) => i !== index))}
                disabled={recipeLines.length === 1}
                sx={{ color: "#ef5350" }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={() => setRecipeLines([...recipeLines, emptyLine()])} sx={adminButtonStartIconSx}>
            ماده بعدی
          </Button>
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
            label="چند کیلو تولید شود؟"
            value={produceKg}
            onChange={(e) => setProduceKg(e.target.value)}
            inputMode="decimal"
            sx={fieldSx}
          />
          {previewLoading && <CircularProgress size={22} />}
          {producePreview && (
            <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}>
              <Typography sx={{ fontWeight: 800, color: producePreview.stock_sufficient === false ? "#ef5350" : "var(--admin-accent)" }}>
                پیش‌نمایش هزینه هر کیلو: {formatToman(producePreview.cost_per_kg || 0)} تومان
              </Typography>
              <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", mb: 1 }}>
                جمع هزینه این تولید: {formatToman(producePreview.total_cost || 0)} تومان — موجودی کم نمی‌شود تا ثبت کنید.
              </Typography>
              {(producePreview.ingredient_costs || []).map((line) => (
                <Box key={line.raw_material_id} sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: 13, color: line.shortage_kg ? "#ef5350" : "var(--admin-text-muted)" }}>
                    {line.name}: مصرف {formatKg(line.needed_kg || 0)} کیلو
                    {line.shortage_kg ? ` · کمبود ${formatKg(line.shortage_kg)} کیلو` : ""}
                  </Typography>
                  {(line.lots || []).map((lot) => (
                    <Typography key={lot.lot_id} sx={{ fontSize: 12, color: "var(--admin-text-muted)", pr: 1 }}>
                      لات {lot.lot_id}: {formatKg(lot.quantity_kg)} کیلو × {formatToman(lot.price_per_kg)} = {formatToman(lot.cost)}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Box>
          )}
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
                {formatKg(lastProduction.quantity_kg)} کیلو {lastProduction.produced_good_name} · هر کیلو {formatToman(lastProduction.cost_per_kg)} تومان
              </Typography>
              {(lastProduction.consumptions || []).map((row) => (
                <Typography key={row.id} sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                  {row.raw_material_name}: {formatKg(row.quantity_kg)} کیلو از لات {row.raw_material_lot_id} با قیمت {formatToman(row.price_per_kg)} → {formatToman(row.cost)} تومان
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
            قیمت تمام‌شده هر کیلو: {formatToman(Number(saleGood?.cost_per_kg) || 0)} تومان
          </Typography>
          <TextField
            label="درصد سود"
            value={salePercent}
            onChange={(e) => onSalePercentChange(e.target.value)}
            inputMode="decimal"
            sx={fieldSx}
            helperText="با زدن درصد، مبلغ فروش پر می‌شود"
          />
          <TextField
            label="قیمت فروش هر کیلو (تومان)"
            value={salePrice}
            onChange={(e) => onSalePriceChange(e.target.value)}
            inputMode="numeric"
            sx={fieldSx}
          />
          <Typography sx={{ fontSize: 13, color: "var(--admin-accent)", fontWeight: 700 }}>
            سود هر کیلو: {formatToman(parseAmount(salePrice) - (Number(saleGood?.cost_per_kg) || 0))} تومان
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaleGood(null)}>انصراف</Button>
          <Button disabled={saving} onClick={() => void saveSalePrice()} variant="contained" sx={{ backgroundColor: "var(--admin-accent)" }}>
            ذخیره قیمت
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!saleGood} onClose={() => setSaleGood(null)} fullWidth maxWidth="xs">
        <DialogTitle>قیمت فروش {saleGood?.name || ""}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
            قیمت تمام‌شده هر کیلو: {formatToman(Number(saleGood?.cost_per_kg) || 0)} تومان
          </Typography>
          <TextField
            label="درصد سود"
            value={salePercent}
            onChange={(e) => onSalePercentChange(e.target.value)}
            inputMode="decimal"
            helperText="با زدن درصد، مبلغ فروش پر می‌شود"
            sx={fieldSx}
          />
          <TextField
            label="قیمت فروش هر کیلو (تومان)"
            value={salePrice}
            onChange={(e) => onSalePriceChange(e.target.value)}
            inputMode="numeric"
            sx={fieldSx}
          />
          {saleGood && parseAmount(salePrice) > 0 && (
            <Typography sx={{ fontSize: 13, color: "var(--admin-accent)", fontWeight: 700 }}>
              سود هر کیلو: {formatToman(parseAmount(salePrice) - (Number(saleGood.cost_per_kg) || 0))} تومان
            </Typography>
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
