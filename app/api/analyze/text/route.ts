import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { analyzeFoodText } from "@/lib/openai";
import { computeHealthScore } from "@/lib/nutrition";
import { enforceUsageLimit } from "@/lib/usage";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({ text: z.string().min(3).max(1000) });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = checkRateLimit(`text-${ip}`, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const usage = await enforceUsageLimit(userId);
  if (!usage.allowed) return NextResponse.json({ error: usage.reason, upgradeRequired: true }, { status: 403 });

  const analysis = await analyzeFoodText(parsed.data.text);
  const healthScore = computeHealthScore(analysis);

  await prisma.analysisHistory.create({ data: { userId, source: "text", inputText: parsed.data.text, resultJson: analysis, healthScore } });
  await prisma.usageLog.create({ data: { userId, endpoint: "/api/analyze/text", success: true, ipAddress: ip } });

  return NextResponse.json({ analysis, healthScore });
}
