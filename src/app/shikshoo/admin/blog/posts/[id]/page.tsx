"use client";
import BlogPostEditor from "../BlogPostEditor";
import { useParams } from "next/navigation";

export default function EditBlogPostPage() {
  const params = useParams();
  const id = String(params?.id || "");
  return <BlogPostEditor postId={id} />;
}
