"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BlogAdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/shikshoo/admin/blog/posts");
  }, [router]);
  return null;
}
