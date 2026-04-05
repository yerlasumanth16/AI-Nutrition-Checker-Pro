import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const prompt = `
Analyze the following food item and return a comprehensive professional health-analysis diagnostic report in ONLY valid JSON format.
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
Current Mode: ${activeMode === "gym" ? "GYM/FITNESS (Focus on protein, recovery, muscle gain)" : "DIET/HEALTH (Focus on weight loss, sugar/sodium control, fiber)"}.
Tailor the analysis, risks, and suggestions to this specific context.

Food item to analyze: ${query || "Food from image"}

Required JSON structure:
{
  "foodName": string,
  "portionEstimation": string,
  "analysisDate": string (ISO format),
  "nutritionScore": { "score": number (0-100), "level": string ("Excellent"/"Good"/"Fair"/"Poor"), "explanation": string },
  "macronutrients": [ { "name": string, "value": number, "unit": string, "rdi": number, "percentage": number, "status": string ("optimal"/"high"/"low") } ],
  "micronutrients": [ { "name": string, "value": number, "unit": string, "rdi": number, "percentage": number, "status": string } ],
  "risks": [ { "name": string, "explanation": string, "severity": string ("low"/"medium"/"high"), "consequences": string } ],
  "metabolicImpact": { "glycemicImpact": string, "energyDensity": string, "metabolicLoad": string, "nutrientDensityScore": number, "analysis": string },
  "healthInsights": { "weightManagement": string, "muscleBuilding": string, "heartHealth": string, "diabetesSuitability": string, "fitnessCompatibility": string },
  "clinicalSummary": string,
  "expertFeatures": { "mealRating": string, "classification": string, "longTermImpact": string, "suggestions": string[], "alternatives": string[] }
}
`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (image) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: image.data } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: prompt
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
    }

    const result = JSON.parse(text);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze food" },
      { status: 500 }
    );
  }
}
