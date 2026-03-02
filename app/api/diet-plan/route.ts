import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  age: z.number().min(10).max(100),
  weight: z.number().min(20).max(300),
  height: z.number().min(100).max(230),
  goal: z.enum(["WEIGHT_LOSS", "MUSCLE_GAIN", "MAINTENANCE"]),
  activityLevel: z.string().min(3),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "PREMIUM" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Premium only" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: parsed.data });

  const plan = {
    caloriesTarget: parsed.data.goal === "WEIGHT_LOSS" ? 1800 : parsed.data.goal === "MUSCLE_GAIN" ? 2600 : 2200,
    weeklyPlanner: ["Mon: High protein breakfast", "Tue: Fiber-rich lunch", "Wed: Balanced macros"],
  };

  return NextResponse.json({ plan });
}
