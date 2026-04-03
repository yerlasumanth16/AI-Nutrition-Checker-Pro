import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing signature or timestamp" }, { status: 400 });
    }

    // Verify Cashfree webhook signature
    const secret = process.env.CASHFREE_WEBHOOK_SECRET || "";
    const signedPayload = timestamp + body;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("base64");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const { data, type } = event;

    console.log("Cashfree webhook event:", type);

    switch (type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        const order = data.order;
        const payment = data.payment;
        const customerId = order.customer_details?.customer_id;

        if (customerId) {
          // Update user to premium
          const userRef = adminDb.collection("users").doc(customerId);
          await userRef.update({
            subscriptionType: "premium",
            subscriptionId: order.order_id,
            subscriptionStatus: "active",
            subscriptionStart: new Date().toISOString(),
            subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

          // Record payment
          await adminDb.collection("payments").add({
            userId: customerId,
            cashfreeOrderId: order.order_id,
            cashfreePaymentId: payment.cf_payment_id,
            paymentMethod: payment.payment_method?.type || "unknown",
            amount: order.order_amount,
            currency: order.order_currency,
            status: "captured",
            planType: "Premium Nutrition Pro",
            createdAt: new Date().toISOString(),
          });

          // Update order
          const orderRef = adminDb.collection("orders").doc(order.order_id);
          await orderRef.update({
            status: "paid",
            paymentId: payment.cf_payment_id,
            paymentMethod: payment.payment_method?.type,
            paidAt: new Date().toISOString(),
          });
        }
        break;

      case "PAYMENT_FAILED_WEBHOOK":
        const failedOrder = data.order;
        if (failedOrder.order_id) {
          const orderRef = adminDb.collection("orders").doc(failedOrder.order_id);
          await orderRef.update({
            status: "failed",
            failedAt: new Date().toISOString(),
            failureReason: data.error_details?.error_description || "Payment failed",
          });
        }
        break;

      case "REFUND_STATUS_WEBHOOK":
        const refund = data.refund;
        if (refund.refund_status === "SUCCESS") {
          const refundOrderId = refund.order_id;
          
          // Find user by order
          const orderDoc = await adminDb.collection("orders").doc(refundOrderId).get();
          const orderData = orderDoc.data();

          if (orderData?.userId) {
            // Downgrade user to free
            const userRef = adminDb.collection("users").doc(orderData.userId);
            await userRef.update({
              subscriptionType: "free",
              subscriptionStatus: "refunded",
            });

            // Record refund
            await adminDb.collection("payments").add({
              userId: orderData.userId,
              cashfreeOrderId: refundOrderId,
              cashfreeRefundId: refund.cf_refund_id,
              amount: -refund.refund_amount,
              currency: refund.refund_currency,
              status: "refunded",
              createdAt: new Date().toISOString(),
            });
          }
        }
        break;

      default:
        console.log("Unhandled webhook event:", type);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
