import { NextResponse } from "next/server";
import { razorpay } from "../../../../lib/razorpay";
import { prisma } from "../../../../lib/prisma";
import { verifyToken } from "../../../../lib/auth";

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

    const planId = process.env.RAZORPAY_PLAN_ID;
    if (!planId) {
      return NextResponse.json({ error: "Razorpay Plan ID not configured" }, { status: 500 });
    }

    // Create a subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // 1 year of monthly billing
      quantity: 1,
      notes: {
        userId: decoded.userId,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Create subscription error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
