import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const { payload } = event;

    switch (event.event) {
      case "subscription.charged":
        const subscription = payload.subscription.entity;
        const payment = payload.payment.entity;
        const userId = subscription.notes.userId;

        if (userId) {
          const userRef = adminDb.collection("users").doc(userId);
          await userRef.update({
            subscriptionType: "premium",
            subscriptionStatus: "active",
            subscriptionEnd: new Date(subscription.current_end * 1000).toISOString(),
          });

          await adminDb.collection("payments").add({
            userId: userId,
            razorpayPaymentId: payment.id,
            razorpayOrderId: subscription.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: "captured",
            planType: "Premium Nutrition Pro",
            createdAt: new Date().toISOString(),
          });
        }
        break;

      case "subscription.cancelled":
      case "subscription.expired":
        const cancelledSubscription = payload.subscription.entity;
        const cancelledUserId = cancelledSubscription.notes.userId;

        if (cancelledUserId) {
          const userRef = adminDb.collection("users").doc(cancelledUserId);
          await userRef.update({
            subscriptionType: "free",
            subscriptionStatus: event.event === "subscription.cancelled" ? "cancelled" : "expired",
          });
        }
        break;

      default:
        console.log("Unhandled webhook event:", event.event);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
