import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await razorpay.orders.create({ amount: 49900, currency: "INR", receipt: `sub_${userId}_${Date.now()}` });

  await prisma.payment.create({
    data: { userId, amount: Number(order.amount), currency: order.currency, orderId: order.id, status: "created" },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, keyId: env.RAZORPAY_KEY_ID });
}
