import { NextRequest, NextResponse } from "next/server";

const SEP_API_CALLBACK =
  process.env.SEP_API_CALLBACK_URL ||
  "https://api.webinoo-plus.ir/api/payments/sep/callback";

function collectParams(
  source: URLSearchParams | FormData,
): Record<string, string> {
  const out: Record<string, string> = {};
  source.forEach((value, key) => {
    if (typeof value === "string" && value !== "") out[key] = value;
  });
  
  return out;
}

function isSepCallback(data: Record<string, string>): boolean {
  return Boolean(
    data.RefNum ||
      data.refNum ||
      data.State ||
      data.state ||
      data.ResNum ||
      data.resNum ||
      data.StateCode ||
      data.stateCode,
  );
}

function forwardHtml(action: string, data: Record<string, string>): string {
  const inputs = Object.entries(data)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"/><title>بازگشت از سامان</title></head>
<body>
  <p style="font-family:Tahoma;text-align:center;margin-top:40px">در حال بازگشت از درگاه سامان...</p>
  <form id="f" method="post" action="${escapeHtml(action)}">${inputs}</form>
  <script>document.getElementById("f").submit();</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const data = {
    ...collectParams(req.nextUrl.searchParams),
    ...collectParams(form),
  };

  if (!isSepCallback(data)) {
    return new NextResponse("درخواست نامعتبر", { status: 400 });
  }

  return new NextResponse(forwardHtml(SEP_API_CALLBACK, data), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const data = collectParams(req.nextUrl.searchParams);
  if (isSepCallback(data)) {
    const url = new URL(SEP_API_CALLBACK);
    Object.entries(data).forEach(([key, value]) => url.searchParams.set(key, value));
    return NextResponse.redirect(url.toString(), 302);
  }

  return new NextResponse(
    `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><title>پرداخت</title></head>
<body><p style="font-family:Tahoma;text-align:center;margin-top:40px">صفحه بازگشت درگاه سامان</p></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
