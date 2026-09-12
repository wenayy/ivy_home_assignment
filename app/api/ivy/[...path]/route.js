import { NextResponse } from "next/server";

const BASE_URL = process.env.IVY_BASE_URL || "https://solve.ivy.homes";

async function proxy(request, context) {
  const { path } = await context.params;
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

