import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { Cashfree } from "../../../../lib/cashfree";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      const subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Update user profile in Supabase
      await supabase
        .from("profiles")
        .update({
          subscription_type: "premium",
          subscription_status: "active",
          subscription_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      // Update payment record
      await supabase
        .from("payments")
        .update({
          payment_id: successfulPayment.cf_payment_id,
          status: "success",
          payment_method: successfulPayment.payment_method?.type || "unknown",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

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
