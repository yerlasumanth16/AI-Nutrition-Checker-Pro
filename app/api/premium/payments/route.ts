import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { verifyToken } from "../../../../lib/auth";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const paymentsSnapshot = await adminDb
      .collection("payments")
      .where("userId", "==", decoded.userId)
      .orderBy("createdAt", "desc")
      .get();

    const payments = paymentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
