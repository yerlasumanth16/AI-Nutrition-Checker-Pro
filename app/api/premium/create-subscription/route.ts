import { NextResponse } from "next/server";
import { cashfree, CASHFREE_CONFIG } from "../../../../lib/cashfree";
import { verifyToken } from "../../../../lib/auth";
import { adminDb } from "../../../../lib/firebase-admin";

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

    // Get user details from Firestore
    const userRef = adminDb.collection("users").doc(decoded.userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${decoded.userId.slice(0, 8)}`;

    // Create order with Cashfree
    const orderRequest = {
      order_id: orderId,
      order_amount: 15, // ₹15 premium subscription
      order_currency: "INR",
      customer_details: {
        customer_id: decoded.userId,
        customer_name: userData?.name || "Customer",
        customer_email: userData?.email || "",
        customer_phone: userData?.phone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?order_id={order_id}&payment_status={payment_status}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/premium/webhook`,
        payment_methods: "cc,dc,upi,nb,app,paylater,emi", // All payment methods
      },
      order_note: "NutriAI Premium Subscription",
    };

    const response = await cashfree.PGCreateOrder(orderRequest);

    if (response.data) {
      // Store order reference in Firestore
      await adminDb.collection("orders").doc(orderId).set({
        userId: decoded.userId,
        orderId: orderId,
        amount: 15,
        currency: "INR",
        status: "created",
        paymentSessionId: response.data.payment_session_id,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        orderId: orderId,
        paymentSessionId: response.data.payment_session_id,
        environment: CASHFREE_CONFIG.environment,
      });
    }

    throw new Error("Failed to create order");
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
