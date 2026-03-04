export type HealthGoal = 'weight-loss' | 'muscle-gain' | 'heart-health' | 'diabetes' | 'balanced';

export interface Nutrient {
  name: string;
  value: number;
  unit: string;
  rdi: number;
  percentage: number;
  status: string;
}

export interface Risk {
  name: string;
  explanation: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  consequences: string;
}

export interface MetabolicImpact {
  glycemicImpact: string;
  energyDensity: string;
  metabolicLoad: string;
  nutrientDensityScore: number;
  analysis: string;
}

export interface HealthInsights {
  weightManagement: string;
  muscleBuilding: string;
  heartHealth: string;
  diabetesSuitability: string;
  fitnessCompatibility: string;
}

export interface ExpertFeatures {
  mealRating: string;
  classification: string;
  longTermImpact: string;
  suggestions: string[];
  alternatives: string[];
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  foodName: string;
  nutritionScore: { score: number; level: string };
  macronutrients: Nutrient[];
  micronutrients: Nutrient[];
  risks: Risk[];
  metabolicImpact: MetabolicImpact;
  healthInsights: HealthInsights;
  clinicalSummary: string;
  expertFeatures: ExpertFeatures;
  goalContext?: HealthGoal;
}
