import { generateText, Output } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

// Schema for the nutrition analysis response
const NutritionAnalysisSchema = z.object({
  foodName: z.string(),
  portionEstimation: z.string(),
  analysisDate: z.string(),
  nutritionScore: z.object({
    score: z.number(),
    level: z.string(),
    explanation: z.string(),
  }),
  macronutrients: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string(),
      rdi: z.number(),
      percentage: z.number(),
      status: z.string(),
    })
  ),
  micronutrients: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string(),
      rdi: z.number(),
      percentage: z.number(),
      status: z.string(),
    })
  ),
  risks: z.array(
    z.object({
      name: z.string(),
      explanation: z.string(),
      severity: z.string(),
      consequences: z.string(),
    })
  ),
  metabolicImpact: z.object({
    glycemicImpact: z.string(),
    energyDensity: z.string(),
    metabolicLoad: z.string(),
    nutrientDensityScore: z.number(),
    analysis: z.string(),
  }),
  healthInsights: z.object({
    weightManagement: z.string(),
    muscleBuilding: z.string(),
    heartHealth: z.string(),
    diabetesSuitability: z.string(),
    fitnessCompatibility: z.string(),
  }),
  clinicalSummary: z.string(),
  expertFeatures: z.object({
    mealRating: z.string(),
    classification: z.string(),
    longTermImpact: z.string(),
    suggestions: z.array(z.string()),
    alternatives: z.array(z.string()),
  }),
});

export async function POST(req: Request) {
  try {
    const { query, image, profile, activeMode } = await req.json();

    if (!query && !image) {
      return NextResponse.json(
        { error: "Please provide a food item or image to analyze" },
        { status: 400 }
      );
    }

    const prompt = `
Analyze the following food item and return a comprehensive professional health-analysis diagnostic report.
The report must feel like a clinical nutrition document.

User Profile:
- Age: ${profile?.age || "N/A"}
- Gender: ${profile?.gender || "N/A"}
- Weight: ${profile?.weight || "N/A"}kg
- Goal: ${profile?.goal || "balanced"}
- Mode: ${activeMode?.toUpperCase() || "DIET"}
- Dietary Restrictions: ${profile?.dietaryRestrictions?.join(", ") || "None"}
- Fitness Level: ${profile?.fitnessLevel || "N/A"}

The user's current health goal is: ${profile?.goal || "balanced"}. 
Current Mode: ${
      activeMode === "gym"
        ? "GYM/FITNESS (Focus on protein, recovery, muscle gain)"
        : "DIET/HEALTH (Focus on weight loss, sugar/sodium control, fiber)"
    }.
Tailor the analysis, risks, and suggestions to this specific context.

Food item to analyze: ${query || "Food from image"}
`;

    const messages: any[] = [];

    if (image) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image: image.data },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: prompt,
      });
    }

    // Use Vercel AI Gateway with model string (AI SDK 6)
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      messages,
      output: Output.object({ schema: NutritionAnalysisSchema }),
    });

    if (result.object) {
      return NextResponse.json(result.object);
    } else {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze food" },
      { status: 500 }
    );
  }
}
