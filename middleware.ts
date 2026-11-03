import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/login") || path.startsWith("/api/auth")) return NextResponse.next();
  const token = req.cookies.get("fps_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) throw new Error("Missing secret");
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("fps_session");
    return response;
  }
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
