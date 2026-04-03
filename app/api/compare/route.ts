import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { NextResponse } from "next/server";

const FoodComparisonSchema = z.object({
  food1: z.object({
    name: z.string(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    score: z.number(),
  }),
  food2: z.object({
    name: z.string(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    score: z.number(),
  }),
  recommendation: z.string(),
});

export async function POST(req: Request) {
  try {
    const { food1, food2, goal } = await req.json();

    if (!food1 || !food2) {
      return NextResponse.json(
        { error: "Both food items are required for comparison" },
        { status: 400 }
      );
    }

    const prompt = `Compare ${food1} vs ${food2}. Provide calories, protein, carbs, fat, and a health score (0-100) for each. Also give a recommendation on which is better for ${goal || "balanced diet"}.`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      output: Output.object({ schema: FoodComparisonSchema }),
    });

    if (result.object) {
      return NextResponse.json(result.object);
    } else {
      return NextResponse.json(
        { error: "Failed to compare foods" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Compare error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compare foods" },
      { status: 500 }
    );
  }
}
