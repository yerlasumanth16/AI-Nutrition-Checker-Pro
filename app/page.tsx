"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckCircle2, ChevronRight, Apple, Flame, Zap, Droplets, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const isUrl = query.startsWith("http");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUrl ? { imageUrl: query } : { query }),
      });

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-16">
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium tracking-wide"
          >
            <Apple className="w-3.5 h-3.5" />
            AI-POWERED NUTRITION
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-white"
          >
            Nutrition <span className="text-emerald-500">Checker</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-lg text-lg"
          >
            Get instant nutritional insights. Search for any food item or paste an image URL to begin.
          </motion.p>
        </header>

        {/* Search Section */}
        <section className="max-w-2xl mx-auto w-full">
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleAnalyze}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-40" />
            <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl">
              <div className="pl-4 text-zinc-500">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search food (e.g. 'Avocado Toast' or image URL)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0 text-lg"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                <span>{loading ? "Analyzing" : "Check"}</span>
              </button>
            </div>
          </motion.form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </section>

        {/* Results Section */}
        <section className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Main Stats */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-1 capitalize">{analysis.foodName || query}</h2>
                        <p className="text-zinc-500 text-sm">Nutritional breakdown per serving</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-4xl font-bold text-emerald-500">{analysis.healthScore}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Health Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard label="Calories" value={analysis.calories} icon={<Flame className="w-4 h-4 text-orange-500" />} />
                      <StatCard label="Protein" value={`${analysis.protein}g`} icon={<Zap className="w-4 h-4 text-blue-500" />} />
                      <StatCard label="Carbs" value={`${analysis.carbs}g`} icon={<Apple className="w-4 h-4 text-emerald-500" />} />
                      <StatCard label="Fats" value={`${analysis.fats}g`} icon={<Droplets className="w-4 h-4 text-yellow-500" />} />
                    </div>

                    <div className="mt-8 p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                      <div className="flex items-center gap-2 mb-3 text-zinc-400 text-sm font-medium">
                        <Info className="w-4 h-4" />
                        AI Summary
                      </div>
                      <p className="text-zinc-300 leading-relaxed italic">
                        "{analysis.summary}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Micronutrients</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.micronutrients?.map((micro: string, i: number) => (
                        <span key={i} className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs text-zinc-300 font-medium">
                          {micro}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <h4 className="font-bold text-white">Verified Data</h4>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Our AI analysis provides estimates based on visual data or common nutritional databases. Always consult a professional for medical advice.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-zinc-700 space-y-6 py-20"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                  <Apple className="w-24 h-24 relative opacity-10" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-zinc-600">Ready to analyze your meal?</p>
                  <p className="text-sm text-zinc-800">Enter a food name or image URL above to see the magic.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 mt-20">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-600 text-sm">
          <div className="flex items-center gap-2">
            <Apple className="w-4 h-4" />
            <span className="font-bold text-zinc-400">AI Nutrition Checker</span>
          </div>
          <p>© 2024 Open Source Nutrition Project. No account required.</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{label}</p>
        <div className="opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
    </div>
  );
}
