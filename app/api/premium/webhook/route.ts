import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use service role for webhooks (server-to-server)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
          const subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          
          // Update user to premium
          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_type: "premium",
              subscription_status: "active",
              subscription_end: subscriptionEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("id", customerId);

          // Update payment record
          await supabaseAdmin
            .from("payments")
            .update({
              payment_id: payment.cf_payment_id,
              status: "success",
              payment_method: payment.payment_method?.type || "unknown",
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", order.order_id);
        }
        break;

      case "PAYMENT_FAILED_WEBHOOK":
        const failedOrder = data.order;
        if (failedOrder.order_id) {
          await supabaseAdmin
            .from("payments")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", failedOrder.order_id);
        }
        break;

      case "REFUND_STATUS_WEBHOOK":
        const refund = data.refund;
        if (refund.refund_status === "SUCCESS") {
          const refundOrderId = refund.order_id;
          
          // Get payment record to find user
          const { data: paymentRecord } = await supabaseAdmin
            .from("payments")
            .select("user_id")
            .eq("order_id", refundOrderId)
            .single();

          if (paymentRecord?.user_id) {
            // Downgrade user to free
            await supabaseAdmin
              .from("profiles")
              .update({
                subscription_type: "free",
                subscription_status: "refunded",
                updated_at: new Date().toISOString(),
              })
              .eq("id", paymentRecord.user_id);

            // Update payment record
            await supabaseAdmin
              .from("payments")
              .update({
                status: "refunded",
                updated_at: new Date().toISOString(),
              })
              .eq("order_id", refundOrderId);
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
