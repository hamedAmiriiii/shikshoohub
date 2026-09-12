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
import { apiRequestError } from "@/app/lib/apiRequestError";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface BlogComment {
  id: number;
  author_name: string;
  author_email?: string;
  body: string;
  status: string;
  created_at?: string;
  post?: { id: number; title: string; slug: string };
}

export default function BlogCommentsAdminPage() {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  const load = async (st = status) => {
    try {
      setLoading(true);
      const token = tokenCode();
      const res = await apiRequestError(
        "Get",
        {},
        {},
        `/api/blog/comments?status=${st}&per_page=50`,
        true,
        true,
        token
      );
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setComments(list);
    } catch {
      toast.error("خطا در دریافت نظرات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const setCommentStatus = async (id: number, next: string) => {
    const token = tokenCode();
    const res = await apiRequestError("Put", {}, { status: next }, `/api/blog/comments/${id}`, true, true, token);
    if (!res?.hasError) {
      toast.success("وضعیت بروزرسانی شد");
      load();
    } else {
      toast.error(res.errorText || res.message || "خطا");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("حذف نظر؟")) return;
    const token = tokenCode();
    const res = await apiRequestError("Delete", {}, {}, `/api/blog/comments/${id}`, true, true, token);
    if (!res?.hasError) {
      toast.success("حذف شد");
      load();
    } else {
      toast.error(res.errorText || res.message || "خطا");
    }
  };

  return (
    <Container maxWidth="md" sx={{ pb: 12, direction: "rtl" }}>
      <Typography variant="h6" mb={2}>
        مدیریت نظرات وبلاگ
      </Typography>
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        {[
          { key: "pending", label: "در انتظار" },
          { key: "approved", label: "تایید شده" },
          { key: "rejected", label: "رد شده" },
        ].map((item) => (
          <Button
            key={item.key}
            variant={status === item.key ? "contained" : "outlined"}
            onClick={() => setStatus(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : comments.length === 0 ? (
        <Typography color="text.secondary">موردی نیست.</Typography>
      ) : (
        comments.map((c) => (
          <Card key={c.id} sx={{ mb: 1.5, backgroundColor: "#2b3143", color: "#fff" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" gap={1} flexWrap="wrap">
                <Typography fontWeight={700}>{c.author_name}</Typography>
                <Chip size="small" label={c.status} />
              </Box>
              <Typography variant="body2" color="rgba(255,255,255,0.7)" mb={1}>
                {c.post?.title || "—"}
              </Typography>
              <Typography mb={2}>{c.body}</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {c.status !== "approved" ? (
                  <Button size="small" variant="contained" color="success" onClick={() => setCommentStatus(c.id, "approved")}>
                    تایید
                  </Button>
                ) : null}
                {c.status !== "rejected" ? (
                  <Button size="small" variant="outlined" color="warning" onClick={() => setCommentStatus(c.id, "rejected")}>
                    رد
                  </Button>
                ) : null}
                <Button size="small" variant="outlined" color="error" onClick={() => remove(c.id)}>
                  حذف
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
      <ToastContainer position="top-center" rtl />
    </Container>
  );
}
