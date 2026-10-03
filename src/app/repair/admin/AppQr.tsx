"use client";

import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Typography } from "@mui/material";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";
import { qrImageUrl } from "@/app/lib/repair/api";

export type RepairAppQrKind = "customer" | "technician";

const APPS: Record<RepairAppQrKind, { path: string; title: string; hint: string; fileName: string }> = {
  customer: {
    path: "/repair",
    title: "اپ مشتریان",
    hint: "مشتری این کد را اسکن می‌کند، اپ را روی گوشی نصب می‌کند و درخواست تعمیر ثبت می‌کند.",
    fileName: "repair-customer-qr.png",
  },
  technician: {
    path: "/repair/tech/login",
    title: "اپ تعمیرکاران",
    hint: "تعمیرکار این کد را اسکن می‌کند، ثبت‌نام می‌کند و اپ را نصب می‌کند. بعد از تأیید شما وارد پنلش می‌شود.",
    fileName: "repair-technician-qr.png",
  },
};

function useAppUrl(kind: RepairAppQrKind) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(`${window.location.origin}${APPS[kind].path}`);
  }, [kind]);
  return url;
}

async function downloadQr(url: string, fileName: string) {
  const src = qrImageUrl(url, 1000);
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error();
    const blobUrl = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(src, "_blank", "noopener");
  }
}

function QrBody({ kind, url, size }: { kind: RepairAppQrKind; url: string; size: number }) {
  const app = APPS[kind];
  return (
    <Stack spacing={1.5} alignItems="center" sx={{ textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        {app.hint}
      </Typography>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrImageUrl(url, 400)} alt={`QR ${app.title}`} width={size} height={size} style={{ borderRadius: 8 }} />
      )}
      <Typography variant="caption" dir="ltr" sx={{ wordBreak: "break-all" }}>
        {url}
      </Typography>
    </Stack>
  );
}

function QrActions({ kind, url }: { kind: RepairAppQrKind; url: string }) {
  const copy = () => {
    void navigator.clipboard?.writeText(url);
    toast.info("لینک کپی شد.");
  };
  return (
    <>
      <Button size="small" startIcon={<ContentCopyIcon />} onClick={copy} disabled={!url}>
        کپی لینک
      </Button>
      <Button size="small" startIcon={<DownloadIcon />} onClick={() => void downloadQr(url, APPS[kind].fileName)} disabled={!url}>
        دانلود QR
      </Button>
    </>
  );
}

export function AppQrCard({ kind }: { kind: RepairAppQrKind }) {
  const url = useAppUrl(kind);
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: "100%" }}>
      <Stack spacing={1.5} alignItems="center">
        <Typography fontWeight={800}>{APPS[kind].title}</Typography>
        <QrBody kind={kind} url={url} size={180} />
        <Stack direction="row" spacing={1}>
          <QrActions kind={kind} url={url} />
        </Stack>
      </Stack>
    </Paper>
  );
}

export function AppQrButton({ kind, label }: { kind: RepairAppQrKind; label: string }) {
  const [open, setOpen] = useState(false);
  const url = useAppUrl(kind);
  return (
    <>
      <Button variant="outlined" startIcon={<QrCode2Icon />} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{APPS[kind].title}</DialogTitle>
        <DialogContent>
          <QrBody kind={kind} url={url} size={240} />
        </DialogContent>
        <DialogActions>
          <QrActions kind={kind} url={url} />
          <Button size="small" onClick={() => setOpen(false)}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
