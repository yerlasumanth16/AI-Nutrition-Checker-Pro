import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, profile, activeMode, analysis, history, dailyStats } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const context = analysis 
      ? `Current meal being discussed: ${analysis.foodName}. Nutrition Score: ${analysis.nutritionScore?.score}. Summary: ${analysis.clinicalSummary}` 
      : "No specific meal is currently being analyzed.";

    const systemPrompt = `You are a professional AI Nutrition & Fitness Coach. 
Context: ${context}
User Profile: ${JSON.stringify(profile || {})}
Dietary Restrictions: ${profile?.dietaryRestrictions?.join(", ") || "None"}
Fitness Level: ${profile?.fitnessLevel || "N/A"}
Current Mode: ${activeMode?.toUpperCase() || "DIET"}
User History Summary: ${history?.length || 0} meals tracked recently. Total calories today: ${dailyStats?.calories || 0}. Calories burned today: ${dailyStats?.caloriesBurned || 0}.

Answer the user's question accurately and professionally. Provide specific advice based on their goal (${profile?.goal || "balanced"}) and mode (${activeMode || "diet"}).`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: message,
    });

    return NextResponse.json({ response: result.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat" },
      { status: 500 }
    );
  }
}
