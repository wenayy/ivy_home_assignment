import { NextResponse } from "next/server";

const BASE_URL = process.env.IVY_BASE_URL || "https://solve.ivy.homes";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function clientIp(request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || "";
}

async function verifyTurnstile(request) {
  const token = request.headers.get("x-turnstile-token");
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured.");
    return { ok: false, status: 503, detail: "Security verification is unavailable." };
  }
  if (!token || token.length > 2048) {
    return { ok: false, status: 400, detail: "Please complete the security verification." };
  }

  const payload = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: crypto.randomUUID(),
  });
  const remoteIp = clientIp(request);
  if (remoteIp) payload.set("remoteip", remoteIp);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(`Turnstile Siteverify returned HTTP ${response.status}.`);
      return { ok: false, status: 503, detail: "Security verification is temporarily unavailable." };
    }

    const result = await response.json();
    const requestHostname = request.headers.get("host")?.split(":")[0];
    const actionMatches = result.action === "login";
    const hostnameMatches = !result.hostname || !requestHostname || result.hostname === requestHostname;

    if (!result.success || !actionMatches || !hostnameMatches) {
      console.warn("Turnstile rejected a login attempt.", {
        errors: result["error-codes"],
        actionMatches,
        hostnameMatches,
      });
      return { ok: false, status: 403, detail: "Security verification failed. Please try again." };
    }
    return { ok: true };
  } catch (error) {
    console.error("Turnstile verification request failed.", error);
    return { ok: false, status: 503, detail: "Security verification is temporarily unavailable." };
  }
}

async function proxy(request, context) {
  const { path } = await context.params;
  if (request.method === "POST" && path.join("/") === "auth/login") {
    const verification = await verifyTurnstile(request);
    if (!verification.ok) {
      return NextResponse.json({ detail: verification.detail }, { status: verification.status });
    }
  }
  const incomingUrl = new URL(request.url);
  const target = new URL(`${BASE_URL}/${path.join("/")}`);
  target.search = incomingUrl.search;
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
  const response = await fetch(target, {
    method: request.method,
    headers: {
      "X-API-Key": process.env.IVY_API_KEY,
      ...(request.headers.get("authorization") ? { Authorization: request.headers.get("authorization") } : {}),
      ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type") } : {}),
    },
    body,
    cache: "no-store",
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
