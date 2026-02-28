import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { NutritionAnalysisResponse } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity, Heart, AlertTriangle, CheckCircle, Info, Flame, Scale, Brain, Zap, FileText, Printer, Loader2, Microscope, Play, Video as VideoIcon, ArrowRight, Download, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { PreventiveHealthDisplay } from './PreventiveHealthDisplay';
import { generateAudioSummary } from '../services/ai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface NutritionDisplayProps {
  data: NutritionAnalysisResponse;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
  onRunDeepAnalysis: () => void;
  isRunningDeepAnalysis: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function NutritionDisplay({ data, onGenerateReport, isGeneratingReport, onRunDeepAnalysis, isRunningDeepAnalysis }: NutritionDisplayProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const handlePlaySummary = async () => {
    if (audioUrl) {
      new Audio(audioUrl).play();
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const summaryText = `Nutritional analysis for ${data.food_analysis.food_name}. 
        It contains ${data.food_analysis.calories_kcal} calories. 
        Health score is ${data.food_analysis.health_score}. 
        ${data.food_analysis.analysis_summary || ''}`;
      
      const base64Audio = await generateAudioSummary(summaryText);
      const blob = await (await fetch(`data:audio/mp3;base64,${base64Audio}`)).blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      new Audio(url).play();
    } catch (error) {
      console.error("Audio generation failed:", error);
      alert("Failed to generate audio summary.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  if (!data || (!data.food_analysis && !data.error)) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Analysis Incomplete</h3>
        <p className="text-slate-500">The AI returned an incomplete response. This can happen with complex queries. Please try again with a simpler food name.</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6" />
        <p>{data.error}</p>
      </div>
    );
  }

  const { 
    food_analysis, 
    personalized_impact, 
    risk_prediction, 
    gut_health_analysis, 
    food_compatibility, 
    ai_recommendations = [], 
    downloadable_report, 
    preventive_health_data 
  } = data;

  if (!food_analysis) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Analysis Incomplete</h3>
        <p className="text-slate-500">The AI was unable to generate a complete nutritional profile for this item. Please try a more specific food name.</p>
      </div>
    );
  }

  const handlePrint = () => {
    if (downloadable_report?.print_ready_html) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(downloadable_report.print_ready_html);
        printWindow.document.close();
        // Wait for images/styles to load then print
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!downloadable_report?.print_ready_html) return;

    // Create a temporary container to render the HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px'; // A4-ish width
    container.innerHTML = downloadable_report.print_ready_html;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Nutrition_Report_${food_analysis.food_name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try the Print option.");
    } finally {
      document.body.removeChild(container);
    }
  };

  const macroData = [
    { name: 'Carbs', value: food_analysis.macronutrients?.carbohydrates_g || 0 },
    { name: 'Protein', value: food_analysis.macronutrients?.proteins_g || 0 },
    { name: 'Fats', value: food_analysis.macronutrients?.fats_g || 0 },
  ];

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'moderate': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'high': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 capitalize">{food_analysis.food_name}</h2>
            <p className="text-slate-500 mt-1">{food_analysis.serving_reference} • {food_analysis.calories_kcal} kcal</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <button
              onClick={handlePlaySummary}
              disabled={isGeneratingAudio}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              title="Listen to Summary"
            >
              {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </button>

            {!preventive_health_data && (
              <button 
                onClick={onRunDeepAnalysis}
                disabled={isRunningDeepAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors font-medium disabled:opacity-50"
              >
                {isRunningDeepAnalysis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Microscope className="w-4 h-4" />}
                Deep Analysis
              </button>
            )}
            
            {downloadable_report ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors font-medium"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            ) : (
              <button 
                onClick={onGenerateReport}
                disabled={isGeneratingReport}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors font-medium disabled:opacity-50"
              >
                {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Report
              </button>
            )}
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quality Index</span>
              <span className="text-2xl font-bold text-slate-900">{(food_analysis.quality_index || 0).toFixed(1)}</span>
            </div>
            <div className="h-12 w-px bg-slate-200"></div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Health Score</span>
              <span className={`text-4xl font-bold ${
                (food_analysis.health_score || 0) >= 80 ? 'text-emerald-500' :
                (food_analysis.health_score || 0) >= 50 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {food_analysis.health_score || 0}
              </span>
            </div>
          </div>
        </div>

      {/* AI Summary Section */}
      {food_analysis.analysis_summary && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4 text-emerald-600 font-bold text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> AI Clinical Summary
          </div>
          <div className="markdown-body prose prose-slate max-w-none">
            <Markdown>{food_analysis.analysis_summary}</Markdown>
          </div>
        </motion.div>
      )}

        {/* AI Recommendations */}
        {ai_recommendations && ai_recommendations.length > 0 && (
          <div className="mt-6 space-y-1">
            {ai_recommendations.map((rec, idx) => (
              <div key={idx} className="group flex items-start gap-2 text-sm text-slate-600 hover:bg-slate-50 p-1.5 rounded-xl transition-all border border-transparent hover:border-slate-100">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="flex-1 leading-relaxed">{rec}</span>
                <button 
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-white text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100 hover:bg-blue-50 transition-all shadow-sm"
                  onClick={() => alert(`This feature would provide deep-dive research or actionable steps for: "${rec}"`)}
                >
                  Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Macros Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" /> Macronutrients
          </h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="font-bold text-blue-700">{food_analysis.macronutrients?.carbohydrates_g || 0}g</div>
              <div className="text-blue-600 text-xs">Carbs</div>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <div className="font-bold text-emerald-700">{food_analysis.macronutrients?.proteins_g || 0}g</div>
              <div className="text-emerald-600 text-xs">Protein</div>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <div className="font-bold text-amber-700">{food_analysis.macronutrients?.fats_g || 0}g</div>
              <div className="text-amber-600 text-xs">Fats</div>
            </div>
          </div>
        </div>

        {/* Personalized Impact */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Metabolic Impact
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="text-sm text-orange-800 mb-1">Daily Calorie Need</div>
              <div className="text-2xl font-bold text-orange-900">{personalized_impact?.daily_calorie_requirement || 0} kcal</div>
              <div className="text-xs text-orange-700 mt-1">
                This food is {personalized_impact?.percentage_of_daily_calories || 0}% of your daily intake
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-slate-500 mb-2">Goal Alignment</div>
              <div className={`p-3 rounded-lg border text-sm font-medium ${
                personalized_impact?.goal_alignment === 'Good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                personalized_impact?.goal_alignment === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                {personalized_impact?.goal_alignment || 'Unknown'}
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {personalized_impact?.recommended_adjustment || 'No adjustment recommended.'}
              </p>
            </div>
          </div>
        </div>

        {/* Risk Prediction */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" /> Risk Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Diabetes Risk</span>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(risk_prediction?.diabetes_risk || 'Low')}`}>
                {risk_prediction?.diabetes_risk || 'Low'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Cardio Risk</span>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(risk_prediction?.cardiovascular_risk || 'Low')}`}>
                {risk_prediction?.cardiovascular_risk || 'Low'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Obesity Risk</span>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(risk_prediction?.obesity_risk || 'Low')}`}>
                {risk_prediction?.obesity_risk || 'Low'}
              </span>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Glycemic Index</span>
                <span className="font-mono font-medium">{food_analysis.glycemic_index || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (food_analysis.glycemic_index || 0) < 55 ? 'bg-emerald-500' : 
                    (food_analysis.glycemic_index || 0) < 70 ? 'bg-amber-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${Math.min(food_analysis.glycemic_index || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gut Health */}
        {gut_health_analysis && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" /> Gut Health
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">Prebiotic Score</div>
                <div className="text-xl font-bold text-purple-900">{(gut_health_analysis.prebiotic_score || 0)}/100</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">Digestive Friendliness</div>
                <div className="text-lg font-bold text-purple-900">{gut_health_analysis.digestive_friendliness || 'Unknown'}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <AlertTriangle className={`w-4 h-4 ${
                gut_health_analysis.inflammation_risk === 'High' ? 'text-red-500' : 
                gut_health_analysis.inflammation_risk === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'
              }`} />
              <span>Inflammation Risk: <strong>{gut_health_analysis.inflammation_risk || 'Low'}</strong></span>
            </div>
          </div>
        )}

        {/* Compatibility */}
        {food_compatibility && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Food Compatibility
            </h3>
            <p className="text-sm text-slate-500 mb-4 italic">"{food_compatibility.reasoning || 'No compatibility data available.'}"</p>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide block mb-1">Good Combinations</span>
                <div className="flex flex-wrap gap-2">
                  {food_compatibility.compatible_with?.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs border border-emerald-100">
                      {item}
                    </span>
                  )) || <span className="text-xs text-slate-400 italic">None identified</span>}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-red-600 uppercase tracking-wide block mb-1">Avoid Combining With</span>
                <div className="flex flex-wrap gap-2">
                  {food_compatibility.avoid_combining_with?.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs border border-red-100">
                      {item}
                    </span>
                  )) || <span className="text-xs text-slate-400 italic">None identified</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Micronutrients Table */}
      {food_analysis.micronutrients && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-slate-500" /> Micronutrient Profile
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(food_analysis.micronutrients).map(([key, value]) => (
              <div key={key} className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  {key.replace(/_/g, ' ').replace('mg', '').replace('mcg', '')}
                </div>
                <div className="font-mono font-medium text-slate-900">
                  {value} <span className="text-xs text-slate-400">{key.includes('mcg') ? 'mcg' : 'mg'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {preventive_health_data && (
        <PreventiveHealthDisplay data={preventive_health_data} />
      )}
    </div>
  );
}
