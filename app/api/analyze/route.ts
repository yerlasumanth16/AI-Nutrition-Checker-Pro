import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { z } from "zod";

const analyzeSchema = z.object({
  imageUrl: z.string().url(),
});

export async function POST(req: Request) {
  try {
    // 1. Validate Environment Variables
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 2. Check Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 3. Validate Request Body
    const body = await req.json();
    const result = analyzeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request body", details: result.error.format() }, { status: 400 });
    }

    const { imageUrl } = result.data;

    // 4. Check Plan and Usage Limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true, usageCount: true, lastResetDate: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const isNewDay = now.toDateString() !== user.lastResetDate.toDateString();

    let currentUsage = user.usageCount;
    if (isNewDay) {
      currentUsage = 0;
      await prisma.user.update({
        where: { id: userId },
        data: { usageCount: 0, lastResetDate: now },
      });
    }

    if (user.planType === "free" && currentUsage >= 5) {
      return NextResponse.json({ 
        error: "Usage limit exceeded", 
        upgradeRequired: true,
        message: "You have reached your daily limit of 5 analyses. Please upgrade to Premium for unlimited access."
      }, { status: 403 });
    }

    // 5. Call AI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this food image and provide nutritional information in JSON format: { calories, protein, carbs, fats, micronutrients: [] }" },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");

    // 6. Increment Usage Count Safely
    await prisma.user.update({
      where: { id: userId },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, analysis });

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message || "An unexpected error occurred" 
    }, { status: 500 });
  }
}
