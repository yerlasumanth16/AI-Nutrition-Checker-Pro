import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { env } from "@/lib/env";

const analyzeSchema = z.object({
  imageUrl: z.string().url(),
});

export async function POST(req: Request) {
  try {
    // ✅ 1. Validate Gemini API Key
    const apiKey = env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API key missing");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // ✅ 2. Check Authentication
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // ✅ 3. Validate Request Body
    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { imageUrl } = parsed.data;

    // ✅ 4. Fetch User Plan Info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        planType: true,
        usageCount: true,
        lastResetDate: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const now = new Date();

    const lastReset = user.lastResetDate ?? now;
    const isNewDay =
      now.toDateString() !== new Date(lastReset).toDateString();

    let currentUsage = user.usageCount ?? 0;

    if (isNewDay) {
      currentUsage = 0;

      await prisma.user.update({
        where: { id: userId },
        data: {
          usageCount: 0,
          lastResetDate: now,
        },
      });
    }

    // ✅ 5. Free Plan Limit Check
    if (user.planType === "free" && currentUsage >= 5) {
      return NextResponse.json(
        {
          error: "Daily limit reached",
          upgradeRequired: true,
          message:
            "Free plan allows only 5 analyses per day. Upgrade to Premium for unlimited access.",
        },
        { status: 403 }
      );
    }

    // ✅ 6. Call Gemini
    const prompt = `
Analyze this food image and return ONLY valid JSON in this format:

{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "micronutrients": []
}

Image URL: ${imageUrl}

Do not add explanations.
Return only pure JSON.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let analysis = {};

    try {
      // Clean up markdown code blocks if present
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      analysis = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      return NextResponse.json(
        { error: "AI response parsing failed" },
        { status: 500 }
      );
    }

    // ✅ 7. Increment Usage Count
    await prisma.user.update({
      where: { id: userId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error: any) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
