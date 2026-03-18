import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyToken } from "../../../lib/auth";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as { userId: string } | null;

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const progress = await prisma.dailyProgress.findMany({
      where: {
        userId: decoded.userId,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Progress GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
