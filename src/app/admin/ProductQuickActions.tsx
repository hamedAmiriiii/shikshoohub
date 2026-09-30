"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { toast } from "react-toastify";
import {
  getCachedProductDiscount,
  isCatalogItemOutOfStock,
  type CachedProduct,
} from "@/app/lib/productsCache";
import { isProducedGoodItem } from "@/app/lib/catalogItems";
import { formatAmountInput, parseAmountInput } from "@/app/lib/amountInput";
import { isMeasuredProduct } from "@/app/lib/productUnits";
import { menuProductNumericId, updateMenuProductFields } from "@/app/lib/menuModeProductUpdate";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { readShopFeatures, SHOP_FEATURES_CHANGED_EVENT } from "@/app/lib/shopFeatures";

type QuickActionDialogMode = "stock" | "price" | "notify";

type QuickActionDialogState = {
  mode: QuickActionDialogMode;
  product: CachedProduct;
  initialValue: string;
};

function ProductQuickEditDialog({
  state,
  onClose,
  onProductUpdated,
}: {
  state: QuickActionDialogState | null;
  onClose: () => void;
  onProductUpdated?: (product: CachedProduct) => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const open = Boolean(state);
  const mode = state?.mode ?? null;
  const product = state?.product ?? null;

  useEffect(() => {
    if (state) setValue(state.initialValue);
    else setValue("");
  }, [state]);

  const submitNotify = async () => {
    if (!product) return;
    const phone = value.trim();
    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد");
      return;
    }
    const productId = menuProductNumericId(product);
    if (!productId) {
      toast.error("این کالا از اینجا قابل ثبت اعلان نیست");
      return;
    }
    setSaving(true);
    try {
      const res = await FetchWithJwtClient("POST", "/api/product-stock-notify", {
        product_id: productId,
        phone,
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت اعلان ناموفق بود"));
        return;
      }
      toast.success(
        typeof (res as { message?: string }).message === "string"
          ? (res as { message: string }).message
          : "درخواست ثبت شد",
      );
      onClose();
    } catch {
      toast.error("خطا در ثبت اعلان");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!product || !mode) return;
    if (mode === "notify") {
      await submitNotify();
      return;
    }
    setSaving(true);
    try {
      if (mode === "stock") {
        const qty = parseAmountInput(value);
        if (!Number.isFinite(qty) || qty < 0) {
          toast.error("موجودی معتبر نیست");
          return;
        }
        const nextQty = isMeasuredProduct(product) ? qty : Math.floor(qty);
        const res = await updateMenuProductFields(product, { quantity: nextQty });
        if (res.ok === false) {
          toast.error(res.message);
          return;
        }
        onProductUpdated?.(res.product);
        toast.success("موجودی به‌روز شد");
        onClose();
        return;
      }
      const price = Math.floor(parseAmountInput(value));
      if (!Number.isFinite(price) || price < 0) {
        toast.error("قیمت معتبر نیست");
        return;
      }
      const res = await updateMenuProductFields(product, { sale_price: price });
      if (res.ok === false) {
        toast.error(res.message);
        return;
      }
      onProductUpdated?.(res.product);
      toast.success("قیمت به‌روز شد");
      onClose();
    } catch {
      toast.error("خطا در ویرایش کالا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      disableScrollLock
      open={open}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: "var(--admin-surface)",
          color: "var(--admin-text)",
          borderRadius: "16px",
          direction: "rtl",
        },
      }}
    >
      <DialogTitle sx={{ fontSize: 16 }}>
        {mode === "price"
          ? "تغییر قیمت"
          : mode === "notify"
            ? "موجود شد اطلاع بده"
            : "افزایش موجودی"}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1.5 }}>
          {product?.name || ""}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label={
            mode === "price"
              ? "قیمت فروش جدید (تومان)"
              : mode === "notify"
                ? "شماره موبایل مشتری"
                : "موجودی جدید"
          }
          value={value}
          onChange={(e) =>
            setValue(mode === "price" ? formatAmountInput(e.target.value) : e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          inputMode={mode === "notify" ? "tel" : "decimal"}
          inputProps={
            mode === "notify"
              ? { style: { direction: "ltr", textAlign: "left" }, placeholder: "09xxxxxxxxx" }
              : undefined
          }
          InputLabelProps={{ sx: { color: "var(--admin-text-muted)" } }}
          sx={{
            mt: 0.5,
            "& .MuiOutlinedInput-root": {
              color: "var(--admin-text)",
              "& fieldset": { borderColor: "var(--admin-border)" },
              "&:hover fieldset": { borderColor: "var(--admin-accent)" },
              "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "var(--admin-text)" }}>
          انصراف
        </Button>
        <Button
          variant="contained"
          onClick={() => void submit()}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {mode === "notify" ? "ثبت اعلان" : "ذخیره"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** منوی راست‌کلیک کالا در صفحه فروش: اتمام/افزایش موجودی، تغییر قیمت، اعلان موجود شدن */
export function useProductQuickActions(onProductUpdated?: (product: CachedProduct) => void) {
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [menuProduct, setMenuProduct] = useState<CachedProduct | null>(null);
  const [editDialog, setEditDialog] = useState<QuickActionDialogState | null>(null);
  const [menuBusy, setMenuBusy] = useState(false);
  const [customerClubEnabled, setCustomerClubEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setCustomerClubEnabled(readShopFeatures().customer_club_enabled);
    sync();
    window.addEventListener(SHOP_FEATURES_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SHOP_FEATURES_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const closeContextMenu = () => {
    setMenuPos(null);
  };

  const openContextMenu = (
    point: { top: number; left: number },
    product: CachedProduct,
  ) => {
    if (isProducedGoodItem(product)) {
      toast.info("کالای تولیدی از اینجا ویرایش نمی‌شود");
      return;
    }
    setMenuProduct(product);
    setMenuPos(point);
  };

  const applyProductUpdate = async (
    product: CachedProduct,
    patch: { quantity?: number; sale_price?: number },
    successMessage: string,
  ) => {
    setMenuBusy(true);
    try {
      const res = await updateMenuProductFields(product, patch);
      if (res.ok === false) {
        toast.error(res.message);
        return false;
      }
      onProductUpdated?.(res.product);
      toast.success(successMessage);
      return true;
    } catch {
      toast.error("خطا در ویرایش کالا");
      return false;
    } finally {
      setMenuBusy(false);
    }
  };

  const handleOutOfStock = async () => {
    if (!menuProduct) return;
    closeContextMenu();
    await applyProductUpdate(menuProduct, { quantity: 0 }, "موجودی صفر شد");
    setMenuProduct(null);
  };

  const openStockDialog = () => {
    if (!menuProduct) return;
    setEditDialog({
      mode: "stock",
      product: menuProduct,
      initialValue: String(Number(menuProduct.quantity) || 0),
    });
    closeContextMenu();
  };

  const openPriceDialog = () => {
    if (!menuProduct) return;
    const { salePrice } = getCachedProductDiscount(menuProduct);
    setEditDialog({
      mode: "price",
      product: menuProduct,
      initialValue: formatAmountInput(String(salePrice)),
    });
    closeContextMenu();
  };

  const openNotifyDialog = () => {
    if (!menuProduct) return;
    setEditDialog({
      mode: "notify",
      product: menuProduct,
      initialValue: "",
    });
    closeContextMenu();
  };

  const quickActionsUi = (
    <>
      <Menu
        disableScrollLock
        open={Boolean(menuPos)}
        onClose={() => {
          closeContextMenu();
          setMenuProduct(null);
        }}
        anchorReference="anchorPosition"
        anchorPosition={menuPos || { top: 0, left: 0 }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "var(--admin-surface)",
              color: "var(--admin-text)",
              border: "1px solid var(--admin-border)",
              minWidth: 200,
              direction: "rtl",
            },
          },
        }}
      >
        <MenuItem onClick={() => void handleOutOfStock()} disabled={menuBusy} sx={{ fontSize: 13 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <BlockIcon fontSize="small" sx={{ color: "var(--admin-error-soft)" }} />
          </ListItemIcon>
          <ListItemText primary="اتمام موجودی" />
        </MenuItem>
        <MenuItem onClick={openStockDialog} disabled={menuBusy} sx={{ fontSize: 13 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AddBoxOutlinedIcon fontSize="small" sx={{ color: "var(--admin-accent)" }} />
          </ListItemIcon>
          <ListItemText primary="افزایش موجودی" />
        </MenuItem>
        <MenuItem onClick={openPriceDialog} disabled={menuBusy} sx={{ fontSize: 13 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <SellOutlinedIcon fontSize="small" sx={{ color: "var(--admin-accent)" }} />
          </ListItemIcon>
          <ListItemText primary="تغییر قیمت" />
        </MenuItem>
        {customerClubEnabled &&
        menuProduct &&
        isCatalogItemOutOfStock(menuProduct) &&
        !isProducedGoodItem(menuProduct) ? (
          <MenuItem onClick={openNotifyDialog} disabled={menuBusy} sx={{ fontSize: 13 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <NotificationsActiveOutlinedIcon fontSize="small" sx={{ color: "var(--admin-accent)" }} />
            </ListItemIcon>
            <ListItemText primary="موجود شد اطلاع بده" />
          </MenuItem>
        ) : null}
      </Menu>
      <ProductQuickEditDialog
        state={editDialog}
        onClose={() => {
          setEditDialog(null);
          setMenuProduct(null);
        }}
        onProductUpdated={onProductUpdated}
      />
    </>
  );

  return { openContextMenu, quickActionsUi };
}
