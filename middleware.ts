import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' checkout.razorpay.com; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; connect-src 'self' https:;");

  if (req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/api/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (req.nextUrl.pathname.startsWith("/api/admin") && token.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
