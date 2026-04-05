import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const prompt = `Compare ${food1} vs ${food2}. Provide calories, protein, carbs, fat, and a health score (0-100) for each. Also give a recommendation on which is better for ${goal || "balanced diet"}.

Return ONLY valid JSON in this format:
{
  "food1": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "score": number },
  "food2": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "score": number },
  "recommendation": string
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
    }

    const result = JSON.parse(text);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Compare error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compare foods" },
      { status: 500 }
    );
  }
}
