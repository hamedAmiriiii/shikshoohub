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
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface BlogPostItem {
  id: number;
  title: string;
  slug: string;
  is_published?: boolean;
  is_featured?: boolean;
  published_at?: string | null;
  views_count?: number;
  category?: { name: string } | null;
}

export default function BlogPostsAdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = tokenCode();
        const res = await apiRequestError(
          "Get",
          {},
          {},
          "/api/blog/posts?paginate=true&per_page=50",
          true,
          true,
          token
        );
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setPosts(list);
      } catch {
        toast.error("خطا در دریافت پست‌ها");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Container maxWidth="md" sx={{ pb: 12, direction: "rtl" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={1} flexWrap="wrap">
        <Typography variant="h6">پست‌های وبلاگ</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={() => router.push("/shikshoo/admin/blog/categories")}>
            دسته‌ها
          </Button>
          <Button variant="outlined" onClick={() => router.push("/shikshoo/admin/blog/comments")}>
            نظرات
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/shikshoo/admin/blog/posts/create")}
          >
            پست جدید
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Typography color="text.secondary">هنوز پستی ثبت نشده است.</Typography>
      ) : (
        posts.map((post) => (
          <Card key={post.id} sx={{ mb: 1.5, backgroundColor: "#2b3143", color: "#fff" }}>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
              <Box>
                <Typography fontWeight={700}>{post.title}</Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                  /blog/{post.slug}
                  {post.category?.name ? ` · ${post.category.name}` : ""}
                  {typeof post.views_count === "number" ? ` · ${post.views_count} بازدید` : ""}
                </Typography>
                <Box mt={1} display="flex" gap={1}>
                  <Chip
                    size="small"
                    label={post.is_published ? "منتشر شده" : "پیش‌نویس"}
                    color={post.is_published ? "success" : "warning"}
                  />
                  {post.is_featured ? <Chip size="small" label="ویژه صفحه اول" color="info" /> : null}
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/shikshoo/admin/blog/posts/${post.id}`)}
              >
                ویرایش
              </Button>
            </CardContent>
          </Card>
        ))
      )}
      <ToastContainer position="top-center" rtl />
    </Container>
  );
}
