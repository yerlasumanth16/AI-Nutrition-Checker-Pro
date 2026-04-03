import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { verifyToken } from "../../../../lib/auth";
import { Cashfree } from "../../../../lib/cashfree";

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

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Verify order status with Cashfree
    const orderResponse = await Cashfree.PGFetchOrder(orderId);
    const orderData = orderResponse.data;

    if (!orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get payments for this order
    const paymentsResponse = await Cashfree.PGOrderFetchPayments(orderId);
    const payments = paymentsResponse.data || [];

    // Find successful payment
    const successfulPayment = payments.find(
      (p: any) => p.payment_status === "SUCCESS"
    );

    if (orderData.order_status === "PAID" && successfulPayment) {
      // Update user status in Firestore
      const userRef = adminDb.collection("users").doc(decoded.userId);
      await userRef.update({
        subscriptionType: "premium",
        subscriptionId: orderId,
        subscriptionStatus: "active",
        subscriptionStart: new Date().toISOString(),
        subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Record payment in Firestore
      await adminDb.collection("payments").add({
        userId: decoded.userId,
        cashfreeOrderId: orderId,
        cashfreePaymentId: successfulPayment.cf_payment_id,
        paymentMethod: successfulPayment.payment_method?.type || "unknown",
        amount: orderData.order_amount,
        currency: orderData.order_currency,
        status: "captured",
        planType: "Premium Nutrition Pro",
        createdAt: new Date().toISOString(),
      });

      // Update order status
      await adminDb.collection("orders").doc(orderId).update({
        status: "paid",
        paymentId: successfulPayment.cf_payment_id,
        paymentMethod: successfulPayment.payment_method?.type,
        paidAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
      });
    }

    return NextResponse.json(
      {
        success: false,
        status: orderData.order_status,
        message: "Payment not completed",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Verify subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
