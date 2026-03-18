import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const foodName = searchParams.get("foodName");

    if (!foodName) {
      return NextResponse.json({ error: "Missing foodName" }, { status: 400 });
    }

    const cached = await prisma.aIAnalysisCache.findUnique({
      where: { foodName: foodName.toLowerCase() },
    });

    if (cached) {
      return NextResponse.json({
        ...cached,
        breakdown: JSON.parse(cached.breakdown),
        riskIndicators: JSON.parse(cached.riskIndicators),
      });
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error("Cache GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const cached = await prisma.aIAnalysisCache.upsert({
      where: { foodName: data.foodName.toLowerCase() },
      update: {
        breakdown: JSON.stringify(data.breakdown),
        healthScore: data.healthScore,
        riskIndicators: JSON.stringify(data.riskIndicators),
        timestamp: new Date(),
      },
      create: {
        foodName: data.foodName.toLowerCase(),
        breakdown: JSON.stringify(data.breakdown),
        healthScore: data.healthScore,
        riskIndicators: JSON.stringify(data.riskIndicators),
      },
    });

    return NextResponse.json(cached);
  } catch (error) {
    console.error("Cache POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
