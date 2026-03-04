"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Search, Loader2, AlertCircle, CheckCircle2, ChevronRight, Apple, Flame, Zap, 
  Droplets, Info, Camera, Upload, X, FileText, Download, Activity, Heart, 
  ShieldAlert, Brain, TrendingUp, Utensils, LayoutDashboard, History, 
  MessageSquare, Settings, Target, Calendar, BarChart3, PieChart as PieChartIcon,
  User, ArrowUpRight, ArrowDownRight, Scale
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  Legend, LineChart, Line, CartesianGrid, AreaChart, Area
} from "recharts";
import { AnalysisResult, HealthGoal } from "./types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'dashboard' | 'analytics' | 'assistant' | 'settings'>('analysis');
  const [query, setQuery] = useState("");
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [userGoal, setUserGoal] = useState<HealthGoal>('balanced');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load history and goals from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('nutrition_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
    const savedGoal = localStorage.getItem('user_goal') as HealthGoal;
    if (savedGoal) setUserGoal(savedGoal);
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('nutrition_history', JSON.stringify(history));
  }, [history]);

  // Save goal to localStorage
  useEffect(() => {
    localStorage.setItem('user_goal', userGoal);
  }, [userGoal]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const dailyStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = history.filter(m => m.timestamp.startsWith(today));
    
    const stats = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

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
        if (m.name.toLowerCase().includes('sodium')) stats.sodium += m.value;
      });
    });

    return stats;
  }, [history]);

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

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is not configured.");

      const ai = new GoogleGenAI({ apiKey });
      const isUrl = query.startsWith("http");
      const prompt = `
Analyze the following food item or image and return a comprehensive hospital-grade nutritional diagnostic report in ONLY valid JSON format.
If an image is provided, detect ALL food items present and estimate their portion sizes.
The user's current health goal is: ${userGoal}. Tailor the analysis, risks, and suggestions to this goal.

Required JSON structure:
{
  "foodName": string (If multiple items, list them all, e.g., "Grilled Chicken with Salad"),
  "portionEstimation": string (e.g., "200g chicken, 1 cup salad"),
  "analysisDate": string (ISO format),
  "nutritionScore": { "score": number, "level": string (e.g., Good, Excellent, Risky) },
  "macronutrients": [
    { "name": string, "value": number, "unit": string, "rdi": number, "percentage": number, "status": string (Optimal, High, Low, etc.) }
  ],
  "micronutrients": [
    { "name": string, "value": number, "unit": string, "rdi": number, "percentage": number, "status": string }
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

Include these specific nutrients: Calories, Protein, Carbohydrates, Total Fat, Saturated Fat, Fiber, Sugar, Sodium, Potassium, Calcium, Iron, Magnesium, Zinc, Vitamin A, Vitamin B complex, Vitamin C, Vitamin D, Vitamin K.

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
        model: "gemini-3-flash-preview",
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
      setHistory(prev => [result, ...prev]);
    } catch (err: any) {
      setError(err.message || "Something went wrong during analysis");
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
You are a professional AI Nutrition Assistant. 
Context: ${context}
User Goal: ${userGoal}
User History Summary: ${history.length} meals tracked recently. Total calories today: ${dailyStats.calories}.

Answer the user's question accurately and professionally.
User: ${userMsg}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
    
    // Page 1: Header
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("AI Nutrition Analysis Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Health Goal Context: ${userGoal.toUpperCase()}`, 14, 28);
    
    doc.setTextColor(100, 100, 100);
    doc.text(`Report ID: ${analysis.id.toUpperCase()}`, pageWidth - 60, 20);
    doc.text(`Date: ${new Date(analysis.timestamp).toLocaleDateString()}`, pageWidth - 60, 28);

    // Food Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(`Subject: ${analysis.foodName}`, 14, 55);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 60, pageWidth - 14, 60);

    // Macronutrients Table
    doc.setFontSize(12);
    doc.text("1. Macronutrient Profile", 14, 75);
    
    const macroData = analysis.macronutrients.map((m: any) => [
      m.name,
      `${m.value}${m.unit}`,
      `${m.rdi}${m.unit}`,
      `${m.percentage}%`,
      m.status
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Nutrient', 'Value', 'RDI', '% of RDI', 'Status']],
      body: macroData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Micronutrients Table
    doc.setFontSize(12);
    doc.text("2. Micronutrient Profile", 14, (doc as any).lastAutoTable.finalY + 15);
    
    const microData = analysis.micronutrients.map((m: any) => [
      m.name,
      `${m.value}${m.unit}`,
      `${m.rdi}${m.unit}`,
      `${m.percentage}%`,
      m.status
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Nutrient', 'Value', 'RDI', '% of RDI', 'Status']],
      body: microData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Page 2
    doc.addPage();
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("Advanced Health Analysis & Diagnostic Insights", 14, 13);

    doc.setTextColor(0, 0, 0);
    
    // Risks
    doc.setFontSize(14);
    doc.text("3. Nutritional Risk Assessment", 14, 35);
    
    const riskData = analysis.risks.map((r: any) => [
      r.name,
      r.severity,
      r.explanation
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Risk Factor', 'Severity', 'Clinical Explanation']],
      body: riskData,
      theme: 'plain',
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
      columnStyles: { 2: { cellWidth: 100 } }
    });

    // Metabolic Impact
    const metabolicY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("4. Metabolic Impact Analysis", 14, metabolicY);
    doc.setFontSize(10);
    doc.text(`Glycemic Impact: ${analysis.metabolicImpact.glycemicImpact}`, 14, metabolicY + 8);
    doc.text(`Energy Density: ${analysis.metabolicImpact.energyDensity}`, 14, metabolicY + 14);
    doc.text(`Nutrient Density Score: ${analysis.metabolicImpact.nutrientDensityScore}/100`, 14, metabolicY + 20);
    
    doc.setFontSize(9);
    const splitMetabolic = doc.splitTextToSize(analysis.metabolicImpact.analysis, pageWidth - 28);
    doc.text(splitMetabolic, 14, metabolicY + 28);

    // Clinical Summary
    const summaryY = metabolicY + 50;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, summaryY, pageWidth - 28, 40, 'F');
    doc.setFontSize(12);
    doc.text("5. Clinical Nutrition Summary", 18, summaryY + 10);
    doc.setFontSize(9);
    const splitSummary = doc.splitTextToSize(analysis.clinicalSummary, pageWidth - 36);
    doc.text(splitSummary, 18, summaryY + 18);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This report is generated by AI and intended for informational purposes only. Consult a medical professional for diagnosis.", 14, doc.internal.pageSize.getHeight() - 10);

    doc.save(`Nutrition_Report_${analysis.foodName.replace(/\s+/g, '_')}.pdf`);
  };

  const macroChartData = analysis?.macronutrients?.map((m: any) => ({
    name: m.name,
    value: m.value,
    percentage: m.percentage
  })) || [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

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

        <nav className="flex flex-col gap-2">
          <NavItem active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<Search className="w-5 h-5" />} label="Analysis" />
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />
          <NavItem active={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')} icon={<MessageSquare className="w-5 h-5" />} label="AI Assistant" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-900">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Guest User</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{userGoal.replace('-', ' ')}</span>
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
                        />
                      </div>
                      <div className="flex gap-2 p-1 md:p-0">
                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-all flex items-center justify-center border border-zinc-700"><Camera className="w-5 h-5" /></button>
                        <button type="submit" disabled={loading || (!query.trim() && !image)} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
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

                {analysis && (
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
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${analysis.nutritionScore.level === 'Excellent' ? 'bg-emerald-500/20 text-emerald-500' : analysis.nutritionScore.level === 'Good' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'}`}>{analysis.nutritionScore.level}</div>
                      </div>
                      <div className="lg:col-span-3 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {analysis.macronutrients.slice(0, 4).map((m, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{m.name}</p>
                            <p className="text-2xl font-bold text-white">{m.value}{m.unit}</p>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(m.percentage, 100)}%` }} className={`h-full rounded-full ${m.percentage > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            </div>
                            <p className="text-[10px] text-zinc-600">{m.percentage}% of RDI</p>
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
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white">Daily <span className="text-emerald-500">Dashboard</span></h1>
                  <p className="text-zinc-400">Track your nutritional progress for today.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard icon={<Flame className="text-orange-500" />} label="Calories" value={dailyStats.calories} unit="kcal" target={2000} />
                  <StatCard icon={<Zap className="text-blue-500" />} label="Protein" value={dailyStats.protein} unit="g" target={150} />
                  <StatCard icon={<Utensils className="text-emerald-500" />} label="Carbs" value={dailyStats.carbs} unit="g" target={250} />
                  <StatCard icon={<Droplets className="text-pink-500" />} label="Fats" value={dailyStats.fat} unit="g" target={70} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
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
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-8">Health Goal</h3>
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-3 mb-4">
                          <Target className="w-6 h-6 text-emerald-500" />
                          <span className="font-bold text-white capitalize">{userGoal.replace('-', ' ')}</span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">Your analysis and recommendations are currently optimized for this goal.</p>
                      </div>
                      <button onClick={() => setActiveTab('settings')} className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-all">Change Goal</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white">Nutrition <span className="text-emerald-500">Analytics</span></h1>
                  <p className="text-zinc-400">Visualize your long-term nutritional trends.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Calorie Trends (Last 7 Days)</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getTrendData(history)}>
                          <defs>
                            <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                          <Area type="monotone" dataKey="calories" stroke="#10b981" fillOpacity={1} fill="url(#colorCal)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Protein vs Carbs</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getTrendData(history)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                          <Legend />
                          <Line type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="carbs" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-8">Nutrient Deficiency Detection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DeficiencyCard label="Vitamin D" status="At Risk" color="text-orange-500" icon={<ShieldAlert className="w-5 h-5" />} />
                    <DeficiencyCard label="Iron" status="Optimal" color="text-emerald-500" icon={<CheckCircle2 className="w-5 h-5" />} />
                    <DeficiencyCard label="Magnesium" status="Low" color="text-red-500" icon={<AlertCircle className="w-5 h-5" />} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'assistant' && (
              <motion.div key="assistant" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-[calc(100vh-12rem)] flex flex-col">
                <header className="space-y-4 mb-8">
                  <h1 className="text-4xl font-bold tracking-tight text-white">AI <span className="text-emerald-500">Assistant</span></h1>
                  <p className="text-zinc-400">Ask anything about your nutrition, meals, or health goals.</p>
                </header>

                <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col overflow-hidden">
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
                    />
                    <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="absolute right-2 top-2 bottom-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black px-4 rounded-xl transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <header className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white">Platform <span className="text-emerald-500">Settings</span></h1>
                  <p className="text-zinc-400">Personalize your health profile and goals.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
                    <h3 className="text-xl font-bold text-white">Health Goals</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <GoalOption active={userGoal === 'weight-loss'} onClick={() => setUserGoal('weight-loss')} label="Weight Loss" description="Focus on calorie deficit and high satiety." icon={<ArrowDownRight className="w-5 h-5" />} />
                      <GoalOption active={userGoal === 'muscle-gain'} onClick={() => setUserGoal('muscle-gain')} label="Muscle Gain" description="High protein and optimized energy intake." icon={<ArrowUpRight className="w-5 h-5" />} />
                      <GoalOption active={userGoal === 'heart-health'} onClick={() => setUserGoal('heart-health')} label="Heart Health" description="Low sodium and healthy fats focus." icon={<Heart className="w-5 h-5" />} />
                      <GoalOption active={userGoal === 'diabetes'} onClick={() => setUserGoal('diabetes')} label="Diabetes Friendly" description="Low glycemic load and sugar control." icon={<Activity className="w-5 h-5" />} />
                      <GoalOption active={userGoal === 'balanced'} onClick={() => setUserGoal('balanced')} label="Balanced Nutrition" description="General wellness and nutrient density." icon={<Scale className="w-5 h-5" />} />
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
                    <h3 className="text-xl font-bold text-white">Data Management</h3>
                    <div className="space-y-4">
                      <button onClick={() => { if(confirm('Clear all history?')) { setHistory([]); localStorage.removeItem('nutrition_history'); } }} className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-all">Clear Meal History</button>
                      <button onClick={() => { const data = JSON.stringify(history); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'nutrition_data.json'; a.click(); }} className="w-full py-4 rounded-2xl bg-zinc-800 border border-zinc-700 text-white font-bold hover:bg-zinc-700 transition-all">Export Data (JSON)</button>
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
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${active ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, unit, target }: { icon: React.ReactNode, label: string, value: number, unit: string, target: number }) {
  const percentage = Math.min((value / target) * 100, 100);
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-zinc-950">{icon}</div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-xs text-zinc-500">{unit}</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-zinc-600">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-emerald-500 rounded-full" />
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

function getTrendData(history: AnalysisResult[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  return last7Days.map(date => {
    const dayMeals = history.filter(m => m.timestamp.startsWith(date));
    const stats = { date: date.split('-').slice(1).join('/'), calories: 0, protein: 0, carbs: 0 };
    dayMeals.forEach(meal => {
      meal.macronutrients.forEach(m => {
        const name = m.name.toLowerCase();
        if (name.includes('calories')) stats.calories += m.value;
        if (name.includes('protein')) stats.protein += m.value;
        if (name.includes('carbohydrates')) stats.carbs += m.value;
      });
    });
    return stats;
  });
}
