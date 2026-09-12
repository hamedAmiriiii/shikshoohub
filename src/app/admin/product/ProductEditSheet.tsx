"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import BottomSheet from "@/app/coponent/BottomSheet";
import TextInput from "@/app/coponent/TextInput/TextInput";
import {
  ADMIN_POS_SETTINGS_CHANGED_EVENT,
  readAdminPosSettings,
} from "@/app/lib/adminPosSettings";

type ProductEditSheetProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  displayOrder: string;
  onDisplayOrderChange: (value: string) => void;
  barcode: string;
  onBarcodeChange: (value: string) => void;
  onOpenBarcodeScanner: () => void;
  profitPercentage: string;
  onProfitPercentageChange: (value: string) => void;
  purchasePrice: string;
  onPurchasePriceChange: (value: string) => void;
  salePrice: string;
  onSalePriceChange: (value: string) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  discountPercent: string;
  onDiscountPercentChange: (value: string) => void;
  images: string[];
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  categoryIds: number[];
  onRemoveCategory: (id: number) => void;
  categoryTree: React.ReactNode;
  flattenCategoryName: (id: number) => string;
  onSubmit: () => void;
};

export default function ProductEditSheet({
  open,
  onClose,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  displayOrder,
  onDisplayOrderChange,
  barcode,
  onBarcodeChange,
  onOpenBarcodeScanner,
  profitPercentage,
  onProfitPercentageChange,
  purchasePrice,
  onPurchasePriceChange,
  salePrice,
  onSalePriceChange,
  quantity,
  onQuantityChange,
  discountPercent,
  onDiscountPercentChange,
  images,
  onImageUpload,
  onRemoveImage,
  categoryIds,
  onRemoveCategory,
  categoryTree,
  flattenCategoryName,
  onSubmit,
}: ProductEditSheetProps) {
  const [showDisplayOrder, setShowDisplayOrder] = useState(false);

  useEffect(() => {
    const sync = () => setShowDisplayOrder(Boolean(readAdminPosSettings().productDisplayOrderEnabled));
    sync();
    window.addEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
  }, []);

  const fieldLabelSx = {
    color: "var(--admin-text-muted)",
    fontSize: "11px",
    mb: 0.25,
  } as const;

  const fieldWrapSx = {
    width: "100%",
    "& > div": { marginTop: 0, width: "100%" },
    "& > div > div:last-of-type > div": { width: "100% !important", maxWidth: "100%" },
    "& .MuiTypography-root": fieldLabelSx,
    "& .MuiOutlinedInput-root": {
      backgroundColor: "var(--admin-surface-alt)",
      color: "var(--admin-text)",
      borderRadius: "10px",
      minHeight: 42,
      "& fieldset": { borderColor: "var(--admin-border)" },
      "&:hover fieldset": { borderColor: "var(--admin-accent)" },
      "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
    },
    "& .MuiOutlinedInput-input": {
      py: "7px",
      fontSize: "13px",
      color: "var(--admin-text)",
    },
  } as const;

  const barcodeFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "var(--admin-surface-alt)",
      color: "var(--admin-text)",
      borderRadius: "10px",
      minHeight: 42,
      "& fieldset": { borderColor: "var(--admin-border)" },
      "&:hover fieldset": { borderColor: "var(--admin-accent)" },
      "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
    },
    "& .MuiInputBase-input": {
      direction: "ltr",
      textAlign: "left",
      py: "7px",
      fontSize: "13px",
      color: "var(--admin-text)",
    },
  } as const;

  return (
    <BottomSheet open={open} onClose={() => onClose()} title="ویرایش کالا" dense>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, direction: "rtl" }}>
        <Grid container spacing={0.75} alignItems="flex-end">
          <Grid item xs={12} sm={6}>
            <Box sx={fieldWrapSx}>
              <TextInput value={name} label="نام کالا" onChange={onNameChange} name="name" type="text" />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={fieldLabelSx}>بارکد</Typography>
            <TextField
              value={barcode}
              onChange={(e) => onBarcodeChange(e.target.value.slice(0, 255))}
              placeholder="بارکد کالا"
              size="small"
              fullWidth
              inputProps={{ maxLength: 255 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      type="button"
                      size="small"
                      onClick={onOpenBarcodeScanner}
                      title="اسکن بارکد"
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        backgroundColor: "var(--admin-accent)",
                        color: "var(--admin-on-accent)",
                        "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
                      }}
                    >
                      <QrCodeScannerIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={barcodeFieldSx}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography sx={fieldLabelSx}>توضیحات (اختیاری)</Typography>
            <TextField
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
              placeholder="مثلاً مواد، حجم یا توضیح کوتاه منو"
              size="small"
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              inputProps={{ maxLength: 500 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "var(--admin-surface-alt)",
                  color: "var(--admin-text)",
                  borderRadius: "10px",
                  "& fieldset": { borderColor: "var(--admin-border)" },
                  "&:hover fieldset": { borderColor: "var(--admin-accent)" },
                  "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
                },
                "& .MuiInputBase-input": {
                  fontSize: "13px",
                  py: "7px",
                  color: "var(--admin-text)",
                },
              }}
            />
          </Grid>
          {showDisplayOrder ? (
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={fieldWrapSx}>
                <TextInput
                  value={displayOrder}
                  label="اولویت"
                  onChange={(v) => onDisplayOrderChange(String(v).replace(/[^\d]/g, "").slice(0, 4))}
                  name="display_order"
                  type="number"
                />
              </Box>
            </Grid>
          ) : null}
          <Grid item xs={6} sm={4} md={2}>
            <Box sx={fieldWrapSx}>
              <TextInput
                value={profitPercentage}
                label="درصد سود"
                onChange={onProfitPercentageChange}
                name="profitPercentage"
                type="number"
              />
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Box sx={fieldWrapSx}>
              <TextInput
                value={purchasePrice}
                label="قیمت خرید"
                onChange={onPurchasePriceChange}
                name="purchase_price"
                type="number"
              />
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Box sx={fieldWrapSx}>
              <TextInput
                value={salePrice}
                label="قیمت فروش"
                onChange={onSalePriceChange}
                name="sale_price"
                type="number"
              />
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Box sx={fieldWrapSx}>
              <TextInput value={quantity} label="موجودی" onChange={onQuantityChange} name="quantity" type="number" />
            </Box>
          </Grid>
          <Grid item xs={12} sm={8} md={3}>
            <Box sx={fieldWrapSx}>
              <TextInput
                value={discountPercent}
                label="تخفیف %"
                onChange={onDiscountPercentChange}
                name="discountPercent"
                type="number"
              />
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={1} sx={{ mt: 1, mb: 1 }} alignItems="stretch">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "11px", fontWeight: 600, mb: 0.5 }}>
                تصاویر محصول (اختیاری)
              </Typography>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="image-upload-edit"
                multiple
                type="file"
                onChange={onImageUpload}
              />
              <label htmlFor="image-upload-edit">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    width: "100%",
                    mb: 0.75,
                    borderColor: "var(--admin-accent)",
                    color: "var(--admin-accent)",
                    borderRadius: "8px",
                    py: 0.4,
                    fontSize: "11px",
                    fontWeight: 600,
                    minHeight: 28,
                    "&:hover": {
                      borderColor: "var(--admin-accent-hover)",
                      backgroundColor: "var(--admin-menu-hover)",
                    },
                  }}
                >
                  افزودن تصویر
                </Button>
              </label>
              <Paper
                sx={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: 210,
                  backgroundColor: "var(--admin-surface-alt)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "8px",
                  overflow: "auto",
                  p: 1,
                }}
              >
                {images.length > 0 ? (
                  <Grid container spacing={1}>
                    {images.map((image, index) => (
                      <Grid item xs={6} sm={4} key={index}>
                        <Card sx={{ position: "relative", borderRadius: "10px", overflow: "hidden" }}>
                          <CardMedia
                            component="img"
                            image={image}
                            alt={`تصویر ${index + 1}`}
                            sx={{ height: 105, objectFit: "cover" }}
                          />
                          <IconButton
                            onClick={() => onRemoveImage(index)}
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              backgroundColor: "rgba(0,0,0,0.5)",
                              color: "var(--admin-on-accent)",
                              "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px", textAlign: "center", py: 1.5 }}>
                    تصویری انتخاب نشده
                  </Typography>
                )}
              </Paper>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "11px", fontWeight: 600, mb: 0.5 }}>
                دسته‌بندی‌ها (اختیاری)
              </Typography>
              {categoryIds.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.35, mb: 0.5 }}>
                  {categoryIds.map((id) => (
                    <Chip
                      key={id}
                      size="small"
                      label={flattenCategoryName(id)}
                      onDelete={() => onRemoveCategory(id)}
                      sx={{
                        height: 20,
                        backgroundColor: "var(--admin-accent)",
                        color: "var(--admin-on-accent)",
                        fontSize: "10px",
                        "& .MuiChip-label": { px: 0.6 },
                        "& .MuiChip-deleteIcon": {
                          fontSize: 14,
                          color: "var(--admin-on-accent)",
                          "&:hover": { color: "var(--admin-error)" },
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
              <Paper
                sx={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: 210,
                  backgroundColor: "var(--admin-surface-alt)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "8px",
                  overflow: "auto",
                  py: 0.25,
                }}
              >
                {categoryTree}
              </Paper>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 0.75, mt: 0.25 }}>
          <Button
            variant="contained"
            onClick={onSubmit}
            fullWidth
            sx={{
              backgroundColor: "var(--admin-accent)",
              color: "var(--admin-on-accent)",
              py: 0.85,
              fontSize: "14px",
              fontWeight: 800,
              borderRadius: "12px",
              boxShadow: "none",
              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
            }}
          >
            ثبت تغییرات
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              minWidth: 88,
              py: 0.85,
              borderRadius: "12px",
              borderColor: "var(--admin-border)",
              color: "var(--admin-text)",
              fontWeight: 600,
              fontSize: "13px",
              "&:hover": { borderColor: "var(--admin-accent)", backgroundColor: "var(--admin-menu-hover)" },
            }}
          >
            انصراف
          </Button>
        </Box>
      </Box>
    </BottomSheet>
  );
}
