import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { verifyToken } from "../../../../lib/auth";
import { razorpay } from "../../../../lib/razorpay";

export async function POST(req: Request) {
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

    const userRef = adminDb.collection("users").doc(decoded.userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (!userDoc.exists || !userData?.subscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Cancel in Razorpay
    await razorpay.subscriptions.cancel(userData.subscriptionId, false); // false means cancel at end of cycle

    // Update DB
    await userRef.update({
      subscriptionStatus: "cancelled",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
