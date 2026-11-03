import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Sunucu yönetici bilgileri yapılandırılmamış." }, { status: 500 });
  }
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "E-posta veya parola hatalı." }, { status: 401 });
  }
  const token = await createSession(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("fps_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
