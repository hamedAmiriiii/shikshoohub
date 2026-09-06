/** ES5 only — must run on IE11 / old Chrome to show the upgrade message. */
export const LEGACY_BROWSER_BOOTSTRAP = `(function () {
  try {
    new Function("function f(a=1){return a} var o={}; o&&o.x; var x=0; x=x||1;");
  } catch (err) {
    document.documentElement.innerHTML =
      '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>به‌روزرسانی مرورگر</title></head>' +
      '<body style="margin:0;font-family:Tahoma,Arial,sans-serif;background:#111;color:#eee;direction:rtl;text-align:center;padding:32px 16px;line-height:1.8">' +
      '<div style="max-width:520px;margin:40px auto;background:#1c1c1c;border:1px solid #333;border-radius:12px;padding:24px">' +
      "<h1 style=\\"font-size:20px;margin:0 0 12px\\">این مرورگر پشتیبانی نمی‌شود</h1>" +
      "<p style=\\"font-size:14px;color:#bbb;margin:0 0 16px\\">ویندوز ۷ باید با آخرین کروم مخصوص ویندوز ۷ باز شود. اینترنت اکسپلورر و مرورگرهای خیلی قدیمی کار نمی‌کنند.</p>" +
      "<p style=\\"font-size:13px;color:#9ad27a;margin:0\\">Chrome 109 برای ویندوز ۷ نصب کنید، بعد یک‌بار کش مرورگر را پاک کنید.</p>" +
      "</div></body>";
    return;
  }

  function recover() {
    try {
      if (sessionStorage.getItem("webino_chunk_reload")) return;
      sessionStorage.setItem("webino_chunk_reload", "1");
    } catch (e1) {}
    function reload() {
      window.location.reload();
    }
    if (!navigator.serviceWorker) {
      reload();
      return;
    }
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      var jobs = [];
      for (var i = 0; i < regs.length; i++) jobs.push(regs[i].unregister());
      return Promise.all(jobs);
    }).then(function () {
      if (!window.caches) {
        reload();
        return;
      }
      return caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }).then(reload, reload);
    }).catch(reload);
  }

  function isChunkError(msg) {
    msg = String(msg || "");
    return msg.indexOf("ChunkLoadError") !== -1 || msg.indexOf("Loading chunk") !== -1;
  }

  window.addEventListener("error", function (e) {
    if (isChunkError(e && e.message)) recover();
  });
  window.addEventListener("unhandledrejection", function (e) {
    var reason = e && e.reason;
    var msg = reason && reason.message ? reason.message : reason;
    if (isChunkError(msg)) recover();
  });
})();`;
