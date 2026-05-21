(function () {
  var CONFIG = window.WEBINO_LANDING_CONFIG || {
    registerUrl: "/admin/register-shop",
    loginUrl: "/admin/login",
  };

  var FEATURES = [
    "📱 نصب روی ویندوز و موبایل (PWA)",
    "💳 اتصال به کارتخوان",
    "🖨 چاپ لیبل کالا",
    "👥 مدیریت مشتریان",
    "💬 ارسال پیامک",
    "🎁 باشگاه مشتریان",
    "🧾 مدیریت هزینه‌ها",
    "📊 گزارش فروش",
    "📋 انبارگردانی",
    "📄 چاپ فاکتور",
    "📆 فروش اقساطی",
    "📌 داشبورد مدیریتی",
  ];

  var SLIDES = [
    { title: "صفحه فروش", desc: "ثبت سریع فاکتور", html: '<div style="padding:.75rem"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px"><span>فروش امروز</span><b style="color:#059669">۱۲,۴۵۰,۰۰۰</b></div><div style="height:80px;border:1px solid #f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:12px">سبد فروش + بارکدخوان</div></div>' },
    { title: "صفحه انبار", desc: "لیست کالا", html: '<div style="padding:.75rem"><div class="wl-row"><span>پیراهن</span><span>12</span></div><div class="wl-row"><span>کفش</span><span>5</span></div><div class="wl-row"><span>کیف</span><span>8</span></div></div>' },
    { title: "گزارش سود", desc: "نمودار روزانه", html: '<div class="wl-bars"><div style="height:40%"></div><div style="height:65%"></div><div style="height:45%"></div><div style="height:80%"></div><div style="height:55%"></div><div style="height:90%"></div><div style="height:70%"></div></div>' },
    { title: "مشتریان", desc: "اقساط", html: '<div style="padding:.75rem;font-size:12px;color:#64748b"><p>اعتبار اقساطی</p><div style="height:8px;background:#f1f5f9;border-radius:4px;margin:8px 0"><div style="width:66%;height:100%;background:#10b981;border-radius:4px"></div></div><p>۳ مشتری — ۲ قسط معوق</p></div>' },
    { title: "چاپ لیبل", desc: "بارکد", html: '<div style="padding:1rem;text-align:center"><div style="height:32px;background:#1e293b;border-radius:4px;margin-bottom:8px"></div><div style="font-size:10px;font-family:monospace;color:#64748b">||| 1507 |||</div><div style="font-weight:700;margin-top:4px">۲۹۱,۰۰۰ تومان</div></div>' },
  ];

  var FAQS = [
    { q: "آیا روی موبایل نصب می‌شود؟", a: "بله. PWA است و روی اندروید، iOS و ویندوز قابل نصب است." },
    { q: "آیا نیاز به نصب ویندوز دارد؟", a: "خیر. فقط مرورگر کافی است." },
    { q: "آیا به کارتخوان متصل می‌شود؟", a: "بله. ثبت فروش با کارتخوان و تفکیک نقد/کارت." },
    { q: "آیا امکان فروش اقساطی دارد؟", a: "بله. فروش و مدیریت اقساط پشتیبانی می‌شود." },
    { q: "آیا نسخه آزمایشی رایگان دارد؟", a: "۳۰ روز رایگان + ۲۰ پیامک هدیه." },
    { q: "آیا اطلاعات فروشگاه امن است؟", a: "هر فروشگاه فقط به داده خود دسترسی دارد." },
  ];

  function applyLinks() {
    document.querySelectorAll("[data-register]").forEach(function (el) {
      el.href = CONFIG.registerUrl;
    });
    document.querySelectorAll("[data-login]").forEach(function (el) {
      el.href = CONFIG.loginUrl;
    });
  }

  function startFree() {
    var phone = document.getElementById("input-phone");
    var shop = document.getElementById("input-shop");
    try {
      if (phone && phone.value.trim()) sessionStorage.setItem("landing_register_phone", phone.value.trim());
      if (shop && shop.value.trim()) sessionStorage.setItem("landing_register_shop", shop.value.trim());
    } catch (e) {}
    window.location.href = CONFIG.registerUrl;
  }

  var slideIndex = 0;
  function renderSlide() {
    var s = SLIDES[slideIndex];
    var titleEl = document.getElementById("slide-title");
    var descEl = document.getElementById("slide-desc");
    var contentEl = document.getElementById("slide-content");
    if (!titleEl) return;
    titleEl.textContent = s.title;
    descEl.textContent = s.desc;
    contentEl.innerHTML = s.html;
    document.querySelectorAll(".wl-dot").forEach(function (d, i) {
      d.classList.toggle("active", i === slideIndex);
    });
  }

  function init() {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    document.querySelectorAll(".btn-start-free").forEach(function (b) {
      b.addEventListener("click", startFree);
    });

    var menuBtn = document.getElementById("menu-btn");
    var mobileNav = document.getElementById("mobile-nav");
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener("click", function () {
        mobileNav.classList.toggle("open");
      });
    }

    var phoneInput = document.getElementById("input-phone");
    if (phoneInput) {
      phoneInput.addEventListener("input", function (e) {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
      });
    }

    var grid = document.getElementById("features-grid");
    if (grid) {
      FEATURES.forEach(function (t) {
        var d = document.createElement("div");
        d.className = "wl-feature-item";
        d.textContent = t;
        grid.appendChild(d);
      });
    }

    var faqList = document.getElementById("faq-list");
    if (faqList) {
      FAQS.forEach(function (item, i) {
        var wrap = document.createElement("div");
        wrap.className = "wl-faq-item" + (i === 0 ? " open" : "");
        wrap.innerHTML =
          '<button type="button" class="wl-faq-q">' +
          item.q +
          '<span class="wl-faq-chevron">▼</span></button><p class="wl-faq-a">' +
          item.a +
          "</p>";
        wrap.querySelector(".wl-faq-q").addEventListener("click", function () {
          wrap.classList.toggle("open");
        });
        faqList.appendChild(wrap);
      });
    }

    var dots = document.getElementById("slide-dots");
    if (dots) {
      SLIDES.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "wl-dot" + (i === 0 ? " active" : "");
        b.addEventListener("click", function () {
          slideIndex = i;
          renderSlide();
        });
        dots.appendChild(b);
      });
      var nextBtn = document.getElementById("slide-next");
      var prevBtn = document.getElementById("slide-prev");
      if (nextBtn) nextBtn.addEventListener("click", function () {
        slideIndex = (slideIndex + 1) % SLIDES.length;
        renderSlide();
      });
      if (prevBtn) prevBtn.addEventListener("click", function () {
        slideIndex = (slideIndex - 1 + SLIDES.length) % SLIDES.length;
        renderSlide();
      });
      renderSlide();
    }

    applyLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
