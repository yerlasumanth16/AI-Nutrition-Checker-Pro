import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
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

Return ONLY valid JSON in this format:
{
  "date": "${new Date().toISOString().split("T")[0]}",
  "breakfast": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[], "alternatives": string[] },
  "lunch": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[], "alternatives": string[] },
  "dinner": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[], "alternatives": string[] },
  "snacks": [
    { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[], "alternatives": string[] }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
    }

    const result = JSON.parse(text);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Meal plan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate meal plan" },
      { status: 500 }
    );
  }
}
