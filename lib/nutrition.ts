import { z } from "zod";

export const nutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
  fiber: z.number(),
  sugar: z.number(),
  sodium: z.number(),
  micronutrients: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type NutritionResult = z.infer<typeof nutritionSchema>;

export function computeHealthScore(n: NutritionResult) {
  let score = 100;
  if (n.sugar > 40) score -= 15;
  if (n.sodium > 2300) score -= 15;
  if (n.fiber < 10) score -= 10;
  if (n.protein < 15) score -= 10;
  return Math.max(1, Math.min(100, score));
}
