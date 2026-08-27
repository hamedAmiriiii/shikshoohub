"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Handshake, Phone } from "lucide-react";
import {
  IRAN_MOBILE_PATTERN,
  fetchAgencyFormOptions,
  fetchCitiesByState,
  getAgencyErrorMessage,
  isApiFailure,
  submitAgencyRequest,
  toIranMobile,
  type GeoItem,
  type SelectOption,
} from "@/app/lib/agencyRequests";

const SUPPORT_PHONE = "09399166196";
const SUPPORT_TEL = "tel:09399166196";

type FormState = {
  first_name: string;
  last_name: string;
  state_id: string;
  city_id: string;
  phone: string;
  education: string;
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  state_id: "",
  city_id: "",
  phone: "",
  education: "",
};

const BENEFITS = [
  "پورسانت فروش و تمدید اشتراک مشتریان معرفی‌شده",
  "آموزش کامل نرم‌افزار و پشتیبانی اختصاصی نمایندگان",
  "پنل معرفی برای پیگیری مشتریان و درآمد شما",
];

const fieldClass =
  "w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-500/60 focus:bg-white/[0.06] disabled:opacity-50";

// گزینه‌های select در مرورگر رنگ پس‌زمینهٔ عنصر والد را به ارث نمی‌برند
const optionClass = "bg-[#141a29] text-slate-100";

export default function AgencyRequestClient() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [states, setStates] = useState<GeoItem[]>([]);
  const [educations, setEducations] = useState<SelectOption[]>([]);
  const [cities, setCities] = useState<GeoItem[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    setOptionsError("");
    const res = await fetchAgencyFormOptions();
    if (isApiFailure(res)) {
      setOptionsError(getAgencyErrorMessage(res, "دریافت اطلاعات فرم با خطا مواجه شد."));
    } else {
      setStates(res.states);
      setEducations(res.educations);
    }
    setOptionsLoading(false);
  }, []);

  useEffect(() => {
    loadOptions();
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
    setForm((prev) => {
      if (field === "state_id") {
        return { ...prev, state_id: value, city_id: "" };
      }
      return { ...prev, [field]: value };
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.first_name.trim()) next.first_name = "نام را وارد کنید";
    if (!form.last_name.trim()) next.last_name = "نام خانوادگی را وارد کنید";
    if (!form.state_id) next.state_id = "استان را انتخاب کنید";
    if (!form.city_id) next.city_id = "شهر را انتخاب کنید";
    if (!form.education) next.education = "مدرک تحصیلی را انتخاب کنید";

    const phone = toIranMobile(form.phone);
    if (!phone) {
      next.phone = "شماره موبایل را وارد کنید";
    } else if (!IRAN_MOBILE_PATTERN.test(phone)) {
      next.phone = "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    const res = await submitAgencyRequest({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      state_id: Number(form.state_id),
      city_id: Number(form.city_id),
      phone: toIranMobile(form.phone),
      education: form.education,
    });

    if (isApiFailure(res)) {
      if (res.errors && typeof res.errors === "object") {
        const fieldErrors: Partial<Record<keyof FormState, string>> = {};
        (Object.keys(EMPTY_FORM) as (keyof FormState)[]).forEach((field) => {
          const message = res.errors?.[field]?.[0];
          if (message) fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
      }
      setSubmitError(getAgencyErrorMessage(res, "ثبت درخواست انجام نشد. دوباره تلاش کنید."));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  const cityPlaceholder = useMemo(() => {
    if (!form.state_id) return "ابتدا استان را انتخاب کنید";
    if (citiesLoading) return "در حال دریافت شهرها…";
    if (cities.length === 0) return "شهری یافت نشد";
    return "انتخاب شهر";
  }, [cities.length, citiesLoading, form.state_id]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0b0f1a] text-slate-100 antialiased">
      <header className="sticky top-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/landing"
            className="font-bold text-xl bg-gradient-to-l from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent"
          >
            وبینو
          </Link>
          <Link
            href="/landing"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition"
          >
            بازگشت به صفحه اصلی
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.18),_transparent_55%)]" />

        <div className="relative max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-medium mb-4">
              <Handshake size={14} /> همکاری با وبینو
            </span>
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-to-l from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                درخواست نمایندگی
              </span>
            </h1>
            <p className="mt-3 text-slate-400 text-sm md:text-base leading-relaxed">
              فرم زیر را تکمیل کنید. کارشناسان ما درخواست شما را بررسی و در اولین فرصت با شما تماس
              می‌گیرند.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-8 text-center">
              <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={48} />
              <h2 className="text-xl font-bold text-white">درخواست شما ثبت شد</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              
               همکاران ما برای ادامهٔ مراحل با شما تماس می‌گیرند.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/landing"
                  className="px-6 py-3 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  بازگشت به صفحه اصلی
                </Link>
                <a
                  href={SUPPORT_TEL}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200 hover:border-cyan-500/50 transition"
                >
                  <Phone size={16} className="text-cyan-400" />
                  <span dir="ltr">{SUPPORT_PHONE}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              {optionsError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-300 mb-4">{optionsError}</p>
                  <button
                    type="button"
                    onClick={loadOptions}
                    className="px-6 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm text-slate-200 hover:bg-white/10 transition"
                  >
                    تلاش دوباره
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="نام" error={errors.first_name}>
                      <input
                        type="text"
                        value={form.first_name}
                        onChange={(e) => setField("first_name", e.target.value)}
                        placeholder=""
                        className={fieldClass}
                        disabled={optionsLoading}
                      />
                    </Field>

                    <Field label="نام خانوادگی" error={errors.last_name}>
                      <input
                        type="text"
                        value={form.last_name}
                        onChange={(e) => setField("last_name", e.target.value)}
                        placeholder=""
                        className={fieldClass}
                        disabled={optionsLoading}
                      />
                    </Field>

                    <Field label="استان" error={errors.state_id}>
                      <select
                        value={form.state_id}
                        onChange={(e) => setField("state_id", e.target.value)}
                        className={fieldClass}
                        disabled={optionsLoading}
                      >
                        <option value="" className={optionClass}>
                          {optionsLoading ? "در حال دریافت استان‌ها…" : "انتخاب استان"}
                        </option>
                        {states.map((state) => (
                          <option key={state.id} value={state.id} className={optionClass}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="شهر" error={errors.city_id}>
                      <select
                        value={form.city_id}
                        onChange={(e) => setField("city_id", e.target.value)}
                        className={fieldClass}
                        disabled={optionsLoading || citiesLoading || cities.length === 0}
                      >
                        <option value="" className={optionClass}>
                          {cityPlaceholder}
                        </option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id} className={optionClass}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="شماره موبایل" error={errors.phone}>
                      <input
                        type="tel"
                        inputMode="numeric"
                        dir="ltr"
                        value={form.phone}
                        onChange={(e) => setField("phone", toIranMobile(e.target.value).slice(0, 11))}
                        placeholder="09xxxxxxxxx"
                        className={`${fieldClass} text-left`}
                        disabled={optionsLoading}
                      />
                    </Field>

                    <Field label="مدرک تحصیلی" error={errors.education}>
                      <select
                        value={form.education}
                        onChange={(e) => setField("education", e.target.value)}
                        className={fieldClass}
                        disabled={optionsLoading || educations.length === 0}
                      >
                        <option value="" className={optionClass}>
                          {optionsLoading ? "در حال دریافت…" : "انتخاب مدرک تحصیلی"}
                        </option>
                        {educations.map((education) => (
                          <option key={education.value} value={education.value} className={optionClass}>
                            {education.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {submitError && (
                    <p className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-200">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || optionsLoading}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-l from-violet-600 via-fuchsia-600 to-pink-600 text-white font-semibold hover:opacity-90 transition shadow-xl shadow-fuchsia-900/40 disabled:opacity-60"
                  >
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    {submitting ? "در حال ثبت…" : "ثبت درخواست نمایندگی"}
                  </button>

                  <p className="text-xs text-slate-500 text-center leading-relaxed">
                    اطلاعات شما فقط برای بررسی درخواست نمایندگی استفاده می‌شود.
                  </p>
                </form>
              )}
            </div>
          )}

          <div className="mt-8 grid gap-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
              >
                <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-[#070a12] border-t border-white/5 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} وبینو — تمامی حقوق محفوظ است
      </footer>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-300 mb-2">{label}</span>
      {children}
      {error && <span className="block text-xs text-rose-400 mt-1.5">{error}</span>}
    </label>
  );
}
