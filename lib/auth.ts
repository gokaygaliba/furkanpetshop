import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = () => {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET en az 32 karakter olmalı.");
  return new TextEncoder().encode(value);
};

export async function createSession(email: string) {
  return new SignJWT({ email }).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("7d").sign(secret());
}

export async function isAuthenticated() {
  const store = await cookies();
  const token = store.get("fps_session")?.value;
  if (!token) return false;
  try { await jwtVerify(token, secret()); return true; } catch { return false; }
}

export async function requireApiAuth() {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  return null;
}
