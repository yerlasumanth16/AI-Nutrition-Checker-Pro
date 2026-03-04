import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
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

    const ai = new GoogleGenAI({ apiKey });

    // ✅ 2. Validate Request Body
    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { imageUrl } = parsed.data;

    // ✅ 3. Call Gemini
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

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      throw new Error("Empty response from AI");
    }

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
