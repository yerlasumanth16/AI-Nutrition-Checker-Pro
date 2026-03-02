import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_COOKIE = "csrf-token";

export async function issueCsrfToken() {
  const token = crypto.randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(CSRF_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  return token;
}

export async function validateCsrfToken(clientToken: string | null) {
  const store = await cookies();
  const serverToken = store.get(CSRF_COOKIE)?.value;
  return !!clientToken && !!serverToken && clientToken === serverToken;
}
