"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Search, Loader2, AlertCircle, CheckCircle2, ChevronRight, Apple, Flame, Zap, 
  Droplets, Info, Camera, Upload, X, FileText, Download, Activity, Heart, 
  ShieldAlert, Brain, TrendingUp, Utensils, LayoutDashboard, History, 
  MessageSquare, Settings, Target, Calendar, BarChart3, PieChart as PieChartIcon,
  User, ArrowUpRight, ArrowDownRight, Scale, Dumbbell, Timer, Plus, Trash2,
  ChevronDown, ChevronUp, Info as InfoIcon, RefreshCw, Save, ShoppingCart,
  Moon, Trophy, Users, Mic, Coffee, Sparkles, ArrowLeftRight, ListTodo
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  Legend, LineChart, Line, CartesianGrid, AreaChart, Area, ComposedChart
} from "recharts";
import { AnalysisResult, HealthGoal, UserProfile, Workout, ActivityLevel, Gender, DailyMealPlan, HydrationLog, HabitLog, SleepLog, CommunityPost } from "./types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'dashboard' | 'analytics' | 'assistant' | 'history' | 'profile' | 'workouts' | 'planner' | 'habits' | 'community'>('analysis');
  const [activeMode, setActiveMode] = useState<'diet' | 'gym'>('diet');
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<DailyMealPlan[]>([]);
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cache, setCache] = useState<Record<string, AnalysisResult>>({});
  
  const userGoal = profile?.goal || 'balanced';
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
    const savedCache = localStorage.getItem('nutrition_cache');
    if (savedCache) {
      try {
        setCache(JSON.parse(savedCache));
      } catch (e) {
        console.error("Failed to load cache");
      }
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Save cache to localStorage
  useEffect(() => {
    if (Object.keys(cache).length > 0) {
      localStorage.setItem('nutrition_cache', JSON.stringify(cache));
    }
  }, [cache]);

  // Load history, workouts, and profile from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('nutrition_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
    const savedWorkouts = localStorage.getItem('fitness_workouts');
    if (savedWorkouts) {
      try {
        setWorkouts(JSON.parse(savedWorkouts));
      } catch (e) {
        console.error("Failed to load workouts");
      }
    }
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to load profile");
      }
    }
    const savedMode = localStorage.getItem('active_mode') as 'diet' | 'gym';
    if (savedMode) setActiveMode(savedMode);

    const savedMealPlans = localStorage.getItem('meal_plans');
    if (savedMealPlans) setMealPlans(JSON.parse(savedMealPlans));
    
    const savedHydration = localStorage.getItem('hydration_logs');
    if (savedHydration) setHydrationLogs(JSON.parse(savedHydration));
    
    const savedHabits = localStorage.getItem('habit_logs');
    if (savedHabits) setHabitLogs(JSON.parse(savedHabits));
    
    const savedSleep = localStorage.getItem('sleep_logs');
    if (savedSleep) setSleepLogs(JSON.parse(savedSleep));
    
    const savedPosts = localStorage.getItem('community_posts');
    if (savedPosts) setCommunityPosts(JSON.parse(savedPosts));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('nutrition_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('fitness_workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    if (profile) localStorage.setItem('user_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('active_mode', activeMode);
  }, [activeMode]);

  useEffect(() => {
    localStorage.setItem('meal_plans', JSON.stringify(mealPlans));
  }, [mealPlans]);

  useEffect(() => {
    localStorage.setItem('hydration_logs', JSON.stringify(hydrationLogs));
  }, [hydrationLogs]);

  useEffect(() => {
    localStorage.setItem('habit_logs', JSON.stringify(habitLogs));
  }, [habitLogs]);

  useEffect(() => {
    localStorage.setItem('sleep_logs', JSON.stringify(sleepLogs));
  }, [sleepLogs]);

  useEffect(() => {
    localStorage.setItem('community_posts', JSON.stringify(communityPosts));
  }, [communityPosts]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const predictGoal = useMemo(() => {
    if (!profile) return null;
    const weightDiff = profile.goal === 'weight-loss' ? 5 : -5; // Example: target 5kg change
    const dailyDeficit = profile.tdee - profile.calorieTarget;
    if (Math.abs(dailyDeficit) < 50) return { weeks: 0, message: "Maintenance mode" };
    
    const totalCaloriesNeeded = Math.abs(weightDiff * 7700); // 7700 kcal per kg
    const days = totalCaloriesNeeded / Math.abs(dailyDeficit);
    const weeks = Math.ceil(days / 7);
    
    return {
      weeks,
      message: `Estimated ${weeks} weeks to ${profile.goal === 'weight-loss' ? 'lose' : 'gain'} 5kg at current pace.`
    };
  }, [profile]);
  const dailyStats = useMemo(() => {
    const defaultStats = { 
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0,
      potassium: 0, calcium: 0, iron: 0, magnesium: 0, caloriesBurned: 0
    };
    if (!mounted) return defaultStats;
    
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = history.filter(m => m.timestamp.startsWith(today));
    const todayWorkouts = workouts.filter(w => w.timestamp.startsWith(today));
    
    const stats = { ...defaultStats };

    todayMeals.forEach(meal => {
      meal.macronutrients.forEach(m => {
        const name = m.name.toLowerCase();
        if (name.includes('calories')) stats.calories += m.value;
        if (name.includes('protein')) stats.protein += m.value;
        if (name.includes('carbohydrates')) stats.carbs += m.value;
        if (name.includes('fat') && !name.includes('saturated')) stats.fat += m.value;
        if (name.includes('fiber')) stats.fiber += m.value;
        if (name.includes('sugar')) stats.sugar += m.value;
      });
      meal.micronutrients.forEach(m => {
        const name = m.name.toLowerCase();
        if (name.includes('sodium')) stats.sodium += m.value;
        if (name.includes('potassium')) stats.potassium += m.value;
        if (name.includes('calcium')) stats.calcium += m.value;
        if (name.includes('iron')) stats.iron += m.value;
        if (name.includes('magnesium')) stats.magnesium += m.value;
      });
    });

    todayWorkouts.forEach(workout => {
      stats.caloriesBurned += workout.caloriesBurned;
    });

    return stats;
  }, [history, workouts, mounted]);

  const calculateProfile = (data: { age: number, gender: Gender, height: number, weight: number, activityLevel: ActivityLevel, goal: HealthGoal }) => {
    const { age, gender, height, weight, activityLevel, goal } = data;
    
    // BMI
    const bmi = weight / ((height / 100) ** 2);
    
    // BMR (Mifflin-St Jeor Equation)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;
    
    // TDEE
    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, heavy: 1.725 };
    const tdee = bmr * multipliers[activityLevel];
    
    // Calorie Target
    let calorieTarget = tdee;
    if (goal === 'weight-loss') calorieTarget -= 500;
    if (goal === 'muscle-gain') calorieTarget += 300;
    
    // Macro Targets
    let proteinRatio = 0.25;
    let carbRatio = 0.45;
    let fatRatio = 0.30;
    
    if (activeMode === 'gym') {
      proteinRatio = 0.35;
      carbRatio = 0.45;
      fatRatio = 0.20;
    } else if (goal === 'weight-loss') {
      proteinRatio = 0.40;
      carbRatio = 0.30;
      fatRatio = 0.30;
    }
    
    const macroTargets = {
      protein: Math.round((calorieTarget * proteinRatio) / 4),
      carbs: Math.round((calorieTarget * carbRatio) / 4),
      fat: Math.round((calorieTarget * fatRatio) / 9),
    };
    
    return { ...data, bmi, bmr, tdee, calorieTarget, macroTargets };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage({
        data: reader.result as string,
        mimeType: file.type,
      });
      setQuery(""); 
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() && !image) return;
    
    setLoading(true);
    setError(null);
    setAnalysis(null);

    // Check cache
    const cacheKey = image ? `img_${image.data.substring(0, 100)}` : `query_${query.trim().toLowerCase()}`;
    if (cache[cacheKey]) {
      setAnalysis(cache[cacheKey]);
      setHistory(prev => [cache[cacheKey], ...prev.filter(h => h.id !== cache[cacheKey].id)]);
      setLoading(false);
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is not configured.");

      const ai = new GoogleGenAI({ apiKey });
      const isUrl = query.startsWith("http");
      const prompt = `
Analyze the following food item or image and return a comprehensive professional health-analysis diagnostic report in ONLY valid JSON format.
The report must feel like a clinical nutrition document.

User Profile:
- Age: ${profile?.age || 'N/A'}
- Gender: ${profile?.gender || 'N/A'}
- Weight: ${profile?.weight || 'N/A'}kg
- Goal: ${profile?.goal || 'balanced'}
- Mode: ${activeMode.toUpperCase()}

The user's current health goal is: ${profile?.goal || 'balanced'}. 
Current Mode: ${activeMode === 'gym' ? 'GYM/FITNESS (Focus on protein, recovery, muscle gain)' : 'DIET/HEALTH (Focus on weight loss, sugar/sodium control, fiber)'}.
Tailor the analysis, risks, and suggestions to this specific context.

Required JSON structure:
{
  "foodName": string (e.g., "Grilled Salmon with Quinoa and Steamed Broccoli"),
  "portionEstimation": string (e.g., "150g salmon, 100g quinoa, 80g broccoli"),
  "analysisDate": string (ISO format),
  "nutritionScore": { 
    "score": number (0-100), 
    "level": string (Excellent, Good, Moderate, Poor),
    "explanation": string (Why this score was given)
  },
  "macronutrients": [
    { "name": string, "value": number, "unit": string, "rdi": number, "percentage": number, "status": string (Optimal, High, Low) }
  ],
  "micronutrients": [
    { "name": string, "value": number, "unit": string, "rdi": number, "percentage": number, "status": string (Optimal, High, Low) }
  ],
  "risks": [
    { "name": string, "explanation": string, "severity": string (Low, Moderate, High, Critical), "consequences": string }
  ],
  "metabolicImpact": {
    "glycemicImpact": string,
    "energyDensity": string,
    "metabolicLoad": string,
    "nutrientDensityScore": number,
    "analysis": string
  },
  "healthInsights": {
    "weightManagement": string,
    "muscleBuilding": string,
    "heartHealth": string,
    "diabetesSuitability": string,
    "fitnessCompatibility": string
  },
  "clinicalSummary": string,
  "expertFeatures": {
    "mealRating": string,
    "classification": string,
    "longTermImpact": string,
    "suggestions": string[],
    "alternatives": string[]
  }
}

Nutrients to include:
- Macronutrients: Calories, Protein, Carbohydrates, Total Fat, Saturated Fat, Fiber, Sugar.
- Micronutrients: Sodium, Potassium, Calcium, Iron, Magnesium, Zinc, Vitamin A, Vitamin B complex, Vitamin C, Vitamin D, Vitamin K.

For each nutrient, provide the actual value, RDI (Recommended Daily Intake), percentage of RDI, and interpretation (Low, Optimal, High).
Detect possible health risks (e.g., high sodium -> hypertension risk, high sugar -> diabetes risk).
Calculate a Nutrition Quality Score (0-100) based on nutrient balance, density, and quality.
Generate professional health insights on energy levels, heart health, and goal suitability.
Provide diet improvement suggestions and healthier alternatives.

${isUrl ? `Image URL: ${query}` : query ? `Food Item: ${query}` : "Analyze the provided image."}

Do not add explanations outside the JSON.
Return only pure JSON.
`;

      const parts: any[] = [{ text: prompt }];
      if (image) {
        parts.push({
          inlineData: {
            data: image.data.split(",")[1],
            mimeType: image.mimeType,
          },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      let result: AnalysisResult;
      try {
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        result = JSON.parse(cleanedText);
        result.id = Math.random().toString(36).substr(2, 9);
        result.timestamp = new Date().toISOString();
        result.goalContext = userGoal;
      } catch (e) {
        throw new Error("Failed to parse nutritional data");
      }

      setAnalysis(result);
      setHistory(prev => [result, ...prev].slice(0, 15));
      setCache(prev => ({ ...prev, [cacheKey]: result }));
    } catch (err: any) {
      setError(err.message || "Something went wrong during analysis");
    } finally {
      setLoading(false);
    }
  };

  const generateMealPlan = async () => {
    if (!profile) {
      setError("Please complete your profile first to generate a personalized meal plan.");
      setActiveTab('profile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is not configured.");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
Generate a 1-day personalized meal plan based on the following user profile:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Weight: ${profile.weight}kg
- Height: ${profile.height}cm
- Goal: ${profile.goal}
- Activity Level: ${profile.activityLevel}
- Calorie Target: ${profile.calorieTarget} kcal
- Macro Targets: Protein ${profile.macroTargets.protein}g, Carbs ${profile.macroTargets.carbs}g, Fat ${profile.macroTargets.fat}g
- Mode: ${activeMode.toUpperCase()}

The plan should include Breakfast, Lunch, Dinner, and 2 Snacks.
For each meal, provide:
- name
- calories
- protein
- carbs
- fat
- ingredients (list of strings)
- alternatives (list of strings)

Return ONLY valid JSON in this format:
{
  "date": "${new Date().toISOString().split('T')[0]}",
  "breakfast": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[], "alternatives": string[] },
  "lunch": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[], "alternatives": string[] },
  "dinner": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[], "alternatives": string[] },
  "snacks": [
    { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[], "alternatives": string[] }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }] },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const newPlan: DailyMealPlan = JSON.parse(cleanedText);
      
      setMealPlans(prev => {
        const filtered = prev.filter(p => p.date !== newPlan.date);
        return [newPlan, ...filtered];
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate meal plan");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key missing");

      const ai = new GoogleGenAI({ apiKey });
      
      // Provide context from current analysis if available
      const context = analysis ? `Current meal being discussed: ${analysis.foodName}. Nutrition Score: ${analysis.nutritionScore.score}. Summary: ${analysis.clinicalSummary}` : "No specific meal is currently being analyzed.";
      
      const prompt = `
You are a professional AI Nutrition & Fitness Coach. 
Context: ${context}
User Profile: ${JSON.stringify(profile)}
Current Mode: ${activeMode.toUpperCase()}
User History Summary: ${history.length} meals tracked recently. Total calories today: ${dailyStats.calories}. Calories burned today: ${dailyStats.caloriesBurned}.

Answer the user's question accurately and professionally. Provide specific advice based on their goal (${profile?.goal}) and mode (${activeMode}).
User: ${userMsg}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: prompt }],
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI assistant." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const generatePDF = () => {
    if (!analysis) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Page 1: Clinical Header
    doc.setFillColor(15, 23, 42); // Dark slate
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("NutriAI Clinical Nutrition Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Patient Profile: ${profile ? `${profile.gender.toUpperCase()}, ${profile.age}y, ${profile.weight}kg` : 'Guest User'}`, 14, 32);
    doc.text(`Primary Health Goal: ${profile?.goal.replace('-', ' ').toUpperCase() || userGoal.replace('-', ' ').toUpperCase()}`, 14, 38);
    
    if (profile) {
      doc.text(`BMI: ${profile.bmi.toFixed(1)} | BMR: ${Math.round(profile.bmr)} | TDEE: ${Math.round(profile.tdee)}`, 14, 44);
      doc.text(`Daily Calorie Target: ${Math.round(profile.calorieTarget)} kcal`, 14, 50);
    }
    
    doc.setTextColor(148, 163, 184);
    doc.text(`Report ID: ${analysis.id.toUpperCase()}`, pageWidth - 14, 22, { align: "right" });
    doc.text(`Analysis Date: ${new Date(analysis.timestamp).toLocaleString()}`, pageWidth - 14, 32, { align: "right" });

    // Subject Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Subject: ${analysis.foodName}`, 14, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Portion Estimation: ${analysis.portionEstimation || "Standard Serving"}`, 14, 66);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 72, pageWidth - 14, 72);

    // Macronutrients Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. Macronutrient Profile", 14, 85);
    
    const macroData = analysis.macronutrients.map((m: any) => [
      m.name,
      `${m.value} ${m.unit}`,
      `${m.rdi} ${m.unit}`,
      `${m.percentage}%`,
      m.status
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Nutrient', 'Measured Value', 'RDI', '% Daily Value', 'Interpretation']],
      body: macroData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Micronutrients Table
    const microY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. Micronutrient Profile", 14, microY);
    
    const microData = analysis.micronutrients.map((m: any) => [
      m.name,
      `${m.value} ${m.unit}`,
      `${m.rdi} ${m.unit}`,
      `${m.percentage}%`,
      m.status
    ]);

    autoTable(doc, {
      startY: microY + 5,
      head: [['Nutrient', 'Measured Value', 'RDI', '% Daily Value', 'Interpretation']],
      body: microData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    // Page 2: Diagnostic Insights
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("Diagnostic Insights & Health Risk Assessment", 14, 16);

    doc.setTextColor(15, 23, 42);
    
    // Nutrition Score Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. Nutrition Quality Score", 14, 40);
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 45, pageWidth - 28, 25, 3, 3, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129);
    doc.text(`${analysis.nutritionScore.score}/100`, 20, 62);
    
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text(`Rating: ${analysis.nutritionScore.level}`, 70, 55);
    doc.setFontSize(9);
    const scoreExp = doc.splitTextToSize(analysis.nutritionScore.explanation || "Comprehensive evaluation based on nutrient density and balance.", pageWidth - 100);
    doc.text(scoreExp, 70, 62);

    // Risks Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("4. Health Risk Assessment", 14, 85);
    
    const riskData = analysis.risks.map((r: any) => [
      r.name,
      r.severity,
      r.explanation,
      r.consequences
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Risk Factor', 'Severity', 'Explanation', 'Implications']],
      body: riskData,
      theme: 'plain',
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      columnStyles: { 2: { cellWidth: 60 }, 3: { cellWidth: 60 } }
    });

    // Metabolic Impact
    const metabolicY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("5. Metabolic Impact Summary", 14, metabolicY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Key Indicators:", 14, metabolicY + 8);
    doc.setFont("helvetica", "normal");
    doc.text(`Glycemic Impact: ${analysis.metabolicImpact.glycemicImpact}`, 14, metabolicY + 14);
    doc.text(`Energy Density: ${analysis.metabolicImpact.energyDensity}`, 14, metabolicY + 20);
    doc.text(`Nutrient Density Score: ${analysis.metabolicImpact.nutrientDensityScore}/100`, 14, metabolicY + 26);
    
    doc.setFontSize(9);
    const splitMetabolic = doc.splitTextToSize(analysis.metabolicImpact.analysis, pageWidth - 28);
    doc.text(splitMetabolic, 14, metabolicY + 34);

    // AI Health Insights
    const insightsY = metabolicY + 65;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("6. AI Health Insights", 14, insightsY);
    
    const insightData = [
      ["Weight Management", analysis.healthInsights.weightManagement],
      ["Muscle Building", analysis.healthInsights.muscleBuilding],
      ["Heart Health", analysis.healthInsights.heartHealth],
      ["Diabetes Suitability", analysis.healthInsights.diabetesSuitability]
    ];

    autoTable(doc, {
      startY: insightsY + 5,
      body: insightData,
      theme: 'grid',
      styles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    // Recommendations
    const recY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("7. Dietary Recommendations", 14, recY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const suggestions = analysis.expertFeatures.suggestions.join(", ");
    const splitSuggestions = doc.splitTextToSize(`Improvement Suggestions: ${suggestions}`, pageWidth - 28);
    doc.text(splitSuggestions, 14, recY + 8);
    
    const alternatives = analysis.expertFeatures.alternatives.join(", ");
    const splitAlternatives = doc.splitTextToSize(`Healthier Alternatives: ${alternatives}`, pageWidth - 28);
    doc.text(splitAlternatives, 14, recY + 20);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Confidential Clinical Nutrition Report | Generated by NutriAI Platform", pageWidth / 2, pageHeight - 10, { align: "center" });

    doc.save(`NutriAI_Report_${analysis.foodName.replace(/\s+/g, '_')}.pdf`);
  };

  const macroChartData = analysis?.macronutrients?.map((m: any) => ({
    name: m.name,
    value: m.value,
    percentage: m.percentage
  })) || [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const ProfileSetup = () => {
    const [formData, setFormData] = useState({
      age: profile?.age || 25,
      gender: profile?.gender || 'male' as Gender,
      height: profile?.height || 175,
      weight: profile?.weight || 70,
      activityLevel: profile?.activityLevel || 'moderate' as ActivityLevel,
      goal: profile?.goal || 'balanced' as HealthGoal
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newProfile = calculateProfile(formData);
      setProfile({
        ...newProfile,
        points: profile?.points || 0,
        badges: profile?.badges || [],
        streak: profile?.streak || 0
      });
      setActiveTab('dashboard');
    };

    return (
      <div className="max-w-2xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <User className="text-emerald-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Health Profile</h2>
            <p className="text-sm text-zinc-500">Configure your body metrics for personalized targets.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Age</label>
            <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Gender</label>
            <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Height (cm)</label>
            <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: parseInt(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Weight (kg)</label>
            <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Activity Level</label>
            <select value={formData.activityLevel} onChange={e => setFormData({...formData, activityLevel: e.target.value as ActivityLevel})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors">
              <option value="sedentary">Sedentary (Office job)</option>
              <option value="light">Light (1-2 days/week)</option>
              <option value="moderate">Moderate (3-5 days/week)</option>
              <option value="heavy">Heavy (6-7 days/week)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Fitness Goal</label>
            <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value as HealthGoal})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors">
              <option value="weight-loss">Weight Loss</option>
              <option value="muscle-gain">Muscle Gain</option>
              <option value="balanced">Balanced / Maintenance</option>
              <option value="heart-health">Heart Health</option>
              <option value="diabetes">Blood Sugar Control</option>
            </select>
          </div>
          <button type="submit" className="md:col-span-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            Save Profile & Calculate Targets
          </button>
        </form>
      </div>
    );
  };

  const DeficiencyDetector = () => {
    const trendData = getTrendData(history, workouts, mounted);
    const avgFiber = trendData.reduce((acc, curr) => acc + curr.fiber, 0) / 7;
    const avgProtein = trendData.reduce((acc, curr) => acc + curr.protein, 0) / 7;
    const avgSugar = trendData.reduce((acc, curr) => acc + curr.sugar, 0) / 7;

    const deficiencies = [];
    if (avgFiber < 25) deficiencies.push({ name: "Fiber", status: "Low", tip: "Add more legumes, whole grains, and leafy greens." });
    if (avgProtein < (profile?.macroTargets.protein || 100) * 0.8) deficiencies.push({ name: "Protein", status: "Low", tip: "Increase intake of lean meats, eggs, or plant-based proteins." });
    if (avgSugar > 50) deficiencies.push({ name: "Sugar", status: "High", tip: "Reduce processed foods and sugary beverages." });

    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-orange-500" />
          <h3 className="text-xl font-bold text-white">Nutrition Deficiency Detector</h3>
        </div>
        <div className="space-y-4">
          {deficiencies.length > 0 ? deficiencies.map((d, i) => (
            <div key={i} className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 flex gap-4">
              <div className={`w-1.5 h-12 rounded-full shrink-0 ${d.status === 'High' ? 'bg-red-500' : 'bg-orange-500'}`} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{d.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 uppercase ${d.status === 'High' ? 'text-red-500' : 'text-orange-500'}`}>{d.status}</span>
                </div>
                <p className="text-xs text-zinc-500">{d.tip}</p>
              </div>
            </div>
          )) : (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-emerald-500 font-bold">Optimal Nutrition Detected!</p>
              <p className="text-xs text-zinc-400 mt-1">Your weekly averages look great.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [speaking, setSpeaking] = useState(false);

    const startListening = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice recognition not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        await handleVoiceQuery(text);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    };

    const handleVoiceQuery = async (query: string) => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API key missing");
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `You are a helpful health assistant. Answer this query concisely: ${query}`,
          config: { systemInstruction: "Keep answers under 50 words." }
        });
        const reply = res.text || "I couldn't process that.";
        setResponse(reply);
        speak(reply);
      } catch (e) {
        console.error(e);
      }
    };

    const speak = (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center relative">
          {isListening && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-emerald-500 rounded-full" />}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-emerald-500'}`}>
            <Mic className="w-8 h-8" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Voice Assistant</h3>
          <p className="text-sm text-zinc-500">Ask me anything about your nutrition or fitness.</p>
        </div>
        <button 
          onClick={startListening} 
          disabled={isListening || speaking}
          className="px-8 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all disabled:opacity-50"
        >
          {isListening ? "Listening..." : speaking ? "Speaking..." : "Start Conversation"}
        </button>
        {(transcript || response) && (
          <div className="w-full space-y-4 pt-6 border-t border-zinc-800 text-left">
            {transcript && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">You said</p>
                <p className="text-sm text-white italic">"{transcript}"</p>
              </div>
            )}
            {response && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">AI Coach</p>
                <p className="text-sm text-zinc-300">{response}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const FoodComparison = () => {
    const [food1, setFood1] = useState("");
    const [food2, setFood2] = useState("");
    const [comparison, setComparison] = useState<any>(null);
    const [comparing, setComparing] = useState(false);

    const handleCompare = async () => {
      if (!food1 || !food2) return;
      setComparing(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API key missing");
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Compare ${food1} vs ${food2}. Provide calories, protein, carbs, fat, and a health score (0-100) for each. Also give a recommendation on which is better for ${profile?.goal || 'balanced diet'}. Return ONLY JSON: { "food1": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "score": number }, "food2": { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "score": number }, "recommendation": string }`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { parts: [{ text: prompt }] } });
        const text = response.text;
        if (text) {
          const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
          setComparison(JSON.parse(cleanedText));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setComparing(false);
      }
    };

    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
            <ArrowLeftRight className="text-orange-500 w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Food Comparison</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={food1} onChange={e => setFood1(e.target.value)} placeholder="Food 1 (e.g. Chicken Breast)" className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none" />
          <input value={food2} onChange={e => setFood2(e.target.value)} placeholder="Food 2 (e.g. Paneer)" className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none" />
        </div>
        <button onClick={handleCompare} disabled={comparing} className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-400 transition-all flex items-center justify-center gap-2">
          {comparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Compare Foods
        </button>

        {comparison && (
          <div className="space-y-6 pt-6 border-t border-zinc-800">
            <div className="grid grid-cols-2 gap-8">
              {[comparison.food1, comparison.food2].map((f, i) => (
                <div key={i} className="space-y-4">
                  <div className="text-center">
                    <p className="font-bold text-white text-lg">{f.name}</p>
                    <p className="text-3xl font-black text-emerald-500">{f.score}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">Health Score</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-zinc-500">Calories</span><span className="text-white">{f.calories}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-zinc-500">Protein</span><span className="text-white">{f.protein}g</span></div>
                    <div className="flex justify-between text-xs"><span className="text-zinc-500">Carbs</span><span className="text-white">{f.carbs}g</span></div>
                    <div className="flex justify-between text-xs"><span className="text-zinc-500">Fat</span><span className="text-white">{f.fat}g</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-500 uppercase mb-1">AI Recommendation</p>
              <p className="text-sm text-zinc-300 italic">"{comparison.recommendation}"</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  const CommunityView = () => {
    const [postContent, setPostContent] = useState("");

    const addPost = () => {
      if (!postContent.trim()) return;
      const newPost: CommunityPost = {
        id: Math.random().toString(36).substr(2, 9),
        userId: 'current-user',
        userName: profile?.gender === 'male' ? 'John Doe' : 'Jane Doe',
        content: postContent,
        timestamp: new Date().toISOString(),
        likes: 0
      };
      setCommunityPosts([newPost, ...communityPosts]);
      setPostContent("");
    };

    return (
      <div className="space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">Health <span className="text-emerald-500">Community</span></h1>
          <p className="text-zinc-400">Share your progress and connect with others.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-4">
              <textarea 
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="Share your meal or workout progress..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all resize-none h-32"
              />
              <div className="flex justify-between items-center">
                <button className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-all">
                  <Camera className="w-5 h-5" />
                </button>
                <button onClick={addPost} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all">Post</button>
              </div>
            </div>

            <div className="space-y-6">
              {communityPosts.map(post => (
                <div key={post.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{post.userName}</p>
                      <p className="text-[10px] text-zinc-500">{new Date(post.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-6 pt-4 border-t border-zinc-800">
                    <button className="flex items-center gap-2 text-zinc-500 hover:text-emerald-500 transition-all">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-all">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs">Comment</span>
                    </button>
                  </div>
                </div>
              ))}
              {communityPosts.length === 0 && (
                <div className="text-center py-12 text-zinc-500 italic">No posts yet. Be the first to share!</div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-bold text-white">Leaderboard</h3>
              <div className="space-y-4">
                {[
                  { name: 'Alex M.', points: 1250, rank: 1 },
                  { name: 'Sarah K.', points: 1100, rank: 2 },
                  { name: 'Mike R.', points: 950, rank: 3 },
                  { name: 'You', points: profile?.points || 0, rank: 4 }
                ].map(user => (
                  <div key={user.name} className={`flex items-center justify-between p-3 rounded-xl ${user.name === 'You' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-950/50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-zinc-500 w-4">{user.rank}</span>
                      <span className={`text-sm font-bold ${user.name === 'You' ? 'text-emerald-500' : 'text-white'}`}>{user.name}</span>
                    </div>
                    <span className="text-xs font-bold text-zinc-400">{user.points} XP</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-bold text-white">Active Challenges</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <p className="text-xs font-bold text-blue-400 uppercase">7-Day Water Streak</p>
                  <p className="text-sm text-zinc-300">Drink 2L+ water daily for 7 days.</p>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full mt-2">
                    <div className="h-full bg-blue-500" style={{ width: '40%' }} />
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2">
                  <p className="text-xs font-bold text-orange-400 uppercase">Protein Power</p>
                  <p className="text-sm text-zinc-300">Hit your protein target 5 days in a row.</p>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full mt-2">
                    <div className="h-full bg-orange-500" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const HabitView = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayHydration = hydrationLogs.filter(l => l.timestamp.startsWith(today)).reduce((acc, curr) => acc + curr.amount, 0);
    const todaySleep = sleepLogs.find(l => l.date === today);

    const addHydration = (amount: number) => {
      setHydrationLogs([{ timestamp: new Date().toISOString(), amount }, ...hydrationLogs]);
    };

    const addSleep = (duration: number, quality: number) => {
      const recoveryScore = Math.round((duration / 8) * 50 + (quality / 10) * 50);
      const newLog: SleepLog = { date: today, duration, quality, recoveryScore };
      setSleepLogs([newLog, ...sleepLogs.filter(l => l.date !== today)]);
    };

    return (
      <div className="space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">Smart Habit <span className="text-emerald-500">Tracker</span></h1>
          <p className="text-zinc-400">Monitor your daily routines and recovery metrics.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Droplets className="text-blue-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Hydration</h3>
                <p className="text-sm text-zinc-500">Target: {Math.round((profile?.weight || 70) * 35)}ml</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{todayHydration} <span className="text-lg text-zinc-500">ml</span></p>
                <div className="w-full h-2 bg-zinc-950 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min((todayHydration / ((profile?.weight || 70) * 35)) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[250, 500, 750].map(amount => (
                  <button key={amount} onClick={() => addHydration(amount)} className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all">+{amount}ml</button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <Moon className="text-indigo-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Sleep & Recovery</h3>
                <p className="text-sm text-zinc-500">Track your rest quality.</p>
              </div>
            </div>
            {todaySleep ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">Duration</span>
                  <span className="text-white font-bold">{todaySleep.duration} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">Quality</span>
                  <span className="text-white font-bold">{todaySleep.quality}/10</span>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                  <p className="text-xs text-indigo-400 font-bold uppercase">Recovery Score</p>
                  <p className="text-3xl font-bold text-indigo-500">{todaySleep.recoveryScore}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="number" placeholder="Hours slept" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none" id="sleep-hours" />
                <input type="number" placeholder="Quality (1-10)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none" id="sleep-quality" />
                <button onClick={() => {
                  const h = (document.getElementById('sleep-hours') as HTMLInputElement).value;
                  const q = (document.getElementById('sleep-quality') as HTMLInputElement).value;
                  if (h && q) addSleep(parseFloat(h), parseFloat(q));
                }} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-400 transition-all">Log Sleep</button>
              </div>
            )}
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Trophy className="text-emerald-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Gamification</h3>
                <p className="text-sm text-zinc-500">Level up your health.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Health Points</span>
                <span className="text-emerald-500 font-bold">{profile?.points || 0} XP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Daily Streak</span>
                <span className="text-orange-500 font-bold">{profile?.streak || 0} Days</span>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">Recent Badges</h4>
                <div className="flex gap-2">
                  {(profile?.badges || []).slice(0, 3).map(b => (
                    <div key={b} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center" title={b}>
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                  ))}
                  {(profile?.badges || []).length === 0 && <p className="text-[10px] text-zinc-600 italic">No badges earned yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const PlannerView = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentPlan = mealPlans.find(p => p.date === today);

    const groceryList = useMemo(() => {
      if (!currentPlan) return [];
      const items: Record<string, string> = {};
      const meals = [currentPlan.breakfast, currentPlan.lunch, currentPlan.dinner, ...currentPlan.snacks];
      meals.forEach(meal => {
        meal.ingredients.forEach(ing => {
          items[ing] = (items[ing] || "") + " ";
        });
      });
      return Object.keys(items).map(name => ({ name, category: 'General' }));
    }, [currentPlan]);

    return (
      <div className="space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">AI Meal <span className="text-emerald-500">Planner</span></h1>
          <p className="text-zinc-400">Personalized daily and weekly nutrition planning.</p>
        </header>

        {!currentPlan ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Calendar className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">No plan for today</h3>
              <p className="text-zinc-500 max-w-md mx-auto">Generate a personalized meal plan based on your health profile and goals.</p>
            </div>
            <button 
              onClick={generateMealPlan}
              disabled={loading}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-2 mx-auto"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate Today's Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {[
                { label: 'Breakfast', meal: currentPlan.breakfast, icon: <Coffee className="text-orange-500" /> },
                { label: 'Lunch', meal: currentPlan.lunch, icon: <Utensils className="text-emerald-500" /> },
                { label: 'Dinner', meal: currentPlan.dinner, icon: <Moon className="text-blue-500" /> }
              ].map(({ label, meal, icon }) => (
                <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center">
                        {icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{label}</h3>
                        <p className="text-sm text-zinc-500">{meal.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{meal.calories} kcal</p>
                      <p className="text-xs text-zinc-500">P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ingredients</h4>
                      <ul className="space-y-2">
                        {meal.ingredients.map(ing => (
                          <li key={ing} className="text-sm text-zinc-300 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Healthier Alternatives</h4>
                      <ul className="space-y-2">
                        {meal.alternatives.map(alt => (
                          <li key={alt} className="text-sm text-zinc-400 italic flex items-center gap-2">
                            <RefreshCw className="w-3 h-3 text-emerald-500" />
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <ShoppingCart className="text-emerald-500 w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Grocery List</h3>
                </div>
                <div className="space-y-4">
                  {groceryList.map(item => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                      <span className="text-sm text-zinc-300">{item.name}</span>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-500 uppercase">{item.category}</span>
                    </div>
                  ))}
                  <button className="w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Export List
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-bold text-white">Daily Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-sm">Total Calories</span>
                    <span className="text-white font-bold">{currentPlan.breakfast.calories + currentPlan.lunch.calories + currentPlan.dinner.calories} kcal</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
                  </div>
                  <p className="text-[10px] text-zinc-600 text-center">85% of your daily target reached</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  const WorkoutTracker = () => {
    const [workoutType, setWorkoutType] = useState("Running");
    const [duration, setDuration] = useState(30);
    const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');

    const addWorkout = () => {
      // MET values (approximate)
      const metValues: Record<string, number> = {
        "Running": 8,
        "Cycling": 6,
        "Weight Lifting": 4,
        "Pushups": 5,
        "Squats": 5,
        "Walking": 3,
        "Swimming": 7
      };
      
      const met = metValues[workoutType] || 5;
      const intensityMult = intensity === 'low' ? 0.8 : intensity === 'high' ? 1.2 : 1;
      const caloriesBurned = Math.round((met * intensityMult * 3.5 * (profile?.weight || 70) / 200) * duration);

      const newWorkout: Workout = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        type: workoutType,
        duration,
        intensity,
        caloriesBurned
      };

      setWorkouts([newWorkout, ...workouts]);
    };

    return (
      <div className="space-y-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Dumbbell className="text-blue-500 w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Log Workout</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={workoutType} onChange={e => setWorkoutType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none">
              <option>Running</option>
              <option>Cycling</option>
              <option>Weight Lifting</option>
              <option>Pushups</option>
              <option>Squats</option>
              <option>Walking</option>
              <option>Swimming</option>
            </select>
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
              <Timer className="w-5 h-5 text-zinc-500 mr-2" />
              <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="bg-transparent border-none text-white outline-none w-full" placeholder="Duration (min)" />
            </div>
            <select value={intensity} onChange={e => setIntensity(e.target.value as any)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none">
              <option value="low">Low Intensity</option>
              <option value="moderate">Moderate Intensity</option>
              <option value="high">High Intensity</option>
            </select>
          </div>
          <button onClick={addWorkout} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Add Workout
          </button>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-white mb-6">Recent Workouts</h3>
          <div className="space-y-4">
            {workouts.slice(0, 10).map(w => (
              <div key={w.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{w.type}</p>
                    <p className="text-xs text-zinc-500">{w.duration} min • {w.intensity} intensity</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-emerald-500">-{w.caloriesBurned} kcal</p>
                    <p className="text-[10px] text-zinc-600">{new Date(w.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => setWorkouts(workouts.filter(item => item.id !== w.id))}
                    className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {workouts.length === 0 && <p className="text-center text-zinc-500 py-8">No workouts logged yet.</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-emerald-500/30 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-900 p-6 flex flex-col gap-8 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Apple className="text-black w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">Nutri<span className="text-emerald-500">AI</span></span>
        </div>

        <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setActiveMode('diet')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeMode === 'diet' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            suppressHydrationWarning
          >
            <Utensils className="w-3.5 h-3.5" />
            Diet Mode
          </button>
          <button 
            onClick={() => setActiveMode('gym')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeMode === 'gym' ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            suppressHydrationWarning
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Gym Mode
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<Search className="w-5 h-5" />} label="Analysis" />
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
          <NavItem active={activeTab === 'planner'} onClick={() => setActiveTab('planner')} icon={<Calendar className="w-5 h-5" />} label="Meal Planner" />
          <NavItem active={activeTab === 'workouts'} onClick={() => setActiveTab('workouts')} icon={<Dumbbell className="w-5 h-5" />} label="Workouts" />
          <NavItem active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} icon={<ListTodo className="w-5 h-5" />} label="Habits" />
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />
          <NavItem active={activeTab === 'community'} onClick={() => setActiveTab('community')} icon={<Users className="w-5 h-5" />} label="Community" />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-5 h-5" />} label="History" />
          <NavItem active={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')} icon={<MessageSquare className="w-5 h-5" />} label="AI Coach" />
          <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="w-5 h-5" />} label="Profile" />
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-900">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{mounted && profile ? 'Active User' : 'Guest User'}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest" suppressHydrationWarning>
                {mounted ? userGoal.replace('-', ' ') : 'balanced'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto h-screen">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-12 space-y-12">
          <AnimatePresence mode="wait">
            {activeTab === 'analysis' && (
              <motion.div key="analysis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white">Food <span className="text-emerald-500">Analysis</span></h1>
                  <p className="text-zinc-400 max-w-lg">Get instant nutritional insights. Search for any food item or capture an image to begin.</p>
                </header>

                <section className="max-w-2xl space-y-6">
                  <form onSubmit={handleAnalyze} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-40" />
                    <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl gap-2">
                      <div className="flex flex-1 items-center">
                        <div className="pl-4 text-zinc-500"><Search className="w-5 h-5" /></div>
                        <input
                          type="text"
                          placeholder="Search food or paste image URL..."
                          value={query}
                          onChange={(e) => { setQuery(e.target.value); if (e.target.value) setImage(null); }}
                          className="flex-1 bg-transparent border-none px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0 text-lg"
                          suppressHydrationWarning
                        />
                      </div>
                      <div className="flex gap-2 p-1 md:p-0">
                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-all flex items-center justify-center border border-zinc-700" suppressHydrationWarning><Camera className="w-5 h-5" /></button>
                        <button type="submit" disabled={loading || (!query.trim() && !image)} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20" suppressHydrationWarning>
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                          <span>{loading ? "Analyzing" : "Check"}</span>
                        </button>
                      </div>
                    </div>
                    {image && (
                      <div className="mt-4 relative inline-block">
                        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-zinc-900 p-1">
                          <img src={image.data} alt="Preview" className="h-32 w-auto rounded-xl object-cover" />
                          <button type="button" onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full backdrop-blur-sm transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    )}
                  </form>
                  {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm"><AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p></div>}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <FoodComparison />
                  </div>
                  <div className="space-y-8">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                      <h3 className="text-xl font-bold text-white">Quick Tips</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                          <p className="text-sm text-zinc-400">Paste a URL of a food image for instant analysis.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                          <p className="text-sm text-zinc-400">Compare two foods to see which fits your goal better.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-12 animate-pulse">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                      <div className="h-12 w-64 bg-zinc-900 rounded-2xl" />
                      <div className="h-12 w-48 bg-zinc-900 rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      <div className="lg:col-span-1 h-48 bg-zinc-900 rounded-3xl" />
                      <div className="lg:col-span-3 h-48 bg-zinc-900 rounded-3xl" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 h-96 bg-zinc-900 rounded-3xl" />
                      <div className="h-96 bg-zinc-900 rounded-3xl" />
                    </div>
                  </div>
                ) : analysis && (
                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                      <div className="space-y-2">
                        <h2 className="text-4xl font-bold text-white capitalize">{analysis.foodName}</h2>
                        <div className="flex items-center gap-4 text-zinc-500 text-sm">
                          <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> Diagnostic Report</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-800" />
                          <span>{new Date(analysis.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button onClick={generatePDF} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"><Download className="w-5 h-5" />Download PDF Report</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="text-6xl font-black text-emerald-500">{analysis.nutritionScore.score}</div>
                          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mt-2">Nutrition Score</div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${analysis.nutritionScore.level === 'Excellent' ? 'bg-emerald-500/20 text-emerald-500' : analysis.nutritionScore.level === 'Good' ? 'bg-blue-500/20 text-blue-500' : analysis.nutritionScore.level === 'Moderate' ? 'bg-orange-500/20 text-orange-500' : 'bg-red-500/20 text-red-500'}`}>{analysis.nutritionScore.level}</div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[150px]">{analysis.nutritionScore.explanation}</p>
                      </div>
                      <div className="lg:col-span-3 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {analysis.macronutrients.slice(0, 8).map((m, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{m.name}</p>
                            <p className="text-2xl font-bold text-white">{m.value}{m.unit}</p>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(m.percentage, 100)}%` }} className={`h-full rounded-full ${m.status === 'High' ? 'bg-red-500' : m.status === 'Low' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                            </div>
                            <p className="text-[10px] text-zinc-600">{m.percentage}% of RDI • {m.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                      <div className="flex items-center gap-3 mb-8"><Droplets className="w-6 h-6 text-blue-500" /><h3 className="text-xl font-bold text-white">Micronutrient Diagnostic</h3></div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {analysis.micronutrients.map((m, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 space-y-2">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase truncate">{m.name}</p>
                            <p className="text-lg font-bold text-white">{m.value}{m.unit}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-zinc-600">{m.percentage}%</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${m.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-500' : m.status === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{m.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-8">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                          <div className="flex items-center gap-3 mb-8"><ShieldAlert className="w-6 h-6 text-red-500" /><h3 className="text-xl font-bold text-white">Nutritional Risk Assessment</h3></div>
                          <div className="space-y-6">
                            {analysis.risks.map((risk, i) => (
                              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
                                <div className={`w-1.5 h-12 rounded-full shrink-0 ${risk.severity === 'Critical' ? 'bg-red-600' : risk.severity === 'High' ? 'bg-red-500' : risk.severity === 'Moderate' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2"><span className="font-bold text-white">{risk.name}</span><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">{risk.severity}</span></div>
                                  <p className="text-sm text-zinc-400">{risk.explanation}</p>
                                  <p className="text-xs text-zinc-600 italic">Consequence: {risk.consequences}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                          <div className="flex items-center gap-3 mb-8"><Brain className="w-6 h-6 text-blue-500" /><h3 className="text-xl font-bold text-white">Metabolic Impact Analysis</h3></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div className="flex justify-between items-center"><span className="text-zinc-500 text-sm">Glycemic Impact</span><span className="text-white font-medium">{analysis.metabolicImpact.glycemicImpact}</span></div>
                              <div className="flex justify-between items-center"><span className="text-zinc-500 text-sm">Energy Density</span><span className="text-white font-medium">{analysis.metabolicImpact.energyDensity}</span></div>
                              <div className="flex justify-between items-center"><span className="text-zinc-500 text-sm">Metabolic Load</span><span className="text-white font-medium">{analysis.metabolicImpact.metabolicLoad}</span></div>
                            </div>
                            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800/50"><p className="text-sm text-zinc-400 leading-relaxed italic">"{analysis.metabolicImpact.analysis}"</p></div>
                          </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                          <div className="flex items-center gap-3 mb-8"><Utensils className="w-6 h-6 text-emerald-500" /><h3 className="text-xl font-bold text-white">Personalized Recommendations</h3></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Improvement Suggestions</h4>
                              <div className="space-y-2">
                                {analysis.expertFeatures.suggestions.map((s, i) => (
                                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 text-sm text-zinc-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {s}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Healthier Alternatives</h4>
                              <div className="space-y-2">
                                {analysis.expertFeatures.alternatives.map((a, i) => (
                                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 text-sm text-zinc-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {a}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                          <div className="flex items-center gap-3 mb-8"><TrendingUp className="w-6 h-6 text-emerald-500" /><h3 className="text-xl font-bold text-white">Nutrient Radar Profile</h3></div>
                          <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analysis.macronutrients.concat(analysis.micronutrients.slice(0, 3))}>
                                <PolarGrid stroke="#27272a" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 8 }} />
                                <Radar name="Nutrient %" dataKey="percentage" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                          <div className="flex items-center gap-3 mb-8"><Heart className="w-6 h-6 text-pink-500" /><h3 className="text-xl font-bold text-white">Health Insights</h3></div>
                          <div className="space-y-4">
                            <InsightItem label="Weight Management" value={analysis.healthInsights.weightManagement} />
                            <InsightItem label="Muscle Building" value={analysis.healthInsights.muscleBuilding} />
                            <InsightItem label="Heart Health" value={analysis.healthInsights.heartHealth} />
                            <InsightItem label="Diabetes Suitability" value={analysis.healthInsights.diabetesSuitability} />
                          </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Macro Distribution</h3>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={macroChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {macroChartData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Daily Intake %</h3>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analysis.macronutrients.slice(0, 5)}>
                                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                                <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayHydration = hydrationLogs.filter(l => l.timestamp.startsWith(today)).reduce((acc, curr) => acc + curr.amount, 0);
                  const todaySleep = sleepLogs.find(l => l.date === today);

                  return (
                    <>
                      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                          <h1 className="text-4xl font-bold tracking-tight text-white">Daily <span className={activeMode === 'gym' ? 'text-blue-500' : 'text-emerald-500'}>Dashboard</span></h1>
                          <p className="text-zinc-400">Track your {activeMode} progress for today.</p>
                          {predictGoal && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 max-w-md">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                                <TrendingUp className="text-black w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">AI Goal Prediction</p>
                                <p className="text-sm text-white font-medium">{predictGoal.message}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {profile && (
                          <div className="flex gap-4">
                            <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">BMI</span>
                              <span className="text-lg font-bold text-white">{profile.bmi.toFixed(1)}</span>
                            </div>
                            <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">BMR</span>
                              <span className="text-lg font-bold text-white">{Math.round(profile.bmr)}</span>
                            </div>
                            <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">TDEE</span>
                              <span className="text-lg font-bold text-white">{Math.round(profile.tdee)}</span>
                            </div>
                          </div>
                        )}
                      </header>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative">
                            <div className="text-4xl font-black text-emerald-500">
                              {Math.round(
                                (Math.min(dailyStats.calories / (profile?.calorieTarget || 2000), 1) * 30) +
                                (Math.min(dailyStats.protein / (profile?.macroTargets.protein || 150), 1) * 30) +
                                (Math.min(todayHydration / ((profile?.weight || 70) * 35), 1) * 20) +
                                (todaySleep ? (todaySleep.recoveryScore / 100) * 20 : 0)
                              )}
                            </div>
                            <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-1">Health Score</div>
                          </div>
                        </div>
                        <StatCard icon={<Flame className="text-orange-500" />} label="Calories" value={dailyStats.calories} unit="kcal" target={profile?.calorieTarget || 2000} burned={dailyStats.caloriesBurned} />
                        <StatCard icon={<Zap className="text-blue-500" />} label="Protein" value={dailyStats.protein} unit="g" target={profile?.macroTargets.protein || 150} />
                        <StatCard icon={<Utensils className="text-emerald-500" />} label="Carbs" value={dailyStats.carbs} unit="g" target={profile?.macroTargets.carbs || 250} />
                        <StatCard icon={<Droplets className="text-pink-500" />} label="Fats" value={dailyStats.fat} unit="g" target={profile?.macroTargets.fat || 70} />
                      </div>
                    </>
                  );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3"><Calendar className="w-6 h-6 text-emerald-500" /><h3 className="text-xl font-bold text-white">Daily Nutrition Summary</h3></div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <DailySummaryItem label="Fiber" value={dailyStats.fiber} unit="g" target={30} />
                        <DailySummaryItem label="Sugar" value={dailyStats.sugar} unit="g" target={activeMode === 'diet' ? 30 : 60} />
                        <DailySummaryItem label="Sodium" value={dailyStats.sodium} unit="mg" target={2300} />
                        <DailySummaryItem label="Potassium" value={dailyStats.potassium} unit="mg" target={3500} />
                        <DailySummaryItem label="Calcium" value={dailyStats.calcium} unit="mg" target={1000} />
                        <DailySummaryItem label="Iron" value={dailyStats.iron} unit="mg" target={18} />
                        <DailySummaryItem label="Magnesium" value={dailyStats.magnesium} unit="mg" target={400} />
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                      <h3 className="text-xl font-bold text-white mb-8">Recent Meals</h3>
                      <div className="space-y-4">
                        {history.slice(0, 5).map((meal, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 transition-all group cursor-pointer" onClick={() => { setAnalysis(meal); setActiveTab('analysis'); }}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform"><Utensils className="w-6 h-6" /></div>
                              <div>
                                <p className="font-bold text-white capitalize">{meal.foodName}</p>
                                <p className="text-xs text-zinc-500">{new Date(meal.timestamp).toLocaleTimeString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white">{meal.macronutrients.find(m => m.name.toLowerCase().includes('calories'))?.value} kcal</p>
                              <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">Score: {meal.nutritionScore.score}</p>
                            </div>
                          </div>
                        ))}
                        {history.length === 0 && <p className="text-zinc-600 text-center py-10 italic">No meals tracked yet.</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                      <h3 className="text-xl font-bold text-white mb-8">Mode Insights</h3>
                      <div className="space-y-6">
                        {activeMode === 'diet' ? (
                          <>
                            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                              <div className="flex items-center gap-3 mb-4">
                                <Scale className="w-6 h-6 text-emerald-500" />
                                <span className="font-bold text-white">Weight Loss Focus</span>
                              </div>
                              <p className="text-sm text-zinc-400 leading-relaxed">Currently in a {Math.round(profile?.tdee || 2500) - Math.round(profile?.calorieTarget || 2000)} kcal deficit. Focus on high-fiber and high-protein meals to maintain satiety.</p>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 text-sm text-zinc-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Monitor sugar intake closely
                              </div>
                              <div className="flex items-center gap-3 text-sm text-zinc-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Prioritize fiber-rich vegetables
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                              <div className="flex items-center gap-3 mb-4">
                                <Dumbbell className="w-6 h-6 text-blue-500" />
                                <span className="font-bold text-white">Muscle Gain Focus</span>
                              </div>
                              <p className="text-sm text-zinc-400 leading-relaxed">Currently in a {Math.round(profile?.calorieTarget || 2800) - Math.round(profile?.tdee || 2500)} kcal surplus. Ensure post-workout protein intake for optimal recovery.</p>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 text-sm text-zinc-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                High protein (1.6-2.2g/kg)
                              </div>
                              <div className="flex items-center gap-3 text-sm text-zinc-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Complex carbs for workout energy
                              </div>
                            </div>
                          </>
                        )}
                        <button onClick={() => setActiveTab('profile')} className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-all">Update Profile</button>
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                      <h3 className="text-xl font-bold text-white mb-8">Workout Summary</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 text-sm">Burned Today</span>
                          <span className="text-emerald-500 font-bold">{dailyStats.caloriesBurned} kcal</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 text-sm">Net Calories</span>
                          <span className="text-white font-bold">{dailyStats.calories - dailyStats.caloriesBurned} kcal</span>
                        </div>
                        <button onClick={() => setActiveTab('workouts')} className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-all mt-4">Log Workout</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'planner' && (
              <motion.div key="planner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <PlannerView />
              </motion.div>
            )}

            {activeTab === 'habits' && (
              <motion.div key="habits" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <HabitView />
              </motion.div>
            )}

            {activeTab === 'community' && (
              <motion.div key="community" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CommunityView />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white">User <span className="text-emerald-500">Profile</span></h1>
                  <p className="text-zinc-400">Manage your body metrics and fitness settings.</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <ProfileSetup />
                  </div>
                  <div className="space-y-8">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
                      <h3 className="text-xl font-bold text-white">Data Management</h3>
                      <div className="space-y-4">
                        <button onClick={() => { if(confirm('Clear all meal history?')) { setHistory([]); localStorage.removeItem('nutrition_history'); } }} className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Clear Meal History
                        </button>
                        <button onClick={() => { if(confirm('Clear all workout history?')) { setWorkouts([]); localStorage.removeItem('fitness_workouts'); } }} className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Clear Workout History
                        </button>
                        <button onClick={() => { const data = JSON.stringify({ history, workouts, profile }); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'nutriai_backup.json'; a.click(); }} className="w-full py-4 rounded-2xl bg-zinc-800 border border-zinc-700 text-white font-bold hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" />
                          Export Backup (JSON)
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                      <h3 className="text-xl font-bold text-white mb-6">Current Metrics</h3>
                      {profile ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-950/50">
                            <span className="text-zinc-500 text-sm">BMI</span>
                            <span className={`font-bold ${profile.bmi < 18.5 || profile.bmi > 25 ? 'text-orange-500' : 'text-emerald-500'}`}>{profile.bmi.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-950/50">
                            <span className="text-zinc-500 text-sm">BMR</span>
                            <span className="text-white font-bold">{Math.round(profile.bmr)} kcal</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-950/50">
                            <span className="text-zinc-500 text-sm">TDEE</span>
                            <span className="text-white font-bold">{Math.round(profile.tdee)} kcal</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-950/50">
                            <span className="text-zinc-500 text-sm">Daily Target</span>
                            <span className="text-emerald-500 font-bold">{Math.round(profile.calorieTarget)} kcal</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-zinc-600 text-sm italic">Complete your profile to see metrics.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'workouts' && (
              <motion.div key="workouts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white">Fitness <span className="text-blue-500">Tracker</span></h1>
                  <p className="text-zinc-400">Log your exercises and track calories burned.</p>
                </header>
                <WorkoutTracker />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white">Fitness & Nutrition <span className="text-emerald-500">Analytics</span></h1>
                  <p className="text-zinc-400">Visualize your long-term progress and trends.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Calorie Balance (Intake vs Burned)</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={getTrendData(history, workouts, mounted)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                          <Legend />
                          <Bar dataKey="calories" name="Intake" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="burned" name="Burned" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="workoutCount" name="Workouts" stroke="#3b82f6" strokeWidth={2} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Macronutrient Trends</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getTrendData(history, workouts, mounted)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                          <Legend />
                          <Line type="monotone" dataKey="protein" name="Protein (g)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="carbs" name="Carbs (g)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-8">Weekly Performance Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 space-y-2">
                        <p className="text-xs text-zinc-500 font-bold uppercase">Avg. Daily Intake</p>
                        <p className="text-2xl font-bold text-white">{mounted ? Math.round(getTrendData(history, workouts, mounted).reduce((acc, curr) => acc + curr.calories, 0) / 7) : 0} kcal</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 space-y-2">
                        <p className="text-xs text-zinc-500 font-bold uppercase">Avg. Calories Burned</p>
                        <p className="text-2xl font-bold text-emerald-500">{mounted ? Math.round(getTrendData(history, workouts, mounted).reduce((acc, curr) => acc + curr.burned, 0) / 7) : 0} kcal</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 space-y-2">
                        <p className="text-xs text-zinc-500 font-bold uppercase">Total Workouts</p>
                        <p className="text-2xl font-bold text-blue-500">{mounted ? getTrendData(history, workouts, mounted).reduce((acc, curr) => acc + curr.workoutCount, 0) : 0} sessions</p>
                      </div>
                    </div>
                  </div>
                  <DeficiencyDetector />
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white">Meal <span className="text-emerald-500">History</span></h1>
                  <p className="text-zinc-400">Your last 15 analyzed meals.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((meal, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all group cursor-pointer" onClick={() => { setAnalysis(meal); setActiveTab('analysis'); }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform"><Utensils className="w-5 h-5" /></div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">{new Date(meal.timestamp).toLocaleDateString()}</p>
                          <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">Score: {meal.nutritionScore.score}</p>
                        </div>
                      </div>
                      <h3 className="font-bold text-white capitalize mb-2 truncate">{meal.foodName}</h3>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>{meal.macronutrients.find(m => m.name.toLowerCase().includes('calories'))?.value} kcal</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                        <span>{meal.macronutrients.find(m => m.name.toLowerCase().includes('protein'))?.value}g Protein</span>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                      <History className="w-12 h-12 mx-auto" />
                      <p>No meals analyzed yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'assistant' && (
              <motion.div key="assistant" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white">AI <span className="text-emerald-500">Coach</span></h1>
                  <p className="text-zinc-400">Interact with your personal health assistant via chat or voice.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col h-[600px] overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-thin scrollbar-thumb-zinc-800">
                      {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                          <MessageSquare className="w-12 h-12" />
                          <p className="text-sm">Start a conversation with your personal nutrition expert.</p>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-500 text-black font-medium' : 'bg-zinc-800 text-zinc-200'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-zinc-800 p-4 rounded-2xl flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                            <span className="text-xs text-zinc-400">Thinking...</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleChat} className="mt-6 relative">
                      <input
                        type="text"
                        placeholder="Ask a question..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors pr-16"
                        suppressHydrationWarning
                      />
                      <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="absolute right-2 top-2 bottom-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black px-4 rounded-xl transition-all" suppressHydrationWarning>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </form>
                  </div>

                  <div className="space-y-8">
                    <VoiceAssistant />
                    
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                      <h3 className="text-xl font-bold text-white">Coach Tips</h3>
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
                          <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Morning Routine</p>
                          <p className="text-sm text-zinc-400">Start your day with 500ml of water to kickstart your metabolism.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
                          <p className="text-xs font-bold text-blue-500 uppercase mb-1">Workout Fuel</p>
                          <p className="text-sm text-zinc-400">Consume complex carbs 2 hours before your session for sustained energy.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${active ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
      suppressHydrationWarning
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DailySummaryItem({ label, value, unit, target }: { label: string, value: number, unit: string, target: number }) {
  const percentage = Math.min((value / target) * 100, 100);
  return (
    <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 space-y-2">
      <p className="text-[10px] font-bold text-zinc-500 uppercase">{label}</p>
      <p className="text-lg font-bold text-white">{value}{unit}</p>
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-[9px] text-zinc-600">{Math.round(percentage)}% of target</p>
    </div>
  );
}

function StatCard({ icon, label, value, unit, target, burned }: { icon: React.ReactNode, label: string, value: number, unit: string, target: number, burned?: number }) {
  const netValue = burned ? value - burned : value;
  const percentage = Math.min((value / target) * 100, 100);
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-zinc-950">{icon}</div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            <span className="text-xs text-zinc-500">{unit}</span>
          </div>
          {burned !== undefined && (
            <span className="text-[10px] font-bold text-emerald-500">-{burned} burned</span>
          )}
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-zinc-600">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full rounded-full ${burned ? 'bg-orange-500' : 'bg-emerald-500'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeficiencyCard({ label, status, color, icon }: { label: string, status: string, color: string, icon: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-bold ${color}`}>{status}</p>
      </div>
      <div className={`${color} opacity-50`}>{icon}</div>
    </div>
  );
}

function GoalOption({ active, onClick, label, description, icon }: { active: boolean, onClick: () => void, label: string, description: string, icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${active ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'}`}>
      <div className={`p-2 rounded-xl ${active ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}>{icon}</div>
      <div>
        <p className={`font-bold ${active ? 'text-white' : 'text-zinc-300'}`}>{label}</p>
        <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

function InsightItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
      <p className="text-sm text-zinc-300 leading-snug">{value}</p>
    </div>
  );
}

function getTrendData(history: AnalysisResult[], workouts: Workout[], mounted: boolean) {
  // Ensure we are on the client to avoid hydration mismatch with dates
  if (!mounted) return [];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  return last7Days.map(date => {
    const dayMeals = history.filter(m => m.timestamp.startsWith(date));
    const dayWorkouts = workouts.filter(w => w.timestamp.startsWith(date));
    
    const stats = { 
      date: date.split('-').slice(1).join('/'), 
      calories: 0, 
      protein: 0, 
      carbs: 0,
      fiber: 0,
      sugar: 0,
      burned: 0,
      workoutCount: dayWorkouts.length
    };

    dayMeals.forEach(meal => {
      meal.macronutrients.forEach(m => {
        const name = m.name.toLowerCase();
        if (name.includes('calories')) stats.calories += m.value;
        if (name.includes('protein')) stats.protein += m.value;
        if (name.includes('carbohydrates')) stats.carbs += m.value;
        if (name.includes('fiber')) stats.fiber += m.value;
        if (name.includes('sugar')) stats.sugar += m.value;
      });
    });

    dayWorkouts.forEach(w => {
      stats.burned += w.caloriesBurned;
    });

    return stats;
  });
}
