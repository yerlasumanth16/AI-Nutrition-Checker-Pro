import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { NextResponse } from "next/server";

const MealSchema = z.object({
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  ingredients: z.array(z.string()),
  alternatives: z.array(z.string()),
});

const MealPlanSchema = z.object({
  date: z.string(),
  breakfast: MealSchema,
  lunch: MealSchema,
  dinner: MealSchema,
  snacks: z.array(MealSchema),
});

export async function POST(req: Request) {
  try {
    const { profile, activeMode } = await req.json();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile is required" },
        { status: 400 }
      );
    }

    const prompt = `
Generate a 1-day personalized meal plan based on the following user profile:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Weight: ${profile.weight}kg
- Height: ${profile.height}cm
- Goal: ${profile.goal}
- Activity Level: ${profile.activityLevel}
- Calorie Target: ${profile.calorieTarget} kcal
- Macro Targets: Protein ${profile.macroTargets?.protein || 50}g, Carbs ${profile.macroTargets?.carbs || 200}g, Fat ${profile.macroTargets?.fat || 65}g
- Mode: ${activeMode?.toUpperCase() || "DIET"}
- Dietary Restrictions: ${profile.dietaryRestrictions?.join(", ") || "None"}
- Fitness Level: ${profile.fitnessLevel || "N/A"}

The plan should include Breakfast, Lunch, Dinner, and 2 Snacks.
For each meal, provide name, calories, protein, carbs, fat, ingredients, and alternatives.
Use the date: ${new Date().toISOString().split("T")[0]}
`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      output: Output.object({ schema: MealPlanSchema }),
    });

    if (result.object) {
      return NextResponse.json(result.object);
    } else {
      return NextResponse.json(
        { error: "Failed to generate meal plan" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Meal plan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate meal plan" },
      { status: 500 }
    );
  }
}
