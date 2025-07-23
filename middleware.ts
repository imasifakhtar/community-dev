import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/feed")) {
    const token = req.cookies.get("token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/feed(:/.*)?"],
}; 