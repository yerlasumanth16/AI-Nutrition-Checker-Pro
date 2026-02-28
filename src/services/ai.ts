import { GoogleGenAI, Modality, Type } from "@google/genai";
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

🔷 CORE SCIENTIFIC CALCULATIONS (Internal Reasoning)
1️⃣ Calculate BMR using:
Male: BMR = 10W + 6.25H − 5A + 5
Female: BMR = 10W + 6.25H − 5A − 161

2️⃣ Multiply by activity factor:
Sedentary: 1.2
Light: 1.375
Moderate: 1.55
Active: 1.725
Athlete: 1.9

3️⃣ Compare food calories with user’s daily need.

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

CORE CALCULATIONS (INTERNAL LOGIC)
1️⃣ Basal Metabolic Rate
Male: BMR = 10W + 6.25H − 5A + 5
Female: BMR = 10W + 6.25H − 5A − 161

2️⃣ Total Daily Energy Expenditure
TDEE = BMR × Activity Factor
Sedentary 1.2, Light 1.375, Moderate 1.55, Active 1.725, Athlete 1.9

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

function handleAIError(error: any): never {
  console.error("AI Service Error:", error);
  
  const message = error?.message || String(error);
  const status = error?.status || error?.statusCode || (message.match(/\b\d{3}\b/) ? parseInt(message.match(/\b\d{3}\b/)[0]) : null);
  
  // 429: Quota / Rate Limit
  if (status === 429 || message.includes("429") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("rate limit")) {
    throw new Error("API quota exceeded. Please wait a moment before trying again, or check your API plan limits.");
  }
  
  // 401/403: Authentication / API Key
  if (status === 401 || status === 403 || message.includes("401") || message.includes("403") || message.toLowerCase().includes("api key") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("forbidden")) {
    throw new Error("Authentication failed. Please verify that your API key is valid and has the necessary permissions.");
  }

  // Safety / Content Blocked
  if (message.toLowerCase().includes("safety") || message.toLowerCase().includes("blocked") || message.toLowerCase().includes("candidate was blocked")) {
    throw new Error("The request was filtered for safety reasons. Please try a different food description or query.");
  }

  // 5xx: Server Errors
  if ((status && status >= 500) || message.includes("500") || message.includes("503") || message.toLowerCase().includes("unavailable") || message.toLowerCase().includes("overloaded")) {
    throw new Error("The AI service is currently overloaded or unavailable. Please try again in a few seconds.");
  }

  // Network Errors
  if (message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network") || message.toLowerCase().includes("offline")) {
    throw new Error("Network error detected. Please check your internet connection and try again.");
  }

  throw new Error("We encountered an issue while analyzing your request. Please try again with a more specific food name.");
}

export async function analyzePreventiveHealth(
  foodData: any,
  userProfile: UserProfile
): Promise<any> {
  try {
    const dietHistorySummary = {
      avg_daily_calories: 2000,
      avg_daily_protein: 70,
      avg_daily_sugar: 40,
      avg_daily_fiber: 20,
      avg_daily_sodium: 2300
    };

    const inputPayload = JSON.stringify({
      food_data: foodData,
      user_profile: userProfile,
      diet_history_summary: dietHistorySummary
    });

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: inputPayload,
      config: {
        systemInstruction: PREVENTIVE_HEALTH_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text);
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
    const inputPayload = JSON.stringify({
      food_query: foodQuery,
      user_profile: userProfile,
      mode: mode,
      download_report: downloadReport
    });

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: inputPayload,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as NutritionAnalysisResponse;
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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Quickly estimate calories and main macros for: ${foodName}. Return JSON: {calories, carbs, protein, fat}.`,
      config: {
        systemInstruction: "You are a nutrition assistant. Return JSON only.",
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    try {
      handleAIError(error);
    } catch (e: any) {
      console.error("Quick scan error:", e.message);
    }
    return null;
  }
}
