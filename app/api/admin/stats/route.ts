import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, premiumUsers, revenue, analyses] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PREMIUM" } }),
    prisma.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
    prisma.analysisHistory.count(),
  ]);

  return NextResponse.json({ totalUsers, premiumUsers, totalRevenue: revenue._sum.amount || 0, analyses });
}
