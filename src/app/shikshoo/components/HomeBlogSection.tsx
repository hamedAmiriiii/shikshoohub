"use client";
import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError";

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image_url?: string;
  category?: { name: string };
};

export default function HomeBlogSection() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const shop = process.env.NEXT_PUBLIC_SHOP_CODE;
    const qs = shop ? `&atelier_code=${encodeURIComponent(shop)}` : "";
    apiRequestError(
      "Get",
      {},
      {},
      `/api/blog/posts/featured?limit=6${qs}`,
      true,
      true,
      ""
    ).then((res) => {
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      if (list.length > 0) {
        setPosts(list);
        return;
      }
      apiRequestError(
        "Get",
        {},
        {},
        `/api/blog/posts?paginate=false&per_page=6&public_only=1${qs}`,
        true,
        true,
        ""
      ).then((fallback) => {
        const items = Array.isArray(fallback)
          ? fallback
          : Array.isArray(fallback?.data)
            ? fallback.data
            : [];
        setPosts(items);
      });
    });
  }, []);

  if (posts.length === 0) return null;

  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 700, color: "#1a1d2e" }}>
          مطالب وبلاگ
        </Typography>
        <Button onClick={() => router.push("/shikshoo/blog")} sx={{ color: "#667eea", fontWeight: 600 }}>
          مشاهده همه
        </Button>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
          gap: 2,
        }}
      >
        {posts.map((post) => (
          <Card
            key={post.id}
            onClick={() => router.push(`/shikshoo/blog/${post.slug}`)}
            sx={{
              cursor: "pointer",
              borderRadius: 3,
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              transition: "transform .2s",
              "&:hover": { transform: "translateY(-3px)" },
            }}
          >
            {post.featured_image_url ? (
              <CardMedia component="img" height="140" image={post.featured_image_url} alt={post.title} />
            ) : (
              <Box sx={{ height: 140, background: "linear-gradient(135deg,#667eea,#764ba2)" }} />
            )}
            <CardContent>
              {post.category?.name ? (
                <Typography sx={{ fontSize: 12, color: "#6941c6", mb: 0.5 }}>{post.category.name}</Typography>
              ) : null}
              <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1, lineHeight: 1.6 }}>{post.title}</Typography>
              <Typography sx={{ fontSize: 13, color: "#667085", lineHeight: 1.7 }}>
                {(post.excerpt || "").slice(0, 110)}
                {(post.excerpt || "").length > 110 ? "…" : ""}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
