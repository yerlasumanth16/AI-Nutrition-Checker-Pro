import React from 'react';
import { useSession } from '../contexts/AuthContext';
import { LogIn, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginPage() {
  const { signIn } = useSession();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-emerald-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-slate-500 mb-8">Sign in to access your personalized nutrition intelligence and track your health journey.</p>
        
        <div className="space-y-4 mb-8 text-left">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Secure Access</div>
              <div className="text-xs text-slate-500">Your data is encrypted and private.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Personalized Insights</div>
              <div className="text-xs text-slate-500">Get tailored recommendations based on your profile.</div>
            </div>
          </div>
        </div>

        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
        
        <p className="mt-6 text-xs text-slate-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
