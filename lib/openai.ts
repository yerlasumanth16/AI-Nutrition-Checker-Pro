import OpenAI from "openai";
import { env } from "@/lib/env";
import { nutritionSchema } from "@/lib/nutrition";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const prompt = `Return ONLY valid JSON with keys calories, protein, carbs, fats, fiber, sugar, sodium, micronutrients(string[]), suggestions(string[]).`;

export async function analyzeFoodText(text: string) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `${prompt}\nMeal: ${text}`,
  });

  const output = response.output_text;
  return nutritionSchema.parse(JSON.parse(output));
}

export async function analyzeFoodImage(imageUrl: string) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      { role: "user", content: [
        { type: "input_text", text: prompt },
        { type: "input_image", image_url: imageUrl, detail: "auto" },
      ]},
    ],
  });

  const output = response.output_text;
  return nutritionSchema.parse(JSON.parse(output));
}
