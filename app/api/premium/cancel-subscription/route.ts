import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { verifyToken } from "../../../../lib/auth";
import { cashfree } from "../../../../lib/cashfree";

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

    // For Cashfree, we handle cancellation by updating the user status
    // and optionally processing a refund if within refund window
    const subscriptionStart = userData.subscriptionStart ? new Date(userData.subscriptionStart) : null;
    const now = new Date();
    
    // Check if within 24 hours for refund eligibility
    const refundEligible = subscriptionStart && 
      (now.getTime() - subscriptionStart.getTime()) < 24 * 60 * 60 * 1000;

    if (refundEligible && userData.subscriptionId) {
      try {
        // Attempt to process refund
        const refundRequest = {
          refund_amount: 15, // Full refund
          refund_id: `refund_${Date.now()}_${decoded.userId.slice(0, 8)}`,
          refund_note: "Subscription cancelled within 24 hours",
        };

        await cashfree.PGOrderCreateRefund(userData.subscriptionId, refundRequest);

        await userRef.update({
          subscriptionType: "free",
          subscriptionStatus: "refunded",
        });

        return NextResponse.json({ 
          success: true, 
          message: "Subscription cancelled and refund initiated" 
        });
      } catch (refundError) {
        console.error("Refund error:", refundError);
        // Continue with cancellation even if refund fails
      }
    }

    // Cancel subscription (user keeps access until end date)
    await userRef.update({
      subscriptionStatus: "cancelled",
    });

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
