"use client";

import React from "react";
import { useAuth } from "../lib/AuthContext";
import { Sparkles, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

interface PremiumGuardProps {
  children: React.ReactNode;
  featureName: string;
}

export function PremiumGuard({ children, featureName }: PremiumGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPremium = user?.subscriptionType === "premium" && user?.subscriptionStatus === "active";

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative p-12 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] overflow-hidden text-center"
      >
        <div className="absolute top-0 right-0 p-8">
          <Sparkles className="w-12 h-12 text-emerald-500/10" />
        </div>

        <div className="relative z-10 max-w-md mx-auto">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-emerald-500" />
          </div>
          
          <h3 className="text-2xl font-bold mb-4">Unlock {featureName}</h3>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            This is a premium feature. Upgrade to Premium Nutrition Pro for just ₹15/month to unlock advanced analytics, AI planning, and more.
          </p>

          <Link
            href="/premium"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-2xl transition-all group"
          >
            <span>Upgrade to Premium</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
