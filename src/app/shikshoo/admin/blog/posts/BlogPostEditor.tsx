"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface BlogCategory {
  id: number;
  name: string;
}

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  blog_category_id: "" as number | "",
  author_name: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  og_title: "",
  og_description: "",
  canonical_url: "",
  is_published: false,
  is_featured: false,
  allow_comments: true,
  featured_image: "",
};

export default function BlogPostEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(postId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const token = tokenCode();
    apiRequestError("Get", {}, {}, "/api/blog/categories", true, true, token).then((res) => {
      if (!res?.hasError && Array.isArray(res)) setCategories(res);
    });
  }, []);

  useEffect(() => {
    if (!postId) return;
    const token = tokenCode();
    setLoading(true);
    apiRequestError("Get", {}, {}, `/api/blog/posts/${postId}?increment_views=0`, true, true, token)
      .then((res) => {
        if (res?.hasError) {
          toast.error("پست یافت نشد");
          return;
        }
        setForm({
          title: res.title || "",
          slug: res.slug || "",
          excerpt: res.excerpt || "",
          content: res.content || "",
          blog_category_id: res.blog_category_id || "",
          author_name: res.author_name || "",
          meta_title: res.meta_title || "",
          meta_description: res.meta_description || "",
          meta_keywords: res.meta_keywords || "",
          og_title: res.og_title || "",
          og_description: res.og_description || "",
          canonical_url: res.canonical_url || "",
          is_published: !!res.is_published,
          is_featured: !!res.is_featured,
          allow_comments: res.allow_comments !== false,
          featured_image: "",
        });
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const seoPreview = useMemo(() => {
    const title = form.meta_title || form.title || "عنوان مطلب";
    const desc = form.meta_description || form.excerpt || "توضیح کوتاه مطلب برای موتورهای جستجو";
    return { title, desc };
  }, [form]);

  const onFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, featured_image: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    setSaving(true);
    const token = tokenCode();
    const payload: any = {
      ...form,
      blog_category_id: form.blog_category_id || null,
    };
    if (!payload.featured_image) delete payload.featured_image;

    const url = isEdit ? `/api/blog/posts/${postId}` : "/api/blog/posts";
    const method = isEdit ? "Put" : "Post";
    const res = await apiRequestError(method, {}, payload, url, true, true, token);
    setSaving(false);

    if (!res?.hasError) {
      toast.success(isEdit ? "پست بروزرسانی شد" : "پست ایجاد شد");
      router.push("/shikshoo/admin/blog/posts");
    } else {
      toast.error(res.errorText || res.message || "خطا در ذخیره پست");
    }
  };

  const remove = async () => {
    if (!postId || !confirm("این پست حذف شود؟")) return;
    const token = tokenCode();
    const res = await apiRequestError("Delete", {}, {}, `/api/blog/posts/${postId}`, true, true, token);
    if (!res?.hasError) {
      toast.success("حذف شد");
      router.push("/shikshoo/admin/blog/posts");
    } else {
      toast.error(res.errorText || res.message || "خطا در حذف");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pb: 12, direction: "rtl" }}>
      <Typography variant="h6" mb={2}>
        {isEdit ? "ویرایش پست" : "ایجاد پست جدید"}
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        <TextField label="عنوان *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <TextField label="اسلاگ (SEO URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} fullWidth helperText="مثال: how-to-manage-inventory" />
        <FormControl fullWidth>
          <InputLabel>دسته‌بندی</InputLabel>
          <Select
            label="دسته‌بندی"
            value={form.blog_category_id}
            onChange={(e) => setForm({ ...form, blog_category_id: e.target.value as number | "" })}
          >
            <MenuItem value="">بدون دسته</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="خلاصه / Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} fullWidth multiline rows={2} />
        <TextField
          label="محتوای مطلب (HTML مجاز)"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          fullWidth
          multiline
          rows={12}
          helperText="برای سئو از تیترهای h2/h3، پاراگراف و لینک داخلی استفاده کنید"
        />
        <TextField label="نام نویسنده" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} fullWidth />
        <Button variant="outlined" component="label">
          تصویر شاخص
          <input hidden type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
        </Button>
        {form.featured_image ? (
          <Typography variant="caption" color="success.main">
            تصویر انتخاب شد
          </Typography>
        ) : null}

        <Typography variant="subtitle1" mt={1}>
          تنظیمات سئو
        </Typography>
        <TextField label="Meta Title" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} fullWidth helperText={`${(form.meta_title || form.title).length}/60 کاراکتر پیشنهادی`} />
        <TextField label="Meta Description" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} fullWidth multiline rows={2} helperText={`${(form.meta_description || form.excerpt).length}/160 کاراکتر پیشنهادی`} />
        <TextField label="Meta Keywords" value={form.meta_keywords} onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })} fullWidth />
        <TextField label="OG Title" value={form.og_title} onChange={(e) => setForm({ ...form, og_title: e.target.value })} fullWidth />
        <TextField label="OG Description" value={form.og_description} onChange={(e) => setForm({ ...form, og_description: e.target.value })} fullWidth multiline rows={2} />
        <TextField label="Canonical URL" value={form.canonical_url} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} fullWidth />

        <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#f5f5f5" }}>
          <Typography variant="caption" color="text.secondary">
            پیش‌نمایش گوگل
          </Typography>
          <Typography sx={{ color: "#1a0dab", fontSize: 18 }}>{seoPreview.title}</Typography>
          <Typography sx={{ color: "#006621", fontSize: 13 }}>/shikshoo/blog/{form.slug || "..."}</Typography>
          <Typography sx={{ color: "#545454", fontSize: 13 }}>{seoPreview.desc}</Typography>
        </Box>

        <FormControlLabel control={<Switch checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />} label="انتشار" />
        <FormControlLabel control={<Switch checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />} label="نمایش در صفحه اول" />
        <FormControlLabel control={<Switch checked={form.allow_comments} onChange={(e) => setForm({ ...form, allow_comments: e.target.checked })} />} label="اجازه ثبت نظر" />

        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
          <Button variant="outlined" onClick={() => router.push("/shikshoo/admin/blog/posts")}>
            بازگشت
          </Button>
          {isEdit ? (
            <Button color="error" variant="outlined" onClick={remove}>
              حذف
            </Button>
          ) : null}
        </Box>
      </Box>
      <ToastContainer position="top-center" rtl />
    </Container>
  );
}
