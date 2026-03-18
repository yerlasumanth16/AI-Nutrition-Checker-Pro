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
    const date = searchParams.get("date");

    let where: any = { userId: decoded.userId };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.timestamp = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const logs = await prisma.nutritionLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Nutrition GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const data = await req.json();

    const log = await prisma.nutritionLog.create({
      data: {
        userId: decoded.userId,
        foodName: data.foodName,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fats: data.fats,
        fiber: data.fiber,
        sugar: data.sugar,
        micronutrients: data.micronutrients ? JSON.stringify(data.micronutrients) : null,
      },
    });

    // Update Daily Progress
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyProgress.upsert({
      where: {
        userId_date: {
          userId: decoded.userId,
          date: today,
        },
      },
      update: {
        calorieIntake: { increment: data.calories },
      },
      create: {
        userId: decoded.userId,
        date: today,
        calorieIntake: data.calories,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Nutrition POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
