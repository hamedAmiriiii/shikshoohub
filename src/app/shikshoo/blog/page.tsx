import type { Metadata } from "next";
import Link from "next/link";
import { fetchBlogApi, siteUrl, absoluteMedia, type BlogPostSummary } from "./blogApi";

export const metadata: Metadata = {
  title: "وبلاگ | مقالات و راهنماها",
  description: "آخرین مقالات، آموزش‌ها و اخبار فروشگاه را در وبلاگ بخوانید.",
  alternates: {
    canonical: siteUrl("/shikshoo/blog"),
  },
  openGraph: {
    title: "وبلاگ",
    description: "آخرین مقالات و راهنماهای فروشگاه",
    url: siteUrl("/shikshoo/blog"),
    type: "website",
    locale: "fa_IR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

async function getPosts(category?: string) {
  const qs = new URLSearchParams({
    paginate: "true",
    per_page: "12",
    public_only: "1",
  });
  if (category) qs.set("category", category);
  const res = await fetchBlogApi<any>(`/api/blog/posts?${qs.toString()}`);
  if (!res) return { data: [] as BlogPostSummary[], categories: [] as any[] };
  const categories = (await fetchBlogApi<any[]>("/api/blog/categories?is_active=1")) || [];
  return {
    data: (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []) as BlogPostSummary[],
    categories: Array.isArray(categories) ? categories.filter((c) => c.is_active !== false) : [],
  };
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const category = searchParams?.category;
  const { data: posts, categories } = await getPosts(category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "وبلاگ",
    url: siteUrl("/shikshoo/blog"),
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: siteUrl(`/shikshoo/blog/${p.slug}`),
      datePublished: p.published_at || undefined,
      image: absoluteMedia(p.featured_image_url),
      description: p.excerpt || p.seo?.description,
    })),
  };

  return (
    <div style={{ direction: "rtl", background: "#f7f8fb", minHeight: "100vh", padding: "24px 16px 48px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <nav style={{ marginBottom: 16, color: "#667085", fontSize: 14 }}>
          <Link href="/shikshoo">خانه</Link>
          <span> / </span>
          <span>وبلاگ</span>
        </nav>

        <h1 style={{ fontSize: 32, margin: "0 0 8px", color: "#101828" }}>وبلاگ</h1>
        <p style={{ margin: "0 0 24px", color: "#667085" }}>
          مقالات آموزشی و به‌روز برای مدیریت بهتر فروشگاه
        </p>

        {categories.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            <Link
              href="/shikshoo/blog"
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: !category ? "#1a1d2e" : "#fff",
                color: !category ? "#fff" : "#344054",
                border: "1px solid #d0d5dd",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              همه
            </Link>
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/shikshoo/blog?category=${cat.slug}`}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: category === cat.slug ? "#1a1d2e" : "#fff",
                  color: category === cat.slug ? "#fff" : "#344054",
                  border: "1px solid #d0d5dd",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        ) : null}

        {posts.length === 0 ? (
          <p style={{ color: "#667085" }}>هنوز مطلبی منتشر نشده است.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {posts.map((post) => (
              <article
                key={post.id}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid #eaecf0",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {post.featured_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={absoluteMedia(post.featured_image_url)}
                    alt={post.title}
                    style={{ width: "100%", height: 160, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ height: 160, background: "linear-gradient(135deg,#667eea,#764ba2)" }} />
                )}
                <div style={{ padding: 16, display: 1, displayContent: "space-between" }}>
                  <div>
                    {post.category?.name ? (
                      <div style={{ color: "#6941c6", fontSize: 12, marginBottom: 6 }}>{post.category.name}</div>
                    ) : null}
                    <h2 style={{ fontSize: 18, margin: "0 0 8px", lineHeight: 1.5 }}>
                      <Link href={`/shikshoo/blog/${post.slug}`} style={{ color: "#101828", textDecoration: "none" }}>
                        {post.title}
                      </Link>
                    </h2>
                    <p style={{ color: "#667085", fontSize: 14, margin: 0, lineHeight: 1.7 }}>
                      {post.excerpt || post.seo?.description || ""}
                    </p>
                  </div>
                  <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", color: "#98a2b3", fontSize: 12 }}>
                    <span>{post.reading_time ? `${post.reading_time} دقیقه مطالعه` : ""}</span>
                    <Link href={`/shikshoo/blog/${post.slug}`} style={{ color: "#1a1d2e", fontWeight: 600 }}>
                      ادامه مطلب
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
