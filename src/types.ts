export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  goal: 'fat_loss' | 'muscle_gain' | 'maintenance';
  mood?: string;
}

export interface FoodAnalysis {
  food_name: string;
  serving_reference: string;
  calories_kcal: number;
  macronutrients: {
    carbohydrates_g: number;
    proteins_g: number;
    fats_g: number;
    fiber_g: number;
    sugars_g: number;
  };
  micronutrients: {
    calcium_mg: number;
    iron_mg: number;
    potassium_mg: number;
    magnesium_mg: number;
    vitamin_c_mg: number;
    vitamin_b12_mcg: number;
  };
  glycemic_index: number;
  nutrient_density_score: number;
  health_score: number;
  quality_index: number;
  analysis_summary?: string;
}

export interface PersonalizedImpact {
  daily_calorie_requirement: number;
  percentage_of_daily_calories: number;
  goal_alignment: 'Good' | 'Moderate' | 'Poor';
  recommended_adjustment: string;
}

export interface RiskPrediction {
  diabetes_risk: 'Low' | 'Moderate' | 'High';
  cardiovascular_risk: 'Low' | 'Moderate' | 'High';
  obesity_risk: 'Low' | 'Moderate' | 'High';
}

export interface GutHealthAnalysis {
  prebiotic_score: number;
  digestive_friendliness: 'Good' | 'Moderate' | 'Poor';
  inflammation_risk: 'Low' | 'Moderate' | 'High';
}

export interface FoodCompatibility {
  compatible_with: string[];
  avoid_combining_with: string[];
  reasoning: string;
}

export interface UIMetadata {
  theme_palette: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_gradient: string;
  };
  recommended_visuals: string[];
  icon_style: string;
  font_style: string;
}

export interface DownloadableReport {
  report_id: string;
  report_title: string;
  generated_on: string;
  report_summary: string;
  detailed_sections: {
    user_profile_summary: string;
    metabolic_analysis: string;
    food_nutritional_breakdown: string;
    risk_assessment: string;
    gut_health_analysis: string;
    goal_alignment_analysis: string;
    recommendations: string;
  };
  print_ready_html: string;
}

export interface PreventiveHealthData {
  metabolic_health_report: {
    bmr: number;
    tdee: number;
    metabolic_efficiency_score: number;
    calorie_balance_status: "Deficit" | "Surplus" | "Maintenance";
  };
  glycemic_and_insulin_report: {
    glycemic_index: number;
    glycemic_load: number;
    classification: "Low" | "Moderate" | "High";
    insulin_spike_probability: "Low" | "Moderate" | "High";
  };
  cardiovascular_risk_report: {
    heart_health_index: number;
    sodium_risk: "Low" | "Moderate" | "High";
    saturated_fat_risk: "Low" | "Moderate" | "High";
    overall_cardiovascular_risk: "Low" | "Moderate" | "High";
  };
  cognitive_nutrition_report: {
    brain_support_score: number;
    omega3_support: "Low" | "Moderate" | "High";
    b12_support: "Low" | "Moderate" | "High";
    mental_energy_rating: number;
  };
  gut_microbiome_report: {
    prebiotic_score: number;
    digestive_friendliness: "Good" | "Moderate" | "Poor";
    inflammation_risk: "Low" | "Moderate" | "High";
  };
  nutrient_deficiency_projection: {
    iron_deficiency_risk: "Low" | "Moderate" | "High";
    b12_deficiency_risk: "Low" | "Moderate" | "High";
    calcium_deficiency_risk: "Low" | "Moderate" | "High";
    protein_deficiency_risk: "Low" | "Moderate" | "High";
  };
  body_composition_projection: {
    weekly_weight_change_estimate_kg: number;
    lean_mass_gain_potential: "Low" | "Moderate" | "High";
    fat_storage_probability: "Low" | "Moderate" | "High";
  };
  preventive_health_summary: {
    overall_health_score: number;
    top_strengths: string[];
    top_risks: string[];
    priority_recommendations: string[];
  };
  genetic_sensitivity_simulation: {
    caffeine_metabolism_assumption: "Fast" | "Slow";
    carb_sensitivity_assumption: "Low" | "Moderate" | "High";
    fat_sensitivity_assumption: "Low" | "Moderate" | "High";
    personalized_note: string;
  };
  long_term_diet_trend_analysis: {
    diabetes_risk_trend: "Stable" | "Increasing" | "Decreasing";
    cardiovascular_risk_trend: "Stable" | "Increasing" | "Decreasing";
    metabolic_stability_trend: "Stable" | "Improving" | "Declining";
  };
  hormonal_balance_support_report: {
    thyroid_support: "Low" | "Moderate" | "High";
    testosterone_or_estrogen_support: "Low" | "Moderate" | "High";
    cortisol_balance_support: "Low" | "Moderate" | "High";
  };
  skin_health_report: {
    skin_glow_percentage: number;
    collagen_support_rating: "Low" | "Moderate" | "High";
    hydration_support_rating: "Low" | "Moderate" | "High";
    anti_aging_support_score: number;
    acne_risk_impact: "Increase" | "Neutral" | "Decrease";
    glycation_risk_level: "Low" | "Moderate" | "High";
    dermatological_summary: string;
  };
  six_month_impact_simulation: {
    projected_weight_change_kg: number;
    projected_diabetes_risk_change: "Increase" | "Stable" | "Decrease";
    projected_heart_risk_change: "Increase" | "Stable" | "Decrease";
  };
  medical_disclaimer: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface VideoGenerationResult {
  videoUri: string;
  expiresAt: Date;
}

export interface StreakEngineResponse {
  streak_status: string;
  badge: string;
  reward_points: number;
  motivation_message: string;
}

export interface MoodMetabolicResponse {
  emotional_analysis: string;
  metabolic_risk: number;
  recommended_foods: string[];
  avoid_foods: string[];
}

export interface FutureBodyPredictionResponse {
  predicted_weight_kg: number;
  weight_change_kg: number;
  confidence_score: number;
  analysis: string;
}

export interface CheatMealOptimizerResponse {
  compensation_strategy: {
    day_1: string;
    day_2: string;
  };
  metabolic_stability_notes: string;
  protein_target_maintenance: string;
}

export interface CommunityLeaderboardResponse {
  rank_percentile: number;
  competitive_motivation: string;
  improvement_strategy: string;
}

export interface SmartReminderResponse {
  reminder_needed: boolean;
  message: string;
}

export interface HealthWarningResponse {
  sodium_risk: number;
  sugar_risk: number;
  fiber_adequacy: number;
  overall_risk_score: number;
  warning_severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface BodyTypeMacroResponse {
  carb_ratio: number;
  protein_ratio: number;
  fat_ratio: number;
  personalized_distribution_notes: string;
}

export interface OneTapMealPlanResponse {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  total_macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface PatternDetectionResponse {
  identified_patterns: string[];
  explanation: string;
  correction_strategy: string;
}

export interface SmartGroceryResponse {
  weekly_grocery_list: {
    category: string;
    items: { name: string; quantity: string }[];
  }[];
  budget_conscious_notes: string;
}

export interface NutritionAnalysisResponse {
  food_analysis: FoodAnalysis;
  personalized_impact: PersonalizedImpact;
  risk_prediction: RiskPrediction;
  gut_health_analysis: GutHealthAnalysis;
  food_compatibility: FoodCompatibility;
  ai_recommendations: string[];
  ui_metadata: UIMetadata;
  downloadable_report?: DownloadableReport;
  preventive_health_data?: PreventiveHealthData;
  error?: string;
}
