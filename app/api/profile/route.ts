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

    const profile = await prisma.profile.findUnique({
      where: { userId: decoded.userId },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile GET error:", error);
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

    const profile = await prisma.profile.upsert({
      where: { userId: decoded.userId },
      update: {
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        bodyFat: data.bodyFat,
        fitnessGoal: data.fitnessGoal,
        activityLevel: data.activityLevel,
        dietaryPreference: data.dietaryPreference,
      },
      create: {
        userId: decoded.userId,
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        bodyFat: data.bodyFat,
        fitnessGoal: data.fitnessGoal,
        activityLevel: data.activityLevel,
        dietaryPreference: data.dietaryPreference,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
