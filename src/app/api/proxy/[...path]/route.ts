// Proxy all Supabase requests through Next.js to bypass browser network restrictions
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const supabasePath = path.join("/");
  const search = req.nextUrl.search;
  const targetUrl = `${SUPABASE_URL}/${supabasePath}${search}`;

  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
  };

  // Forward content-type (critical for multipart file uploads)
  const ct = req.headers.get("content-type");
  if (ct) headers["Content-Type"] = ct;

  // Forward auth token so RLS policies work
  const authHeader = req.headers.get("authorization");
  headers["Authorization"] = authHeader ?? `Bearer ${SUPABASE_KEY}`;

  // Forward Supabase-specific headers
  const prefer = req.headers.get("prefer");
  if (prefer) headers["Prefer"] = prefer;
  const range = req.headers.get("range");
  if (range) headers["Range"] = range;
  const xUpsert = req.headers.get("x-upsert");
  if (xUpsert) headers["x-upsert"] = xUpsert;

  // Use arrayBuffer for body so binary file uploads aren't corrupted
  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: body as BodyInit | undefined,
  });

  const responseHeaders = new Headers();
  const responseCt = upstream.headers.get("content-type");
  if (responseCt) responseHeaders.set("content-type", responseCt);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) responseHeaders.set("content-range", contentRange);

  const responseBody = await upstream.arrayBuffer();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
