"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "./supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscription_type: "free" | "premium";
  subscription_status: "active" | "cancelled" | "expired" | null;
  subscription_end: string | null;
  role: "user" | "admin";
  profile_photo?: string;
  dietary_restrictions?: string[];
  fitness_level?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active";
}

// Keep compatibility with existing code
interface User {
  id: string;
  name: string;
  email: string;
  subscriptionType: "free" | "premium";
  subscriptionStatus: "active" | "cancelled" | "expired" | null;
  subscriptionEnd: string | null;
  role: "user" | "admin";
  profilePhoto?: string;
  dietaryRestrictions?: string[];
  fitnessLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active";
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: any | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  updateUserProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Convert database profile to app user format
function profileToUser(profile: UserProfile): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    subscriptionType: profile.subscription_type,
    subscriptionStatus: profile.subscription_status,
    subscriptionEnd: profile.subscription_end,
    role: profile.role,
    profilePhoto: profile.profile_photo,
    dietaryRestrictions: profile.dietary_restrictions,
    fitnessLevel: profile.fitness_level,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string, authUser: SupabaseUser) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // Profile doesn't exist, create one
      const newProfile: Omit<UserProfile, "id"> & { id: string } = {
        id: userId,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
        email: authUser.email || "",
        subscription_type: "free",
        subscription_status: null,
        subscription_end: null,
        role: "user",
        profile_photo: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || undefined,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        return null;
      }

      return profileToUser(createdProfile);
    }

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return profileToUser(profile);
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession?.user) {
        setSession(initialSession);
        setSupabaseUser(initialSession.user);
        const userProfile = await fetchUserProfile(initialSession.user.id, initialSession.user);
        setProfile(userProfile);
      }
      
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setSupabaseUser(newSession?.user ?? null);

        if (newSession?.user) {
          const userProfile = await fetchUserProfile(newSession.user.id, newSession.user);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/auth/callback`
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000/auth/callback";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const redirectUrl = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000/auth/callback";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
    setProfile(null);
    setSupabaseUser(null);
    setSession(null);
  };

  const updateUserProfile = async (profileData: any) => {
    if (!supabaseUser) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", supabaseUser.id);

    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }

    // Refetch profile
    const updatedProfile = await fetchUserProfile(supabaseUser.id, supabaseUser);
    setProfile(updatedProfile);
  };

  const getIdToken = async () => {
    if (!session) return null;
    return session.access_token;
  };

  return (
    <AuthContext.Provider
      value={{
        user: supabaseUser,
        profile,
        supabaseUser,
        session,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        login: signInWithGoogle,
        logout,
        loading,
        getIdToken,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
