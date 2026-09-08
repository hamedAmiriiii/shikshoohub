(function (root) {
  var DEFAULT_ORIGIN = "https://api.webinoplus.ir";

  function origin() {
    if (root.WEBINO_API_ORIGIN) return String(root.WEBINO_API_ORIGIN).replace(/\/$/, "");
    return DEFAULT_ORIGIN;
  }

  function join(apiBase, path) {
    var base = String(apiBase || "/api").replace(/\/$/, "");
    if (base.indexOf("http") !== 0) {
      base = origin() + (base.charAt(0) === "/" ? base : "/" + base);
    }
    return base + path;
  }

  function headers(token) {
    var h = { Accept: "application/json", "Content-Type": "application/json" };
    if (token) h.Authorization = "Bearer " + token;
    return h;
  }

  async function readJson(res) {
    var text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (_err) {
      return { message: text };
    }
  }

  function paymentUrl(data) {
    if (!data || typeof data !== "object") return "";
    return (
      data.payment_url ||
      data.url ||
      (data.data && (data.data.payment_url || data.data.url)) ||
      ""
    );
  }

  async function catalog(opts) {
    opts = opts || {};
    var res = await fetch(join(opts.apiBase, "/payments/catalog"), {
      headers: headers(opts.token),
    });
    var data = await readJson(res);
    if (!res.ok) throw new Error(data.message || data.error || "خطا در دریافت کاتالوگ");
    return data.data || data;
  }

  async function start(opts) {
    opts = opts || {};
    var returnUrl =
      opts.returnUrl ||
      opts.return_url ||
      (root.location ? root.location.href.split("#")[0] : "");
    var res = await fetch(join(opts.apiBase, "/payments/start"), {
      method: "POST",
      headers: headers(opts.token),
      body: JSON.stringify({
        type: opts.type,
        item_id: opts.itemId != null ? opts.itemId : opts.item_id,
        return_url: returnUrl,
      }),
    });
    var data = await readJson(res);
    if (!res.ok) throw new Error(data.message || data.error || "خطا در شروع پرداخت");
    var url = paymentUrl(data);
    if (!url) throw new Error("آدرس درگاه دریافت نشد");
    root.location.href = url;
    return data;
  }

  function readReturn() {
    if (!root.location) return null;
    var q = new URLSearchParams(root.location.search);
    var payment = q.get("payment");
    if (!payment) return null;
    return {
      ok: payment === "ok" || payment === "success",
      payment: payment,
      authority: q.get("Authority") || q.get("authority") || "",
      status: q.get("Status") || q.get("status") || "",
    };
  }

  root.AtelierZarinpal = { catalog: catalog, start: start, readReturn: readReturn };
})(typeof window !== "undefined" ? window : this);
