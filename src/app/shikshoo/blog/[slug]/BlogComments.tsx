"use client";
import { useState } from "react";
import { apiRequestError } from "@/app/lib/apiRequestError";

export default function BlogComments({
  postId,
  initialComments,
}: {
  postId: number;
  initialComments: any[];
}) {
  const [comments] = useState(initialComments || []);
  const [author_name, setName] = useState("");
  const [author_email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!author_name.trim() || !body.trim()) {
      setMessage("نام و متن نظر الزامی است");
      return;
    }
    setLoading(true);
    const shop = process.env.NEXT_PUBLIC_SHOP_CODE;
    const qs = shop ? `?atelier_code=${encodeURIComponent(shop)}` : "";
    const res = await apiRequestError(
      "Post",
      {},
      { blog_post_id: postId, author_name, author_email, body },
      `/api/blog/comments${qs}`,
      true,
      true,
      ""
    );
    setLoading(false);
    if (!res?.hasError) {
      setMessage(res?.message || "نظر شما ثبت شد و پس از تایید نمایش داده می‌شود.");
      setBody("");
    } else {
      setMessage(res.errorText || res.message || "خطا در ثبت نظر");
    }
  };

  return (
    <section style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #eaecf0" }}>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>نظرات</h2>

      {comments.length === 0 ? (
        <p style={{ color: "#98a2b3" }}>هنوز نظری تایید نشده است.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {comments.map((c) => (
            <div key={c.id} style={{ background: "#f9fafb", borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{c.author_name}</div>
              <div style={{ color: "#344054", lineHeight: 1.8 }}>{c.body}</div>
              {Array.isArray(c.replies) && c.replies.length > 0 ? (
                <div style={{ marginTop: 10, paddingRight: 12, borderRight: "3px solid #d0d5dd" }}>
                  {c.replies.map((r: any) => (
                    <div key={r.id} style={{ marginTop: 8 }}>
                      <strong>{r.author_name}</strong>
                      <div>{r.body}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>ثبت نظر</h3>
        <input
          value={author_name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام"
          style={{ padding: 12, borderRadius: 10, border: "1px solid #d0d5dd" }}
        />
        <input
          value={author_email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ایمیل (اختیاری)"
          style={{ padding: 12, borderRadius: 10, border: "1px solid #d0d5dd" }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="متن نظر"
          rows={4}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #d0d5dd", resize: "vertical" }}
        />
        <button
          onClick={submit}
          disabled={loading}
          style={{
            alignSelf: "flex-start",
            background: "#1a1d2e",
            color: "#fff",
            border: 0,
            borderRadius: 10,
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          {loading ? "در حال ارسال..." : "ارسال نظر"}
        </button>
        {message ? <p style={{ color: "#475467", margin: 0 }}>{message}</p> : null}
      </div>
    </section>
  );
}
