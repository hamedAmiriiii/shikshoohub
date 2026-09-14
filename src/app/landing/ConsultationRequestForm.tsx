"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  fetchCitiesByState,
  fetchConsultationFormOptions,
  getConsultationErrorMessage,
  IRAN_MOBILE_PATTERN,
  isApiFailure,
  submitConsultationRequest,
  toIranMobile,
  type GeoItem,
} from "@/app/lib/consultationRequests";
import { SUPPORT_PHONE, SUPPORT_TEL } from "./catalog";

const fieldClass =
  "w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-500/60 focus:bg-white/[0.06] disabled:opacity-50";
const optionClass = "bg-[#141a29] text-slate-100";

type FormState = {
  name: string;
  phone: string;
  state_id: string;
  city_id: string;
  business_name: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  state_id: "",
  city_id: "",
  business_name: "",
};

type Props = {
  source: string;
  title?: string;
  subtitle?: string;
  businessPlaceholder?: string;
  selectedPlan?: string | null;
  submitGradientClass?: string;
};

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.45, delay },
  };
}

export default function ConsultationRequestForm({
  source,
  title = "درخواست مشاوره و خرید",
  subtitle = "فرم را پر کنید تا همکاران وبینو با شما تماس بگیرند.",
  businessPlaceholder = "نام فروشگاه یا مجموعه",
  selectedPlan = null,
  submitGradientClass = "from-cyan-500 to-emerald-500",
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [states, setStates] = useState<GeoItem[]>([]);
  const [cities, setCities] = useState<GeoItem[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    const res = await fetchConsultationFormOptions();
    if (!isApiFailure(res)) setStates(res.states);
    setOptionsLoading(false);
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!form.state_id) {
      setCities([]);
      return;
    }
    let active = true;
    setCitiesLoading(true);
    fetchCitiesByState(Number(form.state_id)).then((list) => {
      if (!active) return;
      setCities(list);
      setCitiesLoading(false);
    });
    return () => {
      active = false;
    };
  }, [form.state_id]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) =>
      field === "state_id" ? { ...prev, state_id: value, city_id: "" } : { ...prev, [field]: value },
    );
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "نام را وارد کنید";
    if (!form.business_name.trim()) next.business_name = "نام مجموعه را وارد کنید";
    if (!form.state_id) next.state_id = "استان را انتخاب کنید";
    if (!form.city_id) next.city_id = "شهر را انتخاب کنید";
    const phone = toIranMobile(form.phone);
    if (!phone) next.phone = "شماره موبایل را وارد کنید";
    else if (!IRAN_MOBILE_PATTERN.test(phone)) next.phone = "شماره باید ۱۱ رقم و با ۰۹ شروع شود";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setSubmitError("");

    const businessName = selectedPlan
      ? `${form.business_name.trim()} (پکیج: ${selectedPlan})`
      : form.business_name.trim();

    const res = await submitConsultationRequest({
      name: form.name.trim(),
      phone: toIranMobile(form.phone),
      state_id: Number(form.state_id),
      city_id: Number(form.city_id),
      business_name: businessName,
      source,
    });
    if (isApiFailure(res)) {
      setSubmitError(getConsultationErrorMessage(res, "ثبت درخواست ناموفق بود."));
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <section id="consult" className="py-16 md:py-20">
      <div className="max-w-xl mx-auto px-4">
        <motion.div {...fadeUp()} className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h2>
          <p className="text-slate-400 text-sm leading-7">{subtitle}</p>
          {selectedPlan ? (
            <p className="mt-3 inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
              پکیج انتخابی: {selectedPlan}
            </p>
          ) : null}
        </motion.div>

        {submitted ? (
          <motion.div
            {...fadeUp()}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
          >
            <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={40} />
            <div className="font-bold text-white text-lg mb-2">درخواست ثبت شد</div>
            <p className="text-slate-300 text-sm leading-7">
              از انتخاب شما متشکریم. همکاران ما به‌زودی با شما تماس خواهند گرفت.
            </p>
          </motion.div>
        ) : (
          <motion.form
            {...fadeUp(0.05)}
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 space-y-4"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">نام</label>
              <input
                className={fieldClass}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder=" "
                disabled={submitting}
              />
              {errors.name ? <p className="text-rose-400 text-xs mt-1">{errors.name}</p> : null}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">شماره موبایل</label>
              <input
                className={fieldClass}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="09xxxxxxxxx"
                dir="ltr"
                disabled={submitting}
              />
              {errors.phone ? <p className="text-rose-400 text-xs mt-1">{errors.phone}</p> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">استان</label>
                <select
                  className={fieldClass}
                  value={form.state_id}
                  onChange={(e) => setField("state_id", e.target.value)}
                  disabled={submitting || optionsLoading}
                >
                  <option className={optionClass} value="">
                    انتخاب استان
                  </option>
                  {states.map((s) => (
                    <option className={optionClass} key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.state_id ? <p className="text-rose-400 text-xs mt-1">{errors.state_id}</p> : null}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">شهر</label>
                <select
                  className={fieldClass}
                  value={form.city_id}
                  onChange={(e) => setField("city_id", e.target.value)}
                  disabled={submitting || !form.state_id || citiesLoading}
                >
                  <option className={optionClass} value="">
                    {citiesLoading ? "در حال بارگذاری…" : "انتخاب شهر"}
                  </option>
                  {cities.map((c) => (
                    <option className={optionClass} key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.city_id ? <p className="text-rose-400 text-xs mt-1">{errors.city_id}</p> : null}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">نام مجموعه</label>
              <input
                className={fieldClass}
                value={form.business_name}
                onChange={(e) => setField("business_name", e.target.value)}
                placeholder={businessPlaceholder}
                disabled={submitting}
              />
              {errors.business_name ? (
                <p className="text-rose-400 text-xs mt-1">{errors.business_name}</p>
              ) : null}
            </div>

            {submitError ? <p className="text-rose-400 text-sm text-center">{submitError}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-l ${submitGradientClass} text-white font-bold hover:opacity-95 transition disabled:opacity-60 inline-flex items-center justify-center gap-2`}
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
              {submitting ? "در حال ثبت…" : "ثبت درخواست"}
            </button>

            <p className="text-center text-xs text-slate-500">
              پشتیبانی:{" "}
              <a href={SUPPORT_TEL} className="text-cyan-400" dir="ltr">
                {SUPPORT_PHONE}
              </a>
            </p>
          </motion.form>
        )}
      </div>
    </section>
  );
}
