import React, { useState } from 'react';
import { Brain, Zap, Target, ShoppingBag, Calendar, AlertCircle, Smile, TrendingUp, Award, Bell, Layout, ChevronRight, Loader2, Sparkles, Utensils, Scale, Clock, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { UserProfile } from '../types';
import { runIntelligenceEngine } from '../services/ai';

interface IntelligenceDashboardProps {
  userProfile: UserProfile;
  onUpdateStreak?: React.Dispatch<React.SetStateAction<number>>;
  onUpdatePoints?: React.Dispatch<React.SetStateAction<number>>;
}

type EngineMode = 'STREAK_ENGINE' | 'MOOD_METABOLIC' | 'FUTURE_PREDICTION' | 'CHEAT_OPTIMIZER' | 'COMMUNITY_ANALYZER' | 'SMART_REMINDER' | 'HEALTH_WARNING' | 'BODY_TYPE_MODE' | 'MEAL_PLANNER' | 'PATTERN_DETECTION' | 'GROCERY_GENERATOR';

interface EngineTool {
  id: EngineMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const TOOLS: EngineTool[] = [
  { id: 'STREAK_ENGINE', name: 'Streak & Rewards', description: 'Track your healthy days and earn badges.', icon: <Award className="w-5 h-5" />, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { id: 'MOOD_METABOLIC', name: 'Mood & Metabolism', description: 'Analyze how your mood affects your metabolism.', icon: <Smile className="w-5 h-5" />, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  { id: 'FUTURE_PREDICTION', name: 'Body Predictor', description: 'Predict your future weight based on current habits.', icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'CHEAT_OPTIMIZER', name: 'Cheat Meal Optimizer', description: 'Plan compensation for your favorite treats.', icon: <Zap className="w-5 h-5" />, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  { id: 'MEAL_PLANNER', name: 'One-Tap Meal Planner', description: 'Generate a full day meal plan instantly.', icon: <Utensils className="w-5 h-5" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { id: 'GROCERY_GENERATOR', name: 'Smart Grocery List', description: 'Weekly list optimized for your goals.', icon: <ShoppingBag className="w-5 h-5" />, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'HEALTH_WARNING', name: 'Health Warning System', description: 'Real-time RDA comparison and risk alerts.', icon: <AlertCircle className="w-5 h-5" />, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'PATTERN_DETECTION', name: 'Pattern Detection', description: 'Identify hidden eating habits and trends.', icon: <Brain className="w-5 h-5" />, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { id: 'BODY_TYPE_MODE', name: 'Body Type Macros', description: 'Personalized macro distribution for your body.', icon: <Scale className="w-5 h-5" />, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'SMART_REMINDER', name: 'Smart Reminders', description: 'Data-driven nudges for hydration and protein.', icon: <Bell className="w-5 h-5" />, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
];

export const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({ userProfile, onUpdateStreak, onUpdatePoints }) => {
  const [activeTool, setActiveTool] = useState<EngineMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [inputData, setInputData] = useState<any>({});
  const [engineHistory, setEngineHistory] = useState<{ mode: EngineMode, result: any, timestamp: string }[]>([]);

  const handleRunEngine = async (mode: EngineMode) => {
    setLoading(true);
    setResult(null);
    try {
      // ... (existing data preparation)
      let data = { ...inputData };
      if (mode === 'STREAK_ENGINE') {
        data = { streak: 5, score: 85, protein: 120, targetProtein: 150 };
      } else if (mode === 'MOOD_METABOLIC') {
        data = { mood: userProfile.mood || 'Neutral', carbs: 80, sugar: 30, protein: 20 };
      } else if (mode === 'FUTURE_PREDICTION') {
        data = { weight: userProfile.weight_kg, calorieAvg: 2200, maintenance: 2500, duration: 30 };
      } else if (mode === 'CHEAT_OPTIMIZER') {
        data = { food: 'Pizza', calories: 1200, carbs: 150 };
      } else if (mode === 'MEAL_PLANNER') {
        data = { calories: 2000, protein: 150, preference: 'Indian' };
      } else if (mode === 'GROCERY_GENERATOR') {
        data = { goal: userProfile.goal, calories: 2000, proteinTarget: 150 };
      } else if (mode === 'HEALTH_WARNING') {
        data = { sodium: 3500, sugar: 80, fiber: 15 };
      } else if (mode === 'PATTERN_DETECTION') {
        data = { meal_log: "Late night pizza at 11 PM, skipped breakfast, high sugar snack at 4 PM" };
      } else if (mode === 'BODY_TYPE_MODE') {
        data = { bodyType: 'Mesomorph', goal: userProfile.goal };
      } else if (mode === 'SMART_REMINDER') {
        data = { time: '3 hours ago', water: '1.5L', steps: 4000 };
      }

      const engineResult = await runIntelligenceEngine(mode, data, userProfile);
      setResult(engineResult);
      setEngineHistory(prev => [{ mode, result: engineResult, timestamp: new Date().toLocaleTimeString() }, ...prev]);

      // Update global state if applicable
      if (mode === 'STREAK_ENGINE' && engineResult.reward_points && onUpdatePoints) {
        onUpdatePoints(prev => prev + engineResult.reward_points);
      }
      if (mode === 'STREAK_ENGINE' && engineResult.streak_status === 'continued' && onUpdateStreak) {
        onUpdateStreak(prev => prev + 1);
      }
    } catch (error) {
      console.error("Engine failure:", error);
      alert("Intelligence Engine encountered an error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Nutrition Intelligence</h2>
            <p className="text-xs text-slate-500">Advanced AI-driven metabolic & behavioral engines</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          Premium AI Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[500px]">
        {/* Sidebar Tools */}
        <div className="border-r border-slate-100 p-4 space-y-2 overflow-y-auto max-h-[600px]">
          <div className="px-3 mb-4 flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Engines</h4>
            <Sparkles className="w-3 h-3 text-indigo-400" />
          </div>
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                setResult(null);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group ${
                activeTool === tool.id 
                  ? 'bg-indigo-50 border border-indigo-100 shadow-sm' 
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${tool.bgColor} ${tool.color}`}>
                {tool.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm truncate ${activeTool === tool.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {tool.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{tool.description}</div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTool === tool.id ? 'text-indigo-400 translate-x-1' : 'text-slate-300'}`} />
            </button>
          ))}

          {engineHistory.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="px-3 mb-4 flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h4>
                <Clock className="w-3 h-3 text-slate-300" />
              </div>
              <div className="space-y-2">
                {engineHistory.map((entry, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveTool(entry.mode);
                      setResult(entry.result);
                    }}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all text-left group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">{entry.mode.replace('_ENGINE', '').replace('_', ' ')}</span>
                      <span className="text-[9px] text-slate-400">{entry.timestamp}</span>
                    </div>
                    <div className="text-xs text-slate-600 truncate font-medium">Simulation successful</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Workspace */}
        <div className="lg:col-span-2 p-8 bg-slate-50/30">
          <AnimatePresence mode="wait">
            {!activeTool ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-none flex-col items-center justify-center text-center max-w-sm mx-auto"
              >
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                  <Layout className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Select an Intelligence Engine</h3>
                <p className="text-sm text-slate-500">Choose a specialized tool from the sidebar to run advanced metabolic simulations and behavioral analysis.</p>
              </motion.div>
            ) : (
              <motion.div 
                key={activeTool}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${TOOLS.find(t => t.id === activeTool)?.bgColor} ${TOOLS.find(t => t.id === activeTool)?.color}`}>
                      {TOOLS.find(t => t.id === activeTool)?.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{TOOLS.find(t => t.id === activeTool)?.name}</h3>
                      <p className="text-slate-500">{TOOLS.find(t => t.id === activeTool)?.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
                        </div>
                      </div>
                      <p className="mt-4 text-slate-500 font-medium animate-pulse">AI Engine Processing...</p>
                    </div>
                  ) : result ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold text-sm uppercase tracking-wider">
                          <Zap className="w-4 h-4" /> Engine Output
                        </div>
                        
                        {/* Dynamic Result Rendering */}
                        <div className="space-y-4">
                          {result.report ? (
                            <div className="markdown-body prose prose-slate max-w-none">
                              <Markdown>{result.report}</Markdown>
                            </div>
                          ) : (
                            Object.entries(result).map(([key, value]) => (
                              key !== 'report' && (
                                <div key={key} className="border-b border-slate-50 pb-3 last:border-0">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</div>
                                  <div className="text-slate-800 font-medium">
                                    {Array.isArray(value) ? (
                                      <ul className="list-disc list-inside space-y-1">
                                        {value.map((item, i) => <li key={i} className="text-sm">{String(item)}</li>)}
                                      </ul>
                                    ) : typeof value === 'object' ? (
                                      <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-auto max-h-40">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                    ) : (
                                      <span className="text-lg">{String(value)}</span>
                                    )}
                                  </div>
                                </div>
                              )
                            ))
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setResult(null)}
                        className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                      >
                        Reset Engine
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-slate-400" /> Simulation Parameters
                        </h4>
                        
                        {/* Custom Input for specific modes */}
                        {(activeTool === 'CHEAT_OPTIMIZER' || activeTool === 'PATTERN_DETECTION') && (
                          <div className="mb-6">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                              {activeTool === 'CHEAT_OPTIMIZER' ? 'What food are you planning?' : 'Describe your eating pattern'}
                            </label>
                            <input 
                              type="text"
                              placeholder={activeTool === 'CHEAT_OPTIMIZER' ? "e.g., Double Cheeseburger" : "e.g., I eat late at night..."}
                              onChange={(e) => setInputData({ ...inputData, [activeTool === 'CHEAT_OPTIMIZER' ? 'food' : 'meal_log']: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">User Goal</div>
                            <div className="text-sm font-medium text-slate-700 capitalize">{userProfile.goal.replace(/_/g, ' ')}</div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Mood</div>
                            <div className="text-sm font-medium text-slate-700">{userProfile.mood || 'Not Set'}</div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Weight</div>
                            <div className="text-sm font-medium text-slate-700">{userProfile.weight_kg} kg</div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Activity</div>
                            <div className="text-sm font-medium text-slate-700 capitalize">{userProfile.activity_level}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                          <Play className="w-8 h-8 text-indigo-500 ml-1" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Ready to Initialize</h4>
                        <p className="text-sm text-slate-500 mb-8 max-w-xs">The engine is primed with your profile data. Click below to run the simulation.</p>
                        <button 
                          onClick={() => handleRunEngine(activeTool)}
                          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                          <Zap className="w-5 h-5" />
                          Run Intelligence Engine
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

function Play({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
    >
      <path d="m7 3 14 9-14 9V3z" />
    </svg>
  );
}
