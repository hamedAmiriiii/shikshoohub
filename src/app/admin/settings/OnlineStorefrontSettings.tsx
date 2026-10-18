"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { toast } from "react-toastify";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import {
  BLOCK_LABELS,
  PRODUCT_CARD_STYLE_LABELS,
  PRODUCT_CARD_STYLES,
  defaultOnlineStorefront,
  parseOnlineStorefront,
  resolveMediaUrl,
  type OnlineStorefrontConfig,
  type ProductCardStyle,
  type StorefrontBanner,
  type StorefrontBlockId,
  type StorefrontTrustItem,
} from "@/app/lib/onlineStorefront";
import Switch from "@mui/material/Switch";
import { parseCategoriesFromApi, type ShopCategory } from "@/app/lib/shopCategories";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir").replace(/\/$/, "");
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const smallBtnSx = {
  fontSize: "11px",
  fontWeight: 700,
  py: 0.25,
  px: 1,
  minWidth: 0,
  color: "var(--admin-accent)",
  borderColor: "var(--admin-border)",
} as const;

function flattenCategories(cats: ShopCategory[], depth = 0): Array<{ id: number; name: string; depth: number }> {
  const out: Array<{ id: number; name: string; depth: number }> = [];
  for (const c of cats) {
    if (c.is_active === false) continue;
    out.push({ id: c.id, name: c.name, depth });
    if (c.children?.length) out.push(...flattenCategories(c.children, depth + 1));
  }
  return out;
}

export default function OnlineStorefrontSettingsPanel() {
  const [config, setConfig] = useState<OnlineStorefrontConfig>(defaultOnlineStorefront());
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement | null>(null);
  const bannerRef = useRef<HTMLInputElement | null>(null);

  const flatCats = useMemo(() => flattenCategories(categories), [categories]);

  const load = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sfRes, catRes] = await Promise.all([
        apiRequestError("Get", {}, {}, "/api/settings/online-storefront", true, true, token),
        apiRequestError("Get", {}, {}, "/api/category?tree=true", true, true, token),
      ]);
      if (!sfRes?.hasError) {
        setConfig(parseOnlineStorefront(sfRes));
      }
      setCategories(parseCategoriesFromApi(catRes));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (next?: OnlineStorefrontConfig) => {
    const token = tokenCode();
    if (!token) return;
    const payload = next ?? config;
    setSaving(true);
    try {
      const res = await apiRequestError(
        "Put",
        {},
        {
          primary_color: payload.primary_color,
          banners: payload.banners,
          block_order: payload.block_order,
          hidden_category_ids: payload.hidden_category_ids,
          show_header_categories: payload.show_header_categories,
          show_category_row: payload.show_category_row,
          product_card_style: payload.product_card_style,
          trust_items: payload.trust_items,
        },
        "/api/settings/online-storefront",
        true,
        true,
        token,
      );
      if (res?.hasError) {
        toast.error(typeof res.message === "string" ? res.message : "ذخیره ویترین ناموفق بود");
        return;
      }
      const parsed = parseOnlineStorefront(res);
      setConfig((prev) => ({
        ...parsed,
        logo_url: parsed.logo_url ?? prev.logo_url,
      }));
      toast.success("تنظیمات ویترین ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره تنظیمات ویترین");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    const token = tokenCode();
    if (!token) return;
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${API_BASE}/api/settings/online-storefront-logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const parsed = await response.json();
      if (!response.ok || parsed?.hasError) {
        toast.error(typeof parsed?.message === "string" ? parsed.message : "آپلود لوگو ناموفق بود");
        return;
      }
      setConfig(parseOnlineStorefront(parsed));
      toast.success("لوگو ذخیره شد");
    } catch {
      toast.error("خطا در آپلود لوگو");
    } finally {
      setLogoUploading(false);
    }
  };

  const deleteLogo = async () => {
    const token = tokenCode();
    if (!token) return;
    const res = await apiRequestError("Delete", {}, {}, "/api/settings/online-storefront-logo", true, true, token);
    if (res?.hasError) {
      toast.error(typeof res.message === "string" ? res.message : "حذف لوگو ناموفق بود");
      return;
    }
    setConfig(parseOnlineStorefront(res));
    toast.success("لوگو حذف شد");
  };

  const uploadBanner = async (file: File) => {
    const token = tokenCode();
    if (!token) return;
    if (config.banners.length >= 8) {
      toast.error("حداکثر ۸ بنر مجاز است");
      return;
    }
    setBannerUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${API_BASE}/api/settings/online-storefront-banner`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const parsed = await response.json();
      if (!response.ok || parsed?.hasError || !parsed?.image_url) {
        toast.error(typeof parsed?.message === "string" ? parsed.message : "آپلود بنر ناموفق بود");
        return;
      }
      const nextBanners: StorefrontBanner[] = [
        ...config.banners,
        { image_url: String(parsed.image_url), link: "", title: "" },
      ];
      const next = { ...config, banners: nextBanners };
      setConfig(next);
      await save(next);
    } catch {
      toast.error("خطا در آپلود بنر");
    } finally {
      setBannerUploading(false);
    }
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= config.block_order.length) return;
    const order = [...config.block_order];
    const tmp = order[index];
    order[index] = order[nextIndex];
    order[nextIndex] = tmp;
    setConfig((prev) => ({ ...prev, block_order: order as StorefrontBlockId[] }));
  };

  const toggleHiddenCategory = (id: number) => {
    setConfig((prev) => {
      const set = new Set(prev.hidden_category_ids);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, hidden_category_ids: Array.from(set) };
    });
  };

  const updateTrust = (index: number, patch: Partial<StorefrontTrustItem>) => {
    setConfig((prev) => {
      const items = prev.trust_items.map((t, i) => (i === index ? { ...t, ...patch } : t));
      return { ...prev, trust_items: items };
    });
  };

  const updateBanner = (index: number, patch: Partial<StorefrontBanner>) => {
    setConfig((prev) => {
      const banners = prev.banners.map((b, i) => (i === index ? { ...b, ...patch } : b));
      return { ...prev, banners };
    });
  };

  const removeBanner = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      banners: prev.banners.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
          لوگو و رنگ اصلی
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          {config.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(config.logo_url)}
              alt="لوگو"
              style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 8, background: "#fff" }}
            />
          ) : (
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                border: "1px dashed var(--admin-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "var(--admin-text-muted)",
              }}
            >
              بدون لوگو
            </Box>
          )}
          <input
            ref={logoRef}
            type="file"
            accept={IMAGE_ACCEPT}
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadLogo(f);
            }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={logoUploading ? <CircularProgress size={14} /> : <CloudUploadIcon />}
            disabled={logoUploading}
            onClick={() => logoRef.current?.click()}
            sx={smallBtnSx}
          >
            آپلود لوگو
          </Button>
          {config.logo_url ? (
            <Button size="small" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => void deleteLogo()} sx={smallBtnSx}>
              حذف
            </Button>
          ) : null}
          <TextField
            size="small"
            type="color"
            label="رنگ اصلی"
            value={config.primary_color}
            onChange={(e) => setConfig((p) => ({ ...p, primary_color: e.target.value }))}
            sx={{ width: 120, "& .MuiInputBase-input": { p: 0.5, height: 28 } }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="کد رنگ"
            value={config.primary_color}
            onChange={(e) => setConfig((p) => ({ ...p, primary_color: e.target.value }))}
            sx={{ width: 120 }}
          />
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
          بنر اسلایدر
        </Typography>
        <input
          ref={bannerRef}
          type="file"
          accept={IMAGE_ACCEPT}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void uploadBanner(f);
          }}
        />
        <Button
          size="small"
          variant="outlined"
          startIcon={bannerUploading ? <CircularProgress size={14} /> : <CloudUploadIcon />}
          disabled={bannerUploading || config.banners.length >= 8}
          onClick={() => bannerRef.current?.click()}
          sx={{ ...smallBtnSx, mb: 1 }}
        >
          افزودن بنر
        </Button>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {config.banners.map((b, i) => (
            <Box
              key={`${b.image_url}-${i}`}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
                p: 1,
                borderRadius: 1.5,
                border: "1px solid var(--admin-border)",
                background: "var(--admin-surface-alt)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(b.image_url)}
                alt=""
                style={{ width: 96, height: 48, objectFit: "cover", borderRadius: 6 }}
              />
              <TextField
                size="small"
                label="عنوان"
                value={b.title || ""}
                onChange={(e) => updateBanner(i, { title: e.target.value })}
                sx={{ flex: 1, minWidth: 120 }}
              />
              <TextField
                size="small"
                label="لینک"
                value={b.link || ""}
                onChange={(e) => updateBanner(i, { link: e.target.value })}
                sx={{ flex: 1, minWidth: 140 }}
              />
              <IconButton size="small" onClick={() => removeBanner(i)} aria-label="حذف بنر">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
          نمایش دسته‌بندی‌ها
        </Typography>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={config.show_header_categories !== false}
              onChange={(e) =>
                setConfig((p) => ({ ...p, show_header_categories: e.target.checked }))
              }
            />
          }
          label={<Typography sx={{ fontSize: 12 }}>منوی دسته‌ها در هدر</Typography>}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={config.show_category_row !== false}
              onChange={(e) => setConfig((p) => ({ ...p, show_category_row: e.target.checked }))}
            />
          }
          label={<Typography sx={{ fontSize: 12 }}>ردیف دایره‌ای دسته‌ها در صفحه اول</Typography>}
        />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
          مدل کارت محصول
        </Typography>
        <TextField
          size="small"
          select
          SelectProps={{ native: true }}
          label="استایل کارت"
          value={config.product_card_style || "digikala"}
          onChange={(e) =>
            setConfig((p) => ({
              ...p,
              product_card_style: e.target.value as ProductCardStyle,
            }))
          }
          sx={{ minWidth: 220 }}
          InputLabelProps={{ shrink: true }}
        >
          {PRODUCT_CARD_STYLES.map((style) => (
            <option key={style} value={style}>
              {PRODUCT_CARD_STYLE_LABELS[style]}
            </option>
          ))}
        </TextField>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
          ترتیب بلوک‌های صفحه اول
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {config.block_order.map((block, index) => (
            <Box
              key={block}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                border: "1px solid var(--admin-border)",
              }}
            >
              <Typography sx={{ flex: 1, fontSize: 13 }}>{BLOCK_LABELS[block]}</Typography>
              <IconButton size="small" disabled={index === 0} onClick={() => moveBlock(index, -1)}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                disabled={index === config.block_order.length - 1}
                onClick={() => moveBlock(index, 1)}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
          مخفی کردن دسته‌ها در ویترین
        </Typography>
        <Box sx={{ maxHeight: 220, overflow: "auto", display: "flex", flexDirection: "column" }}>
          {flatCats.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>دسته‌ای یافت نشد</Typography>
          ) : (
            flatCats.map((c) => (
              <FormControlLabel
                key={c.id}
                sx={{ ml: c.depth * 1.5, mr: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={config.hidden_category_ids.includes(c.id)}
                    onChange={() => toggleHiddenCategory(c.id)}
                  />
                }
                label={<Typography sx={{ fontSize: 12 }}>{c.name}</Typography>}
              />
            ))
          )}
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
          متن‌های اعتماد
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {config.trust_items.map((t, i) => (
            <Box key={i} sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <TextField
                size="small"
                label="عنوان"
                value={t.title}
                onChange={(e) => updateTrust(i, { title: e.target.value })}
                sx={{ flex: 1, minWidth: 120 }}
              />
              <TextField
                size="small"
                label="زیرعنوان"
                value={t.subtitle || ""}
                onChange={(e) => updateTrust(i, { subtitle: e.target.value })}
                sx={{ flex: 1, minWidth: 140 }}
              />
              <TextField
                size="small"
                select
                SelectProps={{ native: true }}
                label="آیکون"
                value={t.icon || "shipping"}
                onChange={(e) => updateTrust(i, { icon: e.target.value })}
                sx={{ width: 130 }}
                InputLabelProps={{ shrink: true }}
              >
                <option value="shipping">ارسال</option>
                <option value="payment">پرداخت</option>
                <option value="verified">اصالت</option>
                <option value="support">پشتیبانی</option>
                <option value="return">مرجوعی</option>
                <option value="original">اصل</option>
              </TextField>
            </Box>
          ))}
        </Box>
      </Box>

      <Button
        variant="contained"
        disabled={saving}
        onClick={() => void save()}
        sx={{ alignSelf: "flex-end", fontWeight: 700 }}
      >
        {saving ? "…" : "ذخیره تنظیمات ویترین"}
      </Button>
    </Box>
  );
}
