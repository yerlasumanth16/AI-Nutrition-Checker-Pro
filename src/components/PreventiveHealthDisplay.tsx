import React from 'react';
import { PreventiveHealthData } from '../types';
import { Activity, Brain, Heart, Zap, Scale, AlertTriangle, TrendingUp, Dna, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface PreventiveHealthDisplayProps {
  data: PreventiveHealthData;
}

export function PreventiveHealthDisplay({ data }: PreventiveHealthDisplayProps) {
  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6 mt-12 border-t border-slate-200 pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
          <Dna className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Preventive Health Intelligence</h2>
          <p className="text-slate-500">Advanced clinical analysis & long-term projections</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.metabolic_health_report && (
          <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Metabolic Health</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">BMR</span>
                <span className="font-mono font-medium">{data.metabolic_health_report.bmr} kcal</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">TDEE</span>
                <span className="font-mono font-medium">{data.metabolic_health_report.tdee} kcal</span>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-100">
                <div className="text-xs text-indigo-600 uppercase tracking-wide mb-1">Efficiency Score</div>
                <div className="text-2xl font-bold text-indigo-900">{data.metabolic_health_report.metabolic_efficiency_score}/100</div>
              </div>
            </div>
          </div>
        )}

        {data.cardiovascular_risk_report && (
          <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl border border-rose-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-rose-600" />
              <h3 className="font-semibold text-slate-900">Cardio Risk</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Heart Index</span>
                <span className="font-mono font-medium">{data.cardiovascular_risk_report.heart_health_index}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sodium Risk</span>
                <span className={`font-medium ${
                  data.cardiovascular_risk_report.sodium_risk === 'High' ? 'text-red-600' : 'text-slate-900'
                }`}>{data.cardiovascular_risk_report.sodium_risk}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-rose-100">
                <div className="text-xs text-rose-600 uppercase tracking-wide mb-1">Overall Risk</div>
                <div className="text-lg font-bold text-rose-900">{data.cardiovascular_risk_report.overall_cardiovascular_risk}</div>
              </div>
            </div>
          </div>
        )}

        {data.cognitive_nutrition_report && (
          <div className="bg-gradient-to-br from-cyan-50 to-white p-6 rounded-2xl border border-cyan-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-cyan-600" />
              <h3 className="font-semibold text-slate-900">Cognitive & Mood</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Brain Support</span>
                <span className="font-mono font-medium">{data.cognitive_nutrition_report.brain_support_score}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Mental Energy</span>
                <span className="font-mono font-medium">{data.cognitive_nutrition_report.mental_energy_rating}/10</span>
              </div>
              <div className="mt-3 pt-3 border-t border-cyan-100">
                <div className="text-xs text-cyan-600 uppercase tracking-wide mb-1">Omega-3 Support</div>
                <div className="text-lg font-bold text-cyan-900">{data.cognitive_nutrition_report.omega3_support}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projections & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.long_term_diet_trend_analysis && data.six_month_impact_simulation && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Long-Term Projections
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">6-Month Weight Change</span>
                <span className="font-bold text-slate-900">{data.six_month_impact_simulation.projected_weight_change_kg} kg</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Diabetes Risk Trend</span>
                <span className={`font-medium ${
                  data.long_term_diet_trend_analysis.diabetes_risk_trend === 'Increasing' ? 'text-red-600' : 'text-emerald-600'
                }`}>{data.long_term_diet_trend_analysis.diabetes_risk_trend}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Metabolic Stability</span>
                <span className={`font-medium ${
                  data.long_term_diet_trend_analysis.metabolic_stability_trend === 'Declining' ? 'text-red-600' : 'text-emerald-600'
                }`}>{data.long_term_diet_trend_analysis.metabolic_stability_trend}</span>
              </div>
            </div>
          </div>
        )}

        {data.hormonal_balance_support_report && data.genetic_sensitivity_simulation && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Hormonal & Genetic
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="text-xs text-amber-700 uppercase mb-1">Cortisol Balance</div>
                  <div className="font-semibold text-amber-900">{data.hormonal_balance_support_report.cortisol_balance_support}</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="text-xs text-amber-700 uppercase mb-1">Thyroid Support</div>
                  <div className="font-semibold text-amber-900">{data.hormonal_balance_support_report.thyroid_support}</div>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 uppercase mb-1">Genetic Simulation Note</div>
                <p className="text-sm text-slate-700 italic">"{data.genetic_sensitivity_simulation.personalized_note}"</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skin Health Section */}
      {data.skin_health_report && (
        <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-semibold text-slate-900">Skin Glow & Dermatological Health</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col justify-center items-center p-4 bg-white rounded-xl border border-pink-100">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-pink-100"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (data.skin_health_report.skin_glow_percentage || 0)) / 100}
                    className="text-pink-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-pink-600">{data.skin_health_report.skin_glow_percentage || 0}%</span>
                  <span className="text-xs text-pink-400 font-medium">GLOW</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-pink-50">
                <span className="text-sm text-slate-600">Collagen Support</span>
                <span className={`text-sm font-medium ${
                  data.skin_health_report.collagen_support_rating === 'High' ? 'text-emerald-600' : 
                  data.skin_health_report.collagen_support_rating === 'Moderate' ? 'text-amber-600' : 'text-red-600'
                }`}>{data.skin_health_report.collagen_support_rating}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-pink-50">
                <span className="text-sm text-slate-600">Hydration</span>
                <span className={`text-sm font-medium ${
                  data.skin_health_report.hydration_support_rating === 'High' ? 'text-emerald-600' : 
                  data.skin_health_report.hydration_support_rating === 'Moderate' ? 'text-amber-600' : 'text-red-600'
                }`}>{data.skin_health_report.hydration_support_rating}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-pink-50">
                <span className="text-sm text-slate-600">Acne Risk</span>
                <span className={`text-sm font-medium ${
                  data.skin_health_report.acne_risk_impact === 'Decrease' ? 'text-emerald-600' : 
                  data.skin_health_report.acne_risk_impact === 'Neutral' ? 'text-slate-600' : 'text-red-600'
                }`}>{data.skin_health_report.acne_risk_impact}</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-pink-100">
              <div className="text-xs text-pink-400 uppercase tracking-wide mb-2">Dermatological Summary</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {data.skin_health_report.dermatological_summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.preventive_health_summary && (
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
          <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" /> Priority Recommendations
          </h3>
          <ul className="space-y-2">
            {data.preventive_health_summary.priority_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-emerald-800 text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-slate-400 text-center pt-4">
        {data.medical_disclaimer}
      </div>
    </div>
  );
}
