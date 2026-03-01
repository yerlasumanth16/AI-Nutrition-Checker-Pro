import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface UserStatus {
  email: string;
  premium: boolean;
  free_usage_count: number;
  last_reset_date: string;
}

interface PremiumSectionProps {
  userEmail: string;
  onStatusUpdate: (status: UserStatus) => void;
  currentStatus: UserStatus | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({ userEmail, onStatusUpdate, currentStatus }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { order_id } = await orderRes.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: 1500,
        currency: "INR",
        name: "AI Nutrition Pro",
        description: "Monthly Premium Subscription",
        order_id: order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                email: userEmail
              }),
            });
            const data = await verifyRes.json();
            if (data.success) {
              // Refresh status
              const statusRes = await fetch(`/api/user-status?email=${encodeURIComponent(userEmail)}`);
              const newStatus = await statusRes.json();
              onStatusUpdate(newStatus);
            }
          } catch (err) {
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#1B5E20",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentStatus) return null;

  if (currentStatus.premium) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4"
      >
        <div className="bg-emerald-500 p-3 rounded-full">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-emerald-900">You are now Premium 🎉</h3>
          <p className="text-emerald-700 text-sm">Enjoy unlimited nutrition insights and advanced clinical reports.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Crown className="w-24 h-24" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-semibold uppercase tracking-wider text-xs">Premium Access</span>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Unlock Unlimited Nutrition Analysis</h2>
          <p className="text-zinc-400 mb-6 max-w-md">
            Get past the 2-request limit and access deep clinical intelligence, 
            multi-page PDF reports, and personalized health projections.
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">₹15</span>
              <span className="text-zinc-500">/month</span>
            </div>
            
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
              Subscribe Now
            </button>
          </div>
          
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </motion.div>

      {currentStatus.free_usage_count >= 2 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-amber-900 font-medium">
              Oops 🥺 You’ve reached your free limit.
            </p>
            <p className="text-amber-700 text-sm">
              Upgrade to Premium for just ₹15/month and enjoy unlimited nutrition insights 💚
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
