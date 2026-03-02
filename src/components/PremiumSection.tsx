import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Check, AlertCircle, Loader2, Sparkles, History, Calendar, CreditCard } from 'lucide-react';
import { useSession } from '../contexts/AuthContext';

interface PaymentRecord {
  id: string;
  order_id: string;
  payment_id: string;
  amount: number;
  status: string;
  timestamp: string;
}

interface UserStatus {
  email: string;
  isPremium: boolean;
  freeUsageCount: number;
  freeUsageResetDate: string;
}

interface PremiumSectionProps {
  onStatusUpdate: (status: UserStatus) => void;
  currentStatus: UserStatus | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({ onStatusUpdate, currentStatus }) => {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/payment-history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!orderRes.ok) {
        const errData = await orderRes.json();
        throw new Error(errData.error || "Failed to create payment order");
      }

      const { order_id } = await orderRes.json();

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded. Please check your internet connection.");
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
      
      if (razorpayKey === 'rzp_test_placeholder') {
        setError("Razorpay Key ID is not configured. Please set VITE_RAZORPAY_KEY_ID in your environment variables.");
        setLoading(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: 1500,
        currency: "INR",
        name: "AI Nutrition Pro",
        description: "Monthly Premium Subscription",
        order_id: order_id,
        handler: async (response: any) => {
          setLoading(true);
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            
            if (!verifyRes.ok) {
              throw new Error("Payment verification failed on server");
            }

            const data = await verifyRes.json();
            if (data.success) {
              // Refresh status
              const statusRes = await fetch('/api/user-status');
              const newStatus = await statusRes.json();
              onStatusUpdate(newStatus);
            } else {
              throw new Error(data.message || "Verification failed");
            }
          } catch (err: any) {
            setError(err.message || "Payment verification failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          email: user.email,
          name: user.name,
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

  if (!currentStatus || !user) return null;

  if (currentStatus.isPremium) {
    return (
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-full">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900">You are now Premium 🎉</h3>
              <p className="text-emerald-700 text-sm">Enjoy unlimited nutrition insights and advanced clinical reports.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all text-sm font-bold"
          >
            <History className="w-4 h-4" />
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </motion.div>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Subscription History
                </h4>
                
                {loadingHistory ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${record.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {new Date(record.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] text-slate-500">Order: {record.order_id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900">₹{record.amount / 100}</div>
                          <div className={`text-[9px] font-bold uppercase tracking-wider ${record.status === 'SUCCESS' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {record.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    No payment history found.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="premium-section">
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

          <div className="mt-8 pt-6 border-t border-zinc-700/50 flex justify-between items-center">
            <p className="text-zinc-500 text-xs">Secure payments powered by Razorpay</p>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <History className="w-3 h-3" />
              {showHistory ? 'Hide Payment History' : 'View Payment History'}
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" /> Subscription History
              </h4>
              
              {loadingHistory ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${record.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {new Date(record.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-slate-500">Order: {record.order_id}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">₹{record.amount / 100}</div>
                        <div className={`text-[9px] font-bold uppercase tracking-wider ${record.status === 'SUCCESS' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {record.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No payment history found.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentStatus.freeUsageCount >= 2 && (
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
