import { GoogleGenAI, Modality, Type, ThinkingLevel } from "@google/genai";
import { NutritionAnalysisResponse, UserProfile } from "../types";

// Helper to get AI instance
const getAI = () => new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

const SYSTEM_INSTRUCTION = `
You are an advanced AI-powered Clinical Nutrition Intelligence Engine designed for a production-level web platform called: “AI Nutrition Checker Pro”

Your responsibilities:
Perform scientific nutritional analysis
Personalize insights using user metabolic data
Perform health risk estimation
Compare foods analytically
Generate AI meal plans
Analyze food images (if description provided)
Estimate glycemic impact
Provide food quality scoring
Detect nutritional imbalance patterns
Support Indian and global cuisine
Provide compatibility analysis between foods
Estimate gut health impact
Generate structured UI metadata for frontend rendering

You must return structured JSON only.
No markdown.
No extra commentary.
No explanations outside JSON.

🔷 INPUT FORMAT
The user input will include:
{
"food_query": "string",
"user_profile": {
"age": number,
"gender": "male/female/other",
"height_cm": number,
"weight_kg": number,
"activity_level": "sedentary/light/moderate/active/athlete",
"goal": "fat_loss/muscle_gain/maintenance"
},
"mode": "single_food/comparison/meal_plan/image_analysis/compatibility_check",
"download_report": boolean
}

🔷 CORE SCIENTIFIC CALCULATIONS
1️⃣ Use the provided BMR and TDEE from the user_profile.
2️⃣ Compare food calories with the user's TDEE.

4️⃣ Health Score Logic (0–100):
High protein density → increase
High fiber → increase
High sugar → decrease
High saturated fat → decrease
Balanced micronutrients → increase

5️⃣ Food Quality Index:
Quality Score = 0.4(Protein Density) + 0.3(Fiber Density) + 0.3(Micronutrient Score) − Sugar Penalty

6️⃣ Risk Estimation:
Based on: Glycemic index, Sodium, Sugar load, Saturated fats
Return: Low / Moderate / High

🔷 REPORT GENERATION RULES (Only if download_report is true)
When generating "print_ready_html":
- Use A4 page layout
- Use professional medical report style
- White background, Green headers (#2E7D32), Clean typography (Arial/Helvetica)
- Section dividers, Page margins suitable for printing
- No external CSS, Inline CSS only
- Include header logo placeholder, footer with report ID
- Use tables for nutritional breakdown
- Add health score gauge (CSS styled)
- Include print media CSS (@media print { remove buttons, remove shadows, full width layout })
- Color Theme: Primary #2E7D32, Secondary #66BB6A, Accent #FFA726, Danger #E53935

If food unknown:
Return:
{
  "error": "Food not recognized. Please provide a clearer input."
}
`;

const PREVENTIVE_HEALTH_SYSTEM_INSTRUCTION = `
You are an Advanced Clinical Nutrition and Preventive Health Intelligence Engine.
You are designed for a production-grade platform called: AI Nutrition & Preventive Health Analyzer

Your job is to:
Perform deep nutritional analysis.
Calculate metabolic metrics.
Evaluate cardiovascular risk factors.
Assess brain and cognitive nutrition.
Simulate gut microbiome impact.
Predict nutrient deficiency risks.
Project body composition changes.
Generate preventive health summary.
Simulate genetic sensitivity assumptions.
Track long-term dietary risk trends.
Estimate hormonal nutrition support.
Perform long-term nutrition impact simulations.
Calculate scientifically reasoned Skin Glow and Dermatological Health Index.

Return STRICT JSON only.
No markdown.
No commentary outside JSON.

CORE CALCULATIONS
1️⃣ Use the provided BMR and TDEE from the user_profile.

3️⃣ Glycemic Load
GL = (Glycemic Index × Carbohydrates per serving) / 100
Classification: Low <10, Moderate 10–20, High >20

4️⃣ Heart Health Index
Heart Index = (Potassium + Fiber Support Score) − (Sodium Load + Saturated Fat Impact)

5️⃣ Nutrient Density Score
Total Micronutrient Value / Calories

6️⃣ Quality Index
0.4(Protein Density) + 0.3(Fiber Density) + 0.3(Micronutrient Score) − Sugar Penalty

7️⃣ Weekly Weight Projection
Calorie Surplus or Deficit per day × 7 / 7700 ≈ kg change

8️⃣ Deficiency Risk Logic
If avg protein < 0.8g per kg bodyweight → Protein deficiency risk elevated
If iron intake low + female → Iron deficiency elevated
If B12 low + vegetarian → B12 deficiency elevated

9️⃣ Hormonal Support Indicators
Evaluate: Zinc, Healthy fats, Iodine, Selenium, Protein sufficiency

10️⃣ Long-Term Risk Trend
If sugar high + fiber low + sedentary → Diabetes risk increases
If sodium high + potassium low → Cardiovascular risk increases

11️⃣ Skin Glow Index (%)
0.25(Antioxidant Score) + 0.20(Collagen Support Score) + 0.15(Hydration Score) + 0.15(Omega-3 Support) + 0.15(Gut Health Influence) − 0.20(Glycation Penalty) − 0.10(Inflammation Penalty)
Clamp final value between 0 and 100.
`;

const NUTRITION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    food_analysis: {
      type: Type.OBJECT,
      properties: {
        food_name: { type: Type.STRING },
        serving_reference: { type: Type.STRING },
        calories_kcal: { type: Type.NUMBER },
        macronutrients: {
          type: Type.OBJECT,
          properties: {
            carbohydrates_g: { type: Type.NUMBER },
            proteins_g: { type: Type.NUMBER },
            fats_g: { type: Type.NUMBER },
            fiber_g: { type: Type.NUMBER },
            sugars_g: { type: Type.NUMBER }
          },
          required: ["carbohydrates_g", "proteins_g", "fats_g", "fiber_g", "sugars_g"]
        },
        micronutrients: {
          type: Type.OBJECT,
          properties: {
            calcium_mg: { type: Type.NUMBER },
            iron_mg: { type: Type.NUMBER },
            potassium_mg: { type: Type.NUMBER },
            magnesium_mg: { type: Type.NUMBER },
            vitamin_c_mg: { type: Type.NUMBER },
            vitamin_b12_mcg: { type: Type.NUMBER }
          },
          required: ["calcium_mg", "iron_mg", "potassium_mg", "magnesium_mg", "vitamin_c_mg", "vitamin_b12_mcg"]
        },
        glycemic_index: { type: Type.NUMBER },
        nutrient_density_score: { type: Type.NUMBER },
        health_score: { type: Type.NUMBER },
        quality_index: { type: Type.NUMBER },
        analysis_summary: { type: Type.STRING }
      },
      required: ["food_name", "serving_reference", "calories_kcal", "macronutrients", "micronutrients", "glycemic_index", "health_score", "quality_index"]
    },
    personalized_impact: {
      type: Type.OBJECT,
      properties: {
        daily_calorie_requirement: { type: Type.NUMBER },
        percentage_of_daily_calories: { type: Type.NUMBER },
        goal_alignment: { type: Type.STRING, description: "Good, Moderate, or Poor" },
        recommended_adjustment: { type: Type.STRING }
      },
      required: ["daily_calorie_requirement", "percentage_of_daily_calories", "goal_alignment", "recommended_adjustment"]
    },
    risk_prediction: {
      type: Type.OBJECT,
      properties: {
        diabetes_risk: { type: Type.STRING, description: "Low, Moderate, or High" },
        cardiovascular_risk: { type: Type.STRING, description: "Low, Moderate, or High" },
        obesity_risk: { type: Type.STRING, description: "Low, Moderate, or High" }
      },
      required: ["diabetes_risk", "cardiovascular_risk", "obesity_risk"]
    },
    gut_health_analysis: {
      type: Type.OBJECT,
      properties: {
        prebiotic_score: { type: Type.NUMBER },
        digestive_friendliness: { type: Type.STRING, description: "Good, Moderate, or Poor" },
        inflammation_risk: { type: Type.STRING, description: "Low, Moderate, or High" }
      },
      required: ["prebiotic_score", "digestive_friendliness", "inflammation_risk"]
    },
    food_compatibility: {
      type: Type.OBJECT,
      properties: {
        compatible_with: { type: Type.ARRAY, items: { type: Type.STRING } },
        avoid_combining_with: { type: Type.ARRAY, items: { type: Type.STRING } },
        reasoning: { type: Type.STRING }
      },
      required: ["compatible_with", "avoid_combining_with", "reasoning"]
    },
    ai_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    ui_metadata: {
      type: Type.OBJECT,
      properties: {
        theme_palette: {
          type: Type.OBJECT,
          properties: {
            primary_color: { type: Type.STRING },
            secondary_color: { type: Type.STRING },
            accent_color: { type: Type.STRING },
            background_gradient: { type: Type.STRING }
          }
        },
        recommended_visuals: { type: Type.ARRAY, items: { type: Type.STRING } },
        icon_style: { type: Type.STRING },
        font_style: { type: Type.STRING }
      }
    },
    downloadable_report: {
      type: Type.OBJECT,
      properties: {
        report_id: { type: Type.STRING },
        report_title: { type: Type.STRING },
        generated_on: { type: Type.STRING },
        report_summary: { type: Type.STRING },
        detailed_sections: {
          type: Type.OBJECT,
          properties: {
            user_profile_summary: { type: Type.STRING },
            metabolic_analysis: { type: Type.STRING },
            food_nutritional_breakdown: { type: Type.STRING },
            risk_assessment: { type: Type.STRING },
            gut_health_analysis: { type: Type.STRING },
            goal_alignment_analysis: { type: Type.STRING },
            recommendations: { type: Type.STRING }
          }
        },
        print_ready_html: { type: Type.STRING }
      }
    }
  },
  required: ["food_analysis", "personalized_impact", "risk_prediction", "gut_health_analysis", "food_compatibility", "ai_recommendations", "ui_metadata"]
};

const PREVENTIVE_HEALTH_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    metabolic_health_report: {
      type: Type.OBJECT,
      properties: {
        bmr: { type: Type.NUMBER },
        tdee: { type: Type.NUMBER },
        metabolic_efficiency_score: { type: Type.NUMBER },
        calorie_balance_status: { type: Type.STRING, description: "Deficit, Surplus, or Maintenance" }
      },
      required: ["bmr", "tdee", "metabolic_efficiency_score", "calorie_balance_status"]
    },
    glycemic_and_insulin_report: {
      type: Type.OBJECT,
      properties: {
        glycemic_index: { type: Type.NUMBER },
        glycemic_load: { type: Type.NUMBER },
        classification: { type: Type.STRING, description: "Low, Moderate, or High" },
        insulin_spike_probability: { type: Type.STRING, description: "Low, Moderate, or High" }
      },
      required: ["glycemic_index", "glycemic_load", "classification", "insulin_spike_probability"]
    },
    cardiovascular_risk_report: {
      type: Type.OBJECT,
      properties: {
        heart_health_index: { type: Type.NUMBER },
        sodium_risk: { type: Type.STRING, description: "Low, Moderate, or High" },
        saturated_fat_risk: { type: Type.STRING, description: "Low, Moderate, or High" },
        overall_cardiovascular_risk: { type: Type.STRING, description: "Low, Moderate, or High" }
      },
      required: ["heart_health_index", "sodium_risk", "saturated_fat_risk", "overall_cardiovascular_risk"]
    },
    cognitive_nutrition_report: {
      type: Type.OBJECT,
      properties: {
        brain_support_score: { type: Type.NUMBER },
        omega3_support: { type: Type.STRING, description: "Low, Moderate, or High" },
        b12_support: { type: Type.STRING, description: "Low, Moderate, or High" },
        mental_energy_rating: { type: Type.NUMBER }
      },
      required: ["brain_support_score", "omega3_support", "b12_support", "mental_energy_rating"]
    },
    gut_microbiome_report: {
      type: Type.OBJECT,
      properties: {
        prebiotic_score: { type: Type.NUMBER },
        digestive_friendliness: { type: Type.STRING, description: "Good, Moderate, or Poor" },
        inflammation_risk: { type: Type.STRING, description: "Low, Moderate, or High" }
      },
      required: ["prebiotic_score", "digestive_friendliness", "inflammation_risk"]
    },
    nutrient_deficiency_projection: {
      type: Type.OBJECT,
      properties: {
        iron_deficiency_risk: { type: Type.STRING, description: "Low, Moderate, or High" },
        b12_deficiency_risk: { type: Type.STRING, description: "Low, Moderate, or High" },
        calcium_deficiency_risk: { type: Type.STRING, description: "Low, Moderate, or High" },
        protein_deficiency_risk: { type: Type.STRING, description: "Low, Moderate, or High" }
      },
      required: ["iron_deficiency_risk", "b12_deficiency_risk", "calcium_deficiency_risk", "protein_deficiency_risk"]
    },
    body_composition_projection: {
      type: Type.OBJECT,
      properties: {
        weekly_weight_change_estimate_kg: { type: Type.NUMBER },
        lean_mass_gain_potential: { type: Type.STRING, description: "Low, Moderate, or High" },
        fat_storage_probability: { type: Type.STRING, description: "Low, Moderate, or High" }
      },
      required: ["weekly_weight_change_estimate_kg", "lean_mass_gain_potential", "fat_storage_probability"]
    },
    preventive_health_summary: {
      type: Type.OBJECT,
      properties: {
        overall_health_score: { type: Type.NUMBER },
        top_strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        top_risks: { type: Type.ARRAY, items: { type: Type.STRING } },
        priority_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["overall_health_score", "top_strengths", "top_risks", "priority_recommendations"]
    },
    genetic_sensitivity_simulation: {
      type: Type.OBJECT,
      properties: {
        caffeine_metabolism_assumption: { type: Type.STRING, description: "Fast or Slow" },
        carb_sensitivity_assumption: { type: Type.STRING, description: "Low, Moderate, or High" },
        fat_sensitivity_assumption: { type: Type.STRING, description: "Low, Moderate, or High" },
        personalized_note: { type: Type.STRING }
      },
      required: ["caffeine_metabolism_assumption", "carb_sensitivity_assumption", "fat_sensitivity_assumption", "personalized_note"]
    },
    long_term_diet_trend_analysis: {
      type: Type.OBJECT,
      properties: {
        diabetes_risk_trend: { type: Type.STRING, description: "Stable, Increasing, or Decreasing" },
        cardiovascular_risk_trend: { type: Type.STRING, description: "Stable, Increasing, or Decreasing" },
        metabolic_stability_trend: { type: Type.STRING, description: "Stable, Improving, or Declining" }
      },
      required: ["diabetes_risk_trend", "cardiovascular_risk_trend", "metabolic_stability_trend"]
    },
    hormonal_balance_support_report: {
      type: Type.OBJECT,
      properties: {
        thyroid_support: { type: Type.STRING, description: "Low, Moderate, or High" },
        testosterone_or_estrogen_support: { type: Type.STRING, description: "Low, Moderate, or High" },
        cortisol_balance_support: { type: Type.STRING, description: "Low, Moderate, or High" }
      },
      required: ["thyroid_support", "testosterone_or_estrogen_support", "cortisol_balance_support"]
    },
    skin_health_report: {
      type: Type.OBJECT,
      properties: {
        skin_glow_percentage: { type: Type.NUMBER },
        collagen_support_rating: { type: Type.STRING, description: "Low, Moderate, or High" },
        hydration_support_rating: { type: Type.STRING, description: "Low, Moderate, or High" },
        anti_aging_support_score: { type: Type.NUMBER },
        acne_risk_impact: { type: Type.STRING, description: "Increase, Neutral, or Decrease" },
        glycation_risk_level: { type: Type.STRING, description: "Low, Moderate, or High" },
        dermatological_summary: { type: Type.STRING }
      },
      required: ["skin_glow_percentage", "collagen_support_rating", "hydration_support_rating", "anti_aging_support_score", "acne_risk_impact", "glycation_risk_level", "dermatological_summary"]
    },
    six_month_impact_simulation: {
      type: Type.OBJECT,
      properties: {
        projected_weight_change_kg: { type: Type.NUMBER },
        projected_diabetes_risk_change: { type: Type.STRING, description: "Increase, Stable, or Decrease" },
        projected_heart_risk_change: { type: Type.STRING, description: "Increase, Stable, or Decrease" }
      },
      required: ["projected_weight_change_kg", "projected_diabetes_risk_change", "projected_heart_risk_change"]
    },
    medical_disclaimer: { type: Type.STRING }
  },
  required: ["metabolic_health_report", "glycemic_and_insulin_report", "cardiovascular_risk_report", "cognitive_nutrition_report", "gut_microbiome_report", "nutrient_deficiency_projection", "body_composition_projection", "preventive_health_summary", "genetic_sensitivity_simulation", "long_term_diet_trend_analysis", "hormonal_balance_support_report", "skin_health_report", "six_month_impact_simulation", "medical_disclaimer"]
};

function handleAIError(error: any): never {
  const message = error?.message || String(error);
  const statusMatch = message.match(/\b\d{3}\b/);
  const status = error?.status || error?.statusCode || (statusMatch ? parseInt(statusMatch[0]) : null);

  console.error("AI Service Error Details:", {
    message,
    status,
    originalError: error
  });
  
  // 429: Quota / Rate Limit
  if (status === 429 || message.includes("429") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("exhausted")) {
    throw new Error("The AI service is currently busy or you've reached the usage limit. Please wait about 60 seconds and try again. This is common with free-tier API keys during peak times.");
  }
  
  // 401/403: Authentication / API Key
  if (status === 401 || status === 403 || message.includes("401") || message.includes("403") || message.toLowerCase().includes("api key") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("invalid_argument")) {
    throw new Error("Connection failed: The API key appears to be missing or invalid. Please ensure GEMINI_API_KEY is correctly set in your environment variables.");
  }

  // Safety / Content Blocked
  if (message.toLowerCase().includes("safety") || message.toLowerCase().includes("blocked") || message.toLowerCase().includes("candidate was blocked") || message.toLowerCase().includes("finish_reason_safety")) {
    throw new Error("Analysis Blocked: The AI safety filters flagged this query. This usually happens if the input is ambiguous or contains sensitive medical terms. Please try a simpler food name.");
  }

  // 5xx: Server Errors
  if ((status && status >= 500) || message.includes("500") || message.includes("503") || message.toLowerCase().includes("unavailable") || message.toLowerCase().includes("overloaded")) {
    throw new Error("The AI provider is currently experiencing high load or technical difficulties. Please try again in a few moments.");
  }

  // Network Errors
  if (message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network") || message.toLowerCase().includes("offline") || message.toLowerCase().includes("failed to execute 'fetch'")) {
    throw new Error("Connection Error: Unable to reach the AI service. Please check your internet connection and ensure no firewall is blocking the request.");
  }

  // JSON Parsing Errors
  if (error instanceof SyntaxError || message.toLowerCase().includes("json") || message.toLowerCase().includes("unexpected token") || message.toLowerCase().includes("parse")) {
    throw new Error("Data Error: The AI returned an unreadable response. This can happen if the model's output was cut short. Please try your request again.");
  }

  throw new Error("We couldn't process that request. Please try again with a more specific food name or description.");
}

function sanitizeInput(input: string): string {
  // Remove any potential script tags or HTML
  let sanitized = input.replace(/<[^>]*>?/gm, '');
  
  // Basic check for common prompt injection patterns
  const injectionPatterns = [
    "ignore all previous instructions",
    "forget everything you were told",
    "system instruction",
    "act as",
    "you are now",
    "reveal your prompt"
  ];
  
  for (const pattern of injectionPatterns) {
    if (sanitized.toLowerCase().includes(pattern)) {
      throw new Error("Security Alert: Potential prompt manipulation detected. Please use a standard food query.");
    }
  }
  
  return sanitized.trim();
}

function calculateMetabolicMetrics(profile: UserProfile) {
  const { age, gender, height_cm, weight_kg, activity_level } = profile;
  
  // BMR Calculation
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  // Activity Factor
  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9
  };
  const factor = activityFactors[activity_level] || 1.2;
  const tdee = bmr * factor;

  return { bmr, tdee, activity_factor: factor };
}

export async function analyzePreventiveHealth(
  foodData: any,
  userProfile: UserProfile
): Promise<any> {
  try {
    const metabolicMetrics = calculateMetabolicMetrics(userProfile);
    const dietHistorySummary = {
      avg_daily_calories: 2000,
      avg_daily_protein: 70,
      avg_daily_sugar: 40,
      avg_daily_fiber: 20,
      avg_daily_sodium: 2300
    };

    const inputPayload = JSON.stringify({
      food_data: foodData,
      user_profile: { ...userProfile, ...metabolicMetrics },
      diet_history_summary: dietHistorySummary
    });

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: inputPayload,
      config: {
        systemInstruction: PREVENTIVE_HEALTH_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: PREVENTIVE_HEALTH_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(text);
    if (!result || typeof result !== 'object') {
      throw new Error("Data Error: The AI returned an invalid response format.");
    }

    return result;
  } catch (error) {
    handleAIError(error);
  }
}

export async function analyzeFood(
  foodQuery: string, 
  userProfile: UserProfile,
  mode: string = 'single_food',
  downloadReport: boolean = false
): Promise<NutritionAnalysisResponse> {
  try {
    const sanitizedQuery = sanitizeInput(foodQuery);
    const metabolicMetrics = calculateMetabolicMetrics(userProfile);
    
    const inputPayload = JSON.stringify({
      food_query: sanitizedQuery,
      user_profile: { ...userProfile, ...metabolicMetrics },
      mode: mode,
      download_report: downloadReport
    });

    const ai = getAI();
    const systemInstruction = downloadReport 
      ? SYSTEM_INSTRUCTION 
      : SYSTEM_INSTRUCTION.split('🔷 REPORT GENERATION RULES')[0] + "\nDo NOT generate any HTML or print-ready reports.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: inputPayload,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: NUTRITION_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(text);
    if (!result || typeof result !== 'object') {
      throw new Error("Data Error: The AI returned an invalid response format.");
    }

    return result as NutritionAnalysisResponse;
  } catch (error) {
    handleAIError(error);
  }
}

export async function generateAudioSummary(text: string): Promise<string> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly and professionally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data generated");
    }

    // Gemini TTS returns raw 24kHz 16-bit mono PCM.
    // Add a WAV header so the browser can play it easily.
    const pcmData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
    const wavData = addWavHeader(pcmData, 24000);
    
    // Convert back to base64
    let binary = '';
    const len = wavData.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(wavData[i]);
    }
    return window.btoa(binary);
  } catch (error) {
    handleAIError(error);
  }
}

function addWavHeader(pcmData: Uint8Array, sampleRate: number): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  const result = new Uint8Array(44 + pcmData.length);
  result.set(new Uint8Array(header), 0);
  result.set(pcmData, 44);
  return result;
}

export async function quickScanFood(foodName: string): Promise<any> {
  try {
    const sanitizedName = sanitizeInput(foodName);
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Quickly estimate calories and main macros for: ${sanitizedName}. Return JSON: {calories, carbs, protein, fat}.`,
      config: {
        systemInstruction: "You are a nutrition assistant. Return JSON only.",
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    const text = response.text;
    const result = JSON.parse(text || "{}");
    if (!result || typeof result !== 'object') {
      return null;
    }
    return result;
  } catch (error) {
    try {
      handleAIError(error);
    } catch (e: any) {
      console.error("Quick scan error:", e.message);
    }
    return null;
  }
}
