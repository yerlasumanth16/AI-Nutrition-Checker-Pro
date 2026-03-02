import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { analyzeFoodImage } from "@/lib/openai";
import { computeHealthScore } from "@/lib/nutrition";
import { enforceUsageLimit } from "@/lib/usage";
import { prisma } from "@/lib/prisma";

const schema = z.object({ imageUrl: z.string().url() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const usage = await enforceUsageLimit(userId);
  if (!usage.allowed) return NextResponse.json({ error: usage.reason, upgradeRequired: true }, { status: 403 });

  const analysis = await analyzeFoodImage(parsed.data.imageUrl);
  const healthScore = computeHealthScore(analysis);

  await prisma.analysisHistory.create({ data: { userId, source: "image", imageUrl: parsed.data.imageUrl, resultJson: analysis, healthScore } });
  return NextResponse.json({ analysis, healthScore });
}
