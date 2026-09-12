import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { absoluteMedia, fetchBlogApi, siteUrl, type BlogPostSummary } from "../blogApi";
import BlogComments from "./BlogComments";

type PostDetail = BlogPostSummary & {
  content?: string;
  allow_comments?: boolean;
  comments?: any[];
  comments_count?: number;
  meta_keywords?: string | null;
};

async function getPost(slug: string) {
  return fetchBlogApi<PostDetail>(`/api/blog/posts/${encodeURIComponent(slug)}?public_only=1`);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) {
    return { title: "مطلب یافت نشد" };
  }
  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.excerpt || "";
  const image = absoluteMedia(post.seo?.og_image || post.featured_image_url);
  const url = post.seo?.canonical_url || siteUrl(`/shikshoo/blog/${post.slug}`);

  return {
    title,
    description,
    keywords: post.seo?.keywords || post.meta_keywords || undefined,
    alternates: { canonical: url },
    openGraph: {
      title: post.seo?.og_title || title,
      description: post.seo?.og_description || description,
      url,
      type: "article",
      locale: "fa_IR",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo?.og_title || title,
      description: post.seo?.og_description || description,
      images: image ? [image] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const url = post.seo?.canonical_url || siteUrl(`/shikshoo/blog/${post.slug}`);
  const image = absoluteMedia(post.seo?.og_image || post.featured_image_url);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo?.description || post.excerpt,
    image: image ? [image] : undefined,
    datePublished: post.published_at || undefined,
    author: post.author_name
      ? { "@type": "Person", name: post.author_name }
      : { "@type": "Organization", name: "فروشگاه" },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.category?.name,
    wordCount: post.content ? post.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length : undefined,
  };

  return (
    <article style={{ direction: "rtl", background: "#fff", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 48px" }}>
        <nav style={{ marginBottom: 16, color: "#667085", fontSize: 14 }}>
          <Link href="/shikshoo">خانه</Link>
          <span> / </span>
          <Link href="/shikshoo/blog">وبلاگ</Link>
          <span> / </span>
          <span>{post.title}</span>
        </nav>

        {post.category?.name ? (
          <Link href={`/shikshoo/blog?category=${post.category.slug}`} style={{ color: "#6941c6", fontSize: 13 }}>
            {post.category.name}
          </Link>
        ) : null}

        <h1 style={{ fontSize: 34, lineHeight: 1.4, margin: "8px 0 12px", color: "#101828" }}>{post.title}</h1>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#98a2b3", fontSize: 13, marginBottom: 20 }}>
          {post.author_name ? <span>نویسنده: {post.author_name}</span> : null}
          {post.reading_time ? <span>{post.reading_time} دقیقه مطالعه</span> : null}
          {typeof post.views_count === "number" ? <span>{post.views_count} بازدید</span> : null}
        </div>

        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={post.title}
            style={{ width: "100%", borderRadius: 16, marginBottom: 24, maxHeight: 420, objectFit: "cover" }}
          />
        ) : null}

        {post.excerpt ? (
          <p style={{ fontSize: 17, color: "#475467", lineHeight: 1.9, marginBottom: 24 }}>{post.excerpt}</p>
        ) : null}

        <div
          className="blog-content"
          style={{ fontSize: 17, lineHeight: 2, color: "#1d2939" }}
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />

        {post.allow_comments !== false ? (
          <BlogComments postId={post.id} initialComments={post.comments || []} />
        ) : null}
      </div>
    </article>
  );
}
