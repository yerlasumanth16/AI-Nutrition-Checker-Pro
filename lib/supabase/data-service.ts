"use client";

import { createClient } from "./client";

const supabase = createClient();

// Profile operations
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
}

export async function updateProfile(userId: string, profile: any) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...profile, updated_at: new Date().toISOString() })
    .select()
    .single();
  
  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
  return data;
}

// Nutrition logs operations
export async function getNutritionLogs(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching nutrition logs:", error);
    return [];
  }
  return data || [];
}

export async function addNutritionLog(userId: string, log: any) {
  const { data, error } = await supabase
    .from("nutrition_logs")
    .insert({ user_id: userId, ...log })
    .select()
    .single();
  
  if (error) {
    console.error("Error adding nutrition log:", error);
    throw error;
  }
  return data;
}

export async function deleteNutritionLog(logId: string) {
  const { error } = await supabase
    .from("nutrition_logs")
    .delete()
    .eq("id", logId);
  
  if (error) {
    console.error("Error deleting nutrition log:", error);
    throw error;
  }
}

// Daily stats operations
export async function getDailyStats(userId: string, date: string) {
  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("analysis")
    .eq("user_id", userId)
    .gte("created_at", `${date}T00:00:00`)
    .lt("created_at", `${date}T23:59:59`);
  
  if (error) {
    console.error("Error fetching daily stats:", error);
    return { calories: 0, protein: 0, carbs: 0, fat: 0, caloriesBurned: 0, water: 0 };
  }

  // Calculate totals from nutrition logs
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  
  data?.forEach((log: any) => {
    const analysis = log.analysis;
    if (analysis?.macronutrients) {
      analysis.macronutrients.forEach((macro: any) => {
        if (macro.name === "Calories") calories += macro.value || 0;
        if (macro.name === "Protein") protein += macro.value || 0;
        if (macro.name === "Carbohydrates") carbs += macro.value || 0;
        if (macro.name === "Fat") fat += macro.value || 0;
      });
    }
  });

  // Get workouts for calories burned
  const { data: workouts } = await supabase
    .from("workouts")
    .select("calories_burned")
    .eq("user_id", userId)
    .gte("created_at", `${date}T00:00:00`)
    .lt("created_at", `${date}T23:59:59`);

  const caloriesBurned = workouts?.reduce((sum, w) => sum + (w.calories_burned || 0), 0) || 0;

  // Get hydration
  const { data: hydration } = await supabase
    .from("hydration_logs")
    .select("amount_ml")
    .eq("user_id", userId)
    .gte("created_at", `${date}T00:00:00`)
    .lt("created_at", `${date}T23:59:59`);

  const water = hydration?.reduce((sum, h) => sum + (h.amount_ml || 0), 0) || 0;

  return { calories, protein, carbs, fat, caloriesBurned, water };
}

// Workout operations
export async function getWorkouts(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching workouts:", error);
    return [];
  }
  return data || [];
}

export async function addWorkout(userId: string, workout: any) {
  const { data, error } = await supabase
    .from("workouts")
    .insert({ user_id: userId, ...workout })
    .select()
    .single();
  
  if (error) {
    console.error("Error adding workout:", error);
    throw error;
  }
  return data;
}

export async function deleteWorkout(workoutId: string) {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId);
  
  if (error) {
    console.error("Error deleting workout:", error);
    throw error;
  }
}

// Meal plan operations
export async function getMealPlans(userId: string) {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(7);
  
  if (error) {
    console.error("Error fetching meal plans:", error);
    return [];
  }
  return data || [];
}

export async function saveMealPlan(userId: string, mealPlan: any) {
  const { data, error } = await supabase
    .from("meal_plans")
    .upsert({ 
      user_id: userId, 
      date: mealPlan.date,
      plan_data: mealPlan 
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error saving meal plan:", error);
    throw error;
  }
  return data;
}

// Hydration operations
export async function addHydration(userId: string, amountMl: number) {
  const { data, error } = await supabase
    .from("hydration_logs")
    .insert({ user_id: userId, amount_ml: amountMl })
    .select()
    .single();
  
  if (error) {
    console.error("Error adding hydration:", error);
    throw error;
  }
  return data;
}

// Habit operations
export async function getHabits(userId: string, date: string) {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date);
  
  if (error) {
    console.error("Error fetching habits:", error);
    return [];
  }
  return data || [];
}

export async function updateHabit(userId: string, date: string, habitName: string, completed: boolean) {
  const { data, error } = await supabase
    .from("habit_logs")
    .upsert({ 
      user_id: userId, 
      date, 
      habit_name: habitName, 
      completed 
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error updating habit:", error);
    throw error;
  }
  return data;
}

// Sleep operations
export async function addSleepLog(userId: string, hours: number, quality: string) {
  const { data, error } = await supabase
    .from("sleep_logs")
    .insert({ user_id: userId, hours, quality })
    .select()
    .single();
  
  if (error) {
    console.error("Error adding sleep log:", error);
    throw error;
  }
  return data;
}

// Community posts operations
export async function getCommunityPosts(limit = 20) {
  const { data, error } = await supabase
    .from("community_posts")
    .select(`
      *,
      profiles:user_id (display_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching community posts:", error);
    return [];
  }
  return data || [];
}

export async function addCommunityPost(userId: string, content: string, imageUrl?: string) {
  const { data, error } = await supabase
    .from("community_posts")
    .insert({ user_id: userId, content, image_url: imageUrl })
    .select()
    .single();
  
  if (error) {
    console.error("Error adding community post:", error);
    throw error;
  }
  return data;
}

export async function likeCommunityPost(postId: string, userId: string) {
  // First get current likes
  const { data: post } = await supabase
    .from("community_posts")
    .select("likes")
    .eq("id", postId)
    .single();

  const currentLikes = post?.likes || [];
  const newLikes = currentLikes.includes(userId)
    ? currentLikes.filter((id: string) => id !== userId)
    : [...currentLikes, userId];

  const { error } = await supabase
    .from("community_posts")
    .update({ likes: newLikes })
    .eq("id", postId);

  if (error) {
    console.error("Error liking post:", error);
    throw error;
  }
}

// Subscribe to real-time updates
export function subscribeToNutritionLogs(userId: string, callback: (logs: any[]) => void) {
  const channel = supabase
    .channel(`nutrition_logs_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "nutrition_logs",
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const logs = await getNutritionLogs(userId);
        callback(logs);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToProfile(userId: string, callback: (profile: any) => void) {
  const channel = supabase
    .channel(`profile_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      },
      async () => {
        const profile = await getProfile(userId);
        callback(profile);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
