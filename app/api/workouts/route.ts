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

    const workouts = await prisma.workout.findMany({
      where: { userId: decoded.userId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(workouts);
  } catch (error) {
    console.error("Workout GET error:", error);
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

    const workout = await prisma.workout.create({
      data: {
        userId: decoded.userId,
        exerciseName: data.exerciseName,
        category: data.category,
        duration: data.duration,
        caloriesBurned: data.caloriesBurned,
        intensity: data.intensity,
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
        caloriesBurned: { increment: data.caloriesBurned },
      },
      create: {
        userId: decoded.userId,
        date: today,
        caloriesBurned: data.caloriesBurned,
      },
    });

    return NextResponse.json(workout);
  } catch (error) {
    console.error("Workout POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
