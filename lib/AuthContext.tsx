"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser 
} from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { app, db } from "./firebase";

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
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  login: () => Promise<void>; // Alias for signInWithGoogle
  logout: () => Promise<void>;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const userDocRef = doc(db, "users", fUser.uid);
        
        // Check if user document exists, if not create it
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          const newUser: Omit<User, 'id'> = {
            name: fUser.displayName || "User",
            email: fUser.email || "",
            subscriptionType: "free",
            subscriptionStatus: null,
            subscriptionEnd: null,
            role: "user",
            profilePhoto: fUser.photoURL || undefined
          };
          await setDoc(userDocRef, newUser);
        }

        // Listen to user profile in Firestore
        const unsubProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUser({ id: snap.id, ...snap.data() } as User);
          }
        });
        
        setLoading(false);
        return () => unsubProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fUser = userCredential.user;
      
      // Create profile in Firestore
      const userDocRef = doc(db, "users", fUser.uid);
      const newUser: Omit<User, 'id'> = {
        name,
        email,
        subscriptionType: "free",
        subscriptionStatus: null,
        subscriptionEnd: null,
        role: "user"
      };
      await setDoc(userDocRef, newUser);
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      signInWithGoogle, 
      signUpWithEmail,
      signInWithEmail,
      login: signInWithGoogle, 
      logout, 
      loading,
      getIdToken
    }}>
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
