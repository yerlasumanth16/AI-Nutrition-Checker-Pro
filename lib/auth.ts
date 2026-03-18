import { adminAuth } from "./firebase-admin";

export async function verifyToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { userId: decodedToken.uid, email: decodedToken.email };
  } catch (e) {
    console.error("Token verification failed:", e);
    return null;
  }
}
