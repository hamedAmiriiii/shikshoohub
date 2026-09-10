"use client";

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

type ProductEditSheetProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
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
  return (
    <BottomSheet open={open} onClose={() => onClose()} title="ویرایش کالا" dense>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, direction: "rtl" }}>
        <Grid container spacing={0.75} alignItems="flex-end">
          <Grid item xs={12} sm={6}>
            <TextInput value={name} label="نام کالا" onChange={onNameChange} name="name" type="text" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px", mb: 0.25 }}>بارکد</Typography>
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
                  direction: "ltr",
                  textAlign: "left",
                  py: "7px",
                  fontSize: "13px",
                  color: "var(--admin-text)",
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
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
              label="توضیحات (اختیاری)"
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
                  color: "var(--admin-text)",
                },
                "& .MuiInputLabel-root": {
                  color: "var(--admin-text-muted)",
                  fontSize: "13px",
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "var(--admin-accent)" },
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextInput
              value={profitPercentage}
              label="درصد سود"
              onChange={onProfitPercentageChange}
              name="profitPercentage"
              type="number"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextInput
              value={purchasePrice}
              label="قیمت خرید"
              onChange={onPurchasePriceChange}
              name="purchase_price"
              type="number"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <TextInput
              value={salePrice}
              label="قیمت فروش"
              onChange={onSalePriceChange}
              name="sale_price"
              type="number"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextInput value={quantity} label="موجودی" onChange={onQuantityChange} name="quantity" type="number" />
          </Grid>
          <Grid item xs={12} sm={8} md={3}>
            <TextInput
              value={discountPercent}
              label="تخفیف %"
              onChange={onDiscountPercentChange}
              name="discountPercent"
              type="number"
            />
          </Grid>
        </Grid>

        <Grid container spacing={0.75}>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px", mb: 0.35 }}>
              تصاویر (اختیاری)
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
                startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 16 }} />}
                sx={{
                  width: "100%",
                  minHeight: 32,
                  py: 0.4,
                  mb: 0.5,
                  fontSize: "12px",
                  borderRadius: "10px",
                  borderStyle: "dashed",
                  borderColor: "var(--admin-accent)",
                  color: "var(--admin-accent)",
                  "&:hover": {
                    borderColor: "var(--admin-accent-hover)",
                    backgroundColor: "var(--admin-menu-hover)",
                  },
                }}
              >
                افزودن تصویر
              </Button>
            </label>
            {images.length > 0 ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.5 }}>
                {images.map((image, index) => (
                  <Card key={index} sx={{ position: "relative", borderRadius: "8px", overflow: "hidden" }}>
                    <CardMedia component="img" image={image} alt={`تصویر ${index + 1}`} sx={{ height: 56, objectFit: "cover" }} />
                    <IconButton
                      onClick={() => onRemoveImage(index)}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        p: 0.2,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        color: "var(--admin-on-accent)",
                        "&:hover": { backgroundColor: "rgba(244,67,54,0.9)" },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px", textAlign: "center", py: 0.5 }}>
                تصویری انتخاب نشده
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px", mb: 0.35 }}>
              دسته‌بندی‌ها (اختیاری)
            </Typography>
            {categoryIds.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4, mb: 0.5 }}>
                {categoryIds.map((id) => (
                  <Chip
                    key={id}
                    size="small"
                    label={flattenCategoryName(id)}
                    onDelete={() => onRemoveCategory(id)}
                    sx={{
                      height: 22,
                      backgroundColor: "var(--admin-accent)",
                      color: "var(--admin-on-accent)",
                      "& .MuiChip-label": { px: 0.75, fontSize: "11px" },
                      "& .MuiChip-deleteIcon": { color: "var(--admin-on-accent)", fontSize: 14 },
                    }}
                  />
                ))}
              </Box>
            )}
            <Paper
              sx={{
                backgroundColor: "var(--admin-surface-alt)",
                border: "1px dashed var(--admin-border)",
                borderRadius: "10px",
                maxHeight: 160,
                overflow: "auto",
                py: 0.25,
              }}
            >
              {categoryTree}
            </Paper>
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
