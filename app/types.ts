export type HealthGoal = 'weight-loss' | 'muscle-gain' | 'heart-health' | 'diabetes' | 'balanced';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy';
export type Gender = 'male' | 'female';

export interface UserProfile {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  bmi: number;
  bmr: number;
  tdee: number;
  calorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fat: number;
  };
  points: number;
  badges: string[];
  streak: number;
  lastActiveDate?: string;
  dietaryRestrictions?: string[];
  fitnessLevel?: string;
}

export interface Workout {
  id: string;
  timestamp: string;
  type: string;
  duration: number; // minutes
  intensity: 'low' | 'moderate' | 'high';
  caloriesBurned: number;
}

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
  portionEstimation?: string;
  nutritionScore: { score: number; level: string; explanation?: string };
  macronutrients: Nutrient[];
  micronutrients: Nutrient[];
  risks: Risk[];
  metabolicImpact: MetabolicImpact;
  healthInsights: HealthInsights;
  clinicalSummary: string;
  expertFeatures: ExpertFeatures;
  goalContext?: HealthGoal;
  groundingMetadata?: any;
}

export interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  alternatives: string[];
}

export interface DailyMealPlan {
  date: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
}

export interface GroceryItem {
  name: string;
  quantity: string;
  category: string;
}

export interface HydrationLog {
  timestamp: string;
  amount: number; // ml
}

export interface HabitLog {
  date: string;
  habitId: string;
  completed: boolean;
}

export interface SleepLog {
  date: string;
  duration: number; // hours
  quality: number; // 1-10
  recoveryScore: number; // 1-100
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
}
