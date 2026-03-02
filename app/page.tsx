"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, LogOut, LogIn, Loader2, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const [imageUrl, setImageUrl] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      // PART 6: PRODUCTION SAFE FETCH
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        throw new Error(errorData.error || errorData.message || "Something went wrong");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">AI Nutrition SaaS</h1>
            <p className="text-zinc-400">Analyze your meals instantly with advanced AI. Get detailed nutritional breakdowns and track your health goals.</p>
          </div>
          
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <div className="pt-8 border-t border-zinc-800 flex justify-center gap-8 text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            <span>5 Free Daily Analyses</span>
            <span>Premium Unlimited</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg">AI Nutrition</h1>
              <p className="text-xs text-zinc-500">Welcome, {session.user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-semibold uppercase text-zinc-500">Plan: {(session?.user as any)?.planType || "Free"}</p>
              <p className="text-xs text-zinc-400">Usage: {(session?.user as any)?.usageCount || 0}/5</p>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <section className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-xl font-semibold">Analyze Food</h2>
              <p className="text-sm text-zinc-400">Paste an image URL of your food to get a detailed nutritional breakdown.</p>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="https://example.com/food.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !imageUrl}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                {loading ? "Analyzing..." : "Analyze Meal"}
              </button>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </div>

            {/* Plan Status Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{(session?.user as any)?.planType === "premium" ? "Premium Tier" : "Free Tier"}</h3>
                  <p className="text-xs text-zinc-500">{(session?.user as any)?.planType === "premium" ? "Unlimited analyses" : "5 analyses per day"}</p>
                </div>
              </div>
              {(session?.user as any)?.planType !== "premium" && (
                <button className="text-xs font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400 transition-colors">
                  Upgrade
                </button>
              )}
            </div>
          </section>

          {/* Result Section */}
          <section>
            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Analysis Result</h2>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Verified by AI</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter mb-1">Calories</p>
                      <p className="text-3xl font-light">{analysis.calories}</p>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter mb-1">Protein</p>
                      <p className="text-3xl font-light">{analysis.protein}g</p>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter mb-1">Carbs</p>
                      <p className="text-3xl font-light">{analysis.carbs}g</p>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter mb-1">Fats</p>
                      <p className="text-3xl font-light">{analysis.fats}g</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Micronutrients</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.micronutrients?.map((micro: string, i: number) => (
                        <span key={i} className="bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300">
                          {micro}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-600 space-y-4"
                >
                  <Camera className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Your analysis results will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </main>
      </div>
    </div>
  );
}
