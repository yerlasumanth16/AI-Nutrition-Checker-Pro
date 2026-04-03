import { NextResponse } from "next/server";
import { Cashfree, CASHFREE_CONFIG } from "../../../../lib/cashfree";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${user.id.slice(0, 8)}`;

    // Create order with Cashfree
    const orderRequest = {
      order_id: orderId,
      order_amount: 15, // ₹15 premium subscription
      order_currency: "INR",
      customer_details: {
        customer_id: user.id,
        customer_name: profile?.name || "Customer",
        customer_email: user.email || "",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/premium?order_id={order_id}&payment_status={payment_status}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/premium/webhook`,
        payment_methods: "cc,dc,upi,nb,app,paylater,emi",
      },
      order_note: "NutriAI Premium Subscription",
    };

    const response = await Cashfree.PGCreateOrder(orderRequest);

    if (response.data) {
      // Store order in Supabase
      await supabase.from("payments").insert({
        user_id: user.id,
        order_id: orderId,
        amount: 15,
        currency: "INR",
        status: "pending",
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
