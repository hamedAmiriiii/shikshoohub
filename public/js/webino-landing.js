(function () {
  var CONFIG = window.WEBINO_LANDING_CONFIG || {
    registerUrl: "/admin/register-shop",
    loginUrl: "/admin/login",
  };

  var PRODUCTS = [
    {
      id: "accounting",
      href: "/landing/shop",
      loginUrl: "/admin/login",
      icon: "📊",
      title: "حسابداری و فروش",
      tag: "پرفروش",
      desc: "صندوق فروش، فاکتور، انبار، کارتخوان، اقساط و گزارش سود — همه در یک پنل.",
      features: ["ثبت فروش و بارکد", "انبار و موجودی", "گزارش سود و زیان", "اقساط و نسیه"],
    },
    {
      id: "club",
      href: "/landing/products/club",
      loginUrl: "/admin/login",
      icon: "🎁",
      title: "باشگاه مشتریان",
      tag: "",
      desc: "امتیاز، اعتبار و پیامک وفاداری تا مشتری دوباره به کسب‌وکارت برگردد.",
      features: ["امتیاز و اعتبار", "پیامک هدفمند", "سطح مشتری", "تخفیف وفاداری"],
    },
    {
      id: "gold",
      href: "/landing/products/gold",
      loginUrl: "/admin/login",
      icon: "🥇",
      title: "خرید و فروش طلا",
      tag: "",
      desc: "وزن، عیار و نرخ روز. موجودی طلا و سود هر معامله برای طلافروشی.",
      features: ["نرخ روز", "وزن و عیار", "موجودی طلا", "سود معامله"],
    },
    {
      id: "booking",
      href: "/landing/products/booking",
      loginUrl: "/oil/login",
      icon: "📆",
      title: "نوبت‌دهی",
      tag: "",
      desc: "رزرو نوبت آنلاین، تقویم خدمات و پیامک یادآوری برای مشتری و پرسنل.",
      features: ["تقویم نوبت", "پیامک یادآوری", "خدمات و پرسنل", "نوبت مشتری"],
    },
    {
      id: "class",
      href: "/landing/products/class",
      loginUrl: "/admin/login",
      icon: "🎓",
      title: "کلاس آنلاین و اتاق جلسه",
      tag: "",
      desc: "کلاس زنده و اتاق جلسه با لینک ورود — بدون نصب نرم‌افزار سنگین.",
      features: ["اتاق جلسه", "کلاس زنده", "لینک دعوت", "ورود از مرورگر"],
    },
    {
      id: "social",
      href: "/landing/products/social",
      loginUrl: "/admin/login",
      icon: "💬",
      title: "شبکه اجتماعی",
      tag: "",
      desc: "فضای اجتماعی کسب‌وکار: پست، فید و ارتباط با مخاطبان.",
      features: ["پست و فید", "تعامل مخاطب", "پروفایل کسب‌وکار", "اعلان"],
    },
    {
      id: "shop",
      href: "/landing/products/store",
      loginUrl: "/admin/login",
      icon: "🛒",
      title: "فروشگاه آنلاین",
      tag: "",
      desc: "ویترین اینترنتی با همان موجودی پنل. مشتری سفارش می‌دهد، شما پیگیری می‌کنید.",
      features: ["ویترین کالا", "سبد خرید", "سفارش اینترنتی", "پرداخت"],
    },
  ];

  var FEATURES = [
    "📱 نصب روی ویندوز و موبایل (PWA)",
    "🧩 چند محصول در یک اکوسیستم",
    "💳 اتصال به کارتخوان",
    "💬 ارسال پیامک",
    "🎁 باشگاه مشتریان",
    "🥇 خرید و فروش طلا",
    "📆 نوبت‌دهی آنلاین",
    "🎓 کلاس و اتاق جلسه",
    "🛒 فروشگاه اینترنتی",
    "📊 گزارش و داشبورد",
    "📄 چاپ فاکتور و لیبل",
    "🔒 داده هر کسب‌وکار جدا و امن",
  ];

  var SLIDES = [
    {
      title: "حسابداری و فروش",
      desc: "ثبت سریع فاکتور",
      html:
        '<div style="padding:.75rem"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px"><span>فروش امروز</span><b style="color:#059669">۱۲,۴۵۰,۰۰۰</b></div><div style="height:80px;border:1px solid #f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:12px">سبد فروش + بارکدخوان</div></div>',
    },
    {
      title: "باشگاه مشتریان",
      desc: "امتیاز و وفاداری",
      html:
        '<div style="padding:.75rem;font-size:12px;color:#64748b"><p>امتیاز مشتری طلایی</p><div style="height:8px;background:#f1f5f9;border-radius:4px;margin:8px 0"><div style="width:78%;height:100%;background:#7c3aed;border-radius:4px"></div></div><p>۱۲٬۴۰۰ امتیاز — سطح طلایی</p></div>',
    },
    {
      title: "خرید و فروش طلا",
      desc: "نرخ و وزن",
      html:
        '<div style="padding:.75rem"><div class="wl-row"><span>نرخ ۱۸ عیار</span><span>۴٬۱۲۰٬۰۰۰</span></div><div class="wl-row"><span>فروش ۱۲ گرم</span><span>سود ۸۲۰٬۰۰۰</span></div><div class="wl-row"><span>موجودی صندوق</span><span>۲۴۸ گرم</span></div></div>',
    },
    {
      title: "نوبت‌دهی",
      desc: "تقویم امروز",
      html:
        '<div style="padding:.75rem;font-size:12px"><div class="wl-row"><span>۱۰:۰۰ اصلاح</span><span>رزرو شد</span></div><div class="wl-row"><span>۱۱:۳۰ رنگ</span><span>رزرو شد</span></div><div class="wl-row"><span>۱۶:۰۰ کوتاهی</span><span>آزاد</span></div></div>',
    },
    {
      title: "کلاس و جلسه",
      desc: "اتاق زنده",
      html:
        '<div style="padding:1rem;text-align:center"><div style="height:72px;border-radius:8px;background:linear-gradient(135deg,#ecfdf5,#e0e7ff);display:flex;align-items:center;justify-content:center;color:#475569;font-size:12px">اتاق جلسه — ۱۲ نفر آنلاین</div><div style="margin-top:8px;font-size:12px;color:#64748b">لینک ورود آماده است</div></div>',
    },
    {
      title: "شبکه اجتماعی",
      desc: "فید کسب‌وکار",
      html:
        '<div style="padding:.75rem;font-size:12px;color:#64748b"><div style="border:1px solid #f1f5f9;border-radius:8px;padding:.6rem;margin-bottom:.5rem"><b style="color:#0f172a">پست جدید</b><div>تخفیف باشگاه مشتریان تا جمعه</div></div><div>۲۴ پسند — ۸ نظر</div></div>',
    },
    {
      title: "فروشگاه آنلاین",
      desc: "ویترین کالا",
      html:
        '<div style="padding:.75rem"><div class="wl-row"><span>پیراهن</span><span>۱۲</span></div><div class="wl-row"><span>کفش</span><span>۵</span></div><div class="wl-row"><span>کیف</span><span>۸</span></div></div>',
    },
  ];

  var FAQS = [
    {
      q: "وبینو چند محصول دارد؟",
      a: "هفت محصول: حسابداری و فروش، باشگاه مشتریان، خرید و فروش طلا، نوبت‌دهی، کلاس آنلاین و اتاق جلسه، شبکه اجتماعی و فروشگاه آنلاین. هر کدام صفحه و ورود جدا دارد.",
    },
    {
      q: "آیا روی موبایل نصب می‌شود؟",
      a: "بله. PWA است و روی اندروید، iOS و ویندوز قابل نصب است.",
    },
    {
      q: "آیا نیاز به نصب ویندوز دارد؟",
      a: "خیر. فقط مرورگر کافی است.",
    },
    {
      q: "کدام محصول را انتخاب کنم؟",
      a: "اگر فروشگاه دارید از حسابداری و فروش شروع کنید. طلافروشی، نوبت‌دهی، آموزش آنلاین و فروش اینترنتی هم محصول جدا دارند. در ثبت‌نام راهنمایی می‌شوید.",
    },
    {
      q: "آیا نسخه آزمایشی رایگان دارد؟",
      a: "یک هفته رایگان + ۲۰ پیامک هدیه.",
    },
    {
      q: "آیا اطلاعات کسب‌وکار امن است؟",
      a: "هر کسب‌وکار فقط به داده خودش دسترسی دارد.",
    },
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

  function renderHeroApps() {
    var mosaic = document.getElementById("hero-apps");
    if (!mosaic) return;
    PRODUCTS.forEach(function (p) {
      var a = document.createElement("a");
      a.href = p.href || ("#" + p.id);
      a.className = "wl-app-tile";
      a.innerHTML = '<div class="ico">' + p.icon + '</div><div class="name">' + p.title + "</div>";
      mosaic.appendChild(a);
    });
  }

  function renderProducts() {
    var grid = document.getElementById("products-grid");
    if (!grid) return;
    PRODUCTS.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "wl-product";
      card.id = p.id;
      var feats = p.features
        .map(function (f) {
          return "<li>" + f + "</li>";
        })
        .join("");
      card.innerHTML =
        '<div class="wl-product-top">' +
        '<div class="wl-product-icon">' +
        p.icon +
        "</div>" +
        (p.tag ? '<span class="wl-product-tag">' + p.tag + "</span>" : "") +
        "</div>" +
        "<h3>" +
        p.title +
        "</h3>" +
        "<p>" +
        p.desc +
        "</p>" +
        '<ul class="wl-product-feats">' +
        feats +
        "</ul>" +
        '<div class="wl-product-links">' +
        '<a class="wl-product-cta" href="' +
        (p.href || "#" + p.id) +
        '">صفحه محصول</a>' +
        '<a class="wl-product-login" href="' +
        (p.loginUrl || CONFIG.loginUrl) +
        '">ورود</a>' +
        "</div>";
      grid.appendChild(card);
    });
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

    renderHeroApps();
    renderProducts();

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
      if (nextBtn)
        nextBtn.addEventListener("click", function () {
          slideIndex = (slideIndex + 1) % SLIDES.length;
          renderSlide();
        });
      if (prevBtn)
        prevBtn.addEventListener("click", function () {
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
