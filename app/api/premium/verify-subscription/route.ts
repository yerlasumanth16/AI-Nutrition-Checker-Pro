import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { verifyToken } from "../../../../lib/auth";
import crypto from "crypto";

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

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await req.json();

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Update user status in Firestore
    const userRef = adminDb.collection("users").doc(decoded.userId);
    await userRef.update({
      subscriptionType: "premium",
      subscriptionId: razorpay_subscription_id,
      subscriptionStatus: "active",
      subscriptionStart: new Date().toISOString(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Record payment in Firestore
    await adminDb.collection("payments").add({
      userId: decoded.userId,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_subscription_id,
      razorpaySignature: razorpay_signature,
      amount: 15,
      currency: "INR",
      status: "captured",
      planType: "Premium Nutrition Pro",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify subscription error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
