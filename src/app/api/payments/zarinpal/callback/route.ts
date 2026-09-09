const API_ORIGIN = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir").replace(/\/$/, "");

function redirectToApi(request: Request) {
  const incoming = new URL(request.url);
  const target = new URL(`${API_ORIGIN}/api/payments/zarinpal/callback`);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return Response.redirect(target.toString(), 302);
}

export function GET(request: Request) {
  return redirectToApi(request);
}

export function POST(request: Request) {
  return redirectToApi(request);
}
