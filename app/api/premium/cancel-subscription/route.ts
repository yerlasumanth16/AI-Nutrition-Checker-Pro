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

    // Get user profile with payment info
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Get latest successful payment
    const { data: latestPayment } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!profile || profile.subscription_type !== "premium") {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Check if within 24 hours for refund eligibility
    const paymentTime = latestPayment ? new Date(latestPayment.created_at) : null;
    const now = new Date();
    const refundEligible = paymentTime && 
      (now.getTime() - paymentTime.getTime()) < 24 * 60 * 60 * 1000;

    if (refundEligible && latestPayment?.order_id) {
      try {
        const refundRequest = {
          refund_amount: 15,
          refund_id: `refund_${Date.now()}_${user.id.slice(0, 8)}`,
          refund_note: "Subscription cancelled within 24 hours",
        };

        await Cashfree.PGOrderCreateRefund(latestPayment.order_id, refundRequest);

        await supabase
          .from("profiles")
          .update({
            subscription_type: "free",
            subscription_status: "refunded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        return NextResponse.json({ 
          success: true, 
          message: "Subscription cancelled and refund initiated" 
        });
      } catch (refundError) {
        console.error("Refund error:", refundError);
      }
    }

    // Cancel subscription (user keeps access until end date)
    await supabase
      .from("profiles")
      .update({
        subscription_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({ 
      success: true,
      message: "Subscription cancelled. You will keep access until the end of your billing period."
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
