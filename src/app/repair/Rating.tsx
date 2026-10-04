"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { toast } from "react-toastify";
import { formatFaNumber, isRepairError, repairApi, type RepairRequest } from "@/app/lib/repair/api";
import { Section } from "./ui";

const LABELS: Record<number, string> = {
  1: "خیلی بد",
  2: "بد",
  3: "متوسط",
  4: "خوب",
  5: "عالی",
};

export function RatingDialog({
  request,
  open,
  onClose,
  onRated,
}: {
  request: RepairRequest;
  open: boolean;
  onClose: () => void;
  onRated: (request: RepairRequest) => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState(-1);
  const [review, setReview] = useState("");
  const [busy, setBusy] = useState(false);
  const technicianName = request.technician?.name || "تعمیرکار";
  const shown = hover !== -1 ? hover : rating;

  const submit = async () => {
    if (!rating) {
      toast.error("امتیاز را انتخاب کنید.");
      return;
    }
    setBusy(true);
    const res = await repairApi.rateRequest(request.id, { rating, review: review.trim() || undefined });
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    onRated(res.request);
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ textAlign: "center", fontWeight: 800 }}>ثبت امتیاز و نظر</DialogTitle>
      <DialogContent>
        <Stack spacing={2} alignItems="center" sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            از کار {technicianName} چقدر راضی بودید؟
          </Typography>
          <Rating
            value={rating}
            onChange={(_, value) => setRating(value)}
            onChangeActive={(_, value) => setHover(value)}
            size="large"
            sx={{ fontSize: 44 }}
            emptyIcon={<StarIcon fontSize="inherit" sx={{ opacity: 0.3 }} />}
          />
          <Typography variant="body2" fontWeight={700} color="warning.main" sx={{ minHeight: 22 }}>
            {shown ? LABELS[shown] : ""}
          </Typography>
          <TextField
            label="نظر شما (اختیاری)"
            placeholder="مثلاً: به‌موقع آمد و کار تمیزی انجام داد."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy} color="inherit">
          بعداً
        </Button>
        <Button variant="contained" onClick={() => void submit()} disabled={busy || !rating}>
          ثبت امتیاز
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** نمایش میانگین امتیاز: ★ ۴٫۵ (۱۲ نظر) */
export function RatingBadge({ avg, count, emptyText = "بدون امتیاز" }: { avg?: number | null; count?: number; emptyText?: string }) {
  if (!avg || !count) {
    return (
      <Typography component="span" variant="caption" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }
  return (
    <Stack component="span" direction="row" spacing={0.5} alignItems="center" sx={{ display: "inline-flex" }}>
      <StarIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
      <Typography component="span" variant="caption" fontWeight={800}>
        {avg.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}
      </Typography>
      <Typography component="span" variant="caption" color="text.secondary">
        ({formatFaNumber(count)} نظر)
      </Typography>
    </Stack>
  );
}

export function RatingStars({ value }: { value: number }) {
  return <Rating value={value} readOnly size="small" />;
}

/** امتیاز و نظری که مشتری برای این درخواست ثبت کرده (نمای مدیر و تعمیرکار). */
export function CustomerReview({ request }: { request: RepairRequest }) {
  if (!request.rating) return null;
  return (
    <Section title="امتیاز مشتری">
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <RatingStars value={request.rating} />
          <Typography variant="body2" fontWeight={700}>
            {LABELS[request.rating]}
          </Typography>
        </Stack>
        {request.review ? (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
            {request.review}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            بدون نظر متنی
          </Typography>
        )}
      </Stack>
    </Section>
  );
}
