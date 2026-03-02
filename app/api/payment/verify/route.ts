import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const schema = z.object({ orderId: z.string(), paymentId: z.string(), signature: z.string() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const generated = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(`${parsed.data.orderId}|${parsed.data.paymentId}`).digest("hex");
  if (generated !== parsed.data.signature) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  await prisma.$transaction([
    prisma.payment.update({ where: { orderId: parsed.data.orderId }, data: { paymentId: parsed.data.paymentId, signature: parsed.data.signature, status: "paid" } }),
    prisma.user.update({ where: { id: userId }, data: { role: "PREMIUM", subscriptionStatus: "ACTIVE" } }),
    prisma.subscription.create({ data: { userId, plan: "PREMIUM", status: "ACTIVE" } }),
  ]);

  return NextResponse.json({ success: true });
}
