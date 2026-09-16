"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  clearOilQrCache,
  downloadOilQr,
  loadOilQrDataUrl,
  oilQrLandingUrl,
  peekOilQrCache,
} from "@/app/lib/oil/qrCache";

type Props = {
  shopCode: string;
  shopName?: string;
  /** compact = داشبورد؛ full = صفحه QR */
  variant?: "full" | "compact";
};

export default function OilQrPanel({ shopCode, shopName, variant = "full" }: Props) {
  const landingUrl = oilQrLandingUrl(shopCode);
  const [dataUrl, setDataUrl] = useState<string | null>(() => peekOilQrCache(shopCode, 280));
  const [loading, setLoading] = useState(!peekOilQrCache(shopCode, 280));
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const peek = peekOilQrCache(shopCode, 280);
    if (peek) {
      setDataUrl(peek);
      setLoading(false);
      return;
    }
    setLoading(true);
    void loadOilQrDataUrl(shopCode, 280)
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          toast.error("بارگذاری QR ممکن نشد");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shopCode]);

  const handleCopy = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(landingUrl);
      toast.success("لینک کپی شد");
    } catch {
      toast.error("کپی لینک ممکن نشد");
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = () => {
    if (!dataUrl) {
      toast.error("QR هنوز آماده نیست");
      return;
    }
    downloadOilQr(dataUrl, shopCode);
  };

  if (variant === "compact") {
    return (
      <section className="oil-card oil-qr-home">
        <div className="oil-qr-home-row">
          <div className="oil-qr-home-text">
            <strong>QR مشتری</strong>
            <p className="oil-muted" style={{ margin: "4px 0 0" }}>
              برای چاپ و نصب در مغازه
            </p>
            <div className="oil-qr-home-actions">
              <Link href="/oil/qr" className="oil-btn oil-btn-ghost" style={{ textDecoration: "none" }}>
                مشاهده و دانلود
              </Link>
            </div>
          </div>
          <div className="oil-qr-thumb">
            {loading && !dataUrl ? (
              <span className="oil-muted" style={{ fontSize: 12 }}>
                …
              </span>
            ) : dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt="QR" width={88} height={88} />
            ) : (
              <span className="oil-muted" style={{ fontSize: 12 }}>
                —
              </span>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="oil-page">
      <p className="oil-muted" style={{ marginTop: 0 }}>
        این کد را چاپ کنید و در مغازه بزنید. مشتری با اسکن، شماره موبایل می‌دهد و سوابق تعویض روغن را
        می‌بیند.
        {shopName ? ` (${shopName})` : ""}
      </p>

      <div className="oil-qr-preview">
        {loading && !dataUrl ? (
          <p className="oil-muted">در حال آماده‌سازی QR…</p>
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR سوابق مشتری" width={240} height={240} />
        ) : (
          <p className="oil-muted">QR آماده نشد.</p>
        )}
      </div>

      <p className="oil-muted" dir="ltr" style={{ wordBreak: "break-all", marginBottom: 12 }}>
        {landingUrl}
      </p>

      <button
        type="button"
        className="oil-btn oil-btn-primary"
        disabled={!dataUrl}
        onClick={handleDownload}
      >
        دانلود QR
      </button>
      <button
        type="button"
        className="oil-btn oil-btn-ghost"
        style={{ marginTop: 8 }}
        disabled={copying}
        onClick={() => void handleCopy()}
      >
        {copying ? "در حال کپی…" : "کپی لینک"}
      </button>
      <button
        type="button"
        className="oil-btn oil-btn-ghost"
        style={{ marginTop: 8 }}
        onClick={() => {
          clearOilQrCache();
          setDataUrl(null);
          setLoading(true);
          void loadOilQrDataUrl(shopCode, 280)
            .then((url) => {
              setDataUrl(url);
              toast.success("QR تازه شد");
            })
            .catch(() => toast.error("بارگذاری QR ممکن نشد"))
            .finally(() => setLoading(false));
        }}
      >
        ساخت دوباره
      </button>
    </div>
  );
}
