/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Component } from 'react';
import { Search, Loader2, ChefHat, Leaf, Settings, User, AlertTriangle, Clock, Trash2, LayoutDashboard, Sparkles, Zap, Award, Camera } from 'lucide-react';
import { analyzeFood, analyzePreventiveHealth } from './services/ai';
import { NutritionAnalysisResponse, UserProfile } from './types';
import { NutritionDisplay } from './components/NutritionDisplay';
import { IntelligenceDashboard } from './components/IntelligenceDashboard';
import { CameraScanner } from './components/CameraScanner';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_PROFILE: UserProfile = {
  age: 30,
  gender: 'male',
  height_cm: 175,
  weight_kg: 70,
  activity_level: 'moderate',
  goal: 'maintenance'
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-2xl border border-red-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-6">We encountered a rendering error while displaying the analysis. This can happen if the AI data is malformed.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
          >
            Reload Application
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-6 p-4 bg-slate-50 rounded-lg text-left text-xs text-red-600 overflow-auto max-h-40">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [deepAnalysisLoading, setDeepAnalysisLoading] = useState(false);
  const [data, setData] = useState<NutritionAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [history, setHistory] = useState<NutritionAnalysisResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'intelligence'>('search');
  const [streak, setStreak] = useState(5);
  const [points, setPoints] = useState(1250);
  const [showScanner, setShowScanner] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    performAnalysis(query);
  };

  const performAnalysis = async (searchQuery: string, imageData?: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await analyzeFood(searchQuery, userProfile, 'single_food', false, history, imageData);
      setData(result);
      if (result && result.food_analysis) {
        setHistory(prev => [result, ...prev].slice(0, 10));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze food. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = (base64Image: string) => {
    setShowScanner(false);
    performAnalysis('', base64Image);
  };

  const handleGenerateReport = async () => {
    if (!query.trim() || !data) return;
    
    setReportLoading(true);
    try {
      const result = await analyzeFood(query, userProfile, 'single_food', true, history);
      if (data.preventive_health_data) {
        result.preventive_health_data = data.preventive_health_data;
      }
      setData(result);
    } catch (err) {
      console.error("Failed to generate report:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleRunDeepAnalysis = async () => {
    if (!data) return;

    setDeepAnalysisLoading(true);
    try {
      const result = await analyzePreventiveHealth(data.food_analysis, userProfile);
      setData(prev => prev ? ({ ...prev, preventive_health_data: result }) : null);
    } catch (err) {
      console.error("Failed to run deep analysis:", err);
      alert("Failed to run deep analysis. Please try again.");
    } finally {
      setDeepAnalysisLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'height_cm' || name === 'weight_kg' ? Number(value) : value
    }));
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all analysis data? This will reset your current session for privacy.")) {
      setData(null);
      setQuery('');
      setError(null);
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <CameraScanner 
            onCapture={handleCapture}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              AI Nutrition Checker <span className="text-emerald-500">Pro</span>
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6 mr-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-amber-600 uppercase leading-none">Streak</span>
                <span className="text-sm font-bold text-slate-900 leading-tight">{streak} Days</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <Award className="w-4 h-4 text-indigo-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-600 uppercase leading-none">Points</span>
                <span className="text-sm font-bold text-slate-900 leading-tight">{points.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'search' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'intelligence' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Intelligence
            </button>
          </div>

          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors relative"
          >
            <Settings className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {activeTab === 'intelligence' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <IntelligenceDashboard 
              userProfile={userProfile} 
              onUpdateStreak={setStreak}
              onUpdatePoints={setPoints}
            />
          </motion.div>
        ) : (
          <React.Fragment>
            <AnimatePresence>
              {showProfile && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-8"
                >
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-500" /> Your Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                        <input 
                          type="number" name="age" value={userProfile.age} onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select 
                          name="gender" value={userProfile.gender} onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                        <input 
                          type="number" name="height_cm" value={userProfile.height_cm} onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                        <input 
                          type="number" name="weight_kg" value={userProfile.weight_kg} onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Activity Level</label>
                        <select 
                          name="activity_level" value={userProfile.activity_level} onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        >
                          <option value="sedentary">Sedentary</option>
                          <option value="light">Light Activity</option>
                          <option value="moderate">Moderate Activity</option>
                          <option value="active">Active</option>
                          <option value="athlete">Athlete</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Goal</label>
                        <select 
                          name="goal" value={userProfile.goal} onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        >
                          <option value="fat_loss">Fat Loss</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="muscle_gain">Muscle Gain</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Mood</label>
                        <select 
                          name="mood" value={userProfile.mood || ''} onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        >
                          <option value="">Select Mood</option>
                          <option value="Happy">Happy</option>
                          <option value="Stressed">Stressed</option>
                          <option value="Tired">Tired</option>
                          <option value="Energetic">Energetic</option>
                          <option value="Neutral">Neutral</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-slate-400" /> Privacy & Security
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={handleClearData}
                          className="text-xs font-medium px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          Clear Session Data
                        </button>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          End-to-end encrypted AI analysis
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center mb-12">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight"
              >
                What are you eating?
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto"
              >
                Get detailed clinical nutrition analysis, metabolic impact, and personalized risk assessments instantly.
              </motion.p>

              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSearch} 
                className="max-w-xl mx-auto relative"
              >
                <div className="relative group flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Banana, Chicken Breast, Paneer Butter Masala..."
                      className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center justify-center group/scan"
                    title="Advanced Scan (Camera/Gallery)"
                  >
                    <Camera className="w-6 h-6 group-hover/scan:scale-110 transition-transform" />
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Analyze'
                    )}
                  </button>
                </div>
              </motion.form>
            </div>

            <ErrorBoundary>
              {error && (
                <div className="max-w-xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center animate-in fade-in slide-in-from-bottom-2">
                  {error}
                </div>
              )}

              {data && (
                <NutritionDisplay 
                  data={data} 
                  onGenerateReport={handleGenerateReport}
                  isGeneratingReport={reportLoading}
                  onRunDeepAnalysis={handleRunDeepAnalysis}
                  isRunningDeepAnalysis={deepAnalysisLoading}
                />
              )}
            </ErrorBoundary>

            {!data && !loading && !error && (
              <React.Fragment>
                {history.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" /> Recent History
                      </h3>
                      <button 
                        onClick={() => setHistory([])}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear History
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {history.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setData(item);
                            setQuery(item.food_analysis.food_name);
                          }}
                          className="text-left p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-slate-900 capitalize truncate pr-2 group-hover:text-emerald-600 transition-colors">
                              {item.food_analysis.food_name}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.food_analysis.health_score >= 80 ? 'bg-emerald-50 text-emerald-600' :
                              item.food_analysis.health_score >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {item.food_analysis.health_score}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.food_analysis.calories_kcal} kcal • {item.food_analysis.serving_reference}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
                >
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                      <ChefHat className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Global Database</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Accurate nutritional data for thousands of international and regional dishes.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                      <Activity className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Health Scores</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Instant health ratings based on fiber, protein, sugar, and fat content.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mb-4">
                      <Leaf className="w-5 h-5 text-violet-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Dietary Insights</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Smart categorization for Vegan, Vegetarian, Keto, and other dietary needs.
                    </p>
                  </div>
                </motion.div>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </main>
    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export default App;
