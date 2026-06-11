import createMiddleware from "next-intl/middleware";
import { NextRequest, type NextResponse } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { generateNonce, securityHeaders } from "@/lib/csp";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const nonce = generateNonce();
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-csp-nonce", nonce);

  const res = intlMiddleware(new NextRequest(req, { headers: reqHeaders })) as NextResponse;

  for (const [k, v] of Object.entries(securityHeaders(nonce))) {
    res.headers.set(k, v);
  }
  res.headers.set("x-csp-nonce", nonce);
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
