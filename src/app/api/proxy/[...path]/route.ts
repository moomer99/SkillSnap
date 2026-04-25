// Proxy all Supabase requests through Next.js to bypass browser CORS/network restrictions
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const supabasePath = path.join("/");
  const search = req.nextUrl.search;
  const targetUrl = `${SUPABASE_URL}/${supabasePath}${search}`;

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
    apikey: SUPABASE_KEY,
  };

  const authHeader = req.headers.get("authorization");
  if (authHeader) headers["Authorization"] = authHeader;
  else headers["Authorization"] = `Bearer ${SUPABASE_KEY}`;

  const prefer = req.headers.get("prefer");
  if (prefer) headers["Prefer"] = prefer;

  const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  const responseHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) responseHeaders.set("content-type", ct);

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
