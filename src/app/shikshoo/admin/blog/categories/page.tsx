"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { apiRequestError } from "@/app/lib/apiRequestError";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  order?: number;
  is_active?: boolean;
  posts_count?: number;
}

export default function BlogCategoriesAdminPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    meta_title: "",
    meta_description: "",
    order: 0,
    is_active: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const token = tokenCode();
      const res = await apiRequestError("Get", {}, {}, "/api/blog/categories", true, true, token);
      if (!res?.hasError && Array.isArray(res)) {
        setCategories(res);
      } else if (!res?.hasError && Array.isArray(res?.data)) {
        setCategories(res.data);
      }
    } catch {
      toast.error("خطا در دریافت دسته‌بندی‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDialog = (cat?: BlogCategory) => {
    if (cat) {
      setEditing(cat);
      setForm({
        name: cat.name || "",
        slug: cat.slug || "",
        description: cat.description || "",
        meta_title: cat.meta_title || "",
        meta_description: cat.meta_description || "",
        order: cat.order || 0,
        is_active: cat.is_active !== false,
      });
    } else {
      setEditing(null);
      setForm({
        name: "",
        slug: "",
        description: "",
        meta_title: "",
        meta_description: "",
        order: 0,
        is_active: true,
      });
    }
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("نام دسته‌بندی الزامی است");
      return;
    }
    const token = tokenCode();
    const url = editing ? `/api/blog/categories/${editing.id}` : "/api/blog/categories";
    const method = editing ? "Put" : "Post";
    const res = await apiRequestError(method, {}, form, url, true, true, token);
    if (!res?.hasError) {
      toast.success(editing ? "ویرایش شد" : "ایجاد شد");
      setOpen(false);
      load();
    } else {
      toast.error(res.errorText || res.message || "خطا در ذخیره");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("حذف این دسته‌بندی؟")) return;
    const token = tokenCode();
    const res = await apiRequestError("Delete", {}, {}, `/api/blog/categories/${id}`, true, true, token);
    if (!res?.hasError) {
      toast.success("حذف شد");
      load();
    } else {
      toast.error(res.errorText || res.message || "خطا در حذف");
    }
  };

  return (
    <Container maxWidth="md" sx={{ pb: 12, direction: "rtl" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">دسته‌بندی وبلاگ</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>
          دسته جدید
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        categories.map((cat) => (
          <Card key={cat.id} sx={{ mb: 1.5, backgroundColor: "#2b3143", color: "#fff" }}>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
              <Box>
                <Typography fontWeight={700}>{cat.name}</Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                  /{cat.slug} · {cat.posts_count || 0} پست
                </Typography>
                <Chip
                  size="small"
                  label={cat.is_active === false ? "غیرفعال" : "فعال"}
                  color={cat.is_active === false ? "default" : "success"}
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box>
                <IconButton color="primary" onClick={() => openDialog(cat)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => remove(cat.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="نام" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="اسلاگ (اختیاری)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} fullWidth helperText="برای URL و سئو" />
          <TextField label="توضیح" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <TextField label="Meta Title" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} fullWidth />
          <TextField label="Meta Description" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} fullWidth multiline rows={2} />
          <TextField label="ترتیب" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} fullWidth />
          <FormControlLabel
            control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />}
            label="فعال"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>انصراف</Button>
          <Button variant="contained" onClick={save}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>
      <ToastContainer position="top-center" rtl />
    </Container>
  );
}
